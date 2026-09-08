// 具名人物一致性全遍历审计（真实引擎驱动，覆盖全部事件/变体的 title/text/选项/keyNote/epilogue）
// 规则：任一具名人物（昆西/戴安娜/弗兰克/布兰卡/伊丽莎白/Lisa/黛比）在「未结识」状态下被事件文案提及 → 违规；
//       例外：该事件本身即「初遇/介绍」事件（INTRO_WHITELIST，玩家看到文案的同时会结识该人物）。
// 运行：node test/_audit_person_consistency.cjs [随机局数=3000]
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

// 具名人物 → 文案提及正则（zh 兜底文案；注意避开「波比·泰勒」等同名干扰）
var PERSONS = {
  quincy:    { re: /昆西|Quincy/,              relKey: 'quincy' },
  diana:     { re: /戴安娜|Diana/,             relKey: 'diana' },
  frank:     { re: /弗兰克|DiLeo/,             relKey: 'frank' },
  john:      { re: /布兰卡|Branca/,            relKey: 'john' },
  elizabeth: { re: /伊丽莎白|Elizabeth/,       relKey: 'elizabeth' },
  lisa:      { re: /Lisa/,                     relKey: 'lisa' }, // 大小写敏感：避免命中「伊丽莎白」中的「丽莎」
  debbie:    { re: /黛比/,                     relKey: 'debbie' }
};

// 初遇/介绍事件白名单：事件文案本身即在「介绍」该人物（玩家读到的同时结识）
// 2_1/2_1b/V_OFFWALL_QJ/V_BIO_WIZ=昆西（单飞线）；1_3=Diana（Motown 引荐）；4_3b=泰勒加冕；5_5=Lisa 婚礼；6_2=黛比婚礼
var INTRO_WHITELIST = {
  '1_3': ['diana'],
  '2_1': ['quincy'],
  '2_1b': ['quincy'],
  'V_OFFWALL_QJ': ['quincy'],
  'V_BIO_WIZ': ['quincy'],
  '4_3b': ['elizabeth'],
  '5_5': ['lisa'],
  '6_2': ['debbie', 'lisa']
};

function isPersonMet(state, person) {
  var relKey = PERSONS[person].relKey;
  if (relKey === 'debbie') return !!(state.relMet && state.relMet.debbie);
  return MJ.isCollaboratorMet(state, relKey);
}

// 遍历单局：每展示一个事件即扫描文案，记录「未结识提及」违规
function runTraversal(seed, force) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0, seenIds = {};
  var localViolations = [];
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var id = ev.id;
    seenIds[id] = (seenIds[id] || 0) + 1;
    var st = MJ.engine.state;
    var copy = MJ.localizeEvent(ev, st);
    var strings = [copy.title, copy.text, copy.keyNote];
    (copy.options || []).forEach(function (o) { strings.push(o.label, o.hint, o.epilogue); });
    var joined = strings.filter(Boolean).join('\n');
    for (var p in PERSONS) {
      if (!PERSONS.hasOwnProperty(p)) continue;
      if (!PERSONS[p].re.test(joined)) continue;
      if (isPersonMet(st, p)) continue;
      var wl = INTRO_WHITELIST[id];
      if (wl && wl.indexOf(p) >= 0) continue;
      localViolations.push({ eventId: id, person: p, sample: joined.slice(0, 80) });
    }
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = (force && force[id] != null) ? force[id] : (Math.floor(rng() * opts.length) % opts.length);
    MJ.engine.choose(idx);
  }
  return { ending: resolvedEndingId, seenIds: seenIds, violations: localViolations, state: MJ.engine.state };
}

var N = Number(process.argv[2] || 3000);
var violationMap = {}; // key: eventId|person → { count, sample }
function record(v) {
  var key = v.eventId + '|' + v.person;
  if (!violationMap[key]) violationMap[key] = { eventId: v.eventId, person: v.person, count: 0, sample: v.sample };
  violationMap[key].count++;
}

var totalRuns = 0, totalViolations = 0;
function runBatch(label, n, forceBase) {
  for (var i = 0; i < n; i++) {
    var force = forceBase || null;
    var r = runTraversal(410000 + i, typeof forceBase === 'function' ? forceBase(i) : force);
    if (!r.ending) continue;
    totalRuns++;
    r.violations.forEach(record);
    totalViolations += r.violations.length;
  }
}

runBatch('random', N, null);
runBatch('group', 200, { '1_3': 0, '1_5': 1 });
runBatch('solo_prod', 200, { '1_3': 0, '1_5': 0, 'V_OFFWALL_QJ': 1 });
runBatch('solo_qj', 200, { '1_3': 0, '1_5': 0, 'V_OFFWALL_QJ': 0 });

var keys = Object.keys(violationMap).sort();
console.log('=== 具名人物一致性全遍历审计 ===');
console.log('有效局数=' + totalRuns + '，未结识提及违规总数=' + totalViolations + '，涉及组合=' + keys.length);
keys.forEach(function (k) {
  var v = violationMap[k];
  console.log('  [' + v.person + '] ' + v.eventId + ' × ' + v.count + '  样例: ' + v.sample.replace(/\n/g, ' '));
});
if (keys.length) {
  console.error('FAIL 人物一致性审计：存在 ' + keys.length + ' 组未结识提及，需修复或补白名单');
  process.exit(1);
}
console.log('PASS 人物一致性全遍历审计：全部具名人物提及均发生在结识之后（或属初遇白名单）');
