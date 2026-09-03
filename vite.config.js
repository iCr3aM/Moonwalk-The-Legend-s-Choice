/* Vite 单文件构建配置（M2）
 * 设计要点：源码保持「经典脚本 + 双击即运行」不变（见 index.html / README）。
 * 本配置在构建期把 index.html 中引用的 css 与 5 个 js 全部内联，
 * 产出 dist/index.html 单一文件，便于部署分发，且内联脚本在 file:// 下亦可双击运行。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const root = path.dirname(fileURLToPath(import.meta.url));

// 把 <script src="js/x.js"> 就地内联为 <script>...</script>（经典脚本，无需 type=module）
function inlineClassicScripts() {
  return {
    name: 'inline-classic-scripts',
    transformIndexHtml(html) {
      return html.replace(/<script\s+src="([^"]+js)"><\/script>/g, function (_, p) {
        const code = fs.readFileSync(path.resolve(root, p), 'utf8');
        return '<script>' + code.replace(/<\/script>/gi, '<\\/script>') + '</script>';
      });
    }
  };
}

export default defineConfig({
  // 关闭 Vite 对入口脚本的模块化处理，交由上面的插件内联
  plugins: [inlineClassicScripts(), viteSingleFile()],
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    emptyOutDir: true
  }
});
