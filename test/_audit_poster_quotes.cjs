// 核查海报名言每条在 zh/en 下是否均 ≤2 行（复刻 ui.js createPoster 的 wrapCenter 逻辑）
// maxW = W-120 = 600px，字号 italic 15px（方案 B）
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js', 'ui.js'), 'utf8');
const m = src.match(/var MJ_POSTER_QUOTES = (\[[\s\S]*?\n  \]);/);
if (!m) { console.error('MJ_POSTER_QUOTES not found'); process.exit(1); }
const arr = eval(m[1]);
const W = 720, maxW = W - 120; // 600

// 文本宽度测量：优先 node-canvas 真实度量，否则保守近似（过估以避免漏报溢出）
let measure, mode;
try {
  const { createCanvas } = require('canvas');
  const ctx = createCanvas(10, 10).getContext('2d');
  ctx.font = 'italic 15px "PingFang SC", sans-serif';
  measure = (s) => ctx.measureText(s).width;
  mode = 'node-canvas 真实度量';
} catch (e) {
  mode = '近似度量（无 canvas，宽度略过估以兜底）';
  measure = (s) => {
    let w = 0;
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x2E80 && cp <= 0x9FFF) w += 15.5;        // CJK 汉字
      else if (cp >= 0x3000 && cp <= 0x303F) w += 15.5;   // CJK 标点（。，（）？）
      else if (cp >= 0xFF00 && cp <= 0xFFEF) w += 15.5;   // 全角形
      else if (ch === ' ') w += 4.2;
      else if (/[0-9]/.test(ch)) w += 8.2;
      else if (/[A-Za-z]/.test(ch)) w += 7.8;             // 拉丁，过估
      else if (cp >= 0x2018 && cp <= 0x201F) w += 4.6;    // 弯引号（窄）
      else w += 5.0;                                      // 其它标点
    }
    return w;
  };
}

function wrapCenter(text, maxW) {
  const lines = []; let cur = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (measure(cur + ch) > maxW && cur) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

console.log(`[measure] ${mode}；maxW=${maxW}px，字号 italic 15px`);
console.log(`[total] MJ_POSTER_QUOTES 共 ${arr.length} 条\n`);

let bad = 0;
const rows = [];
arr.forEach((q, i) => {
  const zl = wrapCenter(q.zh || '', maxW).length;
  const el = wrapCenter(q.en || '', maxW).length;
  const maxLine = Math.max(zl, el);
  const flag = maxLine > 2 ? '  <<< 超 2 行' : '';
  if (maxLine > 2) bad++;
  rows.push({ i: i + 1, zl, el, maxLine, flag });
});

console.log('idx | zh行 | en行 | max | 备注');
console.log('----+------+------+-----+------');
rows.forEach(r => {
  console.log(
    String(r.i).padStart(3) + ' | ' +
    String(r.zl).padStart(4) + ' | ' +
    String(r.el).padStart(4) + ' | ' +
    String(r.maxLine).padStart(3) + ' | ' + r.flag
  );
});

console.log('');
if (bad === 0) {
  console.log(`PASS ✅ 全部 ${arr.length} 条在 zh/en 下均 ≤2 行，方案 B 布局安全。`);
  process.exit(0);
} else {
  console.log(`FAIL ❌ 有 ${bad} 条超过 2 行，需缩短或调整布局。`);
  process.exit(1);
}
