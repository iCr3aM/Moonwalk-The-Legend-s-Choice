// js 全量语法门禁：对 js/ 下全部模块跑 node --check。
// 背景：U3 实机截图曾抓到 ui.js 被批量脚本切坏（浏览器加载失败/MJ.ui undefined），
// 而 28 门禁无任何真实浏览器加载路径（e2e 在矩阵外），语法错误零捕获——本门禁补此盲区。
// 用法：node test/check_syntax.cjs （接入 npm test 并行矩阵）
'use strict';
var cp = require('child_process');
var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var dir = path.join(ROOT, 'js');
var files = fs.readdirSync(dir).filter(function (f) { return f.endsWith('.js'); }).sort();

var fail = 0;
files.forEach(function (f) {
  var r = cp.spawnSync(process.execPath, ['--check', path.join(dir, f)], { encoding: 'utf8' });
  if (r.status !== 0) {
    fail++;
    console.log('FAIL 语法错误: js/' + f);
    console.log(String(r.stderr || '').trim());
  }
});

console.log('js 语法门禁：' + files.length + ' 个文件；FAIL ' + fail);
process.exit(fail ? 1 : 0);
