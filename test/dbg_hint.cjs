global.window = global;
['../js/config.js', '../js/state.js', '../js/i18n.js', '../js/i18n_events_en.js', '../js/engine.js', '../js/events.js'].forEach(function (m) { require(m); });
var MJ = global.MJ;
var en = MJ.i18n.dict.eventEn || {};
var STAT = { '健康':'Health','声誉':'Reputation','财富':'Wealth','家庭':'Family','艺术':'Art','压力':'Stress','慈善':'Philanthropy','媒体':'Media','孤独':'Loneliness' };
var re = /([一-鿿]+?)\s*([+\-−－])\s*(\d+)/g;
function autoHint(zh) {
  if (typeof zh !== 'string' || !/[一-鿿]/.test(zh)) return null;
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
var n = 0;
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id];
  if (!Array.isArray(ev.options)) return;
  ev.options.forEach(function (o, j) {
    var k = 'event.' + id + '.opt' + j + '.hint';
    if (en[k]) return;
    var zh = o.hint;
    if (typeof zh !== 'string' || !/[一-鿿]/.test(zh)) return;
    var tr = autoHint(zh);
    if (tr) n++;
    if (n <= 8) console.log((tr ? 'OK ' : 'NO ') + k + '  =>  ' + JSON.stringify(tr) + '  | zh=' + zh);
  });
});
console.log('可自动翻译的缺失 hint 数:', n);
