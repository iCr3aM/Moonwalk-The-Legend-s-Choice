// 状态前提一致性全遍历审计（真实引擎驱动，覆盖全部展示事件的 title/text/keyNote/选项/epilogue）
// 两类规则：
//   A) 庄园：玩家未购置庄园（flags.neverlandType 为 undefined 或 'none'）时，
//      任何事件文案不得出现「梦幻庄园 / 梦幻岛 / Neverland / 庄园」——
//      否则会出现「选了『干脆不购置』后面却搬进庄园/庄园里养猩猩/被庄园指控」的叙事悖论。
//      白名单：'4_1'（购置决策事件本身，玩家读到文案的同时做出购置与否的选择）。
//   B) 子女：玩家没有任何孩子（princeBorn/parisBorn/surrogacy 均未发生）时，
//      不得出现「长子降生 / 女儿降生 / 第三个孩子 / 幼子出生」类生育叙事。
//      白名单：V_CHILD_PRINCE / V_CHILD_PARIS（生育事件本身，展示时孩子 flag 尚未写入）。
// 背景（2026-09-09）：修复 4_1b 无门控（不购置也「搬进 Neverland」）、V_BUBBLES/V_SANCTUARY/
//   V_PETERPAN/V_CHILDHOSP/V_TIDBIT_GARDEN 缺门控、8_5b（Leaving Neverland 风波）缺门控、
//   V_QUIET_PATH「为家人置下庄园」与购置线冲突（已改「家人安顿的宅邸」）、
//   V_CHILD_PRINCE/PARIS cond 误用 s.rel（字段恒 undefined，正确为 s.relations）、
//   6_4b「第三个孩子」无门控（无孩子局也会遇到，已加 cond + fallback '6_4'）。
// 运行：node test/_audit_neverland.cjs [随机局数=2000]
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
require('../js/collaborators.js');
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

var NEVERLAND_RE = /梦幻庄园|梦幻岛|Neverland|庄园/;
var WHITELIST = { '4_1': true }; // 购置决策事件本身
var CHILD_RE = /长子降生|女儿降生|第三个孩子|幼子出生/;
var CHILD_WHITELIST = { 'V_CHILD_PRINCE': true, 'V_CHILD_PARIS': true }; // 生育事件本身

function ownsNeverland(state) {
  var t = state.flags && state.flags.neverlandType;
  return t === 'public' || t === 'private';
}
function hasChild(state) {
  var f = state.flags || {};
  return !!(f.princeBorn || f.parisBorn || f.surrogacy);
}

function runTraversal(seed, force) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0;
  var localViolations = [];
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var id = ev.id;
    var st = MJ.engine.state;
    var copy = MJ.localizeEvent(ev, st);
    var strings = [copy.title, copy.text, copy.keyNote];
    (copy.options || []).forEach(function (o) { strings.push(o.label, o.hint, o.epilogue); });
    var joined = strings.filter(Boolean).join('\n');
    if (NEVERLAND_RE.test(joined) && !WHITELIST[id] && !ownsNeverland(st)) {
      localViolations.push({ eventId: id, kind: 'neverland', state: st.flags.neverlandType == null ? 'undefined' : st.flags.neverlandType, sample: joined.slice(0, 80) });
    }
    if (CHILD_RE.test(joined) && !CHILD_WHITELIST[id] && !hasChild(st)) {
      localViolations.push({ eventId: id, kind: 'child', state: 'no-child', sample: joined.slice(0, 80) });
    }
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = (force && force[id] != null) ? force[id] : (Math.floor(rng() * opts.length) % opts.length);
    MJ.engine.choose(idx);
  }
  return { ending: resolvedEndingId, violations: localViolations };
}

var N = Number(process.argv[2] || 2000);
var violationMap = {};
function record(v) {
  var key = v.kind + '|' + v.eventId + '|' + v.state;
  if (!violationMap[key]) violationMap[key] = { kind: v.kind, eventId: v.eventId, state: v.state, count: 0, sample: v.sample };
  violationMap[key].count++;
}

var totalRuns = 0, totalViolations = 0;
function runBatch(label, n, forceBase) {
  for (var i = 0; i < n; i++) {
    var force = forceBase || null;
    var r = runTraversal(520000 + i, typeof forceBase === 'function' ? forceBase(i) : force);
    if (!r.ending) continue;
    totalRuns++;
    r.violations.forEach(record);
    totalViolations += r.violations.length;
  }
}

runBatch('random', N, null);
runBatch('never_buy', 300, { '4_1': 2 });   // 定向：永不购置（opt2）
runBatch('buy_public', 150, { '4_1': 0 });  // 对照：购置公开线（合法路径覆盖）
runBatch('buy_private', 150, { '4_1': 1 }); // 对照：购置私人线

var keys = Object.keys(violationMap).sort();
console.log('=== 状态前提一致性全遍历审计（庄园 + 子女） ===');
console.log('有效局数=' + totalRuns + '（含定向永不购置 300 局），违规总数=' + totalViolations + '，涉及组合=' + keys.length);
keys.forEach(function (k) {
  var v = violationMap[k];
  console.log('  [' + v.kind + '|' + v.state + '] ' + v.eventId + ' × ' + v.count + '  样例: ' + v.sample.replace(/\n/g, ' '));
});
if (keys.length) {
  console.error('FAIL 状态前提一致性审计：存在状态不满足时的内容提及，需加 cond 门控或修文案');
  process.exit(1);
}
console.log('PASS 状态前提一致性全遍历审计：庄园与子女叙事均与玩家状态一致（含定向永不购置 300 局）');
