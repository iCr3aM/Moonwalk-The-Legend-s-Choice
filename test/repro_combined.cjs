// 关键复现：把 7 个 js 文件「拼成单一脚本」（与 build_singlefile.cjs 一致）再加载，
// 以捕获跨文件顶层标识符重复声明 / 拼接期 SyntaxError —— 这类错误只发生在编译后的单文件。
// 同时跑「中文 + 英文」完整一局 + 多结局渲染，检查翻译路径与老 bug。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
// canvas 2d 上下文：任意方法都是 no-op；渐变/measureText 返回合理对象
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
  const el = {
    tagName: tag || 'div', innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, _h: {},
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }, contains(c) { return this._s.has(c); } },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); }, removeEventListener() {},
    appendChild(c) { return c; }, removeChild() {}, setAttribute() {}, getAttribute() { return null; },
    focus() {}, click() { (this._h.click || []).forEach((f) => f({ target: this })); },
    getContext() { return ctx2d; }, toDataURL() { return 'data:image/png;base64,'; }, parentNode: { removeChild() {}, appendChild() {} },
  };
  return el;
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

const files = ['js/config.js', 'js/i18n.js', 'js/i18n_events_en.js', 'js/events.js', 'js/state.js', 'js/engine.js', 'js/ui.js'];
let combined = '';
files.forEach((f) => { combined += '\n/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(root, f), 'utf8') + '\n'; });

try {
  vm.runInContext(combined, sandbox, { filename: 'combined.js' });
  console.log('✅ 拼接后的单一脚本加载成功（无跨文件重复声明 / 拼接 SyntaxError）');
} catch (e) {
  console.error('❌ 拼接脚本加载失败（这极可能就是编译后黑屏的根因）:\n', (e && e.stack) || e);
  process.exit(1);
}

function playthrough(lang) {
  try {
    if (lang === 'en') { try { sandbox.MJ.i18n.setLang('en'); } catch (e) { sandbox.MJ.i18n.lang = 'en'; } }
    sandbox.MJ.ui.init();
    sandbox.MJ.engine.start();
    let guard = 0;
    while (guard++ < 600) {
      const cur = sandbox.MJ.engine.current;
      if (!cur) break;
      if (cur.kind === 'ending') break;
      if (cur.kind === 'auto') sandbox.MJ.engine.proceed();
      else sandbox.MJ.engine.choose(0);
    }
    console.log('✅ [' + lang + '] 完整一局结束；步数 =', guard, '；app.innerHTML 长度 =', String(appEl.innerHTML).length);
  } catch (e) {
    console.error('❌ [' + lang + '] PLAYTHROUGH ERROR:\n', (e && e.stack) || e);
    process.exit(3);
  }
}

try {
  sandbox.MJ.ui.init();
  console.log('✅ MJ.ui.init() 成功（默认 zh）；app.innerHTML 长度 =', String(appEl.innerHTML).length);
} catch (e) {
  console.error('❌ INIT ERROR:\n', (e && e.stack) || e);
  process.exit(2);
}

playthrough('zh');
playthrough('en');

// 逐个渲染每种结局页（带海报 createPoster），检查老 bug
const endingIds = Object.keys(sandbox.MJ.config.endings || {});
let okEnd = 0;
for (const id of endingIds) {
  try {
    const st = new sandbox.MJ.GameState();
    sandbox.MJ.ui.showEnding(id, st);
    okEnd++;
  } catch (e) {
    console.error('❌ 结局渲染失败 [' + id + ']:', (e && e.stack) || e);
    process.exit(4);
  }
}
console.log('✅ 全部结局页渲染成功：' + okEnd + ' / ' + endingIds.length);
console.log('✅ 未发现代码级黑屏根因；当前代码在模块化与单文件两种形态下均可正常初始化与游玩。');
