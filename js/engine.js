/* engine.js — 核心引擎
 * 包含：规则引擎(RuleEngine)、效应应用、结局解析(OutcomeResolver)、
 * 事件引擎(EventEngine)、存档系统(SaveSystem)。
 * 严格对齐 GDD v0.6：7.2 结局优先级规则表、5.7 变体事件、8.1 压力→健康联动。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  // ---------- 规则引擎：压力→健康联动 + 属性钳制 ----------
  MJ.ruleEngine = {
    afterEvent: function (state) {
      var a = state.attributes;
      var stress = a.stress || 0;
      var health = a.health || 0;
      // GDD 8.1 精神→健康联动：仅在极致高压(>=85)时极缓扣血；
      // 低压力时身心回血，让「善于管理压力」的玩法得以保持健康（可达性微调）。
      if (stress >= 85) health = Math.max(0, health - 1);
      else if (stress < 40) health = Math.min(100, health + 2);
      else if (stress < 60) health = Math.min(100, health + 1);
      a.health = health;
      // M6 孤独轴：由 隐士倾向 + 低家庭 + 低媒体 累积（单调增长，作为心理伤痕，驱动幼年闪回）
      var lonTarget = (state.meta.recluse || 0) * 12 + ((a.family || 0) < 35 ? 15 : 0) + ((a.media || 0) < 25 ? 8 : 0);
      if (lonTarget > (a.loneliness || 0)) a.loneliness = Math.min(100, lonTarget);
      // 兜底钳制（含 M5/M6 体验轴）
      ['health', 'reputation', 'wealth', 'family', 'art', 'stress', 'media', 'loneliness'].forEach(function (k) {
        var v = a[k];
        if (v != null) a[k] = Math.max(0, Math.min(100, v));
      });
    }
  };

  // ---------- 效应应用（属性 / 元路线 / 金钱） ----------
  function applyEffects(eff, state) {
    if (!eff) return;
    if (typeof eff === 'function') eff = eff(state);
    var scale = (MJ.config && MJ.config.wealthScale) || 150;
    for (var k in eff) {
      if (!eff.hasOwnProperty(k)) continue;
      if (k === 'money') { state.applyMoney(eff[k]); continue; }
      // 财富属性与净资产联动：wealth 变化直接折算为净资产变化，二者永不背离
      if (k === 'wealth') { state.applyMoney(eff[k] * scale); continue; }
      // M1 关系好感：eff.rel = { brothers:-15, quincy:12, ... }
      if (k === 'rel') {
        var ro = eff[k];
        for (var rk in ro) { if (ro.hasOwnProperty(rk)) state.changeRel(rk, ro[rk]); }
        continue;
      }
      // 架空历史时间线分叉（BP 决策点写入 state.timeline）
      if (k === 'timeline') {
        var tl = eff[k];
        for (var tk in tl) { if (tl.hasOwnProperty(tk)) state.timeline[tk] = tl[tk]; }
        continue;
      }
      state.changeAttr(k, eff[k]);
    }
  }
  MJ.applyEffects = applyEffects;

  // 彩蛋：连续“完美演出”计数（用于 §17.9 歌词反向彩蛋）
  function _bumpStreak(state, isPerfect) {
    if (!state._mw) state._mw = 0;
    if (isPerfect) {
      state._mw += 1;
      if (state._mw >= 4 && MJ.eggSystem) MJ.eggSystem.unlock('EGG_LYRIC');
    } else {
      state._mw = 0;
    }
  }

  // 选项后果的“回响”短叙事（前置小剧情）：优先用 bespoke epilogue，否则按数值合成。
  function consequenceLine(opt, state) {
    if (opt.epilogue) return opt.epilogue;
    var eff = opt.effects || {};
    if (typeof eff === 'function') eff = eff(state);
    var map = {
      health: function (d) { return d > 0 ? T('consequence.health.pos', null, '身子骨稳了一分') : T('consequence.health.neg', null, '元气又损了一截'); },
      reputation: function (d) { return d > 0 ? T('consequence.reputation.pos', null, '声名更响亮了些') : T('consequence.reputation.neg', null, '口碑悄悄蒙尘'); },
      wealth: function (d) { return d > 0 ? T('consequence.wealth.pos', null, '进项让荷包鼓了些') : T('consequence.wealth.neg', null, '开销又添了一笔'); },
      family: function (d) { return d > 0 ? T('consequence.family.pos', null, '家的温度回升了些') : T('consequence.family.neg', null, '亲情又凉了一截'); },
      art: function (d) { return d > 0 ? T('consequence.art.pos', null, '技艺更精进了些') : T('consequence.art.neg', null, '灵感稍稍游离'); },
      stress: function (d) { return d > 0 ? T('consequence.stress.pos', null, '紧绷感又爬上肩头') : T('consequence.stress.neg', null, '呼吸松快了些'); }
    };
    var parts = [];
    ['health', 'reputation', 'wealth', 'family', 'art', 'stress'].forEach(function (k) {
      var d = eff[k];
      if (typeof d === 'number' && Math.abs(d) >= 8 && map[k]) parts.push(map[k](d));
    });
    if (opt.moneyEffect) parts.push(opt.moneyEffect < 0 ? T('consequence.money.neg', null, '账上又见一处窟窿') : T('consequence.money.pos', null, '账上添了一笔进项'));
    if (!parts.length) return null;
    return T('consequence.prefix', null, '尘埃落定——') + parts.join('，') + T('consequence.suffix', null, '。');
  }

  // ---------- 结局解析（GDD 7.2 优先级规则表） ----------
  function dominantMeta(meta) {
    var order = MJ.config.metaOrder; // 艺术 > 慈善 > 商业 > 隐士
    var best = null, bestVal = 0;
    for (var i = 0; i < order.length; i++) {
      var v = meta[order[i]] || 0;
      if (v > bestVal) { bestVal = v; best = order[i]; }
    }
    return bestVal > 0 ? best : null;
  }
  MJ.dominantMeta = dominantMeta;

  // 事件年份：主线用 year；变体事件用窗口中值，确保状态栏与人生轨迹均显示合理年份
  MJ.eventYear = function (ev) {
    if (!ev) return '';
    if (ev.year != null) return ev.year;
    if (ev.window) return Math.round((ev.window[0] + ev.window[1]) / 2);
    return '';
  };

  // M3 章节判定：按事件年份落在哪一段落（章节定义在 config.chapters）
  MJ.chapterOf = function (ev) {
    var y = MJ.eventYear(ev);
    var chs = MJ.config.chapters || [];
    for (var i = 0; i < chs.length; i++) {
      if (y >= chs[i].start && y <= chs[i].end) return i;
    }
    if (!chs.length) return 0;
    if (y < chs[0].start) return 0;
    return chs.length - 1;
  };

  // M2 人生手记：按章节 + 元路线/flag 取首个命中模板（无 cond 为兜底）
  MJ.buildDiary = function (chapterId, state) {
    var tpls = (MJ.config.diaryTemplates || {})[chapterId];
    if (!tpls) return '';
    for (var i = 0; i < tpls.length; i++) {
      try { if (!tpls[i].cond || tpls[i].cond(state)) return { key: tpls[i].key, text: tpls[i].text }; } catch (e) {}
    }
    return '';
  };

  // M4 命运回响：收集所有命中 flag 的跨章因果回响（去重由调用方负责）
  MJ.buildEchoes = function (state) {
    var tpls = MJ.config.echoTemplates || [];
    var out = [];
    for (var i = 0; i < tpls.length; i++) {
      try { if (tpls[i].cond(state)) out.push({ key: tpls[i].key, text: tpls[i].text }); } catch (e) {}
    }
    return out;
  };

  // M7 传奇评分 / 遗产评级（0–100 → S/A/B/C/D），结局页与海报展示，给重玩明确目标
  MJ.legendScore = function (state) {
    var a = state.attributes, m = state.meta;
    var score = a.art * 0.22 + a.reputation * 0.22 + a.health * 0.14 - a.stress * 0.10;
    score += (m.phil || 0) * 4 + (m.mogul || 0) * 4 + (m.artPath || 0) * 4 + (m.recluse || 0) * 2;
    score += Math.max(0, (a.family || 0) - 50) * 0.05;
    var relSum = 0;
    for (var k in state.relations) { if (state.relations.hasOwnProperty(k)) relSum += state.relations[k]; }
    score += Math.max(-10, Math.min(10, relSum * 0.03));
    score = Math.max(0, Math.min(100, Math.round(score)));
    var grade = score >= 90 ? 'S' : score >= 78 ? 'A' : score >= 64 ? 'B' : score >= 48 ? 'C' : 'D';
    return { score: score, grade: grade };
  };

  // 架空历史（alt 结局）解析：将 BP 决策写入的 state.timeline 分叉 / flag 映射到对应假设结局。
  // 仅返回 id 或 null；由 resolveEnding 在「硬约束之后、路线型 canonical 之前」的 ALT BAND 调用。
  function resolveAltEnding(state) {
    var tl = state.timeline;
    if (!tl) return null;
    if (tl['1975'] === 'motown') return 'END_ALT_STAY_MOTOWN';
    if (tl['1979'] === 'solo_prod') return 'END_ALT_NO_QJ';
    if (tl['1984'] === 'safe') return 'END_ALT_HEALED';
    if (tl['biz'] === 'empire') return 'END_ALT_MEDIA_MOGUL';
    if (state.flags.altPeace === true) return 'END_ALT_PEACE_LAUREATE';
    if (state.flags.altQuietRetiree === true) return 'END_ALT_QUIET_RETIREE';
    return null;
  }

  MJ.resolveEnding = function (state, entryId) {
    var f = state.flags, a = state.attributes, m = state.meta;
    var burned = f.isPepsiBurned === true;
    var dependent = f.painkillerDependent === true;
    var held = f.thisItHeld === true;
    var debt = state.debt === true;
    var dom = dominantMeta(m);

    if (entryId === 'END_PLAIN') return 'END_PLAIN';          // 1. 硬性分支（1_5 留盖瑞早退）
    // 3. 真·永恒隐藏结局（终极）：不烧伤/不负债 + 艺术&声誉&健康极致 + 慈善&艺术路线极致 + 双加冕标志（多方极致收敛）
    if (!burned && !debt && (a.art || 0) >= 85 && (a.reputation || 0) >= 85 && (a.health || 0) >= 75 && (m.phil || 0) >= 3 && (m.artPath || 0) >= 2 && (f.thriller25 && f.anniv2001)) {
      return 'END_TRUE_ETERNAL';
    }
    // 3b. 续章（假设 2009 未离世）：永不归死亡结局，按人生状态收束（普通/稀有/史诗/传奇皆可抵达）
    if (f.survived2009 === true) {
      if (state.timeline && state.timeline['2009'] === 'survive') return 'END_ALT_SURVIVE_LEGACY'; // 架空续章长寿（BP7）
      // ★ 缺口修复：本分支原先早于 ALT BAND 返回，玩家做过的架空分叉（1975/1979/1984/biz/altPeace/altQuiet）
      //   在续章里被静默吞掉（实测 717/8000 局）。这里在续章内同样尊重架空选择（BP7 长寿已优先）。
      var _altS = resolveAltEnding(state);
      // 已烧伤的玩家即便做了「稳妥康复」分叉，也不应落到"那年的灼伤没有拖垮你"（文案矛盾）
      if (_altS && !(_altS === 'END_ALT_HEALED' && f.isPepsiBurned)) return _altS;
      if (debt && !held) return 'END_SURVIVE_DEBT';
      if (debt) return 'END_FINANCIAL';
      if ((a.art || 0) >= 66 && (a.reputation || 0) >= 56 && (a.health || 0) >= 46 && (f.thriller25 || f.anniv2001)) return 'END_ETERNAL';
      if (m.mogul >= 2 && !debt && a.wealth >= 60) return 'END_MOGUL';
      if ((m.phil || 0) >= 3 && dom === 'phil' && !debt) return 'END_PHILANTHROPIST'; // 与主分支一致：须慈善为主导路线
      if (dom === 'recluse' && a.health >= 35) return 'END_RECLUSE';
      if (a.health >= 50 && a.reputation >= 60) return 'END_PERFECT';
      return 'END_TIMELESS_PRESENT';
    }
    // 轨迹优先：烧伤 / 负债 先判定，避免被"成功型结局"抢占而恒为 0（§17.7 可达性）。
    if (burned) {
      if (debt && !held) return 'END_SURVIVE_DEBT';
      if (debt) return 'END_FINANCIAL';
      if (dependent && held && (a.health || 0) >= 28) return 'END_TRAGIC';        // 10 烧伤+依赖+坚持巡演
      if (!dependent && held && (a.health || 0) >= 28) return 'END_ART_PEAK';    // 9 烧伤戒药+坚持巡演
      if (dependent && (a.health || 0) >= 28) return 'END_TRAGIC';               // 烧伤+依赖（未坚持巡演）
      return 'END_TRAGIC';                                                       // 烧伤默认收束
    }
    if (debt) {
      if (!held) return 'END_SURVIVE_DEBT';
      return 'END_FINANCIAL';
    }
    // 以下仅 !burned & !debt：成功型 / 普通型结局（按"更具体者优先"排序）
    // 13 声誉承压（M5 媒体轴联动）：有丑闻标志且声誉/媒体仍偏低 → 丑闻定义legacy；
    //    前置到「成功型结局」之前（法律类 END_CONTROVERSIAL 仍胜出 alt，符合用户决策"硬约束/法律仍胜出"）。
    if ((a.reputation < 72 && f.settlement1993) || ((a.media || 0) < 40 && (f.settlement1993 || f.secondCharge))) return 'END_CONTROVERSIAL';
    // ★ ALT BAND（阶段 2：提升为主支；路线型 canonical 含 END_RECLUSE* 亦被 alt 覆盖，见用户决策"精英优先、路线重皮"）
    var _alt = resolveAltEnding(state);
    if (_alt) return _alt;
    // 路线型 canonical：隐士线（置于 ALT BAND 之后，使分叉者优先拿对应 alt 结局）
    if (dom === 'recluse' && a.health >= 50 && (a.loneliness || 0) < 55) return 'END_RECLUSE_SERENE'; // 4a 平和隐士（§17.7，放宽孤独阈值 <55）
    if (dom === 'recluse' && a.health >= 35) return 'END_RECLUSE';        // 4
    if (f.isSolo === false) return 'END_FAMILY';              // 始终未单飞（置于 alt 之后：分叉者优先拿对应 alt 结局）
    if (m.mogul >= 2 && dom === 'mogul' && !debt && a.wealth >= 60) return 'END_MOGUL';      // 5 商业须为主导路线，避免吞掉普通好结局池
    if ((a.art || 0) >= 70 && (m.mogul || 0) >= 1 && f.cp_innovation >= 80) return 'END_INNOVATOR'; // 5a 音乐技术先驱（§17.7）
    // 8 完美传奇（干净人生，§17.7 可达性）：未走主导特殊路线、无提携/加冕标志、身心健康且声誉达标 → 优先收束，
    //    避免被 TRAGIC 默认吞掉；用 dom/collab/加冕标志排他，不抢 MOGUL/PHIL/MENTOR/ETERNAL/INNOVATOR。
    if (dom !== 'mogul' && dom !== 'phil' && dom !== 'recluse' && (m.collab || 0) < 1 && !(f.thriller25 || f.anniv2001) && a.health >= 32 && (a.reputation || 0) >= 42) return 'END_PERFECT';
    if ((m.phil || 0) >= 2 && dom === 'phil' && !debt && (a.reputation || 0) >= 58 && (a.family || 0) >= 45) return 'END_STATESMAN'; // 6b 文化大使（§17.7，须慈善主导且在 PHIL 前）
    if ((m.phil || 0) >= 3 && dom === 'phil' && !debt) return 'END_PHILANTHROPIST';   // 6 须慈善主导
    if ((m.collab || 0) >= 1 && (a.family || 0) >= 40 && (a.art || 0) >= 44) return 'END_MENTOR'; // 6a 提携后辈（§17.7，collab>=1 即可，放宽艺术阈值 ≥44）
    if (a.art >= 60 && a.reputation >= 56 && a.health >= 42 && (f.thriller25 || f.anniv2001)) return 'END_ETERNAL'; // 7 巅峰需加冕标志（放宽艺术 ≥60 / 健康 ≥42）
    // —— 以下为 2026-09-07 覆盖缺口审计后补的结局：专门接住原先「无专属归宿、落入兜底」的状态原型 ——
    // 归家的人：单飞后仍把家庭经营到极致（原 END_FAMILY 只认未单飞，单飞玩家的家庭投入无出口）
    if (f.isSolo === true && (a.family || 0) >= 70 && !debt && !burned) return 'END_HOMEBODY';
    // 孤高的王：非隐士路线却孤独极高（原 loneliness 仅作 RECLUSE_SERENE 的排除阈值，无正向出口）
    if ((a.loneliness || 0) >= 70 && dom !== 'recluse' && (a.health || 0) >= 40 && !debt && !burned) return 'END_LONELY_KING';
    // 过劳的匠人：压力轴原先对结局零影响（实测 66% 的局压力≥70 却无叙事出口）
    if ((a.stress || 0) >= 85 && (a.health || 0) < 50 && !debt && !burned && !dependent) return 'END_OVERWORKED';
    // 燃尽的天才：声誉极高但健康低、且非烧伤/依赖/负债。
    //   原先这类状态会掉进 END_TRAGIC，而后者文案写的是「烧伤、依赖与 2009 离世」——与状态矛盾。
    if ((a.reputation || 0) >= 80 && (a.health || 0) < 42 && !debt && !burned && !dependent) return 'END_BURNT_OUT';
    if (a.health >= 40 && (a.reputation || 0) >= 48) return 'END_PERFECT';     // 8 健康谢幕（兜底，需声誉达标）

    // 中性兜底：取代原先无门槛的 END_TRAGIC。能走到这里的状态必然是「未烧伤、未依赖、未负债」，
    // 用「历史悲剧（灼伤与药物）」收束会与玩家实际人生矛盾（确定性探针已复现 3 例）。
    return 'END_QUIET_LIFE';
  };

  // ---------- 事件引擎 ----------
  // 变体平衡（§18.6 核心）：每章上限 + 变体间冷却，控制弹出频率/聚簇
  var VARIANT_CAP_PER_CHAPTER = 6;   // 每章至多注入的变体数（密集章节额外收口；稀疏章节由冷却主导）
  var VARIANT_COOLDOWN_NODES = 2;    // 两次变体之间至少间隔 2 个主线节点（强防聚簇/打断）
  var engine = {
    state: null,
    current: null,
    _return: null,
    _usedVariants: null,
    pendingEpilogue: null,

    start: function () {
      this.state = new MJ.GameState();
      this._usedVariants = {};
      this._return = null;
      this._chapterVariantCount = 0;
      this._sinceVariant = 0;
      this.go('start');
    },

    resume: function (data) {
      this.state = new MJ.GameState();
      this.state.hydrate(data);
      this._usedVariants = {};
      this._return = (data && data.returnId) || null;
      this._chapterVariantCount = 0;
      this._sinceVariant = 0;
      var id = (data && data.currentId) ? data.currentId : 'start';
      this._suppressAchToast = true; // 续局首屏静默消化已解锁成就，避免重弹
      try { this.go(id); } finally { this._suppressAchToast = false; }
    },

    // 尝试为当前章节注入一个变体事件（GDD 5.6 / §18.6 核心）
    // 每个候选独立按自身 weight 掷骰（weight 即其单节点触发概率），在「本节点实际愿意触发」的候选中按 weight 加权随机选 1 个。
    // 修复旧版 break 首个命中导致的「迭代序挤占」：使 weight 真正决定各变体触发率，而非被排在前面的候选霸占。
    pickVariant: function (year) {
      var evs = MJ.EVENTS, pool = [];
      for (var id in evs) {
        if (!evs.hasOwnProperty(id)) continue;
        var v = evs[id];
        if (!v.variant || this._usedVariants[id]) continue;
        if (year < v.window[0] || year > v.window[1]) continue;
        if (v.cond && !v.cond(this.state)) continue; // 变体亦可带条件门控
        var w = (typeof v.weight === 'number' ? v.weight : 1);
        if (Math.random() * 100 < w) pool.push({ id: id, weight: w }); // 独立掷骰：weight 决定单节点触发率
      }
      if (!pool.length) return null;
      // 在愿意触发的候选中按 weight 加权随机选 1 个
      var total = 0, i;
      for (i = 0; i < pool.length; i++) total += pool[i].weight;
      var r = Math.random() * total;
      for (i = 0; i < pool.length; i++) {
        r -= pool[i].weight;
        if (r <= 0) {
          this._usedVariants[pool[i].id] = true;
          this.state.stats.variants++;
          return pool[i].id;
        }
      }
      var last = pool[pool.length - 1]; // 浮点残差兜底
      this._usedVariants[last.id] = true;
      this.state.stats.variants++;
      return last.id;
    },

    _findForcedVariant: function (year) {
      if (year == null) return null;
      for (var k in MJ.EVENTS) {
        if (!MJ.EVENTS.hasOwnProperty(k)) continue;
        var ev = MJ.EVENTS[k];
        if (!ev || !ev.variant || !ev.force || !ev.window) continue;
        if (this._usedVariants[k]) continue;
        if (ev.cond && !ev.cond(this.state)) continue; // 强制变体同样遵守条件门控（如 BP2 须已单飞）
        if (year >= ev.window[0] && year <= ev.window[1]) return k;
      }
      return null;
    },

    go: function (id) {
      var ev = MJ.EVENTS[id];
      if (!ev) { console.error('事件缺失:', id); this.go('start'); return; }

      // 门控条件
      if (ev.cond && !ev.cond(this.state)) {
        var fb = ev.fallback || ev.next;
        if (fb) return this.go(fb);
      }

      // 变体事件插入（仅对主线非结局事件）
      if (!ev.variant && ev.kind !== 'ending') {
        var vid = null;
        // BP 决策点：force 变体优先注入（绕过冷却/上限，保证关键分叉必现）
        if (!vid) vid = this._findForcedVariant(ev.year);
        // §18.6 核心：每章上限 + 变体间冷却，控制弹出频率与聚簇
        // noVariant 节点（如 BP1 决策 1_8）：不再注入风味/彩蛋变体，避免冲淡关键分支分量
        if (!vid && !ev.noVariant && this._chapterVariantCount < VARIANT_CAP_PER_CHAPTER && this._sinceVariant >= VARIANT_COOLDOWN_NODES) {
          vid = this.pickVariant(ev.year);
        }
        if (vid) {
          // 变体显示年份跟随父事件，避免时间线倒挂（GDD §6 时间一致性）
          var vinst = Object.assign({}, MJ.EVENTS[vid]);
          if (ev.onEnter) vinst.onEnter = ev.onEnter; // 携带主事件结算钩子（GDD §17.14：如格莱美揭晓前动态解析）
          vinst.year = (ev.year != null) ? ev.year
            : (MJ.EVENTS[vid].window ? Math.round((MJ.EVENTS[vid].window[0] + MJ.EVENTS[vid].window[1]) / 2) : null);
          this.current = vinst;
          this._return = id;
          this.state.stats.events = (this.state.stats.events || 0) + 1;
          if (vinst.onEnter) vinst.onEnter(this.state); // 变体分支同样在进入即结算
          this._usedVariants[vid] = true; // 强制/普通变体均标记，避免 __RETURN__ 回到父节点后重复注入
          this._chapterVariantCount++;
          this._sinceVariant = 0;
          MJ.saveSystem.save(this.state);
          MJ.ui.showEvent(vinst, this.state);
          return;
        }
        this._sinceVariant++;
      }

      this.current = ev;
      if (ev.onEnter) ev.onEnter(this.state); // GDD §17.14：进入事件即结算（如格莱美揭晓前动态解析）
      this.state.stats.events = (this.state.stats.events || 0) + 1; // 途经人生节点计数
      MJ.saveSystem.save(this.state); // 进入新事件即存档（含 currentId），刷新可续玩

      // M3 章节过场：主线非结局事件跨越新章节时，先弹“时代卡片”（含 M2 手记 / M4 命运回响），再展示事件
      if (!ev.variant && ev.kind !== 'ending') {
        var ch = MJ.chapterOf(ev);
        if (ch !== this.state.era) {
          this.state.era = ch;
          this._recordChapter(ch);
          this._chapterVariantCount = 0; // 进入新章节，重置每章变体计数
          this._sinceVariant = 0;
          MJ.saveSystem.save(this.state);
          var self = this;
          MJ.ui.showEraCard(MJ.config.chapters[ch], this.state, function () { MJ.ui.showEvent(ev, self.state); });
          return;
        }
      }
      MJ.ui.showEvent(ev, this.state);
    },

    // M2/M4：进入新章节时生成人生手记片段与命运回响（去重）
    _recordChapter: function (chapterId) {
      var s = this.state;
      var frag = MJ.buildDiary(chapterId, s);
      if (frag) {
        s.diary.push({ chapter: chapterId, title: (MJ.config.chapters[chapterId] || {}).title || '', key: frag.key, text: frag.text });
        if (s.diary.length > 6) s.diary.shift();
      }
      MJ.buildEchoes(s).forEach(function (t) {
        var dup = s.echoes.some(function (x) { return (typeof x === 'string' ? x : x.key) === t.key; });
        if (!dup) s.echoes.push(t);
      });
    },

    optionsOf: function (ev) {
      if (MJ.localizeEvent) return MJ.localizeEvent(ev, this.state).options;
      return typeof ev.options === 'function' ? ev.options(this.state) : ev.options;
    },

    choose: function (optIndex) {
      var ev = this.current;
      var opts = this.optionsOf(ev);
      var opt = opts[optIndex];
      if (!opt) return;

      this.state.pushHistory({ id: ev.id, year: MJ.eventYear(ev), title: (MJ.localizeEvent ? MJ.localizeEvent(ev, this.state).title : ev.title), choice: opt.label, opt: optIndex, key: !!ev.key });
      if (ev.key) this.state.stats.keyChoices++;
      applyEffects(opt.effects, this.state);
      if (opt.moneyEffect) this.state.applyMoney(opt.moneyEffect);
      if (opt.flags) for (var k in opt.flags) this.state.setFlag(k, opt.flags[k]);
      MJ.ruleEngine.afterEvent(this.state);

      // §17.9 彩蛋触发检测（月球漫步起源 / 歌词反向 / egg_* 标志）
      if (MJ.eggSystem) {
        if (ev.id === '3_1b' && optIndex === 0) MJ.eggSystem.incMoonwalkPerfect();
        var _mwSet = { '3_1b': 1, '3_2b': 1, '4_2b': 1, '6_1c': 1 };
        // 仅对 4 个月球漫步事件做连击计数；普通事件不重置连击（否则跨章节分散的演出永远凑不齐 4 连）
        if (_mwSet[ev.id]) _bumpStreak(this.state, optIndex === 0);
        MJ.eggSystem.checkFlags(this.state);
      }
      if (MJ.triviaSystem) MJ.triviaSystem.checkFlags(this.state); // §17.11 趣事：扫描 tidbit_* 标志解锁图鉴


      this.pendingEpilogue = consequenceLine(opt, this.state);

      MJ.saveSystem.save(this.state);
      this.advance(opt.next);
    },

    proceed: function () {
      var ev = this.current;
      applyEffects(ev.effects, this.state);
      if (ev.flags) for (var k in ev.flags) this.state.setFlag(k, ev.flags[k]);
      this.state.pushHistory({ id: ev.id, year: MJ.eventYear(ev), title: (MJ.localizeEvent ? MJ.localizeEvent(ev, this.state).title : ev.title), choice: T('engine.experienced', null, '（经历）'), opt: -1, key: !!ev.key });
      MJ.ruleEngine.afterEvent(this.state);
      MJ.saveSystem.save(this.state);
      this.advance(ev.next);
    },

    advance: function (nxt) {
      if (!nxt) {
        if (this.current && this.current.kind === 'ending') this.showEnding(null);
        return;
      }
      if (nxt === '__RETURN__') nxt = this._return;
      if (nxt && nxt.indexOf('END_') === 0) return this.showEnding(nxt);
      this.go(nxt);
    },

    // 结局事件（如 7_3）点击“尘埃落定”后调用
    finishEnding: function () {
      var entry = (this.current && this.current.id.indexOf('END_') === 0) ? this.current.id : null;
      this.showEnding(entry);
    },

    showEnding: function (entryId) {
      var id = MJ.resolveEnding(this.state, entryId);
      MJ.saveSystem.unlockEnding(id); // 记录已解锁结局到图鉴
      MJ.saveSystem.clear(); // 结局后清档，避免“继续”恢复已结束的局
      MJ.ui.showEnding(id, this.state);
    }
  };

  MJ.engine = engine;
  var T = function (k, v, fb) { return (MJ.t ? MJ.t(k, v, fb) : (fb != null ? fb : k)); };

  // ---------- 存档系统（localStorage） ----------
  MJ.saveSystem = {
    key: 'mj_lifechoices_save_v1',
    save: function (state) {
      try { localStorage.setItem(this.key, JSON.stringify(state.serialize())); } catch (e) {}
    },
    load: function () {
      try { var s = localStorage.getItem(this.key); return s ? JSON.parse(s) : null; } catch (e) { return null; }
    },
    clear: function () {
      try { localStorage.removeItem(this.key); } catch (e) {}
    },
    galleryKey: 'mj_lifechoices_gallery_v1',
    getGallery: function () {
      try { var s = localStorage.getItem(this.galleryKey); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
    },
    unlockEnding: function (id) {
      try { var g = this.getGallery(); g[id] = true; localStorage.setItem(this.galleryKey, JSON.stringify(g)); } catch (e) {}
    },
    // 重置结局图鉴（清空已解锁记录，不影响进行中的存档）
    clearGallery: function () {
      try { localStorage.removeItem(this.galleryKey); } catch (e) {}
    },
    // ---------- 人生档案库（§18.7，与当前进行中存档解耦的历史只读快照） ----------
    archiveKey: 'mj_lifechoices_archives_v1',
    getArchives: function () {
      try { var arr = JSON.parse(localStorage.getItem(this.archiveKey)); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
    },
    addArchive: function (snap) {
      try {
        var arr = this.getArchives();
        arr.push(snap);
        arr.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); // 按时间倒序
        if (arr.length > 100) arr = arr.slice(0, 100); // 上限保护，保留最近 100 局
        localStorage.setItem(this.archiveKey, JSON.stringify(arr));
      } catch (e) {}
    },
    clearArchives: function () {
      try { localStorage.removeItem(this.archiveKey); } catch (e) {}
    },
    // 删除单条档案（按当前列表索引；删后索引前移，重新打开档案库即自愈）
    removeArchive: function (idx) {
      try {
        var arr = this.getArchives();
        if (idx < 0 || idx >= arr.length) return;
        arr.splice(idx, 1);
        localStorage.setItem(this.archiveKey, JSON.stringify(arr));
      } catch (e) {}
    }
  };

  // ---------- 成就系统（localStorage 持久化，复用图鉴式读写） ----------
  MJ.achievementSystem = {
    key: 'mj_lifechoices_ach_v1',
    _store: function () {
      try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; }
    },
    isUnlocked: function (id) { return !!this._store()[id]; },
    unlock: function (id) {
      try { var s = this._store(); s[id] = true; localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) {}
    },
    // 评估全部成就，返回本次“新解锁”的成就定义数组（用于弹窗提示）
    evaluate: function (state, ctx) {
      var newly = [];
      var self = this;
      (MJ.config.achievements || []).forEach(function (a) {
        if (self.isUnlocked(a.id)) return;
        try { if (a.check(state, ctx || {})) { self.unlock(a.id); newly.push(a); } } catch (e) {}
      });
      return newly;
    },
    // 供图鉴面板使用：返回 [{id,name,icon,desc,rarity,unlocked}]
    all: function () {
      var self = this;
      return (MJ.config.achievements || []).map(function (a) {
        return { id: a.id, name: a.name, icon: a.icon, desc: a.desc, rarity: a.rarity || 'common', unlocked: self.isUnlocked(a.id) };
      });
    },
    // 重置全部已解锁成就（图鉴式 localStorage 清除）
    clear: function () {
      try { localStorage.removeItem(this.key); } catch (e) {}
    }
  };

  // ---------- 彩蛋系统（GDD §17.9：系统化 Easter Eggs） ----------
  MJ.eggSystem = {
    key: 'mj_lifechoices_eggs_v1',
    defs: {
      EGG_MOONWALK: { icon: '🌕', name: '月球漫步起源', desc: '你一次次把脚尖点地、向后滑行——原来神话，是从盖瑞巷口的水泥地开始的。' },
      EGG_LYRIC:    { icon: '🎶', name: '反向的歌词', desc: '“Annie, are you OK?” 你笑着把歌词倒着唱，时光也跟着倒流了一秒。' },
      EGG_TRIBUTE:  { icon: '🤝', name: '梦幻同台', desc: '聚光灯下，你与猫王、与披头士隔空合唱——这世上所有的传奇，本就该同台。' },
      EGG_WATW:     { icon: '🕊️', name: '同一首歌', desc: '你按下那个特别的和弦，让《We Are The World》多了一层只有你自己听得出的温柔。' },
      EGG_MOTOWN:   { icon: '💫', name: '老友重聚', desc: 'Motown 的老伙计们又聚到了一起，青春在合唱里复活了一瞬。' },
      EGG_DISCO:    { icon: '🪩', name: '迪斯科致敬', desc: '你对着霓虹扭了扭肩，向前辈们的迪斯科时代，郑重地鞠了一躬。' },
      EGG_DEV:      { icon: '🛠️', name: '开发者留言', desc: '“谢谢你，把这一段人生，一遍遍活成了不同的样子。”' },
      EGG_FOURTH:   { icon: '🪞', name: '第四面墙', desc: '“致每一位重写传奇的你——镜子里的那个孩子，一直在为你鼓掌。”' },
      EGG_GARY:     { icon: '🏠', name: '盖瑞的孩子', desc: '盖瑞市杰克逊街的那栋小屋，九个孩子的笑声里，藏着一个巨星的起点。' },
      EGG_APOLLO:   { icon: '🏅', name: '阿波罗之夜', desc: '哈莱姆的阿波罗剧院，业余之夜的聚光灯下，你与兄弟们捧起了冠军奖杯。' },

      // —— Phase 2 内容扩充 ——
      EGG_TOYDRUM:        { icon: '🥁', name: '第一面玩具鼓', desc: '盖瑞巷口那只旧玩具鼓，是你与世界合奏的第一件乐器。' },
      EGG_SISTERDUET:     { icon: '👯', name: '与妹妹的和声', desc: '某个午后，你和拉托亚把《Rockin’ Robin》唱成了只属于兄妹的版本。' },
      EGG_CHARITYYOUTH:   { icon: '🏥', name: '儿童医院义演', desc: '你悄悄走进病房，为病床上的孩子唱起摇篮曲。' },
      EGG_FANLETTERKID:   { icon: '✉️', name: '孩子的来信', desc: '一封歪歪扭扭的来信说：你的歌让他不再怕黑。' },
      EGG_FINALREHEARSAL: { icon: '💡', name: '最后一束彩排光', desc: '2009 年夏天的排练厅，你对每束光的位置都格外较真。' },
      EGG_CAPTAINEO: { icon: '🎥', name: '《外星人》的插曲', desc: '1985 年你主演的 3D 短片《Captain EO》登陆迪士尼，把太空歌姬变成了游乐园的传说。' },
      EGG_MOONWALKER: { icon: '🎞️', name: '《月球漫步者》', desc: '1988 年的跨界电影，把音乐、动画与真人串成了一场属于孩子的狂欢。' },
      EGG_GHOSTS: { icon: '👻', name: '《Ghosts》长片', desc: '你构想并主演的长篇短片，把不被理解的怪诞搬上了银幕。' },
      EGG_BUBBLES: { icon: '🐵', name: '黑猩猩伙伴', desc: '你豢养的黑猩猩 Bubbles，曾是时代镜头里最出圈的童年符号。' },
      EGG_HALFTIME: { icon: '🏈', name: '中场之王', desc: '1993 年超级碗的中场，你用一场表演定义了不止一代人的记忆。' },

      // —— Phase 3 内容扩充（§4.2.1 最强候选，结局 onEnding 按 cond 扫描解锁；不新增独立系统）——
      EGG_J5_FOUR_NO1:     { icon: '🥇', name: '四连冠出道', desc: '《I Want You Back》《ABC》《The Love You Save》《I’ll Be There》连冠 Billboard Hot 100，Jackson 5 成为首支出道即四连冠的组合。', cond: function (s) { return s.flags.motownAudition === true || (s.relations.brothers || 0) >= 10; } },
      EGG_OFFTHEWALL_1979: { icon: '🪩', name: '《Off the Wall》', desc: '1979 年与昆西·琼斯合作的《Off the Wall》，确立了他作为独唱巨星的里程碑。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 45; } },
      EGG_THRILLER_BESTSELLING: { icon: '💿', name: '史上最畅销专辑', desc: '1982 年的《Thriller》成为史上最畅销的专辑，把流行音乐推向前所未有的高度。', cond: function (s) { return s.flags.thriller25 === true || (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 55; } },
      EGG_THRILLER_GRAMMY8: { icon: '🏆', name: '格莱美八奖之夜', desc: '第 26 届格莱美他一举拿下 8 座奖杯（《Thriller》包揽），创下当届之最。', cond: function (s) { return (s.meta.grammyWins || 0) >= 8 || (s.meta.artPath || 0) >= 2 || (s.attributes.reputation || 0) >= 70; } },
      EGG_ROCKHALL_TWICE:  { icon: '🎸', name: '两入摇滚名人堂', desc: '他两度入选摇滚名人堂（个人 + Jackson 5），是极少数获此殊荣的音乐人。', cond: function (s) { return (s.relations.brothers || 0) >= 10 || (s.attributes.reputation || 0) >= 70; } },
      EGG_GUINNESS13:      { icon: '📖', name: '十三项吉尼斯', desc: '他保持着 13 项吉尼斯世界纪录（逾任何艺人），含“史上最成功艺人”。', cond: function (s) { return (s.attributes.reputation || 0) >= 70 || (s.meta.artPath || 0) >= 2; } },
      EGG_AMA_CENTURY:     { icon: '🏆', name: '世纪艺人', desc: '他拿下 26 座全美音乐奖（逾任何艺人），并获颁“世纪艺人”。', cond: function (s) { return (s.attributes.reputation || 0) >= 60 || (s.meta.artPath || 0) >= 1; } },
      EGG_INVINCIBLE_COST: { icon: '💰', name: '最贵专辑', desc: '2001 年的《Invincible》制作历时四年、耗资约 3000 万美元，被称为“史上最贵专辑”。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 50 || (s.attributes.wealth || 0) >= 40; } },
      EGG_HISTORY_DOUBLE:  { icon: '💿', name: '双碟《HIStory》', desc: '1995 年的《HIStory》是一张双碟专辑，被誉为独唱艺人最畅销的双碟之一。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 50; } },
      EGG_BOTDF_REMIX:     { icon: '🎶', name: '最畅销混音辑', desc: '1997 年的《Blood on the Dance Floor》成为史上最畅销的混音专辑。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 50; } },
      EGG_13_NO1:          { icon: '🔝', name: '十三支冠军单曲', desc: '他拥有 13 支 Billboard Hot 100 冠军单曲，并列男性独唱艺人的纪录。', cond: function (s) { return (s.attributes.art || 0) >= 60 || (s.meta.artPath || 0) >= 2 || (s.attributes.reputation || 0) >= 70; } },
      EGG_MOTOWN25_REPLAY: { icon: '🌕', name: '重演月球漫步', desc: '你又一次把脚尖点地、向后滑行——那一夜 Motown 25 的欢呼，从未真正散场。' },
      EGG_BAD_TOUR:        { icon: '🎤', name: 'Bad 全球巡演', desc: '1987–1989 的 Bad 世界巡演一场接一场，把流行王的版图铺到了五大洲的体育场。' },
      EGG_DANGEROUS_PREM:  { icon: '🐆', name: 'Dangerous 首演', desc: '1991 年的《Dangerous》以黑豹与白袜的全新符号登场，把流行舞台又向前推了一步。' },
      EGG_REMEMBER_TIME:   { icon: '🏛️', name: 'Remember the Time', desc: '1992 年的《Remember the Time》以古埃及为舞台的 MV，成了流行录影带视觉的一次大胆实验。' },
      EGG_HISTORY_COMEBACK:{ icon: '👑', name: 'HIStory 回归', desc: '1995 年的《HIStory》以双碟姿态宣告回归，新歌与旧作一起，重新定义了“传奇仍在继续”。' }
    },
    _load: function () {
      try { return JSON.parse(localStorage.getItem(this.key)) || { found: {}, moonwalkPerfect: 0, playthroughs: 0 }; }
      catch (e) { return { found: {}, moonwalkPerfect: 0, playthroughs: 0 }; }
    },
    _save: function (d) { try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {} },
    isFound: function (id) { return !!this._load().found[id]; },
    total: function () { return Object.keys(this.defs).length; },
    count: function () { return Object.keys(this._load().found).length; },
    foundList: function () {
      var d = this._load(), self = this, out = [];
      Object.keys(this.defs).forEach(function (k) { if (d.found[k]) out.push({ id: k, icon: self.defs[k].icon, name: self.defs[k].name, desc: self.defs[k].desc }); });
      return out;
    },
    // 解锁彩蛋；返回是否「新解锁」并弹窗
    unlock: function (id) {
      var def = this.defs[id]; if (!def) return false;
      var d = this._load();
      if (d.found[id]) return false;
      d.found[id] = true; this._save(d);
      if (MJ.ui && MJ.ui.toastEgg) MJ.ui.toastEgg({ icon: def.icon, name: T('egg.' + id + '.name', null, def.name), desc: T('egg.' + id + '.desc', null, def.desc) });
      return true;
    },
    // 扫描 state.flags 中 egg_* 前缀 → 解锁对应彩蛋（变体事件选项写入 egg_xxx 时触发）
    checkFlags: function (state) {
      if (!state || !state.flags) return 0;
      var self = this, n = 0;
      Object.keys(state.flags).forEach(function (k) {
        if (k.indexOf('egg_') === 0 && state.flags[k]) {
          var id = 'EGG_' + k.slice(4).toUpperCase();
          if (self.defs[id] && self.unlock(id)) n++;
        }
      });
      if (state.flags.garyRoots) this.unlock('EGG_GARY');
      if (state.flags.apolloChampion) this.unlock('EGG_APOLLO');
      // Phase B：孤儿 flag 接入彩蛋（§17.15 中性）
      if (state.flags.captainEO) this.unlock('EGG_CAPTAINEO');
      if (state.flags.moonwalker) this.unlock('EGG_MOONWALKER');
      if (state.flags.ghosts) this.unlock('EGG_GHOSTS');
      if (state.flags.bubbles) this.unlock('EGG_BUBBLES');
      if (state.flags.superBowl) this.unlock('EGG_HALFTIME');
      return n;
    },
    // 结局时按各条目 cond 扫描玩家人生，解锁「考据彩蛋」（与趣事 revealAll 同构；§4.2.1 新增条目均带 cond）
    revealAll: function (state) {
      var self = this;
      Object.keys(this.defs).forEach(function (k) {
        var def = self.defs[k];
        if (def.cond) { try { if (def.cond(state)) self.unlock(k); } catch (e) {} }
      });
    },
    // 跨周目累计：3_1b「完美演绎」累计 3 次 → 月球漫步起源
    incMoonwalkPerfect: function () {
      var d = this._load(); d.moonwalkPerfect = (d.moonwalkPerfect || 0) + 1; this._save(d);
      if (d.moonwalkPerfect >= 3) this.unlock('EGG_MOONWALK');
    },
    // 结局时：致敬联动 + 元彩蛋（集齐 30 成就）+ 周目计数
    onEnding: function (state, endingId) {
      var s = state || (MJ.engine && MJ.engine.state);
      this.revealAll(state);
      if (s && s.meta && (s.meta.artPath || 0) >= 2 && s.flags && s.flags.anniv2001 && s.flags.thriller25) this.unlock('EGG_TRIBUTE');
      if (MJ.achievementSystem) {
        // 成就已在 ui.showEnding 统一 evaluate 并串行弹窗；此处仅用于"集齐全部"判定，避免重复评估
        var all = MJ.achievementSystem.all(), got = all.filter(function (a) { return a.unlocked; }).length;
        if (all.length > 0 && got >= all.length) this.unlock('EGG_DEV');
      }
      this.incPlaythroughs();
    },
    incPlaythroughs: function () {
      var d = this._load(); d.playthroughs = (d.playthroughs || 0) + 1; this._save(d);
      if (d.playthroughs >= 5) this.unlock('EGG_FOURTH');
    },
    // 重置全部已发现彩蛋（图鉴式 localStorage 清除）
    clear: function () {
      try { localStorage.removeItem(this.key); } catch (e) {}
    }
  };

  // ---------- 趣事与轶事系统（GDD §17.11：Trivia & Anecdotes） ----------
  // 中性、零数值影响、可收藏的 MJ 侧写；与彩蛋系统同构，复用 localStorage 持久化与 toast 队列。
  MJ.triviaSystem = {
    key: 'mj_lifechoices_trivia_v1',
    defs: {
      TRIVIA_CHARITY:        { icon: '🤝', name: '匿名代付陌生人账单', desc: '你曾悄悄为排队的陌生人结清账单，不留姓名——善意于你，本就是日常。', cond: function (s) { return s.flags.healWorld || (s.meta.phil || 0) >= 1; } },
      TRIVIA_REHEARSE:       { icon: '🎯', name: '逐帧抠动作到凌晨', desc: '录音棚的灯亮到天明，你把一个转身反复磨了十遍，只为那 0.1 秒的精准。' },
      TRIVIA_NEVERLAND_ANIMALS: { icon: '🐾', name: '给动物过生日', desc: '梦幻庄园里，你给每一只动物都过了生日，蜡烛比客人还多。', cond: function (s) { return s.flags.neverlandType && s.flags.neverlandType !== 'none'; } },
      TRIVIA_ONOMATOPOEIA:  { icon: '🎶', name: '用拟声词讲编曲', desc: '你说不清和弦时，就“咚呲哒哒”地比划给乐手听，他们竟真听懂了。', cond: function (s) { return (s.meta.artPath || 0) >= 2; } },
      TRIVIA_FANMAIL:       { icon: '✉️', name: '手写回信给歌迷', desc: '面对成山的来信，你挑出几封亲手回了字句，落款总是“Love, Michael”。', cond: function (s) { return (s.relations.fans || 0) >= 20; } },
      TRIVIA_COMIC:         { icon: '📚', name: '收藏连环画与科幻片', desc: '名利场之外，你囤了一柜子连环画和老科幻片，是只有孩子才懂的快乐。' },
      TRIVIA_BLANKET:       { icon: '🛝', name: '陪幼子玩空中秋千', desc: '你托着小儿子在怀里晃啊晃，说这是“世界上最稳的秋千”。', cond: function (s) { return s.flags.blanketBorn || s.flags.surrogacy; } },
      TRIVIA_THISISIT:      { icon: '🎬', name: '为《This Is It》逐帧打磨走位', desc: '五十场演唱会的每个走位，你都和编舞师一帧帧对过，哪怕身体已亮起红灯。', cond: function (s) { return s.flags.thisItHeld || s.flags.thisItScale; } },
      TRIVIA_GRAMMY:        { icon: '🏆', name: '把奖杯让给团队', desc: '领奖台上的聚光灯很亮，你却把奖杯先递给了身后沉默的乐手们。', cond: function (s) { return (s.meta.grammyWins || 0) >= 1 || ['otw','thriller','bad','dangerous','history','invincible'].some(function (k) { return (s.flags['grammy_' + k] || 0) >= 1; }); } },
      TRIVIA_WATW:          { icon: '🕊️', name: '为《We Are The World》熬夜合声', desc: '那一夜录音棚挤满巨星，你最后一个离开，反复确认每一句合声都严丝合缝。', cond: function (s) { return s.flags.weAreTheWorld; } },
      TRIVIA_PEACE:         { icon: '🌍', name: '在战乱之地抱起陌生孩童', desc: '镜头之外，你蹲下身把当地的孩子抱起来，那张照片从没用来宣传。', cond: function (s) { return (s.meta.phil || 0) >= 2; } },
      TRIVIA_STUDIO_LATE:   { icon: '☕', name: '深夜给乐手留热汤', desc: '你记得谁胃不好，半夜差人端去一碗热汤，说“嗓子要紧”。' },
      TRIVIA_DISCO:         { icon: '🪩', name: '向迪斯科前辈致敬', desc: '你对着霓虹扭了扭肩，向前辈们的迪斯科时代，郑重地鞠了一躬。' },
      TRIVIA_PETERPAN:      { icon: '🪶', name: '相信彼得潘不愿长大', desc: '你说自己心里也住着个不肯长大的男孩，所以才懂童话的重量。', cond: function (s) { return s.flags.dream_peterpan; } },
      TRIVIA_CHILDREN:      { icon: '🎠', name: '在 Neverland 办睡衣派对', desc: '庄园的草坪上，孩子们穿着睡衣看露天电影，你是那个递爆米花的大孩子。', cond: function (s) { return s.flags.neverlandType && s.flags.neverlandType !== 'none'; } },
      TRIVIA_HUMBLE:        { icon: '🏠', name: '成名后仍回盖瑞老宅探望', desc: '再亮的舞台也抵不过盖瑞那条巷子，你常偷偷回去，看童年住过的窗。', cond: function (s) { return (s.relations.brothers || 0) >= 10; } },
      TRIVIA_QUINCY:        { icon: '🎼', name: '与昆西为一个和弦争到天亮', desc: '你和昆西为了一个转调红过脸，又在日出时击掌——最好的搭档都这样。', cond: function (s) { return (s.relations.quincy || 0) >= 10; } },
      TRIVIA_PEPSI:         { icon: '🔥', name: '百事火场后先安慰吓哭的粉丝', desc: '84 年那场火还没散尽，你先弯腰哄住了旁边吓哭的小歌迷。', cond: function (s) { return s.flags.isPepsiBurned; } },
      TRIVIA_MOTOWN_REUNION: { icon: '💫', name: 'Motown 老友重聚弹起旧曲', desc: '老伙计们一来，你便坐到琴边，把几十年前的调子又弹了一遍。', cond: function (s) { return (s.relations.brothers || 0) >= 10 || s.flags.isSolo === true; } },
      TRIVIA_BIOPIC:        { icon: '🎬', name: '2026 银幕上的自己由亲人演绎', desc: '传记电影里演你的，是流着你血脉的人——传奇换了张脸，仍未褪色。', cond: function (s) { return s.flags.biopic2026 || s.flags.biopicMJStar; } },
      TRIVIA_COCOA:         { icon: '☕', name: '深夜录音棚的一杯热可可', desc: '凌晨的录音棚，一杯热可可捧在手里，这一夜忽然没那么冷了。' },
      TRIVIA_BUBBLES_DIARY: { icon: '🐒', name: '给猴子 Bubbles 写日记', desc: '你摊开画星星的日记本，给 Bubbles 画下今天歪头的它。' },
      TRIVIA_NEPHEWS:       { icon: '🎮', name: '和侄子们打游戏', desc: '难得清闲，几个侄子把手柄塞给你，屋里的笑声比配乐还热闹。' },
      TRIVIA_QUIET_REPLAY:  { icon: '🎞️', name: '独自看演出回放', desc: '人散了，你独自把今晚的演出又看一遍，盯着某个走神的一秒出神。' },
      TRIVIA_GARY:          { icon: '🏠', name: '盖瑞巷口的水泥地', desc: '盖瑞的那条巷子，水泥地是你最初的舞台；你常扒着门缝，看兄长们拨弄吉他。', cond: function (s) { return s.flags.garyRoots === true; } },
      TRIVIA_APOLLO:        { icon: '🏅', name: '阿波罗业余之夜', desc: '哈莱姆的阿波罗剧院，业余之夜的聚光灯下，Jackson 5 拿下了冠军——那是写在黑人音乐史里的那一夜。', cond: function (s) { return s.flags.apolloChampion === true; } },
      TRIVIA_MOTOWN:        { icon: '💫', name: 'Motown 的试唱前夜', desc: '试唱前夜，哥哥们在后台紧紧围住你；第二天，你推开了摩城那扇通往世界的大门。', cond: function (s) { return s.flags.motownAudition === true; } },

      // —— Phase 2 内容扩充（解锁靠结局 revealAll 按 cond 扫描；不新增变体，严守 4 变体裁定）——
      TRIVIA_DIALTONE:    { icon: '☎️', name: '拨号音里的节拍', desc: '你对着拨号音“嘟——嘟——”打拍子，电话那头以为是线路故障，你却笑出了声。' },
      TRIVIA_GLOVE:       { icon: '🧤', name: '一只手套的魔法', desc: '那只闪着光的单只手套，是你给自己设的暗号：只要戴上它，舞台就只属于你一个人。' },
      TRIVIA_QUIETSTAGE:  { icon: '🪑', name: '谢幕后的安静', desc: '掌声散尽，你独自坐在空荡的舞台边，听见自己的呼吸——那是最诚实的掌声。', cond: function (s) { return (s.attributes.stress || 0) <= 35; } },
      TRIVIA_MOTHERSONG:  { icon: '🎵', name: '唱给妈妈听', desc: '有次你随口哼起妈妈最爱的那首老歌，唱到一半，喉咙忽然发紧。', cond: function (s) { return (s.attributes.family || 0) >= 70; } },
      TRIVIA_HEALPLANET:  { icon: '🌍', name: '把地球缝补起来', desc: '你相信音乐能缝补裂痕：把不同肤色、不同语言的人，缝进同一段旋律里。', cond: function (s) { return s.flags.healWorld === true || (s.meta.phil || 0) >= 2; } },

      // —— Phase 3 内容扩充（§4.2.2 + §4.2.4 候选全量，结局 revealAll 按 cond 扫描解锁）——
      TRIVIA_LOUIE:           { icon: '🦙', name: '羊驼 Louie', desc: 'Neverland 的草场上，羊驼 Louie 是他的宠物之一，也是孩子们最爱的“长脖子朋友”。', cond: function (s) { return s.flags.neverlandType && s.flags.neverlandType !== 'none'; } },
      TRIVIA_HAYVENHURST:    { icon: '🏡', name: 'Hayvenhurst 的家', desc: '洛杉矶的 Hayvenhurst 是杰克逊一家的住所，也是《Bad》早期 Demo 被写下的地方。', cond: function (s) { return (s.relations.brothers || 0) >= 10 || s.flags.isSolo === true; } },
      TRIVIA_ROBOT_DANCE:    { icon: '🤖', name: '机器人舞步', desc: '1974 年《Dancing Machine》在 Soul Train 引爆“机器人舞”，那套机械律动后来成了他的招牌。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 45; } },
      TRIVIA_MOONWALK_BOOK:  { icon: '📖', name: '自传《Moonwalk》', desc: '1988 年他出版个人自传《Moonwalk》，把聚光灯外的童年与心事写进了书页。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 50; } },
      TRIVIA_DANCING_DREAM:  { icon: '📝', name: '诗集《Dancing the Dream》', desc: '1992 年他出版诗集《Dancing the Dream》，字里行间是一个孩子未曾熄灭的想象。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 50; } },
      TRIVIA_THRILLER_SHORT: { icon: '🎬', name: '《Thriller》短片', desc: '1983 年的《Thriller》MV 是开创性的叙事恐怖短片，重塑了音乐录影带的形态。', cond: function (s) { return s.flags.thriller25 === true || (s.attributes.art || 0) >= 50; } },
      TRIVIA_JANET_SCREAM:   { icon: '👩', name: '与 Janet 的《Scream》', desc: '妹妹 Janet 同为巨星，1995 年二人合作《Scream》，荧幕上的兄妹对唱成了经典。', cond: function (s) { return (s.relations.brothers || 0) >= 10 || (s.attributes.reputation || 0) >= 60; } },
      TRIVIA_JACKSON5_DEBUT: { icon: '🎤', name: 'Jackson 5 出道', desc: 'Jackson 5 由家兄弟组成，1969 年以《Diana Ross Presents The Jackson 5》正式出道。', cond: function (s) { return (s.relations.brothers || 0) >= 10 || s.flags.isSolo === true; } },
      TRIVIA_VICTORY_TOUR:   { icon: '🚌', name: 'Victory 巡演', desc: '1984 年的 Victory Tour 是兄弟们最后一次同台巡演，年底他便离开了组合。', cond: function (s) { return (s.relations.brothers || 0) >= 10; } },
      TRIVIA_WEMBLEY:        { icon: '🏟️', name: '温布利之夜', desc: '1988.7.16 的温布利演唱会（Bad World Tour）成为传奇现场，数万人的合唱响彻夜空。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 55; } },
      TRIVIA_30TH_ANNIV:     { icon: '🎉', name: '30 周年庆典', desc: '2001 年的“30 周年庆典”在纽约麦迪逊广场花园举行，故人新朋同台致敬。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 55 || (s.attributes.reputation || 0) >= 60; } },
      TRIVIA_THRILLER25:     { icon: '💿', name: '《Thriller 25》', desc: '2008 年的《Thriller 25》是 25 周年纪念专辑，收录了未发表的曲目。', cond: function (s) { return s.flags.thriller25 === true || (s.attributes.art || 0) >= 50; } },
      TRIVIA_THRILLER40:     { icon: '💽', name: '《Thriller 40》', desc: '2022 年的《Thriller 40》是 40 周年纪念专辑，让经典在新时代再度回响。', cond: function (s) { return s.flags.thriller25 === true || (s.meta.artPath || 0) >= 1; } },
      TRIVIA_KING_OF_POP:    { icon: '👑', name: '流行之王', desc: '他被冠以“流行之王（King of Pop）”之名，是 20 世纪最具文化影响力的音乐人之一。', cond: function (s) { return (s.attributes.reputation || 0) >= 65; } },
      TRIVIA_BEN_SOLO1:      { icon: '🐶', name: '《Ben》登顶 Solo', desc: '1972 年的《Ben》是他首支个人冠军单曲，少年的嗓音第一次独自站上榜首。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 40; } },
      TRIVIA_ATV_CATALOG:    { icon: '📜', name: 'ATV 版权版图', desc: '1985 年他购入 Beatles 与 ATV 曲库版权，把旋律变成了可传承的资产。', cond: function (s) { return (s.attributes.wealth || 0) >= 45 || (s.meta.mogul || 0) >= 1 || (s.attributes.reputation || 0) >= 60; } },
      TRIVIA_BEATIT_GANGS:   { icon: '🤝', name: '《Beat It》的真实面孔', desc: '《Beat It》请来真实的帮派青年出演，用舞蹈代替对抗，唱出反暴力的姿态。', cond: function (s) { return (s.meta.artPath || 0) >= 1 || (s.attributes.art || 0) >= 45; } },
      TRIVIA_BLACKORWHITE_PREMIERE: { icon: '📺', name: '《Black or White》首播', desc: '1991 年《Black or White》全球首播，约一亿观众同时守在屏幕前。', cond: function (s) { return s.flags.blackOrWhite === true || (s.attributes.reputation || 0) >= 55 || (s.meta.artPath || 0) >= 1; } },
      // ---------- P2：W6 身后冷知识（MJ the Musical / Cirque / Thriller 40 / 传记片 / 遗产慈善） ----------
      // 仅对续章线（survived2009）解锁，符合「身后」语义；均为中性、零数值影响、可收藏侧写。
      TRIVIA_MUSICAL_2022: { icon: '🎭', name: '《MJ》音乐剧', desc: '2022 年，《MJ》音乐剧在百老汇开演，以编舞与金曲重述你的一生，掌声里坐着无数后来者。', cond: function (s) { return s.flags.survived2009 === true; } },
      TRIVIA_CIRQUE:       { icon: '🎪', name: '太阳马戏的致敬', desc: '拉斯维加斯的《Michael Jackson: ONE》常驻秀，把你的舞步变成一场永不落幕的光影。', cond: function (s) { return s.flags.survived2009 === true; } },
      TRIVIA_THRILLER40:   { icon: '🧟', name: '《Thriller》四十周年', desc: '2023 年，《Thriller》重发四十周年，黑胶再度登上榜首——怪物仍在跳舞。', cond: function (s) { return s.flags.survived2009 === true; } },
      TRIVIA_BIOPIC_2026:  { icon: '🎬', name: '银幕上的传记', desc: '2026 年，一部关于你的传记电影官宣开拍，由后来者把这段传奇重新搬上大银幕。', cond: function (s) { return s.flags.survived2009 === true; } },
      TRIVIA_ESTATE_PHIL:  { icon: '💛', name: '遗产里的善意', desc: '即便你已不在舞台中央，遗产管理委员会仍持续运营慈善，让《Thriller》的旋律与善意一起流传。', cond: function (s) { return s.flags.survived2009 === true && (s.meta.phil || 0) >= 3; } },

      // —— P2-B：Cascio/Porte 相关冷知识（§17.15 严格中性：不点名、不渲染、不断言，仅陈述可考证公开事实）——
      TRIVIA_DOC_2003:  { icon: '📺', name: '一部纪录片的回响', desc: '2003 年，一部电视纪录片把聚光灯重新打在你身上，引发了一场旷日持久的公共讨论——镜头之外，是非留给了时间。', cond: function (s) { return s.flags.survived2009 === true; } },
      TRIVIA_ESTATE_LITIGATION: { icon: '⚖️', name: '遗产相关的数起诉讼', desc: '你离场之后，围绕遗产的数起诉讼陆续提起、也陆续结案——账册合上，传奇仍在被一代代讲述。', cond: function (s) { return s.flags.survived2009 === true; } },
      TRIVIA_BILLIE_JEAN_MTV: { icon: '📺', name: '《Billie Jean》破壁 MTV', desc: '1983 年，《Billie Jean》的黑白影像成为 MTV 首批大量播出的黑人艺人作品之一，悄悄改写了电视台的肤色边界。', cond: function (s) { return s.flags.thriller25 === true || (s.attributes.art || 0) >= 50; } },
      TRIVIA_DONATED_500M:   { icon: '💛', name: '匿名捐出约五亿美元', desc: '据公开估算，你一生向慈善机构捐款约五亿美元，善意从不写在收据上。', cond: function (s) { return s.flags.healWorld === true || (s.meta.phil || 0) >= 1; } },
      TRIVIA_13_GRAMMY:     { icon: '🏆', name: '十三座格莱美', desc: '你职业生涯共获 13 座格莱美奖，其中包括传奇与终身成就类的加冕。', cond: function (s) { return (s.meta.grammyWins || 0) >= 1 || (s.attributes.reputation || 0) >= 70; } },
      TRIVIA_FIVE_DECADES:  { icon: '📈', name: '横跨五个十年的前十', desc: '你是史上首位在五个不同十年都进入 Billboard 前十的艺人，时间没能拦住旋律。', cond: function (s) { return (s.attributes.reputation || 0) >= 70 || (s.meta.artPath || 0) >= 2; } },
      TRIVIA_PEPSI_DEAL:    { icon: '🥤', name: '百事破纪录的代言', desc: '1984 年，你以约 500 万美元签下百事代言，刷新了当时艺人商业合作的纪录——镜头之外的故事，从不写进合同。', cond: function (s) { return s.flags.isSolo === true || (s.attributes.wealth || 0) >= 40; } }
    },
    _load: function () {
      try { return JSON.parse(localStorage.getItem(this.key)) || { found: {} }; } catch (e) { return { found: {} }; }
    },
    _save: function (d) { try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {} },
    isFound: function (id) { return !!this._load().found[id]; },
    total: function () { return Object.keys(this.defs).length; },
    count: function () { return Object.keys(this._load().found).length; },
    foundList: function () {
      var d = this._load(), self = this, out = [];
      Object.keys(this.defs).forEach(function (k) { if (d.found[k]) out.push({ id: k, icon: self.defs[k].icon, name: self.defs[k].name, desc: self.defs[k].desc }); });
      return out;
    },
    // 解锁趣事；返回「是否新解锁」并弹窗（与彩蛋同队列，避免重叠）
    unlock: function (id) {
      var def = this.defs[id]; if (!def) return false;
      var d = this._load();
      if (d.found[id]) return false;
      d.found[id] = true; this._save(d);
      if (MJ.ui && MJ.ui.toastTrivia) MJ.ui.toastTrivia({ icon: def.icon, name: T('trivia.' + id + '.name', null, def.name), desc: T('trivia.' + id + '.desc', null, def.desc) });
      return true;
    },
    // 扫描 state.flags 中 tidbit_ 前缀 → 解锁对应 TRIVIA_<UPPER>（由 V_TIDBIT 轻量变体写入）
    checkFlags: function (state) {
      if (!state || !state.flags) return 0;
      var self = this, n = 0;
      Object.keys(state.flags).forEach(function (k) {
        if (k.indexOf('tidbit_') === 0 && state.flags[k]) {
          var id = 'TRIVIA_' + k.slice(7).toUpperCase();
          if (self.defs[id] && self.unlock(id)) n++;
        }
      });
      return n;
    },
    // 结局时按各条目 cond 扫描玩家人生，解锁「考据趣事」（与玩法状态联动）
    revealAll: function (state) {
      var self = this;
      Object.keys(this.defs).forEach(function (k) {
        var def = self.defs[k];
        if (def.cond) { try { if (def.cond(state)) self.unlock(k); } catch (e) {} }
      });
    },
    // 重置全部已发现趣事（图鉴式 localStorage 清除）
    clear: function () {
      try { localStorage.removeItem(this.key); } catch (e) {}
    }
  };

  // M2 扩展：假如…（想象）微片段（GDD §17.11 hypothetical vignettes），按主导元路线程序化生成
  MJ.buildVignettes = function (state) {
    var tpls = (MJ.config.vignetteTemplates) || {};
    var dom = MJ.dominantMeta(state.meta);
    var out = [];
    (tpls[dom] || []).forEach(function (t) {
      try { if (!t.cond || t.cond(state)) out.push(MJ.t(t.key, null, t.zh)); } catch (e) {}
    });
    (tpls.default || []).forEach(function (t) {
      try { out.push(MJ.t(t.key, null, t.zh)); } catch (e) {}
    });
    return out;
  };

  // §17.4 专项子维度：把"创作企划器"写入的 cp_* 画像转为展示层（不改核心结局逻辑）
  MJ.buildSubDims = function (state) {
    var f = state.flags || {};
    return [
      { key: 'vision', name: '视野', val: f.cp_vision || 0 },
      { key: 'innovation', name: '创新', val: f.cp_innovation || 0 },
      { key: 'craft', name: '制作', val: f.cp_craft || 0 },
      { key: 'collab', name: '合作', val: f.cp_collab || 0 },
      { key: 'stagecraft', name: '舞台呈现', val: f.cp_stagecraft || 0 }
    ];
  };
  // §17.4 决策风格档案（后端倾向，纯展示 + 影响 hint 语气，不影响结局判定）
  MJ.decisionStyle = function (state) {
    var f = state.flags || {}, m = state.meta || {};
    var map = [
      { s: 'innovator', zh: '先锋开拓者', en: 'Trailblazing Innovator', t: function () { return (f.cp_innovation || 0) >= 80; } },
      { s: 'craftsman', zh: '稳健匠人', en: 'Steady Craftsman', t: function () { return (f.cp_craft || 0) >= 80 && (f.cp_collab || 0) >= 70; } },
      { s: 'mogul', zh: '商业谋略', en: 'Sharp Mogul', t: function () { return (m.mogul || 0) >= 2; } },
      { s: 'phil', zh: '温润善者', en: 'Gentle Philanthropist', t: function () { return (m.phil || 0) >= 2; } },
      { s: 'recluse', zh: '隐居哲思', en: 'Reclusive Thinker', t: function () { return (m.recluse || 0) >= 2; } }
    ];
    for (var i = 0; i < map.length; i++) { try { if (map[i].t()) return map[i]; } catch (e) {} }
    return { s: 'explorer', zh: '随性探索', en: 'Free Explorer' };
  };


})();
