// 检查 events.js 中的重复事件 / 键-id 不一致 / next 悬空引用
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;
var fs = require('fs');
var path = require('path');
var src = fs.readFileSync(path.join(__dirname, '..', 'js', 'events.js'), 'utf8');

// —— 1. 源码层：统计所有 E[...] = / E.xxx = 赋值，并提取紧随其后的 id 字段 ——
var assignRe = /E\['((?:[^'\\]|\\.)+)'\]\s*=|E\.([A-Za-z0-9_]+)\s*=/g;
var keyToId = {};      // 赋值键 -> id
var keyCount = {};     // 赋值键出现次数
var m;
while ((m = assignRe.exec(src))) {
  var key = m[1] != null ? m[1] : m[2];
  keyCount[key] = (keyCount[key] || 0) + 1;
  // 在赋值位置后 400 字符内找第一个 id: '...'
  var tail = src.slice(assignRe.lastIndex, assignRe.lastIndex + 400);
  var im = /id:\s*'((?:[^'\\]|\\.)*)'/.exec(tail);
  var id = im ? im[1] : '(无 id 字段)';
  if (!keyToId[key]) keyToId[key] = id;
}

// —— 2. 加载后对象层 ——
var EVENTS = MJ.EVENTS;
var objKeys = Object.keys(EVENTS);
var srcAssignTotal = Object.keys(keyCount).reduce(function (s, k) { return s + keyCount[k]; }, 0);

console.log('源码赋值语句数 =', srcAssignTotal, ' | 加载后事件对象键数 =', objKeys.length);
if (srcAssignTotal > objKeys.length) {
  console.log('⚠ 存在静默覆盖：源码赋值 ' + srcAssignTotal + ' 次，但对象仅 ' + objKeys.length + ' 个键（差 ' + (srcAssignTotal - objKeys.length) + ' 个被覆盖）');
} else {
  console.log('✅ 源码赋值数与对象键数一致，无静默覆盖');
}

// —— 3. 重复赋值键 ——
var dupKeys = Object.keys(keyCount).filter(function (k) { return keyCount[k] > 1; });
console.log('\n[重复赋值键] ' + (dupKeys.length ? dupKeys.join(', ') : '无'));

// —— 4. 键与 id 不一致 ——
var mismatch = [];
Object.keys(keyToId).forEach(function (k) {
  if (keyToId[k] !== k) mismatch.push(k + ' -> id="' + keyToId[k] + '"');
});
console.log('[键/id 不一致] ' + (mismatch.length ? '\n  ' + mismatch.join('\n  ') : '无'));

// —— 5. id 值重复（不同键却同 id）——
var idMap = {};
Object.keys(keyToId).forEach(function (k) { (idMap[keyToId[k]] = idMap[keyToId[k]] || []).push(k); });
var dupIds = Object.keys(idMap).filter(function (id) { return idMap[id].length > 1; });
console.log('[id 值重复] ' + (dupIds.length ? dupIds.map(function (id) { return id + ' := ' + idMap[id].join(' / '); }).join('\n  ') : '无'));

// —— 6. 变体事件重复 id ——
var variants = objKeys.filter(function (k) { return EVENTS[k] && EVENTS[k].variant; });
var vIds = variants.map(function (k) { return EVENTS[k].id; });
var dupV = vIds.filter(function (v, i) { return vIds.indexOf(v) !== i; });
console.log('[变体事件总数] ' + variants.length + ' | [变体 id 重复] ' + (dupV.length ? dupV.join(', ') : '无'));

// —— 7. next / fallback 悬空引用 ——
var endingIds = Object.keys(MJ.config.endings || {});
var nextSet = {};
function recordNext(n) {
  if (n == null) return;
  if (n === '__RETURN__' || endingIds.indexOf(n) >= 0) return;
  nextSet[n] = (nextSet[n] || 0) + 1;
}
objKeys.forEach(function (k) {
  var ev = EVENTS[k];
  if (!ev) return;
  if (ev.next) recordNext(ev.next);
  if (ev.fallback) recordNext(ev.fallback);
  var opts = (typeof ev.options === 'function') ? [] : (ev.options || []); // 函数型选项无法静态取，仅查静态
  opts.forEach(function (o) { if (o.next) recordNext(o.next); });
});
var dangling = Object.keys(nextSet).filter(function (n) { return !EVENTS[n] && endingIds.indexOf(n) < 0 && n !== '__RETURN__'; });
console.log('\n[next 悬空引用] ' + (dangling.length ? '\n  ' + dangling.join('\n  ') + '（指向不存在的事件）' : '无（全部命中已定义事件 / 结局 / __RETURN__）'));

// —— 8. 防回归：变体不得写入 grammy_* 标志 / 不得出现 V_GRAMMY* id（§17.14 涌现结算专有，避免重复计奖）——
var grammyFlagHit = [], grammyIdHit = [];
objKeys.forEach(function (k) {
  var ev = EVENTS[k];
  if (!ev) return;
  if (/^V_GRAMMY/i.test(ev.id || k)) grammyIdHit.push(k);
  var opts = (typeof ev.options === 'function') ? [] : (ev.options || []);
  opts.forEach(function (o) {
    if (o.flags) Object.keys(o.flags).forEach(function (fk) { if (/^grammy_/.test(fk)) grammyFlagHit.push(k + '.' + fk); });
  });
});
console.log('[防回归·grammy] 变体 id 含 V_GRAMMY: ' + (grammyIdHit.length ? grammyIdHit.join(', ') + ' ⚠ 禁止' : '无（✅）'));
console.log('[防回归·grammy] 选项写入 grammy_* 标志: ' + (grammyFlagHit.length ? '\n  ' + grammyFlagHit.join('\n  ') + ' ⚠ 禁止' : '无（✅）'));
console.log('\n检查结束。');
var problems = [];
if (srcAssignTotal > objKeys.length) problems.push('静默覆盖 ' + (srcAssignTotal - objKeys.length) + ' 个键被覆盖');
if (dupKeys.length) problems.push('重复赋值键 ' + dupKeys.join('/'));
if (mismatch.length) problems.push('键/id 不一致 ' + mismatch.length + ' 处');
if (dupIds.length) problems.push('id 值重复 ' + dupIds.join(' / '));
if (dupV.length) problems.push('变体 id 重复 ' + dupV.join('/'));
if (dangling.length) problems.push('next 悬空引用 ' + dangling.length + ' 处');
if (grammyIdHit.length) problems.push('变体 id 含 V_GRAMMY 前缀(禁止)');
if (grammyFlagHit.length) problems.push('变体选项写入 grammy_* 标志(禁止)');
if (problems.length) { console.error('FAIL 重复/一致性审计：\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('✅ 无重复键/悬空引用/grammy 违规');
process.exit(0);
