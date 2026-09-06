// Phase 2 内容扩充可达性门禁：断言清单中全部新内容存在且结构正确。
// 失败用例（内容尚未添加）退出码 1；全部存在且结构正确退出码 0。
// 用法：node test/check_phase2_content.cjs  （已接入 npm test，置于 check_i18n_coverage 之后）
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

// 与计划清单一致
var NEW_VARIANTS = ['V_TOY_DRUM', 'V_SISTER_LATOYA', 'V_TV_SPECIAL', 'V_BROTHERS_FEUD'];
var NEW_ACH = ['ACH_TOY_DRUM', 'ACH_FIRST_LIGHT', 'ACH_PEACE_AMBASSADOR', 'ACH_ELDEST_BOND', 'ACH_RECLUSE_PEACE', 'ACH_STAGE_LEGEND', 'ACH_COMEBACK_KING', 'ACH_DIGITAL_ERA', 'ACH_LEGACY_2026', 'ACH_WHOLE_LIFE'];
var NEW_EGG = ['EGG_TOYDRUM', 'EGG_SISTERDUET', 'EGG_CHARITYYOUTH', 'EGG_FANLETTERKID', 'EGG_FINALREHEARSAL'];
var NEW_TRIVIA = ['TRIVIA_DIALTONE', 'TRIVIA_GLOVE', 'TRIVIA_QUIETSTAGE', 'TRIVIA_MOTHERSONG', 'TRIVIA_HEALPLANET'];

var fail = 0;
function check(name, ok) {
  if (!ok) { fail++; console.log('FAIL ' + name); }
  else { console.log('PASS ' + name); }
}

// 1) 变体：存在 + variant===true + 窗口跨度 >=2 年（y1-y0>=1）
NEW_VARIANTS.forEach(function (id) {
  var v = MJ.EVENTS[id];
  check('变体存在 ' + id, !!v && v.variant === true);
  if (v && v.window) check('变体窗口>=2年 ' + id, v.window[1] - v.window[0] >= 1);
});

// 2) 成就：在 C.achievements 中存在
NEW_ACH.forEach(function (id) {
  check('成就存在 ' + id, (MJ.config.achievements || []).some(function (a) { return a.id === id; }));
});

// 3) 彩蛋：defs 存在
NEW_EGG.forEach(function (id) {
  check('彩蛋存在 ' + id, !!(MJ.eggSystem && MJ.eggSystem.defs && MJ.eggSystem.defs[id]));
});

// 4) 趣事：defs 存在
NEW_TRIVIA.forEach(function (id) {
  check('趣事存在 ' + id, !!(MJ.triviaSystem && MJ.triviaSystem.defs && MJ.triviaSystem.defs[id]));
});

// 5) 续章支线节点 8_8 存在且其选项全部回到 8_4b
check('续章支线 8_8 存在', !!MJ.EVENTS['8_8']);
if (MJ.EVENTS['8_8']) {
  var back = (MJ.EVENTS['8_8'].options || []).every(function (o) { return o.next === '8_4b'; });
  check('8_8 回到 8_4b', back);
}

console.log('\n=== Phase 2 内容门禁 FAIL: ' + fail + ' ===');
process.exit(fail ? 1 : 0);
