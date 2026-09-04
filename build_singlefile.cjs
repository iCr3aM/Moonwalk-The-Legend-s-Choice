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
  'js/planner.js',
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

// 1) 内联 CSS（用函数式替换，避免 css 内容里的 $&/$'/$\`/$$ 被当作特殊模式解释）
html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css" \/>/,
  function () { return '<style>\n' + css + '\n</style>'; }
);

// 2) 删除所有外部 js 引用
html = html.replace(/<script src="js\/[^"]+"><\/script>/g, '');

// 3) 把内联脚本 + 初始化脚本放回（保留原 DOMContentLoaded 初始化，并加错误浮层避免静默黑屏）
const initRe = /<script>\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/;
var bootScript =
  "    document.addEventListener('DOMContentLoaded', function () {\n" +
  "      function showFatal(e) {\n" +
  "        var app = document.getElementById('app');\n" +
  "        if (!app || app.dataset.fatal) return;\n" +
  "        app.dataset.fatal = '1';\n" +
  "        var m = (e && e.error && e.error.stack) ? e.error.stack : ((e && e.message) ? e.message : String(e));\n" +
  "        app.innerHTML = '<div style=\"padding:28px;color:#f3e2b0;font-family:sans-serif;line-height:1.6\">' +\n" +
  "          '<h2 style=\"color:#ffb4b4\">运行时出错（请把这段信息反馈给开发者）</h2>' +\n" +
  "          '<pre style=\"white-space:pre-wrap;word-break:break-word;color:#ffd2d2;font-size:13px\">' + m + '</pre></div>';\n" +
  "      }\n" +
  "      window.addEventListener('error', showFatal);\n" +
  "      try { MJ.ui.init(); } catch (e) { showFatal(e); throw e; }\n" +
  "    });\n";
const combined = '<script>\n' + js + '\n</script>\n  <script>\n' + bootScript + '  </script>';
// 关键：必须用函数式替换！combined 内含 ui.js 的 `'$'`，若用字符串替换会被 String.replace
// 解释成特殊模式 $'（匹配项之后的文本 = 原 HTML 的 </body></html>），从而污染脚本导致整段
// SyntaxError、MJ 未定义、黑屏。函数返回值原样插入，不做 $ 解释。
html = html.replace(initRe, function () { return combined; });

if (/<script src=|<link rel="stylesheet" href=/.test(html)) {
  throw new Error('内联失败：仍存在外部引用');
}

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
console.log('已生成 dist/index.html（' + html.length + ' 字节，零外部依赖）');
