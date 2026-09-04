/* 计算成就「实际可达性」：无 DOM 环境下用均匀随机策略跑 N 局，
 * 统计每个成就 check 在终局状态上的命中率（= 平均玩家真实触发概率）。
 * 输出 JSON 映射供 config.achievementReach 烘焙使用。
 * 用法：node test/compute_ach_reach.cjs [N]
 */
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
require('../js/config.js');
require('../js/state.js');
require('../js/engine.js');
require('../js/events.js');
require('../js/planner.js');
MJ.saveSystem.save = function () {}; // 加速：跳过持久化序列化

var _cur = null;
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (c, s, cb) { cb(); }
};

function play() {
  MJ.engine.start();
  var guard = 0;
  while (guard++ < 2000) {
    if (!_cur) return null;
    if (_cur.kind === 'ended') return _cur.id;
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var opts = MJ.engine.optionsOf(_cur);
      MJ.engine.choose(Math.floor(Math.random() * opts.length));
      continue;
    }
    return null;
  }
  return null;
}

var N = parseInt(process.argv[2] || '5000', 10);
var achs = MJ.config.achievements || [];
var counts = {}, endings = {};
achs.forEach(function (a) { counts[a.id] = 0; });

var t0 = Date.now();
for (var t = 0; t < N; t++) {
  var endingId = play();
  if (!endingId) { console.error('PLAY FAIL at', t); process.exit(1); }
  endings[endingId] = (endings[endingId] || 0) + 1;
  var s = MJ.engine.state;
  achs.forEach(function (a) {
    try { if (a.check(s, { ending: endingId })) counts[a.id]++; } catch (e) {}
  });
}
var ms = Date.now() - t0;

var reach = {};
achs.forEach(function (a) { reach[a.id] = +(counts[a.id] / N).toFixed(4); });

// 人类可读：按可达性降序
var sorted = achs.map(function (a) { return { id: a.id, rarity: a.rarity, reach: reach[a.id] }; })
  .sort(function (x, y) { return y.reach - x.reach; });

console.log('N=' + N + '  耗时 ' + ms + 'ms');
console.log('--- 成就实际可达性（降序，1.0=每局必得）---');
sorted.forEach(function (o) {
  console.log('  ' + (o.reach * 100).toFixed(1).padStart(5) + '%  [' + o.rarity.padEnd(9) + '] ' + o.id);
});
console.log('--- JSON（烘焙用）---');
console.log(JSON.stringify(reach));
console.log('--- 结局分布 ---');
console.log(JSON.stringify(endings));
