// §17.3 主线偏薄章节 + §17.8 生平补全事件 可达性门禁
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

var _cur = null, _visited = {};
MJ.ui = { showEvent: function (ev) { _cur = ev; }, showEnding: function (id) { _cur = { kind: 'ended', id: id }; }, showEraCard: function (c, s, cb) { cb(); } };

function walkFrom(id) {
  var _origPick = MJ.engine.pickVariant;
  MJ.engine.pickVariant = function () { return null; }; // 仅走纯主线，隔离 §17.3 单飞链路可达性（变体插入由下方循环单独验证）
  try {
    _visited = {};
    MJ.engine.start();
    MJ.engine.state.flags.isSolo = true;
    MJ.engine.go(id);
    var guard = 0;
    while (guard++ < 400) {
      if (!_cur) return;
      if (_cur.id) _visited[_cur.id] = true;
      if (_cur.kind === 'ended') return;
      if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
      if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
      if (_cur.kind === 'choice') { MJ.engine.choose(0); continue; }
      return;
    }
  } finally {
    MJ.engine.pickVariant = _origPick; // 恢复，避免污染后续变体插入检查
  }
}

var pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('✅', name); } else { fail++; console.log('❌', name); } }

// §17.3：2_7 在单飞线 2_6→2_7→3_1 上可达
check('2_7 节点存在且各选项 next=3_1', MJ.EVENTS['2_7'] && MJ.EVENTS['2_7'].options && MJ.EVENTS['2_7'].options.every(function (o) { return o.next === '3_1'; }));
check('2_6 三选项均指向 2_7', MJ.EVENTS['2_6'].options.every(function (o) { return o.next === '2_7'; }));
walkFrom('2_4');
check('单飞线途经 2_7（Diana Ross 合作深化）', !!_visited['2_7']);

// §17.8：生平补全事件核实
check('3_5《We Are The World》主线事件存在', !!MJ.EVENTS['3_5'] && MJ.EVENTS['3_5'].kind === 'choice');
var vbio = ['V_BIO_WIZ', 'V_BIO_MOTOWN25', 'V_BIO_GRAMMY84', 'V_BIO_BADTOUR', 'V_BIO_HISTORYTOUR', 'V_BIO_911', 'V_BIO_FREDDIE', 'V_BIO_SBOWL'];
check('§17.8 生平补全变体全部注册', vbio.every(function (id) { return MJ.EVENTS[id] && MJ.EVENTS[id].variant === true; }));

// 变体可插入性：禁用其它变体 + 目标权重置 100 + 设 engine.state，pickVariant(窗口年) 必返回目标
var variants = Object.keys(MJ.EVENTS).filter(function (id) { return MJ.EVENTS[id].variant === true; });
var saved = {};
variants.forEach(function (id) { saved[id] = MJ.EVENTS[id].window.slice(); });
var allOk = true;
variants.forEach(function (id) {
  var v = MJ.EVENTS[id];
  var Y = Math.floor((v.window[0] + v.window[1]) / 2);
  variants.forEach(function (x) { if (x !== id) MJ.EVENTS[x].window = [3000, 3001]; });
  var savedW = v.weight; v.weight = 100;
  var savedCond = v.cond; v.cond = null; // 仅验证窗口+权重插入门禁；cond 门控由 e2e/成就测试覆盖
  var st = new MJ.GameState(MJ.config);
  if (id === 'V_POST_HOLO') st.attributes.art = 90;
  if (id === 'V_POST_FAMILY') st.flags.sonySold = true;
  MJ.engine.state = st;
  MJ.engine._usedVariants = {};
  var got = MJ.engine.pickVariant(Y);
  if (got !== id) { allOk = false; console.log('  变体不可插入: ' + id + ' (got ' + got + ')'); }
  v.weight = savedW;
  v.cond = savedCond;
  variants.forEach(function (x) { MJ.EVENTS[x].window = saved[x]; });
});
check('全部生平/续章变体均可按窗口插入', allOk);

console.log('\n§17.3/§17.8 门禁：通过 ' + pass + '，失败 ' + fail);
process.exit(fail ? 1 : 0);
