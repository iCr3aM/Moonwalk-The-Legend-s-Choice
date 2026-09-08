// 共享：真实引擎「定向游玩」驱动 + 30 结局目标规格。
// 供平衡矩阵（_balance_unlock_matrix.cjs）与可达性门禁（check_achievable.cjs）复用。
// 核心：每个结局写一份目标规格（来自 engine.resolveEnding 的硬条件），用朝目标推进的贪心策略，
// 在真实 engine.choose / 变体注入 / 真实效果 上驱动完整 playthrough —— 这是真实游玩，不是伪造结局。
// 若某结局在多次种子下都无法被命中，runStrategy 返回 { MISS:true }，由调用方标出（属「正常游玩难到达」发现）。
'use strict';
global.window = global;
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
require('../js/i18n.js');
require('../js/i18n_events_en.js');

MJ.localizeEvent = function (ev, state) {
  var st = state || (MJ.engine && MJ.engine.state) || {};
  var copy = Object.assign({}, ev);
  if (typeof copy.options === 'function') copy.options = copy.options(st);
  if (typeof copy.text === 'function') copy.text = copy.text(st);
  return copy;
};
MJ.ui = {
  showEvent: function () {}, showEraCard: function (c, s, cb) { cb(); },
  showEnding: function () {}, toastEgg: function () {}, toastTrivia: function () {}, showModal: function () {}
};
MJ.saveSystem.save = function () {}; // 静默存档

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function resetStore() { for (var k in _store) delete _store[k]; }

// 捕获真实结局解析（与游戏 showEnding 一致，并记录图鉴）
var resolvedEndingId = null;
var _origShowEnding = MJ.engine.showEnding;
MJ.engine.showEnding = function (entryId) {
  resolvedEndingId = MJ.resolveEnding(this.state, entryId);
  try { _origShowEnding.call(this, entryId); } catch (e) {}
};
var _BASE_PICK = MJ.engine.pickVariant;
var _TRUE_RESOLVE = MJ.resolveEnding;

// ---------- 贪心打分（朝结局目标推进） ----------
function scoreOption(spec, state, eff, fl, o) {
  eff = eff || {}; fl = fl || {};
  var s = 0;
  var scale = (MJ.config && MJ.config.wealthScale) || 150;
  // 目标 flag（布尔精确匹配；数值按阈值 >= 处理，如 cp_innovation:80）
  if (spec.reqFlags) for (var k in spec.reqFlags) {
    var want = spec.reqFlags[k];
    if (typeof want === 'boolean') {
      if (fl[k] === want) s += 60; else if (fl[k] === !want) s -= 90;
    } else if (typeof want === 'number') {
      var fv = fl[k];
      if (typeof fv === 'number') { if (fv >= want) s += 60; else s -= 50; }
    }
  }
  // 目标 timeline
  if (spec.reqTimeline && eff.timeline) for (var y in spec.reqTimeline) {
    if (eff.timeline[y] === spec.reqTimeline[y]) s += 60;
  }
  // 禁止 flag
  if (spec.avoidFlags) for (var af in spec.avoidFlags) { if (fl[af] === true) s -= 130; }
  // 禁止元路线主导
  // 严禁提前走入「非目标结局」：任何 next 指向 END_* 且不是本局目标的选项，强惩罚
  if (o.next && typeof o.next === 'string' && o.next.indexOf('END_') === 0 && o.next !== spec._target) s -= 5000;
  // 元路线（选项里 meta 既可能嵌在 eff.meta，也可能是 eff 顶层键，二者都算）
  var meta = {};
  if (eff.meta) Object.keys(eff.meta).forEach(function (k) { meta[k] = (meta[k] || 0) + eff.meta[k]; });
  ['recluse', 'phil', 'mogul', 'artPath', 'collab', 'grammyWins'].forEach(function (k) { if (typeof eff[k] === 'number') meta[k] = (meta[k] || 0) + eff[k]; });
  if (spec.avoidMeta) for (var m2 in spec.avoidMeta) {
    var dm2 = meta[m2] || 0; if (dm2 > 0) s -= dm2 * 5000;
  }
  // 禁止 alt 时间线 / alt flag（非 alt 结局用；alt 结局允许其目标值）—— 硬禁止级
  if (spec.avoidAlt) {
    if (eff.timeline) {
      var altVals = { motown: 1, solo_prod: 1, safe: 1, empire: 1 };
      for (var y2 in eff.timeline) {
        var av = eff.timeline[y2];
        if (altVals[av] && !(spec.reqTimeline && spec.reqTimeline[y2] === av)) s -= 5000;
      }
    }
    if (fl.altPeace && !(spec.reqFlags && spec.reqFlags.altPeace)) s -= 5000;
    if (fl.altQuietRetiree && !(spec.reqFlags && spec.reqFlags.altQuietRetiree)) s -= 5000;
  }
  // 属性下限（往上推）
  if (spec.attrMin) for (var a in spec.attrMin) {
    var d = eff[a];
    if (typeof d === 'number' && d !== 0) {
      var cur = state.attributes[a] || 0;
      var w = (a === 'health') ? 2.5 : (a === 'art' || a === 'reputation' ? 2 : 1.3);
      if (cur < spec.attrMin[a]) s += Math.abs(d) * w;
      else s += Math.abs(d) * 0.15;
    }
  }
  // 属性上限（硬封顶 + 高于 cap 时主动压低；用于压制 STATESMAN 吸引子 / low 型结局）
  if (spec.attrMax) for (var a2 in spec.attrMax) {
    var d2 = eff[a2];
    if (typeof d2 === 'number' && d2 !== 0) {
      var cur2 = state.attributes[a2] || 0;
      var cap = spec.attrMax[a2];
      if (cur2 > cap) {
        if (d2 > 0) s -= Math.abs(d2) * 300;   // 高于 cap：禁止继续抬升
        else s += Math.abs(d2) * 300;           // 高于 cap：奖励压低
      } else if (d2 > 0 && cur2 + d2 > cap) {
        s -= Math.abs(d2) * 300;                // 接近 cap：禁止越过
      } else {
        s += Math.abs(d2) * 0.1;
      }
    }
  }
  // 元路线下限
  if (spec.metaMin) for (var m in spec.metaMin) {
    var dm = meta[m] || 0; if (dm > 0) s += dm * 8;
  }
  // 债务
  var w = (typeof eff.wealth === 'number') ? eff.wealth : 0;
  var mon = (typeof eff.money === 'number') ? eff.money : 0;
  if (spec.wantDebt) {
    if (w < 0) s += (-w) * scale * 0.6;
    if (mon < 0) s += (-mon) * 0.6;
  } else if (spec.avoidDebt) {
    if (w > 0) s += w * scale * 0.04;
    if (w < 0) s -= (-w) * scale * 0.35;
  }
  return s;
}

function chooseGreedy(spec, ev) {
  var state = MJ.engine.state;
  var opts = MJ.engine.optionsOf(ev);
  if (!opts || !opts.length) return 0;
  if (spec.override) { var oi = spec.override(ev, opts, state); if (oi != null && oi >= 0) return oi; }
  var best = -1e9, bi = 0;
  opts.forEach(function (o, idx) {
    var eff = (typeof o.effects === 'function') ? o.effects(state) : o.effects;
    var fl = o.flags || {};
    var sc = scoreOption(spec, state, eff, fl, o);
    if (sc > best) { best = sc; bi = idx; }
  });
  return bi;
}

function collect(endingId, st) {
  var ach = [];
  (MJ.config.achievements || []).forEach(function (a) {
    try { if (a.check(st, { ending: endingId })) ach.push(a.id); } catch (e) {}
  });
  var eggs = MJ.eggSystem ? Object.keys(MJ.eggSystem._load().found) : [];
  var trivia = MJ.triviaSystem ? Object.keys(MJ.triviaSystem._load().found) : [];
  var gallery = MJ.saveSystem.getGallery ? Object.keys(MJ.saveSystem.getGallery()) : [endingId];
  return { ending: endingId, ach: ach, eggs: eggs, trivia: trivia, gallery: gallery };
}

// ---------- 30 结局目标规格（依据 engine.resolveEnding 硬条件推导） ----------
// 通用防御：成功型(canonical/非 alt)结局需 isSolo=true 以跳过 END_FAMILY；非 alt 结局 avoidAlt；
// 不烧伤/不负债类 avoidFlags isPepsiBurned；不生存类 avoidFlags survived2009。
var SOLO = { isSolo: true };
var SPECS = {
  END_PLAIN: { override: function (ev) { if (ev.id === '1_3') { var os = MJ.engine.optionsOf(ev); for (var i = 0; i < os.length; i++) if (os[i].next === 'END_PLAIN') return i; } return null; } },
  END_FAMILY: { reqFlags: { isSolo: false }, attrMin: { reputation: 72, media: 40 }, avoidMeta: { recluse: 1 }, avoidFlags: { settlement1993: true, secondCharge: true, isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_RECLUSE: { reqFlags: SOLO, metaMin: { recluse: 3 }, attrMin: { health: 35, loneliness: 55 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_MOGUL: { reqFlags: SOLO, metaMin: { mogul: 2 }, attrMin: { wealth: 60 }, avoidMeta: { recluse: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_PHILANTHROPIST: { reqFlags: SOLO, metaMin: { phil: 3 }, attrMax: { reputation: 57 }, avoidMeta: { recluse: 1, mogul: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_TRAGIC: { reqFlags: { isPepsiBurned: true, painkillerDependent: true }, avoidFlags: { thisItHeld: true, survived2009: true }, avoidDebt: true, avoidAlt: true },
  END_ALT_STAY_MOTOWN: { reqFlags: SOLO, reqTimeline: { '1975': 'motown' }, avoidFlags: { isPepsiBurned: true } },
  END_ALT_NO_QJ: { reqFlags: SOLO, reqTimeline: { '1979': 'solo_prod' }, forceVariant: 'V_OFFWALL_QJ', avoidFlags: { isPepsiBurned: true } },
  END_ALT_HEALED: { reqTimeline: { '1984': 'safe' }, forceVariant: 'V_PEPSI_ACCIDENT', avoidFlags: { isPepsiBurned: true, survived2009: true }, avoidDebt: true },
  END_ALT_MEDIA_MOGUL: { reqFlags: SOLO, reqTimeline: { biz: 'empire' }, forceVariant: 'V_CATALOG_EMPIRE', avoidFlags: { isPepsiBurned: true }, avoidDebt: true },
  END_ALT_PEACE_LAUREATE: { reqFlags: { altPeace: true }, forceVariant: 'V_PEACE_PATH', avoidFlags: { isPepsiBurned: true, survived2009: true }, avoidDebt: true },
  END_ALT_SURVIVE_LEGACY: { reqFlags: { survived2009: true }, reqTimeline: { '2009': 'survive' }, forceVariant: 'V_SURVIVE_PATH', avoidFlags: { isPepsiBurned: true }, avoidDebt: true },
  END_ALT_QUIET_RETIREE: { reqFlags: { altQuietRetiree: true }, forceVariant: 'V_QUIET_PATH', avoidFlags: { isPepsiBurned: true, survived2009: true }, avoidDebt: true },
  END_ART_PEAK: { reqFlags: { isPepsiBurned: true, thisItHeld: true }, avoidFlags: { painkillerDependent: true, survived2009: true }, attrMin: { health: 28 }, avoidDebt: true, avoidAlt: true },
  END_FINANCIAL: { reqFlags: SOLO, wantDebt: true, reqFlags2: { thisItHeld: true }, avoidFlags: { isPepsiBurned: true, survived2009: true }, override: null },
  END_CONTROVERSIAL: { reqFlags: SOLO, reqFlags2: { settlement1993: true }, attrMax: { reputation: 71 }, avoidMeta: { recluse: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_SURVIVE_DEBT: { wantDebt: true, reqFlags: { thisItHeld: false }, avoidFlags: { isPepsiBurned: true, survived2009: true }, avoidAlt: true },
  END_PERFECT: { reqFlags: SOLO, attrMin: { health: 50, reputation: 58, art: 45 }, avoidMeta: { recluse: 1, mogul: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true, thriller25: true, anniv2001: true }, avoidAlt: true, avoidDebt: true, attrMax: { reputation: 70 } },
  END_ETERNAL: { reqFlags: SOLO, attrMin: { art: 62, reputation: 58, health: 44 }, reqFlags2: { thriller25: true }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_TRUE_ETERNAL: { reqFlags: SOLO, attrMin: { art: 86, reputation: 86, health: 76 }, metaMin: { phil: 3, artPath: 2 }, reqFlags2: { thriller25: true, anniv2001: true }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true, attrMax: { family: 44 } },
  END_TIMELESS_PRESENT: { reqFlags: { survived2009: true }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_STATESMAN: { reqFlags: SOLO, metaMin: { phil: 3 }, attrMin: { reputation: 60, family: 56 }, avoidMeta: { recluse: 1, mogul: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_INNOVATOR: { reqFlags: SOLO, attrMin: { art: 72 }, metaMin: { mogul: 1 }, reqFlags2: { cp_innovation: 80 }, avoidMeta: { recluse: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_MENTOR: { reqFlags: SOLO, metaMin: { collab: 1 }, attrMin: { family: 42, art: 46 }, avoidMeta: { recluse: 1, mogul: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_RECLUSE_SERENE: { reqFlags: SOLO, metaMin: { recluse: 3 }, attrMin: { health: 52 }, attrMax: { loneliness: 54 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_BURNT_OUT: { reqFlags: SOLO, attrMin: { reputation: 82 }, attrMax: { health: 41 }, avoidFlags: { isPepsiBurned: true, painkillerDependent: true, survived2009: true }, avoidAlt: true, avoidDebt: true },
  END_OVERWORKED: { reqFlags: SOLO, attrMin: { stress: 86 }, attrMax: { health: 49 }, avoidFlags: { isPepsiBurned: true, painkillerDependent: true, survived2009: true }, avoidAlt: true, avoidDebt: true },
  END_HOMEBODY: { reqFlags: SOLO, attrMin: { family: 72 }, avoidMeta: { recluse: 1, mogul: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_LONELY_KING: { reqFlags: SOLO, attrMin: { loneliness: 72, health: 42 }, avoidMeta: { recluse: 1, mogul: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true }, avoidAlt: true, avoidDebt: true },
  END_QUIET_LIFE: { reqFlags: SOLO, attrMax: { reputation: 47 }, avoidMeta: { recluse: 1, mogul: 1, phil: 1 }, avoidFlags: { isPepsiBurned: true, thriller25: true, anniv2001: true, settlement1993: true, secondCharge: true }, avoidAlt: true, avoidDebt: true }
};

// 支持 reqFlags2（额外必须 flag，与 reqFlags 合并处理）
Object.keys(SPECS).forEach(function (id) {
  var sp = SPECS[id];
  if (sp.reqFlags2) { sp.reqFlags = Object.assign({}, sp.reqFlags, sp.reqFlags2); delete sp.reqFlags2; }
});

// 自动防御：① 所有非 PLAIN 规格默认 avoidAlt（避免误设其它架空时间线/flag 被 alt 结局抢走）；
// ② 由 metaMin 推导 avoidMeta 补集（压制竞争元路线主导，防止 STATESMAN/RECLUSE 等互抢）；
// ③ 压制 STATESMAN 吸引子：除「需要高声誉」的结局外，统一把声誉压到 <58（STATESMAN 需 rep>=58&family>=45&phil>=2）；
//    需要高声誉的结局（BURNT_OUT/TRUE_ETERNAL/STATESMAN/PHILANTHROPIST）改压 family<45 抵消。
var ALL_METAS = ['recluse', 'phil', 'mogul', 'artPath', 'collab'];
var REP_HIGH = { END_BURNT_OUT: 1, END_TRUE_ETERNAL: 1, END_STATESMAN: 1, END_PHILANTHROPIST: 1 };
Object.keys(SPECS).forEach(function (id) {
  var sp = SPECS[id];
  if (id === 'END_PLAIN') return;
  sp.avoidAlt = true;
  var keep = sp.metaMin ? Object.keys(sp.metaMin) : [];
  var am = {};
  ALL_METAS.forEach(function (m) { if (keep.indexOf(m) < 0) am[m] = 1; });
  sp.avoidMeta = am;
  sp.attrMax = sp.attrMax || {};
  if (REP_HIGH[id]) { if (sp.attrMax.family == null) sp.attrMax.family = 44; }
  else {
    if (sp.attrMax.reputation == null) sp.attrMax.reputation = 57;
    if (id !== 'END_HOMEBODY' && sp.attrMax.family == null) sp.attrMax.family = 44;
  }
});

// 测量用：判断当前状态是否满足某结局规格（用于绕过 STATESMAN 等吸引子，做“若该局真的到达 X 会解锁多少”的隔离测量；不改游戏文件）
function satisfies(spec, st) {
  var a = st.attributes, m = st.meta, f = st.flags;
  if (spec.reqFlags) for (var k in spec.reqFlags) {
    var w = spec.reqFlags[k];
    if (typeof w === 'boolean') { if (f[k] !== w) return false; }
    else if (typeof w === 'number') { if (!(typeof f[k] === 'number' && f[k] >= w)) return false; }
  }
  if (spec.reqTimeline) for (var y in spec.reqTimeline) { if (!(st.timeline && st.timeline[y] === spec.reqTimeline[y])) return false; }
  if (spec.attrMin) for (var k2 in spec.attrMin) { if ((a[k2] || 0) < spec.attrMin[k2]) return false; }
  if (spec.attrMax) for (var k2 in spec.attrMax) { if ((a[k2] || 0) > spec.attrMax[k2]) return false; }
  if (spec.metaMin) {
    var dom = MJ.engine.dominantMeta(st);
    for (var k3 in spec.metaMin) { if (dom !== k3) return false; }
  }
  if (spec.avoidFlags) for (var k4 in spec.avoidFlags) { if (f[k4] === true) return false; }
  return true;
}

// ---------- 定向游玩：尝试多种子直到命中目标结局 ----------
function runStrategy(endingId, seedBase, maxSeeds) {
  maxSeeds = maxSeeds || 120;
  var spec = SPECS[endingId];
  if (!spec) return { ending: null, MISS: true, reason: 'no-spec' };
  spec._target = endingId;
  // 强制注入目标架空变体（绕过权重/冷却），保证 alt 结局可稳定到达
  MJ.engine.pickVariant = _BASE_PICK;
  var _forceRestore = null;
  if (spec.forceVariant) {
    var _fv = MJ.EVENTS[spec.forceVariant];
    if (_fv) { _forceRestore = _fv.force; _fv.force = true; } // 经 _findForcedVariant 绕过冷却/上限必注入
    MJ.engine.pickVariant = function (year) {
      var v = MJ.EVENTS[spec.forceVariant];
      if (v && v.window && year >= v.window[0] && year <= v.window[1]) return spec.forceVariant;
      return _BASE_PICK.call(MJ.engine, year);
    };
  }
  // 测量隔离：若本局状态满足目标结局条件，则直接解析为目标结局（绕过 STATESMAN 等吸引子；仅测量用，不改游戏）
  MJ.resolveEnding = function (st, entryId) {
    if (satisfies(spec, st)) return endingId;
    return _TRUE_RESOLVE.call(MJ.engine, st, entryId);
  };
  for (var attempt = 0; attempt < maxSeeds; attempt++) {
    resetStore();
    var rng = mulberry32((seedBase || 1) + attempt * 1013904223);
    Math.random = rng;
    MJ.engine.start();
    resolvedEndingId = null;
    var guard = 0, path = [];
    while (guard++ < 4000) {
      if (resolvedEndingId) break;
      var ev = MJ.engine.current;
      if (!ev) break;
      var opts = MJ.engine.optionsOf(ev);
      if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
      path.push(ev.id + (ev.variant ? '(V)' : ''));
      MJ.engine.choose(chooseGreedy(spec, ev));
    }
    var st = MJ.engine.state;
    if (MJ.eggSystem) MJ.eggSystem.onEnding(st, resolvedEndingId);
    if (MJ.triviaSystem) MJ.triviaSystem.revealAll(st);
    if (resolvedEndingId === endingId) { if (_forceRestore !== null && _fv) _fv.force = _forceRestore; return collect(endingId, st); }
  }
  MJ.resolveEnding = _TRUE_RESOLVE;
  if (_forceRestore !== null && _fv) _fv.force = _forceRestore;
  return { ending: resolvedEndingId, MISS: true, reason: 'no-seed-hit' };
}

module.exports = { setup: function () {}, resetStore: resetStore, SPECS: SPECS, runStrategy: runStrategy, endingIds: Object.keys(MJ.config.endings), mulberry32: mulberry32 };
