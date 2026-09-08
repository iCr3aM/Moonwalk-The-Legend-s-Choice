// 真机 E2E 回归套件（Playwright 无头 Chromium）。
// 三种模式：
//   1) 随机回归（默认）：真实加载 index.html，桌面+移动随机真机游玩，捕获 console.error/pageerror/warning，断言皆抵达结局。
//   2) 定向结局（--endings / --target ending END_XXX）：用 resolveEnding 反推的"人设"套到真实 GameState，调真实 showEnding 渲染海报并断言落到的就是目标结局、#poster-box 已渲染。
//   3) 定向彩蛋（--eggs / --target egg EGG_XXX）：按 cond(checkFlags/revealAll) / 孤儿 flag(checkFlags) / 特殊(onEnding/incPlaythroughs) 三类真实解锁路径逐枚验证。
// 退出码：全部通过 0，否则 1。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOT = path.resolve(__dirname, '_e2e_shots');
fs.mkdirSync(SHOT, { recursive: true });
const REPORT = path.resolve(__dirname, '_e2e_report.json');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };

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

const errors = [];
const warns = [];

async function newPage(browser, viewport, personas) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error') errors.push(`[console.error] ${m.text()}`);
    else if (t === 'warning') warns.push(`[console.warn] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  // MJ 已加载后钩住 ui.showEnding，捕获真实结局 id
  await page.evaluate(() => {
    window.__ending = null;
    const w = window;
    if (w.MJ && w.MJ.ui && w.MJ.ui.showEnding) {
      const _se = w.MJ.ui.showEnding;
      w.MJ.ui.showEnding = function (id, s) { window.__ending = id; return _se.apply(this, arguments); };
    }
  });
  if (personas) await page.evaluate((P) => { window.__PERSONAS = P; }, personas);
  return { ctx, page };
}

// ——— 模式 1：随机回归 ———
async function randomRun(browser, { viewport, name, maxSteps }) {
  const { ctx, page } = await newPage(browser, viewport);
  await page.screenshot({ path: path.join(SHOT, `${name}-00-menu.png`) });
  const started = await page.$('#btn-new');
  if (!started) { errors.push(`[${name}] 未找到 #btn-new（主菜单未渲染）`); await ctx.close(); return { name, fatal: true }; }
  await started.click();
  await page.waitForTimeout(500);
  let steps = 0, shotMid = false, reachedEnding = false;
  for (let i = 0; i < maxSteps; i++) {
    if (await page.$('#poster-box')) { reachedEnding = true; break; }
    const opts = await page.$$('.option');
    if (opts.length) await opts[Math.floor(Math.random() * opts.length)].click();
    else if (await page.$('#btn-era')) await (await page.$('#btn-era')).click();
    else if (await page.$('#btn-next')) await (await page.$('#btn-next')).click();
    else if (await page.$('#btn-end')) await (await page.$('#btn-end')).click();
    else { errors.push(`[${name}] 第 ${steps} 步无可选操作且非结局，疑似卡死`); break; }
    steps++;
    await page.waitForTimeout(180);
    if (!shotMid && steps === 8) { await page.screenshot({ path: path.join(SHOT, `${name}-08-mid.png`) }); shotMid = true; }
  }
  let info = {};
  try {
    info = await page.evaluate(() => {
      const st = (window.MJ && window.MJ.engine && window.MJ.engine.state) || {};
      const eid = (window.MJ.engine.state && window.MJ.engine.state.ending) || window.__ending;
      return { ending: eid, attrs: st.attributes || null, events: (st.stats && st.stats.events) || null };
    });
  } catch (e) { info = { evalErr: String(e) }; }
  await page.screenshot({ path: path.join(SHOT, `${name}-end.png`) });
  await ctx.close();
  return { name, steps, reachedEnding, ...info };
}

// ——— 模式 2：定向结局 ———
// 用 resolveEnding 反推的人设（已按级联顺序校验）。缺项或校验失败时用偏置随机搜索兜底。
const PERSONAS = {
  END_PLAIN: { entryId: 'END_PLAIN' },
  END_TRUE_ETERNAL: { attributes: { health: 75, reputation: 85, wealth: 50, family: 50, art: 85, stress: 20, media: 50, loneliness: 20 }, flags: { thriller25: true, anniv2001: true, isSolo: true }, meta: { phil: 3, artPath: 2 } },
  END_ALT_SURVIVE_LEGACY: { attributes: { health: 60, reputation: 60, wealth: 60, family: 60, art: 60, stress: 30, media: 50, loneliness: 30 }, flags: { survived2009: true, isSolo: true }, meta: {}, timeline: { '2009': 'survive' } },
  END_SURVIVE_DEBT: { attributes: { health: 20, reputation: 50, wealth: 0, family: 50, art: 50, stress: 60, media: 50, loneliness: 40 }, flags: { isPepsiBurned: true, isSolo: true }, meta: {}, debt: true },
  END_FINANCIAL: { attributes: { health: 50, reputation: 60, wealth: 20, family: 50, art: 50, stress: 50, media: 50, loneliness: 40 }, flags: { isSolo: true, thisItHeld: true }, meta: {}, debt: true },
  END_TRAGIC: { attributes: { health: 20, reputation: 50, wealth: 50, family: 50, art: 50, stress: 60, media: 50, loneliness: 40 }, flags: { isPepsiBurned: true, isSolo: true }, meta: {} },
  END_ART_PEAK: { attributes: { health: 50, reputation: 60, wealth: 50, family: 50, art: 60, stress: 40, media: 50, loneliness: 30 }, flags: { isPepsiBurned: true, thisItHeld: true, isSolo: true }, meta: {} },
  END_CONTROVERSIAL: { attributes: { health: 60, reputation: 60, wealth: 50, family: 50, art: 50, stress: 40, media: 50, loneliness: 40 }, flags: { settlement1993: true, isSolo: true }, meta: {} },
  END_RECLUSE_SERENE: { attributes: { health: 60, reputation: 50, wealth: 50, family: 50, art: 50, stress: 30, media: 50, loneliness: 40 }, flags: { isSolo: true }, meta: { recluse: 3 } },
  END_RECLUSE: { attributes: { health: 40, reputation: 50, wealth: 50, family: 50, art: 50, stress: 30, media: 50, loneliness: 60 }, flags: { isSolo: true }, meta: { recluse: 3 } },
  END_FAMILY: { attributes: { health: 60, reputation: 60, wealth: 50, family: 70, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: false }, meta: {} },
  END_MOGUL: { attributes: { health: 60, reputation: 80, wealth: 70, family: 50, art: 50, stress: 40, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: { mogul: 3 } },
  END_INNOVATOR: { attributes: { health: 60, reputation: 80, wealth: 50, family: 50, art: 75, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true, cp_innovation: 80 }, meta: { mogul: 1 } },
  END_PERFECT: { attributes: { health: 60, reputation: 60, wealth: 40, family: 50, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {} },
  END_STATESMAN: { attributes: { health: 60, reputation: 70, wealth: 50, family: 55, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: { phil: 3 } },
  END_PHILANTHROPIST: { attributes: { health: 60, reputation: 60, wealth: 50, family: 40, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: { phil: 3 } },
  END_MENTOR: { attributes: { health: 60, reputation: 60, wealth: 50, family: 45, art: 45, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: { collab: 1 } },
  END_ETERNAL: { attributes: { health: 50, reputation: 60, wealth: 50, family: 40, art: 65, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true, thriller25: true }, meta: {} },
  END_HOMEBODY: { attributes: { health: 60, reputation: 50, wealth: 50, family: 75, art: 40, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {} },
  END_LONELY_KING: { attributes: { health: 50, reputation: 50, wealth: 50, family: 40, art: 50, stress: 30, media: 50, loneliness: 75 }, flags: { isSolo: true }, meta: {} },
  END_OVERWORKED: { attributes: { health: 40, reputation: 60, wealth: 50, family: 50, art: 50, stress: 90, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {} },
  END_BURNT_OUT: { attributes: { health: 35, reputation: 85, wealth: 50, family: 50, art: 50, stress: 40, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {} },
  END_QUIET_LIFE: { attributes: { health: 55, reputation: 55, wealth: 40, family: 40, art: 40, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {} },
  END_ALT_STAY_MOTOWN: { attributes: { health: 60, reputation: 60, wealth: 50, family: 60, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {}, timeline: { '1975': 'motown' } },
  END_ALT_NO_QJ: { attributes: { health: 60, reputation: 60, wealth: 50, family: 60, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {}, timeline: { '1979': 'solo_prod' } },
  END_ALT_HEALED: { attributes: { health: 60, reputation: 60, wealth: 50, family: 60, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {}, timeline: { '1984': 'safe' } },
  END_ALT_MEDIA_MOGUL: { attributes: { health: 60, reputation: 60, wealth: 50, family: 60, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true }, meta: {}, timeline: { 'biz': 'empire' } },
  END_ALT_PEACE_LAUREATE: { attributes: { health: 60, reputation: 60, wealth: 50, family: 60, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true, altPeace: true }, meta: {} },
  END_ALT_QUIET_RETIREE: { attributes: { health: 60, reputation: 60, wealth: 50, family: 60, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true, altQuietRetiree: true }, meta: {} },
  END_TIMELESS_PRESENT: { attributes: { health: 50, reputation: 50, wealth: 50, family: 50, art: 50, stress: 30, media: 50, loneliness: 30 }, flags: { isSolo: true, survived2009: true }, meta: {} },
};

async function targetedEnding(browser, endingId) {
  const { ctx, page } = await newPage(browser, { width: 1366, height: 768 }, PERSONAS);
  const res = await page.evaluate((endingId) => {
    const p = (window.__PERSONAS && window.__PERSONAS[endingId]) || null;
    // 兜底：偏置随机搜索一个能命中该结局的人设
    function findPersona(T) {
      const attrKeys = ['health', 'reputation', 'wealth', 'family', 'art', 'stress', 'media', 'loneliness'];
      const flagCands = ['isPepsiBurned', 'painkillerDependent', 'thisItHeld', 'settlement1993', 'secondCharge', 'thriller25', 'anniv2001', 'isSolo', 'survived2009', 'healWorld', 'ghosts', 'bubbles', 'grammy_history', 'altPeace', 'altQuietRetiree', 'motown', 'epic', 'solo_prod', 'safe', 'empire', 'cp_innovation'];
      const metaKeys = ['phil', 'artPath', 'mogul', 'collab', 'recluse', 'grammyWins'];
      for (let it = 0; it < 800000; it++) {
        const attributes = {}; attrKeys.forEach((k) => { const r = Math.random(); attributes[k] = r < 0.34 ? Math.floor(Math.random() * 41) : r < 0.67 ? 41 + Math.floor(Math.random() * 40) : 81 + Math.floor(Math.random() * 20); });
        const flags = {}; flagCands.forEach((k) => { if (Math.random() < 0.5) flags[k] = true; });
        const meta = {}; metaKeys.forEach((k) => { meta[k] = Math.floor(Math.random() * 4); });
        const debt = Math.random() < 0.3;
        const timeline = {}; const tlKeys = { '1975': 'motown', '1979': 'solo_prod', '1984': 'safe', 'biz': 'empire' };
        if (Math.random() < 0.5) { const ks = Object.keys(tlKeys); const k = ks[Math.floor(Math.random() * ks.length)]; timeline[k] = tlKeys[k]; }
        const st = { flags, attributes, meta, debt, timeline };
        if (MJ.resolveEnding(st, T === 'END_PLAIN' ? 'END_PLAIN' : null) === T) return st;
      }
      return null;
    }
    const persona = p || findPersona(endingId);
    if (!persona) return { ok: false, reason: 'persona-not-found keys=' + (PERSONAS ? Object.keys(PERSONAS).length : 'undef') + ' hasKey=' + (PERSONAS ? !!PERSONAS[endingId] : 'n/a') };
    // 用真实 GameState 校验人设确实解析到目标结局
    const bare = { flags: persona.flags || {}, attributes: persona.attributes || {}, meta: persona.meta || {}, debt: !!persona.debt, timeline: persona.timeline || {} };
    const expected = MJ.resolveEnding(bare, persona.entryId || (endingId === 'END_PLAIN' ? 'END_PLAIN' : null));
    MJ.engine.start();
    const st = MJ.engine.state;
    Object.assign(st.attributes, persona.attributes || {});
    Object.assign(st.flags, persona.flags || {});
    Object.assign(st.meta, persona.meta || {});
    st.debt = !!persona.debt;
    st.timeline = persona.timeline || {};
    window.__ending = null;
    MJ.engine.showEnding(persona.entryId || (endingId === 'END_PLAIN' ? 'END_PLAIN' : null));
    return { ok: true, expected, resolved: window.__ending, match: expected === endingId, rendered: expected === window.__ending, hasPoster: !!document.getElementById('poster-box') };
  }, endingId);
  if (!res.ok) errors.push(`[ending ${endingId}] ${res.reason}`);
  else if (!res.rendered || !res.hasPoster || !res.match) errors.push(`[ending ${endingId}] 人设解析=${res.expected} 渲染=${res.resolved} poster=${res.hasPoster} 目标匹配=${res.match}`);
  await ctx.close();
  return { id: endingId, ...res };
}

// ——— 模式 3：定向彩蛋 ———
async function targetedEgg(browser, eggId) {
  const { ctx, page } = await newPage(browser, { width: 1366, height: 768 });
  const res = await page.evaluate((eggId) => {
    MJ.eggSystem.clear();
    MJ.engine.start();
    const st = MJ.engine.state;
    const def = MJ.eggSystem.defs[eggId];
    if (!def) return { ok: false, reason: 'no-def' };
    function baseState() {
      return {
        flags: {}, attributes: { health: 50, reputation: 50, wealth: 50, family: 50, art: 50, stress: 30, media: 50, loneliness: 30, phil: 20 },
        meta: { phil: 0, artPath: 0, mogul: 0, collab: 0, recluse: 0, grammyWins: 0 }, debt: false, timeline: {}, relations: { brothers: 0 },
      };
    }
    if (def.cond) {
      let found = null;
      const flagCands = ['thriller25', 'anniv2001', 'isSolo', 'survived2009', 'healWorld', 'ghosts', 'bubbles', 'grammy_history', 'altPeace', 'altQuietRetiree', 'cp_innovation', 'bubbles2'];
      for (let i = 0; i < 400000; i++) {
        const s = baseState();
        ['health', 'reputation', 'wealth', 'family', 'art', 'stress', 'media', 'loneliness', 'phil'].forEach((k) => { const r = Math.random(); s.attributes[k] = r < 0.34 ? Math.floor(Math.random() * 41) : r < 0.67 ? 41 + Math.floor(Math.random() * 40) : 81 + Math.floor(Math.random() * 20); });
        ['phil', 'artPath', 'mogul', 'collab', 'recluse', 'grammyWins'].forEach((k) => { s.meta[k] = Math.floor(Math.random() * 4); });
        flagCands.forEach((k) => { if (Math.random() < 0.5) s.flags[k] = true; });
        s.relations.brothers = Math.floor(Math.random() * 13);
        s.flags.isSolo = true;
        try { if (def.cond(s)) { found = s; break; } } catch (e) {}
      }
      if (!found) return { ok: false, reason: 'cond-not-satisfied' };
      Object.assign(st.attributes, found.attributes); Object.assign(st.flags, found.flags); Object.assign(st.meta, found.meta);
      st.debt = found.debt; st.timeline = found.timeline; st.relations = found.relations;
      MJ.eggSystem.revealAll(st);
      return { ok: MJ.eggSystem.isFound(eggId), method: 'cond' };
    }
    if (eggId === 'EGG_TRIBUTE') { st.meta.artPath = 2; st.flags.anniv2001 = true; st.flags.thriller25 = true; MJ.eggSystem.onEnding(st, 'END_ETERNAL'); return { ok: MJ.eggSystem.isFound(eggId), method: 'onEnding' }; }
    if (eggId === 'EGG_DEV') { MJ.config.achievements.forEach((a) => MJ.achievementSystem.unlock(a.id)); MJ.eggSystem.onEnding(st, 'END_ETERNAL'); return { ok: MJ.eggSystem.isFound(eggId), method: 'onEnding' }; }
    if (eggId === 'EGG_FOURTH') { for (let i = 0; i < 5; i++) MJ.eggSystem.incPlaythroughs(); return { ok: MJ.eggSystem.isFound(eggId), method: 'incPlaythroughs' }; }
    const orphans = { EGG_GARY: 'garyRoots', EGG_APOLLO: 'apolloChampion', EGG_CAPTAINEO: 'captainEO', EGG_MOONWALKER: 'moonwalker', EGG_GHOSTS: 'ghosts', EGG_BUBBLES: 'bubbles', EGG_HALFTIME: 'superBowl' };
    if (orphans[eggId]) st.flags[orphans[eggId]] = true; else st.flags['egg_' + eggId.slice(4).toLowerCase()] = true;
    MJ.eggSystem.checkFlags(st);
    return { ok: MJ.eggSystem.isFound(eggId), method: 'checkFlags' };
  }, eggId);
  if (!res.ok) errors.push(`[egg ${eggId}] ${res.reason || '未解锁'}`);
  await ctx.close();
  return { id: eggId, ...res };
}

(async () => {
  const argv = process.argv.slice(2);
  const mode = argv.includes('--endings') ? 'endings' : argv.includes('--eggs') ? 'eggs' : 'random';
  let target = null;
  const ti = argv.indexOf('--target');
  if (ti >= 0) target = { kind: argv[ti + 1], id: argv[ti + 2] };

  const server = await serve(ROOT, 8123);
  const browser = await chromium.launch({ headless: true });
  const report = { mode, results: [], errors: 0, warns: 0 };

  try {
    if (target) {
      const r = target.kind === 'ending' ? await targetedEnding(browser, target.id) : await targetedEgg(browser, target.id);
      report.results.push(r);
    } else if (mode === 'endings') {
      const ids = await (await newPage(browser, { width: 1366, height: 768 })).page.evaluate(() => Object.keys(MJ.config.endings));
      for (const id of ids) report.results.push(await targetedEnding(browser, id));
    } else if (mode === 'eggs') {
      const ids = await (await newPage(browser, { width: 1366, height: 768 })).page.evaluate(() => Object.keys(MJ.eggSystem.defs));
      for (const id of ids) report.results.push(await targetedEgg(browser, id));
    } else {
      const runs = [
        { viewport: { width: 1366, height: 768 }, name: 'desktop-1', maxSteps: 320 },
        { viewport: { width: 1366, height: 768 }, name: 'desktop-2', maxSteps: 320 },
        { viewport: { width: 1366, height: 768 }, name: 'desktop-3', maxSteps: 320 },
        { viewport: { width: 1366, height: 768 }, name: 'desktop-4', maxSteps: 320 },
        { viewport: { width: 390, height: 844 }, name: 'mobile-1', maxSteps: 320 },
        { viewport: { width: 390, height: 844 }, name: 'mobile-2', maxSteps: 320 },
      ];
      for (const r of runs) report.results.push(await randomRun(browser, r));
    }
  } catch (e) { errors.push('运行异常: ' + e.message); }

  await browser.close();
  server.close();
  report.errors = errors.length; report.warns = warns.length;
  try { fs.writeFileSync(REPORT, JSON.stringify(report, null, 2)); } catch (e) {}

  // 输出
  console.log('\n===== E2E 真机结果（模式：' + mode + (target ? ' / ' + target.kind + ' ' + target.id : '') + '）=====');
  const pass = report.results.filter((r) => r.ok !== false && !r.fatal && (r.reachedEnding !== false)).length;
  for (const r of report.results) {
    if (mode === 'random') console.log(`- ${r.name}: steps=${r.steps} reachedEnding=${r.reachedEnding} ending=${r.ending || '?'}` + (r.attrs ? ` | H${r.attrs.health} R${r.attrs.reputation} W${r.attrs.wealth} F${r.attrs.family} A${r.attrs.art} S${r.attrs.stress}` : ''));
    else if (mode === 'endings') console.log(`- ${r.id}: ${r.ok ? 'OK' : 'FAIL'} 解析=${r.expected} 渲染=${r.resolved} poster=${r.hasPoster} 目标匹配=${r.match}`);
    else if (mode === 'eggs') console.log(`- ${r.id}: ${r.ok ? 'OK' : 'FAIL'}${r.method ? ' (' + r.method + ')' : ''}${r.reason ? ' ' + r.reason : ''}`);
  }
  console.log(`\n结果：${pass}/${report.results.length} 通过`);
  console.log(`控制台 ERROR / 未捕获异常：${errors.length}`);
  errors.slice(0, 50).forEach((e) => console.log('  ✗ ' + e));
  console.log(`控制台 WARNING：${warns.length}`);
  warns.slice(0, 20).forEach((w) => console.log('  ⚠ ' + w));

  const failed = pass < report.results.length || errors.length > 0;
  process.exit(failed ? 1 : 0);
})();
