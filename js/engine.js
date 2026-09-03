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
      var stress = state.attributes.stress || 0;
      var dmg = Math.floor(stress / 20); // GDD 8.1: health -= floor(stress/20)
      if (dmg > 0) {
        state.attributes.health = Math.max(0, state.attributes.health - dmg);
      }
      // 兜底钳制
      ['health', 'reputation', 'wealth', 'family', 'art', 'stress'].forEach(function (k) {
        var v = state.attributes[k];
        if (v != null) state.attributes[k] = Math.max(0, Math.min(100, v));
      });
    }
  };

  // ---------- 效应应用（属性 / 元路线 / 金钱） ----------
  function applyEffects(eff, state) {
    if (!eff) return;
    if (typeof eff === 'function') eff = eff(state);
    for (var k in eff) {
      if (!eff.hasOwnProperty(k)) continue;
      if (k === 'money') { state.applyMoney(eff[k]); continue; }
      state.changeAttr(k, eff[k]);
    }
  }
  MJ.applyEffects = applyEffects;

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

  MJ.resolveEnding = function (state, entryId) {
    var f = state.flags, a = state.attributes, m = state.meta;
    var burned = f.isPepsiBurned === true;
    var dependent = f.painkillerDependent === true;
    var held = f.thisItHeld === true;
    var full = f.thisItFull === true;
    var reduced = f.thisItReduced === true;
    var debt = state.debt === true;

    if (entryId === 'END_PLAIN') return 'END_PLAIN';          // 1. 硬性分支
    if (f.isSolo === false) return 'END_FAMILY';              // 2. 始终未单飞
    var dom = dominantMeta(m);
    if (dom === 'recluse' && a.health >= 45) return 'END_RECLUSE';        // 3
    if (m.mogul >= 2 && !debt && a.wealth >= 60) return 'END_MOGUL';      // 4
    if (m.phil >= 3 && !debt) return 'END_PHILANTHROPIST';   // 5
    if (!burned && a.art >= 85 && a.reputation >= 75 && a.health >= 60) return 'END_ETERNAL'; // 6
    if (!burned && a.health >= 70 && (!held || reduced)) return 'END_PERFECT'; // 7
    if (burned && !dependent && held && full) return 'END_ART_PEAK';       // 8
    if (burned && dependent && held && full) return 'END_TRAGIC';          // 9
    if (debt === true) return 'END_FINANCIAL';               // 10
    if (a.reputation < 30 && f.settlement1993) return 'END_CONTROVERSIAL'; // 11
    if (!held && debt) return 'END_SURVIVE_DEBT';            // 12
    return 'END_TRAGIC';                                     // 13 默认
  };

  // ---------- 事件引擎 ----------
  var engine = {
    state: null,
    current: null,
    _return: null,
    _usedVariants: null,

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
      if (best) this._usedVariants[best] = true;
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
      MJ.saveSystem.save(this.state); // 进入新事件即存档（含 currentId），刷新可续玩
      MJ.ui.showEvent(ev, this.state);
    },

    optionsOf: function (ev) {
      return typeof ev.options === 'function' ? ev.options(this.state) : ev.options;
    },

    choose: function (optIndex) {
      var ev = this.current;
      var opts = this.optionsOf(ev);
      var opt = opts[optIndex];
      if (!opt) return;

      this.state.pushHistory({ year: ev.year, title: ev.title, choice: opt.label });
      applyEffects(opt.effects, this.state);
      if (opt.moneyEffect) this.state.applyMoney(opt.moneyEffect);
      if (opt.flags) for (var k in opt.flags) this.state.setFlag(k, opt.flags[k]);
      MJ.ruleEngine.afterEvent(this.state);

      MJ.saveSystem.save(this.state);
      this.advance(opt.next);
    },

    proceed: function () {
      var ev = this.current;
      applyEffects(ev.effects, this.state);
      if (ev.flags) for (var k in ev.flags) this.state.setFlag(k, ev.flags[k]);
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
})();
