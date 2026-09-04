// 直接校验「真实 dist/index.html」的第一段合并脚本：node --check 语法 + HTML 解析隐患扫描。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dist = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');

// 提取第一个 <script> ... </script>（合并模块段）
const m = dist.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('❌ 找不到第一个 <script>'); process.exit(1); }
const js = m[1];
fs.writeFileSync(path.join(__dirname, '_dist_check.js'), js, 'utf8');

// 先打印出错行上下文（node --check 报的行号在提取文件内）
const lines = js.split('\n');
console.log('--- 提取脚本 4155..4180 行（node --check 报的 4167 在此区间内）---');
for (let i = 4154; i < Math.min(4180, lines.length); i++) {
  console.log((i + 1) + ': ' + JSON.stringify(lines[i]));
}

try {
  execSync('node --check "' + path.join(__dirname, '_dist_check.js') + '"', { stdio: 'pipe' });
  console.log('✅ 合并脚本 node --check 通过（语法无误）');
} catch (e) {
  console.error('❌ 合并脚本存在语法错误：\n' + (e.stderr ? e.stderr.toString() : e.message));
  process.exit(2);
}

// HTML 解析隐患扫描（浏览器 <script> 数据状态会被这些序列提前截断/错位）
const hasEscaped = /<\\\/script/.test(js);
console.log('含有已转义的 <\\/script:', hasEscaped);
const rawClose = js.match(/<\/script/gi);
console.log('仍含原始 </script 序列:', rawClose ? rawClose.length : 0, '(应为 0)');
const htmlComment = js.match(/<!--/g);
console.log('含 <!-- 序列:', htmlComment ? htmlComment.length : 0);
const htmlCommentEnd = js.match(/-->/g);
console.log('含 --> 序列:', htmlCommentEnd ? htmlCommentEnd.length : 0);
// 常见陷阱：注释内出现 <script 或 </script 字样（即便被转义，浏览器在 <!-- 后进入 escaped 状态）
const danger = js.match(/<!--[\s\S]*?<script[\s\S]*?-->/g);
console.log('疑似 <script> 注释 + <script + --> 三元组:', danger ? danger.length : 0, '(浏览器会错位终止)');
console.log('合并脚本首 120 字符:', JSON.stringify(js.slice(0, 120)));
console.log('合并脚本末 120 字符:', JSON.stringify(js.slice(-120)));
fs.unlinkSync(path.join(__dirname, '_dist_check.js'));
