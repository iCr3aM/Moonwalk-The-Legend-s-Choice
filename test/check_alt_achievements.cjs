// 定向冒烟：证明阶段 2 架空历史（alt 结局）成就可达（非死成就）
// 做法：构造 GameState 写入对应 timeline 分叉 / flag，并传入 ctx.ending，
//       经 achievementSystem.evaluate → 断言对应 ACH_ALT_* 解锁。
// 用法：node test/check_alt_achievements.cjs
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

function evalEnding(over, ending) {
  MJ.achievementSystem.clear();
  var s = fresh();
  if (over.timeline) Object.assign(s.timeline, over.timeline);
  if (over.flags) Object.assign(s.flags, over.flags);
  return MJ.achievementSystem.evaluate(s, { ending: ending });
}

// 每个 alt 结局成就：对应分叉 / flag + ctx.ending → 解锁
check('ACH_ALT_STAY_MOTOWN 可达', has(evalEnding({ timeline: { '1975': 'motown' } }, 'END_ALT_STAY_MOTOWN'), 'ACH_ALT_STAY_MOTOWN'));
check('ACH_ALT_NO_QJ 可达', has(evalEnding({ timeline: { '1979': 'solo_prod' } }, 'END_ALT_NO_QJ'), 'ACH_ALT_NO_QJ'));
check('ACH_ALT_HEALED 可达', has(evalEnding({ timeline: { '1984': 'safe' } }, 'END_ALT_HEALED'), 'ACH_ALT_HEALED'));
check('ACH_ALT_MEDIA_MOGUL 可达', has(evalEnding({ timeline: { 'biz': 'empire' } }, 'END_ALT_MEDIA_MOGUL'), 'ACH_ALT_MEDIA_MOGUL'));
check('ACH_ALT_PEACE_LAUREATE 可达', has(evalEnding({ flags: { altPeace: true } }, 'END_ALT_PEACE_LAUREATE'), 'ACH_ALT_PEACE_LAUREATE'));
check('ACH_ALT_SURVIVE_LEGACY 可达', has(evalEnding({ flags: { survived2009: true }, timeline: { '2009': 'survive' } }, 'END_ALT_SURVIVE_LEGACY'), 'ACH_ALT_SURVIVE_LEGACY'));
check('ACH_ALT_QUIET_RETIREE 可达', has(evalEnding({ flags: { altQuietRetiree: true } }, 'END_ALT_QUIET_RETIREE'), 'ACH_ALT_QUIET_RETIREE'));

// 元成就：任意分叉 → ACH_ALT_FORK
check('ACH_ALT_FORK 可达（任意 timeline 分叉）', has(evalEnding({ timeline: { '1975': 'motown' } }, 'END_ALT_STAY_MOTOWN'), 'ACH_ALT_FORK'));
// 元成就负向：无分叉 → 不解锁
MJ.achievementSystem.clear();
var s0 = fresh();
var r0 = MJ.achievementSystem.evaluate(s0, { ending: 'END_FAMILY' });
check('ACH_ALT_FORK 无分叉不解锁', !has(r0, 'ACH_ALT_FORK'));

console.log('\nALT 成就可达性：通过 ' + pass + '，失败 ' + fail);
process.exit(fail ? 1 : 0);
