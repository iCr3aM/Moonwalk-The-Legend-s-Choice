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
    this.debt = false;
    // 初始财富属性由净资产推导（与 Economy 联动）
    var _scale0 = (cfg.wealthScale) || 150;
    this.attributes.wealth = Math.max(0, Math.min(100, Math.round(cfg.initialNetWorth / _scale0)));
    this.history = []; // { year, title, choice }
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
    if (this.netWorth < 0) this.debt = true;
    // 财富属性（0–100）由净资产推导，确保「财富」与「净资产」始终一致
    var scale = (MJ.config && MJ.config.wealthScale) || 150;
    var w = Math.round(this.netWorth / scale);
    this.attributes.wealth = Math.max(0, Math.min(100, w));
  };

  GameState.prototype.setFlag = function (name, val) {
    this.flags[name] = val;
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
      meta: this.meta,
      netWorth: this.netWorth,
      debt: this.debt,
      history: this.history,
      currentId: cur
    };
  };

  GameState.prototype.hydrate = function (data) {
    if (!data) return;
    this.attributes = data.attributes || this.attributes;
    this.flags = data.flags || this.flags;
    this.meta = data.meta || this.meta;
    this.netWorth = data.netWorth != null ? data.netWorth : this.netWorth;
    this.debt = !!data.debt;
    this.history = data.history || [];
  };

  MJ.GameState = GameState;
})();
