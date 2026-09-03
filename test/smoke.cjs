/* Node 冒烟 + 平衡测试：无 DOM 环境下驱动引擎。
 * 验证：随机 400 局 0 异常且必到结局；定向策略覆盖全部 12 结局；
 *      关系/手记/回响/媒体/孤独/传奇评分 等模块均被正确联动。
 */
global.window = global;

// 最小化 localStorage 垫片
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};

require('../js/config.js');
require('../js/state.js');
require('../js/engine.js');
require('../js/events.js');

// 桩 UI：无需 DOM
var _cur = null;
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (chapter, state, onContinue) { onContinue(); } // 过场直接继续，逻辑已落库
};

function play(strategy) {
  MJ.engine.start();
  var guard = 0;
  while (guard++ < 800) {
    if (!_cur) return { ok: false, why: 'no event' };
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id };
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var opts = MJ.engine.optionsOf(_cur);
      var idx = strategy ? strategy(_cur, opts, MJ.engine.state) : Math.floor(Math.random() * opts.length);
      MJ.engine.choose(idx);
      continue;
    }
    return { ok: false, why: 'unknown kind ' + _cur.kind };
  }
  return { ok: false, why: 'guard exceeded' };
}

// 在可选里挑“第一个 label 包含某关键字”的选项
function pick(opts, keys) {
  for (var ki = 0; ki < keys.length; ki++) {
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].label.indexOf(keys[ki]) >= 0) return i;
    }
  }
  return Math.floor(Math.random() * opts.length);
}

var SOLO = ['A：跟着 Diana']; // 1_3 跟随 Diana 才能继续单飞线
var NO_MOGUL = ['C：放弃收购', 'B：独立运营']; // 避免 meta.mogul 累积（非商业巨擘结局）
var NONEVER = ['C：暂不购置']; // 跳过 7_1 债务线（非负债结局）
var PVT = ['A：对公众敞开大门']; // 触发 7_1 债务线（负债结局）
var RECLUSE_AVOID = ['A：冷处理不理会', 'A：礼貌地侧身避开', 'A：正面回应', 'A：主动公关', 'A：冷处理']; // 变体里不选退隐项

function stratFor(target) {
  var map = {
    END_PLAIN: ['B：留在盖瑞'],
    END_FAMILY: ['A：跟着 Diana', 'B：守在 Jackson 5'],
    END_MOGUL: SOLO.concat(['A：迈出单飞', 'A：深度绑定 Epic', 'A：全资收购', 'A：合并 Sony', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满', 'C：暂不购置']).concat(RECLUSE_AVOID),
    END_PHILANTHROPIST: SOLO.concat(['A：迈出单飞'], NO_MOGUL, NONEVER, RECLUSE_AVOID, ['A：倾情义唱', 'A：全身心投入', 'A：倾力投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_RECLUSE: SOLO.concat(NONEVER, ['A：迈出单飞', 'B：圈起私人天地', '拒访', 'B：保持距离', 'A：倾情义唱', 'B：低调处理', 'C：邀请童声', 'B：保持疏离', 'A：独自消化', 'B：死撑不卖', 'B：忍痛取消', 'A：20 场团体']),
    END_ETERNAL: SOLO.concat(['A：迈出单飞'], NO_MOGUL, NONEVER, RECLUSE_AVOID, ['B：安全优先拒拍', 'A：倾尽所有去演', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：坦诚聊', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_PERFECT: SOLO.concat(['A：迈出单飞'], NO_MOGUL, NONEVER, RECLUSE_AVOID, ['B：安全优先拒拍', 'A：倾尽所有去演', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：坦诚聊', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_ART_PEAK: SOLO.concat(NO_MOGUL, NONEVER, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'B：硬扛着治疗', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_TRAGIC: SOLO.concat(NO_MOGUL, NONEVER, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：依赖药物止痛', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_CONTROVERSIAL: SOLO.concat(PVT, NO_MOGUL, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：达成庭外和解', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_SURVIVE_DEBT: SOLO.concat(PVT, NO_MOGUL, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：达成庭外和解', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'B：死撑不卖', 'B：忍痛取消', 'A：20 场团体']),
    END_FINANCIAL: SOLO.concat(PVT, NO_MOGUL, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：达成庭外和解', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'B：死撑不卖', 'A：咬牙撑满', 'A：20 场团体'])
  };
  var keys = map[target] || [];
  return function (ev, opts) { return pick(opts, keys); };
}

// 1) 随机 400 局
var endingsSeen = {};
var errors = 0;
for (var i = 0; i < 400; i++) {
  try {
    var r = play(null);
    if (!r.ok) { errors++; console.log('RANDOM FAIL', i, r); break; }
    endingsSeen[r.ending] = (endingsSeen[r.ending] || 0) + 1;
  } catch (e) {
    errors++; console.log('RANDOM THROW', i, e && e.stack); break;
  }
}
console.log('随机 400 局：异常', errors, '；结局分布', JSON.stringify(endingsSeen));

// 2) 定向策略覆盖全部 12 结局（每个结局最多 40 次尝试以克服随机变体/门控）
var allEndings = Object.keys(MJ.config.endings);
console.log('定向覆盖 12 结局：');
allEndings.forEach(function (id) {
  try {
    var got = null;
    for (var t = 0; t < 40 && !got; t++) {
      var r = play(stratFor(id));
      if (r.ok) got = r.ending;
    }
    console.log('  ' + id + ' => ' + (got === id ? 'OK' : '未达成(' + got + ')'));
  } catch (e) {
    console.log('  ' + id + ' => THROW ' + (e && e.stack));
  }
});

// 3) 模块联动抽查：走“单飞 + 退隐”线，触发关系/手记/回响/孤独/传奇
try {
  var guard = 0;
  MJ.engine.start();
  while (guard++ < 800) {
    if (!_cur) break;
    if (_cur.kind === 'ended') break;
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); break; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    var o = MJ.engine.optionsOf(_cur);
    MJ.engine.choose(pick(o, SOLO.concat(['A：迈出单飞', 'B：圈起私人天地', '拒访', 'B：保持距离', 'A：倾情义唱', 'B：低调处理', 'C：邀请童声', 'B：保持疏离', 'A：独自消化', 'B：死撑不卖', 'B：忍痛取消', 'A：20 场团体'])));
  }
  var s = MJ.engine.state;
  var legend = MJ.legendScore(s);
  console.log('模块联动抽查：relations keys=' + Object.keys(s.relations).length +
    ' 手记=' + s.diary.length + ' 回响=' + s.echoes.length +
    ' media=' + s.attributes.media + ' loneliness=' + s.attributes.loneliness +
    ' legend=' + legend.score + '(' + legend.grade + ')');
  var moduleOk = Object.keys(s.relations).length === MJ.config.relationsDefs.length &&
    s.diary.length >= 1 && s.echoes.length >= 1 && s.attributes.loneliness > 0 && typeof legend.score === 'number';
  console.log('模块联动：' + (moduleOk ? 'OK' : 'FAIL'));
} catch (e) { console.log('模块联动 THROW ' + (e && e.stack)); }

// 2b) 结局解析单元覆盖：直接构造状态，验证 12 结局按规则均可达成（权威可达性证明）
function mkEnding(over) {
  var st = new MJ.GameState();
  st.flags.isSolo = true;
  if (over.attr) Object.assign(st.attributes, over.attr);
  if (over.meta) Object.assign(st.meta, over.meta);
  if (over.flags) Object.assign(st.flags, over.flags);
  if ('debt' in over) st.debt = over.debt;
  return MJ.resolveEnding(st, over.entryId);
}
var ucases = [
  ['END_PLAIN', { entryId: 'END_PLAIN' }],
  ['END_FAMILY', { flags: { isSolo: false } }],
  ['END_RECLUSE', { attr: { health: 60, family: 30 }, meta: { recluse: 3 } }],
  ['END_MOGUL', { attr: { family: 50, media: 60, health: 60, wealth: 70, art: 60 }, meta: { mogul: 2 }, debt: false }],
  ['END_PHILANTHROPIST', { attr: { family: 40, wealth: 30, health: 60 }, meta: { phil: 3 }, debt: false }],
  ['END_ETERNAL', { flags: { thriller25: true }, attr: { art: 80, reputation: 70, health: 60, family: 50, media: 60 } }],
  ['END_ART_PEAK', { flags: { isPepsiBurned: true, thisItHeld: true }, attr: { art: 80, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_PERFECT', { attr: { art: 60, reputation: 65, health: 60, family: 50, media: 60 } }],
  ['END_TRAGIC', { flags: { isPepsiBurned: true, painkillerDependent: true, thisItHeld: true }, attr: { art: 50, reputation: 60, health: 45, family: 50, media: 60 } }],
  ['END_CONTROVERSIAL', { flags: { settlement1993: true }, attr: { reputation: 45, media: 60, health: 60 } }],
  ['END_SURVIVE_DEBT', { debt: true, thisItHeld: false, attr: { art: 50, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_FINANCIAL', { debt: true, flags: { thisItHeld: true }, attr: { art: 50, reputation: 55, health: 60, family: 50, media: 60 } }]
];
console.log('结局解析单元覆盖（构造状态 → resolveEnding）：');
ucases.forEach(function (c) {
  var got = mkEnding(c[1]);
  console.log('  ' + c[0] + ' => ' + (got === c[0] ? 'OK' : '实际=' + got));
});

console.log('测试结束。');
