/* state.js — 游戏状态与 Economy 子系统
 * 修复旧原型“财富 clamp”缺陷：0–100 的 wealth 属性 与 净资产(netWorth)/债务(debt)
 * 双轨分离，大额金钱走 Economy，不再污染属性刻度。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  function GameState() {
    var cfg = MJ.config;
    this.attributes = Object.assign({}, cfg.initialAttributes);
    this.flags = Object.assign({}, cfg.initialFlags);
    this.meta = Object.assign({}, cfg.initialMeta);
    this.netWorth = cfg.initialNetWorth; // 万元
    this.timeline = {}; // 架空历史时间线分叉（BP 决策点写入，如 '1975':'motown'）
    this.debt = false;
    // 卓越档：声誉/艺术超出 100 的溢出值（独立计数，不污染 0–100 刻度与结局/成就阈值）
    this.overflow = { reputation: 0, art: 0 };
    // 初始财富属性由净资产推导（与 Economy 联动）
    var _scale0 = (cfg.wealthScale) || 150;
    this.attributes.wealth = Math.max(0, Math.min(100, Math.round(cfg.initialNetWorth / _scale0)));
    // M1 具名 NPC 好感（-100..100，初值 0）
    this.relations = Object.assign({}, cfg.initialRelations);
    // 关系网「已结识」标记：首次实际好感交互置位（羁绊卡/回响面板按此门控显示）
    this.relMet = {};
    // M2 人生手记 / M4 命运回响 / M3 当前章节（持久化以避免续玩时重复生成）
    this.diary = [];     // [{ chapter, title, text }]
    this.echoes = [];    // [text]
    this.era = -1;       // 当前章节索引（-1=尚未进入）
    this.history = []; // { year, title, choice }
    this.stats = { variants: 0, keyChoices: 0, events: 0 }; // 生涯数据（深度反馈）
  }

  // 变更属性或元路线计数（属性钳制 0–100，元路线为非负整数）
  GameState.prototype.changeAttr = function (key, delta) {
    if (key in this.attributes) {
      var cur = this.attributes[key] || 0;
      var nv = cur + delta;
      // 软上限：声誉/艺术/压力进入高分段(>85)后收益递减(×0.5)，避免过早顶满 100，
      // 但保留可达 85–100 的空间（艺术家巅峰等结局需要 art>=85）。
      if (delta > 0 && nv > 85 && (key === 'reputation' || key === 'art' || key === 'stress')) {
        nv = cur + delta * 0.5;
      }
      // 卓越档：声誉/艺术超过 100 的部分计入独立 overflow（0–100 刻度与结局/成就阈值完全不动）
      if ((key === 'reputation' || key === 'art') && nv > 100) {
        this.overflow[key] = (this.overflow[key] || 0) + Math.round(nv - 100);
        nv = 100;
      }
      this.attributes[key] = Math.max(0, Math.min(100, nv));
    } else if (key in this.meta) {
      var m = (this.meta[key] || 0) + delta;
      this.meta[key] = Math.max(0, m);
    }
  };

  // Economy：入账/支出（万元）。净资产转负即债务。
  GameState.prototype.applyMoney = function (amount) {
    if (!amount) return;
    this.netWorth += amount;
    this.debt = this.netWorth < 0; // 负债=当前资不抵债；资产转正即解除，修复"富有却财务崩溃"
    // 财富属性（0–100）由净资产推导，确保「财富」与「净资产」始终一致
    var scale = (MJ.config && MJ.config.wealthScale) || 150;
    var w = Math.round(this.netWorth / scale);
    this.attributes.wealth = Math.max(0, Math.min(100, w));
  };

  GameState.prototype.setFlag = function (name, val) {
    this.flags[name] = val;
  };

  // M1 关系好感变更（钳制 -100..100）
  GameState.prototype.changeRel = function (name, delta) {
    if (!delta) return;
    var cur = this.relations[name] || 0;
    this.relations[name] = Math.max(-100, Math.min(100, cur + delta));
    this.relMet[name] = true; // 任何实际好感交互即视为「已结识」
  };

  GameState.prototype.pushHistory = function (entry) {
    this.history.push(entry);
  };

  // 序列化为存档对象
  GameState.prototype.serialize = function () {
    var cur = (MJ.engine && MJ.engine.current) ? MJ.engine.current.id : null;
    return {
      attributes: this.attributes,
      flags: this.flags,
      timeline: this.timeline,
      meta: this.meta,
      netWorth: this.netWorth,
      debt: this.debt,
      relations: this.relations,
      relMet: this.relMet,
      diary: this.diary,
      echoes: this.echoes,
      era: this.era,
      history: this.history,
      stats: this.stats,
      overflow: this.overflow,
      currentId: cur,
      returnId: (MJ.engine && MJ.engine._return) ? MJ.engine._return : null
    };
  };

  GameState.prototype.hydrate = function (data) {
    if (!data) return;
    this.attributes = data.attributes || this.attributes;
    this.flags = data.flags || this.flags;
    this.meta = data.meta || this.meta;
    this.netWorth = data.netWorth != null ? data.netWorth : this.netWorth;
    this.debt = this.netWorth < 0; // 由净资产派生，存档不存债务快照
    this.timeline = data.timeline || {};
    this.relations = data.relations || Object.assign({}, MJ.config.initialRelations);
    if (data.relMet) { this.relMet = data.relMet; }
    else {
      // 旧存档兼容：无 relMet 时由非零好感回推「已结识」
      this.relMet = {};
      for (var rk in this.relations) {
        if (this.relations.hasOwnProperty(rk) && this.relations[rk]) this.relMet[rk] = true;
      }
    }
    this.diary = data.diary || [];
    this.echoes = data.echoes || [];
    this.era = (data.era != null) ? data.era : -1;
    this.history = data.history || [];
    this.stats = data.stats || { variants: 0, keyChoices: 0, events: 0 };
    this.overflow = data.overflow || { reputation: 0, art: 0 };
  };

  MJ.GameState = GameState;
})();
