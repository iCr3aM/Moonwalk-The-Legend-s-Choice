const fs = require('fs');
const files = ['js/events.js', 'js/engine.js'];
const re = /T\(\s*'event\.([^']+)'\s*,\s*null\s*,\s*(['"])([\s\S]*?)\2\s*\)/g;
const out = {};
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(src))) {
    const key = 'event.' + m[1];
    if (!(key in out)) out[key] = m[3];
  }
}
// engine.experienced
const esrc = fs.readFileSync('js/engine.js', 'utf8');
let mm = /T\(\s*'engine\.experienced'\s*,\s*null\s*,\s*(['"])([\s\S]*?)\1\s*\)/.exec(esrc);
if (mm) out['engine.experienced'] = mm[2];

const keys = Object.keys(out).sort();
const lines = keys.map(k => k + '\t' + out[k]);
fs.writeFileSync('extract.log', lines.join('\n') + '\n');
console.log('total=' + keys.length);
// 分类计数
const cat = { title: 0, label: 0, hint: 0, epilogue: 0, text: 0, other: 0 };
for (const k of keys) {
  if (/opt\d+\.label$/.test(k)) cat.label++;
  else if (/opt\d+\.hint$/.test(k)) cat.hint++;
  else if (/opt\d+\.epilogue$/.test(k)) cat.epilogue++;
  else if (/\.text$/.test(k)) cat.text++;
  else if (/\.title$/.test(k)) cat.title++;
  else cat.other++;
}
console.log(JSON.stringify(cat));
