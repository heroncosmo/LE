// Serverless function para administrar admin-config.json no Vercel
// Observação: em ambiente serverless, não é possível gravar na raiz do projeto em tempo de execução.
// Para permitir edições temporárias, usamos /tmp/admin-config.json como override até reinicialização da função.

const fs = require('fs');
const path = require('path');

const ROOT_FILE = path.join(process.cwd(), 'admin-config.json');
const TMP_FILE = path.join('/tmp', 'admin-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (e) {}
  try {
    const raw = fs.readFileSync(ROOT_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(cfg || {}, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

function getKeyFromReq(req) {
  try {
    const url = new URL(req.url, 'http://local');
    return url.searchParams.get('key');
  } catch (e) {
    return undefined;
  }
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

async function handler(req, res) {
  const method = req.method || 'GET';
  const adminKey = process.env.ADMIN_KEY || 'changeme';
  const key = getKeyFromReq(req);
  if (!key || key !== adminKey) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'unauthorized' }));
  }

  if (method === 'GET') {
    const cfg = loadConfig();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: true, config: cfg }));
  }

  if (method === 'POST') {
    const body = await parseBody(req);
    const cfg = body && body.config ? body.config : body;
    const ok = saveConfig(cfg);
    res.statusCode = ok ? 200 : 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(ok ? { ok: true } : { error: 'save_failed' }));
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({ error: 'method_not_allowed' }));
}

module.exports = handler;
module.exports.default = handler;

