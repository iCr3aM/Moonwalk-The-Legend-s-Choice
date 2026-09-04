/* 验证：新增 Ch0 手足事件 + 2001 兄弟同台 后，ACH_BROTHERLY 是否"需经营手足情方可达成"。
 * 约定：rel 嵌套在 effects 内：effects.rel.brothers。
 * 手足路线：每步优先选 effects.rel.brothers 最高项（自然在 1_5 留团、6_3a_r 拥抱和解）。
 * 自私路线：每步优先选 effects.rel.brothers 最低项（自然单飞、回避手足）。
 */
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
MJ.saveSystem.save = function () {};
var _cur = null;
MJ.ui = { showEvent: function (ev) { _cur = ev; }, showEnding: function (id) { _cur = { kind: 'ended', id: id }; }, showEraCard: function (c, s, cb) { cb(); } };

function relB(o) { var e = (typeof o.effects === 'function') ? o.effects(MJ.engine.state) : (o.effects || {}); return (e.rel && e.rel.brothers) || 0; }
function score(ev, o, weight) { var e = (typeof o.effects === 'function') ? o.effects(MJ.engine.state) : (o.effects || {}); return weight * relB(o) + (e.art || 0); }
function play(weight) {
  MJ.engine.start();
  var g = 0;
  while (g++ < 2000) {
    if (!_cur) return null;
    if (_cur.kind === 'ended') return _cur.id;
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var opts = MJ.engine.optionsOf(_cur);
      var bi = 0, bs = -1e9;
      opts.forEach(function (o, i) { var s = score(_cur, o, weight); if (s > bs) { bs = s; bi = i; } });
      MJ.engine.choose(bi);
      continue;
    }
    return null;
  }
  return null;
}
function brothersOf() { return (MJ.engine.state.relations && MJ.engine.state.relations.brothers) || 0; }
function checkB() { var A = MJ.config.achievements.find(function (a) { return a.id === 'ACH_BROTHERLY'; }); return A.check(MJ.engine.state, { ending: 'x' }); }

play(10);
console.log('[手足路线] 结局=' + _cur.id + '  brothers=' + brothersOf() + '  ACH_BROTHERLY=' + checkB());
play(-10);
console.log('[自私路线] 结局=' + _cur.id + '  brothers=' + brothersOf() + '  ACH_BROTHERLY=' + checkB());
