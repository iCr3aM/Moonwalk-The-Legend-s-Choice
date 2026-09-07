// 结局「可达性 + 状态/文案符合性」全量审计（真实引擎驱动，非假模拟）
// 重点复检老 bug：净资产为正却判「财务崩溃 / 生存但负债」。
// 运行：node test/_audit_endings_full.cjs [N]
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

MJ.localizeEvent = function (ev, state) {
  var st = state || (MJ.engine && MJ.engine.state) || {};
  var copy = Object.assign({}, ev);
  if (typeof copy.options === 'function') copy.options = copy.options(st);
  if (typeof copy.text === 'function') copy.text = copy.text(st);
  return copy;
};
MJ.ui = {
  showEvent: function () {},
  showEraCard: function (c, s, cb) { cb(); },
  showEnding: function () {},
  toastEgg: function () {},
  toastTrivia: function () {},
  showModal: function () {}
};

var resolvedEndingId = null;
MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function runPlaythrough(seed) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = Math.floor(rng() * opts.length) % opts.length;
    MJ.engine.choose(idx);
  }
  var st = MJ.engine.state;
  return {
    ending: resolvedEndingId,
    netWorth: st.netWorth,
    wealth: st.attributes.wealth,
    health: st.attributes.health,
    reputation: st.attributes.reputation,
    art: st.attributes.art,
    family: st.attributes.family,
    debt: st.debt,
    meta: Object.assign({}, st.meta),
    flags: Object.assign({}, st.flags),
    timeline: Object.assign({}, st.timeline || {}),
    dom: MJ.dominantMeta(st.meta)
  };
}

var N = Number(process.argv[2] || 8000);
var stats = {};
var problems = [];
function addProblem(kind, ending, detail) {
  var key = kind + '|' + ending;
  var p = null;
  for (var i = 0; i < problems.length; i++) if (problems[i].key === key) p = problems[i];
  if (!p) { p = { key: key, kind: kind, ending: ending, count: 0, samples: [] }; problems.push(p); }
  p.count++;
  if (p.samples.length < 3) p.samples.push(detail);
}

for (var i = 0; i < N; i++) {
  var r = runPlaythrough(90000 + i);
  if (!r.ending) continue;
  var s = stats[r.ending];
  if (!s) {
    s = stats[r.ending] = {
      count: 0, nwMin: Infinity, nwMax: -Infinity, hMin: Infinity, hMax: -Infinity,
      rMin: Infinity, rMax: -Infinity, wMin: Infinity, wMax: -Infinity,
      burned: 0, dependent: 0, held: 0, doms: {}
    };
  }
  s.count++;
  s.nwMin = Math.min(s.nwMin, r.netWorth); s.nwMax = Math.max(s.nwMax, r.netWorth);
  s.hMin = Math.min(s.hMin, r.health); s.hMax = Math.max(s.hMax, r.health);
  s.rMin = Math.min(s.rMin, r.reputation); s.rMax = Math.max(s.rMax, r.reputation);
  s.wMin = Math.min(s.wMin, r.wealth); s.wMax = Math.max(s.wMax, r.wealth);
  if (r.flags.isPepsiBurned) s.burned++;
  if (r.flags.painkillerDependent) s.dependent++;
  if (r.flags.thisItHeld) s.held++;
  var dk = String(r.dom); s.doms[dk] = (s.doms[dk] || 0) + 1;

  var f = r.flags, m = r.meta;

  // P0：负债类结局 ↔ 净资产（老 bug 复检）
  if (r.ending === 'END_FINANCIAL' || r.ending === 'END_SURVIVE_DEBT') {
    if (r.netWorth >= 0) addProblem('P0 负债结局但净资产≥0', r.ending, 'netWorth=' + r.netWorth + '  wealth=' + r.wealth);
    if (r.debt !== (r.netWorth < 0)) addProblem('P0 debt标志与净资产不一致', r.ending, 'debt=' + r.debt + ' netWorth=' + r.netWorth);
  }
  // P1：结局文案所描述的状态 ⇄ 实际达成状态
  if (r.ending === 'END_TRAGIC' && !f.isPepsiBurned && !f.painkillerDependent) {
    addProblem('P1 悲剧结局但无烧伤无依赖（默认兜底）', r.ending, 'health=' + r.health + ' rep=' + r.reputation + ' 烧伤=0 依赖=0');
  }
  if (r.ending === 'END_MOGUL' && !(r.wealth >= 60)) addProblem('P1 商业巨擘但财富<60', r.ending, 'wealth=' + r.wealth);
  if (r.ending === 'END_FAMILY' && f.isSolo !== false) addProblem('P1 家庭结局但isSolo≠false', r.ending, 'isSolo=' + f.isSolo);
  if (r.ending === 'END_MENTOR' && !((m.collab || 0) >= 1)) addProblem('P1 提携后辈但collab<1', r.ending, 'collab=' + (m.collab || 0));
  if ((r.ending === 'END_RECLUSE' || r.ending === 'END_RECLUSE_SERENE') && r.dom !== 'recluse') {
    addProblem('P1 隐士结局但主导路线≠隐士', r.ending, 'dom=' + r.dom);
  }
  if (r.ending === 'END_CONTROVERSIAL' && !(f.settlement1993 || f.secondCharge)) {
    addProblem('P1 争议结局但无和解/指控标志', r.ending, 'settlement1993=' + !!f.settlement1993 + ' secondCharge=' + !!f.secondCharge);
  }
  if (r.ending === 'END_INNOVATOR' && !((f.cp_innovation || 0) >= 80)) {
    addProblem('P1 先驱结局但创新值<80', r.ending, 'cp_innovation=' + (f.cp_innovation || 0));
  }
  if ((r.ending === 'END_STATESMAN' || r.ending === 'END_PHILANTHROPIST') && r.dom !== 'phil') {
    addProblem('P1 慈善结局但主导路线≠慈善', r.ending, 'dom=' + r.dom);
  }
  if (r.ending === 'END_ETERNAL' && !(r.art >= 60 && r.reputation >= 56 && r.health >= 42 && (f.thriller25 || f.anniv2001))) {
    addProblem('P1 永恒符号但条件不足', r.ending, 'art=' + r.art + ' rep=' + r.reputation + ' health=' + r.health);
  }
  // alt 结局：文案依赖时间线/标志，缺标志即文案失真
  if (r.ending === 'END_ALT_HEALED') {
    if (f.isPepsiBurned) addProblem('P1 安康结局但已烧伤', r.ending, 'isPepsiBurned=true');
    else if (r.timeline['1984'] !== 'safe') addProblem('P1 alt结局缺时间线标志', r.ending, 'tl1984=' + r.timeline['1984']);
  }
  if (r.ending === 'END_ALT_STAY_MOTOWN' && r.timeline['1975'] !== 'motown') addProblem('P1 alt结局缺时间线标志', r.ending, 'tl1975=' + r.timeline['1975']);
  if (r.ending === 'END_ALT_NO_QJ' && r.timeline['1979'] !== 'solo_prod') addProblem('P1 alt结局缺时间线标志', r.ending, 'tl1979=' + r.timeline['1979']);
  if (r.ending === 'END_ALT_MEDIA_MOGUL' && r.timeline['biz'] !== 'empire') addProblem('P1 alt结局缺时间线标志', r.ending, 'tlbiz=' + r.timeline['biz']);
  if (r.ending === 'END_ALT_PEACE_LAUREATE' && f.altPeace !== true) addProblem('P1 alt结局缺标志', r.ending, 'altPeace=' + f.altPeace);
  if (r.ending === 'END_ALT_QUIET_RETIREE' && f.altQuietRetiree !== true) addProblem('P1 alt结局缺标志', r.ending, 'altQuietRetiree=' + f.altQuietRetiree);
  if (r.ending === 'END_ALT_SURVIVE_LEGACY' && r.timeline['2009'] !== 'survive') addProblem('P1 alt结局缺时间线标志', r.ending, 'tl2009=' + r.timeline['2009']);
  if (r.ending === 'END_TIMELESS_PRESENT' && f.survived2009 !== true) addProblem('P1 续章结局但无续章标志', r.ending, 'survived2009=' + f.survived2009);
  if (r.ending === 'END_PERFECT' && r.health < 32) addProblem('P2 完美传奇但健康<32', r.ending, 'health=' + r.health);
}

// ---------- 输出 ----------
var L = [];
L.push('结局可达性 + 状态/文案符合性审计  N=' + N + '（真实引擎 + 变体注入）');
L.push('');
L.push('=== 一、可达性（随机真实游玩命中分布） ===');
L.push('结局'.padEnd(26) + '次数'.padStart(6) + '占比'.padStart(8) + '  净资产区间(万)'.padEnd(24) + '健康'.padEnd(10) + '声誉'.padEnd(10) + '财富'.padEnd(10) + '烧伤%'.padStart(6) + '依赖%'.padStart(6));
var ids = Object.keys(MJ.config.endings);
var reached = Object.keys(stats);
ids.forEach(function (id) {
  var s = stats[id];
  var name = MJ.config.endings[id] ? MJ.config.endings[id].name : id;
  if (!s) { L.push((id + ' ' + name).padEnd(26) + String(0).padStart(6) + '   —— 本轮随机游玩未现身'); return; }
  var pct = (s.count / N * 100).toFixed(2) + '%';
  var nw = s.nwMin === s.nwMax ? String(s.nwMin) : (s.nwMin + ' ~ ' + s.nwMax);
  L.push((id + ' ' + name).padEnd(26) + String(s.count).padStart(6) + pct.padStart(8) +
    '  ' + nw.padEnd(22) +
    (s.hMin + '-' + s.hMax).padEnd(10) + (s.rMin + '-' + s.rMax).padEnd(10) + (s.wMin + '-' + s.wMax).padEnd(10) +
    ((s.burned / s.count * 100).toFixed(0) + '%').padStart(6) + ((s.dependent / s.count * 100).toFixed(0) + '%').padStart(6));
});
L.push('');
L.push('结局总数=' + ids.length + '  本轮现身=' + reached.length + '  未现身=' + (ids.length - reached.length));

L.push('');
L.push('=== 二、定向复现：曾短暂负债后挣回，是否仍判财务崩溃（老 bug） ===');
(function () {
  var st = new MJ.GameState();
  st.flags.thisItHeld = true;
  st.applyMoney(-500);
  st.applyMoney(20000);
  var e = MJ.resolveEnding(st, 'FAKE');
  L.push('  debt=' + st.debt + '  netWorth=' + st.netWorth + '(万)  wealth=' + st.attributes.wealth + '  → ' + e +
    (e === 'END_FINANCIAL' ? '  ❌ 仍矛盾' : '  ✅ 已修复（不再因历史负债误判）'));
})();

L.push('');
L.push('=== 三、状态 / 文案符合性问题 ===');
if (!problems.length) L.push('  未发现矛盾。');
problems.sort(function (a, b) { return b.count - a.count; });
problems.forEach(function (p) {
  L.push('  [' + p.kind + '] ' + p.ending + '  命中 ' + p.count + ' 次');
  p.samples.forEach(function (s2) { L.push('      例：' + s2); });
});

var outPath = path.join(__dirname, '..', '.codebuddy', 'endings_audit.txt');
fs.writeFileSync(outPath, L.join('\n'), 'utf8');
console.log('WROTE ' + outPath);
console.log('ENDINGS=' + ids.length + ' REACHED=' + reached.length + ' PROBLEMS=' + problems.length);

// ---------- 回归门禁判定（供 npm test 接⼊，发现矛盾即 fail） ----------
var failed = problems.length > 0;
if (failed) {
  console.error('FAIL 结局状态/文案符合性：发现 ' + problems.length + ' 类矛盾（详见 ' + outPath + '）');
  process.exit(1);
}
console.error('PASS 结局状态/文案符合性：PROBLEMS=0（含负债/依赖/加冕/架空标志等不变量）');
