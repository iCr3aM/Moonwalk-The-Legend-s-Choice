// .gitignore 一致性门禁：仓库（含远端）不得出现「已被 .gitignore 忽略」的文件。
// 背景：test/ 与 archive/ 曾整目录被 ignore，却早已被 git 跟踪并推送到远端——
// git 对「已跟踪文件」不再应用 ignore 规则，所以这类冲突本地毫无提示，只在远端留下矛盾状态。
// 自检等价于：git ls-files -i -c --exclude-standard   （列出「已跟踪但被忽略」）必须为空。
// 用法：node test/check_gitignore.cjs（接入 npm test 并行矩阵）
'use strict';
var cp = require('child_process');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var r = cp.spawnSync('git', ['ls-files', '-i', '-c', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });

if (r.status !== 0) {
  console.log('FAIL 无法执行 git ls-files（当前目录非 git 仓库？）');
  console.log(String(r.stderr || '').trim());
  process.exit(1);
}

var list = String(r.stdout || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
if (list.length) {
  console.log('FAIL 以下文件已被 git 跟踪但与 .gitignore 冲突（会推到远端）：');
  list.forEach(function (f) { console.log('  - ' + f); });
  console.log('处理：若该内容本就该入库 → 从 .gitignore 移除对应规则；若不该入库 → git rm --cached 后提交。');
  process.exit(1);
}

console.log('.gitignore 一致性门禁：0 个「已跟踪但被忽略」文件');
process.exit(0);
