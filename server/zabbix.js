import http from 'node:http';
import https from 'node:https';

// Solo metodos de lectura. El navegador nunca habla con Zabbix ni elige metodos.
const ALLOWED = new Set([
  'apiinfo.version', 'host.get', 'item.get', 'trigger.get',
  'problem.get', 'history.get', 'hostgroup.get',
]);

export class ZabbixError extends Error {
  constructor(message, code) { super(message); this.name = 'ZabbixError'; this.code = code; }
}

export function createZabbixClient({ url, token, validateCerts, timeoutMs }) {
  const configured = Boolean(url && token);
  const target = url ? new URL(url) : null;
  const secure = target?.protocol === 'https:';
  // La validacion del certificado se omite SOLO en esta conexion, no en todo el proceso.
  const agent = secure ? new https.Agent({ rejectUnauthorized: validateCerts, keepAlive: true }) : undefined;
  let nextId = 0;
  const cache = new Map();

  function rpc(method, params = {}) {
    if (!configured) return Promise.reject(new ZabbixError('Zabbix no configurado (ZABBIX_URL / ZABBIX_TOKEN)'));
    if (!ALLOWED.has(method)) return Promise.reject(new ZabbixError(`Metodo no permitido: ${method}`));
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: ++nextId });
    const headers = { 'Content-Type': 'application/json-rpc', 'Content-Length': Buffer.byteLength(body) };
    // Zabbix exige que apiinfo.version se llame SIN el header Authorization.
    if (method !== 'apiinfo.version') headers.Authorization = `Bearer ${token}`;

    return new Promise((resolve, reject) => {
      const req = (secure ? https : http).request(target, { method: 'POST', headers, agent, timeout: timeoutMs }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) return reject(new ZabbixError(`HTTP ${res.statusCode} desde Zabbix`));
          let json;
          try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
          catch { return reject(new ZabbixError('Respuesta de Zabbix no es JSON')); }
          if (json.error) return reject(new ZabbixError(`${json.error.message}: ${json.error.data ?? ''}`.trim(), json.error.code));
          resolve(json.result);
        });
      });
      req.on('timeout', () => req.destroy(new ZabbixError(`Timeout de Zabbix (${timeoutMs} ms)`)));
      req.on('error', (e) => reject(e instanceof ZabbixError ? e : new ZabbixError(e.message)));
      req.end(body);
    });
  }

  // Cache en memoria: muchos navegadores, una sola consulta a Zabbix por intervalo.
  async function cached(key, ttlMs, fn) {
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    if (hit?.pending) return hit.pending;
    const pending = fn().then((value) => { cache.set(key, { value, expires: Date.now() + ttlMs }); return value; })
      .catch((e) => { cache.delete(key); throw e; });
    cache.set(key, { ...(hit ?? {}), pending, expires: 0 });
    return pending;
  }

  return { configured, rpc, cached };
}
