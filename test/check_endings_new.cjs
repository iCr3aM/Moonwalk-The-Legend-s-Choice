// §17.7 更多结局候选门禁：验证 18 结局均可被构造到达（规则表 1→N 唯一、无悬空），
// 且新增 4 结局（END_STATESMAN / END_INNOVATOR / END_MENTOR / END_RECLUSE_SERENE）已接入 config.endings / endingRarity / EN 文案。
// 复用 smoke.cjs 的 mkEnding 范式（new MJ.GameState() + flags.isSolo + Object.assign），与引擎判定完全一致。
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

function mkEnding(over) {
  var st = new MJ.GameState();
  st.flags.isSolo = true;
  if (over.attr) Object.assign(st.attributes, over.attr);
  if (over.meta) Object.assign(st.meta, over.meta);
  if (over.flags) Object.assign(st.flags, over.flags);
  if (over.timeline) Object.assign(st.timeline, over.timeline);
  if ('debt' in over) st.debt = over.debt;
  return MJ.resolveEnding(st, over.entryId);
}

var ucases = [
  ['END_PLAIN', { entryId: 'END_PLAIN' }],
  ['END_FAMILY', { flags: { isSolo: false } }],
  ['END_RECLUSE', { attr: { health: 60, family: 30, loneliness: 60 }, meta: { recluse: 3 } }],
  ['END_MOGUL', { attr: { family: 50, media: 60, health: 60, wealth: 70, art: 60 }, meta: { mogul: 2 }, debt: false }],
  ['END_PHILANTHROPIST', { attr: { family: 40, wealth: 30, health: 60 }, meta: { phil: 3 }, debt: false }],
  ['END_ETERNAL', { flags: { thriller25: true }, attr: { art: 80, reputation: 70, health: 60, family: 50, media: 60 } }],
  ['END_ART_PEAK', { flags: { isPepsiBurned: true, thisItHeld: true }, attr: { art: 80, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_PERFECT', { attr: { art: 60, reputation: 65, health: 60, family: 50, media: 60 } }],
  ['END_TRAGIC', { flags: { isPepsiBurned: true, painkillerDependent: true, thisItHeld: true }, attr: { art: 50, reputation: 60, health: 45, family: 50, media: 60 } }],
  ['END_CONTROVERSIAL', { flags: { settlement1993: true }, attr: { reputation: 45, media: 60, health: 60 } }],
  ['END_SURVIVE_DEBT', { debt: true, thisItHeld: false, attr: { art: 50, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_FINANCIAL', { debt: true, flags: { thisItHeld: true }, attr: { art: 50, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_TRUE_ETERNAL', { flags: { thriller25: true, anniv2001: true }, attr: { art: 92, reputation: 92, health: 85, stress: 20, family: 50, media: 60 }, meta: { phil: 3, artPath: 2 }, debt: false }],
  ['END_TIMELESS_PRESENT', { flags: { survived2009: true }, attr: { art: 70, reputation: 55, health: 45, wealth: 50, family: 30, media: 40 } }],
  ['END_RECLUSE_SERENE', { meta: { recluse: 3 }, attr: { health: 60, loneliness: 10 } }],
  ['END_INNOVATOR', { meta: { mogul: 1 }, attr: { art: 85 }, flags: { cp_innovation: 85 } }],
  ['END_MENTOR', { meta: { collab: 2 }, attr: { family: 55, art: 65 } }],
  ['END_STATESMAN', { meta: { phil: 3 }, attr: { reputation: 75, family: 60 } }],
  ['END_ALT_STAY_MOTOWN', { timeline: { '1975': 'motown' }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  ['END_ALT_NO_QJ', { timeline: { '1979': 'solo_prod' }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  ['END_ALT_HEALED', { timeline: { '1984': 'safe' }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  ['END_ALT_MEDIA_MOGUL', { timeline: { 'biz': 'empire' }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  ['END_ALT_PEACE_LAUREATE', { flags: { altPeace: true }, meta: { phil: 3 }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  ['END_ALT_SURVIVE_LEGACY', { flags: { survived2009: true }, timeline: { '2009': 'survive' }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  ['END_ALT_QUIET_RETIREE', { flags: { altQuietRetiree: true }, attr: { health: 10, reputation: 10, art: 10, family: 10, wealth: 10 } }],
  // 缺口补结局：需带加冕标志以避开 END_PERFECT(227) 的先手（否则会被 PERFECT 先接走）
  ['END_BURNT_OUT', { flags: { thriller25: true }, attr: { reputation: 85, health: 38, art: 50, family: 30, media: 40 } }],
  ['END_OVERWORKED', { flags: { thriller25: true }, attr: { stress: 90, health: 45, reputation: 60, art: 50, family: 30, media: 40 } }],
  ['END_HOMEBODY', { flags: { isSolo: true, thriller25: true }, attr: { family: 75, health: 60, reputation: 60, art: 50, media: 40 } }],
  ['END_LONELY_KING', { flags: { thriller25: true }, attr: { loneliness: 80, health: 60, reputation: 60, art: 50, family: 20, media: 20 } }],
  ['END_QUIET_LIFE', { flags: { isSolo: true }, attr: { health: 20, reputation: 30, art: 20, family: 20, media: 20, stress: 20, loneliness: 20 } }]
];

var pass = 0, fail = 0, bad = [];
ucases.forEach(function (c) {
  var got = mkEnding(c[1]);
  var ok = got === c[0];
  if (!ok) bad.push(c[0] + '→' + got);
  console.log('  ' + c[0] + ' => ' + (ok ? 'OK' : '实际=' + got));
  if (ok) pass++; else fail++;
});
if (bad.length) console.log('FAIL §17.7 结局解析：' + bad.join(', '));

// 结构校验
var ids = Object.keys(MJ.config.endings);
var altIds = ids.filter(function (id) { return id.indexOf('END_ALT_') === 0; });
// 18 个原始 canonical + 2026-09-07 覆盖缺口补的 5 个（燃尽 / 过劳 / 归家 / 孤高 / 平淡）
var CANONICAL_EXPECTED = 18 + 5;
if (ids.length !== CANONICAL_EXPECTED + altIds.length) { console.log('FAIL 结局总数应为 ' + CANONICAL_EXPECTED + '+alt(' + altIds.length + ')，实际 ' + ids.length); fail++; } else { pass++; console.log('  结局总数 ' + ids.length + '（' + CANONICAL_EXPECTED + ' canonical + ' + altIds.length + ' alt）✓'); }
ids.forEach(function (id) { if (!MJ.config.endingRarity[id]) { console.log('FAIL 缺 endingRarity: ' + id); fail++; } });

// 新结局 EN 文案
altIds.concat(['END_STATESMAN', 'END_INNOVATOR', 'END_MENTOR', 'END_RECLUSE_SERENE',
  'END_BURNT_OUT', 'END_OVERWORKED', 'END_HOMEBODY', 'END_LONELY_KING', 'END_QUIET_LIFE']).forEach(function (id) {
  ['name', 'tone', 'summary', 'monologue'].forEach(function (f) {
    if (!MJ.i18n.dict.en['ending.' + id + '.' + f]) { console.log('FAIL 缺 EN: ending.' + id + '.' + f); fail++; }
  });
});

console.log('\n§17.7 结局门禁：通过 ' + pass + '，失败 ' + fail);
process.exit(fail ? 1 : 0);
