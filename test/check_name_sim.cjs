// 名称相似度遍历（基于已加载的 MJ.EVENTS，规避 CRLF/源码解析问题）
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

var sample = { attributes: {}, meta: {}, flags: {} };
var EVENTS = MJ.EVENTS;
var items = Object.keys(EVENTS).map(function (k) {
  var ev = EVENTS[k];
  var loc = MJ.localizeEvent(ev, sample);
  return { key: k, year: ev.year, title: loc.title || '', variant: !!ev.variant, kind: ev.kind };
}).filter(function (it) { return it.title; });

console.log('已加载事件总数:', Object.keys(EVENTS).length, '| 含标题:', items.length);

function norm(t) {
  return (t || '').replace(/[《》「」『』()（）·•\-—\s]/g, '').trim();
}
function bigrams(s) { var set = {}; for (var i = 0; i < s.length - 1; i++) set[s.substr(i, 2)] = true; return set; }
function dice(a, b) {
  if (!a || !b) return 0;
  var A = bigrams(a), B = bigrams(b), inter = 0, ka = Object.keys(A);
  ka.forEach(function (k) { if (B[k]) inter++; });
  return (2 * inter) / (ka.length + Object.keys(B).length);
}

// —— 1. 关键词聚类（主题聚合，定位"名称类似"的群组）——
var KW = ['格莱美', '巡演', '专辑', '争议', '纪录', '告别', '续章', '慈善', '婚礼', '皮肤', '手术', '商标', '版权', '发布会', '巅峰', '离婚', '孩子', '儿子', '女儿', '演唱会', '传记', '自传', '专辑', 'MV', '舞'];
console.log('\n===== 关键词聚类（同名主题事件群） =====');
KW.forEach(function (kw) {
  var hit = items.filter(function (it) { return it.title.indexOf(kw) >= 0; });
  if (hit.length) console.log('· ' + kw + ' (' + hit.length + '): ' + hit.map(function (it) { return it.key + '《' + it.year + '·' + it.title + (it.variant ? '·变体' : '') + '》'; }).join('  '));
});

// —— 2. 相似名称对（Dice >= 0.3 或包含关系）——
console.log('\n===== 相似名称对（字符 bigram Dice，降序） =====');
var pairs = [];
for (var i = 0; i < items.length; i++) {
  for (var j = i + 1; j < items.length; j++) {
    var d = dice(items[i].n = norm(items[i].title), items[j].n = norm(items[j].title));
    var contain = (items[i].n.length >= 3 && items[j].n.indexOf(items[i].n) >= 0) || (items[j].n.length >= 3 && items[i].n.indexOf(items[j].n) >= 0);
    if (d >= 0.3 || contain) pairs.push({ a: items[i], b: items[j], d: d, contain: contain });
  }
}
pairs.sort(function (x, y) { return y.d - x.d; });
pairs.forEach(function (p) {
  console.log((p.d >= 0.6 ? '【强】' : p.d >= 0.45 ? '【中】' : '【弱】') + ' ' + p.d.toFixed(2) +
    (p.contain ? ' [包含]' : '') + '  ' +
    p.a.key + '《' + p.a.year + '·' + p.a.title + '》  ~  ' + p.b.key + '《' + p.b.year + '·' + p.b.title + '》');
});
console.log('\n相似对总数: ' + pairs.length + '（阈值 0.3 / 含包含关系）');
console.log('检查结束。');
