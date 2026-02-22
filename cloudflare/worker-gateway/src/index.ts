/**
 * Cryptoniumpay — Enterprise Cloudflare Worker API Gateway
 *
 * Features:
 * - HMAC edge signature (X-Edge-Signature) for origin auth
 * - Edge rate limiting (per-IP, in-memory sliding window)
 * - Request size limits (10MB default)
 * - CORS handling with origin validation
 * - Streaming support for export downloads
 * - Maintenance mode enforcement at edge
 */

export interface Env {
  BACKEND_ORIGIN: string;
  EDGE_SECRET: string;
  ALLOWED_ORIGINS?: string;       // comma-separated
  MAX_BODY_BYTES?: string;        // default 10485760 (10MB)
  RATE_LIMIT_RPM?: string;        // default 100
  MAINTENANCE_MODE?: string;      // "true" to enable
}

// In-memory rate limit store (resets on worker restart / isolate recycle)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60_000;

function isRateLimited(ip: string, maxRpm: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > maxRpm;
}

async function signRequest(secret: string, method: string, path: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const data = encoder.encode(`${timestamp}.${method}.${path}`);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

    const corsOrigin = allowedOrigins.length > 0 && !allowedOrigins.includes(origin) ? allowedOrigins[0] : origin;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS, 'Access-Control-Allow-Origin': corsOrigin },
      });
    }

    // Only proxy /api/* paths
    if (!url.pathname.startsWith('/api')) {
      return new Response('Not Found', { status: 404 });
    }

    // Maintenance mode at edge
    if (env.MAINTENANCE_MODE === 'true') {
      return new Response(
        JSON.stringify({ error: { code: 'MAINTENANCE_MODE', message: 'Service is under maintenance' } }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin } },
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    const maxRpm = parseInt(env.RATE_LIMIT_RPM || '100', 10);
    if (isRateLimited(clientIp, maxRpm)) {
      return new Response(
        JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60', 'Access-Control-Allow-Origin': corsOrigin } },
      );
    }

    // Request size limit
    const maxBytes = parseInt(env.MAX_BODY_BYTES || '10485760', 10);
    const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
    if (contentLength > maxBytes) {
      return new Response(
        JSON.stringify({ error: { code: 'PAYLOAD_TOO_LARGE', message: `Body exceeds ${maxBytes} bytes` } }),
        { status: 413, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin } },
      );
    }

    // Build backend URL
    const backendUrl = `${env.BACKEND_ORIGIN}${url.pathname}${url.search}`;

    // Forward request to VPS backend
    const headers = new Headers(request.headers);

    // Override Host header to backend origin (prevents Cloudflare Error 1003)
    const backendHost = new URL(env.BACKEND_ORIGIN).host;
    headers.set('Host', backendHost);

    // Add forwarding headers
    headers.set('X-Forwarded-For', clientIp);
    headers.set('X-Forwarded-Proto', 'https');
    headers.set('X-Forwarded-Host', url.host);
    headers.set('X-Real-IP', clientIp);

    // Add HMAC edge signature
    if (env.EDGE_SECRET) {
      const sig = await signRequest(env.EDGE_SECRET, request.method, url.pathname + url.search);
      headers.set('X-Edge-Signature', sig);
    }

    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    try {
      const response = await fetch(backendRequest);

      // Build response with CORS + security headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', corsOrigin);
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        newHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (err) {
      console.error('Backend proxy error:', err);
      return new Response(
        JSON.stringify({ error: { code: 'GATEWAY_ERROR', message: 'Backend unavailable' } }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin } },
      );
    }
  },
};
