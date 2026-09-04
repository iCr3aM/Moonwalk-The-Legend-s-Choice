// 类名 ↔ CSS 存在性校验（防「语录式」隐形失样）：
// 抽取 ui.js 中所有 class="..." / className="..." 字面量里的类名，逐个核对 style.css 是否定义。
// 规则：含连字符但未定义的类名 → 疑似失样（如 g-ic/g-nm/g-ds），判 FAIL；
//       纯字母（无连字符）但未定义的，多半是 T() 默认英文串的零散单词，仅告警不失败。
// 用法：node test/check_ui_classes.cjs  （建议接入 npm test）
const fs = require('fs');
const path = require('path');
var uiPath = path.join(__dirname, '..', 'js', 'ui.js');
var cssPath = path.join(__dirname, '..', 'css', 'style.css');
var ui = fs.readFileSync(uiPath, 'utf8');
var css = fs.readFileSync(cssPath, 'utf8');

// 已知动态拼接 / 非 CSS 的合法 token（如状态栏里 'panel ' + 章节 id 等），显式放行
var ALLOW = new Set(['MJ', 'Forever', 'posterOfTag', 'zoomHint', 'coverConfirm', 'lang-btn', 'at-body', 'kreview', 'echoes']);

var re = /(?:class|className)\s*=\s*["']([^"']*)["']/g;
var m, raw = [];
while ((m = re.exec(ui))) raw.push(m[1]);

var tokens = new Set();
raw.forEach(function (s) {
  s.split(/\s+/).forEach(function (t) {
    if (/^[a-z][a-z0-9_-]*$/.test(t)) tokens.add(t);
  });
});

function inCss(t) {
  var esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('\\.' + esc + '\\b').test(css);
}

var fail = [], warn = [];
tokens.forEach(function (t) {
  if (ALLOW.has(t)) return;
  if (inCss(t)) return;
  if (/-/.test(t)) fail.push(t); else warn.push(t);
});

console.log('抽取静态类名 ' + tokens.size + ' 个（来自 ' + raw.length + ' 个 class/className 字面量）');
if (warn.length) console.log('  非连字符未匹配（疑似英文碎片，仅告警）: ' + warn.join(', '));
if (fail.length) { console.log('FAIL 含连字符但未定义的类名（疑似隐形失样）: ' + fail.join(', ')); process.exit(1); }
console.log('✅ 所有含连字符的类名均在 style.css 中定义（无隐形失样）');
process.exit(0);
