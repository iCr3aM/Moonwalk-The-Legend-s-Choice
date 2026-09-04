// 续章（§17.2）链路门禁：验证 survived2009 续章链路可完整走通并收束于非死亡结局，
// 且 8 个拓展节点（8_1b/8_2b/8_3b/8_5b/8_4b/8_4c/8_7/8_9）均途经；续章专属变体池 V_POST_* 已注册。
// 用法：node test/check_epilogue_chain.cjs
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

var _cur = null;
var _visited = {};
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id, state) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (c, s, cb) { cb(); }
};

function walk() {
  _visited = {};
  MJ.engine.start();
  MJ.engine.state.flags.survived2009 = true; // 进入续章前提
  MJ.engine.go('8_0');
  var guard = 0;
  while (guard++ < 400) {
    if (!_cur) return { ok: false, why: 'no event' };
    if (_cur.id) _visited[_cur.id] = true;
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id };
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') { MJ.engine.choose(0); continue; }
    return { ok: false, why: 'unknown ' + _cur.kind };
  }
  return { ok: false, why: 'guard exceeded' };
}

var pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('✅', name); } else { fail++; console.log('❌', name); } }

// 续章专属变体池 V_POST_* 注册校验
var vp = ['V_POST_TRIBUTE', 'V_POST_HOLO', 'V_POST_FAMILY'].filter(function (id) {
  var v = MJ.EVENTS[id];
  return v && v.variant === true && v.window[0] >= 2010 && v.window[1] <= 2026;
});
check('续章专属变体池 V_POST_* 已注册（≥3，窗口[2010,2026]）', vp.length >= 3);

var r = walk();
check('续章链路可达结局', r.ok);
var ALLOWED = ['END_TRUE_ETERNAL', 'END_MOGUL', 'END_PHILANTHROPIST', 'END_RECLUSE', 'END_PERFECT', 'END_TIMELESS_PRESENT'];
check('续章收束于非死亡结局（§7.2 规则 3b 链）', ALLOWED.indexOf(r.ending) >= 0);
var need = ['8_1b', '8_2b', '8_3b', '8_5b', '8_4b', '8_4c', '8_7', '8_9'];
var missing = need.filter(function (id) { return !_visited[id]; });
check('续章拓展节点全部途经（8_1b/8_2b/8_3b/8_5b/8_4b/8_4c/8_7/8_9）', missing.length === 0);
if (missing.length) console.log('  未途经:', missing.join(','));

// 途径 8_1b/8_4b 写入的 flag 应解锁 §17.2 专属成就
MJ.achievementSystem.evaluate(MJ.engine.state, { ending: r.ending });
check('续章途径解锁 ACH_HOLOGRAM（全息归来）', MJ.achievementSystem.isUnlocked('ACH_HOLOGRAM'));
check('续章途径解锁 ACH_MUSICAL（百老汇音乐剧）', MJ.achievementSystem.isUnlocked('ACH_MUSICAL'));

// 多次随机走查无异常
var okRuns = 0;
for (var t = 0; t < 20; t++) { if (walk().ok) okRuns++; }
check('续章链路 20 局随机走查均到达结局', okRuns >= 20);

console.log('\n续章链路：单局到达', r.ending, '；20 局到达', okRuns, '/20');
console.log('失败', fail, '；通过', pass);
process.exit(fail ? 1 : 0);
