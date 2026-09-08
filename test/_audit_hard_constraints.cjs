// 经济/属性硬约束矩阵审计（任务E，构造边界状态直调真实 resolveEnding）
// 断言 GDD §7.2 优先级规则表的关键不变量：
//   ① 负债硬约束压倒一切成功型/架空结局（held 与否分流 SURVIVE_DEBT / FINANCIAL）
//   ② 烧伤带先于成功型；烧伤+负债按负债分流；纯烧伤收束 END_TRAGIC
//   ③ END_TRUE_ETERNAL 边界：任一条件不满足（含烧伤/负债）均不得返回
//   ④ ALT 分叉优先级链：1975 > 1979 > 1984 > biz > altPeace > altQuiet
//   ⑤ END_CONTROVERSIAL（法律）压倒 ALT；负债压倒 ALT
//   ⑥ 续章带（survived2009）：优先 BP7 长寿 > ALT（烧伤不得吞 HEALED 例外）> 负债分流；永不返回 END_TRAGIC
//   ⑦ 路线型/原型结局：isSolo=false→FAMILY、RECLUSE_SERENE/RECLUSE、HOMEBODY/LONELY_KING/OVERWORKED/BURNT_OUT、QUIET_LIFE 兜底
// 运行：node test/_audit_hard_constraints.cjs
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
global.MJ = global.MJ || {};
var MJ = global.MJ;
MJ.t = function (k, v, fb) { return fb != null ? fb : k; };
require('../js/config.js');
require('../js/state.js');
require('../js/events.js');
require('../js/planner.js');
require('../js/engine.js');

var pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  → ' + detail : '')); }
}
// 构造器：显式覆盖所有结局判定相关字段，规避默认值歧义
function mk(over) {
  var st = new MJ.GameState();
  st.attributes = Object.assign({
    health: 60, reputation: 50, wealth: 30, art: 30, stress: 30, family: 40,
    loneliness: 0, media: 60
  }, (over && over.attributes) || {});
  st.flags = Object.assign({}, (over && over.flags) || {});
  st.meta = Object.assign({}, (over && over.meta) || {});
  st.timeline = Object.assign({}, (over && over.timeline) || {});
  st.debt = !!(over && over.debt);
  return st;
}
function R(over) { return MJ.resolveEnding(mk(over)); }

console.log('=== 硬约束矩阵审计（构造态 × 真实 resolveEnding） ===');

// ① 负债硬约束
check('负债 + 未坚持巡演 → END_SURVIVE_DEBT', R({ debt: true, flags: { isSolo: true } }) === 'END_SURVIVE_DEBT');
check('负债 + 坚持巡演 → END_FINANCIAL', R({ debt: true, flags: { isSolo: true, thisItHeld: true } }) === 'END_FINANCIAL');
check('负债压倒成功型（mogul 满足+财富高）', R({ debt: true, flags: { isSolo: true }, meta: { mogul: 3 }, attributes: { wealth: 90, reputation: 80 } }) === 'END_SURVIVE_DEBT');
check('负债压倒 ALT（1975 motown 分叉）', R({ debt: true, flags: { isSolo: true }, timeline: { '1975': 'motown' } }) === 'END_SURVIVE_DEBT');
check('负债压倒原型结局（HOMEBODY 条件齐备仍负债）', R({ debt: true, flags: { isSolo: true }, attributes: { family: 80 } }) === 'END_SURVIVE_DEBT');

// ② 烧伤带
check('烧伤（无负债）→ END_TRAGIC', R({ flags: { isSolo: true, isPepsiBurned: true } }) === 'END_TRAGIC');
check('烧伤 + 依赖 → END_TRAGIC', R({ flags: { isSolo: true, isPepsiBurned: true, painkillerDependent: true } }) === 'END_TRAGIC');
check('烧伤 + 负债 + 未坚持 → END_SURVIVE_DEBT（负债分流优先）', R({ debt: true, flags: { isSolo: true, isPepsiBurned: true } }) === 'END_SURVIVE_DEBT');
check('烧伤 + 负债 + 坚持 → END_FINANCIAL', R({ debt: true, flags: { isSolo: true, isPepsiBurned: true, thisItHeld: true } }) === 'END_FINANCIAL');
check('烧伤 + 依赖 + 坚持 + 健康≥28 → END_TRAGIC', R({ flags: { isSolo: true, isPepsiBurned: true, painkillerDependent: true, thisItHeld: true }, attributes: { health: 40 } }) === 'END_TRAGIC');
check('烧伤 + 戒药 + 坚持 + 健康≥28 → END_ART_PEAK', R({ flags: { isSolo: true, isPepsiBurned: true, thisItHeld: true }, attributes: { health: 40, art: 70 } }) === 'END_ART_PEAK');

// ③ TRUE_ETERNAL 边界
var eternalBase = {
  flags: { isSolo: true, thriller25: true, anniv2001: true },
  meta: { phil: 3, artPath: 2 },
  attributes: { art: 90, reputation: 90, health: 80 }
};
check('TRUE_ETERNAL 满足全部条件', R(eternalBase) === 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：art=84 不可达', R(Object.assign({}, eternalBase, { attributes: Object.assign({}, eternalBase.attributes, { art: 84 }) })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：rep=84 不可达', R(Object.assign({}, eternalBase, { attributes: Object.assign({}, eternalBase.attributes, { reputation: 84 }) })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：health=74 不可达', R(Object.assign({}, eternalBase, { attributes: Object.assign({}, eternalBase.attributes, { health: 74 }) })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：phil=2 不可达', R(Object.assign({}, eternalBase, { meta: { phil: 2, artPath: 2 } })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：artPath=1 不可达', R(Object.assign({}, eternalBase, { meta: { phil: 3, artPath: 1 } })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：缺 thriller25 不可达', R(Object.assign({}, eternalBase, { flags: { isSolo: true, anniv2001: true } })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：缺 anniv2001 不可达', R(Object.assign({}, eternalBase, { flags: { isSolo: true, thriller25: true } })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：烧伤不可达（即使其余极致）', R(Object.assign({}, eternalBase, { flags: Object.assign({}, eternalBase.flags, { isPepsiBurned: true }) })) !== 'END_TRUE_ETERNAL');
check('TRUE_ETERNAL：负债不可达', R(Object.assign({}, eternalBase, { debt: true })) !== 'END_TRUE_ETERNAL');

// ④ ALT 优先级链（1975 > 1979 > 1984 > biz > altPeace > altQuiet）
var altAll = { flags: { isSolo: true, altPeace: true, altQuietRetiree: true }, timeline: { '1975': 'motown', '1979': 'solo_prod', '1984': 'safe', 'biz': 'empire' } };
check('ALT 链：1975 最优先', R(altAll) === 'END_ALT_STAY_MOTOWN');
var a2 = JSON.parse(JSON.stringify(altAll)); delete a2.timeline['1975'];
check('ALT 链：1979 次之', R(a2) === 'END_ALT_NO_QJ');
var a3 = JSON.parse(JSON.stringify(a2)); delete a3.timeline['1979'];
check('ALT 链：1984 再次', R(a3) === 'END_ALT_HEALED');
var a4 = JSON.parse(JSON.stringify(a3)); delete a4.timeline['1984'];
check('ALT 链：biz 再次', R(a4) === 'END_ALT_MEDIA_MOGUL');
var a5 = JSON.parse(JSON.stringify(a4)); delete a5.timeline['biz'];
check('ALT 链：altPeace 再次', R(a5) === 'END_ALT_PEACE_LAUREATE');
var a6 = JSON.parse(JSON.stringify(a5)); delete a6.flags.altPeace;
check('ALT 链：altQuiet 兜底', R(a6) === 'END_ALT_QUIET_RETIREE');

// ⑤ 法律压倒 ALT / 负债压倒 ALT（非续章带）
check('法律 END_CONTROVERSIAL 压倒 ALT', R({ flags: { isSolo: true, settlement1993: true }, attributes: { reputation: 60 }, timeline: { '1975': 'motown' } }) === 'END_CONTROVERSIAL');
check('媒体轴低 + settlement → END_CONTROVERSIAL', R({ flags: { isSolo: true, settlement1993: true }, attributes: { reputation: 90, media: 30 } }) === 'END_CONTROVERSIAL');

// ⑥ 续章带
check('续章 + BP7 长寿 → END_ALT_SURVIVE_LEGACY', R({ flags: { isSolo: true, survived2009: true, isPepsiBurned: true }, timeline: { '2009': 'survive' } }) === 'END_ALT_SURVIVE_LEGACY');
check('续章 + ALT → 尊重分叉（不被长寿外的终局吞掉）', R({ flags: { isSolo: true, survived2009: true }, timeline: { '1975': 'motown' } }) === 'END_ALT_STAY_MOTOWN');
check('续章 + 烧伤 + 1984 safe → 不落「灼伤未拖垮」文案（HEALED 被跳过）', R({ flags: { isSolo: true, survived2009: true, isPepsiBurned: true }, timeline: { '1984': 'safe' } }) !== 'END_ALT_HEALED');
check('续章 + 负债 + 未坚持 → END_SURVIVE_DEBT', R({ flags: { isSolo: true, survived2009: true }, debt: true }) === 'END_SURVIVE_DEBT');
check('续章 + 负债 + 坚持 → END_FINANCIAL', R({ flags: { isSolo: true, survived2009: true, thisItHeld: true }, debt: true }) === 'END_FINANCIAL');
(function () {
  // 续章永不返回悲剧/烧伤类结局
  var banned = { END_TRAGIC: 1, END_BURNT_OUT: 1, END_OVERWORKED: 1 };
  var cases = [
    { flags: { isSolo: true, survived2009: true, isPepsiBurned: true, painkillerDependent: true }, attributes: { health: 10, stress: 95, reputation: 90 } },
    { flags: { isSolo: true, survived2009: true }, attributes: { health: 10, stress: 95 } }
  ];
  for (var i = 0; i < cases.length; i++) {
    var r = R(cases[i]);
    check('续章永不返回悲剧/燃尽/过劳（case ' + (i + 1) + ' → ' + r + '）', !banned[r]);
  }
})();

// ⑦ 路线型 / 原型结局
check('始终未单飞 → END_FAMILY', R({ flags: { isSolo: false } }) === 'END_FAMILY');
check('隐士 + 健康≥50 + 孤独<55 → END_RECLUSE_SERENE', R({ flags: { isSolo: true }, meta: { recluse: 3 }, attributes: { health: 60, loneliness: 30 } }) === 'END_RECLUSE_SERENE');
check('隐士 + 孤独≥55 + 健康≥35 → END_RECLUSE', R({ flags: { isSolo: true }, meta: { recluse: 3 }, attributes: { health: 60, loneliness: 60 } }) === 'END_RECLUSE');
check('归家的人（单飞+家庭≥70）→ END_HOMEBODY', R({ flags: { isSolo: true }, attributes: { family: 75, reputation: 50, health: 60 } }) === 'END_HOMEBODY');
check('孤高的王（孤独≥70 非隐士）→ END_LONELY_KING', R({ flags: { isSolo: true }, attributes: { loneliness: 75, health: 45 } }) === 'END_LONELY_KING');
check('过劳的匠人（压力≥85 健康<50）→ END_OVERWORKED', R({ flags: { isSolo: true }, attributes: { stress: 90, health: 40 } }) === 'END_OVERWORKED');
check('燃尽的天才（声誉≥80 健康<42）→ END_BURNT_OUT', R({ flags: { isSolo: true }, attributes: { reputation: 85, health: 40, loneliness: 0 } }) === 'END_BURNT_OUT');
check('普通安稳人生兜底 → END_QUIET_LIFE', R({ flags: { isSolo: true } }) === 'END_QUIET_LIFE');
check('END_PLAIN 直通（entryId 硬分支）', MJ.resolveEnding(mk({}), 'END_PLAIN') === 'END_PLAIN');

console.log('\n硬约束矩阵审计：通过 ' + pass + '，失败 ' + fail);
if (fail) { console.error('FAIL 硬约束矩阵存在破坏优先级规则的用例'); process.exit(1); }
console.log('PASS 硬约束矩阵：负债/烧伤/法律/ALT 链/续章带/原型结局优先级全部符合 §7.2 规则表');
