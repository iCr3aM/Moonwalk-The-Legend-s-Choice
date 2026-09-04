// 自动翻译缺失的 hint（公式化的「属性 ±数值」），追加到 i18n_events_en.js。
// 仅处理能被属性映射完全覆盖的 hint；含未知属性名的留作人工。
global.window = global;
['../js/config.js', '../js/state.js', '../js/i18n.js', '../js/i18n_events_en.js', '../js/engine.js', '../js/events.js'].forEach(function (m) { require(m); });
var fs = require('fs');
var MJ = global.MJ;
var en = MJ.i18n.dict.eventEn || {};
var STAT = { '健康':'Health','声誉':'Reputation','财富':'Wealth','家庭':'Family','艺术':'Art','压力':'Stress','慈善':'Philanthropy','媒体':'Media','孤独':'Loneliness','名望':'Fame','商业':'Business','爱情':'Love','信任':'Trust' };
var re = /([一-鿿]+?)\s*([+\-−－])\s*(\d+)/g;

function autoHint(zh) {
  if (typeof zh !== 'string' || !/[一-鿿]/.test(zh)) return null;
  // 归一全角标点，避免「（」挡住首个属性名与符号的衔接
  var s = zh.replace(/[（）；;，、]/g, ' ');
  var m, parts = [], unmatched = false;
  re.lastIndex = 0;
  while ((m = re.exec(s))) {
    var nm = STAT[m[1]];
    if (!nm) { unmatched = true; break; }
    var sign = (m[2] === '-' || m[2] === '−' || m[2] === '－') ? '-' : '+';
    parts.push(nm + ' ' + sign + m[3]);
  }
  if (unmatched || parts.length === 0) return null;
  return '(' + parts.join(', ') + ')';
}

var adds = [];
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id];
  if (!Array.isArray(ev.options)) return;
  ev.options.forEach(function (o, j) {
    var k = 'event.' + id + '.opt' + j + '.hint';
    if (en[k]) return;
    var tr = autoHint(o.hint);
    if (tr) adds.push('  "' + k + '": ' + JSON.stringify(tr) + ',');
  });
});

var p = require('path').join(__dirname, '..', 'js', 'i18n_events_en.js');
var s = fs.readFileSync(p, 'utf8');
var idx = s.lastIndexOf('};');
if (idx < 0) { console.error('未找到结尾 };'); process.exit(1); }
var block = '\n  // —— 自动翻译的 hint（属性±数值，公式化生成） ——\n' + adds.join('\n') + '\n';
var out = s.slice(0, idx) + block + s.slice(idx);
fs.writeFileSync(p, out, 'utf8');
console.log('已自动追加 hint 条目:', adds.length);
