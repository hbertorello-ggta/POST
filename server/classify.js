// Clasificacion de hosts por reglas de tags. Funciones puras (sin DB ni Zabbix).
const norm = (s) => String(s ?? '').trim().toLowerCase();

export function matchesCondition(tags, cond) {
  const name = norm(cond.tag);
  const wanted = norm(cond.value);
  return tags.some((t) => norm(t.tag) === name && (wanted === '' || norm(t.value) === wanted));
}

// Una regla es una lista de condiciones: todas deben cumplirse (AND).
export const matchesRule = (tags, rule) => rule.length > 0 && rule.every((c) => matchesCondition(tags, c));

// Devuelve el codigo de la categoria de mayor prioridad que el host cumple, o null.
export function classify(tags, categories) {
  let best = null;
  for (const cat of categories) {
    if (cat.active === false) continue;
    if (!cat.rules.some((rule) => matchesRule(tags, rule))) continue;
    if (!best || cat.priority > best.priority) best = cat;
  }
  return best ? best.code : null;
}

// Valida la forma de "rules" recibida desde la API.
export function validateRules(rules) {
  if (!Array.isArray(rules)) return 'rules debe ser una lista';
  for (const rule of rules) {
    if (!Array.isArray(rule) || rule.length === 0) return 'cada regla debe ser una lista no vacia de condiciones';
    for (const c of rule) {
      if (!c || typeof c.tag !== 'string' || !c.tag.trim()) return 'cada condicion necesita "tag"';
      if (c.value !== undefined && typeof c.value !== 'string') return '"value" debe ser texto';
    }
  }
  return null;
}
