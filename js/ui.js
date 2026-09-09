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
    overlay.querySelector('#lang-close').addEventListener('click', function () { closeOverlay('lang-modal'); });
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
    if (a >= 10000) return sign + '$' + (a / 10000).toFixed(2) + ' 亿';
    return sign + '$' + a + ' 万';
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
      }
      // 财富条不再附注净资产（与右上角 header 重复）；净资产以 header 为唯一权威显示（含负债红字状态）
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
  // 按 keyWeight 降序、year 升序「精选置顶」，默认展开前 6 条，其余折叠为「+N 条」
  function keyStepHtml(e) {
    var w = e.keyWeight || 1;
    return '<div class="step' + (w >= 3 ? ' top' : '') + '"><span class="yr">' + (e.year != null ? e.year : '—') + '</span>' +
      '<span class="t">' + escapeHtml(historyTitle(e)) + '</span>' +
      '<span class="c">' + escapeHtml(e.choice) + '</span></div>';
  }
  function keyReviewPanel(state) {
    var h = state.history || [];
    var keys = h.filter(function (e) { return e.key; });
    keys.sort(function (a, b) {
      var wa = a.keyWeight || 1, wb = b.keyWeight || 1;
      if (wa !== wb) return wb - wa;
      return numYear(a.year) - numYear(b.year);
    });
    var CAP = 4;
    var visible = keys.slice(0, CAP), rest = keys.slice(CAP);
    var inner = '<details class="panel history kreview" open>' +
      '<summary>' + T('ui.keyReviewTitle', null, '关键抉择回顾') + ' <span class="cnt">(' + keys.length + ')</span></summary>' +
      '<div class="timeline">';
    if (keys.length === 0) {
      inner += '<div class="empty">' + T('ui.keyReviewEmpty', null, '这一程没有惊心动魄的岔路，平凡本身也是一种答案。') + '</div>';
    } else {
      inner += '<div class="kgrid">';
      visible.forEach(function (e) { inner += keyStepHtml(e); });
      inner += '</div>';
      if (rest.length) {
        inner += '<details class="kmore"><summary>' + T('ui.keyReviewMore', { n: rest.length }, '展开其余 {n} 条') + '</summary>';
        rest.forEach(function (e) { inner += keyStepHtml(e); });
        inner += '</details>';
      }
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
    var html = '<div class="panel gallery ending-gallery">' +
      '<div class="g-head">' + T('ui.gallery', null, '结局图鉴') + ' <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="g-grid">';
    keys.forEach(function (k) {
      var e = defs[k];
      var on = !!g[k];
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + (e.hidden && !on ? ' locked-hidden' : '') + '" role="button" tabindex="0" data-endkey="' + k + '" title="' + (on ? T('ending.' + k + '.name', null, e.name) : T('ui.locked', null, '未解锁')) + '">' +
        '<div class="g-icon">' + (on ? e.icon : '❓') + '</div>' +
        '<div class="g-name">' + (on ? T('ending.' + k + '.name', null, e.name) : T('ui.unknown', null, '？？？')) + '</div>' +
        '<div class="g-rarity ' + (on ? rarityClass(MJ.config.endingRarity[k]) : '') + '">' + (on ? rarityLabel(MJ.config.endingRarity[k]) : T('ui.locked', null, '未解锁')) + '</div>' +
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
    var html = '<div class="panel gallery ach-gallery">' +
      '<div class="g-head">' + T('ui.achievements', null, '成就') + ' <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="g-grid">';
    list.forEach(function (a) {
      var on = a.unlocked;
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + '" title="' + (on ? escapeHtml(T('ach.' + a.id + '.name', null, a.name) + '：' + T('ach.' + a.id + '.desc', null, a.desc)) : T('ui.locked', null, '未解锁')) + '">' +
        '<div class="g-icon">' + (on ? a.icon : '🏆') + '</div>' +
        '<div class="g-name">' + (on ? T('ach.' + a.id + '.name', null, a.name) : T('ui.unknown', null, '？？？')) + '</div>' +
        (on ? '<div class="g-rarity ' + rarityClass(a.rarity) + '">' + rarityLabel(a.rarity) + '</div>' : '<div class="g-rarity">' + T('ui.locked', null, '未解锁') + '</div>') +
        (on ? '<div class="g-desc">' + escapeHtml(T('ach.' + a.id + '.desc', null, a.desc)) + '</div>' : '') +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }

  // ---------- 图鉴 / 成就 弹窗（主菜单各收为一个按钮；含多次确认重置） ----------
  // U1 稀有度颜色体系：色板与 css --r-* 变量、海报 canvas 对齐（uncommon 原 canvas 缺失，此处补全）
  var RARITY_COLORS = { common: '#9c8a5a', uncommon: '#b9a06a', rare: '#c79a2c', epic: '#c9b3f0', legendary: '#f3e2b0' };
  function rarityLabel(r) {
    var zh = ({ common: '普通', uncommon: '平凡', rare: '稀有', epic: '史诗', legendary: '传奇' })[r] || '普通';
    return T('rarity.' + r, null, zh);
  }
  function rarityClass(r) { return 'r-' + (RARITY_COLORS[r] ? r : 'common'); }
  function closeOverlay(id) {
    var o = document.getElementById(id);
    if (o) o.parentNode.removeChild(o);
    // 兜底校正：任何弹层关闭都刷新背后页面的计数（覆盖「在弹层内重置/删档后返回」路径）
    refreshCounts();
  }
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
      // 重置/删除落库后立刻校正计数，随后 reopen 的弹层内容自然也是最新
      refreshCounts();
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
    // U3#8 键盘可达：Enter / Space 触发结局详情
    overlay.querySelector('.modal-body').addEventListener('keydown', function (ev) {
      var cell = ev.target.closest ? ev.target.closest('.g-cell') : null;
      if (cell && cell.getAttribute('data-endkey') && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault(); endingDetailModal(cell.getAttribute('data-endkey'));
      }
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
        ((e.assumption || e.tone) ? '<div class="ed-tags">' +
          (e.assumption ? '<span class="pill pill-violet">✦ ' + T('ui.assumptionLine', null, '假设线') + '</span>' : '') +
          (e.tone ? '<span class="pill pill-gold">' + escapeHtml(T('ending.' + key + '.tone', null, e.tone)) + '</span>' : '') +
        '</div>' : '') +
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
      bodyHtml =
        (e.assumption ? '<div class="ed-tags"><span class="pill pill-violet">✦ ' + T('ui.assumptionLine', null, '假设线') + '</span></div>' : '') +
        (hint
        ? '<div class="ed-hint"><span class="ed-hint-label">🎯 ' + T('ui.howTo', null, '如何达成') + '</span>' + escapeHtml(hint) + '</div>'
        : '<div class="ed-summary">' + T('ui.locked', null, '未解锁') + '</div>');
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
        '<div class="g-hd">' +
          '<span class="g-icon">' + (on ? e.icon : '🥚') + '</span>' +
          '<span class="g-name">' + (on ? escapeHtml(T('egg.' + k + '.name', null, e.name)) : T('ui.unknown', null, '？？？')) + '</span>' +
        '</div>' +
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
        '<div class="g-hd">' +
          '<span class="g-icon">' + (on ? e.icon : '📝') + '</span>' +
          '<span class="g-name">' + (on ? escapeHtml(T('trivia.' + k + '.name', null, e.name)) : T('ui.unknown', null, '？？？')) + '</span>' +
        '</div>' +
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
  // 计数自愈（2026-09-09）：菜单/结局页的 m-cnt 与「继续游戏」按钮在建 HTML 时一次性求值，
  // 之后 localStorage 变更（删档案、重置图鉴/成就/彩蛋/趣事、新解锁）都不会回写 DOM，
  // 表现就是「数量滞后、刷新才对」。统一按 data-cnt 重算即可，无需重绘整页。
  function refreshCounts() {
    try {
      Array.prototype.forEach.call(document.querySelectorAll('[data-cnt]'), function (el) {
        var k = el.getAttribute('data-cnt');
        var v = null;
        if (k === 'gallery') v = galleryCount();
        else if (k === 'ach') v = achCount();
        else if (k === 'egg') v = eggCount();
        else if (k === 'trivia') v = triviaCount();
        else if (k === 'archive') v = archiveCount();
        if (v != null && el.textContent !== String(v)) el.textContent = v;
      });
      syncContinueBtn();
    } catch (e) {}
  }
  // 进行中存档消失（删档/开新局）后，「继续游戏」按钮与其主次样式同步
  function syncContinueBtn() {
    try {
      var bc = document.getElementById('btn-continue');
      if (!bc) return;
      var live = false;
      try { live = !!MJ.saveSystem.load(); } catch (e) { live = false; }
      bc.style.display = live ? '' : 'none';
      var bn = document.getElementById('btn-new');
      if (bn) { bn.classList.remove('primary', 'ghost'); bn.classList.add(live ? 'ghost' : 'primary'); }
    } catch (e) {}
  }
  function collaboratorsModal(state) {
    closeOverlay('collab-overlay');
    var metN = 0;
    if (MJ.COLLABORATORS && MJ.isCollaboratorMet) {
      MJ.COLLABORATORS.forEach(function (c) { if (MJ.isCollaboratorMet(state, c.relKey)) metN++; });
    }
    var overlay = document.createElement('div');
    overlay.id = 'collab-overlay';
    overlay.className = 'overlay modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>💞 ' + T('ui.collabTitle', null, '合作者') + '</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="collab-close">' + T('ui.close', null, '关闭 ✕') + '</button></div>' +
      '<div class="modal-body"><div class="collab-sub">' + T('ui.collabSub', null, '那些与你并肩或交错的人') +
      ' <span class="pill pill-gold">' + T('ui.collabProgress', { n: metN }, '已结识 ' + metN + ' / 6') + '</span></div>' +
      (MJ.renderCollaboratorsOverview ? MJ.renderCollaboratorsOverview(state) : '') + '</div></div>';
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'collab-overlay', open: function () { collaboratorsModal(state); } };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('collab-overlay'); });
    document.getElementById('collab-close').addEventListener('click', function () { closeOverlay('collab-overlay'); });
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
    t.className = 'toast toast-teal';
    t.innerHTML = '<div class="at-icon">' + e.icon + '</div>' +
      '<div class="at-body"><div class="at-title">' + T('ui.triviaToast', null, '趣事发现 · ') + escapeHtml(e.name) + '</div>' +
      '<div class="at-desc">' + escapeHtml(e.desc) + '</div></div>';
    refreshCounts(); // 趣事入账 → 可见计数即时 +1
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
    // U3#17 读屏可感知：成就/彩蛋解锁信息对 assistive tech 播报
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
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
    t.className = 'toast toast-gold';
    t.innerHTML = '<div class="at-icon">' + a.icon + '</div>' +
      '<div class="at-body"><div class="at-title">' + T('ui.achToast', null, '成就解锁 · ') + escapeHtml(T('ach.' + a.id + '.name', null, a.name)) +
      (a.rarity && a.rarity !== 'common' && a.rarity !== 'uncommon' ? '<span class="r-tag ' + rarityClass(a.rarity) + '">' + rarityLabel(a.rarity) + '</span>' : '') + '</div>' +
      '<div class="at-desc">' + escapeHtml(T('ach.' + a.id + '.desc', null, a.desc)) + '</div></div>';
    refreshCounts(); // 成就解锁 → 可见计数即时 +1
    _enqueueToast(t, 3000);
  }

  // 彩蛋解锁即时弹窗（GDD §17.9；经队列串行）
  function toastEgg(e) {
    var t = document.createElement('div');
    t.className = 'toast toast-violet';
    t.innerHTML = '<div class="at-icon">' + e.icon + '</div>' +
      '<div class="at-body"><div class="at-title">' + T('ui.eggToast', null, '彩蛋发现 · ') + escapeHtml(e.name) + '</div>' +
      '<div class="at-desc">' + escapeHtml(e.desc) + '</div></div>';
    refreshCounts(); // 彩蛋入账 → 可见计数即时 +1
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

  // M1 关系/羁绊面板：具名 NPC 好感（-100..100）；未结识者不显示（MJ.relChipVisible 单一事实来源）
  function relationsPanel(state) {
    var defs = (MJ.config.relationsDefs || []).filter(function (d) {
      return !MJ.relChipVisible || MJ.relChipVisible(state, d.key);
    });
    var rel = state.relations || {};
    var html = '<div class="rel-panel"><div class="rel-head"><span>' + T('ui.relHead', null, '羁绊') + '</span>' +
      '<button class="btn ghost small" id="btn-collab" title="' + T('ui.collabTitle', null, '合作者') + '">👤 ' + T('ui.collabTitle', null, '人物志') + '</button></div><div class="rel-grid">';
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
  // 中文友好的段落换行（按字符量度，遇 \n 分段；EN 按空格分词避免单词腰斩；返回绘制后的 y）
  function wrapParagraph(ctx, text, x, y, maxW, lh, maxY) {
    var isEn = MJ.i18n && MJ.i18n.lang === 'en';
    var paras = String(text).split('\n');
    ctx.textAlign = 'left';
    var done = false;
    for (var p = 0; p < paras.length && !done; p++) {
      var line = '', units = isEn ? paras[p].split(' ') : paras[p].split('');
      for (var i = 0; i < units.length; i++) {
        var test = line ? (isEn ? line + ' ' + units[i] : line + units[i]) : units[i];
        if (ctx.measureText(test).width > maxW && line) {
          if (maxY && y >= maxY) { ctx.fillText(line + '…', x, y); done = true; break; }
          ctx.fillText(line, x, y); y += lh; line = units[i];
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

  // 海报名言库：取自 docs/mjwiki/wiki/Michael Jackson - Wikiquote.html（逐条核对可考）
  // 海报名言库：名言逐条取自 docs/mjwiki/wiki/Michael Jackson - Wikiquote.html（含出处注释）；
  // 歌词为歌曲原句（注明出处）。均控制 ≤2 行以适配方案 B 排版。
  var MJ_POSTER_QUOTES = [
    // —— 名言（Wikiquote 逐条核对）——
    { zh: '谎言奔跑如冲刺，真相奔跑如马拉松。', en: 'Lies run sprints, but the truth runs marathons.' }, // Jet, Nov 2003
    { zh: '若你降生时知被爱、离去时亦知被爱，其间一切皆可面对。', en: 'If you enter this world knowing you are loved and you leave this world knowing the same, then everything that happens in between can be dealt with.' }, // Dancing the Dream, 1992
    { zh: '“我爱你。”——那是落笔之前，写在词下的结局。', en: 'I love you. That’ll be the ending of this under the words.' }, // Moonwalker
    { zh: '纵然世界充满恨，我们仍须敢于希望。', en: 'In a world filled with hate, we must still dare to hope.' }, // funeral invitation, 2009
    { zh: '我并无偏见，只是时候该有第一位黑人王者了。', en: 'I am not prejudiced, it’s just time for the first Black King now.' }, // handwritten note, 1987
    { zh: '意识借创造表达自身；我们栖居的世界，是造物者的舞。', en: 'Consciousness expresses itself through creation. This world we live in is the dance of the Creator.' }, // Dangerous inlay “The Dance”, 1991
    { zh: '我只是乐声流经的管道；荣耀不归我——那是神的工作，祂借我做信使。', en: 'I’m just the source through which music flows. I can’t take credit for it — it’s God’s work, and He’s using me as the messenger.' }, // Ebony/Jet, 1992
    { zh: '我渐渐明白，父亲哪怕严厉，也藏着一种爱——他逼我，是因为爱我。', en: 'I have begun to see that even my father’s harshness was a kind of love. He pushed me because he loved me.' }, // Oxford “Heal the Kids”, 2001
    { zh: '别人模仿我，我毫无芥蒂——那是一种赞美。', en: 'I have no problem with them imitating me. It’s a compliment.' }, // TV Guide, 2001
    { zh: '我知自己属何族。照镜便知——我是黑人。', en: 'I know my race. I just look in the mirror. I know I’m black.' }, // NAA remarks, 2002
    { zh: '我和任何人一样，会受伤、会流血，也容易羞窘。', en: 'I’m just like anyone. I cut and I bleed. And I embarrass easily.' }, // press statement (BBC), 2003
    { zh: '我向来想做影响、启迪每一代人的音乐。谁又甘于速朽？', en: 'I always wanted to do music that influences and inspires each generation. Who wants mortality?' }, // Ebony, 2007
    { zh: '爱，永生不灭。', en: 'Love lives forever.' }, // This Is It, 2009
    { zh: '一切皆因爱……以爱之名，L.O.V.E.', en: 'It’s all for love… With the love, L.O.V.E.' }, // This Is It, 2009
    { zh: '我爱这颗星球，爱那些树……改变，始于我们。', en: 'I love the Planet, I love the trees… It starts with us.' }, // This Is It, 2009 (environment)
    { zh: '我绝不会拒绝给孩子爱。', en: 'I will never deny a child love.' }, // interview, 2003
    { zh: '未与一人促膝长谈，便不要妄断其人。', en: 'Do not judge a person unless you’ve talked to them one-on-one.' }, // Oprah, 1993
    { zh: '我曾极度、蚀骨地孤独。', en: 'I used to be very lonely, painfully lonely.' }, // interview, 2003
    { zh: '我化作歌者与歌……不息起舞，直到唯有舞本身。', en: 'I become the singer and the song… I keep on dancing — until there is only the dance.' }, // Dangerous “The Dance”, 1991
    { zh: '我从梦中醒来，惊呼“快记下来”……我不过是把天赐之乐带进人间的信使。', en: 'I wake up from dreams and go “Wow, put this down on paper”… I’m just a courier bringing it into the world.' }, // Rolling Stone, 1983
    { zh: '不如就说我是从火星来的外星人？他们什么都信。', en: 'Why not just tell people I’m an alien from Mars? They’ll believe anything.' }, // re: Bubbles, 1984
    // —— 歌词（歌曲原句，注明出处）——
    { zh: '治愈世界，让它成为更美好的地方。', en: 'Heal the world, make it a better place.' }, // 《Heal the World》
    { zh: '我先从镜中的自己开始改变。', en: 'I’m starting with the man in the mirror.' }, // 《Man in the Mirror》
    { zh: '我们就是世界，我们就是孩子。', en: 'We are the world, we are the children.' }, // 《We Are The World》
    { zh: '别停，直到你满足为止。', en: 'Don’t stop ’til you get enough.' }, // 《Don’t Stop ’Til You Get Enough》
    { zh: '你并不孤单。', en: 'You are not alone.' }, // 《You Are Not Alone》
    { zh: '无论黑白，都不重要。', en: 'It don’t matter if you’re black or white.' }, // 《Black or White》
    { zh: '比利·琼不是我的爱人。', en: 'Billie Jean is not my lover.' }, // 《Billie Jean》
    { zh: '安妮，你还好吗？', en: 'Annie, are you OK?' }, // 《Smooth Criminal》
    { zh: '他们根本不在乎我们。', en: 'All I wanna say is that they don’t really care about us.' }, // 《They Don’t Care About Us》
    { zh: '做出改变。', en: 'Make that change.' }, // 《Man in the Mirror》
    { zh: '你心深处有处地方，我知道那是爱。', en: 'There’s a place in your heart, and I know that it is love.' }, // 《Heal the World》
    { zh: '若想让世界更好，先审视自己，再做出改变。', en: 'If you wanna make the world a better place, take a look at yourself and then make a change.' }, // 《Man in the Mirror》
    { zh: '我们就是点亮明日的人，所以开始付出吧。', en: 'We are the ones who make a brighter day, so let’s start giving.' }, // 《We Are The World》
    { zh: '持守信念。', en: 'Keep the faith.' } // 《Keep the Faith》
  ];

  // 两页海报 · 正面（主视觉 + 独白 + 语录签名）
  function createPosterFace1(state, endingId) {
    var G = { rgb: '212,175,55', base: '#d4af37', bright: '#f3e2b0', deep: '#c79a2c', dim: '#b9a06a', dim2: '#8a7a4a', cream: '#e8d6a6', common: '#9c8a5a', legendHi: '#fff4cf' };
    var e = MJ.config.endings[endingId] || { name: endingId, tone: '', monologue: '' };
    var eName = T('ending.' + endingId + '.name', null, e.name);
    var eTone = T('ending.' + endingId + '.tone', null, e.tone);
    var eSum = T('ending.' + endingId + '.summary', null, e.summary);
    var eMon = T('ending.' + endingId + '.monologue', null, e.monologue);
    var W = 720, H = 1280, S = 2;
    var cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
    var ctx = cv.getContext('2d'); ctx.scale(S, S); ctx.textBaseline = 'alphabetic';
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#17110a'); bg.addColorStop(0.55, '#0e0b07'); bg.addColorStop(1, '#090705');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var vg = ctx.createRadialGradient(W / 2, 300, 120, W / 2, H / 2, H * 0.75); vg.addColorStop(0, 'rgba(212,175,55,0.10)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = 'rgba(212,175,55,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(34, 34, W - 68, H - 68);
    var _rar = (MJ.config.endingRarity && MJ.config.endingRarity[endingId]) || 'common';
    var _rc = RARITY_COLORS[_rar] || G.deep;
    ctx.textAlign = 'center';
    ctx.fillStyle = G.base; ctx.font = '600 21px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(T('ui.posterHeader', null, 'MICHAEL JACKSON · 人 生 选 择'), W / 2, 78);
    ctx.fillStyle = 'rgba(212,175,55,0.55)'; ctx.font = '14px sans-serif';
    ctx.fillText('1958 — 2009', W / 2, 102);
    ctx.beginPath(); ctx.arc(W / 2, 178, 58, 0, Math.PI * 2); ctx.fillStyle = 'rgba(212,175,55,0.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (_rar === 'epic' || _rar === 'legendary') { ctx.beginPath(); ctx.arc(W / 2, 178, 66, 0, Math.PI * 2); ctx.strokeStyle = _rc; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; }
    function starPath(cx, cy, sp, oR, iR) { var rot = -Math.PI / 2, step = Math.PI / sp; ctx.beginPath(); for (var si = 0; si < sp; si++) { ctx.lineTo(cx + Math.cos(rot) * oR, cy + Math.sin(rot) * oR); rot += step; ctx.lineTo(cx + Math.cos(rot) * iR, cy + Math.sin(rot) * iR); rot += step; } ctx.closePath(); }
    starPath(W / 2, 178, 5, 40, 17);
    if (_rar === 'legendary') { var _sg = ctx.createLinearGradient(W / 2 - 40, 138, W / 2 + 40, 218); _sg.addColorStop(0, G.legendHi); _sg.addColorStop(1, G.deep); ctx.fillStyle = _sg; } else { ctx.fillStyle = _rc; }
    ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = G.bright; ctx.font = '700 44px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText(eName, W / 2, 286);
    ctx.fillStyle = G.deep; ctx.font = 'italic 19px "PingFang SC",sans-serif'; ctx.fillText(eTone, W / 2, 320);
    ctx.textAlign = 'left';
    ctx.fillStyle = G.base; ctx.font = '600 17px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterEndingLabel', null, '结局 · 你的传奇'), 60, 384);
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, 398); ctx.lineTo(W - 60, 398); ctx.stroke();
    var _narr = (eSum ? eSum + '\n' : '') + (eMon || '');
    var _ext = monologueExtFor(state, endingId);
    if (_ext) _narr += '\n' + _ext;
    ctx.fillStyle = G.cream; ctx.font = '15px "PingFang SC",sans-serif';
    var y = wrapParagraph(ctx, _narr, 60, 422, W - 120, 28, H - 158);
    // 尾声：紧跟独白（第二页只承载文案）
    var _tail = epilogueTailFor(state, endingId);
    if (_tail) {
      y += 24; ctx.textAlign = 'left'; ctx.fillStyle = G.base; ctx.font = '600 16px "PingFang SC",sans-serif';
      ctx.fillText(T('ui.posterEpilogue', null, '尾声'), 60, y); y += 14;
      ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); y += 22;
      ctx.fillStyle = G.cream; ctx.font = '14px "PingFang SC",sans-serif';
      y = wrapParagraph(ctx, _tail, 60, y, W - 120, 24, H - 158);
    }
    // 高光时刻：成就叙事化（M11）——尾声后、语录前；空间不足整段跳过
    var _hl = achievementNarrLines(state, endingId);
    if (_hl.length && y + 150 < H - 130) {
      y += 24; ctx.textAlign = 'left'; ctx.fillStyle = G.base; ctx.font = '600 16px "PingFang SC",sans-serif';
      ctx.fillText(T('ui.posterHighlight', null, '高光时刻'), 60, y); y += 14;
      ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); y += 22;
      var _lead = T('ui.achNarrLead', null, '回望这一程，有几枚瞬间格外滚烫——');
      var _tailS = T('ui.achNarrTail', null, '它们不是奖赏，是路标。');
      ctx.fillStyle = G.cream; ctx.font = '15px "PingFang SC",sans-serif';
      y = wrapParagraph(ctx, _lead + '\n' + _hl.join('；') + '。\n' + _tailS, 60, y, W - 120, 26, H - 130);
    }
    ctx.textAlign = 'center';

    function wrapCenter(c, text, maxW) { var isEn = MJ.i18n && MJ.i18n.lang === 'en'; var units = isEn ? text.split(' ') : text.split(''); var lines = [], cur = ''; for (var i = 0; i < units.length; i++) { var u = units[i]; var test = cur ? (isEn ? cur + ' ' + u : cur + u) : u; if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = u; } else cur = test; } if (cur) lines.push(cur); return lines; }
    var _pq = posterQuoteText(state, endingId); // 固定种子：同一海报语录恒定
    ctx.fillStyle = G.base; ctx.font = 'italic 15px "PingFang SC",sans-serif';
    var _ql = wrapCenter(ctx, _pq, W - 120); if (_ql.length > 2) _ql = _ql.slice(0, 2);
    var tagY = Math.min(H - 112, Math.max(H - 130, y + 42));
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2 - 30, tagY - 18); ctx.lineTo(W / 2 + 30, tagY - 18); ctx.stroke();
    for (var _i = 0; _i < _ql.length; _i++) ctx.fillText(_ql[_i], W / 2, tagY + _i * 22);
    var _sy = tagY + _ql.length * 22 + 14;
    ctx.fillStyle = 'rgba(212,175,55,0.5)'; ctx.font = '13px sans-serif'; ctx.fillText(T('ui.posterSigned', null, '月球漫步 · 传奇抉择'), W / 2, _sy);
    ctx.fillStyle = 'rgba(212,175,55,0.42)'; ctx.font = '12px sans-serif'; ctx.fillText(T('ui.credit', null, 'Cr3aM 制作 · MJ Forever'), W / 2, _sy + 20);
    return cv;
  }
  // 两页海报 · 背面（属性快照 + 关键抉择 + 尾声 + 语录签名）
  function createPosterFace2(state, endingId) {
    var G = { rgb: '212,175,55', base: '#d4af37', bright: '#f3e2b0', deep: '#c79a2c', dim: '#b9a06a', dim2: '#8a7a4a', cream: '#e8d6a6', common: '#9c8a5a', legendHi: '#fff4cf' };
    var a = state.attributes;
    var _gw = (state.meta && state.meta.grammyWins) || 0;
    var dm = MJ.dominantMeta(state.meta);
    var metaName = dm ? T('meta.' + dm, null, MJ.config.metaDefs[dm].name) : '—';
    var legend = MJ.legendScore(state);
    var thisRun = (MJ.config.achievements || []).filter(function (ac) { try { return ac.check(state, { ending: endingId }); } catch (err) { return false; } });
    var _reach = MJ.config.achievementReach || {};
    thisRun = thisRun.slice().sort(function (x, y) { return ((_reach[y.id] != null ? _reach[y.id] : 0) - (_reach[x.id] != null ? _reach[x.id] : 0)); });
    var W = 720, H = 1280, S = 2;
    var cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
    var ctx = cv.getContext('2d'); ctx.scale(S, S); ctx.textBaseline = 'alphabetic';
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#17110a'); bg.addColorStop(0.55, '#0e0b07'); bg.addColorStop(1, '#090705');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var vg = ctx.createRadialGradient(W / 2, 300, 120, W / 2, H / 2, H * 0.75); vg.addColorStop(0, 'rgba(212,175,55,0.10)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = 'rgba(212,175,55,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.textAlign = 'center';
    // 顶部 header 与文案页统一（两页一致）
    ctx.fillStyle = G.base; ctx.font = '600 21px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(T('ui.posterHeader', null, 'MICHAEL JACKSON · 人 生 选 择'), W / 2, 78);
    ctx.fillStyle = 'rgba(212,175,55,0.55)'; ctx.font = '14px sans-serif';
    ctx.fillText('1958 — 2009', W / 2, 102);
    // 主视觉与文案页完全同款（大号星徽 + 结局名 + 气质标签），保持两页视觉统一
    var _rar = (MJ.config.endingRarity && MJ.config.endingRarity[endingId]) || 'common';
    var _rc = RARITY_COLORS[_rar] || G.deep;
    ctx.beginPath(); ctx.arc(W / 2, 178, 58, 0, Math.PI * 2); ctx.fillStyle = 'rgba(212,175,55,0.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (_rar === 'epic' || _rar === 'legendary') { ctx.beginPath(); ctx.arc(W / 2, 178, 66, 0, Math.PI * 2); ctx.strokeStyle = _rc; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; }
    function starPath(cx, cy, sp, oR, iR) { var rot = -Math.PI / 2, step = Math.PI / sp; ctx.beginPath(); for (var si = 0; si < sp; si++) { ctx.lineTo(cx + Math.cos(rot) * oR, cy + Math.sin(rot) * oR); rot += step; ctx.lineTo(cx + Math.cos(rot) * iR, cy + Math.sin(rot) * iR); rot += step; } ctx.closePath(); }
    starPath(W / 2, 178, 5, 40, 17);
    if (_rar === 'legendary') { var _sg = ctx.createLinearGradient(W / 2 - 40, 138, W / 2 + 40, 218); _sg.addColorStop(0, G.legendHi); _sg.addColorStop(1, G.deep); ctx.fillStyle = _sg; } else { ctx.fillStyle = _rc; }
    ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1; ctx.stroke();
    var eName = T('ending.' + endingId + '.name', null, (MJ.config.endings[endingId] || {}).name || endingId);
    var eTone = T('ending.' + endingId + '.tone', null, (MJ.config.endings[endingId] || {}).tone || '');
    ctx.fillStyle = G.bright; ctx.font = '700 44px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillText(eName, W / 2, 286);
    ctx.fillStyle = G.deep; ctx.font = 'italic 19px "PingFang SC",sans-serif'; ctx.fillText(eTone, W / 2, 320);
    var dims = [['健康', 'health', a.health], ['声誉', 'reputation', a.reputation], ['艺术', 'art', a.art], ['财富', 'wealth', a.wealth], ['家庭', 'family', a.family], ['压力', 'stress', a.stress]].map(function (d) { return [T('attr.' + d[1], null, d[0]), d[1], d[2]]; });
    var bx0 = 70, colW = (W - 140) / 2, top = 352, rowH = 44, labelW = 82, gutter = 96;
    var barXoff = labelW, barW = colW - labelW - gutter - 10;
    for (var i = 0; i < dims.length; i++) {
      var col = i % 2, row = (i / 2) | 0, x = bx0 + col * colW, y = top + row * rowH, bgx = x + barXoff;
      ctx.textAlign = 'left'; ctx.fillStyle = G.dim; ctx.font = '15px "PingFang SC",sans-serif'; ctx.fillText(dims[i][0], x, y + 15);
      var numStr = String(dims[i][2]);
      if (dims[i][1] === 'reputation' || dims[i][1] === 'art') { var ov = (state.overflow && state.overflow[dims[i][1]]) || 0; if (ov > 0) numStr += ' ★+' + ov; }
      ctx.textAlign = 'right'; ctx.fillStyle = G.bright; ctx.font = '600 15px sans-serif'; ctx.fillText(numStr, x + colW - 10, y + 15);
      var v = Math.max(0, Math.min(100, dims[i][2])) / 100;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, bgx, y + 4, barW, 9, 4); ctx.fill();
      var grad = ctx.createLinearGradient(bgx, 0, bgx + barW, 0); grad.addColorStop(0, G.deep); grad.addColorStop(1, G.bright);
      ctx.fillStyle = grad; roundRect(ctx, bgx, y + 4, Math.max(2, barW * v), 9, 4); ctx.fill();
    }
    var y = top + 3 * rowH + 14;
    ctx.textAlign = 'center';
    var _route = T('ui.metaRoutePrefix', null, '主导路线：') + metaName;
    ctx.textAlign = 'left'; ctx.fillStyle = G.bright; ctx.font = '600 18px "PingFang SC",sans-serif'; ctx.fillText(_route, 60, y);
    var _rw = ctx.measureText(_route).width;
    var _kwTags = []; if (dm) _kwTags.push(T('meta.' + dm, null, MJ.config.metaDefs[dm].name));
    var _kwSorted = dims.slice().sort(function (p, q) { return q[2] - p[2]; }); _kwTags.push(_kwSorted[0][0], _kwSorted[1][0]);
    var _kwStr = T('ui.posterKeywords', null, '人生关键词') + '：' + _kwTags.join(' · ');
    ctx.font = '600 14px "PingFang SC",sans-serif'; var _kwW = ctx.measureText(_kwStr).width;
    var _overlap = (_rw + 40 + _kwW > (W - 120)); ctx.textAlign = _overlap ? 'center' : 'right'; ctx.fillStyle = G.base;
    ctx.fillText(_kwStr, _overlap ? (W / 2) : (W - 60), y); ctx.textAlign = 'center';
    ctx.fillStyle = G.deep; ctx.font = '15px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterLegend', { s: legend.score, g: legend.grade }, '传奇 {s}（{g}）'), W / 2, y + 26);
    y += 54;
    ctx.fillStyle = G.base; ctx.font = '600 15px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.networth', null, '净资产') + '　' + formatMoney(state.netWorth) + '　　🏆 ' + T('ui.posterGrammy', { n: _gw }, '格莱美 {n} 座'), W / 2, y);
    y += 40;
    ctx.fillStyle = G.bright; ctx.font = '600 16px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterAch', { n: thisRun.length }, '本局点亮 {n} 枚成就'), W / 2, y);
    y += 16;
    var perRow = 15, cell = (W - 120) / perRow, ix0 = 60 + cell / 2;
    ctx.font = '26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.textBaseline = 'middle';
    var _cap = Math.min(thisRun.length, 30);
    if (thisRun.length) {
      for (var k = 0; k < _cap; k++) { var c = k % perRow, r = (k / perRow) | 0; ctx.fillStyle = G.bright; try { ctx.fillText(thisRun[k].icon, ix0 + c * cell, y + r * 42 + 18); } catch (err) {} }
      y += (((_cap / perRow) | 0) + (_cap % perRow ? 1 : 0)) * 42 + 18;
      if (thisRun.length > 30) { ctx.fillStyle = G.dim2; ctx.font = '13px sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.fillText(T('ui.posterAchMore', { n: thisRun.length - 30 }, '＋{n} 枚未显示'), W / 2, y); y += 20; }
    } else { ctx.fillStyle = G.dim2; ctx.font = '14px sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.fillText(T('ui.posterNoAch', null, '— 本局暂未点亮成就 —'), W / 2, y + 18); y += 40; }
    ctx.textBaseline = 'alphabetic';
    y += 6; ctx.textAlign = 'left'; ctx.fillStyle = G.base; ctx.font = '600 15px "PingFang SC",sans-serif';
    ctx.fillText(T('ui.posterKeyChoices', null, '关键抉择'), 60, y); y += 12;
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); y += 20;
    var _keys = (state.history || []).filter(function (h) { return h && h.key; });
    if (!_keys.length) { ctx.fillStyle = G.dim2; ctx.font = '13px sans-serif'; ctx.fillText(T('ui.posterNoKey', null, '— 这一程没有惊天岔路 —'), 60, y); y += 22; }
    else {
      _keys.sort(function (p, q) { var wa = p.keyWeight || 1, wb = q.keyWeight || 1; if (wa !== wb) return wb - wa; return (p.year || 0) - (q.year || 0); });
      // 时间线遍历：1958-2026 分段均匀采样（每段取 keyWeight 最高者），两列矩阵呈现
      var _keysAll = _keys.slice().sort(function (p, q) { return (p.year || 0) - (q.year || 0); });
      var _picks = _keysAll;
      var _maxShow = 12;
      if (_keysAll.length > _maxShow) {
        _picks = [];
        for (var s = 0; s < _maxShow; s++) {
          var lo = Math.floor(_keysAll.length * s / _maxShow);
          var hi = Math.max(Math.floor(_keysAll.length * (s + 1) / _maxShow), lo + 1);
          var seg = _keysAll.slice(lo, hi).sort(function (p, q) { var wa = p.keyWeight || 1, wb = q.keyWeight || 1; return wb - wa; });
          if (seg[0]) _picks.push(seg[0]);
        }
        _picks.sort(function (p, q) { return (p.year || 0) - (q.year || 0); });
      }
      var _colGap = 20, _colW = (W - 120 - _colGap) / 2, _rowH = 46, _gy = y;
      for (var _ki = 0; _ki < _picks.length; _ki++) {
        var _kk = _picks[_ki], _kt = _kk.title || '', _kc = _kk.choice || '', _rid = _kk.id || null;
        if (!_rid) { var _rm = buildPosterRevMap(); if (_kt && _rm.title[_kt]) _rid = _rm.title[_kt]; }
        if (_rid) {
          _kt = T('event.' + _rid + '.title', null, _kt); var _ropt = _kk.opt;
          if ((_ropt == null || _ropt < 0) && !_kk.id) { var _rc2 = buildPosterRevMap().choice[_kc]; if (_rc2 && _rc2.id === _rid) _ropt = _rc2.opt; }
          if (_ropt != null && _ropt >= 0) _kc = T('event.' + _rid + '.opt' + _ropt + '.label', null, _kc);
        }
        if (MJ.i18n.lang === 'en') { if (/[一-鿿　-〿＀-￯]/.test(_kt)) _kt = ''; if (/[一-鿿　-〿＀-￯]/.test(_kc)) _kc = '—'; }
        var _c = _ki % 2, _ro = (_ki / 2) | 0, _cx = 60 + _c * (_colW + _colGap), _cy = _gy + _ro * _rowH;
        ctx.font = '600 13px "PingFang SC",sans-serif'; var _head = (_kk.year || '') + ' · ' + _kt;
        if (ctx.measureText(_head).width > _colW) { while (_head.length > 1 && ctx.measureText(_head + '…').width > _colW) _head = _head.slice(0, -1); _head += '…'; }
        ctx.fillStyle = G.bright; ctx.fillText(_head, _cx, _cy);
        ctx.font = '13px "PingFang SC",sans-serif'; var _cc = _kc;
        if (ctx.measureText(_cc).width > _colW) { while (_cc.length > 1 && ctx.measureText(_cc + '…').width > _colW) _cc = _cc.slice(0, -1); _cc += '…'; }
        ctx.fillStyle = G.deep; ctx.fillText(_cc, _cx, _cy + 18);
      }
      y = _gy + Math.ceil(_picks.length / 2) * _rowH;
    }
    // 数据页足迹行：结识 X/6 · 关键抉择 · 命运分岔
    var _metN = 0;
    if (MJ.COLLABORATORS && MJ.isCollaboratorMet) { MJ.COLLABORATORS.forEach(function (c) { if (MJ.isCollaboratorMet(state, c.relKey)) _metN++; }); }
    var _st = state.stats || {};
    ctx.textAlign = 'center'; ctx.fillStyle = G.dim2; ctx.font = '13px sans-serif';
    ctx.fillText(T('ui.posterFootprint', { met: _metN, keys: _st.keyChoices || 0, vars: _st.variants || 0 }, '人生足迹：结识 {met} / 6 · 关键抉择 {keys} 次 · 命运分岔 {vars} 段'), W / 2, y + 40);
    ctx.textAlign = 'center';
    function wrapCenter(c, text, maxW) { var isEn = MJ.i18n && MJ.i18n.lang === 'en'; var units = isEn ? text.split(' ') : text.split(''); var lines = [], cur = ''; for (var i = 0; i < units.length; i++) { var u = units[i]; var test = cur ? (isEn ? cur + ' ' + u : cur + u) : u; if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = u; } else cur = test; } if (cur) lines.push(cur); return lines; }
    var _pq = posterQuoteText(state, endingId); // 固定种子：同一海报语录恒定（与另一页一致）
    ctx.fillStyle = G.base; ctx.font = 'italic 15px "PingFang SC",sans-serif';
    var _qln = wrapCenter(ctx, _pq, W - 120); if (_qln.length > 2) _qln = _qln.slice(0, 2);
    var tagY = Math.min(H - 112, Math.max(H - 130, y + 42));
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2 - 30, tagY - 18); ctx.lineTo(W / 2 + 30, tagY - 18); ctx.stroke();
    for (var _j = 0; _j < _qln.length; _j++) ctx.fillText(_qln[_j], W / 2, tagY + _j * 22);
    var _sy2 = tagY + _qln.length * 22 + 14;
    ctx.fillStyle = 'rgba(212,175,55,0.5)'; ctx.font = '13px sans-serif'; ctx.fillText(T('ui.posterSigned', null, '月球漫步 · 传奇抉择'), W / 2, _sy2);
    ctx.fillStyle = 'rgba(212,175,55,0.42)'; ctx.font = '12px sans-serif'; ctx.fillText(T('ui.credit', null, 'Cr3aM 制作 · MJ Forever'), W / 2, _sy2 + 20);
    return cv;
  }
  // M11 成就叙事化：本局高光成就 → 第一人称叙事句（无模板的成就不进叙事；稀有度+固定序，无随机保恒定）
  var NARR_RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  function achievementNarrLines(state, endingId) {
    var narr = (MJ.config && MJ.config.achievementNarr) || {};
    var reach = MJ.config.achievementReach || {};
    var list = (MJ.config.achievements || []).filter(function (ac) {
      try { return narr[ac.id] && ac.check(state, { ending: endingId }); } catch (e) { return false; }
    });
    list.sort(function (x, y) {
      var rx = NARR_RARITY_ORDER[x.rarity] != null ? NARR_RARITY_ORDER[x.rarity] : 5;
      var ry = NARR_RARITY_ORDER[y.rarity] != null ? NARR_RARITY_ORDER[y.rarity] : 5;
      if (rx !== ry) return rx - ry;
      return ((reach[x.id] != null ? reach[x.id] : 1) - (reach[y.id] != null ? reach[y.id] : 1));
    });
    return list.slice(0, 4).map(function (ac) { return T('achNarr.' + ac.id, null, narr[ac.id]); });
  }
  // 尾声文案：按结局 tone + 可选 flag 取首个命中（epilogueTailTemplates 由 config.js 提供）
  function epilogueTailFor(state, endingId) {
    var tpl = (MJ.config && MJ.config.epilogueTailTemplates) || [];
    var e = MJ.config.endings[endingId] || {};
    var tone = e.tone || '';
    for (var i = 0; i < tpl.length; i++) {
      var t = tpl[i];
      if (t.tone && t.tone !== tone) continue;
      if (t.toneIn && t.toneIn.indexOf(tone) < 0) continue;
      if (t.cond && !t.cond(state, endingId)) continue;
      return T(t.key, null, t.text);
    }
    return '';
  }
  // 海报语录：按「结局+本局规模」固定种子选取——同一海报每次绘制（含翻页/重开弹窗/档案回看）语录恒定
  function posterQuoteText(state, endingId) {
    var st = state.stats || {};
    var seedStr = endingId + '|' + (st.events || 0) + '|' + (state.history || []).length + '|' + (st.variants || 0);
    var h = 0;
    for (var i = 0; i < seedStr.length; i++) h = ((h * 31) + seedStr.charCodeAt(i)) | 0;
    var q = MJ_POSTER_QUOTES[Math.abs(h) % MJ_POSTER_QUOTES.length];
    return (MJ.i18n && MJ.i18n.lang === 'en') ? q.en : q.zh;
  }
  function monologueExtFor(state, endingId) {
    var tpl = (MJ.config && MJ.config.monologueExtTemplates) || [];
    for (var i = 0; i < tpl.length; i++) {
      var t = tpl[i];
      if (t.cond && !t.cond(state)) continue;
      return T(t.key, null, t.text);
    }
    return '';
  }
  function downloadPoster(cv, base) {
    var name = base + '.png';
    // 同步 data: URI 锚点下载，跨平台（含 Android WebView）可靠；
    // 避免 toBlob 在部分设备回调不来 / 抛错导致下载无反应（旧安卓裂图同类问题）
    var a = document.createElement('a');
    a.href = cv.toDataURL('image/png'); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }


  // 传奇海报弹窗：两页可翻（正面=主视觉+独白，背面=属性+关键抉择+尾声）；点击翻页切换
  function openPosterModal(state, id, archiveIdx, prebuilt) {
    var old = document.getElementById('poster-overlay');
    if (old) old.parentNode.removeChild(old);
    var cv1 = prebuilt || createPosterFace2(state, id);
    var cv2 = createPosterFace1(state, id);
    var cur = 1, curCv = cv1;
    var hasDelete = (typeof archiveIdx === 'number');
    var overlay = document.createElement('div');
    overlay.id = 'poster-overlay';
    overlay.className = 'overlay poster-modal';
    overlay.innerHTML = '<div class="poster-frame">' +
      '<div class="poster-canvas-wrap"></div>' +
      '<div class="poster-flip">' +
        '<button class="btn ghost" id="pm-prev">◀ ' + T('ui.posterPrev', null, '上一页') + '</button>' +
        '<span class="poster-page" id="pm-page">' + T('ui.posterPage', { n: 1 }, '第 {n} 页 / 2') + '</span>' +
        '<button class="btn ghost" id="pm-next">' + T('ui.posterNext', null, '下一页 ▶') + '</button>' +
      '</div>' +
      '<div class="poster-foot">' +
        '<p class="poster-hint">' + T('ui.posterFlipHint', null, '提示：点「下一页」翻看传奇独白与尾声；长按图片可保存') + '</p>' +
        '<div class="poster-foot-actions' + (hasDelete ? ' has-delete' : '') + '">' +
          (hasDelete ? '<button class="btn danger" id="pm-delete">' + T('ui.archiveDelete', null, '删除档案') + '</button>' : '') +
          '<button class="btn primary" id="pm-save">' + T('ui.posterSave', null, '保存图片') + '</button>' +
          '<button class="btn primary" id="pm-close">' + T('ui.close', null, '关闭 ✕') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
    var _img = document.createElement('img');
    function showFace(f) {
      cur = f; curCv = (f === 2) ? cv2 : cv1;
      _img.src = curCv.toDataURL('image/png');
      var pv = document.getElementById('pm-prev'), nx = document.getElementById('pm-next'), pg = document.getElementById('pm-page');
      if (pv) pv.style.visibility = (f === 1) ? 'hidden' : 'visible';
      if (nx) nx.style.visibility = (f === 2) ? 'hidden' : 'visible';
      if (pg) pg.textContent = T('ui.posterPage', { n: f }, '第 {n} 页 / 2');
    }
    _img.alt = T('ui.posterOfTag', null, '传奇海报');
    _img.className = 'poster-img';
    _img.title = T('ui.zoomHint', null, '点击放大海报');
    overlay.querySelector('.poster-canvas-wrap').appendChild(_img);
    document.body.appendChild(overlay);
    ui._activeModal = { id: 'poster-overlay', open: function () { openPosterModal(state, id, archiveIdx); } };
    overlay.addEventListener('click', function (evt) { if (evt.target === overlay) closePosterModal(); });
    document.getElementById('pm-close').addEventListener('click', closePosterModal);
    var pv = document.getElementById('pm-prev'); if (pv) pv.addEventListener('click', function () { showFace(1); });
    var nx = document.getElementById('pm-next'); if (nx) nx.addEventListener('click', function () { showFace(2); });
    var _saveBtn = document.getElementById('pm-save');
    if (_saveBtn) _saveBtn.addEventListener('click', function () { downloadPoster(curCv, 'MJ-' + id + '-p' + cur); });
    if (hasDelete) {
      // 二次确认（再次点击确认 + 3 秒超时复位），删除后回到档案库列表
      wireReset('pm-delete', function () {
        MJ.saveSystem.removeArchive(archiveIdx);
        closePosterModal();
      }, function () { archiveModal(); });
    }
    showFace(1);
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
          '<p><b>' + T('ui.howtoLabel', null, '玩法') + '</b>：' + T('ui.introHowto', null, '你扮演迈克尔·杰克逊，在真实历史的关键节点做选择。每一个决定都会改变你的健康、声誉、财富、家庭、艺术与压力，并导向 30 种不同的人生结局。') + '</p>' +
        '</div>' +
        '<div class="btn-row">' +
          (hasSave ? '<button class="btn primary" id="btn-continue">' + T('ui.continue', null, '继续游戏') + '</button>' : '') +
          '<button class="btn ' + (hasSave ? 'ghost' : 'primary') + '" id="btn-new">' + T('ui.newGame', null, '开始新人生') + '</button>' +
        '</div>' +
        '<div class="menu-grid">' +
          '<button class="btn block" id="btn-gallery">📖 ' + T('ui.gallery', null, '结局图鉴') + ' <span class="m-cnt" data-cnt="gallery">' + galleryCount() + '</span></button>' +
          '<button class="btn block" id="btn-ach">🏆 ' + T('ui.achievements', null, '成就') + ' <span class="m-cnt" data-cnt="ach">' + achCount() + '</span></button>' +
          '<button class="btn block" id="btn-egg">🥚 ' + T('ui.eggCodex', null, '彩蛋图鉴') + ' <span class="m-cnt" data-cnt="egg">' + eggCount() + '</span></button>' +
          '<button class="btn block" id="btn-trivia">📝 ' + T('ui.triviaCodex', null, '趣事图鉴') + ' <span class="m-cnt" data-cnt="trivia">' + triviaCount() + '</span></button>' +
          '<button class="btn block" id="btn-archive">🗂️ ' + T('ui.archive', null, '人生档案库') + ' <span class="m-cnt" data-cnt="archive">' + archiveCount() + '</span></button>' +
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

  // §17.14 格莱美揭晓面板：列出本届具体获奖（参考 docs/mjwiki 各颁奖页），并标注 MJ 真实生涯总数作对照
  function grammyAwardPanel(state, key) {
    if (!state || !state.flags) return '';
    var gw = state.flags['grammy_' + key] || 0;
    var cats = state.flags['grammyCats_' + key] || [];
    var tr = (MJ && MJ.t) ? MJ.t : (typeof T !== 'undefined' ? T : function (k, _, fb) { return fb || ''; });
    var real = (MJ && MJ.GRAMMY_REAL_TOTAL) ? MJ.GRAMMY_REAL_TOTAL : 13;
    var html = '<div class="grammy-awards">';
    if (gw > 0 && cats.length) {
      html += '<div class="ga-head">🏆 ' + tr('ui.grammyAwards', null, '本届格莱美') + ' · ' + gw + ' ' + tr('ui.trophyCount', null, '座') + '</div>';
      html += '<ul class="ga-list">';
      for (var i = 0; i < cats.length; i++) {
        var x = cats[i];
        html += '<li><b>' + tr('grammy.' + x.c, null, x.zh) + '</b> 《' + x.w + '》</li>';
      }
      html += '</ul>';
    } else {
      html += '<div class="ga-head ga-none">🏆 ' + tr('ui.grammyAwards', null, '本届格莱美') + ' · ' + tr('ui.grammyNone', null, '一无所获') + '</div>';
    }
    html += '<div class="ga-foot">' + tr('ui.grammyRealTotal', null, '现实中的 MJ 生涯共获 ' + real + ' 座格莱美') + '</div>';
    var total = (state.meta && state.meta.grammyWins) || 0;
    if (total >= real) {
      var note = (total === real)
        ? tr('ui.grammyMatchedReal', null, '🏆 你恰好追平了现实中的 MJ：生涯 ' + real + ' 座格莱美')
        : tr('ui.grammyBeyondReal', null, '🏆 你已超越现实中的 MJ（生涯 ' + real + ' 座格莱美）');
      html += '<div class="ga-real-note">' + note + '</div>';
    }
    html += '</div>';
    return html;
  }

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
        '<div class="yr">' + (MJ.eventYear(ev) || '') + T('ui.yearSuffix', null, ' 年') + (ev.key ? ' <span class="pill pill-gold pill-xs">' + T('ui.keyChoicePill', null, '关键抉择') + '</span>' : '') + '</div>' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        '<div class="body">' + escapeHtml(text) + '</div>';
    if (ev.keyNote) {
      var _kn = (typeof ev.keyNote === 'function') ? ev.keyNote(state) : ev.keyNote;
      body += '<div class="key-note"><span class="kn-tag">' + T('ui.keyNoteTag', null, '为什么关键') + '</span>' + escapeHtml(_kn) + '</div>';
    }

    if (ev.grammyReveal) body += grammyAwardPanel(state, ev.grammyReveal);

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
    var bc = $('#btn-collab'); if (bc) bc.addEventListener('click', function () { collaboratorsModal(state); });
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
    var bc2 = $('#btn-collab'); if (bc2) bc2.addEventListener('click', function () { collaboratorsModal(state); });
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
        '<div class="ed-tags">' +
          (e.assumption ? '<span class="pill pill-violet">✦ ' + T('ui.assumptionLine', null, '假设线') + '</span>' : '') +
          (e.tone ? '<span class="pill pill-gold">' + escapeHtml(T('ending.' + id + '.tone', null, e.tone)) + '</span>' : '') +
          '<span class="pill ' + rarityClass((MJ.config.endingRarity && MJ.config.endingRarity[id]) || 'common') + '">★ ' + rarityLabel((MJ.config.endingRarity && MJ.config.endingRarity[id]) || 'common') + '</span>' +
        '</div>' +
        '<div class="desc">' + escapeHtml(T('ending.' + id + '.summary', null, e.summary)) + '</div>' +
        '<div class="poster-section">' +
          '<div class="poster-box" id="poster-box"></div>' +
'<p class="poster-hint">' + T('ui.posterSaveHint', null, '提示：长按海报图片即可保存到本地') + '</p>' +
        '</div>' +
        '<div class="btn-row"><button class="btn primary" id="btn-restart">' + T('ui.restart', null, '重新开始') + '</button></div>' +
      '</div>' +
      '<div class="menu-grid">' +
        '<button class="btn block" id="btn-gallery-end">📖 ' + T('ui.gallery', null, '结局图鉴') + ' <span class="m-cnt" data-cnt="gallery">' + galleryCount() + '</span></button>' +
        '<button class="btn block" id="btn-ach-end">🏆 ' + T('ui.achievements', null, '成就') + ' <span class="m-cnt" data-cnt="ach">' + achCount() + '</span></button>' +
        '<button class="btn block" id="btn-egg-end">🥚 ' + T('ui.eggCodex', null, '彩蛋图鉴') + ' <span class="m-cnt" data-cnt="egg">' + eggCount() + '</span></button>' +
        '<button class="btn block" id="btn-trivia-end">📝 ' + T('ui.triviaCodex', null, '趣事图鉴') + ' <span class="m-cnt" data-cnt="trivia">' + triviaCount() + '</span></button>' +
        '<button class="btn block" id="btn-lang-end">🌐 ' + T('ui.langBtn', null, '语言') + '</button>' +
      '</div>' +
      '<div class="review-grid">' +
      subDimPanel(state) +
      keyReviewPanel(state) +
      diaryPanel(state) +
      vignettePanel(state) +
      echoesPanel(state) +
      fateEchoPanel(state) +
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
    var posterCanvas = createPosterFace2(state, id);
    var pbox = document.getElementById('poster-box');
    if (pbox) {
      // U3#8 键盘可达：缩略图改 button 包裹（Enter/Space 原生触发）
      var zoom = document.createElement('button');
      zoom.type = 'button'; zoom.className = 'poster-thumb-btn';
      zoom.title = T('ui.zoomHint', null, '点击放大海报');
      zoom.setAttribute('aria-label', T('ui.zoomHint', null, '点击放大海报'));
      var thumb = document.createElement('img');
      thumb.src = posterCanvas.toDataURL('image/png');
      thumb.alt = T('ui.posterOfTag', null, '传奇海报');
      thumb.className = 'poster-thumb';
      zoom.appendChild(thumb);
      zoom.addEventListener('click', function () { openPosterModal(state, id); });
      pbox.appendChild(zoom);
    }
    // 不再自动弹海报；用户点缩略图自行打开（两页可翻）
    var bge = $('#btn-gallery-end'); if (bge) bge.addEventListener('click', galleryModal);
    var bae = $('#btn-ach-end'); if (bae) bae.addEventListener('click', achievementsModal);
    var bee = $('#btn-egg-end'); if (bee) bee.addEventListener('click', eggModal);
    var bte = $('#btn-trivia-end'); if (bte) bte.addEventListener('click', triviaModal);
    var ble = $('#btn-lang-end'); if (ble) ble.addEventListener('click', openLangModal);
    var bc = $('#btn-collab'); if (bc) bc.addEventListener('click', function () { collaboratorsModal(state); });
    _view = function () { ui.showEnding(id, state); };
    setKeyHandler(function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var r = $('#btn-restart'); if (r) r.click(); }
    });
    window.scrollTo(0, 0);
  };

  function fateEchoPanel(state) {
    var rel = (state && state.relations) || {};
    var items = Object.keys(rel).map(function (k) { return { k: k, v: rel[k] }; })
      .filter(function (o) { return Math.abs(o.v) >= 15 && (!MJ.isCollaboratorMet || MJ.isCollaboratorMet(state, o.k)); })
      .sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); });
    var defs = (MJ.config && MJ.config.relationsDefs) || [];
    var byKey = {}; defs.forEach(function (d) { byKey[d.key] = d; });
    var inner = '<details class="panel history fate-echo" open><summary>' + T('ui.fateEchoTitle', null, '命运回响') + ' <span class="cnt">(' + items.length + ')</span></summary><div class="fate-list">';
    if (!items.length) {
      inner += '<div class="empty">' + T('ui.fateEchoEmpty', null, '这一程，你更多独自走过。') + '</div>';
    } else {
      items.forEach(function (o) {
        var def = byKey[o.k] || {};
        var name = T('rel.' + o.k, null, def.name || o.k);
        var sign = o.v > 0 ? '+' : '';
        var cls = o.v >= 20 ? 'warm' : (o.v <= -10 ? 'cold' : 'neutral');
        var note = T('fate.' + o.k + '.note', null,
          o.v >= 40 ? T('ui.fateHigh', null, '你们情谊深厚，是你最坚实的臂膀之一。') :
          (o.v >= 20 ? T('ui.fateMid', null, '你们彼此信任，在关键时刻总能互相托底。') :
          (o.v <= -15 ? T('ui.fateLow', null, '你们之间有过裂痕，但那段交集仍留在故事里。') : '')));
        inner += '<div class="fate-item ' + cls + '"><span class="fate-ico">' + (def.icon || '🔗') + '</span>' +
          '<div class="fate-body"><b>' + escapeHtml(name) + '</b> <span class="fate-val">' + sign + o.v + '</span>' +
          '<p>' + escapeHtml(note) + '</p></div></div>';
      });
    }
    inner += '</div></details>';
    return inner;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  MJ.ui = ui;
})();
