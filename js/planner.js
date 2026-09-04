/* planner.js — 创作企划器 + 巡演自定义 → 格莱美涌现联动（GDD §17.14）
 * 仅依赖 state 的标准接口（flags / attributes / meta / changeAttr），无 DOM 依赖。
 * 解析公式见 GDD §17.14.4：五维加权 + 时代 bias + 阈值 → 0–8 座。
 * 由格莱美揭晓节点的 onEnter 钩子（engine.go）调用，结算在进入展示前完成。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // 时代基线：Thriller 易登顶、HIStory/Invincible 须超常企划才破零（呼应史实又不锁死）
  var BIAS = { otw: 0, thriller: 6, bad: 3, dangerous: 0, history: -4, invincible: -6 };

  MJ.planner = {
    // 由企划画像(cp_*) + 当下声誉/艺术势头，结算该专辑格莱美座数，并写回 state
    resolveGrammy: function (state, key) {
      var f = state.flags, a = state.attributes;
      var v = f.cp_vision || 0, c = f.cp_craft || 0, i = f.cp_innovation || 0,
          co = f.cp_collab || 0, st = f.cp_stagecraft || 0;
      var momentum = ((a.reputation || 0) + (a.art || 0)) / 2;
      var q = 0.22 * v + 0.18 * c + 0.20 * i + 0.12 * co + 0.18 * st + 0.10 * momentum;
      q = clamp(q + (BIAS[key] || 0), 0, 100);
      var wins = q >= 88 ? 6 + Math.round((q - 88) / 3)
                : q >= 75 ? 3 + Math.round((q - 75) / 6)
                : q >= 60 ? (q >= 68 ? 2 : 1) : 0;
      wins = Math.min(8, wins); // 钳顶：大满贯上限 8 座（贴合史实 + §17.14 阈值语义）
      var fk = 'grammy_' + key;
      var done = '_gresolved_' + key;
      if (state.flags[done]) return state.flags[fk]; // 幂等：重载后续玩不重复累加
      state.flags[fk] = wins;
      state.meta.grammyWins = (state.meta.grammyWins || 0) + wins;
      state.changeAttr('reputation', Math.min(20, wins * 2));
      state.changeAttr('art', Math.min(8, wins));
      state.flags[done] = true;
      return wins;
    },
    // 调试/测试辅助：清除某专辑的结算标记（不影响其他数据）
    reset: function (state, key) {
      if (state && state.flags) {
        delete state.flags['_gresolved_' + key];
        delete state.flags['grammy_' + key];
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = MJ.planner;
})();
