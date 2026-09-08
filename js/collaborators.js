// §17.4 关系网深化：具名合作者总览模块（数据 + 渲染；弹窗由 ui.js 的 collaboratorsModal 调用）
(function () {
  'use strict';
  var T = (typeof T !== 'undefined') ? T
        : ((typeof MJ !== 'undefined' && MJ.t) ? MJ.t
        : function (k, _, fb) { return fb == null ? '' : fb; });

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 具名合作者（关系网六位）；role/era/desc 存中文默认值，EN 经 i18n 键 collab.<key>.<field> 解析
  // metCond：「已结识」判定（认识/选过相关选项后才显示羁绊；未结识渲染为锁定态）
  MJ.COLLABORATORS = [
    { key: 'lisa',      relKey: 'lisa',      icon: '💍', roleZh: '灵魂伴侣与镜中之镜', eraZh: '1994 – 1996', wiki: 'family/Lisa Marie Presley',
      metCond: function (s) { return !!(s.relMet && s.relMet.lisa) || s.flags.marriedLisa !== undefined; },
      descZh: '摇滚之王的小女儿，与你有过一段被全世界注视的婚姻；她是你私人叙事里最温柔也最锋利的一页。' },
    { key: 'quincy',    relKey: 'quincy',    icon: '🎼', roleZh: '金牌制作人 · 伯乐', eraZh: '1978 – 1983', wiki: 'people/Quincy Jones',
      metCond: function (s) { if (s.timeline && s.timeline['1979'] === 'solo_prod') return false; return !!(s.relMet && s.relMet.quincy) || !!s.flags.metQuincy; },
      descZh: '《Off the Wall》《Thriller》《Bad》的缔造者，把你从男孩塑造成流行之王；后来的分歧，是另一段故事。' },
    { key: 'diana',     relKey: 'diana',     icon: '💃', roleZh: '引路人 · 知交',     eraZh: '1969 – 1981', wiki: 'people/Diana Ross',
      metCond: function (s) { return !!(s.relMet && s.relMet.diana); },
      descZh: '在 Motown 门口牵你手的人，亲手为你推开独唱的塔尖；两代巨星的回声，贯穿你整个前半生。' },
    { key: 'frank',     relKey: 'frank',     icon: '🤵', roleZh: '经纪人 · 守护者',   eraZh: '1983 – 1989', wiki: 'people/Frank DiLeo',
      metCond: function (s) { return !!(s.relMet && s.relMet.frank); },
      descZh: '《Bad》时代最可靠的臂膀，替你挡下电话、合约与喧闹；后台一杯水，是他给的踏实。' },
    { key: 'john',      relKey: 'john',      icon: '⚖️', roleZh: '法务 · 版图操盘手', eraZh: '1985 – 2009', wiki: 'people/John Branca',
      metCond: function (s) { return !!(s.relMet && s.relMet.john); },
      descZh: 'ATV 版权、Sony/ATV 合并、遗产执行——他把版权迷宫理成直路，是你在风暴里的锚。' },
    { key: 'elizabeth', relKey: 'elizabeth', icon: '💜', roleZh: '挚友 · 庇护者',     eraZh: '1989 – 2009', wiki: 'people/Elizabeth Taylor',
      metCond: function (s) { return !!(s.relMet && s.relMet.elizabeth); },
      descZh: '在流言的潮水里立在你身前，用看尽世态的眼睛替你挡下锋芒；“真正的王，不必向闲言低头。”' }
  ];

  // 关系 key 是否「已结识」：六位具名合作者按 metCond，其余（brothers/fans 等）默认 true
  MJ.isCollaboratorMet = function (state, relKey) {
    if (!state) return false;
    for (var i = 0; i < MJ.COLLABORATORS.length; i++) {
      var c = MJ.COLLABORATORS[i];
      if (c.relKey === relKey) {
        return c.metCond ? !!c.metCond(state) : !!(state.relMet && state.relMet[relKey]);
      }
    }
    return true;
  };

  // 状态栏羁绊 chip 可见性（单一事实来源，relationsPanel 使用）：
  // 家人与歌迷出生即认识 → 常显；黛比/孩子们在婚姻/生育事件（rel 首次变动）后显示；六位具名合作者按 metCond
  var ALWAYS_REL = { brothers: 1, fans: 1, janet: 1, joe: 1, katherine: 1, jermaine: 1, latoya: 1 };
  MJ.relChipVisible = function (state, relKey) {
    if (!state) return false;
    if (ALWAYS_REL[relKey]) return true;
    if (relKey === 'debbie' || relKey === 'kids') return !!(state.relMet && state.relMet[relKey]);
    return MJ.isCollaboratorMet(state, relKey);
  };

  // 渲染关系总览卡片网格（state.relations 提供实时好感值；未结识者渲染锁定态，不泄露身份信息）
  MJ.renderCollaboratorsOverview = function (state) {
    var defs = (MJ.config && MJ.config.relationsDefs) || [];
    var byKey = {};
    defs.forEach(function (d) { byKey[d.key] = d; });
    var rel = (state && state.relations) || {};
    var html = '<div class="collab-grid">';
    MJ.COLLABORATORS.forEach(function (c) {
      if (!MJ.isCollaboratorMet(state, c.relKey)) {
        html += '<div class="collab-card locked">' +
          '<div class="collab-head"><span class="collab-ico">' + c.icon + '</span>' +
            '<div class="collab-name"><b>' + esc(T('ui.collabLockedName', null, '？？？')) + '</b></div></div>' +
          '<div class="collab-tags"><span class="pill pill-ghost">' + esc(T('ui.collabLocked', null, '尚未结识')) + '</span></div>' +
          '<p class="collab-desc">' + esc(T('ui.collabLockedHint', null, '在人生的某个路口，你们还未相遇。')) + '</p>' +
        '</div>';
        return;
      }
      var def = byKey[c.key] || {};
      var name = def.name || c.key;
      var en = T('rel.' + c.key, null, name);
      var v = rel[c.relKey] || 0;
      var sign = v > 0 ? '+' : '';
      var cls = v >= 20 ? 'warm' : (v <= -10 ? 'cold' : 'neutral');
      var word = v > 0 ? T('ui.relWarm', null, '亲近') : (v < 0 ? T('ui.relCold', null, '疏远') : T('ui.relNeutral', null, '平淡'));
      var role = T('collab.' + c.key + '.role', null, c.roleZh);
      var era = T('collab.' + c.key + '.era', null, c.eraZh);
      var desc = T('collab.' + c.key + '.desc', null, c.descZh);
      html += '<div class="collab-card ' + cls + '">' +
        '<div class="collab-head"><span class="collab-ico">' + c.icon + '</span>' +
          '<div class="collab-name"><b>' + esc(name) + '</b> <span class="collab-en">' + esc(en) + '</span></div>' +
          '<span class="collab-val ' + cls + '">' + sign + v + ' <i>' + word + '</i></span></div>' +
        '<div class="collab-tags"><span class="pill pill-violet">' + esc(role) + '</span><span class="pill pill-teal">' + esc(era) + '</span></div>' +
        '<p class="collab-desc">' + esc(desc) + '</p>' +
        '<div class="collab-src">📚 ' + T('ui.relSource', null, '史料') + '：' + esc(c.wiki) + '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  };
})();
