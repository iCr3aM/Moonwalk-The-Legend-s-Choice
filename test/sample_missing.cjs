global.window = global;
['../js/config.js', '../js/state.js', '../js/i18n.js', '../js/i18n_events_en.js', '../js/engine.js', '../js/events.js'].forEach(function (m) { require(m); });
var MJ = global.MJ;
var en = MJ.i18n.dict.eventEn || {};
var seen = {};
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id];
  if (!Array.isArray(ev.options)) return;
  ev.options.forEach(function (o, j) {
    ['label', 'hint'].forEach(function (f) {
      var k = 'event.' + id + '.opt' + j + '.' + f;
      if (en[k]) return;
      var v = o[f];
      if (typeof v !== 'string' || !/[一-鿿]/.test(v)) return;
      seen[v] = (seen[v] || 0) + 1;
    });
  });
});
var arr = Object.keys(seen);
console.log('缺失值去重总数:', arr.length);
console.log('样例（前 30）：');
arr.slice(0, 30).forEach(function (s) { console.log('  ' + seen[s] + 'x  ' + s); });
