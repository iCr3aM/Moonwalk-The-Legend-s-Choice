var STAT = { '健康':'Health','声誉':'Reputation','财富':'Wealth','家庭':'Family','艺术':'Art','压力':'Stress','慈善':'Philanthropy','媒体':'Media','孤独':'Loneliness' };
var re = /([一-鿿]+?)\s*([+\-−－])\s*(\d+)/g;
function autoHint(zh) {
  if (typeof zh !== 'string' || !/[一-鿿]/.test(zh)) return null;
  var s = zh.replace(/[（）；;，、]/g, ' ');
  var m, parts = [], unmatched = false;
  re.lastIndex = 0;
  while ((m = re.exec(s))) {
    var nm = STAT[m[1]];
    if (!nm) { unmatched = true; break; }
    var sign = (m[2] === '-' || m[2] === '−' || m[2] === '－') ? '-' : '+';
    parts.push(nm + ' ' + sign + m[3]);
  }
  if (unmatched || parts.length === 0) return null;
  return '(' + parts.join(', ') + ')';
}
var zh = '艺术精进，手足羁绊更深，但童年的重量提前压上肩头（艺术+10，家庭+5，压力+5）';
console.log('zh=', zh);
console.log('sanitized=', zh.replace(/[（）；;，、]/g, ' '));
console.log('result=', autoHint(zh));
re.lastIndex = 0; var mm;
while ((mm = re.exec(zh.replace(/[（）；;，、]/g, ' ')))) console.log('  match:', JSON.stringify(mm[1]), JSON.stringify(mm[2]), JSON.stringify(mm[3]));
