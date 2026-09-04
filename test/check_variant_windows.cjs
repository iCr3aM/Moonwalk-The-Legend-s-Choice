// 变体年份窗口审计：同年多变体插入密度 / 同 flag 窗口重叠 检查
// 用法：node test/check_variant_windows.cjs
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
require('../js/config.js'); require('../js/state.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ, EVENTS = MJ.EVENTS;

function flagsOf(ev) {
  var r = [];
  var opts = (typeof ev.options === 'function') ? [] : (ev.options || []);
  opts.forEach(function (o) { if (o.flags) r = r.concat(Object.keys(o.flags)); });
  return r;
}

var variants = Object.keys(EVENTS)
  .filter(function (k) { return EVENTS[k] && EVENTS[k].variant; })
  .map(function (k) {
    var ev = EVENTS[k];
    return { id: ev.id, win: ev.window, weight: ev.weight, flags: flagsOf(ev) };
  });

console.log('变体总数:', variants.length);

// 年份 -> 变体
var byYear = {};
variants.forEach(function (v) {
  if (!v.win) return;
  for (var y = v.win[0]; y <= v.win[1]; y++) { (byYear[y] = byYear[y] || []).push(v.id); }
});
var dense = Object.keys(byYear).filter(function (y) { return byYear[y].length >= 3; }).sort(function (a, b) { return a - b; });
console.log('\n[同年≥3 变体·潜在密集插入年份]', dense.length ? dense.map(function (y) { return y + '(' + byYear[y].join('/') + ')'; }).join('  ') : '无');

// 同 flag 且窗口重叠（可能重复设标）
var flagMap = {};
variants.forEach(function (v) { v.flags.forEach(function (f) { (flagMap[f] = flagMap[f] || []).push(v); }); });
var conflict = [];
Object.keys(flagMap).forEach(function (f) {
  var arr = flagMap[f];
  for (var i = 0; i < arr.length; i++) for (var j = i + 1; j < arr.length; j++) {
    var a = arr[i], b = arr[j];
    if (!a.win || !b.win) continue;
    if (a.win[0] <= b.win[1] && b.win[0] <= a.win[1]) conflict.push(f + ': ' + a.id + '[' + a.win + '] ~ ' + b.id + '[' + b.win + ']');
  }
});
console.log('[同 flag 且窗口重叠·可能重复设标]', conflict.length ? '\n  ' + conflict.join('\n  ') : '无');

// 概览表（按起始年排序）
console.log('\n[变体窗口概览]');
variants.sort(function (a, b) { return (a.win ? a.win[0] : 0) - (b.win ? b.win[0] : 0); }).forEach(function (v) {
  console.log('  ' + v.id + '  window=' + (v.win ? v.win.join('-') : '-') + '  w=' + (v.weight || '-') + '  flags=' + (v.flags.join(',') || '-'));
});
console.log('\n审计结束。');
