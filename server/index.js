import Fastify from 'fastify';
import { config } from './config.js';
import { pool, query } from './db.js';
import { migrate } from './migrate.js';
import { createZabbixClient, ZabbixError } from './zabbix.js';
import { classify, matchesCondition, validateRules } from './classify.js';

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });
const zabbix = createZabbixClient(config.zabbix);

// Punto unico para identificar al usuario. Hoy siempre 'default'; en la etapa 2
// aqui se lee el usuario autenticado (SSO / Active Directory).
const getUser = () => 'default';

// Acepta cuerpo vacio con Content-Type JSON (DELETE/PUT desde fetch).
app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  if (!body) return done(null, undefined);
  try { done(null, JSON.parse(body)); } catch (e) { e.statusCode = 400; done(e); }
});

const CODE_RE = /^[A-Z0-9]{2,5}$/;
const bad = (reply, msg) => reply.code(400).send({ error: msg });

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZabbixError) return reply.code(502).send({ error: `Zabbix: ${err.message}` });
  app.log.error(err);
  reply.code(err.statusCode ?? 500).send({ error: err.statusCode ? err.message : 'Error interno' });
});

app.get('/api/health', async () => {
  const out = { ok: true, db: false, zabbix: { configured: zabbix.configured } };
  try { await query('SELECT 1'); out.db = true; } catch (e) { out.ok = false; out.dbError = e.message; }
  if (zabbix.configured) {
    try {
      out.zabbix.version = await zabbix.cached('version', 60_000, () => zabbix.rpc('apiinfo.version'));
      // apiinfo.version no usa token: esta llamada verifica que el token sea valido.
      await zabbix.cached('auth-check', 60_000, () => zabbix.rpc('host.get', { output: ['hostid'], limit: 1 }));
      out.zabbix.authOk = true;
    } catch (e) { out.ok = false; out.zabbix.authOk = false; out.zabbix.error = e.message; }
  }
  return out;
});

// ---- Sitios (tabla editable de codigo -> sitio) ----
app.get('/api/sites', async () =>
  (await query('SELECT code, name, location, active, sort_order FROM sites ORDER BY sort_order, code')).rows);

app.post('/api/sites', async (req, reply) => {
  const { code, name, location = null, active = true, sort_order = 0 } = req.body ?? {};
  const c = String(code ?? '').toUpperCase();
  if (!CODE_RE.test(c)) return bad(reply, 'Codigo invalido (2 a 5 letras/numeros)');
  if (!name?.trim()) return bad(reply, 'El nombre es obligatorio');
  try {
    const { rows } = await query(
      'INSERT INTO sites(code,name,location,active,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [c, name.trim(), location, active, sort_order]);
    return reply.code(201).send(rows[0]);
  } catch (e) {
    if (e.code === '23505') return reply.code(409).send({ error: `El codigo ${c} ya existe` });
    throw e;
  }
});

app.put('/api/sites/:code', async (req, reply) => {
  const { name, location, active, sort_order } = req.body ?? {};
  const { rows } = await query(
    `UPDATE sites SET name = COALESCE($2,name), location = COALESCE($3,location),
       active = COALESCE($4,active), sort_order = COALESCE($5,sort_order), updated_at = now()
     WHERE code = $1 RETURNING *`,
    [req.params.code.toUpperCase(), name, location, active, sort_order]);
  return rows[0] ?? reply.code(404).send({ error: 'Sitio no encontrado' });
});

app.delete('/api/sites/:code', async (req, reply) => {
  const { rowCount } = await query('DELETE FROM sites WHERE code = $1', [req.params.code.toUpperCase()]);
  return rowCount ? reply.code(204).send() : reply.code(404).send({ error: 'Sitio no encontrado' });
});

// ---- Sitios elegidos por el usuario ----
app.get('/api/me/sites', async (req) =>
  (await query(
    `SELECT s.code, s.name, s.location FROM user_sites u JOIN sites s ON s.code = u.site_code
     WHERE u.user_id = $1 AND s.active ORDER BY u.position, s.code`, [getUser(req)])).rows);

app.put('/api/me/sites', async (req, reply) => {
  const codes = req.body?.codes;
  if (!Array.isArray(codes)) return bad(reply, 'Se esperaba { codes: [...] }');
  const user = getUser(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_sites WHERE user_id = $1', [user]);
    for (const [i, c] of codes.entries())
      await client.query('INSERT INTO user_sites(user_id,site_code,position) VALUES ($1,$2,$3)', [user, String(c).toUpperCase(), i]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23503') return bad(reply, 'Algun codigo de sitio no existe');
    throw e;
  } finally { client.release(); }
  return { codes: codes.map((c) => String(c).toUpperCase()) };
});

// ---- Categorias de dispositivo (reglas de tags editables) ----
const CAT_COLS = 'code, label, icon, priority, rules, active, sort_order';
const loadCategories = async () => (await query(`SELECT ${CAT_COLS} FROM device_categories ORDER BY sort_order, code`)).rows;
const CAT_RE = /^[a-z0-9_]{2,30}$/;

app.get('/api/categories', async () => loadCategories());

app.post('/api/categories', async (req, reply) => {
  const { code, label, icon = 'server', priority = 0, rules = [], active = true, sort_order = 0 } = req.body ?? {};
  if (!CAT_RE.test(code ?? '')) return bad(reply, 'Codigo invalido (a-z, 0-9, _; 2 a 30 caracteres)');
  if (!label?.trim()) return bad(reply, 'La etiqueta es obligatoria');
  const err = validateRules(rules);
  if (err) return bad(reply, err);
  try {
    const { rows } = await query(
      `INSERT INTO device_categories(code,label,icon,priority,rules,active,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${CAT_COLS}`,
      [code, label.trim(), icon, priority, JSON.stringify(rules), active, sort_order]);
    return reply.code(201).send(rows[0]);
  } catch (e) {
    if (e.code === '23505') return reply.code(409).send({ error: `La categoria ${code} ya existe` });
    throw e;
  }
});

app.put('/api/categories/:code', async (req, reply) => {
  const { label, icon, priority, rules, active, sort_order } = req.body ?? {};
  if (rules !== undefined) { const err = validateRules(rules); if (err) return bad(reply, err); }
  const { rows } = await query(
    `UPDATE device_categories SET label = COALESCE($2,label), icon = COALESCE($3,icon),
       priority = COALESCE($4,priority), rules = COALESCE($5::jsonb,rules),
       active = COALESCE($6,active), sort_order = COALESCE($7,sort_order)
     WHERE code = $1 RETURNING ${CAT_COLS}`,
    [req.params.code, label, icon, priority, rules === undefined ? null : JSON.stringify(rules), active, sort_order]);
  return rows[0] ?? reply.code(404).send({ error: 'Categoria no encontrada' });
});

app.delete('/api/categories/:code', async (req, reply) => {
  const { rowCount } = await query('DELETE FROM device_categories WHERE code = $1', [req.params.code]);
  return rowCount ? reply.code(204).send() : reply.code(404).send({ error: 'Categoria no encontrada' });
});

// ---- Ajustes por host (categoria manual, criticidad, nombre, ocultar) ----
const HOSTID_RE = /^\d+$/;
const CRITICALITY = new Set(['productive', 'support']);

app.put('/api/hosts/:hostid/config', async (req, reply) => {
  const { hostid } = req.params;
  if (!HOSTID_RE.test(hostid)) return bad(reply, 'hostid invalido');
  const user = getUser(req);
  const body = req.body ?? {};
  const prev = (await query('SELECT display_name, category_code, criticality, hidden FROM host_config WHERE user_id=$1 AND hostid=$2', [user, hostid])).rows[0]
    ?? { display_name: null, category_code: null, criticality: null, hidden: false };
  // Solo se modifican los campos enviados; null = volver al valor automatico.
  const next = {
    display_name: 'display_name' in body ? (body.display_name?.trim() || null) : prev.display_name,
    category_code: 'category_code' in body ? body.category_code : prev.category_code,
    criticality: 'criticality' in body ? body.criticality : prev.criticality,
    hidden: 'hidden' in body ? Boolean(body.hidden) : prev.hidden,
  };
  if (next.criticality !== null && !CRITICALITY.has(next.criticality)) return bad(reply, 'criticality debe ser productive, support o null');
  if (!next.display_name && !next.category_code && !next.criticality && !next.hidden) {
    await query('DELETE FROM host_config WHERE user_id=$1 AND hostid=$2', [user, hostid]); // todo en automatico: no guardar fila
    return { hostid, ...next };
  }
  try {
    await query(
      `INSERT INTO host_config(user_id,hostid,display_name,category_code,criticality,hidden) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id,hostid) DO UPDATE SET display_name=$3, category_code=$4, criticality=$5, hidden=$6, updated_at=now()`,
      [user, hostid, next.display_name, next.category_code, next.criticality, next.hidden]);
  } catch (e) {
    if (e.code === '23503') return bad(reply, 'La categoria no existe');
    throw e;
  }
  return { hostid, ...next };
});

app.delete('/api/hosts/:hostid/config', async (req, reply) => {
  await query('DELETE FROM host_config WHERE user_id=$1 AND hostid=$2', [getUser(req), req.params.hostid]);
  return reply.code(204).send();
});

// ---- Hosts de un sitio: Zabbix (tag sitio) + categorias + ajustes del usuario ----
// Filtros: ?category=switch  ?tag=network (existe) | ?tag=servidor:windows (valor)  ?q=texto
//          ?include_disabled=1  ?include_hidden=1
const flag = (v) => ['1', 'true', 'yes'].includes(String(v).toLowerCase());
const parseTagFilter = (raw) => {
  const i = raw.indexOf(':');
  return i === -1 ? { tag: raw.trim(), value: '' } : { tag: raw.slice(0, i).trim(), value: raw.slice(i + 1).trim() };
};

app.get('/api/sites/:code/hosts', async (req, reply) => {
  const code = req.params.code.toUpperCase();
  const { rowCount } = await query('SELECT 1 FROM sites WHERE code = $1', [code]);
  if (!rowCount) return reply.code(404).send({ error: 'Sitio no encontrado' });

  const q = req.query;
  const raw = await zabbix.cached(`hosts:${code}`, 30_000, () => zabbix.rpc('host.get', {
    output: ['hostid', 'host', 'name', 'status'],
    selectTags: ['tag', 'value'],
    selectInterfaces: ['ip', 'type', 'main'],
    tags: [{ tag: 'sitio', value: code, operator: 1 }], evaltype: 0, sortfield: 'name',
  }));
  const [categories, cfgRows] = await Promise.all([
    loadCategories(),
    query('SELECT hostid, display_name, category_code, criticality, hidden FROM host_config WHERE user_id = $1', [getUser(req)]),
  ]);
  const cfg = new Map(cfgRows.rows.map((r) => [r.hostid, r]));

  let hosts = raw.map((h) => {
    const c = cfg.get(h.hostid);
    const auto = classify(h.tags, categories);
    return {
      hostid: h.hostid,
      host: h.host,
      name: h.name,
      displayName: c?.display_name || h.name,
      ips: [...new Set(h.interfaces.map((i) => i.ip))],
      enabled: h.status === '0',
      tags: h.tags,
      category: c?.category_code ?? auto ?? 'unclassified',
      categorySource: c?.category_code ? 'manual' : auto ? 'rules' : 'none',
      criticality: c?.criticality ?? null,
      hidden: c?.hidden ?? false,
    };
  });

  const conds = [].concat(q.tag ?? []).filter(Boolean).map(parseTagFilter);
  const text = String(q.q ?? '').trim().toLowerCase();
  hosts = hosts.filter((h) =>
    (flag(q.include_disabled) || h.enabled) &&
    (flag(q.include_hidden) || !h.hidden) &&
    conds.every((c) => matchesCondition(h.tags, c)) &&
    (!text || [h.displayName, h.host, ...h.ips].some((v) => v.toLowerCase().includes(text))));

  const summary = {}; // cuantos hosts hay por categoria (antes de filtrar por categoria)
  for (const h of hosts) summary[h.category] = (summary[h.category] ?? 0) + 1;
  if (q.category) hosts = hosts.filter((h) => h.category === q.category);

  return { site: code, count: hosts.length, summary, hosts };
});

const start = async () => {
  try {
    if (config.databaseUrl) await migrate((m) => app.log.info(m));
    else app.log.warn('DATABASE_URL no definido: la API de sitios no funcionara');
    await app.listen({ port: config.port, host: config.host });
  } catch (e) { app.log.error(e); process.exit(1); }
};
start();
