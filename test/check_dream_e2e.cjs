// dream 成就端到端可达（真实玩法链路，非仅标志→evaluate）
// 做法：覆盖 pickVariant 在合格年份强制插入 V_PETERPAN 变体；在变体上选 A（写入 dream_peterpan 标志）；
//      一路走到结局；在 showEnding 桩里像真实 UI 那样调用 achievementSystem.evaluate；
//      断言：变体被插入且选 A 写入标志 → 到达结局后 ACH_PETERPAN 解锁。
// 用法：node test/check_dream_e2e.cjs
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
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id, state) {
    MJ.achievementSystem.evaluate(state, { ending: id }); // 复刻 ui.showEnding 的成就结算
    _cur = { kind: 'ended', id: id };
  },
  showEraCard: function (chapter, state, cb) { cb(); }
};

// 强制在 [1987,2005] 主线年份插入 V_PETERPAN（每局仅一次；复刻原函数对 _usedVariants 的标记）
MJ.engine.pickVariant = function (year) {
  if (year >= 1987 && year <= 2005 && !this._usedVariants['V_PETERPAN']) {
    this._usedVariants['V_PETERPAN'] = true;
    this.state.stats.variants++;
    return 'V_PETERPAN';
  }
  return null;
};

function play() {
  MJ.engine.start();
  var guard = 0;
  while (guard++ < 800) {
    if (!_cur) return { ok: false, why: 'no event' };
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id };
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var idx = (_cur.id === 'V_PETERPAN') ? 0 : 0; // 变体上选 A（dream_peterpan）
      MJ.engine.choose(idx);
      continue;
    }
    return { ok: false, why: 'unknown kind ' + _cur.kind };
  }
  return { ok: false, why: 'guard exceeded' };
}

function runOnce() {
  MJ.achievementSystem.clear();
  var r = play();
  return { ok: r.ok, ending: r.ending, flag: !!MJ.engine.state.flags.dream_peterpan, unlocked: MJ.achievementSystem.isUnlocked('ACH_PETERPAN') };
}

var pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('✅', name); } else { fail++; console.log('❌', name); } }

var reached = 0, flagged = 0, unlocked = 0;
for (var t = 0; t < 20; t++) {
  var o = runOnce();
  if (o.ok) reached++;
  if (o.flag) flagged++;
  if (o.unlocked) unlocked++;
}
check('端到端：可达结局', reached >= 1);
check('端到端：V_PETERPAN 变体被插入且选 A 写入 dream_peterpan 标志', flagged >= 1);
check('端到端：真实玩法链路下 ACH_PETERPAN 于结局解锁', unlocked >= 1);

console.log('\nDREAM 端到端（20 局）：可达结局 ' + reached + '；写入标志 ' + flagged + '；解锁成就 ' + unlocked);
console.log('失败', fail, '；通过', pass);
process.exit(fail ? 1 : 0);
