global.window = global;
['../js/config.js', '../js/state.js', '../js/i18n.js', '../js/i18n_events_en.js', '../js/engine.js', '../js/events.js'].forEach(function (m) { require(m); });
var MJ = global.MJ;
var en = MJ.i18n.dict.eventEn || {};
Object.keys(MJ.EVENTS).forEach(function (id) {
  var t = MJ.EVENTS[id].title;
  if (typeof t === 'string' && /[一-鿿]/.test(t) && !en['event.' + id + '.title']) console.log(id + '\t' + t);
});
