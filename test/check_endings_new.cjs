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
  ['END_STATESMAN', { meta: { phil: 2 }, attr: { reputation: 75, family: 60 } }]
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
if (ids.length !== 18) { console.log('FAIL 结局总数应为 18，实际 ' + ids.length); fail++; } else { pass++; console.log('  结局总数 18 ✓'); }
ids.forEach(function (id) { if (!MJ.config.endingRarity[id]) { console.log('FAIL 缺 endingRarity: ' + id); fail++; } });

// 新结局 EN 文案
['END_STATESMAN', 'END_INNOVATOR', 'END_MENTOR', 'END_RECLUSE_SERENE'].forEach(function (id) {
  ['name', 'tone', 'summary', 'monologue'].forEach(function (f) {
    if (!MJ.i18n.dict.en['ending.' + id + '.' + f]) { console.log('FAIL 缺 EN: ending.' + id + '.' + f); fail++; }
  });
});

console.log('\n§17.7 结局门禁：通过 ' + pass + '，失败 ' + fail);
process.exit(fail ? 1 : 0);
