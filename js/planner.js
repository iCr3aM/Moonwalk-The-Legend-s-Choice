/* planner.js — 创作企划器 + 巡演自定义 → 格莱美涌现联动（GDD §17.14）
 * 仅依赖 state 的标准接口（flags / attributes / meta / changeAttr），无 DOM 依赖。
 * 解析公式见 GDD §17.14.4：五维加权 + 时代 bias + 阈值 → 涌现 0–16 座（q<56 即 0）；
 *   最终座数 = min(GRAMMY_CAP, GRAMMY_FLOOR[key] + 涌现)，GRAMMY_CAP=20；
 *   现实保底 + 选择加成，累计可冲 50 座（spec §14.5/§14.9）；隐士路线绕过保底归零。
 * 由格莱美揭晓节点的 onEnter 钩子（engine.go）调用，结算在进入展示前完成。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // 时代基线：Thriller 易登顶、HIStory/Invincible 须超常企划才破零（呼应史实又不锁死）
  var BIAS = { otw: 0, thriller: 6, bad: 3, dangerous: 0, history: -4, invincible: -6 };
  // 现实保底（用户拍板 模式A：仅 otw/thriller 设>0，其余 0 由选择加成补足）
  // 含义：以 MJ 现实真实获奖数作「保底」，玩家操作再在其上叠加涌现座数
  // 模式A（用户拍板：仅 otw/thriller 现实保底，其余由选择加成补足）。
  // 史实核对 docs/mjwiki/：otw=1(1980 最佳男 R&B 声乐《Don't Stop》)、thriller=8(1984 单夜 8 座)；
  // bad=0(仅技术工程奖)、dangerous=0(1993 荣誉 Legend Award)、history 史实=1(1996《Scream》录像带奖，非保底故 0)、invincible=0。
  var GRAMMY_FLOOR = { otw: 1, thriller: 8, bad: 0, dangerous: 0, history: 0, invincible: 0 };
  // 钳顶：允许 what-if 远超史实（CAP=20 > 史实峰值 Thriller 8 座；累计可冲 50）。spec §14.5/§14.9
  var GRAMMY_CAP = 20;

  // 现实锚点：MJ 生涯公认 13 座格莱美（含荣誉类，格莱美官网口径），用于"低于现实 MJ"对照。spec §14.9
  var GRAMMY_REAL_TOTAL = 13;

  // 各专辑格莱美奖项池（按声望降序；结算时取前 wins 项即本届具体获奖）。
  // 数据来源：docs/mjwiki/ 各颁奖页与专辑页逐项核实（Thriller 单夜 8 座、Bad 录音工程+
  // 《Leave Me Alone》录影带、HIStory《Scream》录影带等）；what-if 高产出时叠加 MJ 生涯
  // 真实关联/时代合理类别补足池长，使具体奖项清单可信。spec §14.10
  var GRAMMY_POOLS = {
    otw: [
      { c: 'bestRnbVocalMale', w: "Don't Stop 'Til You Get Enough", zh: '最佳R&B男歌手' },
      { c: 'albumOfYear', w: 'Off the Wall', zh: '年度专辑' },
      { c: 'recordOfYear', w: "Don't Stop 'Til You Get Enough", zh: '年度唱片' },
      { c: 'bestPopVocalMale', w: "Don't Stop 'Til You Get Enough", zh: '最佳流行男歌手' },
      { c: 'producerOfYear', w: 'Off the Wall', zh: '年度制作人(非古典)' },
      { c: 'bestDiscoRecording', w: 'Off the Wall', zh: '最佳迪斯科录音' },
      { c: 'bestRnbSong', w: "Don't Stop 'Til You Get Enough", zh: '最佳R&B歌曲' },
      { c: 'bestEngineered', w: 'Off the Wall', zh: '最佳非古典录音工程' },
      { c: 'bestRnbAlbum', w: 'Off the Wall', zh: '最佳R&B专辑' },
      { c: 'bestPopAlbum', w: 'Off the Wall', zh: '最佳流行专辑' },
      { c: 'songOfYear', w: "Don't Stop 'Til You Get Enough", zh: '年度歌曲' },
      { c: 'bestArrangement', w: 'Off the Wall', zh: '最佳编曲' }
    ],
    thriller: [
      { c: 'albumOfYear', w: 'Thriller', zh: '年度专辑' },
      { c: 'recordOfYear', w: 'Beat It', zh: '年度唱片' },
      { c: 'bestPopVocalMale', w: 'Thriller', zh: '最佳流行男歌手' },
      { c: 'bestRnbVocalMale', w: 'Billie Jean', zh: '最佳R&B男歌手' },
      { c: 'bestRockVocalMale', w: 'Beat It', zh: '最佳摇滚男歌手' },
      { c: 'bestRnbSong', w: 'Billie Jean', zh: '最佳R&B歌曲' },
      { c: 'producerOfYear', w: 'Thriller', zh: '年度制作人(非古典)' },
      { c: 'bestEngineered', w: 'Thriller', zh: '最佳非古典录音工程' },
      { c: 'bestMusicVideoShort', w: 'Thriller', zh: '最佳音乐录影带(短篇)' },
      { c: 'songOfYear', w: 'Billie Jean', zh: '年度歌曲' },
      { c: 'bestRnbAlbum', w: 'Thriller', zh: '最佳R&B专辑' },
      { c: 'bestPopAlbum', w: 'Thriller', zh: '最佳流行专辑' },
      { c: 'bestArrangement', w: 'Thriller', zh: '最佳编曲' },
      { c: 'bestRemixed', w: 'Thriller', zh: '最佳混音录音' },
      { c: 'bestMusicVideoLong', w: "Making Michael Jackson's Thriller", zh: '最佳音乐录影带(长篇)' },
      { c: 'bestImmersive', w: 'Thriller', zh: '最佳沉浸式音频专辑' },
      { c: 'bestDanceRecording', w: 'Thriller', zh: '最佳舞曲录音' },
      { c: 'bestSpokenWord', w: 'E.T. the Extra-Terrestrial', zh: '最佳诵读专辑' }
    ],
    bad: [
      { c: 'albumOfYear', w: 'Bad', zh: '年度专辑' },
      { c: 'recordOfYear', w: 'Bad', zh: '年度唱片' },
      { c: 'bestPopVocalMale', w: 'Bad', zh: '最佳流行男歌手' },
      { c: 'bestRnbVocalMale', w: 'The Way You Make Me Feel', zh: '最佳R&B男歌手' },
      { c: 'bestRockVocalMale', w: 'Bad', zh: '最佳摇滚男歌手' },
      { c: 'bestEngineered', w: 'Bad', zh: '最佳非古典录音工程' },
      { c: 'bestMusicVideoShort', w: 'Leave Me Alone', zh: '最佳音乐录影带(短篇)' },
      { c: 'bestRnbSong', w: 'Bad', zh: '最佳R&B歌曲' },
      { c: 'producerOfYear', w: 'Bad', zh: '年度制作人(非古典)' },
      { c: 'bestRnbAlbum', w: 'Bad', zh: '最佳R&B专辑' },
      { c: 'bestPopAlbum', w: 'Bad', zh: '最佳流行专辑' },
      { c: 'bestMusicVideoLong', w: 'Moonwalker', zh: '最佳音乐录影带(长篇)' },
      { c: 'bestArrangement', w: 'Bad', zh: '最佳编曲' },
      { c: 'songOfYear', w: 'Man in the Mirror', zh: '年度歌曲' },
      { c: 'bestRemixed', w: 'Bad', zh: '最佳混音录音' },
      { c: 'bestImmersive', w: 'Bad', zh: '最佳沉浸式音频专辑' }
    ],
    dangerous: [
      { c: 'grammyLegend', w: 'Dangerous', zh: '格莱美传奇奖' },
      { c: 'albumOfYear', w: 'Dangerous', zh: '年度专辑' },
      { c: 'bestPopVocalMale', w: 'Dangerous', zh: '最佳流行男歌手' },
      { c: 'bestRnbVocalMale', w: 'Remember the Time', zh: '最佳R&B男歌手' },
      { c: 'bestRockVocalMale', w: 'Black or White', zh: '最佳摇滚男歌手' },
      { c: 'bestMusicVideoShort', w: 'Black or White', zh: '最佳音乐录影带(短篇)' },
      { c: 'bestRnbSong', w: 'Remember the Time', zh: '最佳R&B歌曲' },
      { c: 'producerOfYear', w: 'Dangerous', zh: '年度制作人(非古典)' },
      { c: 'bestEngineered', w: 'Dangerous', zh: '最佳非古典录音工程' },
      { c: 'bestRnbAlbum', w: 'Dangerous', zh: '最佳R&B专辑' },
      { c: 'bestPopAlbum', w: 'Dangerous', zh: '最佳流行专辑' },
      { c: 'bestMusicVideoLong', w: 'Dangerous (short film)', zh: '最佳音乐录影带(长篇)' },
      { c: 'bestRemixed', w: 'Dangerous', zh: '最佳混音录音' },
      { c: 'songOfYear', w: 'Will You Be There', zh: '年度歌曲' },
      { c: 'bestArrangement', w: 'Dangerous', zh: '最佳编曲' },
      { c: 'bestImmersive', w: 'Dangerous (2011)', zh: '最佳沉浸式音频专辑' }
    ],
    history: [
      { c: 'bestMusicVideoShort', w: 'Scream', zh: '最佳音乐录影带(短篇)' },
      { c: 'albumOfYear', w: 'HIStory', zh: '年度专辑' },
      { c: 'bestPopVocalMale', w: 'You Are Not Alone', zh: '最佳流行男歌手' },
      { c: 'bestRnbVocalMale', w: 'You Are Not Alone', zh: '最佳R&B男歌手' },
      { c: 'bestRnbAlbum', w: 'HIStory', zh: '最佳R&B专辑' },
      { c: 'bestPopAlbum', w: 'HIStory', zh: '最佳流行专辑' },
      { c: 'bestMusicVideoLong', w: 'HIStory on Film', zh: '最佳音乐录影带(长篇)' },
      { c: 'bestRnbSong', w: 'You Are Not Alone', zh: '最佳R&B歌曲' },
      { c: 'producerOfYear', w: 'HIStory', zh: '年度制作人(非古典)' },
      { c: 'bestEngineered', w: 'HIStory', zh: '最佳非古典录音工程' },
      { c: 'songOfYear', w: 'You Are Not Alone', zh: '年度歌曲' },
      { c: 'bestMusicVideoShort', w: 'Earth Song', zh: '最佳音乐录影带(短篇)' },
      { c: 'bestArrangement', w: 'HIStory', zh: '最佳编曲' },
      { c: 'bestRemixed', w: 'HIStory', zh: '最佳混音录音' },
      { c: 'bestDanceRecording', w: 'HIStory', zh: '最佳舞曲录音' },
      { c: 'bestImmersive', w: 'HIStory', zh: '最佳沉浸式音频专辑' }
    ],
    invincible: [
      { c: 'albumOfYear', w: 'Invincible', zh: '年度专辑' },
      { c: 'bestPopVocalMale', w: 'You Rock My World', zh: '最佳流行男歌手' },
      { c: 'bestRnbVocalMale', w: 'Invincible', zh: '最佳R&B男歌手' },
      { c: 'bestMusicVideoShort', w: 'You Rock My World', zh: '最佳音乐录影带(短篇)' },
      { c: 'bestPopAlbum', w: 'Invincible', zh: '最佳流行专辑' },
      { c: 'bestRnbAlbum', w: 'Invincible', zh: '最佳R&B专辑' },
      { c: 'bestDanceRecording', w: 'Invincible', zh: '最佳舞曲录音' },
      { c: 'bestRnbSong', w: 'Invincible', zh: '最佳R&B歌曲' },
      { c: 'producerOfYear', w: 'Invincible', zh: '年度制作人(非古典)' },
      { c: 'bestEngineered', w: 'Invincible', zh: '最佳非古典录音工程' },
      { c: 'bestMusicVideoShort', w: 'Cry', zh: '最佳音乐录影带(短篇)' },
      { c: 'songOfYear', w: 'You Are My Life', zh: '年度歌曲' },
      { c: 'bestArrangement', w: 'Invincible', zh: '最佳编曲' },
      { c: 'bestRemixed', w: 'Invincible', zh: '最佳混音录音' },
      { c: 'bestMusicVideoLong', w: 'Live in Budapest', zh: '最佳音乐录影带(长篇)' },
      { c: 'bestImmersive', w: 'Invincible', zh: '最佳沉浸式音频专辑' }
    ]
  };
  MJ.grammyPools = GRAMMY_POOLS;
  MJ.GRAMMY_REAL_TOTAL = GRAMMY_REAL_TOTAL;

  // 涌现映射（选择加成 0..16）：q 越高座数越多；q<56 → 0（脱离奖项竞争即零获奖）。
  // 低分段细化：56≤q<62 → 1，62≤q<68 → 2。分界 62 恰落在规范中档 Bad(q≈60.3) 与 Thriller(q≈63.3) 之间，
  // 使「中等投入（全 B 企划+全 B 巡演 + 2_3 埋 collab）」恰好 = 13（追平现实 MJ），同时拿满上限仍 ≈48（spec §14.9）。
  // 阈值经 test/_grammy_playthrough.cjs 穷举复验。
  function grammyEmergent(q) {
    var eq;
    if (q >= 88) eq = 10 + Math.round((q - 88) / 2);
    else if (q >= 78) eq = 6 + Math.round((q - 78) / 3);
    else if (q >= 68) eq = 3 + Math.round((q - 68) / 5);
    else if (q >= 62) eq = 2;
    else if (q >= 56) eq = 1;
    else eq = 0;
    return Math.min(16, eq);
  }

  // 取专辑奖项池前 wins 项作为本届具体获奖（声望降序）
  function pickCats(key, wins) {
    var pool = GRAMMY_POOLS[key] || [];
    var n = Math.min(wins, pool.length), out = [];
    for (var i = 0; i < n; i++) out.push(pool[i]);
    return out;
  }

  MJ.planner = {
    // 由企划画像(cp_*) + 当下声誉/艺术势头，结算该专辑格莱美座数，并写回 state
    // 公式：wins = min(GRAMMY_CAP, GRAMMY_FLOOR[key] + grammyEmergent(q))，涌现 0..16
    // 下限即现实保底 GRAMMY_FLOOR（otw1+thriller8=9），永不归零；隐士路线仅涌现≈0、仍拿保底。spec §14.9 / §15
    resolveGrammy: function (state, key) {
      var f = state.flags, a = state.attributes;
      var v = f.cp_vision || 0, c = f.cp_craft || 0, i = f.cp_innovation || 0,
          co = f.cp_collab || 0, st = f.cp_stagecraft || 0;
      var momentum = ((a.reputation || 0) + (a.art || 0)) / 2;
      var q = 0.22 * v + 0.18 * c + 0.20 * i + 0.12 * co + 0.18 * st + 0.10 * momentum;
      // §17.4 预算方差：激进预算 +8（高风险高回报）/ 保守预算 -8（落袋为安）
      var budAdj = f.cp_budget === 'aggressive' ? 8 : (f.cp_budget === 'safe' ? -8 : 0);
      q = clamp(q + (BIAS[key] || 0) + budAdj, 0, 100);
      var eq = grammyEmergent(q);
      var floor = GRAMMY_FLOOR[key] || 0;
      var wins = Math.min(GRAMMY_CAP, floor + eq); // 现实保底 + 选择加成，钳顶 20
      if (f.cp_budget === 'aggressive' && wins >= 5) state.flags.highStakesWin = true; // ACH_HIGH_STAKES 豪赌成真
      var fk = 'grammy_' + key;
      var done = '_gresolved_' + key;
      if (state.flags[done]) return state.flags[fk]; // 幂等：重载后续玩不重复累加
      state.flags[fk] = wins;
      state.flags['grammyCats_' + key] = pickCats(key, wins); // 本届具体奖项（供揭晓面板展示）
      state.meta.grammyWins = (state.meta.grammyWins || 0) + wins;
      state.changeAttr('reputation', Math.min(20, wins * 2));
      state.changeAttr('art', Math.min(8, wins));
      state.flags[done] = true;
      return wins;
    },
    // UI 辅助：取本届获奖清单 / 座数
    getCats: function (state, key) { return (state.flags && state.flags['grammyCats_' + key]) || []; },
    getWins: function (state, key) { return (state.flags && state.flags['grammy_' + key]) || 0; },
    // 调试/测试辅助：清除某专辑的结算标记（不影响其他数据）
    reset: function (state, key) {
      if (state && state.flags) {
        delete state.flags['_gresolved_' + key];
        delete state.flags['grammy_' + key];
        delete state.flags['grammyCats_' + key];
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = MJ.planner;
})();
