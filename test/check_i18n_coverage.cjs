// i18n 全量覆盖校验：断言「每条 id 都有 EN 词条」，聚焦用户指定的集合：
//   65 变体（event.<id>.title/text，存于 eventEn）
//   56 成就（ach.<id>.name/desc）
//   8 彩蛋（egg.<id>.name/desc）
//   24 趣事（trivia.<id>.name/desc）
//   （语录图鉴已移除，故不再校验 quote.*）
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

console.log('\ni18n 覆盖校验（变体/成就/彩蛋/趣事）：字段总数 ' + total + '；缺失/残留 ' + fail);

// ---------- 第二阶段：字典内全部 EN 词条质量校验 ----------
// 置 lang='zh'，用 MJ.t(key, null, SENTINEL) 取「中文回退字面量」；
// 若 EN 值与其完全相同，说明该词条只是把中文原样回填（未真正翻译）→ FAIL。
MJ.i18n.setLang('zh');
var enDict = MJ.i18n.dict.en;
var covTotal = 0, emptyFail = 0, sameFail = 0;
Object.keys(enDict).forEach(function (key) {
  covTotal++;
  var en = enDict[key];
  if (typeof en !== 'string' || !en.trim()) {
    // 空串仅当「中文回退也非空」才算缺失；设计为空的占位（如 suffix）放行
    var zhFb0 = MJ.t(key, null, SENTINEL);
    if (zhFb0 !== SENTINEL && zhFb0.trim() !== '') { emptyFail++; console.log('FAIL EN 空值(中文非空): ' + key); }
    return;
  }
  var zhFb = MJ.t(key, null, SENTINEL);
  if (zhFb !== SENTINEL && zhFb === en) { sameFail++; console.log('FAIL EN 未翻译(等于中文回退): ' + key); }
});
MJ.i18n.setLang('en');
console.log('EN 词条质量：检查 ' + covTotal + ' 条；空值 ' + emptyFail + '；未翻译(等于中文) ' + sameFail);

// ---------- 第三阶段：扫描 ui.js 中所有“字面量” i18n 键，断言 EN 字典含该键、非空且无中文残留 ----------
// 仅匹配 T('key', ...) / T("key", ...) 形式（key 为完整字面量，不含字符串拼接），
// 避免把 T('ending.' + k + '.name') 这类动态键误判。覆盖 ui.* 等 chrome 字符串。
var fs = require('fs');
var srcUi = fs.readFileSync(__dirname + '/../js/ui.js', 'utf8');
var keyRe = /T\(['"]([a-zA-Z0-9_.]+)['"](?=\s*[,)])/g;
var km, foundKeys = {}, uiScanFail = 0, uiScanCjk = 0;
while ((km = keyRe.exec(srcUi))) { foundKeys[km[1]] = true; }
Object.keys(foundKeys).forEach(function (key) {
  var en = enDict[key];
  if (typeof en !== 'string' || !en.trim()) {
    // 空串放行：仅当「中文回退也非空」才算真正缺失（如 ui.tendSuffix/ui.metaRouteSuffix 设计为占位空串）
    var zhFb0 = MJ.t(key, null, SENTINEL);
    if (zhFb0 !== SENTINEL && zhFb0.trim() !== '') { uiScanFail++; console.log('FAIL UI键 EN缺失: ' + key); }
    return;
  }
  if (zh(en)) { uiScanCjk++; console.log('FAIL UI键 EN含中文(未翻译): ' + key + ' -> ' + en); }
});
console.log('UI字面量键扫描：' + Object.keys(foundKeys).length + ' 个键；EN缺失 ' + uiScanFail + '；EN含中文 ' + uiScanCjk);

var allFail = fail + emptyFail + sameFail + uiScanFail + uiScanCjk;
console.log('\n=== 合计 FAIL: ' + allFail + ' ===');
process.exit(allFail ? 1 : 0);
