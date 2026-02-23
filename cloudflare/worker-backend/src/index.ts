/**
 * Cryptoniumpay — Lightweight Cloudflare Workers Backend
 *
 * Standalone backend that runs entirely on Cloudflare's edge network.
 * Uses D1 (SQLite) for persistence, KV for sessions/cache.
 *
 * Core endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/signup
 * - POST /api/v1/charges
 * - GET  /api/v1/charges/:id
 * - GET  /api/v1/charges
 * - GET  /api/v1/checkout/:id   (public)
 * - POST /api/v1/api-keys
 * - GET  /api/v1/api-keys
 * - DELETE /api/v1/api-keys/:id
 * - POST /api/v1/webhooks
 * - GET  /api/v1/webhooks
 * - DELETE /api/v1/webhooks/:id
 * - GET  /api/v1/health
 */

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  SIGNER_SECRET: string;
  WEBHOOK_HMAC_SECRET: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_RPM?: string;
}

// ── Utilities ──────────────────────────────────────────────────────────

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(password + 'cryptoniumpay-salt'));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createJWT(payload: Record<string, unknown>, secret: string, expiresIn = 86400): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const now = Math.floor(Date.now() / 1000);
  const body = btoa(JSON.stringify({ ...payload, iat: now, exp: now + expiresIn })).replace(/=/g, '');
  const signature = await hmacSign(secret, `${header}.${body}`);
  return `${header}.${body}.${btoa(signature).replace(/=/g, '')}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = await hmacSign(secret, `${header}.${body}`);
    const expectedB64 = btoa(expectedSig).replace(/=/g, '');
    if (sig !== expectedB64) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function uuid(): string {
  return crypto.randomUUID();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message, status } }, status);
}

// ── Rate Limiter (KV-based) ───────────────────────────────────────────

async function checkRateLimit(kv: KVNamespace, ip: string, maxRpm: number): Promise<boolean> {
  const key = `rl:${ip}:${Math.floor(Date.now() / 60000)}`;
  const count = parseInt(await kv.get(key) || '0', 10);
  if (count >= maxRpm) return false;
  await kv.put(key, String(count + 1), { expirationTtl: 120 });
  return true;
}

// ── Auth Middleware ───────────────────────────────────────────────────

async function authenticate(request: Request, env: Env): Promise<Record<string, unknown> | null> {
  // Try JWT Bearer
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyJWT(authHeader.slice(7), env.JWT_SECRET);
  }

  // Try API Key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    const hashedKey = await hashPassword(apiKey);
    const row = await env.DB.prepare('SELECT merchant_id, scopes FROM api_keys WHERE key_hash = ? AND revoked = 0')
      .bind(hashedKey).first<{ merchant_id: string; scopes: string }>();
    if (row) {
      await env.DB.prepare('UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?')
        .bind(new Date().toISOString(), hashedKey).run();
      return { sub: row.merchant_id, role: 'merchant', scopes: row.scopes.split(',') };
    }
  }

  return null;
}

// ── Router ────────────────────────────────────────────────────────────

type Handler = (req: Request, env: Env, params: Record<string, string>, user?: Record<string, unknown>) => Promise<Response>;

interface Route { method: string; pattern: RegExp; paramNames: string[]; handler: Handler; auth: boolean; }

function route(method: string, path: string, handler: Handler, auth = true): Route {
  const paramNames: string[] = [];
  const pattern = new RegExp('^' + path.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  }) + '$');
  return { method, pattern, paramNames, handler, auth };
}

// ── Handlers ──────────────────────────────────────────────────────────

const healthHandler: Handler = async () => json({ status: 'ok', mode: 'cloudflare-workers', timestamp: new Date().toISOString() });

const signupHandler: Handler = async (req, env) => {
  const body = await req.json() as Record<string, string>;
  if (!body.email || !body.password || !body.name) return err('VALIDATION', 'Missing fields', 400);

  const existing = await env.DB.prepare('SELECT id FROM merchants WHERE email = ?').bind(body.email).first();
  if (existing) return err('CONFLICT', 'Email already registered', 409);

  const id = uuid();
  const passwordHash = await hashPassword(body.password);
  await env.DB.prepare('INSERT INTO merchants (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, body.name, body.email, passwordHash, 'merchant', new Date().toISOString()).run();

  const token = await createJWT({ sub: id, email: body.email, role: 'merchant' }, env.JWT_SECRET);
  return json({ token, user: { id, email: body.email, name: body.name, role: 'merchant' } }, 201);
};

const loginHandler: Handler = async (req, env) => {
  const body = await req.json() as Record<string, string>;
  if (!body.email || !body.password) return err('VALIDATION', 'Missing credentials', 400);

  const passwordHash = await hashPassword(body.password);
  const user = await env.DB.prepare('SELECT id, name, email, role FROM merchants WHERE email = ? AND password_hash = ?')
    .bind(body.email, passwordHash).first<{ id: string; name: string; email: string; role: string }>();

  if (!user) return err('UNAUTHORIZED', 'Invalid credentials', 401);

  const token = await createJWT({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET);
  return json({ token, user });
};

const createChargeHandler: Handler = async (req, env, _params, user) => {
  const body = await req.json() as Record<string, unknown>;
  if (!body.name) return err('VALIDATION', 'Name is required', 400);

  // Idempotency check
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (idempotencyKey) {
    const existing = await env.DB.prepare('SELECT response_body FROM idempotency_keys WHERE key = ? AND merchant_id = ?')
      .bind(idempotencyKey, user!.sub).first<{ response_body: string }>();
    if (existing) return new Response(existing.response_body, { status: 201, headers: { 'Content-Type': 'application/json' } });
  }

  const id = uuid();
  const now = new Date().toISOString();
  const expiresIn = (body.expires_in_minutes as number) || 60;
  const expiresAt = new Date(Date.now() + expiresIn * 60000).toISOString();
  const hostedUrl = `/pay/${id}`;
  const localAmount = (body.local_price as Record<string, string>)?.amount || null;
  const localCurrency = (body.local_price as Record<string, string>)?.currency || null;

  await env.DB.prepare(`INSERT INTO charges (id, merchant_id, name, description, pricing_type, local_amount, local_currency, 
    status, hosted_url, redirect_url, cancel_url, metadata, expires_at, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?, ?, ?)`)
    .bind(id, user!.sub, body.name, body.description || null, body.pricing_type || 'fixed_price',
      localAmount, localCurrency, hostedUrl,
      (body.redirect_url as string) || null, (body.cancel_url as string) || null,
      body.metadata ? JSON.stringify(body.metadata) : null, expiresAt, now).run();

  const charge = {
    id, name: body.name, description: body.description || null,
    pricing_type: body.pricing_type || 'fixed_price', status: 'NEW',
    local_price: localAmount ? { amount: localAmount, currency: localCurrency } : null,
    hosted_url: hostedUrl, redirect_url: body.redirect_url || null, cancel_url: body.cancel_url || null,
    metadata: body.metadata || null, expires_at: expiresAt, created_at: now,
  };

  // Store idempotency response
  if (idempotencyKey) {
    await env.DB.prepare('INSERT INTO idempotency_keys (key, merchant_id, response_body, expires_at) VALUES (?, ?, ?, ?)')
      .bind(idempotencyKey, user!.sub, JSON.stringify(charge), new Date(Date.now() + 86400000).toISOString()).run();
  }

  return json(charge, 201);
};

const getChargeHandler: Handler = async (_req, env, params, user) => {
  const charge = await env.DB.prepare('SELECT * FROM charges WHERE id = ? AND merchant_id = ?')
    .bind(params.id, user!.sub).first();
  if (!charge) return err('NOT_FOUND', 'Charge not found', 404);
  return json(formatCharge(charge));
};

const listChargesHandler: Handler = async (req, env, _params, user) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '25', 10), 100);
  const status = url.searchParams.get('status');

  let query = 'SELECT * FROM charges WHERE merchant_id = ?';
  const bindings: unknown[] = [user!.sub];

  if (status) { query += ' AND status = ?'; bindings.push(status); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  bindings.push(perPage, (page - 1) * perPage);

  const { results } = await env.DB.prepare(query).bind(...bindings).all();
  const countRow = await env.DB.prepare('SELECT COUNT(*) as total FROM charges WHERE merchant_id = ?')
    .bind(user!.sub).first<{ total: number }>();

  return json({
    data: (results || []).map(formatCharge),
    total: countRow?.total || 0, page, per_page: perPage,
    total_pages: Math.ceil((countRow?.total || 0) / perPage),
  });
};

const checkoutHandler: Handler = async (_req, env, params) => {
  const charge = await env.DB.prepare('SELECT * FROM charges WHERE id = ?').bind(params.id).first();
  if (!charge) return err('NOT_FOUND', 'Charge not found', 404);
  return json(formatCharge(charge));
};

const createApiKeyHandler: Handler = async (req, env, _params, user) => {
  const body = await req.json() as Record<string, unknown>;
  if (!body.name) return err('VALIDATION', 'Name is required', 400);

  const rawKey = `cp_live_${uuid().replace(/-/g, '')}`;
  const keyHash = await hashPassword(rawKey);
  const id = uuid();
  const scopes = (body.scopes as string[]) || ['read'];

  await env.DB.prepare('INSERT INTO api_keys (id, merchant_id, name, key_hash, key_prefix, scopes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, user!.sub, body.name, keyHash, rawKey.slice(0, 12), scopes.join(','), new Date().toISOString()).run();

  return json({ id, name: body.name, key: rawKey, key_prefix: rawKey.slice(0, 12), scopes, created_at: new Date().toISOString() }, 201);
};

const listApiKeysHandler: Handler = async (_req, env, _params, user) => {
  const { results } = await env.DB.prepare('SELECT id, name, key_prefix, scopes, created_at, last_used_at FROM api_keys WHERE merchant_id = ? AND revoked = 0 ORDER BY created_at DESC')
    .bind(user!.sub).all();
  return json((results || []).map((r: Record<string, unknown>) => ({ ...r, scopes: (r.scopes as string).split(',') })));
};

const revokeApiKeyHandler: Handler = async (_req, env, params, user) => {
  await env.DB.prepare('UPDATE api_keys SET revoked = 1 WHERE id = ? AND merchant_id = ?').bind(params.id, user!.sub).run();
  return json({ success: true });
};

const createWebhookHandler: Handler = async (req, env, _params, user) => {
  const body = await req.json() as Record<string, unknown>;
  if (!body.url) return err('VALIDATION', 'URL is required', 400);

  const id = uuid();
  const secret = `whsec_${uuid().replace(/-/g, '')}`;
  const events = (body.events as string[]) || ['charge.confirmed'];

  await env.DB.prepare('INSERT INTO webhooks (id, merchant_id, url, secret, events, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)')
    .bind(id, user!.sub, body.url, secret, events.join(','), new Date().toISOString()).run();

  return json({ id, url: body.url, secret, events, active: true, created_at: new Date().toISOString() }, 201);
};

const listWebhooksHandler: Handler = async (_req, env, _params, user) => {
  const { results } = await env.DB.prepare('SELECT id, url, secret, events, active, created_at FROM webhooks WHERE merchant_id = ? ORDER BY created_at DESC')
    .bind(user!.sub).all();
  return json((results || []).map((r: Record<string, unknown>) => ({ ...r, events: (r.events as string).split(',') })));
};

const deleteWebhookHandler: Handler = async (_req, env, params, user) => {
  await env.DB.prepare('DELETE FROM webhooks WHERE id = ? AND merchant_id = ?').bind(params.id, user!.sub).run();
  return json({ success: true });
};

// ── Helpers ──

function formatCharge(row: Record<string, unknown>) {
  return {
    id: row.id, name: row.name, description: row.description,
    pricing_type: row.pricing_type, status: row.status,
    local_price: row.local_amount ? { amount: row.local_amount, currency: row.local_currency } : null,
    hosted_url: row.hosted_url, redirect_url: row.redirect_url, cancel_url: row.cancel_url,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
    expires_at: row.expires_at, created_at: row.created_at,
  };
}

// ── Route Table ──

const routes: Route[] = [
  route('GET', '/api/v1/health', healthHandler, false),
  route('POST', '/api/v1/auth/signup', signupHandler, false),
  route('POST', '/api/v1/auth/login', loginHandler, false),
  route('GET', '/api/v1/checkout/:id', checkoutHandler, false),
  route('POST', '/api/v1/charges', createChargeHandler),
  route('GET', '/api/v1/charges/:id', getChargeHandler),
  route('GET', '/api/v1/charges', listChargesHandler),
  route('POST', '/api/v1/api-keys', createApiKeyHandler),
  route('GET', '/api/v1/api-keys', listApiKeysHandler),
  route('DELETE', '/api/v1/api-keys/:id', revokeApiKeyHandler),
  route('POST', '/api/v1/webhooks', createWebhookHandler),
  route('GET', '/api/v1/webhooks', listWebhooksHandler),
  route('DELETE', '/api/v1/webhooks/:id', deleteWebhookHandler),
];

// ── Main Handler ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    const corsOrigin = allowedOrigins.length > 0 && !allowedOrigins.includes(origin) ? allowedOrigins[0] : origin;

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Idempotency-Key',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    const maxRpm = parseInt(env.RATE_LIMIT_RPM || '100', 10);
    const allowed = await checkRateLimit(env.KV, ip, maxRpm);
    if (!allowed) {
      return new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } });
    }

    // Match route
    for (const r of routes) {
      if (request.method !== r.method) continue;
      const match = url.pathname.match(r.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      r.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });

      let user: Record<string, unknown> | undefined;
      if (r.auth) {
        const authResult = await authenticate(request, env);
        if (!authResult) {
          const resp = err('UNAUTHORIZED', 'Authentication required', 401);
          const newHeaders = new Headers(resp.headers);
          Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
          return new Response(resp.body, { status: 401, headers: newHeaders });
        }
        user = authResult;
      }

      const response = await r.handler(request, env, params, user);
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Powered-By', 'Cryptoniumpay-Edge');
      return new Response(response.body, { status: response.status, headers: newHeaders });
    }

    const resp = err('NOT_FOUND', 'Endpoint not found', 404);
    const newHeaders = new Headers(resp.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(resp.body, { status: 404, headers: newHeaders });
  },
};