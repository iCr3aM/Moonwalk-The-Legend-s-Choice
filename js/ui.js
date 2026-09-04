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

  function historyPanel(state) {
    var h = chronoSteps(state.history || []);
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

  // 关键抉择回顾：仅汇总被标记为关键节点的选择/经历（复用 history 数据）
  function keyReviewPanel(state) {
    var h = state.history || [];
    var keys = h.filter(function (e) { return e.key; });
    var inner = '<details class="panel history kreview" open>' +
      '<summary>关键抉择回顾 <span class="cnt">(' + keys.length + ')</span></summary>' +
      '<div class="timeline">';
    if (keys.length === 0) {
      inner += '<div class="empty">这一程没有惊心动魄的岔路，平凡本身也是一种答案。</div>';
    } else {
      chronoSteps(keys).forEach(function (e) {
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
      softBars(state) +
      metaHints(state) +
      metaTendency(state) +
      relationsPanel(state) +
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
    var rank = MJ.config.rarityRank || {};
    var keys = Object.keys(defs).sort(function (a, b) {
      return (rank[defs[a].rarity] || 0) - (rank[defs[b].rarity] || 0);
    });
    var total = keys.length;
    var got = keys.filter(function (k) { return g[k]; }).length;
    var html = '<div class="panel gallery">' +
      '<div class="g-head">结局图鉴 <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="g-grid">';
    keys.forEach(function (k) {
      var e = defs[k];
      var on = !!g[k];
      html += '<div class="g-cell ' + (on ? 'on' : 'off') + (e.hidden && !on ? ' locked-hidden' : '') + '" title="' + (on ? e.name : '未解锁') + '">' +
        '<div class="g-icon">' + (on ? e.icon : '❓') + '</div>' +
        '<div class="g-name">' + (on ? e.name : '？？？') + '</div>' +
        '<div class="g-rarity">' + rarityLabel(e.rarity) + '</div>' +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function achievementsPanel(state) {
    var list = MJ.achievementSystem.all();
    var rank = MJ.config.rarityRank || {};
    list = list.slice().sort(function (a, b) {
      return (rank[a.rarity] || 0) - (rank[b.rarity] || 0);
    });
    var got = list.filter(function (a) { return a.unlocked; }).length;
    var total = list.length;
    var html = '<div class="panel ach-panel">' +
      '<div class="g-head">成就 <span class="g-prog">' + got + ' / ' + total + '</span></div>' +
      '<div class="ach-grid">';
    list.forEach(function (a) {
      var on = a.unlocked;
      html += '<div class="ach-cell ' + (on ? 'on' : 'off') + '" title="' + (on ? escapeHtml(a.name + '：' + a.desc) : '未解锁') + '">' +
        '<div class="ach-icon">' + (on ? a.icon : '🔒') + '</div>' +
        '<div class="ach-name">' + (on ? a.name : '？？？') + '</div>' +
        '<div class="ach-rarity">' + rarityLabel(a.rarity) + '</div>' +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }

  // ---------- 图鉴 / 成就 弹窗（主菜单各收为一个按钮；含多次确认重置） ----------
  function rarityLabel(r) {
    return ({ common: '普通', rare: '稀有', epic: '史诗', legendary: '传奇' })[r] || '普通';
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
        btn.textContent = '再次点击确认（不可逆）';
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
      '<div class="modal-head"><span>📖 结局图鉴</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="gallery-reset">重置图鉴</button>' +
      '<button class="btn ghost small" id="gallery-close">关闭 ✕</button></div>' +
      '<div class="modal-body"></div></div>';
    overlay.querySelector('.modal-body').innerHTML = galleryHtml();
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('gallery-overlay'); });
    document.getElementById('gallery-close').addEventListener('click', function () { closeOverlay('gallery-overlay'); });
    wireReset('gallery-reset', function () { MJ.saveSystem.clearGallery(); }, function () {
      closeOverlay('gallery-overlay'); galleryModal();
    });
  }
  function achievementsModal() {
    closeOverlay('ach-overlay');
    var overlay = document.createElement('div');
    overlay.id = 'ach-overlay';
    overlay.className = 'overlay modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-head"><span>🏆 成就</span><span class="spacer"></span>' +
      '<button class="btn ghost small" id="ach-reset">重置成就</button>' +
      '<button class="btn ghost small" id="ach-close">关闭 ✕</button></div>' +
      '<div class="modal-body"></div></div>';
    overlay.querySelector('.modal-body').innerHTML = achievementsPanel();
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay('ach-overlay'); });
    document.getElementById('ach-close').addEventListener('click', function () { closeOverlay('ach-overlay'); });
    wireReset('ach-reset', function () { MJ.achievementSystem.clear(); }, function () {
      closeOverlay('ach-overlay'); achievementsModal();
    });
  }

  // 成就解锁即时弹窗（追加到 body，避免被 #app 重渲染清除）
  function toastAchievement(a) {
    var t = document.createElement('div');
    t.className = 'ach-toast';
    t.innerHTML = '<div class="at-icon">' + a.icon + '</div>' +
      '<div class="at-body"><div class="at-title">成就解锁 · ' + escapeHtml(a.name) + '</div>' +
      '<div class="at-desc">' + escapeHtml(a.desc) + '</div></div>';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 20);
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 3600);
  }

  // 元路线倾向提示（GDD §9）：状态栏下方提示玩家“正在走向”哪条路
  function metaTendency(state) {
    var dom = MJ.dominantMeta(state.meta);
    if (!dom) return '';
    return '<div class="tend">正在走向：<b>' + MJ.config.metaDefs[dom].name + '</b> 之路</div>';
  }

  // M5/M6 体验轴次条：媒体关系 / 孤独（与核心六维分离展示）
  function softBars(state) {
    var keys = ['media', 'loneliness'];
    var html = '<div class="bars soft">';
    keys.forEach(function (k) {
      var val = state.attributes[k] || 0;
      html += '<div class="bar"><div class="lab"><span>' + MJ.config.attrNames[k] + '</span><b>' + val + '</b></div>' +
        '<div class="track"><div class="fill ' + k + '" style="width:' + val + '%"></div></div></div>';
    });
    html += '</div>';
    return html;
  }

  // M1 关系/羁绊面板：具名 NPC 好感（-100..100）
  function relationsPanel(state) {
    var defs = MJ.config.relationsDefs || [];
    var rel = state.relations || {};
    var html = '<div class="rel-panel"><div class="rel-head">羁绊</div><div class="rel-grid">';
    defs.forEach(function (d) {
      var v = rel[d.key] || 0;
      var cls = v >= 20 ? 'warm' : (v <= -10 ? 'cold' : 'neutral');
      var sign = v > 0 ? '+' : '';
      html += '<div class="rel-cell ' + cls + '" title="' + escapeHtml(d.name) + '：' + (v > 0 ? '亲近' : v < 0 ? '疏远' : '平淡') + '（' + sign + v + '）">' +
        '<span class="rel-ico">' + d.icon + '</span><span class="rel-name">' + escapeHtml(d.name) + '</span>' +
        '<span class="rel-val">' + sign + v + '</span></div>';
    });
    html += '</div></div>';
    return html;
  }

  // M2 人生手记汇总（结局页）
  function diaryPanel(state) {
    var d = state.diary || [];
    var inner = '<details class="panel history diary" open><summary>人生手记 <span class="cnt">(' + d.length + ')</span></summary><div class="diary-list">';
    if (!d.length) inner += '<div class="empty">这一程尚未留下手记。</div>';
    else d.forEach(function (e) {
      inner += '<div class="diary-item"><b>' + escapeHtml(e.title) + '</b><p>' + escapeHtml(e.text) + '</p></div>';
    });
    inner += '</div></details>';
    return inner;
  }

  // M4 命运回响汇总（结局页）
  function echoesPanel(state) {
    var d = state.echoes || [];
    var inner = '<details class="panel history echoes"><summary>命运回响 <span class="cnt">(' + d.length + ')</span></summary><div class="echo-list">';
    if (!d.length) inner += '<div class="empty">每一个选择都安分地落在了它该在的地方。</div>';
    else d.forEach(function (t) { inner += '<div class="echo-item">' + escapeHtml(t) + '</div>'; });
    inner += '</div></details>';
    return inner;
  }

  // ---------- 环境音（GDD §10：原创/公共领域 BGM，轻量 WebAudio 氛围垫，默认关闭） ----------
  var audio = (function () {
    var ctx = null, master = null, nodes = [], on = false;
    function ensure() {
      if (ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        return true;
      } catch (e) { return false; }
    }
    function build() {
      var freqs = [146.83, 220.0, 277.18]; // D3 A3 C#4 柔和大三和弦
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620; lp.connect(master);
      freqs.forEach(function (f, i) {
        var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        var g = ctx.createGain(); g.gain.value = 0.16 / (i + 1);
        var lfo = ctx.createOscillator(); lfo.frequency.value = 0.06 + i * 0.03;
        var lg = ctx.createGain(); lg.gain.value = 2.5; lfo.connect(lg); lg.connect(o.detune); lfo.start();
        o.connect(g); g.connect(lp); o.start();
        nodes.push(o, lfo);
      });
    }
    function start() {
      if (!ensure()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      if (!nodes.length) build();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);
      on = true; return true;
    }
    function stop() {
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      on = false;
    }
    return {
      toggle: function () { if (on) { stop(); return false; } return start(); },
      isOn: function () { return on; }
    };
  })();
  MJ.audio = audio;

  // ---------- 社交分享（GDD §17） ----------
  function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function buildEndingShareText(state, endingId) {
    var e = MJ.config.endings[endingId] || { name: endingId, tone: '', icon: '🌟' };
    var a = state.attributes;
    var dm = MJ.dominantMeta(state.meta);
    var metaName = dm ? MJ.config.metaDefs[dm].name : '—';
    var legend = MJ.legendScore(state);
    var all = MJ.achievementSystem.all();
    var ach = all.filter(function (x) { return x.unlocked; }).length;
    var st = state.stats || { variants: 0, keyChoices: 0 };
    return [
      '我在《迈克尔·杰克逊：人生选择》中，走完了属于自己的传奇一生：',
      '',
      e.icon + ' ' + e.name + '（' + e.tone + '）',
      '健康 ' + a.health + ' · 声誉 ' + a.reputation + ' · 艺术 ' + a.art + ' · 财富 ' + a.wealth + ' · 家庭 ' + a.family + ' · 压力 ' + a.stress,
      '主导路线：' + metaName + '　传奇评分 ' + legend.score + '（评级 ' + legend.grade + '）',
      '触发变体 ' + st.variants + ' 次　关键抉择 ' + st.keyChoices + ' 个',
      '解锁成就 ' + ach + '/' + all.length,
      '',
      '每个人都是自己人生的词曲作者——来写下你的版本。'
    ].join('\n');
  }
  function buildGameShareText() {
    return [
      '《迈克尔·杰克逊：人生选择》——一款文字人生模拟游戏。',
      '从盖瑞的摇篮到全世界的舞台，在每一个真实的历史岔路口做选择，',
      '导向 12 种截然不同的人生结局。你，会走出怎样的传奇？',
      '',
      '（纯网页，双击即玩；含 28+ 变体事件、11 项成就、关键抉择回顾。）'
    ].join('\n');
  }
  function flashBtn(btn, txt) { if (!btn) return; var o = btn.textContent; btn.textContent = txt; setTimeout(function () { btn.textContent = o; }, 1500); }
  function legacyCopy(text, ok, fail) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      var done = document.execCommand('copy');
      document.body.removeChild(ta);
      done ? ok() : fail();
    } catch (e) { fail(); }
  }
  function copyText(text, btn) {
    function ok() { flashBtn(btn, '已复制 ✓'); }
    function fail() { flashBtn(btn, '请手动复制'); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, function () { legacyCopy(text, ok, fail); });
      } else legacyCopy(text, ok, fail);
    } catch (e) { legacyCopy(text, ok, fail); }
  }
  function openShare(title, summary) {
    var old = document.getElementById('share-overlay');
    if (old) old.parentNode.removeChild(old);
    var isFile = location.href.indexOf('file:') === 0;
    var url = isFile ? '' : location.href;
    var full = summary + (url ? '\n' + url : '');
    var encoded = encodeURIComponent(full);
    var overlay = document.createElement('div');
    overlay.id = 'share-overlay';
    overlay.className = 'overlay';
    var html = '<div class="share-card">' +
      '<div class="sc-head">' + escapeHtml(title) + '</div>' +
      '<textarea class="sc-text" id="share-text" readonly>' + escapeText(summary) + '</textarea>' +
      '<div class="sc-actions">' +
        '<button class="btn" id="share-copy">复制文案</button>' +
        (navigator.share ? '<button class="btn primary" id="share-native">系统分享…</button>' : '') +
        '<button class="btn ghost" id="share-close">关闭</button>' +
      '</div>' +
      '<div class="sc-links">' +
        (url ? '<a class="sc-link" target="_blank" rel="noopener" href="https://service.weibo.com/share/share.php?title=' + encoded + '">微博</a>' : '') +
        (url ? '<a class="sc-link" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + encoded + '">X / Twitter</a>' : '') +
      '</div>' +
      '<div class="sc-tip">复制文案或点「系统分享」后，可粘贴到任意社交平台' + (url ? '；也可直接分享本页链接。' : '（本地文件无链接，可手动分享游戏地址）。') + '</div>' +
      '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.parentNode.removeChild(overlay); });
    document.getElementById('share-close').addEventListener('click', function () { overlay.parentNode.removeChild(overlay); });
    document.getElementById('share-copy').addEventListener('click', function () { copyText(full, this); });
    if (navigator.share) {
      document.getElementById('share-native').addEventListener('click', function () {
        var data = { title: '迈克尔·杰克逊：人生选择', text: summary };
        if (url) data.url = url;
        if (navigator.canShare && !navigator.canShare(data)) { /* 仍尝试分享 */ }
        navigator.share(data).catch(function () {});
      });
    }
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
  function createPoster(state, endingId) {
    var e = MJ.config.endings[endingId] || { name: endingId, tone: '', icon: '🌟' };
    var a = state.attributes;
    var dm = MJ.dominantMeta(state.meta);
    var metaName = dm ? MJ.config.metaDefs[dm].name : '—';
    var legend = MJ.legendScore(state);
    var all = MJ.achievementSystem.all();
    var unlocked = all.filter(function (x) { return x.unlocked; });
    var st = state.stats || { variants: 0, keyChoices: 0, events: 0 };
    var W = 720, H = 1080, S = 2;
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
    ctx.fillStyle = '#d4af37'; ctx.font = '600 21px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('MICHAEL JACKSON · 人 生 选 择', W / 2, 78);
    ctx.fillStyle = 'rgba(212,175,55,0.55)'; ctx.font = '14px sans-serif';
    ctx.fillText('1958 — 2009', W / 2, 102);

    ctx.beginPath(); ctx.arc(W / 2, 190, 62, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212,175,55,0.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '64px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textBaseline = 'middle';
    try { ctx.fillText(e.icon, W / 2, 192); } catch (err) {}
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#f3e2b0'; ctx.font = '700 46px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(e.name, W / 2, 300);
    ctx.fillStyle = '#caa84a'; ctx.font = 'italic 20px "PingFang SC",sans-serif';
    ctx.fillText(e.tone, W / 2, 336);

    var dims = [['健康', a.health], ['声誉', a.reputation], ['艺术', a.art], ['财富', a.wealth], ['家庭', a.family], ['压力', a.stress]];
    var bx0 = 70, colW = (W - 140) / 2, rowH = 50, top = 392, barX = bx0 + 96, barW = colW - 96 - 16;
    for (var i = 0; i < dims.length; i++) {
      var col = i % 2, row = (i / 2) | 0;
      var x = bx0 + col * colW, y = top + row * rowH;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#b9a06a'; ctx.font = '16px "PingFang SC",sans-serif';
      ctx.fillText(dims[i][0], x, y + 16);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f3e2b0'; ctx.font = '600 16px sans-serif';
      ctx.fillText(String(dims[i][1]), x + 80, y + 16);
      var v = Math.max(0, Math.min(100, dims[i][1])) / 100;
      var bgx = barX + col * colW;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, bgx, y + 4, barW, 10, 5); ctx.fill();
      var grad = ctx.createLinearGradient(bgx, 0, bgx + barW, 0);
      grad.addColorStop(0, '#caa84a'); grad.addColorStop(1, '#f3e2b0');
      ctx.fillStyle = grad; roundRect(ctx, bgx, y + 4, Math.max(2, barW * v), 10, 5); ctx.fill();
    }

    var ly = top + 3 * rowH + 18;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2b0'; ctx.font = '600 18px "PingFang SC",sans-serif';
    ctx.fillText('主导路线：' + metaName, W / 2, ly);
    ctx.fillStyle = '#caa84a'; ctx.font = '15px "PingFang SC",sans-serif';
    ctx.fillText('主导路线：' + metaName + '　·　传奇 ' + legend.score + '（' + legend.grade + '）', W / 2, ly + 26);

    var ay = ly + 60;
    ctx.fillStyle = '#b9a06a'; ctx.font = '15px "PingFang SC",sans-serif';
    ctx.fillText('解锁成就 ' + unlocked.length + ' / ' + all.length, W / 2, ay);
    var iconStr = unlocked.length ? unlocked.map(function (x) { return x.icon; }).join('   ') : '— 尚未点亮 —';
    ctx.font = '24px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.fillStyle = '#f3e2b0';
    wrapText(ctx, iconStr, W / 2, ay + 34, W - 120, 32);

    ctx.fillStyle = '#d4af37'; ctx.font = 'italic 18px "PingFang SC",sans-serif';
    ctx.fillText('每个人都是自己人生的词曲作者。', W / 2, H - 78);
    ctx.fillStyle = 'rgba(212,175,55,0.5)'; ctx.font = '13px sans-serif';
    ctx.fillText('MJ · 人生选择', W / 2, H - 52);

    return cv;
  }
  function downloadPoster(cv, base) {
    var name = base + '.png';
    function go(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }
    if (cv.toBlob) cv.toBlob(go, 'image/png');
    else { var a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = name; a.click(); }
  }
  function sharePosterImage(state, endingId) {
    if (!navigator.canShare) return;
    var cv = createPoster(state, endingId);
    cv.toBlob(function (blob) {
      if (!blob) return;
      var file = new File([blob], 'MJ人生传奇_' + endingId + '.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: '迈克尔·杰克逊：人生选择', text: buildEndingShareText(state, endingId) }).catch(function () {});
      }
    }, 'image/png');
  }

  // 传奇海报弹窗：结局默认弹出，可关闭；关闭后点击缩略图/「放大海报」再次打开（放大查看）
  function openPosterModal(state, id) {
    var old = document.getElementById('poster-overlay');
    if (old) old.parentNode.removeChild(old);
    var e = MJ.config.endings[id] || { name: id };
    var cv = createPoster(state, id);
    var canShareImg = false;
    try { canShareImg = typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.png', { type: 'image/png' })] }); } catch (err) {}
    var overlay = document.createElement('div');
    overlay.id = 'poster-overlay';
    overlay.className = 'overlay poster-modal';
    overlay.innerHTML = '<div class="poster-frame">' +
      '<div class="poster-tools">' +
        '<span class="pf-title">' + escapeHtml(e.name) + ' · 传奇海报</span>' +
        '<span class="pf-spacer"></span>' +
        '<button class="btn primary" id="pm-save">保存图片</button>' +
        (canShareImg ? '<button class="btn ghost" id="pm-share">分享图片</button>' : '') +
        '<button class="btn ghost" id="pm-close">关闭 ✕</button>' +
      '</div>' +
      '<div class="poster-canvas-wrap"></div>' +
    '</div>';
    overlay.querySelector('.poster-canvas-wrap').appendChild(cv);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (evt) { if (evt.target === overlay) closePosterModal(); });
    document.getElementById('pm-close').addEventListener('click', closePosterModal);
    document.getElementById('pm-save').addEventListener('click', function () { downloadPoster(cv, 'MJ人生传奇_' + id); });
    var pms = document.getElementById('pm-share');
    if (pms) pms.addEventListener('click', function () { sharePosterImage(state, id); });
  }
  function closePosterModal() {
    var o = document.getElementById('poster-overlay');
    if (o) o.parentNode.removeChild(o);
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
        '<div class="menu-row">' +
          '<button class="btn block" id="btn-gallery">📖 结局图鉴 <span class="m-cnt">' + galleryCount() + '</span></button>' +
          '<button class="btn block" id="btn-ach">🏆 成就 <span class="m-cnt">' + achCount() + '</span></button>' +
        '</div>' +
        '<div class="btn-row">' +
          (hasSave ? '<button class="btn primary" id="btn-continue">继续游戏</button>' : '') +
          '<button class="btn ' + (hasSave ? 'ghost' : 'primary') + '" id="btn-new">开始新人生</button>' +
        '</div>' +
        '<div class="toolbar">' +
          '<button class="btn ghost small" id="btn-audio">♪ 环境音：关</button>' +
          '<button class="btn ghost small" id="btn-share-intro">分享给朋友</button>' +
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
    var audioBtn = $('#btn-audio');
    if (audioBtn) audioBtn.addEventListener('click', function () {
      var on = MJ.audio.toggle();
      audioBtn.textContent = on ? '♪ 环境音：开' : '♪ 环境音：关';
    });
    var si = $('#btn-share-intro');
    if (si) si.addEventListener('click', function () { openShare('分享《迈克尔·杰克逊：人生选择》', buildGameShareText()); });
    var bg = $('#btn-gallery'); if (bg) bg.addEventListener('click', galleryModal);
    var ba = $('#btn-ach'); if (ba) ba.addEventListener('click', achievementsModal);
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
    MJ.achievementSystem.evaluate(state, {}).forEach(toastAchievement);
    window.scrollTo(0, 0);
  };

  // M3 章节过场（时代卡片）：展示章节标题/副题、本章人生手记(M2)与命运回响(M4)
  ui.showEraCard = function (chapter, state, onContinue) {
    var diary = (state.diary && state.diary.length) ? state.diary[state.diary.length - 1].text : '';
    var echo = (state.echoes && state.echoes.length) ? state.echoes[state.echoes.length - 1] : '';
    var html = statusBar(state, { year: chapter.start }) +
      '<div class="panel era-card">' +
        '<div class="era-ch">' + escapeHtml(chapter.title) + '</div>' +
        '<div class="era-sub">' + escapeHtml(chapter.sub) + '</div>' +
        (diary ? '<div class="era-block"><span class="e-tag">手记</span>' + escapeHtml(diary) + '</div>' : '') +
        (echo ? '<div class="era-block"><span class="e-tag">命运回响</span>' + escapeHtml(echo) + '</div>' : '') +
        (chapter.flavor ? '<div class="era-flavor">' + escapeHtml(chapter.flavor) + '</div>' : '') +
        '<div class="continue-row"><button class="btn primary" id="btn-era">进入本章</button></div>' +
      '</div>' + historyPanel(state);
    app.innerHTML = html;
    try { app.setAttribute('data-chapter', chapter.id); } catch (e) {}
    var btn = document.getElementById('btn-era');
    if (btn) btn.addEventListener('click', function () { onContinue(); });
    window.scrollTo(0, 0);
  };

  ui.showEnding = function (id, state) {
    var e = MJ.config.endings[id] || { name: id, icon: '🌟', tone: '', summary: '' };
    var legend = MJ.legendScore(state);
    var snap = '<div class="snapshot">';
    var names = MJ.config.attrNames;
    ['health', 'reputation', 'wealth', 'family', 'art', 'stress'].forEach(function (k) {
      snap += '<div class="s">' + names[k] + '：<b>' + (state.attributes[k] || 0) + '</b></div>';
    });
    snap += '<div class="s">净资产：<b>' + formatMoney(state.netWorth) + '</b></div>';
    var dm = MJ.dominantMeta(state.meta);
    snap += '<div class="s">主导路线：<b>' + (dm ? MJ.config.metaDefs[dm].name : '—') + '</b></div>';
    snap += '<div class="s">传奇评分：<b>' + legend.score + '（' + legend.grade + '）</b></div>';
    snap += '<div class="life-stat">本局触发变体 <b>' + (state.stats ? state.stats.variants : 0) + '</b> 次 · 关键抉择 <b>' + (state.stats ? state.stats.keyChoices : 0) + '</b> 个</div>';
    snap += '</div>';

    var canShareImg = false;
    try { canShareImg = typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.png', { type: 'image/png' })] }); } catch (e) {}

    var html =
      statusBar(state, { year: 2009 }) +
      '<div class="panel ending' + (e.hidden ? ' hidden-ending' : '') + '">' +
        (e.hidden ? '<div class="badge-ultimate">★ 终极隐藏结局</div>' : '') +
        '<div class="icon">' + e.icon + '</div>' +
        '<h2>' + e.name + '</h2>' +
        '<p class="tone">' + e.tone + '</p>' +
        '<div class="desc">' + escapeHtml(e.summary) + '</div>' +
        (e.monologue ? '<div class="mono">' + escapeHtml(e.monologue) + '</div>' : '') +
        snap +
        '<div class="poster-box" id="poster-box"></div>' +
        '<div class="poster-actions">' +
          '<button class="btn primary" id="btn-save-poster">保存图片海报</button>' +
          '<button class="btn ghost" id="btn-copy">复制文案</button>' +
          (canShareImg ? '<button class="btn ghost" id="btn-share-img">分享图片</button>' : '') +
        '</div>' +
        '<div class="btn-row"><button class="btn primary" id="btn-restart">重新开始</button>' +
        '<button class="btn ghost" id="btn-audio-end">♪ 环境音：关</button></div>' +
      '</div>' +
      '<div class="menu-row">' +
        '<button class="btn block" id="btn-gallery-end">📖 结局图鉴 <span class="m-cnt">' + galleryCount() + '</span></button>' +
        '<button class="btn block" id="btn-ach-end">🏆 成就 <span class="m-cnt">' + achCount() + '</span></button>' +
      '</div>' +
      keyReviewPanel(state) +
      diaryPanel(state) +
      echoesPanel(state) +
      historyPanel(state) +
      '<div class="foot">你的每一个选择，写就了独一无二的传奇。</div>';
    app.innerHTML = html;
    MJ.achievementSystem.evaluate(state, { ending: id }).forEach(toastAchievement);
    $('#btn-restart').addEventListener('click', function () {
      MJ.saveSystem.clear();
      ui.showIntro(false);
    });
    var posterCanvas = createPoster(state, id);
    var pbox = document.getElementById('poster-box');
    if (pbox) {
      var thumb = document.createElement('img');
      thumb.src = posterCanvas.toDataURL('image/png');
      thumb.alt = '传奇海报';
      thumb.className = 'poster-thumb';
      thumb.title = '点击放大海报';
      thumb.addEventListener('click', function () { openPosterModal(state, id); });
      pbox.appendChild(thumb);
      var vb = document.createElement('button');
      vb.className = 'btn ghost small'; vb.textContent = '放大海报';
      vb.addEventListener('click', function () { openPosterModal(state, id); });
      pbox.appendChild(vb);
    }
    $('#btn-save-poster').addEventListener('click', function () { downloadPoster(posterCanvas, 'MJ人生传奇_' + id); });
    $('#btn-copy').addEventListener('click', function () { copyText(buildEndingShareText(state, id), this); });
    var sib = $('#btn-share-img');
    if (sib) sib.addEventListener('click', function () { sharePosterImage(state, id); });
    openPosterModal(state, id); // 结局默认弹出海报，可关闭后点击缩略图放大
    var ebAudio = $('#btn-audio-end');
    if (ebAudio) ebAudio.addEventListener('click', function () {
      var on = MJ.audio.toggle();
      ebAudio.textContent = on ? '♪ 环境音：开' : '♪ 环境音：关';
    });
    var bge = $('#btn-gallery-end'); if (bge) bge.addEventListener('click', galleryModal);
    var bae = $('#btn-ach-end'); if (bae) bae.addEventListener('click', achievementsModal);
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
