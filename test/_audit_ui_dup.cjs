// UI 重复文案扫描：提取 ui.js 中的中文字面量，找出重复出现（≥2 次）者，供人工研判是否"同一视图内冗余显示"
var fs = require('fs');
var p = require('path').resolve(__dirname, '../js/ui.js');
var src = fs.readFileSync(p, 'utf8');
var re = /'([^']*[\u4e00-\u9fff][^']*)'|"([^"]*[\u4e00-\u9fff][^"]*)"/g;
var m, map = {};
while ((m = re.exec(src))) {
  var s = m[1] != null ? m[1] : m[2];
  if (s.length < 3) continue;
  map[s] = (map[s] || 0) + 1;
}
var dups = Object.keys(map).filter(function (k) { return map[k] >= 2; })
  .sort(function (a, b) { return map[b] - map[a]; });
console.log('=== ui.js 重复中文字面量 (≥2) === 共 ' + dups.length + ' 条');
dups.forEach(function (k) { console.log('  (' + map[k] + 'x) ' + k); });
