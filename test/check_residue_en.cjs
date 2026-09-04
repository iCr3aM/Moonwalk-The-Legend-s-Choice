// 其余文本残留扫描（EN 模式）：覆盖结局/成就/彩蛋/元路线/关系/稀有度/章节/事件 epilogue
// 在所有这些命名空间上调用 MJ.t(key, null, 中文回退)，若回退为中文即说明缺 EN 键 → 残留。
// 用法：node test/check_residue_en.cjs  （npm test 调用；命中即非零退出）
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

MJ.i18n.setLang('en');

function zh(x) { return typeof x === 'string' && /[一-鿿]/.test(x); }
var hit = 0;
function rep(tag, s) { if (zh(s)) { hit++; console.log('EN残留 ' + tag + ': ' + (s || '').slice(0, 40)); } }

// 结局
Object.keys(MJ.config.endings).forEach(function (k) {
  var e = MJ.config.endings[k];
  ['name', 'tone', 'summary', 'monologue'].forEach(function (f) {
    if (!e[f]) return;
    rep('ending.' + k + '.' + f, MJ.t('ending.' + k + '.' + f, null, e[f]));
  });
});
// 成就
(MJ.config.achievements || []).forEach(function (a) {
  ['name', 'desc'].forEach(function (f) { rep('ach.' + a.id + '.' + f, MJ.t('ach.' + a.id + '.' + f, null, a[f])); });
});
// 彩蛋（唯一未本地化命名空间）
Object.keys(MJ.eggSystem.defs).forEach(function (k) {
  var d = MJ.eggSystem.defs[k];
  ['name', 'desc'].forEach(function (f) { rep('egg.' + k + '.' + f, MJ.t('egg.' + k + '.' + f, null, d[f])); });
});
// 元路线 / 关系 / 稀有度 / 章节
Object.keys(MJ.config.metaDefs || {}).forEach(function (k) { rep('meta.' + k, MJ.t('meta.' + k, null, MJ.config.metaDefs[k].name)); });
(MJ.config.relationsDefs || []).forEach(function (d) { rep('rel.' + d.key, MJ.t('rel.' + d.key, null, d.name)); });
['common', 'rare', 'epic', 'legendary'].forEach(function (r) { rep('rarity.' + r, MJ.t('rarity.' + r, null, r)); });
Object.keys(MJ.config.chapters || {}).forEach(function (n) {
  var c = MJ.config.chapters[n];
  ['title', 'sub', 'flavor'].forEach(function (f) { if (c[f]) rep('chapter.' + n + '.' + f, MJ.t('chapter.' + n + '.' + f, null, c[f])); });
});
// 事件 epilogue 字段（en_smoke 未扫此字段；经 localizeEvent 兼容函数式 options）
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id]; if (!ev) return;
  var loc;
  try { loc = MJ.localizeEvent(ev, new MJ.GameState()); } catch (e) { return; }
  (loc.options || []).forEach(function (o, i) {
    if (o.epilogue != null) rep('event.' + id + '.opt' + i + '.epilogue', MJ.t('event.' + id + '.opt' + i + '.epilogue', null, o.epilogue));
  });
});

console.log('\nEN 残留扫描（结局/成就/彩蛋/元路线/关系/稀有度/章节/epilogue）：命中 ' + hit);
process.exit(hit ? 1 : 0);
