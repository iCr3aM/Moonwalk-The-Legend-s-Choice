/* 英文冒烟：加载 i18n + 事件英文全集，置 lang='en'，验证引擎无异常且事件正文/选项解析为英文。 */
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};

require('../js/config.js');
require('../js/state.js');
require('../js/i18n.js');
require('../js/i18n_events_en.js');
require('../js/engine.js');
require('../js/events.js');
require('../js/planner.js');

var MJ = global.MJ;
MJ.i18n.setLang('en');

var _cur = null;
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (chapter, state, onContinue) { onContinue(); }
};

function play() {
  MJ.engine.start();
  var guard = 0;
  while (guard++ < 800) {
    if (!_cur) return { ok: false, why: 'no event' };
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id };
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var opts = MJ.engine.optionsOf(_cur);
      MJ.engine.choose(Math.floor(Math.random() * opts.length));
      continue;
    }
    return { ok: false, why: 'unknown kind ' + _cur.kind };
  }
  return { ok: false, why: 'guard exceeded' };
}

var errors = 0, endingsSeen = {};
for (var i = 0; i < 200; i++) {
  try {
    var r = play();
    if (!r.ok) { errors++; console.log('EN RANDOM FAIL', i, r); break; }
    endingsSeen[r.ending] = (endingsSeen[r.ending] || 0) + 1;
  } catch (e) {
    errors++; console.log('EN RANDOM THROW', i, e && e.stack); break;
  }
}
console.log('EN 随机 200 局：异常', errors, '；结局分布', JSON.stringify(endingsSeen));

function locText(ev, s) {
  var loc = MJ.localizeEvent(ev, s);
  return (typeof loc.text === 'function') ? loc.text() : loc.text;
}
function mkState(over) {
  var st = new MJ.GameState();
  if (over) Object.assign(st.flags, over.flags || {});
  return st;
}

var s1 = mkState({});
console.log('EN start.title   =', JSON.stringify(MJ.localizeEvent(MJ.EVENTS.start, s1).title));
console.log('EN 1_0.label0    =', JSON.stringify(MJ.localizeEvent(MJ.EVENTS['1_0'], s1).options[0].label));
console.log('EN 7_2.title     =', JSON.stringify(MJ.localizeEvent(MJ.EVENTS['7_2'], s1).title));

var st5 = mkState({ flags: { isSolo: true, neverlandType: 'public' } });
console.log('EN 5_3.text      =', JSON.stringify(locText(MJ.EVENTS['5_3'], st5)));
var st6 = mkState({ flags: { isSolo: true, neverlandType: 'public', settlement1993: true } });
console.log('EN 6_4.text      =', JSON.stringify(locText(MJ.EVENTS['6_4'], st6)));

// 抽样确认：随机若干 choice 事件的 options 均返回英文（无中文残留）
var zhHit = 0, sampled = 0;
for (var k = 0; k < 30; k++) {
  MJ.engine.start();
  var g = 0;
  while (g++ < 800) {
    if (!_cur) break;
    if (_cur.kind === 'ended' || _cur.kind === 'ending') break;
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var os = MJ.engine.optionsOf(_cur);
      for (var j = 0; j < os.length; j++) {
        sampled++;
        var str = (os[j].label || '') + (os[j].hint || '');
        if (/[一-鿿]/.test(str)) zhHit++;
      }
      MJ.engine.choose(Math.floor(Math.random() * os.length));
      continue;
    }
    break;
  }
}
console.log('EN 选项抽样：样本', sampled, '；含中文残留', zhHit);

// 确定性遍历续章链路（禁用变体，避免重定向）：校验 next 全可达、无运行时错误
var _origPick = MJ.engine.pickVariant;
MJ.engine.pickVariant = function () { return null; };
MJ.engine.start();
MJ.engine.state.flags.survived2009 = true;
MJ.engine.go('8_0');
var chainErr = 0, steps = 0, seen = {};
while (steps++ < 120) {
  var cur = MJ.engine.current;
  if (!cur) { chainErr++; break; }
  if (cur.kind === 'ending') break;
  if (cur.kind === 'auto') { MJ.engine.proceed(); continue; }
  if (cur.kind === 'choice') { seen[cur.id] = (seen[cur.id] || 0) + 1; MJ.engine.choose(0); continue; }
  break;
}
MJ.engine.pickVariant = _origPick;
console.log('EN 续章链路遍历：步数', steps, '；错误', chainErr, '；途经', Object.keys(seen).join('>'));

// 确定性校验 2_6 / 4_4 接入主线（禁用变体，solo 路径）
MJ.engine.pickVariant = function () { return null; };
MJ.engine.start();
MJ.engine.state.flags.isSolo = true;
MJ.engine.go('2_4');
var g2 = 0, seen2 = {};
while (g2++ < 60) {
  var c2 = MJ.engine.current;
  if (!c2) { chainErr++; break; }
  if (c2.id === '3_1') { seen2['3_1'] = 1; break; }
  if (c2.kind === 'auto') { MJ.engine.proceed(); continue; }
  if (c2.kind === 'choice') { seen2[c2.id] = (seen2[c2.id] || 0) + 1; MJ.engine.choose(0); continue; }
  break;
}
MJ.engine.pickVariant = _origPick;
console.log('EN 第二章 solo 链路(2_4→3_1) 途经', Object.keys(seen2).join('>'), '；是否经过 2_5/2_6:', !!(seen2['2_5'] && seen2['2_6']));

// 新事件（g4/g5）确定性覆盖：强制校验每个新事件/变体在 EN 下无中文残留
var newIds = ['8_1b', '8_2b', '8_3b', '8_5b', '8_4b', '8_4c', '8_7', '2_6', '4_4', 'V_POST_TRIBUTE', 'V_POST_HOLO', 'V_POST_FAMILY'];
var cov = 0, covHit = 0;
function zhOf(x) { if (x == null) return false; if (typeof x === 'function') x = x(); return typeof x === 'string' && /[一-鿿]/.test(x); }
newIds.forEach(function (id) {
  var ev = MJ.EVENTS[id];
  if (!ev) { console.log('缺失事件', id); covHit++; return; }
  var loc = MJ.localizeEvent(ev, new MJ.GameState());
  [loc.title, loc.text].forEach(function (t) { if (zhOf(t)) { covHit++; console.log('EN 残留(默认) ' + id + ':', t); } });
  (loc.options || []).forEach(function (o) {
    if (zhOf(o.label)) { covHit++; console.log('EN 残留 ' + id + ' label:', o.label); }
    if (zhOf(o.hint)) { covHit++; console.log('EN 残留 ' + id + ' hint:', o.hint); }
  });
  cov++;
});
['artPath', 'phil', 'mogul', 'recluse', ''].forEach(function (m) {
  var st = new MJ.GameState(); if (m) st.meta[m] = 1;
  var loc = MJ.localizeEvent(MJ.EVENTS['8_7'], st);
  if (zhOf(loc.text)) { covHit++; console.log('EN 残留 8_7(' + m + '):', loc.text); }
});
console.log('EN 新事件覆盖：事件', cov, '；中文残留', covHit);
console.log('EN 测试结束。');
