// i18n 全量覆盖校验：断言「每条 id 都有 EN 词条」，聚焦用户指定的集合：
//   65 变体（event.<id>.title/text，存于 eventEn）
//   56 成就（ach.<id>.name/desc）
//   8 彩蛋（egg.<id>.name/desc）
//   24 趣事（trivia.<id>.name/desc）
//   12 语录（quote.<id>.text；name 未本地化，仅校验 text）
// 做法：置 lang='en'，对每个 (id, field) 调 MJ.t(key, null, SENTINEL)，
//   缺失（回退到 SENTINEL）或仍为中文（zh 回退）→ 判 FAIL。
// 用法：node test/check_i18n_coverage.cjs  （建议接入 npm test）
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;
MJ.i18n.setLang('en');

var SENTINEL = '__MISSING__';
function zh(x) { return typeof x === 'string' && /[一-鿿]/.test(x); }

var groups = [];
groups.push({ tag: '变体', ids: Object.keys(MJ.EVENTS).filter(function (k) { var e = MJ.EVENTS[k]; return e && e.variant; }), fields: ['title', 'text'], ns: function (id) { return 'event.' + id; } });
groups.push({ tag: '成就', ids: (MJ.config.achievements || []).map(function (a) { return a.id; }), fields: ['name', 'desc'], ns: function (id) { return 'ach.' + id; } });
groups.push({ tag: '彩蛋', ids: Object.keys(MJ.eggSystem ? MJ.eggSystem.defs : {}), fields: ['name', 'desc'], ns: function (id) { return 'egg.' + id; } });
groups.push({ tag: '趣事', ids: Object.keys(MJ.triviaSystem ? MJ.triviaSystem.defs : {}), fields: ['name', 'desc'], ns: function (id) { return 'trivia.' + id; } });
groups.push({ tag: '语录', ids: Object.keys(MJ.quoteSystem ? MJ.quoteSystem.defs : {}), fields: ['text'], ns: function (id) { return 'quote.' + id; } });

var fail = 0, total = 0;
groups.forEach(function (g) {
  g.ids.forEach(function (id) {
    g.fields.forEach(function (f) {
      total++;
      var key = g.ns(id) + '.' + f;
      var v = MJ.t(key, null, SENTINEL);
      if (v === SENTINEL || zh(v)) {
        fail++;
        console.log('FAIL 缺 EN: ' + key + (v === SENTINEL ? '（无词条）' : '（回退中文）'));
      }
    });
  });
  console.log('  ' + g.tag + '：' + g.ids.length + ' 条 id x ' + g.fields.length + ' 字段');
});

console.log('\ni18n 覆盖校验：字段总数 ' + total + '；缺失/残留 ' + fail);
process.exit(fail ? 1 : 0);
