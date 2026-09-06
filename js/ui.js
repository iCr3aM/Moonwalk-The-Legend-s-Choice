/* ui.js — 视图与用户流程（四区布局 + 响应式 + 新手引导）
 * 渲染：引导 → 状态栏(属性/净资产/元路线) → 事件卡 → 选项/继续 → 结局。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  var ui = {};
  var app;
  var T = function (k, v, fb) { return MJ.t(k, v, fb); };
  var _view = null; // 当前屏幕的重新渲染函数（语言切换时调用）
  // 切换语言时整屏 + 已开弹窗无残留重译：try/finally 保证防抖标志永远复位（避免重绘抛错导致永久锁死）
  function rerenderForLang() {
    ui._switching = true;
    try {
      if (_view) _view();
      if (ui._activeModal && document.getElementById(ui._activeModal.id)) ui._activeModal.open();
    } finally {
      ui._switching = false;
    }
  }
  // 语言选择弹窗（国旗 emoji + 缩写），点选即切换；替代原快速循环切换
  function openLangModal() {
    closeOverlay('lang-modal');
    var overlay = document.createElement('div');
    overlay.id = 'lang-modal';
    overlay.className = 'overlay modal-overlay';
    var cur = MJ.i18n.lang;
    var opts = [
      { lang: 'zh', flag: '🇨🇳', name: '中文', abbr: 'ZH' },
      { lang: 'en', flag: '🇺🇸', name: 'English', abbr: 'EN' }
    ];
    var cards = opts.map(function (o) {
      var sel = (cur === o.lang) ? ' sel' : '';
      var chk = (cur === o.lang) ? '<span class="lang-check">✓</span>' : '';
      return '<button type="button" class="lang-opt' + sel + '" data-lang="' + o.lang + '">' +
        '<span class="lang-flag">' + o.flag + '</span>' +
        '<span class="lang-name">' + o.name + '</span>' +
        '<span class="lang-abbr">' + o.abbr + '</span>' + chk +
        '</button>';
    }).join('');
    overlay.innerHTML = '<div class="modal lang-modal-card">' +
      '<div class="modal-head"><span>🌐 ' + T('ui.langBtn', null, '语言') + '</span><span class="spacer"></span>' +
      '<button type="button" class="btn ghost small" id="lang-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"><div class="lang-grid">' + cards + '</div></div></div>';
    overlay.querySelectorAll('.lang-opt').forEach(function (b) {
      b.addEventListener('click', function () { chooseLang(b.getAttribute('data-lang')); });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('lang-modal'); });
    document.getElementById('lang-close').addEventListener('click', function () { closeOverlay('lang-modal'); });
    document.body.appendChild(overlay);
  }
  function chooseLang(lang) {
    if (ui._switching) return;
    MJ.i18n.setLang(lang);
    syncLangClass();
    closeOverlay('lang-modal');
    rerenderForLang();
  }
  function syncLangClass() { document.body.classList.toggle('lang-en', MJ.i18n.lang === 'en'); }

  function $(sel) { return app.querySelector(sel); }

  function setKeyHandler(fn) {
    if (ui._keyHandler) { try { document.removeEventListener('keydown', ui._keyHandler); } catch (e) {} }
    ui._keyHandler = fn || null;
    if (fn) document.addEventListener('keydown', fn);
  }

  // 键盘可访问性：数字键 1-9 选择、上下方向键移动焦点、回车/空格确认继续或结束
  function bindEventKeys(ev) {
    setKeyHandler(function (e) {
      if (ev.kind === 'choice') {
        var btns = app.querySelectorAll('.option');
        if (e.key >= '1' && e.key <= '9') {
          var idx = parseInt(e.key, 10) - 1;
          if (btns[idx]) { e.preventDefault(); MJ.engine.choose(idx); }
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var list = Array.prototype.slice.call(btns);
          if (!list.length) return;
          var pos = list.indexOf(document.activeElement);
          var next = (pos < 0) ? 0
            : (e.key === 'ArrowDown' ? Math.min(list.length - 1, pos + 1) : Math.max(0, pos - 1));
          list[next].focus();
        }
      } else if (ev.kind === 'auto') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var b = $('#btn-next'); if (b) b.click(); }
      } else if (ev.kind === 'ending') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var b2 = $('#btn-end'); if (b2) b2.click(); }
      }
    });
  }

  function formatMoney(v) {
    var sign = v < 0 ? '-' : '';
    var a = Math.abs(v);
    if (MJ.i18n.lang === 'en') {
      // 净资产单位=万；1 万 = 0.01M（1 亿 = 100M）
      var m = a / 100;
      return sign + '$' + (m >= 100 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (a >= 10000) return sign + (a / 10000).toFixed(2) + ' 亿';
    return sign + a + ' 万';
  }

  function attrBars(state) {
    var names = MJ.config.attrNames;
    var keys = ['health', 'reputation', 'wealth', 'family', 'art', 'stress'];
    var html = '<div class="bars">';
    keys.forEach(function (k) {
      var val = state.attributes[k] || 0;
      var right = '<b>' + val + '</b>';
      if (k === 'reputation' || k === 'art') {
        var ov = (state.overflow && state.overflow[k]) || 0;
        if (ov > 0) right += ' <span class="od">⭐+' + ov + '</span>';
      } else if (k === 'wealth') {
        right += ' <span class="nw">(' + formatMoney(state.netWorth) + ')</span>';
      }
      html += '<div class="bar">' +
        '<div class="lab"><span>' + T('attr.' + k, null, names[k]) + '</span>' + right + '</div>' +
        '<div class="track"><div class="fill ' + k + '" style="width:' + val + '%"></div></div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  function metaHints(state) {
    var defs = MJ.config.metaDefs;
    var order = MJ.config.metaOrder;
    var dom = MJ.dominantMeta(state.meta);
    var html = '<div class="meta-hint">';
    order.forEach(function (k) {
      var n = state.meta[k] || 0;
      var cls = (k === dom && n > 0) ? 'tag active' : 'tag';
      html += '<span class="' + cls + '">' + defs[k].icon + ' ' + T('meta.' + k, null, defs[k].name) + ' ×' + n + '</span>';
    });
    html += '</div>';
    return html;
  }

  // 时间轨迹按年份升序排列（同年保持发生顺序），修复「插入顺序」导致的 chronology 错乱
  function numYear(y) { var n = (typeof y === 'number') ? y : parseInt(y, 10); return isFinite(n) ? n : 1e9; }
  function chronoSteps(h) {
    return h.map(function (e, i) { return { e: e, i: i }; })
      .sort(function (a, b) {
        var ya = numYear(a.e.year), yb = numYear(b.e.year);
        if (ya !== yb) return ya - yb;
        return a.i - b.i;
      })
      .map(function (x) { return x.e; });
  }

  // 历史标题：按事件 id 在当前语言重译（彻底根除切语言后剧情残留旧语言）；旧存档无 id 回退冻存标题
  function historyTitle(e) {
    if (e && e.id) return T('event.' + e.id + '.title', null, e.title);
    return (e && e.title) || '';
  }
  function historyPanel(state) {
    var h = chronoSteps(state.history || []);
    var inner = '<details class="panel history">' +
      '<summary>' + T('ui.historyTitle', null, '人生轨迹') + ' <span class="cnt">(' + h.length + ')</span></summary>' +
      '<div class="timeline">';
    if (h.length === 0) {
      inner += '<div class="empty">' + T('ui.historyEmpty', null, '尚未做出选择，传奇正在书写…') + '</div>';
    } else {
      h.forEach(function (e) {
        inner += '<div class="step"><span class="yr">' + (e.year != null ? e.year : '—') + '</span>' +
          '<span class="t">' + escapeHtml(historyTitle(e)) + '</span>' +
          '<span class="c">' + escapeHtml(e.choice) + '</span></div>';
      });
    }
    inner += '</div></details>';
    return inner;
  }

  // §17.4 专项子维度：把"创作企划器"写入的 cp_* 画像转成展示层（不改核心结局逻辑）
  function subDimPanel(state) {
    if (!MJ.buildSubDims) return '';
    var subs = MJ.buildSubDims(state);
    var style = (MJ.decisionStyle ? MJ.decisionStyle(state) : null);
    var styleLabel = style ? T('style.' + style.s, null, style.zh) : '';
    var bars = subs.map(function (d) {
      var pct = Math.max(0, Math.min(100, d.val));
      return '<div class="subdim-item">' +
        '<div class="subdim-lab"><span>' + T('subdim.' + d.key, null, d.name) + '</span><span>' + pct + '</span></div>' +
        '<div class="subdim-bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join('');
    return '<div class="panel subdim"><div class="panel-h">' + T('ui.subDimTitle', null, '专项造诣') +
      (styleLabel ? ' <span class="style-tag">' + styleLabel + '</span>' : '') + '</div>' +
      '<div class="subdim-grid">' + bars + '</div></div>';
  }

  // 关键抉择回顾：仅汇总被标记为关键节点的选择/经历（复用 history 数据）
  function keyReviewPanel(state) {
    var h = state.history || [];
    var keys = h.filter(function (e) { return e.key; });
    var inner = '<details class="panel history kreview" open>' +
      '<summary>' + T('ui.keyReviewTitle', null, '关键抉择回顾') + ' <span class="cnt">(' + keys.length + ')</span></summary>' +
      '<div class="timeline">';
    if (keys.length === 0) {
      inner += '<div class="empty">' + T('ui.keyReviewEmpty', null, '这一程没有惊心动魄的岔路，平凡本身也是一种答案。') + '</div>';
    } else {
      chronoSteps(keys).forEach(function (e) {
        inner += '<div class="step"><span class="yr">' + (e.year != null ? e.year : '—') + '</span>' +
          '<span class="t">' + escapeHtml(historyTitle(e)) + '</span>' +
          '<span class="c">' + escapeHtml(e.choice) + '</span></div>';
      });
    }
    inner += '</div></details>';
    return inner;
  }

  function statusBar(state, ev) {
    var net = state.netWorth;
    var debtCls = net < 0 ? 'net debt' : 'net';
    var yearTxt = ev ? MJ.eventYear(ev) : '';
    return '<div class="panel status">' +
      '<div class="status-top">' +
        '<span class="title">' + T('ui.title', null, '月球漫步：传奇的抉择') + '</span>' +
        '<span><span class="year">' + yearTxt + '</span> &nbsp; <span class="' + debtCls + '">' + T('ui.networth', null, '净资产') + ' ' + formatMoney(net) + '</span></span>' +
      '</div>' +
      attrBars(state) +
      softBars(state) +
      metaHints(state) +
      metaTendency(state) +
      relationsPanel(state) +
      '</div>';
  }

  ui.init = function () {
    app = document.getElementById('app');
    syncLangClass();
    var save = MJ.saveSystem.load();
    ui.showIntro(!!save);
  };

  function galleryHtml() {
    var g = MJ.saveSystem.getGallery();
    var defs = MJ.config.endings;
    var rank = MJ.config.rarityRank || {};
    var keys = Object.keys(defs).sort(function (a, b) {
      return (rank[MJ.config.endingRarity[a]] || 0) - (rank[MJ.config.endingRarity[b]] || 0);
    });
    var total = keys.length;
    var got = keys.filter(function (k) { return g[k]; }).length;
    var html = '<div class="panel gallery">' +
      '<div class="g-head">' + T('ui.gallery', null, '结局图鉴') + ' <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="g-grid">';
    keys.forEach(function (k) {
      var e = defs[k];
      var on = !!g[k];
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + (e.hidden && !on ? ' locked-hidden' : '') + '" data-endkey="' + k + '" title="' + (on ? T('ending.' + k + '.name', null, e.name) : T('ui.locked', null, '未解锁')) + '">' +
        '<div class="g-icon">' + (on ? e.icon : '❓') + '</div>' +
        '<div class="g-name">' + (on ? T('ending.' + k + '.name', null, e.name) : T('ui.unknown', null, '？？？')) + '</div>' +
        '<div class="g-rarity">' + (on ? rarityLabel(MJ.config.endingRarity[k]) : T('ui.locked', null, '未解锁')) + '</div>' +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function achievementsPanel(state) {
    var list = MJ.achievementSystem.all();
    var reach = MJ.config.achievementReach || {};
    var rank = MJ.config.rarityRank || {};
    // 按「实际可达性」排序：实测命中率高的（易得）在前；同可达率再按稀有度兜底
    list = list.slice().sort(function (a, b) {
      var ra = (reach[a.id] != null) ? reach[a.id] : 0;
      var rb = (reach[b.id] != null) ? reach[b.id] : 0;
      if (rb !== ra) return rb - ra;
      return (rank[a.rarity] || 0) - (rank[b.rarity] || 0);
    });
    var got = list.filter(function (a) { return a.unlocked; }).length;
    var total = list.length;
    var html = '<div class="panel gallery">' +
      '<div class="g-head">' + T('ui.achievements', null, '成就') + ' <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="g-grid">';
    list.forEach(function (a) {
      var on = a.unlocked;
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + '" title="' + (on ? escapeHtml(T('ach.' + a.id + '.name', null, a.name) + '：' + T('ach.' + a.id + '.desc', null, a.desc)) : T('ui.locked', null, '未解锁')) + '">' +
        '<div class="g-icon">' + (on ? a.icon : '🏆') + '</div>' +
        '<div class="g-name">' + (on ? T('ach.' + a.id + '.name', null, a.name) : T('ui.unknown', null, '？？？')) + '</div>' +
        (on ? '<div class="g-rarity">' + rarityLabel(a.rarity) + '</div>' : '<div class="g-rarity">' + T('ui.locked', null, '未解锁') + '</div>') +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }

  // ---------- 图鉴 / 成就 弹窗（主菜单各收为一个按钮；含多次确认重置） ----------
  function rarityLabel(r) {
    var zh = ({ common: '普通', uncommon: '平凡', rare: '稀有', epic: '史诗', legendary: '传奇' })[r] || '普通';
    return T('rarity.' + r, null, zh);
  }
  function closeOverlay(id) { var o = document.getElementById(id); if (o) o.parentNode.removeChild(o); }
  function galleryCount() {
    var g = MJ.saveSystem.getGallery();
    return Object.keys(g).length + ' / ' + Object.keys(MJ.config.endings).length;
  }
  function achCount() {
    var all = MJ.achievementSystem.all();
    return all.filter(function (a) { return a.unlocked; }).length + ' / ' + all.length;
  }
  // 两次点击确认（3 秒内再次点击才生效，超时自动取消），满足“多次确认”要求
  function wireReset(btnId, doReset, reopen) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    if (!btn._orig) btn._orig = btn.textContent;
    var armed = false, timer = null;
    btn.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        btn.textContent = T('ui.confirmReset', null, '再次点击确认（不可逆）');
        btn.classList.add('danger');
        timer = setTimeout(function () { armed = false; btn.textContent = btn._orig; btn.classList.remove('danger'); }, 3000);
        return;
      }
      clearTimeout(timer); armed = false; btn.textContent = btn._orig; btn.classList.remove('danger');
      doReset();
      if (reopen) reopen();
    });
  }
  function galleryModal() {
    closeOverlay('gallery-overlay');
    var overlay = document.createElement('div');
    overlay.id = 'gallery-overlay';
    overlay.className = 'overlay modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>📖 ' + T('ui.gallery', null, '结局图鉴') + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="gallery-reset">' + T('ui.resetGallery', null, '重置图鉴') + '</button>' +
      '<button class="btn ghost small" id="gallery-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"></div></div>';
    overlay.querySelector('.modal-body').innerHTML = galleryHtml();
    overlay.querySelector('.modal-body').addEventListener('click', function (ev) {
      var cell = ev.target.closest ? ev.target.closest('.g-cell') : null;
      if (cell && cell.getAttribute('data-endkey')) endingDetailModal(cell.getAttribute('data-endkey'));
    });
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'gallery-overlay', open: galleryModal };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('gallery-overlay'); });
    document.getElementById('gallery-close').addEventListener('click', function () { closeOverlay('gallery-overlay'); });
    wireReset('gallery-reset', function () { MJ.saveSystem.clearGallery(); }, function () {
      closeOverlay('gallery-overlay'); galleryModal();
    });
  }
  // 结局详情：已解锁显示全部；未解锁（非隐藏）仅显示「如何达成」；隐藏结局未解锁不泄露任何内容
  function endingDetailModal(key) {
    var e = MJ.config.endings[key];
    if (!e) return;
    closeOverlay('ending-detail-overlay');
    var g = MJ.saveSystem.getGallery();
    var on = !!g[key];
    var hint = T('ending.' + key + '.hint', null, e.hint || '');
    var overlay = document.createElement('div');
    overlay.id = 'ending-detail-overlay';
    overlay.className = 'overlay modal-overlay';
    var headTxt, bodyHtml;
    if (on) {
      // 已解锁：名称 / 基调 / 简介 / 如何达成 / 独白 全部展示
      headTxt = e.icon + ' ' + escapeHtml(T('ending.' + key + '.name', null, e.name));
      bodyHtml =
        (e.tone ? '<div class="ed-tone">' + escapeHtml(T('ending.' + key + '.tone', null, e.tone)) + '</div>' : '') +
        '<div class="ed-summary">' + escapeHtml(T('ending.' + key + '.summary', null, e.summary || '')) + '</div>' +
        (hint ? '<div class="ed-hint"><span class="ed-hint-label">🎯 ' + T('ui.howTo', null, '如何达成') + '</span>' + escapeHtml(hint) + '</div>' : '') +
        (e.monologue ? '<div class="ed-monologue">' + escapeHtml(T('ending.' + key + '.monologue', null, e.monologue)) + '</div>' : '');
    } else if (e.hidden) {
      // 隐藏结局未解锁：不泄露任何内容
      headTxt = '❓ ' + T('ui.unknown', null, '？？？');
      bodyHtml = '<div class="ed-summary">' + T('ui.locked', null, '未解锁') + '</div>';
    } else {
      // 未解锁（非隐藏）：只显示「如何达成」，名称/基调/简介/独白均不显示
      headTxt = '❓ ' + T('ui.unknown', null, '？？？');
      bodyHtml = hint
        ? '<div class="ed-hint"><span class="ed-hint-label">🎯 ' + T('ui.howTo', null, '如何达成') + '</span>' + escapeHtml(hint) + '</div>'
        : '<div class="ed-summary">' + T('ui.locked', null, '未解锁') + '</div>';
    }
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>' + headTxt + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="ed-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body">' + bodyHtml + '</div></div>';
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'ending-detail-overlay', open: function () { endingDetailModal(key); } };
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closeOverlay('ending-detail-overlay'); });
    document.getElementById('ed-close').addEventListener('click', function () { closeOverlay('ending-detail-overlay'); });
  }
  function achievementsModal() {
    closeOverlay('ach-overlay');
    var overlay = document.createElement('div');
    overlay.id = 'ach-overlay';
    overlay.className = 'overlay modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>🏆 ' + T('ui.achievements', null, '成就') + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="ach-reset">' + T('ui.resetAch', null, '重置成就') + '</button>' +
      '<button class="btn ghost small" id="ach-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"></div></div>';
    overlay.querySelector('.modal-body').innerHTML = achievementsPanel();
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'ach-overlay', open: achievementsModal };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('ach-overlay'); });
    document.getElementById('ach-close').addEventListener('click', function () { closeOverlay('ach-overlay'); });
    wireReset('ach-reset', function () { MJ.achievementSystem.clear(); }, function () {
      closeOverlay('ach-overlay'); achievementsModal();
    });
  }

  // ---------- 彩蛋图鉴（GDD §17.9） ----------
  function eggHtml() {
    var defs = (MJ.eggSystem ? MJ.eggSystem.defs : {});
    var list = (MJ.eggSystem ? MJ.eggSystem.foundList() : []);
    var html = '<div class="panel gallery egg-gallery">' +
      '<div class="g-head">' + T('ui.eggCodex', null, '彩蛋图鉴') + ' <span class="g-prog">' + (MJ.eggSystem ? MJ.eggSystem.count() : 0) + ' / ' + (MJ.eggSystem ? MJ.eggSystem.total() : 0) + '</span></div>' +
      '<div class="g-grid">';
    Object.keys(defs).forEach(function (k) {
      var e = defs[k], on = false;
      for (var i = 0; i < list.length; i++) { if (list[i].id === k) { on = true; break; } }
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + '">' +
        '<div class="g-icon">' + (on ? e.icon : '🥚') + '</div>' +
        '<div class="g-name">' + (on ? escapeHtml(T('egg.' + k + '.name', null, e.name)) : T('ui.unknown', null, '？？？')) + '</div>' +
        '<div class="g-desc">' + (on ? escapeHtml(T('egg.' + k + '.desc', null, e.desc)) : T('ui.locked', null, '未解锁')) + '</div>' +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }
  function eggModal() {
    closeOverlay('egg-overlay');
    var overlay = document.createElement('div');
    overlay.id = 'egg-overlay';
    overlay.className = 'overlay modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>🥚 ' + T('ui.eggCodex', null, '彩蛋图鉴') + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="egg-reset">' + T('ui.resetEgg', null, '重置彩蛋') + '</button>' +
      '<button class="btn ghost small" id="egg-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"></div></div>';
    overlay.querySelector('.modal-body').innerHTML = eggHtml();
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'egg-overlay', open: eggModal };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('egg-overlay'); });
    document.getElementById('egg-close').addEventListener('click', function () { closeOverlay('egg-overlay'); });
    wireReset('egg-reset', function () { MJ.eggSystem.clear(); }, function () {
      closeOverlay('egg-overlay'); eggModal();
    });
  }
  function eggCount() {
    return (MJ.eggSystem ? MJ.eggSystem.count() : 0) + ' / ' + (MJ.eggSystem ? MJ.eggSystem.total() : 0);
  }

  // ---------- §17.11 趣事与轶事：图鉴 / Toast / 假如…(想象) 面板 ----------
  function triviaHtml() {
    var defs = (MJ.triviaSystem ? MJ.triviaSystem.defs : {});
    var list = (MJ.triviaSystem ? MJ.triviaSystem.foundList() : []);
    var html = '<div class="panel gallery trivia-gallery">' +
      '<div class="g-head">' + T('ui.triviaCodex', null, '趣事图鉴') + ' <span class="g-prog">' + (MJ.triviaSystem ? MJ.triviaSystem.count() : 0) + ' / ' + (MJ.triviaSystem ? MJ.triviaSystem.total() : 0) + '</span></div>' +
      '<div class="g-grid">';
    Object.keys(defs).forEach(function (k) {
      var e = defs[k], on = false;
      for (var i = 0; i < list.length; i++) { if (list[i].id === k) { on = true; break; } }
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + '">' +
        '<div class="g-icon">' + (on ? e.icon : '📝') + '</div>' +
        '<div class="g-name">' + (on ? escapeHtml(T('trivia.' + k + '.name', null, e.name)) : T('ui.unknown', null, '？？？')) + '</div>' +
        '<div class="g-desc">' + (on ? escapeHtml(T('trivia.' + k + '.desc', null, e.desc)) : T('ui.locked', null, '未解锁')) + '</div>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
  }
  function triviaModal() {
    closeOverlay('trivia-overlay');
    var overlay = document.createElement('div');
    overlay.id = 'trivia-overlay';
    overlay.className = 'overlay modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>📝 ' + T('ui.triviaCodex', null, '趣事图鉴') + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="trivia-reset">' + T('ui.resetTrivia', null, '重置趣事') + '</button>' +
      '<button class="btn ghost small" id="trivia-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"></div></div>';
    overlay.querySelector('.modal-body').innerHTML = triviaHtml();
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'trivia-overlay', open: triviaModal };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('trivia-overlay'); });
    document.getElementById('trivia-close').addEventListener('click', function () { closeOverlay('trivia-overlay'); });
    wireReset('trivia-reset', function () { MJ.triviaSystem.clear(); }, function () {
      closeOverlay('trivia-overlay'); triviaModal();
    });
  }
  // ---------- 人生档案库（§18.7） ----------
  function archiveCount() {
    try { return MJ.saveSystem.getArchives().length; } catch (e) { return 0; }
  }
  function archiveModal() {
    closeOverlay('archive-overlay');
    var arr = MJ.saveSystem.getArchives();
    var overlay = document.createElement('div');
    overlay.id = 'archive-overlay';
    overlay.className = 'overlay modal-overlay';
    var cards = arr.length ? '' :
      '<div class="arc-empty">' + T('ui.archiveEmpty', null, '尚无存档人生。每一程落幕，都会在这里留一张传奇海报。') + '</div>';
    arr.forEach(function (entry, idx) {
      var ed = MJ.config.endings[entry.endingId] || { name: entry.endingId, icon: '🌟' };
      var name = T('ending.' + entry.endingId + '.name', null, ed.name);
      var dm = entry.dominantMeta ? T('meta.' + entry.dominantMeta, null, (MJ.config.metaDefs[entry.dominantMeta] || {}).name || '') : '—';
      var d = new Date(entry.ts);
      var dateStr = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      cards += '<button class="g-cell arc-card" data-idx="' + idx + '">' +
        '<div class="g-icon">' + ed.icon + '</div>' +
        '<div class="g-name">' + escapeHtml(name) + '</div>' +
        '<div class="arc-meta">' + dateStr + ' · ' + escapeHtml(dm) + '</div>' +
        '<div class="arc-meta">' + T('ui.legendScore', null, '传奇评分') + ' ' + entry.legendScore + '（' + entry.legendGrade + '）· ' +
        T('ui.archiveAch', { n: entry.achCount }, '{n} 成就') + '</div>' +
        '</button>';
    });
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>🗂️ ' + T('ui.archive', null, '人生档案库') + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="arc-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"><div class="gallery arc-gallery"><div class="g-grid">' + cards + '</div></div></div></div>';
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'archive-overlay', open: archiveModal };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('archive-overlay'); });
    document.getElementById('arc-close').addEventListener('click', function () { closeOverlay('archive-overlay'); });
    Array.prototype.forEach.call(overlay.querySelectorAll('.arc-card'), function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-idx'), 10);
        var entry = arr[i];
        if (!entry) return;
        closeOverlay('archive-overlay');
        var st = new MJ.GameState();
        st.hydrate(entry.state);
        openPosterModal(st, entry.endingId, i);
      });
    });
  }
  function triviaCount() {
    return (MJ.triviaSystem ? MJ.triviaSystem.count() : 0) + ' / ' + (MJ.triviaSystem ? MJ.triviaSystem.total() : 0);
  }
  function toastTrivia(e) {
    var t = document.createElement('div');
    t.className = 'trivia-toast';
    t.innerHTML = '<div class="at-icon">' + e.icon + '</div>' +
      '<div class="at-body"><div class="at-title">' + T('ui.triviaToast', null, '趣事发现 · ') + escapeHtml(e.name) + '</div>' +
      '<div class="at-desc">' + escapeHtml(e.desc) + '</div></div>';
    _enqueueToast(t, 3600);
  }

  function vignettePanel(state) {
    var list = MJ.buildVignettes(state);
    var inner = '<details class="panel history vignette" open><summary>' + T('ui.vignetteTitle', null, '假如…（想象）') + ' <span class="cnt">(' + list.length + ')</span></summary><div class="vignette-list">';
    if (!list.length) inner += '<div class="empty">' + T('ui.vignetteEmpty', null, '这一程，你没给“假如”留太多缝隙。') + '</div>';
    else list.forEach(function (t) { inner += '<div class="vignette-item"><span class="v-tag">' + T('ui.vignetteTag', null, '（想象）') + '</span>' + escapeHtml(t) + '</div>'; });
    inner += '</div></details>';
    return inner;
  }

  // 成就/彩蛋解锁弹窗队列：一次解锁多个时串行展示，避免多个 toast 在同一固定位置重叠（"一次性弹出两个"）
  var _toastQueue = [];
  var _toastActive = false;
  function _pumpToast() {
    if (_toastActive) return;
    if (_toastQueue.length === 0) { _toastActive = false; return; }
    _toastActive = true;
    var item = _toastQueue.shift();
    var t = item.el;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 20);
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); _toastActive = false; _pumpToast(); }, 400);
    }, item.hold);
  }
  function _enqueueToast(el, hold) {
    _toastQueue.push({ el: el, hold: hold || 2800 });
    _pumpToast();
  }

  // 成就解锁即时弹窗（追加到 body，避免被 #app 重渲染清除；经队列串行，避免重叠）
  function toastAchievement(a) {
    var t = document.createElement('div');
    t.className = 'ach-toast';
    t.innerHTML = '<div class="at-icon">' + a.icon + '</div>' +
      '<div class="at-body"><div class="at-title">' + T('ui.achToast', null, '成就解锁 · ') + escapeHtml(T('ach.' + a.id + '.name', null, a.name)) + '</div>' +
      '<div class="at-desc">' + escapeHtml(T('ach.' + a.id + '.desc', null, a.desc)) + '</div></div>';
    _enqueueToast(t, 3000);
  }

  // 彩蛋解锁即时弹窗（GDD §17.9；经队列串行）
  function toastEgg(e) {
    var t = document.createElement('div');
    t.className = 'egg-toast';
    t.innerHTML = '<div class="at-icon">' + e.icon + '</div>' +
      '<div class="at-body"><div class="at-title">' + T('ui.eggToast', null, '彩蛋发现 · ') + escapeHtml(e.name) + '</div>' +
      '<div class="at-desc">' + escapeHtml(e.desc) + '</div></div>';
    _enqueueToast(t, 3600);
  }

  // 元路线倾向提示（GDD §9）：状态栏下方提示玩家“正在走向”哪条路
  function metaTendency(state) {
    var dom = MJ.dominantMeta(state.meta);
    if (!dom) return '';
    return '<div class="tend">' + T('ui.tendPrefix', null, '正在走向：') + '<b>' + T('meta.' + dom, null, MJ.config.metaDefs[dom].name) + '</b>' + T('ui.tendSuffix', null, ' 之路') + '</div>';
  }

  // M5/M6 体验轴次条：媒体关系 / 孤独（与核心六维分离展示）
  function softBars(state) {
    var keys = ['media', 'loneliness'];
    var html = '<div class="bars soft">';
    keys.forEach(function (k) {
      var val = state.attributes[k] || 0;
      html += '<div class="bar"><div class="lab"><span>' + T('attr.' + k, null, MJ.config.attrNames[k]) + '</span><b>' + val + '</b></div>' +
        '<div class="track"><div class="fill ' + k + '" style="width:' + val + '%"></div></div></div>';
    });
    html += '</div>';
    return html;
  }

  // M1 关系/羁绊面板：具名 NPC 好感（-100..100）
  function relationsPanel(state) {
    var defs = MJ.config.relationsDefs || [];
    var rel = state.relations || {};
    var html = '<div class="rel-panel"><div class="rel-head">' + T('ui.relHead', null, '羁绊') + '</div><div class="rel-grid">';
    defs.forEach(function (d) {
      var v = rel[d.key] || 0;
      var cls = v >= 20 ? 'warm' : (v <= -10 ? 'cold' : 'neutral');
      var sign = v > 0 ? '+' : '';
      var relWord = v > 0 ? T('ui.relWarm', null, '亲近') : (v < 0 ? T('ui.relCold', null, '疏远') : T('ui.relNeutral', null, '平淡'));
      html += '<div class="rel-cell ' + cls + '" title="' + escapeHtml(T('rel.' + d.key, null, d.name)) + '：' + relWord + '（' + sign + v + '）">' +
        '<span class="rel-ico">' + d.icon + '</span><span class="rel-name">' + escapeHtml(T('rel.' + d.key, null, d.name)) + '</span>' +
        '<span class="rel-val">' + sign + v + '</span></div>';
    });
    html += '</div></div>';
    return html;
  }

  // M2 人生手记汇总（结局页）
  function diaryPanel(state) {
    var d = state.diary || [];
    var inner = '<details class="panel history diary" open><summary>' + T('ui.diaryTitle', null, '人生手记') + ' <span class="cnt">(' + d.length + ')</span></summary><div class="diary-list">';
    if (!d.length) inner += '<div class="empty">' + T('ui.diaryEmpty', null, '这一程尚未留下手记。') + '</div>';
    else d.forEach(function (e) {
      inner += '<div class="diary-item"><b>' + escapeHtml(T('chapter.' + e.chapter + '.title', null, e.title)) + '</b><p>' + escapeHtml(T(e.key || '', null, e.text)) + '</p></div>';
    });
    inner += '</div></details>';
    return inner;
  }

  // M4 命运回响汇总（结局页）
  function echoesPanel(state) {
    var d = state.echoes || [];
    var inner = '<details class="panel history echoes"><summary>' + T('ui.echoTitle', null, '命运回响') + ' <span class="cnt">(' + d.length + ')</span></summary><div class="echo-list">';
    if (!d.length) inner += '<div class="empty">' + T('ui.echoEmpty', null, '每一个选择都安分地落在了它该在的地方。') + '</div>';
    else d.forEach(function (e) { inner += '<div class="echo-item">' + escapeHtml(typeof e === 'string' ? e : T(e.key, null, e.text)) + '</div>'; });
    inner += '</div></details>';
    return inner;
  }



  // ---------- 传奇海报（Canvas 自动生成，可保存/分享的图片） ----------
  function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrapText(ctx, text, cx, y, maxW, lh) {
    var words = text.split(' '), line = '', lines = [];
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    var startY = y - (lines.length - 1) * lh / 2;
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], cx, startY + j * lh);
  }
  // 中文友好的段落换行（按字符量度，遇 \n 分段；返回绘制后的 y）
  function wrapParagraph(ctx, text, x, y, maxW, lh, maxY) {
    var paras = String(text).split('\n');
    ctx.textAlign = 'left';
    var done = false;
    for (var p = 0; p < paras.length && !done; p++) {
      var line = '', chars = paras[p].split('');
      for (var i = 0; i < chars.length; i++) {
        var test = line + chars[i];
        if (ctx.measureText(test).width > maxW && line) {
          if (maxY && y >= maxY) { ctx.fillText(line + '…', x, y); done = true; break; }
          ctx.fillText(line, x, y); y += lh; line = chars[i];
        } else line = test;
      }
      if (done) break;
      if (line) {
        if (maxY && y >= maxY) { ctx.fillText(line + '…', x, y); done = true; break; }
        ctx.fillText(line, x, y); y += lh;
      }
      y += Math.round(lh * 0.3);
    }
    return y;
  }
  // 旧存档兼容：部分历史存档的 history 条目没有存 id/opt（id 字段于提交 3752762 才加入），
  // 导致 createPoster 直接用了当时冻结的中文 title/choice，切英文后无法重译。
  // 这里用冻存的中文（或英文）标题/选项串反查事件 id，再按当前语言重译。
  // 旧存档兼容：部分历史存档的 history 条目没有存 id/opt（id 字段于提交 3752762 才加入），
  // 导致 createPoster 直接用了当时冻结的中文 title/choice，切英文后无法重译。
  // 这里用冻存的中文（或英文）标题/选项串反查事件 id 与 opt 序号，再按当前语言重译。
  // 注意：选项可能是函数式（按状态返回不同 opt<i>.label），故先预求值以触发 _zhLit 中文捕获，
  // 再用「键→中文」反查中文串→键（直接解析出真实 id 与 opt 序号，避免数组下标错位）。
  function buildPosterRevMap() {
    if (MJ._posterRev) return MJ._posterRev;
    var rev = { title: {}, choice: {} };
    var evs = MJ.EVENTS || {};
    var enDict = (MJ.i18n && MJ.i18n.dict && MJ.i18n.dict.eventEn) || {};
    // 1) 预求值所有函数式选项，触发 _zhLit 中文捕获（捕获与语言无关，始终写入 fallback）
    var _dummies = [
      {},
      { flags: { isSolo: true } },
      { flags: { isSolo: false } },
      { attributes: { health: 100, stress: 0, reputation: 100, art: 100, wealth: 100, family: 100 }, meta: { artPath: 1, mogul: 1, recluse: 1 }, flags: {} },
      { attributes: { health: 0, stress: 100, reputation: 0, art: 0, wealth: 0, family: 0 }, meta: {}, flags: {} }
    ];
    Object.keys(evs).forEach(function (id) {
      var ev = evs[id];
      if (ev && typeof ev.options === 'function') {
        _dummies.forEach(function (st) { try { ev.options(st); } catch (e) {} });
      }
    });
    // 2) 反转 _zhLit（event.<id>.title / event.<id>.opt<n>.label -> 中文）得到中文串->键
    var zl = MJ._zhLit || {};
    Object.keys(zl).forEach(function (k) {
      if (k.indexOf('event.') !== 0) return;
      var m = /^event\.([^.]+)\.(title|opt\d+)(?:\.label)?$/.exec(k);
      if (!m) return;
      var eid = m[1], kind = m[2];
      if (kind === 'title') { if (rev.title[zl[k]] == null) rev.title[zl[k]] = eid; }
      else { var idx = parseInt(kind.slice(3), 10); if (rev.choice[zl[k]] == null) rev.choice[zl[k]] = { id: eid, opt: idx }; }
    });
    // 3) 英文冻结串：eventEn（key->英文）反查
    Object.keys(enDict).forEach(function (k) {
      if (k.indexOf('event.') !== 0) return;
      var m = /^event\.([^.]+)\.(title|opt\d+)(?:\.label)?$/.exec(k);
      if (!m) return;
      var eid = m[1], kind = m[2];
      if (kind === 'title') { if (rev.title[enDict[k]] == null) rev.title[enDict[k]] = eid; }
      else { var idx = parseInt(kind.slice(3), 10); if (rev.choice[enDict[k]] == null) rev.choice[enDict[k]] = { id: eid, opt: idx }; }
    });
    MJ._posterRev = rev;
    return rev;
  }

  function createPoster(state, endingId) {
    // 统一金色调色板（与 CSS --gold / --gold-bright / --gold-deep 同族，集中管理避免 Canvas 与 DOM 各一套金色）
    var G = {
      rgb: '212,175,55',
      base: '#d4af37',    // = CSS --gold
      bright: '#f3e2b0',  // 明亮金（Canvas 文字高亮）
      deep: '#c79a2c',    // = CSS --gold-deep
      dim: '#b9a06a',
      dim2: '#8a7a4a',
      cream: '#e8d6a6',
      common: '#9c8a5a',
      legendHi: '#fff4cf'
    };
    var e = MJ.config.endings[endingId] || { name: endingId, tone: '', icon: '🌟', summary: '', monologue: '' };
    var eName = T('ending.' + endingId + '.name', null, e.name);
    var eTone = T('ending.' + endingId + '.tone', null, e.tone);
    var eSum = T('ending.' + endingId + '.summary', null, e.summary);
    var eMon = T('ending.' + endingId + '.monologue', null, e.monologue);
    var a = state.attributes;
    var dm = MJ.dominantMeta(state.meta);
    var metaName = dm ? T('meta.' + dm, null, MJ.config.metaDefs[dm].name) : '—';
    var legend = MJ.legendScore(state);
    var endYear = 2009; // 海报寿命语义固定为 1958—2009，不随续章触发年份漂移（GDD v1.11）
    // 本局达成成就：按最终状态判定条件，而非累计解锁（不展示历史已解锁总数）
    var thisRun = (MJ.config.achievements || []).filter(function (ac) {
      try { return ac.check(state, { ending: endingId }); } catch (err) { return false; }
    });
    // 海报上按实际可达性排序（与图鉴一致）
    var _reach = MJ.config.achievementReach || {};
    thisRun = thisRun.slice().sort(function (a, b) {
      return ((_reach[b.id] != null ? _reach[b.id] : 0) - (_reach[a.id] != null ? _reach[a.id] : 0));
    });
    var W = 720, H = 1280, S = 2;
    var cv = document.createElement('canvas');
    cv.width = W * S; cv.height = H * S;
    var ctx = cv.getContext('2d');
    ctx.scale(S, S);
    ctx.textBaseline = 'alphabetic';

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#17110a'); bg.addColorStop(0.55, '#0e0b07'); bg.addColorStop(1, '#090705');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var vg = ctx.createRadialGradient(W / 2, 300, 120, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(212,175,55,0.10)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = 'rgba(212,175,55,0.18)'; ctx.lineWidth = 1;
    ctx.strokeRect(34, 34, W - 68, H - 68);

    ctx.textAlign = 'center';
    ctx.fillStyle = G.base; ctx.font = '600 21px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(T('ui.posterHeader', null, 'MICHAEL JACKSON · 人 生 选 择'), W / 2, 78);
    ctx.fillStyle = 'rgba(212,175,55,0.55)'; ctx.font = '14px sans-serif';
    ctx.fillText('1958 — ' + endYear, W / 2, 102);

    // 矢量徽标（按稀有度着色，跨平台一致，不依赖 emoji 字体 —— 修复 emoji 变体选择符/ZWJ/垂直度量导致的叠层与错位）
    function starPath(cx, cy, spikes, outerR, innerR) {
      var rot = -Math.PI / 2, step = Math.PI / spikes;
      ctx.beginPath();
      for (var si = 0; si < spikes; si++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
      }
      ctx.closePath();
    }
    var _rar = (MJ.config.endingRarity && MJ.config.endingRarity[endingId]) || 'common';
    var _rc = { common: G.common, rare: G.deep, epic: '#c9b3f0', legendary: G.bright }[_rar] || G.deep;
    ctx.beginPath(); ctx.arc(W / 2, 178, 58, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212,175,55,0.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (_rar === 'epic' || _rar === 'legendary') {
      ctx.beginPath(); ctx.arc(W / 2, 178, 66, 0, Math.PI * 2);
      ctx.strokeStyle = _rc; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    }
    starPath(W / 2, 178, 5, 40, 17);
    if (_rar === 'legendary') {
      var _sg = ctx.createLinearGradient(W / 2 - 40, 178 - 40, W / 2 + 40, 178 + 40);
      _sg.addColorStop(0, G.legendHi); _sg.addColorStop(1, G.deep);
      ctx.fillStyle = _sg;
    } else {
      ctx.fillStyle = _rc;
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = G.bright; ctx.font = '700 44px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(eName, W / 2, 286);
    ctx.fillStyle = G.deep; ctx.font = 'italic 19px "PingFang SC",sans-serif';
    ctx.fillText(eTone, W / 2, 320);

    var dims = [
      [T('attr.health', null, '健康'), 'health', a.health],
      [T('attr.reputation', null, '声誉'), 'reputation', a.reputation],
      [T('attr.art', null, '艺术'), 'art', a.art],
      [T('attr.wealth', null, '财富'), 'wealth', a.wealth],
      [T('attr.family', null, '家庭'), 'family', a.family],
      [T('attr.stress', null, '压力'), 'stress', a.stress]
    ];
    var bx0 = 70, colW = (W - 140) / 2, top = 360, rowH = 44, labelW = 82, gutter = 96;
    var barXoff = labelW, barW = colW - labelW - gutter - 10;
    for (var i = 0; i < dims.length; i++) {
      var col = i % 2, row = (i / 2) | 0;
      var x = bx0 + col * colW, y = top + row * rowH;
      var bgx = x + barXoff;
      ctx.textAlign = 'left';
      ctx.fillStyle = G.dim; ctx.font = '15px "PingFang SC",sans-serif';
      ctx.fillText(dims[i][0], x, y + 15);
      var numStr = String(dims[i][2]);
      if (dims[i][1] === 'reputation' || dims[i][1] === 'art') {
        var ov = (state.overflow && state.overflow[dims[i][1]]) || 0;
        if (ov > 0) numStr += ' ★+' + ov;
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = G.bright; ctx.font = '600 15px sans-serif';
      ctx.fillText(numStr, x + colW - 10, y + 15);
      var v = Math.max(0, Math.min(100, dims[i][2])) / 100;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, bgx, y + 4, barW, 9, 4); ctx.fill();
      var grad = ctx.createLinearGradient(bgx, 0, bgx + barW, 0);
      grad.addColorStop(0, G.deep); grad.addColorStop(1, G.bright);
      ctx.fillStyle = grad; roundRect(ctx, bgx, y + 4, Math.max(2, barW * v), 9, 4); ctx.fill();
    }

    var y = top + 3 * rowH + 14;
    ctx.textAlign = 'center';
    ctx.fillStyle = G.bright; ctx.font = '600 18px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.metaRoutePrefix', null, '主导路线：') + metaName, W / 2, y);
    ctx.fillStyle = G.deep; ctx.font = '15px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterLegend', { s: legend.score, g: legend.grade }, '传奇 {s}（{g}）'), W / 2, y + 26);

    y += 54;
    ctx.fillStyle = G.base; ctx.font = '600 16px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.networth', null, '净资产') + '　' + formatMoney(state.netWorth), W / 2, y);

    y += 40;
    ctx.fillStyle = G.bright; ctx.font = '600 16px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterAch', { n: thisRun.length }, '本局点亮 {n} 枚成就'), W / 2, y);
    y += 16;
    var perRow = 11, cell = (W - 120) / perRow, ix0 = 60 + cell / 2;
    ctx.font = '30px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textBaseline = 'middle';
    if (thisRun.length) {
      for (var k = 0; k < thisRun.length; k++) {
        var c = k % perRow, r = (k / perRow) | 0;
        ctx.fillStyle = G.bright;
        try { ctx.fillText(thisRun[k].icon, ix0 + c * cell, y + r * 42 + 18); } catch (err) {}
      }
      y += (((thisRun.length / perRow) | 0) + (thisRun.length % perRow ? 1 : 0)) * 42 + 18;
    } else {
      ctx.fillStyle = G.dim2; ctx.font = '14px sans-serif'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(T('ui.posterNoAch', null, '— 本局暂未点亮成就 —'), W / 2, y + 18); y += 40;
    }
    ctx.textBaseline = 'alphabetic';

    // §18.8 人生关键词标签云：主导元路线 + 属性降序前 2
    y += 16;
    ctx.textAlign = 'center';
    ctx.fillStyle = G.base; ctx.font = '600 14px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterKeywords', null, '人生关键词'), W / 2, y);
    var _tags = [];
    if (dm) _tags.push(T('meta.' + dm, null, MJ.config.metaDefs[dm].name));
    var _sorted = dims.slice().sort(function (a, b) { return b[2] - a[2]; });
    _tags.push(_sorted[0][0], _sorted[1][0]);
    ctx.font = '600 13px "PingFang SC",sans-serif';
    var _pad = 14, _gap = 10, _ph = 28, _ws = [];
    for (var _t = 0; _t < _tags.length; _t++) _ws.push(ctx.measureText(_tags[_t]).width + _pad * 2);
    var _tot = _ws.reduce(function (s, w) { return s + w; }, 0) + _gap * (_tags.length - 1);
    var _x = (W - _tot) / 2;
    ctx.textBaseline = 'middle';
    for (var _t2 = 0; _t2 < _tags.length; _t2++) {
      var _px = _x, _pw = _ws[_t2];
      ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(212,175,55,0.10)';
      roundRect(ctx, _px, y + 8, _pw, _ph, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = G.bright;
      ctx.fillText(_tags[_t2], _px + _pw / 2, y + 8 + _ph / 2);
      _x += _pw + _gap;
    }
    ctx.textBaseline = 'alphabetic';
    y += 8 + _ph + 18;

    // §18.8 本局最关键 1–2 个抉择回看（取自 state.history 中 key 标记为真的节点）
    y += 6;
    ctx.textAlign = 'left';
    ctx.fillStyle = G.base; ctx.font = '600 15px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterKeyChoices', null, '关键抉择'), 60, y);
    y += 12;
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    y += 20;
    var _keys = (state.history || []).filter(function (h) { return h && h.key; });
    if (!_keys.length) {
      ctx.fillStyle = G.dim2; ctx.font = '13px sans-serif';
      ctx.fillText(T('ui.posterNoKey', null, '— 这一程没有惊天岔路 —'), 60, y); y += 22;
    } else {
      var _picks = [_keys[0]]; if (_keys.length > 1) _picks.push(_keys[_keys.length - 1]);
      for (var _ki = 0; _ki < _picks.length; _ki++) {
        var _kk = _picks[_ki];
        var _kt = _kk.title || '';
        var _kc = _kk.choice || '';
        var _rid = _kk.id || null;
        if (!_rid) {
          // 旧存档兼容：用冻存标题反查事件 id
          var _rm = buildPosterRevMap();
          if (_kt && _rm.title[_kt]) _rid = _rm.title[_kt];
        }
        if (_rid) {
          _kt = T('event.' + _rid + '.title', null, _kt);
          var _ropt = _kk.opt;
          if ((_ropt == null || _ropt < 0) && !_kk.id) {
            // 旧存档无 opt：用冻存选项串反查序号
            var _rc = buildPosterRevMap().choice[_kc];
            if (_rc && _rc.id === _rid) _ropt = _rc.opt;
          }
          if (_ropt != null && _ropt >= 0) _kc = T('event.' + _rid + '.opt' + _ropt + '.label', null, _kc);
        }
        // 兜底：英文模式下若仍残留中文（极罕见，旧存档异常），不向外暴露中文
        if (MJ.i18n.lang === 'en') {
          if (/[一-鿿　-〿＀-￯]/.test(_kt)) _kt = '';
          if (/[一-鿿　-〿＀-￯]/.test(_kc)) _kc = '—';
        }
        ctx.fillStyle = G.bright; ctx.font = '600 13px "PingFang SC",sans-serif';
        ctx.fillText((_kk.year || '') + ' · ' + _kt, 60, y); y += 19;
        ctx.fillStyle = G.deep; ctx.font = '13px "PingFang SC",sans-serif';
        ctx.fillText('↳ ' + _kc, 74, y); y += 23;
      }
    }

    y += 24;
    ctx.textAlign = 'left';
    ctx.fillStyle = G.base; ctx.font = '600 17px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterEndingLabel', null, '结局 · 你的传奇'), 60, y);
    y += 14;
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    y += 24;
    ctx.fillStyle = G.cream; ctx.font = '16px "PingFang SC",sans-serif';
    var narr = (eSum ? eSum + '\n' : '') + (eMon || '');
    y = wrapParagraph(ctx, narr, 60, y, W - 120, 28, H - 130);

    ctx.textAlign = 'center';
    ctx.fillStyle = G.base; ctx.font = 'italic 17px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterTagline', null, '每个人都是自己人生的词曲作者。'), W / 2, H - 96);
    ctx.fillStyle = 'rgba(212,175,55,0.5)'; ctx.font = '13px sans-serif';
    ctx.fillText(T('ui.posterSigned', null, '月球漫步 · 传奇抉择'), W / 2, H - 70);
    ctx.fillStyle = 'rgba(212,175,55,0.42)'; ctx.font = '12px sans-serif';
    ctx.fillText(T('ui.credit', null, 'Cr3aM 制作 · MJ Forever'), W / 2, H - 46);

    return cv;
  }
  function downloadPoster(cv, base) {
    var name = base + '.png';
    // 同步 data: URI 锚点下载，跨平台（含 Android WebView）可靠；
    // 避免 toBlob 在部分设备回调不来 / 抛错导致下载无反应（旧安卓裂图同类问题）
    var a = document.createElement('a');
    a.href = cv.toDataURL('image/png'); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }


  // 传奇海报弹窗：结局默认弹出，可关闭；关闭后点击缩略图再次打开（放大查看）
  function openPosterModal(state, id, archiveIdx, prebuilt) {
    var old = document.getElementById('poster-overlay');
    if (old) old.parentNode.removeChild(old);
    var e = MJ.config.endings[id] || { name: id };
    var cv = prebuilt || createPoster(state, id);
    var hasDelete = (typeof archiveIdx === 'number');
    var overlay = document.createElement('div');
    overlay.id = 'poster-overlay';
    overlay.className = 'overlay poster-modal';
    overlay.innerHTML = '<div class="poster-frame">' +
      '<div class="poster-canvas-wrap"></div>' +
      '<div class="poster-foot">' +
        '<p class="poster-hint">' + T('ui.posterSaveHint', null, '提示：长按海报图片即可保存到本地') + '</p>' +
        '<div class="poster-foot-actions' + (hasDelete ? ' has-delete' : '') + '">' +
          (hasDelete ? '<button class="btn danger" id="pm-delete">' + T('ui.archiveDelete', null, '删除档案') + '</button>' : '') +
          '<button class="btn primary" id="pm-save">' + T('ui.posterSave', null, '保存图片') + '</button>' +
          '<button class="btn primary" id="pm-close">' + T('ui.close', null, '关闭 ✕') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
    // 移动端长按「保存图片」原生菜单只对 <img> 生效，<canvas> 无效；故将画布转为 <img> 再插入
    var _posterImg = document.createElement('img');
    _posterImg.src = cv.toDataURL('image/png');
    _posterImg.alt = T('ui.posterOfTag', null, '传奇海报');
    _posterImg.className = 'poster-img';
    _posterImg.title = T('ui.zoomHint', null, '点击放大海报');
    overlay.querySelector('.poster-canvas-wrap').appendChild(_posterImg);
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'poster-overlay', open: function () { openPosterModal(state, id, archiveIdx, prebuilt); } };
    overlay.addEventListener('click', function (evt) { if (evt.target === overlay) closePosterModal(); });
    document.getElementById('pm-close').addEventListener('click', closePosterModal);
    var _saveBtn = document.getElementById('pm-save');
    if (_saveBtn) _saveBtn.addEventListener('click', function () { downloadPoster(cv, 'MJ-' + id); });
    if (hasDelete) {
      // 二次确认（再次点击确认 + 3 秒超时复位），删除后回到档案库列表
      wireReset('pm-delete', function () {
        MJ.saveSystem.removeArchive(archiveIdx);
        closePosterModal();
      }, function () { archiveModal(); });
    }
  }
  function closePosterModal() {
    var o = document.getElementById('poster-overlay');
    if (o) o.parentNode.removeChild(o);
  }

  ui.showIntro = function (hasSave) {
    var langLabel = '🌐 ' + T('ui.langBtn', null, '语言');
    var html =
      '<div class="panel intro">' +
        '<h1>' + T('ui.title', null, '月球漫步：传奇的抉择') + '</h1>' +
        (MJ.i18n.lang === 'zh' ? '<p class="sub">Moonwalk: The Legend\'s Choice</p>' : '') +
        '<div class="how">' +
          '<p><b>' + T('ui.howtoLabel', null, '玩法') + '</b>：' + T('ui.introHowto', null, '你扮演迈克尔·杰克逊，在真实历史的关键节点做选择。每一个决定都会改变你的健康、声誉、财富、家庭、艺术与压力，并导向 18 种不同的人生结局。') + '</p>' +
        '</div>' +
        '<div class="btn-row">' +
          (hasSave ? '<button class="btn primary" id="btn-continue">' + T('ui.continue', null, '继续游戏') + '</button>' : '') +
          '<button class="btn ' + (hasSave ? 'ghost' : 'primary') + '" id="btn-new">' + T('ui.newGame', null, '开始新人生') + '</button>' +
        '</div>' +
        '<div class="menu-grid">' +
          '<button class="btn block" id="btn-gallery">📖 ' + T('ui.gallery', null, '结局图鉴') + ' <span class="m-cnt">' + galleryCount() + '</span></button>' +
          '<button class="btn block" id="btn-ach">🏆 ' + T('ui.achievements', null, '成就') + ' <span class="m-cnt">' + achCount() + '</span></button>' +
          '<button class="btn block" id="btn-egg">🥚 ' + T('ui.eggCodex', null, '彩蛋图鉴') + ' <span class="m-cnt">' + eggCount() + '</span></button>' +
          '<button class="btn block" id="btn-trivia">📝 ' + T('ui.triviaCodex', null, '趣事图鉴') + ' <span class="m-cnt">' + triviaCount() + '</span></button>' +
          '<button class="btn block" id="btn-archive">🗂️ ' + T('ui.archive', null, '人生档案库') + ' <span class="m-cnt">' + archiveCount() + '</span></button>' +
          '<button class="btn block" id="btn-lang">' + langLabel + '</button>' +
        '</div>' +
        '<div class="intro-foot">' +
          '<div class="credit">' + T('ui.credit', null, 'Cr3aM 制作 · MJ Forever') + '</div>' +
'</div>' +
      '</div>';
    app.innerHTML = html;
    if (hasSave) $('#btn-continue').addEventListener('click', function () {
      MJ.engine.resume(MJ.saveSystem.load());
    });
    $('#btn-new').addEventListener('click', function () {
      if (hasSave && !window.confirm(T('ui.coverConfirm', null, '将覆盖当前存档并开始新人生，确定吗？'))) return;
      MJ.saveSystem.clear();
      MJ.engine.start();
    });
    var bg = $('#btn-gallery'); if (bg) bg.addEventListener('click', galleryModal);
    var ba = $('#btn-ach'); if (ba) ba.addEventListener('click', achievementsModal);
    var be = $('#btn-egg'); if (be) be.addEventListener('click', eggModal);
    var bt = $('#btn-trivia'); if (bt) bt.addEventListener('click', triviaModal);
    var barc = $('#btn-archive'); if (barc) barc.addEventListener('click', archiveModal);
    var lb = $('#btn-lang'); if (lb) lb.addEventListener('click', openLangModal);
    _view = function () { ui.showIntro(hasSave); };
  };

  ui.showEvent = function (ev, state) {
    var loc = (MJ.localizeEvent ? MJ.localizeEvent(ev, state) : null);
    var title = loc ? loc.title : ev.title;
    var text = loc ? loc.text : ((typeof ev.text === 'function') ? ev.text(state) : ev.text);
    var opts = loc ? loc.options : MJ.engine.optionsOf(ev);
    var epilogueHtml = '';
    if (MJ.engine.pendingEpilogue) {
      epilogueHtml = '<div class="epilogue"><span class="e-tag">' + T('ui.epilogueTag', null, '抉择的回响') + '</span>' + escapeHtml(MJ.engine.pendingEpilogue) + '</div>';
      MJ.engine.pendingEpilogue = null;
    }
    var body =
      '<div class="panel event">' + epilogueHtml +
        '<div class="yr">' + (MJ.eventYear(ev) || '') + ' 年</div>' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        '<div class="body">' + escapeHtml(text) + '</div>';

    if (ev.kind === 'auto') {
      body += '<div class="continue-row"><button class="btn primary" id="btn-next">' + T('ui.next', null, '继续') + '</button></div>';
    } else if (ev.kind === 'ending') {
      body += '<div class="continue-row"><button class="btn primary" id="btn-end">' + T('ui.end', null, '尘埃落定') + '</button></div>';
    } else {
      body += '<div class="options">';
      opts.forEach(function (o, i) {
        body += '<button class="option" data-idx="' + i + '">' +
          '<div class="ot">' + escapeHtml(o.label) + '</div>' +
          (o.hint ? '<div class="oh">' + escapeHtml(o.hint) + '</div>' : '') +
          '</button>';
      });
      body += '</div>';
    }
    body += '</div>';

    app.innerHTML = statusBar(state, ev) + body + historyPanel(state);
    try { app.setAttribute('data-chapter', MJ.chapterOf(ev)); } catch (e) {}

    if (ev.kind === 'auto') {
      $('#btn-next').addEventListener('click', function () { MJ.engine.proceed(); });
    } else if (ev.kind === 'ending') {
      $('#btn-end').addEventListener('click', function () { MJ.engine.finishEnding(); });
    } else {
      var btns = app.querySelectorAll('.option');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          MJ.engine.choose(parseInt(b.getAttribute('data-idx'), 10));
        });
      });
    }
    bindEventKeys(ev);
    // 续局（resume）首屏静默消化已解锁成就，不重弹；正常推进时照常弹窗
    var _newAch = MJ.achievementSystem.evaluate(state, {});
    if (MJ.engine._suppressAchToast === true) { MJ.engine._suppressAchToast = false; }
    else { _newAch.forEach(toastAchievement); }
    _view = function () { ui.showEvent(ev, state); };
    window.scrollTo(0, 0);
  };

  // M3 章节过场（时代卡片）：展示章节标题/副题、本章人生手记(M2)与命运回响(M4)
  ui.showEraCard = function (chapter, state, onContinue) {
    var _ld = (state.diary && state.diary.length) ? state.diary[state.diary.length - 1] : null;
    var diary = _ld ? T(_ld.key || '', null, _ld.text) : '';
    var _le = (state.echoes && state.echoes.length) ? state.echoes[state.echoes.length - 1] : null;
    var echo = _le ? (typeof _le === 'string' ? _le : T(_le.key, null, _le.text)) : '';
    var html = statusBar(state, { year: chapter.start }) +
      '<div class="panel era-card">' +
        '<div class="era-ch">' + T('chapter.' + chapter.id + '.title', null, chapter.title) + '</div>' +
        '<div class="era-sub">' + T('chapter.' + chapter.id + '.sub', null, chapter.sub) + '</div>' +
        (diary ? '<div class="era-block"><span class="e-tag">' + T('ui.diaryTag', null, '手记') + '</span>' + escapeHtml(diary) + '</div>' : '') +
        (echo ? '<div class="era-block"><span class="e-tag">' + T('ui.echoTag', null, '命运回响') + '</span>' + escapeHtml(echo) + '</div>' : '') +
        (chapter.flavor ? '<div class="era-flavor">' + T('chapter.' + chapter.id + '.flavor', null, chapter.flavor) + '</div>' : '') +
        '<div class="continue-row"><button class="btn primary" id="btn-era">' + T('ui.eraEnter', null, '进入本章') + '</button></div>' +
      '</div>' + historyPanel(state);
    app.innerHTML = html;
    try { app.setAttribute('data-chapter', chapter.id); } catch (e) {}
    var btn = document.getElementById('btn-era');
    if (btn) btn.addEventListener('click', function () { onContinue(); });
    _view = function () { ui.showEraCard(chapter, state, onContinue); };
    window.scrollTo(0, 0);
  };

  ui.showEnding = function (id, state) {
    var e = MJ.config.endings[id] || { name: id, icon: '🌟', tone: '', summary: '' };
    var legend = MJ.legendScore(state);
    // §18.7 人生档案库：终局一次性写入历史快照（与当前进行中存档解耦）；
    // 用 state._archived 防止切语言重渲染（_view 重跑 showEnding）时重复写入。
    if (!state._archived) {
      state._archived = true;
      var _run = (MJ.config.achievements || []).filter(function (ac) {
        try { return ac.check(state, { ending: id }); } catch (err) { return false; }
      });
      MJ.saveSystem.addArchive({
        ts: Date.now(),
        endingId: id,
        state: state.serialize(),          // 完整快照，回看时可即时重绘海报
        legendScore: legend.score,
        legendGrade: legend.grade,
        dominantMeta: MJ.dominantMeta(state.meta),
        achCount: _run.length,
        variants: (state.stats && state.stats.variants) || 0,
        keyChoices: (state.stats && state.stats.keyChoices) || 0
      });
    }
    if (MJ.triviaSystem) MJ.triviaSystem.revealAll(state); // §17.11：结局时按人生状态解锁考据趣事

    var html =
      statusBar(state, { year: e.year || 2009 }) +
      '<div class="panel ending' + (e.hidden ? ' hidden-ending' : '') + '">' +
        (e.hidden ? '<div class="badge-ultimate">' + T('ui.badgeUltimate', null, '★ 终极隐藏结局') + '</div>' : '') +
        '<div class="icon">' + e.icon + '</div>' +
        '<h2>' + T('ending.' + id + '.name', null, e.name) + '</h2>' +
        '<p class="tone">' + T('ending.' + id + '.tone', null, e.tone) + '</p>' +
        '<div class="desc">' + escapeHtml(T('ending.' + id + '.summary', null, e.summary)) + '</div>' +
        (e.monologue ? '<div class="mono">' + escapeHtml(T('ending.' + id + '.monologue', null, e.monologue)) + '</div>' : '') +
        '<div class="poster-section">' +
          '<div class="poster-box" id="poster-box"></div>' +
'<p class="poster-hint">' + T('ui.posterSaveHint', null, '提示：长按海报图片即可保存到本地') + '</p>' +
        '</div>' +
        '<div class="btn-row"><button class="btn primary" id="btn-restart">' + T('ui.restart', null, '重新开始') + '</button></div>' +
      '</div>' +
      '<div class="menu-grid">' +
        '<button class="btn block" id="btn-gallery-end">📖 ' + T('ui.gallery', null, '结局图鉴') + ' <span class="m-cnt">' + galleryCount() + '</span></button>' +
        '<button class="btn block" id="btn-ach-end">🏆 ' + T('ui.achievements', null, '成就') + ' <span class="m-cnt">' + achCount() + '</span></button>' +
        '<button class="btn block" id="btn-egg-end">🥚 ' + T('ui.eggCodex', null, '彩蛋图鉴') + ' <span class="m-cnt">' + eggCount() + '</span></button>' +
        '<button class="btn block" id="btn-trivia-end">📝 ' + T('ui.triviaCodex', null, '趣事图鉴') + ' <span class="m-cnt">' + triviaCount() + '</span></button>' +
        '<button class="btn block" id="btn-lang-end">🌐 ' + T('ui.langBtn', null, '语言') + '</button>' +
      '</div>' +
      '<div class="review-grid">' +
      subDimPanel(state) +
      keyReviewPanel(state) +
      diaryPanel(state) +
      vignettePanel(state) +
      echoesPanel(state) +
      historyPanel(state) +
      '</div>' +
      '<div class="foot">' + T('ui.foot', null, '你的每一个选择，写就了独一无二的传奇。') + '</div>';
    app.innerHTML = html;
    MJ.achievementSystem.evaluate(state, { ending: id }).forEach(toastAchievement);
    if (MJ.eggSystem && !state._onEndingDone) { state._onEndingDone = true; MJ.eggSystem.onEnding(state, id); }
    $('#btn-restart').addEventListener('click', function () {
      MJ.saveSystem.clear();
      ui.showIntro(false);
    });
    var posterCanvas = createPoster(state, id);
    var pbox = document.getElementById('poster-box');
    if (pbox) {
      var thumb = document.createElement('img');
      thumb.src = posterCanvas.toDataURL('image/png');
      thumb.alt = T('ui.posterOfTag', null, '传奇海报');
      thumb.className = 'poster-thumb';
      thumb.title = T('ui.zoomHint', null, '点击放大海报');
      thumb.addEventListener('click', function () { openPosterModal(state, id); });
      pbox.appendChild(thumb);
    }
    openPosterModal(state, id, undefined, posterCanvas); // 结局默认弹出海报（复用缩略图同一张画布），可关闭后点击缩略图放大
    var bge = $('#btn-gallery-end'); if (bge) bge.addEventListener('click', galleryModal);
    var bae = $('#btn-ach-end'); if (bae) bae.addEventListener('click', achievementsModal);
    var bee = $('#btn-egg-end'); if (bee) bee.addEventListener('click', eggModal);
    var bte = $('#btn-trivia-end'); if (bte) bte.addEventListener('click', triviaModal);
    var ble = $('#btn-lang-end'); if (ble) ble.addEventListener('click', openLangModal);
    _view = function () { ui.showEnding(id, state); };
    setKeyHandler(function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var r = $('#btn-restart'); if (r) r.click(); }
    });
    window.scrollTo(0, 0);
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  MJ.ui = ui;
})();
