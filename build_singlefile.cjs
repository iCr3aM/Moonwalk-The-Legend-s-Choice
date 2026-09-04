// 生成单文件版本 dist/index.html：把 css/style.css 与 7 个 js 模块内联，零外部依赖，可直接单文件部署。
// 用法：node build_singlefile.cjs
const fs = require('fs');
const path = require('path');

const root = __dirname;
const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// 与 index.html 中一致的依赖顺序
const jsFiles = [
  'js/config.js',
  'js/i18n.js',
  'js/i18n_events_en.js',
  'js/events.js',
  'js/state.js',
  'js/engine.js',
  'js/ui.js',
];

let js = '';
jsFiles.forEach(function (f) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) { throw new Error('缺少文件：' + f); }
  js += '\n/* ===== ' + f + ' ===== */\n';
  js += fs.readFileSync(p, 'utf8');
  js += '\n';
});
// 防止 JS 中出现 </script> 提前闭合（极少出现，保险处理）
js = js.replace(/<\/script/gi, '<\\/script');

const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 1) 内联 CSS
html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css" \/>/,
  '<style>\n' + css + '\n</style>'
);

// 2) 删除所有外部 js 引用
html = html.replace(/<script src="js\/[^"]+"><\/script>/g, '');

// 3) 把内联脚本 + 初始化脚本放回（保留原 DOMContentLoaded 初始化）
const initRe = /<script>\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/;
const combined = '<script>\n' + js + '\n</script>\n  <script>\n' +
  "    document.addEventListener('DOMContentLoaded', function () {\n" +
  '      MJ.ui.init();\n' +
  '    });\n' +
  '  </script>';
html = html.replace(initRe, combined);

if (/<script src=|<link rel="stylesheet" href=/.test(html)) {
  throw new Error('内联失败：仍存在外部引用');
}

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
console.log('已生成 dist/index.html（' + html.length + ' 字节，零外部依赖）');
