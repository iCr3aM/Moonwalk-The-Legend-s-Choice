// 定向冒烟：证明 §17.13.3 dream 成就可达（非死成就）
// 做法：构造 GameState 写入对应 dream_* 标志 → achievementSystem.evaluate → 断言解锁。
// 另验证：无标志时不解锁、对应变体事件确实存在（标志可被真实玩法写入）。
// 用法：node test/check_dream_achievements.cjs
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

function fresh() { return new MJ.GameState(); }
function has(list, id) { return list.some(function (a) { return a.id === id; }); }
var pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('✅', name); } else { fail++; console.log('❌', name); } }

function evalWith(flags) {
  MJ.achievementSystem.clear();
  var s = fresh();
  Object.keys(flags || {}).forEach(function (k) { s.flags[k] = true; });
  return MJ.achievementSystem.evaluate(s, {});
}

// 单项成就：对应 dream_* 标志 → 解锁
check('ACH_PETERPAN 可达 (dream_peterpan)', has(evalWith({ dream_peterpan: true }), 'ACH_PETERPAN'));
check('ACH_GREATWALL 可达 (dream_greatwall)', has(evalWith({ dream_greatwall: true }), 'ACH_GREATWALL'));
check('ACH_THISISIT 可达 (dream_thisisit)', has(evalWith({ dream_thisisit: true }), 'ACH_THISISIT'));

// 聚合成就：≥3 个 dream_* 标志 → ACH_DREAMER
check('ACH_DREAMER 可达 (≥3 dream)', has(evalWith({ dream_peterpan: true, dream_greatwall: true, dream_thisisit: true }), 'ACH_DREAMER'));
// 不足 3 个 → 不解锁
check('ACH_DREAMER 不足 3 个不解锁', !has(evalWith({ dream_peterpan: true }), 'ACH_DREAMER'));

// 负向：无 dream 标志 → 四个均不解锁
var r0 = evalWith({});
check('无 dream 标志时不解锁', !has(r0, 'ACH_PETERPAN') && !has(r0, 'ACH_GREATWALL') && !has(r0, 'ACH_THISISIT') && !has(r0, 'ACH_DREAMER'));

// 变体确实存在（标志可由真实玩法写入）
['V_PETERPAN', 'V_GREATWALL', 'V_THISISIT_DONE', 'V_MUSICAL', 'V_SPACE', 'V_FILMSTUDIO', 'V_CHILDHOSP'].forEach(function (id) {
  check('变体存在 ' + id, !!MJ.EVENTS[id] && MJ.EVENTS[id].variant === true);
});

console.log('\nDREAM 成就可达性：通过 ' + pass + '，失败 ' + fail);
process.exit(fail ? 1 : 0);
