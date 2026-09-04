// 统计 i18n_events_en.js 中仍含中文（未翻译）的值行数，并按字段类型归类。
const fs = require('fs');
const s = fs.readFileSync(__dirname + '/../js/i18n_events_en.js', 'utf8');
const lines = s.split('\n');
let total = 0, zh = 0;
const byField = {};
lines.forEach(function (l) {
  const m = l.match(/^\s*"((?:event|ending|ach|ui|meta|attr|chapter|consequence|relation)[^"]*)"\s*:\s*"(.*)",?\s*$/);
  if (!m) return;
  total++;
  const key = m[1];
  const val = m[2];
  if (/[一-鿿]/.test(val)) {
    zh++;
    const f = key.split('.').slice(-1)[0];
    byField[f] = (byField[f] || 0) + 1;
  }
});
console.log('总键数:', total);
console.log('仍含中文的值行数:', zh);
console.log('按字段:', JSON.stringify(byField, null, 0));
