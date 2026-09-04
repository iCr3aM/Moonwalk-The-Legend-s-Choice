// 枚举 i18n_events_en.js 中「缺失的英文键」：遍历 events.js 所有事件字段，
// 若 eventEn 无对应 key，则该字段在英文模式下会回退到 events.js 中文（即"中文残留"）。
// 输出：① 控制台汇总（按字段计数）② test/missing_en_report.txt（KEY<TAB>中文原文，按事件顺序）
global.window = global;
['../js/config.js', '../js/state.js', '../js/i18n.js', '../js/i18n_events_en.js', '../js/engine.js', '../js/events.js'].forEach(function (m) { require(m); });
var MJ = global.MJ;
var en = MJ.i18n.dict.eventEn || {};
var FIELDS = ['title', 'text', 'monologue', 'epilogue', 'branch0', 'branch1', 'branch2', 'narr0', 'narr1', 'narr2'];
var out = [];
var byField = {};
function keyFor(id, f, sub) { return sub != null ? ('event.' + id + '.' + f + '.' + sub) : ('event.' + id + '.' + f); }
function push(id, f, sub, zh) {
  if (zh == null || typeof zh !== 'string' || zh === '') return;
  if (/[一-鿿]/.test(zh) === false) return; // 仅关心含中文（英文模式会显示中文）
  var k = keyFor(id, f, sub);
  if (en[k]) return; // 已有英文覆盖
  out.push({ k: k, zh: zh });
  byField[f] = (byField[f] || 0) + 1;
}
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id];
  push(id, 'title', null, ev.title);
  push(id, 'text', null, ev.text);
  push(id, 'monologue', null, ev.monologue);
  push(id, 'epilogue', null, ev.epilogue);
  if (Array.isArray(ev.branch)) ev.branch.forEach(function (b, i) { push(id, 'branch' + i, null, b); });
  if (Array.isArray(ev.narr)) ev.narr.forEach(function (b, i) { push(id, 'narr' + i, null, b); });
  if (Array.isArray(ev.options)) ev.options.forEach(function (o, j) {
    push(id, 'opt' + j, 'label', o.label);
    push(id, 'opt' + j, 'hint', o.hint);
  });
});
// 额外：ending.* / ach.* / ui.* 等不在 events.js，跳过（由各自模块维护）
var fs = require('fs');
var lines = out.map(function (o) { return o.k + '\t' + o.zh.replace(/\t/g, ' ').replace(/\n/g, '\\n'); });
fs.writeFileSync(__dirname + '/missing_en_report.txt', lines.join('\n'), 'utf8');
console.log('缺失英文键总数:', out.length);
console.log('按字段:', JSON.stringify(byField));
console.log('报告已写入 test/missing_en_report.txt');
