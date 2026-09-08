// 关系网「结识门控」审计（真实引擎驱动，非存在性断言）
// ① 组合线（守在 Jackson 5）：全程不得出现昆西内容（V_BIO_WIZ/V_OFFWALL_QJ/V_COLLAB_OTW/V_REL_QUINCY 零触发、quincy 好感恒 0、羁绊卡锁定且不泄露姓名）
// ② 独立制作线（V_OFFWALL_QJ 选 B）：决策后昆西内容绝迹（好感不再变动、变体零触发、羁绊卡锁定、2_6 文本与选项无昆西）
// ③ 昆西合作线（V_OFFWALL_QJ 选 A）：羁绊卡正常显示昆西
// ④ 随机局：任何关系变体（V_REL_*）触发时对应人物必须「已结识」
// 运行：node test/_audit_rel_met.cjs
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

var REL_VARIANTS = { V_REL_QUINCY: 'quincy', V_REL_DIANA: 'diana', V_REL_FRANK: 'frank', V_REL_JOHN: 'john', V_REL_ELIZABETH: 'elizabeth' };
var QUINCY_EVENTS = ['V_BIO_WIZ', 'V_OFFWALL_QJ', 'V_COLLAB_OTW', 'V_REL_QUINCY'];

function runDirected(seed, force) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0, seen = {}, soloProdChosen = false, quincyRelAtDecision = null, twoSixChecked = false;
  var problems = [];
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var id = ev.id;
    seen[id] = (seen[id] || 0) + 1;
    var st = MJ.engine.state;
    // ④ 通用门控：关系变体触发时人物必须已结识
    if (REL_VARIANTS[id] && !MJ.isCollaboratorMet(st, REL_VARIANTS[id])) {
      problems.push('变体 ' + id + ' 触发时 ' + REL_VARIANTS[id] + ' 未结识');
    }
    if (id === 'V_BIO_WIZ' && st.flags.isSolo !== true) problems.push('V_BIO_WIZ 在组合线触发');
    if (id === 'V_COLLAB_OTW' && (st.flags.isSolo !== true || (st.timeline && st.timeline['1979'] === 'solo_prod'))) problems.push('V_COLLAB_OTW 门控失效');
    if (id === 'V_OFFWALL_QJ') {
      if (st.flags.isSolo !== true) problems.push('V_OFFWALL_QJ 在组合线触发');
      quincyRelAtDecision = st.relations.quincy || 0;
    }
    // ② 独立制作线：2_6 文本与选项不得再出现昆西
    if (id === '2_6' && st.timeline && st.timeline['1979'] === 'solo_prod') {
      var loc = MJ.localizeEvent(ev, st);
      if (String(loc.text).indexOf('昆西') >= 0) problems.push('2_6 文本在独立制作线出现昆西');
      var e0 = loc.options && loc.options[0] && loc.options[0].effects;
      if (e0 && e0.rel && e0.rel.quincy) problems.push('2_6 首选项在独立制作线仍加昆西好感');
      twoSixChecked = true;
    }
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = (force && force[id] != null) ? force[id] : (Math.floor(rng() * opts.length) % opts.length);
    if (id === 'V_OFFWALL_QJ' && idx === 1) soloProdChosen = true;
    MJ.engine.choose(idx);
  }
  return {
    ending: resolvedEndingId, seen: seen, state: MJ.engine.state,
    soloProdChosen: soloProdChosen, quincyRelAtDecision: quincyRelAtDecision,
    twoSixChecked: twoSixChecked, problems: problems
  };
}

var N_RANDOM = Number(process.argv[2] || 2000);
var fails = [];
function check(name, ok, detail) { if (!ok) fails.push(name + (detail ? '：' + detail : '')); }

// ① 组合线：1_3 跟 Diana（保证推进）→ 1_5 守在组合
var groupQuincyLeaks = 0, groupChecked = 0;
for (var i = 0; i < 400; i++) {
  var r = runDirected(310000 + i, { '1_3': 0, '1_5': 1 });
  if (!r.ending) continue;
  groupChecked++;
  var leaked = QUINCY_EVENTS.filter(function (q) { return r.seen[q]; });
  if (leaked.length) groupQuincyLeaks++;
  check('组合线昆西事件零触发', !leaked.length, leaked.join(','));
  check('组合线 quincy 好感恒 0', (r.state.relations.quincy || 0) === 0, String(r.state.relations.quincy));
  check('组合线 quincy 未结识', !MJ.isCollaboratorMet(r.state, 'quincy'));
  var html = MJ.renderCollaboratorsOverview(r.state);
  check('组合线羁绊卡锁定态存在', html.indexOf('collab-card locked') >= 0);
  check('组合线羁绊卡不泄露昆西姓名', html.indexOf('Quincy Jones') < 0 && html.indexOf('昆西') < 0);
  if (r.problems.length) check('组合线运行时断言', false, r.problems[0]);
}

// ② 独立制作线：1_5 单飞 → V_OFFWALL_QJ 选 B（solo_prod）
var prodChecked = 0, prodDecision = 0, prodRelLeak = 0, prodTwoSix = 0;
for (var j = 0; j < 400; j++) {
  var r2 = runDirected(320000 + j, { '1_3': 0, '1_5': 0, 'V_OFFWALL_QJ': 1 });
  if (!r2.ending) continue;
  prodChecked++;
  if (!r2.soloProdChosen) { check('独立制作线决策注入', false, 'V_OFFWALL_QJ 未触发'); continue; }
  prodDecision++;
  check('独立制作后 quincy 好感不再变动', (r2.state.relations.quincy || 0) === r2.quincyRelAtDecision,
    '决策前=' + r2.quincyRelAtDecision + ' 结束=' + (r2.state.relations.quincy || 0));
  if ((r2.state.relations.quincy || 0) !== r2.quincyRelAtDecision) prodRelLeak++;
  check('独立制作线 V_REL_QUINCY 零触发', !r2.seen['V_REL_QUINCY']);
  check('独立制作线 V_COLLAB_OTW 零触发', !r2.seen['V_COLLAB_OTW']);
  check('独立制作线 quincy 未结识（羁绊卡锁定）', !MJ.isCollaboratorMet(r2.state, 'quincy'));
  check('独立制作线羁绊卡不泄露昆西姓名', MJ.renderCollaboratorsOverview(r2.state).indexOf('Quincy Jones') < 0 && MJ.renderCollaboratorsOverview(r2.state).indexOf('昆西') < 0);
  if (r2.twoSixChecked) prodTwoSix++;
  if (r2.problems.length) check('独立线运行时断言', false, r2.problems[0]);
}

// ③ 昆西合作线：V_OFFWALL_QJ 选 A → 羁绊正常显示
var qjMetCount = 0, qjChecked = 0;
for (var k = 0; k < 200; k++) {
  var r3 = runDirected(330000 + k, { '1_3': 0, '1_5': 0, 'V_OFFWALL_QJ': 0 });
  if (!r3.ending) continue;
  qjChecked++;
  if (MJ.isCollaboratorMet(r3.state, 'quincy')) qjMetCount++;
  if (r3.problems.length) check('合作线运行时断言', false, r3.problems[0]);
}

// ④ 随机局：变体触发时人物必须已结识（含组合线整体零昆西复检）
var randomProblems = 0, randomChecked = 0, randomGroup = 0;
for (var m = 0; m < N_RANDOM; m++) {
  var r4 = runDirected(340000 + m, null);
  if (!r4.ending) continue;
  randomChecked++;
  if (r4.state.flags.isSolo === false) {
    randomGroup++;
    var leaked4 = QUINCY_EVENTS.filter(function (q) { return r4.seen[q]; });
    if (leaked4.length || (r4.state.relations.quincy || 0) !== 0) randomProblems++;
  }
  if (r4.problems.length) randomProblems++;
}

console.log('=== 关系网结识门控审计 ===');
console.log('组合线：有效局=' + groupChecked + '，昆西泄漏局=' + groupQuincyLeaks);
console.log('独立制作线：有效局=' + prodChecked + '，决策局=' + prodDecision + '，好感泄漏局=' + prodRelLeak + '，2_6 独立分支命中=' + prodTwoSix);
console.log('昆西合作线：有效局=' + qjChecked + '，羁绊显示局=' + qjMetCount);
console.log('随机局：有效局=' + randomChecked + '，其中组合线=' + randomGroup + '，违规=' + randomProblems);

check('组合线有效局充足', groupChecked >= 200, String(groupChecked));
check('组合线零昆西泄漏', groupQuincyLeaks === 0, String(groupQuincyLeaks));
check('独立制作线有效局充足', prodChecked >= 200, String(prodChecked));
check('独立制作线决策必现', prodDecision >= 200, String(prodDecision));
check('独立制作线好感零泄漏', prodRelLeak === 0, String(prodRelLeak));
check('独立制作线 2_6 独立分支命中', prodTwoSix > 0, String(prodTwoSix));
check('昆西合作线羁绊必显示', qjMetCount === qjChecked && qjChecked > 0, qjMetCount + '/' + qjChecked);
check('随机局零违规', randomProblems === 0, String(randomProblems));

if (fails.length) {
  console.error('FAIL 关系网结识门控审计：' + fails.length + ' 项未通过');
  fails.forEach(function (f) { console.error('  ✗ ' + f); });
  process.exit(1);
}
console.log('PASS 关系网结识门控审计：组合线/独立制作线昆西内容绝迹，羁绊卡按结识显示，随机局变体门控全部成立');
