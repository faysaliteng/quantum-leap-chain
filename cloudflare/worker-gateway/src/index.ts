/**
 * Cryptoniumpay — Cloudflare Worker API Gateway
 *
 * Proxies all /api/* requests from Cloudflare to the VPS backend.
 * Adds security headers, CORS, and request logging.
 */

export interface Env {
  BACKEND_ORIGIN: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        },
      });
    }

    const url = new URL(request.url);

    // Only proxy /api/* paths
    if (!url.pathname.startsWith('/api')) {
      return new Response('Not Found', { status: 404 });
    }

    // Build backend URL
    const backendUrl = `${env.BACKEND_ORIGIN}${url.pathname}${url.search}`;

    // Forward request to VPS backend
    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    // Add forwarding headers
    backendRequest.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
    backendRequest.headers.set('X-Forwarded-Proto', 'https');
    backendRequest.headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP') || '');

    try {
      const response = await fetch(backendRequest);

      // Clone response and add CORS + security headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

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
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }
  },
};
