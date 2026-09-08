// 结局/尾声/独白扩写文案与路线一致性审计（任务D，真实引擎驱动）
// 规则：任一具名人物（昆西/戴安娜/弗兰克/布兰卡/泰勒/Lisa/黛比）出现在该局结局的
//   summary / monologue / 独白扩写尾段 / 尾声模板文案 中，而按本局状态该人物「未结识」→ 违规。
//   （与事件遍历同一准绳；结局文案与 routes 状态矛盾即文案泄漏。）
// 已知白名单：END_ALT_NO_QJ×quincy——该结局本身即「没有昆西的人生」叙事，提及昆西是文案主旨。
// 运行：node test/_audit_ending_texts.cjs [局数=3000]
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
  showEvent: function () {}, showEraCard: function (c, s, cb) { cb(); }, showEnding: function () {},
  toastEgg: function () {}, toastTrivia: function () {}, showModal: function () {}
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

var PERSONS = {
  quincy:    { re: /昆西|Quincy/,        relKey: 'quincy' },
  diana:     { re: /戴安娜|Diana/,       relKey: 'diana' },
  frank:     { re: /弗兰克|DiLeo/,       relKey: 'frank' },
  john:      { re: /布兰卡|Branca/,      relKey: 'john' },
  elizabeth: { re: /伊丽莎白|Elizabeth/, relKey: 'elizabeth' },
  lisa:      { re: /Lisa/,               relKey: 'lisa' },
  debbie:    { re: /黛比/,               relKey: 'debbie' }
};
// 路线性白名单：结局文案本身即围绕该人物/该路线展开
var ENDING_WHITELIST = {
  'END_ALT_NO_QJ': ['quincy'] // 「没有昆西的人生」结局，提及昆西为文案主旨
};

function isPersonMet(state, person) {
  var relKey = PERSONS[person].relKey;
  if (relKey === 'debbie') return !!(state.relMet && state.relMet.debbie);
  return MJ.isCollaboratorMet(state, relKey);
}
// 与 ui.js epilogueTailFor/monologueExtFor 相同逻辑（zh 兜底）
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
function monologueExtFor(state) {
  var tpl = (MJ.config && MJ.config.monologueExtTemplates) || [];
  for (var i = 0; i < tpl.length; i++) {
    var t = tpl[i];
    if (t.cond && !t.cond(state)) continue;
    return t.text;
  }
  return '';
}

var violationMap = {};
var N = Number(process.argv[2] || 3000);
var runs = 0, endingsSeen = {};
for (var i = 0; i < N; i++) {
  var rng = mulberry32(520000 + i);
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
    MJ.engine.choose(Math.floor(rng() * opts.length) % opts.length);
  }
  var id = resolvedEndingId;
  if (!id) continue;
  runs++; endingsSeen[id] = (endingsSeen[id] || 0) + 1;
  var st = MJ.engine.state;
  var e = MJ.config.endings[id] || {};
  var strings = [e.summary, e.monologue, monologueExtFor(st), epilogueTailFor(st, id)];
  var joined = strings.filter(Boolean).join('\n');
  for (var p in PERSONS) {
    if (!PERSONS.hasOwnProperty(p)) continue;
    if (!PERSONS[p].re.test(joined)) continue;
    if (isPersonMet(st, p)) continue;
    var wl = ENDING_WHITELIST[id];
    if (wl && wl.indexOf(p) >= 0) continue;
    var key = id + '|' + p;
    if (!violationMap[key]) violationMap[key] = { id: id, person: p, count: 0, sample: joined.slice(0, 100) };
    violationMap[key].count++;
  }
}

var keys = Object.keys(violationMap).sort();
console.log('=== 结局/尾声/独白扩写文案一致性审计 ===');
console.log('有效局数=' + runs + '，触及结局数=' + Object.keys(endingsSeen).length + '，违规组合=' + keys.length);
keys.forEach(function (k) {
  var v = violationMap[k];
  console.log('  [' + v.person + '] ' + v.id + ' × ' + v.count + '  样例: ' + v.sample.replace(/\n/g, ' '));
});
if (keys.length) {
  console.error('FAIL 结局文案一致性：' + keys.length + ' 组未结识提及');
  process.exit(1);
}
console.log('PASS 结局/尾声/独白扩写文案一致性：全部具名人物提及与该局结识状态自洽（含路线白名单）');
