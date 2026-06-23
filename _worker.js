// ── Cloudflare Workers + Assets ─────────────────────────────────
// SPA routing handler for the KavachIQ React dashboard at /app/*
// This is the Worker entry point (main = "_worker.js" in wrangler.toml).
// It intercepts all requests before they reach the static assets,
// routing SPA paths to /app/index.html for client-side routing.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── API Proxy (optional) ──────────────────────────────────
    // If you deploy a backend, set BACKEND_API_URL in Cloudflare
    // Dashboard → kavach-iq → Settings → Environment Variables.
    // Example: BACKEND_API_URL = https://your-api.com
    if (pathname.startsWith('/api/') && env.BACKEND_API_URL) {
      const apiUrl = env.BACKEND_API_URL + pathname + url.search;
      return fetch(new Request(apiUrl, request));
    }

    // ── SPA Routing ───────────────────────────────────────────
    // For /app/* paths that aren't static assets (js, css, etc.),
    // serve /app/index.html so React Router handles client-side routing.
    if (pathname.startsWith('/app/') || pathname === '/app') {
      const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|map|json|webp)$/i.test(pathname);
      if (!isStaticAsset) {
        const spaUrl = new URL('/app/index.html', url.origin);
        return env.ASSETS.fetch(new Request(spaUrl, request));
      }
    }

    // ── Default: serve static assets normally ─────────────────
    return env.ASSETS.fetch(request);
  }
};
