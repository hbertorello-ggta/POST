import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, validateRules } from './classify.js';

const cats = [
  { code: 'firewall', priority: 90, rules: [[{ tag: 'network' }, { tag: 'firewall' }]] },
  { code: 'ups', priority: 85, rules: [[{ tag: 'ups' }]] },
  { code: 'switch', priority: 80, rules: [[{ tag: 'network' }, { tag: 'switch' }]] },
  { code: 'esxi', priority: 55, rules: [[{ tag: 'esxi' }]] },
  { code: 'server', priority: 50, rules: [[{ tag: 'servidor' }], [{ tag: 'server' }]] },
  { code: 'ap', priority: 70, rules: [[{ tag: 'network' }, { tag: 'access point' }]] },
  { code: 'printer', priority: 40, rules: [[{ tag: 'impresoras' }]] },
];
const t = (...pairs) => pairs.map(([tag, value = '']) => ({ tag, value }));

test('switch y firewall (network + tag propio)', () => {
  assert.equal(classify(t(['network'], ['sitio', 'CAP'], ['switch']), cats), 'switch');
  assert.equal(classify(t(['network'], ['sitio', 'CAP'], ['firewall']), cats), 'firewall');
});
test('una UPS no necesita el tag network', () => assert.equal(classify(t(['sitio', 'CAP'], ['ups']), cats), 'ups'));
test('impresora con tag duplicado (marca y vacio)', () =>
  assert.equal(classify(t(['sitio', 'CAP'], ['impresoras', 'hp'], ['impresoras']), cats), 'printer'));
test('esxi gana sobre servidor por prioridad (caso MIMAS)', () =>
  assert.equal(classify(t(['servidor', 'vmware'], ['sitio', 'CAP'], ['esxi'], ['servidor', 'windows'], ['aplicacion', 'sql']), cats), 'esxi'));
test('alias "server" (CAP-DISCOVERY)', () => assert.equal(classify(t(['server', 'proxy'], ['sitio', 'CAP']), cats), 'server'));
test('access point: el nombre del tag lleva espacio (caso SUP)', () =>
  assert.equal(classify(t(['network'], ['sitio', 'SUP'], ['access point']), cats), 'ap'));
test('solo network sin tipo -> sin clasificar', () => assert.equal(classify(t(['network'], ['sitio', 'CAP']), cats), null));
test('solo sitio -> sin clasificar', () => assert.equal(classify(t(['sitio', 'CAP']), cats), null));
test('comparacion sin distinguir mayusculas', () => assert.equal(classify(t(['Servidor', 'Windows']), cats), 'server'));
test('categoria inactiva se ignora', () =>
  assert.equal(classify(t(['ups']), [{ code: 'ups', priority: 1, active: false, rules: [[{ tag: 'ups' }]] }]), null));
test('validateRules', () => {
  assert.equal(validateRules([[{ tag: 'a' }]]), null);
  assert.match(validateRules([[]]), /no vacia/);
  assert.match(validateRules('x'), /lista/);
  assert.match(validateRules([[{ value: 'x' }]]), /tag/);
});
