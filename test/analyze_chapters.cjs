/* 章节事件密度 + 关系/属性可达性分析（无 DOM） */
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js');
require('../js/state.js');
require('../js/engine.js');
require('../js/events.js');
require('../js/planner.js');

var E = MJ.EVENTS, ch = MJ.config.chapters;
function chapOf(y) {
  if (typeof y !== 'number') return -1;
  for (var i = 0; i < ch.length; i++) if (y >= ch[i].start && y <= ch[i].end) return ch[i].id;
  return -1;
}
var counts = {};
ch.forEach(function (c) { counts[c.id] = { main: 0, variant: 0, years: {} }; });
var noYear = [];
for (var id in E) {
  if (!E.hasOwnProperty(id)) continue;
  var ev = E[id];
  var y = ev.year;
  if (y == null && ev.window) y = (ev.window[0] + ev.window[1]) / 2 | 0;
  var cid = chapOf(y);
  if (cid < 0) { noYear.push(id); continue; }
  var bucket = ev.variant ? 'variant' : 'main';
  counts[cid][bucket]++;
  counts[cid].years[y] = (counts[cid].years[y] || 0) + 1;
}
console.log('=== 各章节事件密度 ===');
ch.forEach(function (c) {
  var d = counts[c.id];
  var yr = Object.keys(d.years).map(Number).sort(function (a, b) { return a - b; });
  console.log('Ch' + c.id + ' [' + c.start + '-' + c.end + '] ' + c.title + '\n  主线=' + d.main + ' 变体=' + d.variant + ' 合计=' + (d.main + d.variant) + '  年份覆盖=' + (yr.length ? yr[0] + '~' + yr[yr.length - 1] + '(' + yr.length + '年)' : '—'));
});
if (noYear.length) console.log('无年份事件:', noYear.join(', '));

// 关系/属性可达性核查
console.log('\n=== 关系/属性改动扫描 ===');
var inc = { brothers: 0, lonAttr: 0, lonFlag: 0 };
for (var id2 in E) {
  if (!E.hasOwnProperty(id2)) continue;
  var ev2 = E[id2];
  [ev2].concat(ev2.opts || []).forEach(function (o) {
    if (!o) return;
    if (o.effects && o.effects.rel && o.effects.rel.brothers) inc.brothers++;
    if (o.effects && 'loneliness' in o.effects) inc.lonAttr++;
    if (o.flags && 'loneliness' in o.flags) inc.lonFlag++;
  });
}
console.log('改动 relations.brothers 的选项数:', inc.brothers);
console.log('effects 里带 loneliness 的选项数:', inc.lonAttr, ' flags 里带 loneliness 的选项数:', inc.lonFlag);
console.log('ACH_BROTHERLY 需要 brothers>=20；ACH_LONELY_KING 检查的是 s.flags.loneliness(应为 attributes)');
