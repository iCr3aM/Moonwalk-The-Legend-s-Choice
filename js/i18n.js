/* i18n.js — 多语言骨架（GDD §13，英文优先 P1）
 * 设计：MJ.i18n.dict = { zh:{}, en:{...} }；MJ.t(key, vars, fallback) 回退链：
 *   当前语种字典 → zh 字典 → fallback 参数 → key 本身。
 * ZH 字典留空：所有中文串仍以 config / ui.js 现有字面量为回退，确保切回中文零改动、零风险。
 * 英文优先：先落地 en 字典 + 语言切换，事件/手记等叙事正文在 P2 完善。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  var LS_KEY = 'mj_lang';

  function readLang() {
    try {
      var v = window.localStorage && window.localStorage.getItem(LS_KEY);
      if (v === 'en' || v === 'zh') return v;
    } catch (e) {}
    return 'zh';
  }

  var i18n = {
    lang: readLang(),
    dict: {
      zh: {}, // 中文以各处现有字面量为回退，无需在此重复
      en: {
        // ---------- UI 通用 chrome ----------
        'ui.title': 'Michael Jackson: Life Choices',
        'ui.networth': 'Net Worth',
        'ui.metaRoutePrefix': 'Path: ',
        'ui.metaRouteSuffix': '',
        'ui.legendScore': 'Legend Score',
        'ui.posterLegend': 'Legend {s} (Grade {g})',
        'ui.lifeStat': 'Variants triggered: {v} · Key choices: {k}',
        'ui.restart': 'Restart',
        'ui.savePoster': 'Save Poster',
        'ui.copyText': 'Copy Text',
        'ui.shareImg': 'Share Image',
        'ui.zoomPoster': 'View Poster',
        'ui.shareFriend': 'Share with Friends',
        'ui.howtoLabel': 'How to Play',
        'ui.gallery': 'Ending Gallery',
        'ui.achievements': 'Achievements',
        'ui.resetGallery': 'Reset Gallery',
        'ui.resetAch': 'Reset Achievements',
        'ui.close': 'Close ✕',
        'ui.confirmReset': 'Click again to confirm (irreversible)',
        'ui.continue': 'Continue',
        'ui.newGame': 'New Life',
        'ui.coverConfirm': 'Start a new life? This will overwrite your current save.',
        'ui.eraEnter': 'Enter Chapter',
        'ui.epilogueTag': 'Echoes of Choice',
        'ui.next': 'Continue',
        'ui.end': 'The Curtain Falls',
        'ui.badgeUltimate': '★ Ultimate Hidden Ending',
        'ui.locked': 'Locked',
        'ui.unknown': '???',
        'ui.tendPrefix': 'Walking toward: ',
        'ui.tendSuffix': '',
        'ui.historyTitle': 'Life Timeline',
        'ui.historyEmpty': 'No choices yet — your legend is being written…',
        'ui.keyReviewTitle': 'Key Choices',
        'ui.keyReviewEmpty': 'This journey held no earth-shattering forks; ordinariness is an answer too.',
        'ui.diaryTitle': 'Life Journal',
        'ui.diaryEmpty': 'No journal entries were written on this journey.',
        'ui.echoTitle': 'Echoes of Fate',
        'ui.echoEmpty': 'Every choice fell quietly into the place it belonged.',
        'ui.relHead': 'Bonds',
        'ui.relWarm': 'Close',
        'ui.relCold': 'Distant',
        'ui.relNeutral': 'Neutral',
        'ui.achToast': 'Achievement Unlocked: ',
        'ui.foot': 'Every choice you made wrote a one-of-a-kind legend.',
        'ui.posterHeader': 'MICHAEL JACKSON · LIFE CHOICES',
        'ui.posterEndingLabel': 'Ending · Your Legend',
        'ui.posterTagline': 'Everyone is the songwriter of their own life.',
        'ui.posterSigned': 'MJ · Life Choices',
        'ui.posterNoAch': '— No achievements lit this run —',
        'ui.posterAch': 'Achievements lit this run: {n}',
        'ui.posterOf': '{n} · Legend Poster',
        'ui.langBtn': '🌐 Language',
        'ui.copied': 'Copied ✓',
        'ui.copyManual': 'Copy manually',
        'ui.shareCopy': 'Copy',
        'ui.shareNative': 'System Share…',
        'ui.shareTipFile': 'Copy the text or tap “System Share” to paste anywhere.',
        'ui.shareTipUrl': 'Copy the text or tap “System Share”, then paste anywhere; you can also share this page link.',
        'ui.introHowto': 'You play Michael Jackson, stepping from a crib in Gary in 1958 and making choices at every real historical crossroad — leading to 14 radically different life endings.',
        'ui.posterOfTag': 'Legend Poster',
        'ui.diaryTag': 'Journal',
        'ui.echoTag': 'Echo',
        'ui.zoomHint': 'Click to enlarge poster',

        // ---------- 引擎合成文案（后果回响） ----------
        'engine.experienced': 'Experienced',
        'consequence.health.pos': 'your body steadied a little',
        'consequence.health.neg': 'your vitality took another blow',
        'consequence.reputation.pos': 'your name rang a little louder',
        'consequence.reputation.neg': 'your reputation dimmed quietly',
        'consequence.wealth.pos': 'the coffers swelled a bit',
        'consequence.wealth.neg': 'another expense was logged',
        'consequence.family.pos': 'the warmth of home returned',
        'consequence.family.neg': 'family ties cooled another notch',
        'consequence.art.pos': 'your craft refined further',
        'consequence.art.neg': 'inspiration drifted slightly',
        'consequence.stress.pos': 'tension crept back to your shoulders',
        'consequence.stress.neg': 'you breathed a little easier',
        'consequence.money.neg': 'another hole opened in the accounts',
        'consequence.money.pos': 'a fresh sum entered the books',
        'consequence.prefix': 'The dust settles — ',
        'consequence.suffix': '.',

        // ---------- 属性 / 元路线 / 关系 / 稀有度 ----------
        'attr.health': 'Health',
        'attr.reputation': 'Reputation',
        'attr.wealth': 'Wealth',
        'attr.family': 'Family',
        'attr.art': 'Art',
        'attr.stress': 'Stress',
        'attr.media': 'Media',
        'attr.loneliness': 'Solitude',
        'meta.artPath': 'Artist',
        'meta.phil': 'Philanthropist',
        'meta.mogul': 'Mogul',
        'meta.recluse': 'Recluse',
        'rel.brothers': 'Brothers',
        'rel.quincy': 'Quincy Jones',
        'rel.lisa': 'Lisa Marie',
        'rel.debbie': 'Debbie Rowe',
        'rel.kids': 'Children',
        'rel.fans': 'Fans',
        'rarity.common': 'Common',
        'rarity.rare': 'Rare',
        'rarity.epic': 'Epic',
        'rarity.legendary': 'Legendary',

        // ---------- 章节（时代卡片） ----------
        'chapter.0.title': 'Chapter I · The Cradle of Gary',
        'chapter.0.sub': '1958 – 1969　A Child’s Voice in the Steel Town',
        'chapter.0.flavor': 'In the red glow of the steel mills, seven siblings squeezed into a narrow home. The beat began at the edge of a humble crib.',
        'chapter.1.title': 'Chapter II · Solo & Crossroads',
        'chapter.1.sub': '1970 – 1981　From the Group to Solo',
        'chapter.1.flavor': 'The microphone landed in your hands alone; the harmony behind you emptied by one — yet brightened by one.',
        'chapter.2.title': 'Chapter III · The Peak Era',
        'chapter.2.sub': '1982 – 1990　Thriller and the World',
        'chapter.2.flavor': 'The spin of the vinyl drowned out the world’s breath. You became pop itself.',
        'chapter.3.title': 'Chapter IV · Storms & Kindness',
        'chapter.3.sub': '1991 – 1999　Scandal, Charity & High Walls',
        'chapter.3.flavor': 'Applause and gossip arrived together. You built a paradise within the walls, and walked the dark corridors of courtrooms.',
        'chapter.4.title': 'Chapter V · Curtain & Farewell',
        'chapter.4.sub': '2000 – 2009　Late Years, Lawsuits & This Is It',
        'chapter.4.flavor': 'The dance before the mirror slowed, but the diamond-gloved hands still shimmered in time.',
        'chapter.5.title': 'Chapter VI · A Legend Continued',
        'chapter.5.sub': '2010 – 2026　A Life That Might Have Been',
        'chapter.5.flavor': 'If the rehearsal of 2009 had not been the end, beyond the spotlight life had another way of being written.',

        // ---------- 14 结局（名称/基调/简述/独白） ----------
        'ending.END_PLAIN.name': 'An Ordinary Life',
        'ending.END_PLAIN.tone': 'Calm, with regret',
        'ending.END_PLAIN.summary': 'You stayed in Gary and lived a quiet, ordinary life.',
        'ending.END_PLAIN.monologue': 'You never walked the road paved with spotlights. The Gary sunset fell as always; children chased each other at the alley’s end, and you became the most ordinary one among them.\nPerhaps you missed the world’s applause, but you never missed your own bowl of hot soup. Some are destined to light up millions; others keep the light for those closest to them.',
        'ending.END_FAMILY.name': 'A Happy Family',
        'ending.END_FAMILY.tone': 'Warm, content',
        'ending.END_FAMILY.summary': 'You never went solo, and spent life by your brothers’ side.',
        'ending.END_FAMILY.monologue': 'You always stood at your brothers’ side, valuing “us” above “me”. In the Jackson 5’s harmony lived your safest childhood and your most complete self.\nWhen the noise faded, the laughter around the dinner table was the work you were proudest of.',
        'ending.END_RECLUSE.name': 'The Recluse',
        'ending.END_RECLUSE.tone': 'Distant, at peace',
        'ending.END_RECLUSE.summary': 'You drifted from the spotlight and found inner peace.',
        'ending.END_RECLUSE.monologue': 'You stepped bit by bit into the corner the spotlight could not reach. The silence within the high walls felt safer than any stage.\nThe world still guessed where you’d gone, but you no longer had to live for others’ gazes. Solitude is not always punishment; sometimes it is the last dignity you grant yourself.',
        'ending.END_MOGUL.name': 'The Mogul',
        'ending.END_MOGUL.tone': 'Stern, formidable',
        'ending.END_MOGUL.summary': 'You built a music empire and a catalog dominion.',
        'ending.END_MOGUL.monologue': 'You were no longer only the one who sang; you became the one who owned the melodies. Page by page, copyright contracts stacked into an empire; beneath pop’s throne lay the foundation you poured from abacus and ambition.\nSome envied, some resented — but none could deny you redefined the very weight of the word “artist”.',
        'ending.END_PHILANTHROPIST.name': 'The Philanthropist',
        'ending.END_PHILANTHROPIST.tone': 'Benevolent, radiant',
        'ending.END_PHILANTHROPIST.summary': 'You defined your legend through kindness.',
        'ending.END_PHILANTHROPIST.monologue': 'You shared the light of the stage with children who could not reach it. “Heal the World” was more than a song title; it became the proof you truly lived.\nWhen the trophies tarnish, the eyes relit by your kindness are what you’d most want to be remembered by.',
        'ending.END_TRAGIC.name': 'A Historical Tragedy',
        'ending.END_TRAGIC.tone': 'Sorrowful, fated',
        'ending.END_TRAGIC.summary': 'Burns, dependence, and the end in 2009, intertwined by fate.',
        'ending.END_TRAGIC.monologue': 'The burns, the pills, and that summer forever frozen in 2009 — your story was written by too many, yet few truly read it.\nThe brighter the spotlight, the longer the shadow behind. History will remember your melodies, and the hidden arrows you never quite dodged.',
        'ending.END_ART_PEAK.name': 'The Artistic Peak',
        'ending.END_ART_PEAK.tone': 'Glorious, solemn',
        'ending.END_ART_PEAK.summary': 'You overcame dependence and took your final bow at the apex of art.',
        'ending.END_ART_PEAK.monologue': 'You broke the chains of the pills and gave your last strength to the stage. When the curtain rose, the world saw the still-perfect you.\nArt did not fail you, and you did not fail art — this was your proudest farewell, to yourself and to the era.',
        'ending.END_FINANCIAL.name': 'Financial Collapse',
        'ending.END_FINANCIAL.tone': 'Frustrated, cautionary',
        'ending.END_FINANCIAL.summary': 'Debt crushed you and took everything.',
        'ending.END_FINANCIAL.monologue': 'Bills fell like snowflakes; the splendor once within reach had price tags all along.\nYou learned to stand again from nothing, and realized money was never the cage — the obsession with it was. Falling hard enough, you finally heard your own true heartbeat.',
        'ending.END_CONTROVERSIAL.name': 'Surrounded by Controversy',
        'ending.END_CONTROVERSIAL.tone': 'Oppressed, weary',
        'ending.END_CONTROVERSIAL.summary': 'Repeated settlements left your reputation under pressure.',
        'ending.END_CONTROVERSIAL.monologue': 'Settlement after settlement patched your fame like Band-Aids, yet never hid the cracks beneath.\nYou learned to walk amid the gossip and swallowed the grievances into lyrics. Not every truth gets told in time, but you at least never lowered the head that sings.',
        'ending.END_SURVIVE_DEBT.name': 'Surviving but Indebted',
        'ending.END_SURVIVE_DEBT.tone': 'Resilient, resigned',
        'ending.END_SURVIVE_DEBT.summary': 'You cancelled the tour to save your life, yet remained in debt.',
        'ending.END_SURVIVE_DEBT.monologue': 'You cancelled the tour that could have been legendary, keeping life for yourself. The bills remain, and so do the doubts, but for the first time before the mirror, you felt your breath was your own.\nSometimes surviving takes more courage than a perfect finale.',
        'ending.END_PERFECT.name': 'A Perfect Legend',
        'ending.END_PERFECT.tone': 'Fulfilled, legendary',
        'ending.END_PERFECT.summary': 'You avoided the trauma and enjoyed a healthy, honored late life.',
        'ending.END_PERFECT.monologue': 'You skirted the reefs that could have broken you, carrying health, reputation, and love all the way to the end. No excruciating pain, yet no lack of dazzling light.\nThe world envied your fullness; only you knew how much wakefulness and restraint hid within that “perfection”.',
        'ending.END_ETERNAL.name': 'The Eternal Symbol',
        'ending.END_ETERNAL.tone': 'Revered, immortal',
        'ending.END_ETERNAL.summary': 'Art and reputation peaked; you became a cultural icon.',
        'ending.END_ETERNAL.monologue': 'Art at its peak, reputation immortal — you became a cultural symbol beyond any one person. When later people say “King of Pop”, they think not of a name but of a possibility.\nYou took your bow, yet the diamond-gloved hands forever pause in time, glittering.',
        'ending.END_TRUE_ETERNAL.name': 'The True Eternal',
        'ending.END_TRUE_ETERNAL.tone': 'Immortal, ultimate',
        'ending.END_TRUE_ETERNAL.summary': 'Art, reputation, health and kindness converged at the peak; you became legend beyond time itself.',
        'ending.END_TRUE_ETERNAL.monologue': 'When art, reputation, health and kindness all arrive at their peak, you are no longer just someone, but a light time keeps confirming.\nLater listeners’ earbuds still hold your beat; children’s choirs still hold your harmony — you surpassed the curtain call and became eternity itself.',
        'ending.END_TIMELESS_PRESENT.name': 'The Timeless Presence',
        'ending.END_TIMELESS_PRESENT.tone': 'Present, beyond time',
        'ending.END_TIMELESS_PRESENT.summary': 'You did not stop in 2009; beyond the spotlight, life had another draft.',
        'ending.END_TIMELESS_PRESENT.monologue': 'You did not take your bow in the summer of 2009. In the years since, you still hum new melodies in the studio, still tuck the children in on some late night.\nWhen the world speaks of you, it no longer uses the past tense — for those who remain present need not be written as a footnote to legend. You became your own sequel.',

        // ---------- 30 成就 ----------
        'ach.ACH_ROOKIE.name': 'Rising Star',
        'ach.ACH_ROOKIE.desc': 'Your first solo album arrives; the boy begins to have his own name.',
        'ach.ACH_BROTHERLY.name': 'Brotherly Bond',
        'ach.ACH_BROTHERLY.desc': 'Even going solo, you kept your brothers close to heart.',
        'ach.ACH_IDOL.name': 'Beloved by Millions',
        'ach.ACH_IDOL.desc': 'A generation’s youth now houses your melodies.',
        'ach.ACH_CROWN.name': 'The Crowning',
        'ach.ACH_CROWN.desc': 'Thriller 25 or the 30th anniversary crowns the classic anew.',
        'ach.ACH_NEVERLAND.name': 'Lord of Neverland',
        'ach.ACH_NEVERLAND.desc': 'You built a castle called Neverland for childlike wonder.',
        'ach.ACH_BLOOD.name': 'Blood on the Dance Floor',
        'ach.ACH_BLOOD.desc': 'Blood on the Dance Floor crowns you king of the dance floor once more.',
        'ach.ACH_CATALOG.name': 'Catalog Tycoon',
        'ach.ACH_CATALOG.desc': 'ATV or Sony/ATV — you turned melodies into a map of dominion.',
        'ach.ACH_DIGITAL.name': 'Digital Citizen',
        'ach.ACH_DIGITAL.desc': 'In the tide of the internet, you were both a wave-rider and a helmsman.',
        'ach.ACH_PEACEMAKER.name': 'Peacemaker',
        'ach.ACH_PEACEMAKER.desc': 'You made “Heal the World” not just a song, but a promise.',
        'ach.ACH_SAGE.name': 'Sage in Seclusion',
        'ach.ACH_SAGE.desc': 'Thrice into silence, you finally heard yourself.',
        'ach.ACH_RECLUSE.name': 'The Recluse',
        'ach.ACH_RECLUSE.desc': 'Again and again you retreated into silence, shutting the noise outside.',
        'ach.ACH_LEGAL.name': 'Legal Fighter',
        'ach.ACH_LEGAL.desc': 'Storms struck repeatedly, yet you stood straight and unbowed.',
        'ach.ACH_PHIL.name': 'Philanthropist',
        'ach.ACH_PHIL.desc': 'You lit the world with kindness, making charity a second career.',
        'ach.ACH_FAMILYMAN.name': 'Family Man',
        'ach.ACH_FAMILYMAN.desc': 'No matter how big the stage, a lamp always burns for family.',
        'ach.ACH_SURVIVOR.name': 'Survivor',
        'ach.ACH_SURVIVOR.desc': 'In the shadow of debt, you still held your life in your own hands.',
        'ach.ACH_BALANCED.name': 'Sound in Body and Mind',
        'ach.ACH_BALANCED.desc': 'Even in the fame-game, you kept a quiet sleep.',
        'ach.ACH_MEDIA_DARLING.name': 'Media Darling',
        'ach.ACH_MEDIA_DARLING.desc': 'Cameras chased you, yet you stayed effortlessly in command.',
        'ach.ACH_LONELY.name': 'Lonely Throne',
        'ach.ACH_LONELY.desc': 'The higher you stood, the more you heard your own echo.',
        'ach.ACH_MOGUL.name': 'The Mogul',
        'ach.ACH_MOGUL.desc': 'With foresight you built your own music and catalog empire.',
        'ach.ACH_ARTIST.name': 'Grand Master of Art',
        'ach.ACH_ARTIST.desc': 'You forged a lifetime into melody, ascending art’s summit.',
        'ach.ACH_TOUR.name': 'King of the Stage',
        'ach.ACH_TOUR.desc': 'You lit the world on countless stages; applause is your crown.',
        'ach.ACH_RICH.name': 'Immensely Wealthy',
        'ach.ACH_RICH.desc': 'You brewed melody into staggering wealth; the numbers themselves became legend.',
        'ach.ACH_COMEBACK.name': 'Reborn from the Ashes',
        'ach.ACH_COMEBACK.desc': 'The spotlight went dark, and you lit it again yourself.',
        'ach.ACH_TIMELESS_KING.name': 'Across the Ages',
        'ach.ACH_TIMELESS_KING.desc': 'Under This Is It’s spotlight, you remained the artisan who would not settle.',
        'ach.ACH_DIGITAL_PIONEER.name': 'Digital Pioneer',
        'ach.ACH_DIGITAL_PIONEER.desc': 'Ahead of your time, you gathered singles into an album.',
        'ach.ACH_ETERNAL.name': 'The Eternal Symbol',
        'ach.ACH_ETERNAL.desc': 'Art and reputation immortal; you became the era’s cultural icon.',
        'ach.ACH_TRUE_ETERNAL.name': 'The True Eternal',
        'ach.ACH_TRUE_ETERNAL.desc': 'Art, reputation, health and kindness meet at the peak; you surpass time itself.',
        'ach.ACH_BIOPIC.name': 'Silver-Screen Avatar',
        'ach.ACH_BIOPIC.desc': 'In 2026, the you on screen was played by family — legend gained another face.',
        'ach.ACH_BIOPIC_SELF.name': 'The Real Me on Screen',
        'ach.ACH_BIOPIC_SELF.desc': 'In the sequel, you walk onto the screen yourself as “Michael” — the only one who can play you is you.',
        'ach.ACH_BEYOND.name': 'Presence Beyond Time',
        'ach.ACH_BEYOND.desc': 'You did not stop in 2009 — life has a sequel.',

        // ---------- §17.2 续章专属成就 ----------
        'ach.ACH_HOLOGRAM.name': 'Return in Light',
        'ach.ACH_HOLOGRAM.desc': 'At the 2014 Billboard Awards you returned to the stage as a hologram — technology granted the legend a resurrection beyond death.',
        'ach.ACH_MUSICAL.name': 'Echoes on Broadway',
        'ach.ACH_MUSICAL.desc': 'A musical bearing your name lifted its curtain on Broadway; the "you" on stage took the bow, while the applause below still rang for you.',

        // ---------- §17.13 / §17.14 新增成就（格莱美涌现 + 未竟梦想） ----------
        'ach.ACH_GRAMMY_SWEEP.name': 'Grammy Sweep',
        'ach.ACH_GRAMMY_SWEEP.desc': 'From Off The Wall to Invincible, you wrote your own name on every trophy.',
        'ach.ACH_GRAMMY_LEGEND.name': 'Grammy Legend',
        'ach.ACH_GRAMMY_LEGEND.desc': 'A marvel in Grammy history: you lived yourself into the record.',
        'ach.ACH_DREAMER.name': 'Dreamweaver',
        'ach.ACH_DREAMER.desc': 'For that boy, you lit, one by one, every item left unticked on the list.',
        'ach.ACH_PETERPAN.name': 'The Peter Pan Pact',
        'ach.ACH_PETERPAN.desc': 'You bought the rights, pleaded for the role, and kept the boy who would not grow up on screen.',
        'ach.ACH_GREATWALL.name': 'The Great Wall Concert',
        'ach.ACH_GREATWALL.desc': 'In your imagination, you staged the concert atop the Great Wall.',
        'ach.ACH_THISISIT.name': 'The Unfinished Show',
        'ach.ACH_THISISIT.desc': "In London's O2, 2009, you finally took the stage for the opening night of those fifty shows.",

        // ---------- 彩蛋（GDD §17.9） ----------
        'egg.EGG_MOONWALK.name': 'Origin of the Moonwalk',
        'egg.EGG_MOONWALK.desc': 'Again and again you tip toe to the floor and glide backward — so the myth began on the concrete of a Gary alley.',
        'egg.EGG_LYRIC.name': 'Backwards Lyrics',
        'egg.EGG_LYRIC.desc': '"Annie, are you OK?" You laugh and sing the lyrics backwards; time flows back a second.',
        'egg.EGG_TRIBUTE.name': 'A Dream Duet',
        'egg.EGG_TRIBUTE.desc': 'Under the spotlight, you harmonize across time with Elvis and the Beatles — every legend was meant to share one stage.',
        'egg.EGG_WATW.name': 'The Same Song',
        'egg.EGG_WATW.desc': "You press that special chord, giving 'We Are The World' a layer of tenderness only you could hear.",
        'egg.EGG_MOTOWN.name': 'Old Friends Reunited',
        'egg.EGG_MOTOWN.desc': 'The old Motown crew gathered once more; youth flickered back to life for a moment in the harmony.',
        'egg.EGG_DISCO.name': 'Disco Tribute',
        'egg.EGG_DISCO.desc': 'You shrug a shoulder to the neon, bowing solemnly to the disco era of those who came before.',
        'egg.EGG_DEV.name': "Developer's Note",
        'egg.EGG_DEV.desc': '"Thank you for living this life again and again into so many different shapes."',
        'egg.EGG_FOURTH.name': 'The Fourth Wall',
        'egg.EGG_FOURTH.desc': '"To everyone rewriting the legend — the child in the mirror has been applauding for you all along."',

        // ---------- 分享文案 ----------
        'share.game.1': '“Michael Jackson: Life Choices” — a text-based life simulation game.',
        'share.game.2': 'From the crib in Gary to the world’s stages, make choices at every real historical crossroad,',
        'share.game.3': 'leading to 14 radically different life endings. What legend will you walk?',
        'share.game.4': '(Pure web, double-click to play; 30+ variation events, 30 achievements, key-choice review.)',
        'share.ending.lead': 'In “Michael Jackson: Life Choices”, I lived my own legendary life:',
        'share.ending.dimLine': 'Health {health} · Reputation {reputation} · Art {art} · Wealth {wealth} · Family {family} · Stress {stress}',
        'share.ending.routeLine': 'Dominant path: {path}　Legend Score {score} (Grade {grade})',
        'share.ending.variantLine': 'Variants triggered: {v}　Key choices: {k}',
        'share.ending.achLine': 'Achievements lit this run: {n}',
        'share.ending.tail': 'Everyone is the songwriter of their own life — come write your version.'
      }
    },

    setLang: function (lang) {
      if (lang !== 'en' && lang !== 'zh') lang = 'zh';
      this.lang = lang;
      try { if (window.localStorage) window.localStorage.setItem(LS_KEY, lang); } catch (e) {}
      try { document.documentElement.lang = (lang === 'en') ? 'en' : 'zh-CN'; } catch (e) {}
    },

    toggleLang: function () {
      this.setLang(this.lang === 'zh' ? 'en' : 'zh');
      return this.lang;
    }
  };

  function subst(s, vars) {
    if (vars == null) return s;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return (vars[k] != null) ? vars[k] : m;
    });
  }

  MJ.i18n = i18n;

  // 统一入口：当前语种字典 → （英文时查事件英文字典 eventEn）→ fallback → key
  // 关键：eventEn 仅含英文事件正文；中文模式下必须优先使用代码内的中文字面量回退，
  // 否则会因命中 eventEn 而把剧情/选项错误地显示成英文。
  MJ.t = function (key, vars, fallback) {
    var lang = i18n.lang;
    var d = i18n.dict[lang] || {};
    if (d[key] != null) return subst(d[key], vars);

    if (lang === 'en') {
      var ev = i18n.dict.eventEn;
      if (ev && ev[key] != null) return subst(ev[key], vars);
      if (fallback != null) return subst(fallback, vars);
      return key;
    }

    // 中文（及任何非英文语种）：中文串以代码内字面量为回退，不取 eventEn 的英文
    if (fallback != null) return subst(fallback, vars);
    var ev2 = i18n.dict.eventEn;
    if (ev2 && ev2[key] != null) return subst(ev2[key], vars);
    return key;
  };

  // 启动时同步 <html lang>
  try { document.documentElement.lang = (i18n.lang === 'en') ? 'en' : 'zh-CN'; } catch (e) {}
})();
