global.window = global;
['../js/config.js', '../js/state.js', '../js/i18n.js', '../js/i18n_events_en.js', '../js/engine.js', '../js/events.js'].forEach(function (m) { require(m); });
var MJ = global.MJ;
var en = MJ.i18n.dict.eventEn || {};
['event.1_0.opt0.label', 'event.1_0.opt0.hint', 'event.1_0.opt1.label', 'event.2_6.opt0.hint', 'event.V_EGG_MOTOWN.title'].forEach(function (k) {
  console.log(k, '=>', JSON.stringify(en[k]));
});
console.log('总键数:', Object.keys(en).length);
