// 兜底缺口「确定性探针」：构造掉出所有专属结局条件的状态，看会落到哪个结局。
// 目的：证明「无烧伤、无依赖、无负债」的玩家也会被判成"历史悲剧"（文案写烧伤/依赖宿命）。
global.window = global;
var fs = require('fs');
var path = require('path');
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
global.MJ = global.MJ || {};
var MJ = global.MJ;
MJ.t = function (k, v, fb) { return fb != null ? fb : k; };
require('../js/config.js');
require('../js/state.js');
require('../js/events.js');
require('../js/planner.js');
require('../js/engine.js');

function base() {
  var st = new MJ.GameState();
  st.flags.isPepsiBurned = false;   // 未烧伤
  st.flags.painkillerDependent = false; // 未依赖
  st.flags.thisItHeld = true;
  st.flags.isSolo = true;
  st.netWorth = 30000; st.debt = false; st.attributes.wealth = 50;
  st.attributes.family = 30; st.attributes.media = 50; st.attributes.loneliness = 20;
  st.meta = { phil: 0, mogul: 0, recluse: 0, artPath: 0, collab: 0, grammyWins: 0 };
  st.timeline = {};
  return st;
}
function mk(name, over) {
  var st = base();
  over(st);
  var e = MJ.resolveEnding(st, 'FAKE');
  var def = MJ.config.endings[e] || {};
  return {
    name: name, ending: e, nameZh: def.name || '?',
    health: st.attributes.health, rep: st.attributes.reputation, art: st.attributes.art,
    burned: !!st.flags.isPepsiBurned, dependent: !!st.flags.painkillerDependent,
    summary: def.summary || ''
  };
}
var cases = [
  mk('A 健康35/声誉94/艺术50（无烧伤无依赖）', function (s) { s.attributes.health = 35; s.attributes.reputation = 94; s.attributes.art = 50; }),
  mk('B 健康38/声誉55/艺术50', function (s) { s.attributes.health = 38; s.attributes.reputation = 55; s.attributes.art = 50; }),
  mk('C 健康30/声誉90/艺术75（无加冕标志）', function (s) { s.attributes.health = 30; s.attributes.reputation = 90; s.attributes.art = 75; }),
  mk('D 健康35/声誉94 + 有 Thriller25 加冕', function (s) { s.attributes.health = 35; s.attributes.reputation = 94; s.attributes.art = 50; s.flags.thriller25 = true; }),
  mk('E 健康35/声誉94 + collab1/家庭50', function (s) { s.attributes.health = 35; s.attributes.reputation = 94; s.attributes.art = 50; s.meta.collab = 1; s.attributes.family = 50; }),
  mk('F 健康44/声誉47（刚过兜底线）', function (s) { s.attributes.health = 44; s.attributes.reputation = 47; s.attributes.art = 50; }),
  mk('G 健康20/声誉30/艺术20（全面低迷）', function (s) { s.attributes.health = 20; s.attributes.reputation = 30; s.attributes.art = 20; })
];

var L = [];
L.push('兜底缺口确定性探针（构造状态，非随机）');
L.push('');
var mismatchCount = 0;
cases.forEach(function (c) {
  var mismatch = '';
  if (c.ending === 'END_TRAGIC' && !c.burned && !c.dependent) {
    mismatch = '  ← ❌ 文案矛盾：未烧伤/未依赖，却判「历史悲剧」（' + c.summary + '）';
    mismatchCount++;
  }
  L.push('  ' + c.name);
  L.push('      健康=' + c.health + ' 声誉=' + c.rep + ' 艺术=' + c.art + ' 烧伤=' + (c.burned ? 'Y' : 'N') + ' 依赖=' + (c.dependent ? 'Y' : 'N') + ' → ' + c.ending + ' ' + c.nameZh + mismatch);
});
var outPath = path.join(__dirname, '..', '.codebuddy', 'fallback_probe.txt');
fs.writeFileSync(outPath, L.join('\n'), 'utf8');
console.log('WROTE ' + outPath);

// ---------- 回归门禁判定（供 npm test 接⼊） ----------
// 任何"未烧伤、未依赖"的构造状态都不应被判成「历史悲剧」（其文案依赖烧伤/依赖宿命）。
var failed = mismatchCount > 0;
if (failed) {
  console.error('FAIL 兜底缺口探针：' + mismatchCount + ' 例未烧伤/未依赖却被判「历史悲剧」');
  process.exit(1);
}
console.error('PASS 兜底缺口探针：无烧伤/依赖的构造状态均不落入「历史悲剧」');
