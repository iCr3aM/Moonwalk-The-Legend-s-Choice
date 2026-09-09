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
  // 注：原 600px 断点已并入 640px（二者规则完全重复且 640 后定义覆盖 600），故不再单独断言 600px。
  ['prefers-reduced-motion 存在', /prefers-reduced-motion/.test(css)],
  ['640: .btn-row 纵向排列', inMedia('max-width: 640px', /\.btn-row\s*\{[^}]*flex-direction:\s*column/)],
  ['640: .bars 两列', inMedia('max-width: 640px', /\.bars\s*\{[^}]*grid-template-columns:\s*repeat\(2/)],
  ['640: 图鉴网格两列', inMedia('max-width: 640px', /(\.menu-grid|\.menu-row)\s*\{[^}]*grid-template-columns:\s*repeat\(2/)],
  // .toolbar 死类已随 U3#11 清理移除（0 引用），对应断言一并撤销
  ['640: .subdim-grid 单列', inMedia('max-width: 640px', /\.subdim-grid\s*\{[^}]*grid-template-columns:\s*1fr/)],
  // 契约变更：原先 .modal 与 .modal-body 双层 overflow（双滚动条），
  // 现改为 .modal 限高 + .modal-body 唯一滚动区，故断言同步更新。
  ['模态 max-height', /\.modal\s*\{[^}]*max-height/.test(css)],
  ['模态单一滚动区（.modal-body）', /\.modal-body\s*\{[^}]*overflow:\s*auto/.test(css)]
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
