/* ui.js — 视图与用户流程（四区布局 + 响应式 + 新手引导）
 * 渲染：引导 → 状态栏(属性/净资产/元路线) → 事件卡 → 选项/继续 → 结局。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  var ui = {};
  var app;

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
    if (a >= 10000) return sign + (a / 10000).toFixed(2) + ' 亿';
    return sign + a + ' 万';
  }

  function attrBars(state) {
    var names = MJ.config.attrNames;
    var keys = ['health', 'reputation', 'wealth', 'family', 'art', 'stress'];
    var html = '<div class="bars">';
    keys.forEach(function (k) {
      var val = state.attributes[k] || 0;
      html += '<div class="bar">' +
        '<div class="lab"><span>' + names[k] + '</span><b>' + val + '</b></div>' +
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
      html += '<span class="' + cls + '">' + defs[k].icon + ' ' + defs[k].name + ' ×' + n + '</span>';
    });
    html += '</div>';
    return html;
  }

  function historyPanel(state) {
    var h = state.history || [];
    var inner = '<details class="panel history">' +
      '<summary>人生轨迹 <span class="cnt">(' + h.length + ')</span></summary>' +
      '<div class="timeline">';
    if (h.length === 0) {
      inner += '<div class="empty">尚未做出选择，传奇正在书写…</div>';
    } else {
      h.forEach(function (e) {
        inner += '<div class="step"><span class="yr">' + (e.year != null ? e.year : '—') + '</span>' +
          '<span class="t">' + escapeHtml(e.title) + '</span>' +
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
        '<span class="title">迈克尔·杰克逊：人生选择</span>' +
        '<span><span class="year">' + yearTxt + '</span> &nbsp; <span class="' + debtCls + '">净资产 ' + formatMoney(net) + '</span></span>' +
      '</div>' +
      attrBars(state) +
      metaHints(state) +
      '</div>';
  }

  ui.init = function () {
    app = document.getElementById('app');
    var save = MJ.saveSystem.load();
    ui.showIntro(!!save);
  };

  function galleryHtml() {
    var g = MJ.saveSystem.getGallery();
    var defs = MJ.config.endings;
    var total = Object.keys(defs).length;
    var got = Object.keys(g).length;
    var html = '<div class="panel gallery">' +
      '<div class="g-head">结局图鉴 <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="g-grid">';
    Object.keys(defs).forEach(function (k) {
      var e = defs[k];
      var on = !!g[k];
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + '" title="' + (on ? e.name : '未解锁') + '">' +
        '<div class="g-icon">' + (on ? e.icon : '❓') + '</div>' +
        '<div class="g-name">' + (on ? e.name : '？？？') + '</div>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
  }

  ui.showIntro = function (hasSave) {
    var html =
      '<div class="panel intro">' +
        '<h1>迈克尔·杰克逊：人生选择</h1>' +
        '<p class="sub">Michael Jackson: Life Choices</p>' +
        '<div class="how">' +
          '<p><b>玩法</b>：你扮演迈克尔·杰克逊，在真实历史的关键节点做选择。每一个决定都会改变你的健康、声誉、财富、家庭、艺术与压力，并导向 12 种不同的人生结局。</p>' +
          '<p><b>机制</b>：多数事件为三选一，选项后的 <b>hint</b> 提示大概后果但不剧透全局；部分事件仅在满足前置条件时出现；隐藏的「元路线」（艺术家/慈善家/商业巨擘/隐士）会随选择累积，影响专属走向。</p>' +
          '<p><b>原则</b>：只呈现后果，不评判选择。法律相关事件以中性、程序化的方式叙述。</p>' +
        '</div>' +
        galleryHtml() +
        '<div class="btn-row">' +
          (hasSave ? '<button class="btn primary" id="btn-continue">继续游戏</button>' : '') +
          '<button class="btn ' + (hasSave ? 'ghost' : 'primary') + '" id="btn-new">开始新人生</button>' +
        '</div>' +
      '</div>';
    app.innerHTML = html;
    if (hasSave) $('#btn-continue').addEventListener('click', function () {
      MJ.engine.resume(MJ.saveSystem.load());
    });
    $('#btn-new').addEventListener('click', function () {
      if (hasSave && !window.confirm('将覆盖当前存档并开始新人生，确定吗？')) return;
      MJ.saveSystem.clear();
      MJ.engine.start();
    });
  };

  ui.showEvent = function (ev, state) {
    var text = (typeof ev.text === 'function') ? ev.text(state) : ev.text;
    var epilogueHtml = '';
    if (MJ.engine.pendingEpilogue) {
      epilogueHtml = '<div class="epilogue"><span class="e-tag">抉择的回响</span>' + escapeHtml(MJ.engine.pendingEpilogue) + '</div>';
      MJ.engine.pendingEpilogue = null;
    }
    var body =
      '<div class="panel event">' + epilogueHtml +
        '<div class="yr">' + (MJ.eventYear(ev) || '') + ' 年</div>' +
        '<h2>' + ev.title + '</h2>' +
        '<div class="body">' + escapeHtml(text) + '</div>';

    if (ev.kind === 'auto') {
      body += '<div class="continue-row"><button class="btn primary" id="btn-next">继续</button></div>';
    } else if (ev.kind === 'ending') {
      body += '<div class="continue-row"><button class="btn primary" id="btn-end">尘埃落定</button></div>';
    } else {
      var opts = MJ.engine.optionsOf(ev);
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
    window.scrollTo(0, 0);
  };

  ui.showEnding = function (id, state) {
    var e = MJ.config.endings[id] || { name: id, icon: '🌟', tone: '', summary: '' };
    var snap = '<div class="snapshot">';
    var names = MJ.config.attrNames;
    ['health', 'reputation', 'wealth', 'family', 'art', 'stress'].forEach(function (k) {
      snap += '<div class="s">' + names[k] + '：<b>' + (state.attributes[k] || 0) + '</b></div>';
    });
    snap += '<div class="s">净资产：<b>' + formatMoney(state.netWorth) + '</b></div>';
    var dm = MJ.dominantMeta(state.meta);
    snap += '<div class="s">主导路线：<b>' + (dm ? MJ.config.metaDefs[dm].name : '—') + '</b></div>';
    snap += '</div>';

    var html =
      statusBar(state, { year: 2009 }) +
      '<div class="panel ending">' +
        '<div class="icon">' + e.icon + '</div>' +
        '<h2>' + e.name + '</h2>' +
        '<p class="tone">' + e.tone + '</p>' +
        '<div class="desc">' + escapeHtml(e.summary) + '</div>' +
        (e.monologue ? '<div class="mono">' + escapeHtml(e.monologue) + '</div>' : '') +
        snap +
        '<div class="btn-row"><button class="btn primary" id="btn-restart">重新开始</button></div>' +
      '</div>' +
      historyPanel(state) +
      '<div class="foot">你的每一个选择，写就了独一无二的传奇。</div>';
    app.innerHTML = html;
    $('#btn-restart').addEventListener('click', function () {
      MJ.saveSystem.clear();
      ui.showIntro(false);
    });
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
