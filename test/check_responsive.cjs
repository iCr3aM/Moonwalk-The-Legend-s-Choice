// 响应式 / 无障碍回归守卫（CSS 存在性断言）：
//   断言关键移动端规则与无障碍规则存在于 style.css，防止被误删导致窄屏布局/滚动退化。
//   真实视觉渲染需在浏览器人工核对（见报告清单），本测试只做结构性回归门禁。
// 用法：node test/check_responsive.cjs  （建议接入 npm test）
const fs = require('fs');
const path = require('path');
var css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

function blocks(css, query) {
  var re = new RegExp('@media\\s*\\(' + query.replace(/[()]/g, '\\$&') + '\\s*\\)\\s*\\{([\\s\\S]*?)\\n\\}', 'g');
  var out = [], m;
  while ((m = re.exec(css))) out.push(m[1]);
  return out.join('\n');
}
function inMedia(query, re) { return re.test(blocks(css, query)); }

var checks = [
  ['@media (max-width:640px) 存在', inMedia('max-width: 640px', /./)],
  ['@media (max-width:600px) 存在', inMedia('max-width: 600px', /./)],
  ['prefers-reduced-motion 存在', /prefers-reduced-motion/.test(css)],
  ['640: .btn-row 纵向排列', inMedia('max-width: 640px', /\.btn-row\s*\{[^}]*flex-direction:\s*column/)],
  ['640: .bars 两列', inMedia('max-width: 640px', /\.bars\s*\{[^}]*grid-template-columns:\s*repeat\(2/)],
  ['640: 图鉴网格两列', inMedia('max-width: 640px', /(\.menu-grid|\.menu-row)\s*\{[^}]*grid-template-columns:\s*repeat\(2/)],
  ['640: .toolbar 可换行', inMedia('max-width: 640px', /\.toolbar\s*\{[^}]*flex-wrap:\s*wrap/)],
  ['640: .subdim-name 限宽', inMedia('max-width: 640px', /\.subdim-name\s*\{[^}]*width:\s*56px/)],
  ['模态 max-height + 滚动', /\.modal\s*\{[^}]*max-height[^}]*overflow:\s*auto/.test(css)]
];

var fail = 0;
checks.forEach(function (c) {
  console.log((c[1] ? '  ✓ ' : '  ✗ ') + c[0]);
  if (!c[1]) fail++;
});

console.log('\n响应式/无障碍回归守卫：' + (fail ? ('FAIL（' + fail + ' 项缺失）') : 'PASS（关键移动端/无障碍规则均在）'));
if (fail) {
  console.log('手动核对清单（需浏览器）：');
  console.log('  · 320/375/768/1280 宽度下四区布局、图鉴 grid、模态 max-height 滚动正常');
  console.log('  · 键盘可达：按钮焦点样式、Esc 关闭模态（如已实现）、对比度（gold on dark）');
}
process.exit(fail ? 1 : 0);
