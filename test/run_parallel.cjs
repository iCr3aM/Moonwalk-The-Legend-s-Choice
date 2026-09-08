// 门禁并行矩阵 runner（用户机器性能充足，28 门禁全量并发）
// 设计：每个门禁独立子进程并发执行（全局状态/随机种子互不干扰）；聚合退出码——任一非 0 即 FAIL。
// 输出策略：启动时列矩阵清单；结束时按定义顺序汇总 PASS/FAIL（失败项附尾部输出便于定位）。
// 用法：node test/run_parallel.cjs        （npm test 即此）
//       node test/run_parallel.cjs --serial  （退回串行链，等价旧 && 链）
'use strict';
var cp = require('child_process');
var path = require('path');
var ROOT = path.join(__dirname, '..');

var GATES = [
  'node test/check_dup_events.cjs',
  'node test/check_variant_windows.cjs',
  'node test/check_dream_achievements.cjs',
  'node test/check_alt_achievements.cjs',
  'node test/check_residue_en.cjs',
  'node test/check_dream_e2e.cjs',
  'node test/check_epilogue_chain.cjs',
  'node test/check_endings_new.cjs',
  'node test/_audit_endings_full.cjs 5000',
  'node test/_audit_endings_gaps.cjs 5000',
  'node test/_probe_fallback.cjs',
  'node test/check_bio_thin.cjs',
  'node test/en_smoke.cjs',
  'node test/check_ui_classes.cjs',
  'node test/check_i18n_coverage.cjs',
  'node test/check_phase2_content.cjs',
  'node test/check_balance_reach.cjs',
  'node test/_audit_playthrough.cjs 5000',
  'node test/_audit_egg_trivia_reach.cjs 3000',
  'node test/_audit_milestone_variants.cjs 5000',
  'node test/_audit_narrative.cjs',
  'node test/_audit_rel_met.cjs',
  'node test/_audit_person_consistency.cjs',
  'node test/_audit_flag_closure.cjs',
  'node test/_audit_ending_texts.cjs',
  'node test/_audit_hard_constraints.cjs',
  'node test/_audit_poster_quotes.cjs',
  'node test/check_responsive.cjs'
];

function runOne(cmd) {
  return new Promise(function (resolve) {
    cp.exec(cmd, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }, function (err, stdout, stderr) {
      resolve({ cmd: cmd, code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, out: stdout || '', err: stderr || '' });
    });
  });
}
function runSerial() {
  var i = 0;
  function next() {
    if (i >= GATES.length) { console.log('\n=== 门禁串行链：全部 ' + GATES.length + ' 项通过 ==='); process.exit(0); }
    var cmd = GATES[i];
    console.log('[' + (i + 1) + '/' + GATES.length + '] ' + cmd);
    var p = cp.exec(cmd, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }, function (err) {
      if (err) { console.error('[FAIL] ' + cmd); process.exit(1); }
      console.log('[PASS] ' + cmd);
      i++; next();
    });
    p.stdout.on('data', function (d) { process.stdout.write(d); });
    p.stderr.on('data', function (d) { process.stderr.write(d); });
  }
  next();
}

if (process.argv.indexOf('--serial') >= 0) { runSerial(); return; }

console.log('=== 门禁并行矩阵：' + GATES.length + ' 项全量并发 ===');
var t0 = Date.now();
Promise.all(GATES.map(runOne)).then(function (rs) {
  var fail = 0;
  rs.forEach(function (r, idx) {
    if (r.code !== 0) {
      fail++;
      console.error('[FAIL ' + (idx + 1) + '/' + GATES.length + '] ' + r.cmd + '  (exit ' + r.code + ')');
      var tail = (r.out || '').trim().split('\n').slice(-15);
      tail.forEach(function (l) { console.error('    ' + l); });
      if (r.err.trim()) console.error('    [stderr] ' + r.err.trim().split('\n').slice(-5).join('\n    '));
    }
  });
  var sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n=== 门禁矩阵：' + (GATES.length - fail) + '/' + GATES.length + ' 通过，耗时 ' + sec + 's ===');
  process.exit(fail ? 1 : 0);
}).catch(function (e) { console.error(e); process.exit(1); });
