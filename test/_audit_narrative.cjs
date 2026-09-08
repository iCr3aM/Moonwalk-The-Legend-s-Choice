// 剧情文案审计（真实引擎驱动）：独白完整性 + 尾声可达 + 舆论链 5000 局无死循环 + 联动结局可达
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
global.MJ = global.MJ || {};
var MJ = global.MJ;
MJ.t = function (k, v, fb) { return fb != null ? fb : k; };
require('../js/config.js');
require('../js/state.js');
require('../js/events.js');
require('../js/planner.js');
require('../js/engine.js');
MJ.localizeEvent = function (ev, state) {
  var st = state || (MJ.engine && MJ.engine.state) || {};
  var copy = Object.assign({}, ev);
  if (typeof copy.options === 'function') copy.options = copy.options(st);
  if (typeof copy.text === 'function') copy.text = copy.text(st);
  return copy;
};
MJ.ui = {
  showEvent: function () {},
  showEraCard: function (c, s, cb) { cb(); },
  showEnding: function () {},
  toastEgg: function () {},
  toastTrivia: function () {},
  showModal: function () {}
};
var resolvedEndingId = null;
MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function epilogueTailFor(state, endingId) {
  var tpl = (MJ.config && MJ.config.epilogueTailTemplates) || [];
  var e = MJ.config.endings[endingId] || {};
  var tone = e.tone || '';
  for (var i = 0; i < tpl.length; i++) {
    var t = tpl[i];
    if (t.tone && t.tone !== tone) continue;
    if (t.toneIn && t.toneIn.indexOf(tone) < 0) continue;
    if (t.cond && !t.cond(state, endingId)) continue;
    return t.text;
  }
  return '';
}
function runPlaythrough(seed) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = Math.floor(rng() * opts.length) % opts.length;
    MJ.engine.choose(idx);
  }
  if (guard >= 4000 && !resolvedEndingId) {
    console.log('FAIL 舆论链疑似死循环：seed=' + seed);
    process.exit(1);
  }
  return { ending: resolvedEndingId, state: MJ.engine.state, steps: guard };
}
// 1) 独白完整性
var endings = MJ.config.endings;
var missingMono = [];
Object.keys(endings).forEach(function (id) {
  if (!endings[id].monologue || !String(endings[id].monologue).trim()) missingMono.push(id);
});
if (missingMono.length) { console.log('FAIL 结局缺独白: ' + missingMono.join(',')); process.exit(1); }
// 2) 尾声可达（generic 兜底，每个结局至少命中一条模板）
var noTail = [];
Object.keys(endings).forEach(function (id) {
  if (!epilogueTailFor({ attributes: {}, meta: {}, flags: {}, netWorth: 0 }, id)) noTail.push(id);
});
if (noTail.length) { console.log('FAIL 结局无可达尾声: ' + noTail.join(',')); process.exit(1); }
// 3+4) 5000 局：无死循环 + 舆论链运转 + 联动结局可达
var N = 5000, controversial = 0, rumorStarted = 0, rumorReversed = 0, maxSteps = 0;
for (var s = 1; s <= N; s++) {
  var r = runPlaythrough(s * 2654435761);
  if (!r.ending) { console.log('FAIL 未到达结局 seed=' + s); process.exit(1); }
  if (r.ending === 'END_CONTROVERSIAL') controversial++;
  if (r.state.flags && r.state.flags.rumorStarted) rumorStarted++;
  if (r.state.flags && r.state.flags.rumorReversed) rumorReversed++;
  if (r.steps > maxSteps) maxSteps = r.steps;
}
if (controversial === 0) { console.log('FAIL 联动结局 END_CONTROVERSIAL 在 ' + N + ' 局中不可达'); process.exit(1); }
console.log('PASS 剧情文案审计：独白齐全(' + Object.keys(endings).length + ')，尾声全可达，' + N + ' 局无死循环(maxSteps=' + maxSteps + ')，rumorStarted=' + rumorStarted + '，rumorReversed=' + rumorReversed + '，END_CONTROVERSIAL 可达=' + controversial);
process.exit(0);
