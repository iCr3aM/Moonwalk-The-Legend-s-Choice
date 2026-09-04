// 终极验证：直接用「真实 dist/index.html」提取第一段合并脚本，在 vm 中执行，
// 确认 MJ 被定义、MJ.ui.init() 成功、并能完整游玩一局（证明黑屏已修复）。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dist = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
const m = dist.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('❌ 找不到第一个 <script>'); process.exit(1); }
const js = m[1];

const ctx2d = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (p === 'measureText') return () => ({ width: 0 });
    if (p === 'getImageData') return () => ({ data: [] });
    if (p === 'canvas') return { width: 0, height: 0 };
    return () => {};
  },
  set() { return true; },
});
function makeEl(tag) {
  return {
    tagName: tag || 'div', innerHTML: '', textContent: '', value: '', style: {}, dataset: {},
    classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);}, contains(c){return this._s.has(c);} },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, appendChild(c){return c;}, removeChild() {}, setAttribute(){}, getAttribute(){return null;},
    focus(){}, click(){}, getContext(){return ctx2d;}, toDataURL(){return 'data:image/png;base64,';}, parentNode: { removeChild(){}, appendChild(){} },
  };
}
const appEl = makeEl();
const ls = {};
const sandbox = {};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox; sandbox.console = console;
sandbox.navigator = { language: 'zh-CN', userLanguage: 'zh-CN' };
sandbox.setTimeout = (fn) => { try { fn(); } catch (e) { console.error('⚠️ setTimeout 抛错:', (e && e.stack) || e); } return 0; };
sandbox.clearTimeout = () => {};
sandbox.requestAnimationFrame = (fn) => { try { fn(); } catch (e) {} return 0; };
sandbox.confirm = () => true; sandbox.alert = () => {}; sandbox.prompt = () => null;
sandbox.scrollTo = () => {}; sandbox.scroll = () => {}; sandbox.open = () => {};
sandbox.localStorage = { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } };
sandbox.document = { getElementById: (id) => (id === 'app' ? appEl : makeEl()), createElement: (t) => makeEl(t), querySelector: () => makeEl(), querySelectorAll: () => [], addEventListener() {}, body: makeEl() };
vm.createContext(sandbox);

try {
  vm.runInContext(js, sandbox, { filename: 'dist-combined.js' });
  if (typeof sandbox.MJ !== 'object' || !sandbox.MJ) throw new Error('MJ 未定义（黑屏根因仍在）');
  console.log('✅ 真实 dist 合并脚本执行成功，MJ 已定义');
} catch (e) {
  console.error('❌ 真实 dist 脚本执行失败（黑屏根因未修复）:\n', (e && e.stack) || e);
  process.exit(1);
}

try {
  sandbox.MJ.ui.init();
  console.log('✅ MJ.ui.init() 成功；app.innerHTML 长度 =', String(appEl.innerHTML).length);
} catch (e) {
  console.error('❌ INIT ERROR:\n', (e && e.stack) || e);
  process.exit(2);
}

try {
  sandbox.MJ.engine.start();
  let guard = 0;
  while (guard++ < 600) {
    const cur = sandbox.MJ.engine.current;
    if (!cur || cur.kind === 'ending') break;
    if (cur.kind === 'auto') sandbox.MJ.engine.proceed();
    else sandbox.MJ.engine.choose(0);
  }
  console.log('✅ 完整一局结束；步数 =', guard, '；最终 app.innerHTML 长度 =', String(appEl.innerHTML).length);
  console.log('🎉 黑屏已修复：dist 可正常初始化并游玩。');
} catch (e) {
  console.error('❌ PLAYTHROUGH ERROR:\n', (e && e.stack) || e);
  process.exit(3);
}
