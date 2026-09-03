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
    this.history = []; // { year, title, choice }
  }

  // 变更属性或元路线计数（属性钳制 0–100，元路线为非负整数）
  GameState.prototype.changeAttr = function (key, delta) {
    if (key in this.attributes) {
      var v = (this.attributes[key] || 0) + delta;
      this.attributes[key] = Math.max(0, Math.min(100, v));
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
