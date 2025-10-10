// Serverless function para administrar admin-config.json no Vercel
// Observação: em ambiente serverless, não é possível gravar na raiz do projeto em tempo de execução.
// Para permitir edições temporárias, usamos /tmp/admin-config.json como override até reinicialização da função.

const fs = require('fs');
const path = require('path');

const ROOT_FILE = path.join(process.cwd(), 'admin-config.json');
const TMP_FILE = path.join('/tmp', 'admin-config.json');

// Upstash (Vercel KV via REST) - sem dependências
const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
const ADMIN_CFG_KEY = process.env.ADMIN_CFG_K || 'admin_config_v1';

async function kvGet(key){
  if (!KV_URL || !KV_TOKEN) return null;
  try{
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      method: 'GET',
    });
    if(!r.ok) return null;
    const data = await r.json();
    if (data && data.result) {
      try { return JSON.parse(data.result); } catch { return data.result; }
    }
    return null;
  }catch(e){ return null; }
}

async function kvSet(key, val){
  if (!KV_URL || !KV_TOKEN) return false;
  try{
    const payload = typeof val === 'string' ? val : JSON.stringify(val);
    const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type':'application/json' },
      method: 'POST',
      body: payload,
    });
    return r.ok;
  }catch(e){ return false; }
}

async function loadConfig() {
  // Preferir KV quando disponível; fallback para /tmp e arquivo do repo
  const fromKv = await kvGet(ADMIN_CFG_KEY);
  if (fromKv && typeof fromKv === 'object') return fromKv;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const rawTmp = fs.readFileSync(TMP_FILE, 'utf8');
      return JSON.parse(rawTmp || '{}');
    }
  } catch (e) {}
  try {
    const raw = fs.readFileSync(ROOT_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveTmp(cfg) {
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
  const adminKey = process.env.ADMIN_CONFIG_KEY || process.env.ADMIN_KEY || 'changeme';
  const key = getKeyFromReq(req);
  if (!key || key !== adminKey) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'unauthorized' }));
  }

  if (method === 'GET') {
    const cfg = await loadConfig();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: true, config: cfg, source: KV_URL && KV_TOKEN ? 'kv' : (fs.existsSync(TMP_FILE) ? 'tmp' : 'file') }));
  }

  if (method === 'POST') {
    const body = await parseBody(req);
    const cfg = (body && body.config) ? body.config : null;
    if (!cfg || typeof cfg !== 'object') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: 'invalid_config' }));
    }

    // Tenta persistir no KV quando configurado; fallback: /tmp
    let persisted = false;
    if (KV_URL && KV_TOKEN) {
      persisted = await kvSet(ADMIN_CFG_KEY, cfg);
    }
    // Grava no /tmp como hot-cache independente do KV
    saveTmp(cfg);

    if (!persisted && !(KV_URL && KV_TOKEN)) {
      // KV não configurado → avisa read-only persistente, mas mantém /tmp ativo
      res.statusCode = 501;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({
        error: 'read_only',
        message: 'KV não configurado. Salvo apenas no /tmp desta instância (pode se perder). Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN para persistir globalmente.'
      }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({ error: 'method_not_allowed' }));
}

module.exports = handler;
module.exports.default = handler;

