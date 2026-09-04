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
      state.changeAttr(k, eff[k]);
    }
  }
  MJ.applyEffects = applyEffects;

  // 选项后果的“回响”短叙事（前置小剧情）：优先用 bespoke epilogue，否则按数值合成。
  function consequenceLine(opt, state) {
    if (opt.epilogue) return opt.epilogue;
    var eff = opt.effects || {};
    if (typeof eff === 'function') eff = eff(state);
    var map = {
      health: function (d) { return d > 0 ? '身子骨稳了一分' : '元气又损了一截'; },
      reputation: function (d) { return d > 0 ? '声名更响亮了些' : '口碑悄悄蒙尘'; },
      wealth: function (d) { return d > 0 ? '进项让荷包鼓了些' : '开销又添了一笔'; },
      family: function (d) { return d > 0 ? '家的温度回升了些' : '亲情又凉了一截'; },
      art: function (d) { return d > 0 ? '技艺更精进了些' : '灵感稍稍游离'; },
      stress: function (d) { return d > 0 ? '紧绷感又爬上肩头' : '呼吸松快了些'; }
    };
    var parts = [];
    ['health', 'reputation', 'wealth', 'family', 'art', 'stress'].forEach(function (k) {
      var d = eff[k];
      if (typeof d === 'number' && Math.abs(d) >= 8 && map[k]) parts.push(map[k](d));
    });
    if (opt.moneyEffect) parts.push(opt.moneyEffect < 0 ? '账上又见一处窟窿' : '账上添了一笔进项');
    if (!parts.length) return null;
    return '尘埃落定——' + parts.join('，') + '。';
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
      try { if (!tpls[i].cond || tpls[i].cond(state)) return tpls[i].text; } catch (e) {}
    }
    return '';
  };

  // M4 命运回响：收集所有命中 flag 的跨章因果回响（去重由调用方负责）
  MJ.buildEchoes = function (state) {
    var tpls = MJ.config.echoTemplates || [];
    var out = [];
    for (var i = 0; i < tpls.length; i++) {
      try { if (tpls[i].cond(state)) out.push(tpls[i].text); } catch (e) {}
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

  MJ.resolveEnding = function (state, entryId) {
    var f = state.flags, a = state.attributes, m = state.meta;
    var burned = f.isPepsiBurned === true;
    var dependent = f.painkillerDependent === true;
    var held = f.thisItHeld === true;
    var debt = state.debt === true;

    if (entryId === 'END_PLAIN') return 'END_PLAIN';          // 1. 硬性分支（1_5 留盖瑞早退）
    if (f.isSolo === false) return 'END_FAMILY';              // 2. 始终未单飞
    // 3. 真·永恒隐藏结局（终极）：不烧伤/不负债 + 艺术&声誉&健康极致 + 慈善&艺术路线极致 + 双加冕标志（多方极致收敛）
    if (!burned && !debt && (a.art || 0) >= 88 && (a.reputation || 0) >= 88 && (a.health || 0) >= 80 && (m.phil || 0) >= 3 && (m.artPath || 0) >= 2 && (f.thriller25 && f.anniv2001)) {
      return 'END_TRUE_ETERNAL';
    }
    var dom = dominantMeta(m);
    if (dom === 'recluse' && a.health >= 40) return 'END_RECLUSE';        // 4
    if (m.mogul >= 2 && !debt && a.wealth >= 60) return 'END_MOGUL';      // 5
    if (m.phil >= 3 && !debt) return 'END_PHILANTHROPIST';   // 6
    if (!burned && a.art >= 75 && a.reputation >= 65 && a.health >= 55 && (f.thriller25 || f.anniv2001)) return 'END_ETERNAL'; // 7 巅峰需加冕标志
    if (!burned && a.health >= 50 && a.reputation >= 60) return 'END_PERFECT';     // 8 健康谢幕（需声誉达标，否则归争议缠身）
    if (burned && !dependent && held && a.health >= 40) return 'END_ART_PEAK'; // 9
    if (burned && dependent && held && a.health >= 35) return 'END_TRAGIC';    // 10
    if (debt && !held) return 'END_SURVIVE_DEBT';            // 11 负债但取消巡演保命
    if (debt) return 'END_FINANCIAL';                        // 12 债务压垮
    if ((a.reputation < 60 && f.settlement1993) || ((a.media || 0) < 25 && (f.settlement1993 || f.secondCharge))) return 'END_CONTROVERSIAL'; // 13 声誉承压（M5 媒体轴联动）
    return 'END_TRAGIC';                                     // 14 默认
  };

  // ---------- 事件引擎 ----------
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
      this.go('start');
    },

    resume: function (data) {
      this.state = new MJ.GameState();
      this.state.hydrate(data);
      this._usedVariants = {};
      this._return = null;
      var id = (data && data.currentId) ? data.currentId : 'start';
      this.go(id);
    },

    // 尝试为当前章节插入一个变体事件（GDD 5.6）
    pickVariant: function (year) {
      var evs = MJ.EVENTS, best = null;
      for (var id in evs) {
        if (!evs.hasOwnProperty(id)) continue;
        var v = evs[id];
        if (!v.variant || this._usedVariants[id]) continue;
        if (year < v.window[0] || year > v.window[1]) continue;
        if (v.cond && !v.cond(this.state)) continue; // 变体亦可带条件门控
        if (Math.random() * 100 < v.weight) { best = id; break; }
      }
      if (best) { this._usedVariants[best] = true; this.state.stats.variants++; }
      return best;
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
        var vid = this.pickVariant(ev.year);
        if (vid) { this._return = id; return this.go(vid); }
      }

      this.current = ev;
      this.state.stats.events = (this.state.stats.events || 0) + 1; // 途经人生节点计数
      MJ.saveSystem.save(this.state); // 进入新事件即存档（含 currentId），刷新可续玩

      // M3 章节过场：主线非结局事件跨越新章节时，先弹“时代卡片”（含 M2 手记 / M4 命运回响），再展示事件
      if (!ev.variant && ev.kind !== 'ending') {
        var ch = MJ.chapterOf(ev);
        if (ch !== this.state.era) {
          this.state.era = ch;
          this._recordChapter(ch);
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
        s.diary.push({ chapter: chapterId, title: (MJ.config.chapters[chapterId] || {}).title || '', text: frag });
        if (s.diary.length > 6) s.diary.shift();
      }
      MJ.buildEchoes(s).forEach(function (t) {
        if (s.echoes.indexOf(t) < 0) s.echoes.push(t);
      });
    },

    optionsOf: function (ev) {
      return typeof ev.options === 'function' ? ev.options(this.state) : ev.options;
    },

    choose: function (optIndex) {
      var ev = this.current;
      var opts = this.optionsOf(ev);
      var opt = opts[optIndex];
      if (!opt) return;

      this.state.pushHistory({ year: MJ.eventYear(ev), title: ev.title, choice: opt.label, key: !!ev.key });
      if (ev.key) this.state.stats.keyChoices++;
      applyEffects(opt.effects, this.state);
      if (opt.moneyEffect) this.state.applyMoney(opt.moneyEffect);
      if (opt.flags) for (var k in opt.flags) this.state.setFlag(k, opt.flags[k]);
      MJ.ruleEngine.afterEvent(this.state);

      this.pendingEpilogue = consequenceLine(opt, this.state);

      MJ.saveSystem.save(this.state);
      this.advance(opt.next);
    },

    proceed: function () {
      var ev = this.current;
      applyEffects(ev.effects, this.state);
      if (ev.flags) for (var k in ev.flags) this.state.setFlag(k, ev.flags[k]);
      this.state.pushHistory({ year: MJ.eventYear(ev), title: ev.title, choice: '（经历）', key: !!ev.key });
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
    // 供图鉴面板使用：返回 [{id,name,icon,desc,unlocked}]
    all: function () {
      var self = this;
      return (MJ.config.achievements || []).map(function (a) {
        return { id: a.id, name: a.name, icon: a.icon, desc: a.desc, unlocked: self.isUnlocked(a.id) };
      });
    }
  };
})();
