// Minimal local server to run the static files from root and /api/chat using the same Vercel handler
// No external deps. Node >= 18 (fetch global).

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000; // matches user's request
const WEB_DIR = __dirname; // Now serving from root directory

// Load the Vercel-style handler
const chatHandler = require('./api/chat.js').default || require('./api/chat.js');

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveStatic(req, res) {
  let filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath === '') filePath = '/index.html';
  const safePath = path.normalize(filePath).replace(/^\/+/, '/');
  const abs = path.join(WEB_DIR, safePath);

  // Prevent path traversal
  if (!abs.startsWith(WEB_DIR)) {
    return send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
  }

  fs.readFile(abs, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
      }
      return send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Error');
    }
    const ext = path.extname(abs).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    const ct = types[ext] || 'application/octet-stream';
    send(res, 200, { 'Content-Type': ct }, data);
  });
}

function makeRes(res) {
  // Add Express-like helpers used by our handler
  res.status = function (code) { this._status = code; return this; };
  res.json = function (obj) {
    const code = this._status || 200;
    const body = Buffer.from(JSON.stringify(obj));
    this.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    this.end(body);
  };
  return res;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res0) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && (url.pathname === '/api/chat' || url.pathname === '/chat')) {
      // Adapt to the Vercel handler signature (also accept /chat like Vercel rewrite)
      const body = await parseBody(req);
      const reqShim = { method: req.method, body };
      const resShim = makeRes(res0);
      return chatHandler(reqShim, resShim);
    }

    if (req.method === 'GET') {
      return serveStatic(req, res0);
    }

    send(res0, 405, { 'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET,POST' }, 'Method Not Allowed');
  } catch (e) {
    send(res0, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Local server running at http://127.0.0.1:${PORT}/`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[WARN] OPENAI_API_KEY not set. Chat calls will fail. Set it before testing.');
  }
});

