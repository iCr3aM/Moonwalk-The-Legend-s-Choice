// 多设备 UI 截图验证工具（不入门禁）：模拟 4 种手机/平板 × 中英双语，
// 截主菜单/事件卡/结局页/图鉴/海报弹窗/人物志，并做水平溢出检测。
// 用法：node test/_ui_screenshots.cjs   → 输出到 test/_ui_shots/
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOT = path.resolve(__dirname, '_ui_shots');
fs.rmSync(SHOT, { recursive: true, force: true });
fs.mkdirSync(SHOT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
function serve(root, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const fp = path.join(root, p);
      if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
      res.setHeader('Content-Type', MIME[path.extname(fp)] || 'application/octet-stream');
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

const DEVICES = [
  ['se', 320, 568],      // iPhone SE1 最窄
  ['android', 360, 740], // Android 主流
  ['iphone', 375, 812],  // iPhone X
  ['ipad', 768, 1024],   // iPad 竖屏
];
const ENDING = 'END_TRUE_ETERNAL'; // legendary：稀有度 pill/辉光/隐藏徽章全场景
const PERSONA = {
  attributes: { health: 75, reputation: 85, wealth: 50, family: 50, art: 85, stress: 20, media: 50, loneliness: 20 },
  flags: { thriller25: true, anniv2001: true, isSolo: true },
  meta: { phil: 3, artPath: 2 },
};

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOT, name + '.png') });
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

(async () => {
  const server = await serve(ROOT, 8124);
  const browser = await chromium.launch();
  const problems = [];
  for (const [dev, w, h] of DEVICES) {
    for (const lang of ['zh', 'en']) {
      const tag = `${dev}-${lang}`;
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addInitScript((l) => { try { window.localStorage.setItem('mj_lang', l); } catch (e) {} }, lang);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => problems.push(`[${tag}] pageerror: ${e.message}`));
      await page.goto('http://127.0.0.1:8124/index.html', { waitUntil: 'load' });
      await page.waitForTimeout(400);

      // 1) 主菜单
      await shot(page, `1-menu-${tag}`);
      let ov = await overflow(page);
      if (ov > 1) problems.push(`[${tag}] 主菜单水平溢出 ${ov}px（#3 检查点）`);

      // 2) 事件卡（新开一局，首个事件）
      const btnNew = await page.$('#btn-new');
      if (btnNew) { await btnNew.click(); await page.waitForTimeout(400); }
      await shot(page, `2-event-${tag}`);
      ov = await overflow(page);
      if (ov > 1) problems.push(`[${tag}] 事件卡水平溢出 ${ov}px`);

      // 3) 结局页（定向 END_TRUE_ETERNAL，真实 showEnding 渲染）
      await page.evaluate((P) => {
        MJ.engine.start();
        const st = MJ.engine.state;
        Object.assign(st.attributes, P.attributes);
        Object.assign(st.flags, P.flags);
        Object.assign(st.meta, P.meta);
        MJ.engine.showEnding(null);
      }, PERSONA);
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SHOT, `3-ending-${tag}.png`), fullPage: true });
      ov = await overflow(page);
      if (ov > 1) problems.push(`[${tag}] 结局页水平溢出 ${ov}px`);

      // 4) 结局图鉴
      const bg = await page.$('#btn-gallery-end');
      if (bg) { await bg.click(); await page.waitForTimeout(300); await shot(page, `4-gallery-${tag}`); }
      await page.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove()));
      await page.waitForTimeout(150);

      // 5) 成就图鉴
      const ba = await page.$('#btn-ach-end');
      if (ba) { await ba.click(); await page.waitForTimeout(300); await shot(page, `5-ach-${tag}`); }
      await page.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove()));
      await page.waitForTimeout(150);

      // 6) 海报弹窗（#4 poster-foot-actions 检查点）
      const thumb = await page.$('.poster-thumb-btn');
      if (thumb) { await thumb.click(); await page.waitForTimeout(500); await shot(page, `6-poster-${tag}`); }

      // 7) 人物志（#12 检查点）
      await page.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove()));
      const bc = await page.$('#btn-collab');
      if (bc) { await bc.click(); await page.waitForTimeout(300); await shot(page, `7-collab-${tag}`); }

      await ctx.close();
    }
  }
  await browser.close();
  server.close();
  console.log('截图输出：' + SHOT);
  if (problems.length) {
    console.log('\n=== 自动检测结果（水平溢出 / 报错）===');
    problems.forEach((p) => console.log('  ' + p));
  } else {
    console.log('\n自动检测：4 设备 × 2 语言 × 全场景无水平溢出、无 pageerror');
  }
})();
