<p align="center">
  <a href="./README.md">🇨🇳 中文</a>
  &nbsp;·&nbsp;
  <a href="./README_EN.md"><strong>🇺🇸 English</strong></a>
</p>

# Moonwalk: The Legend's Choice · 月球漫步：传奇的抉择

> A **data-driven text-based life simulation**: you play Michael Jackson, walking through pivotal choices from 1958 to 2009; at 2009 you may choose "Continue the Life" to enter a speculative 2010–2026 chapter imagining he did not pass away.

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://www.ecma-international.org/)
[![Vanilla JS](https://img.shields.io/badge/UI-Vanilla%20JS-2ea44f?style=flat-square)](https://developer.mozilla.org/)
[![Status](https://img.shields.io/badge/status-released·iterable-brightgreen?style=flat-square)](./NEXT_STEPS.md)
[![Design](https://img.shields.io/badge/design-v1.15-8A2BE2?style=flat-square)](./NEXT_STEPS.md)
[![No Build](https://img.shields.io/badge/build-none%20required-00b4d8?style=flat-square)](./index.html)
[![Version](https://img.shields.io/github/package-json/v/iCr3aM/Moonwalk-The-Legend-s-Choice?style=flat-square&label=version)](./package.json)
[![License](https://img.shields.io/github/license/iCr3aM/Moonwalk-The-Legend-s-Choice?style=flat-square)](./LICENSE)

---

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [How to Play](#-how-to-play)
- [Project Structure](#-project-structure)
- [Tests](#-tests)
- [Design Constraints](#-design-constraints)
- [License](#-license)

---

## ✨ Features

- **Strictly aligned with the design doc**: all mechanics, branches, values, and endings follow the design docs (GDD v1.13 archived at [`archive/GDD_v1.13.md`](./archive/GDD_v1.13.md); current status in [`NEXT_STEPS.md`](./NEXT_STEPS.md)).
- **Six attributes + dual-track Economy**: Health / Reputation / Wealth / Family / Art / Stress (all 0–100); large sums go through `netWorth` / `debt` (in 10k units), fixing the early "wealth clamped to 0" unreachable-ending bug.
- **30 endings (23 mainline + 7 alt-history)**: including 1 hidden ultimate (True Eternal) and 7 alt-history ("what-if") endings, resolved by a priority rule table plus meta-route tie-breaking.
- **Four hidden meta-routes**: Artist / Philanthropist / Mogul / Recluse, accumulated from choices with a live "you are on the path to X" hint.
- **Variant event system ("what-if" system)**: 141 variants inserted between chapters by probability + year window, including rare gated hidden / conditional variants.
- **89 achievements**: gallery-style `localStorage` persistence with real-time unlock toasts.
- **Bilingual (Simplified Chinese / English)**: one-click language switch, fully localized event text.
- **Sequel "what if MJ didn't pass" (2010–2026)**: This Is It residency, digital singles plan, Sony's 2016 acquisition of half of Sony/ATV, the 2026 biopic *Michael*, and other historical anchors.
- **Legendary poster**: the ending screen auto-generates a saveable (long-press) Canvas poster (six stats, dominant route, node / variant / choice stats, achievement progress).
- **Key-choice review + hidden easter eggs**: an ending-screen recap panel plus low-probability hidden eggs (43, incl. 3 secret).
- **Auto-continue**: `localStorage` auto-save (including current node id); refresh to resume.
- **Neutral, procedural narration**: sensitive legal events use factual phrasing—no presumption of guilt/innocence, no naming of minors.
- **Responsive dark-gold retro UI**: CSS Grid four-zone layout, two columns on mobile and three on desktop.

---

## 🚀 Quick Start

### Method 1 — Open directly (recommended)
Just open [`index.html`](./index.html) in a browser to play (classic script loading, **no build tools, no local server required**).

### Method 2 — Local static server
If the browser restricts `localStorage` under `file://`, use any static server:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

### Optional — Single-file build (for deployment)
The source stays "classic scripts, double-click to run"; for a zero-dependency, easy-to-distribute single-file artifact, use the built-in script (no dependencies to install):

```bash
node build_singlefile.cjs   # same as npm run build; outputs dist/index.html as one inlined file
```

`dist/index.html` has all scripts and styles inlined—**double-click to run**, ready to host on any static space.

---

## 🧩 How to Play

1. **Onboarding**: view instructions, choose whether to continue from a save, and switch language.
2. **Status bar**: live six attributes, net worth, dominant meta-route, and "current year / life track".
3. **Event cards**: 2–3 options per historical node, each with a `hint` previewing its impact (attributes / money / flags).
4. **Variant events**: "what-if" events inserted by probability and era windows, enriching the period texture.
5. **Ending**: one of 30 endings resolved from attributes, flags, and meta-routes by a rule table; the sequel line never resolves to a death ending.
6. **Ending screen**: shows the legendary poster, key-choice recap, career stats, and achievement unlocks.

---

## 🗂 Project Structure

```
index.html                Entry point; loads scripts in dependency order
css/style.css             Dark-gold retro theme, four-zone layout, responsive
js/config.js              Global config: initial attrs / flags / meta-routes / endings
js/i18n.js                i18n framework (language switch / text dictionary)
js/i18n_events_en.js      Event English localization dictionary
js/events.js              Event data (data-driven, all GDD 6.4 nodes + variant events)
js/state.js               Game state + Economy subsystem (net worth / debt dual-track)
js/engine.js              Rule engine / effect application / ending resolution / event flow / variant injection / save
js/ui.js                  View & user flow (onboarding / status bar / event cards / ending)
NEXT_STEPS.md             Current status & roadmap (authoritative; design docs archived)
test/smoke.cjs            Node DOM-free smoke + balance test (400 random runs + timeline monotonicity regression)
test/en_smoke.cjs         EN text / sequel chain / new-event coverage tests
```

> ⚠️ The root-level `check_keys.cjs`, `debug_events.cjs`, `event_keys.txt`, `js/events.wrapped.js`, `wrap_events.cjs` are dev/debug scaffolding, **archived under `archive/legacy-scripts/` and excluded from version control**.

---

## ✅ Tests

The project is driven by **Node DOM-free smoke tests** that verify "many random runs with 0 errors and always reaching an ending" and "timeline years are monotonically non-decreasing (no backwards jumps)":

```bash
npm test                  # run all 22 regression gates (recommended)
node test/smoke.cjs        # 400 random runs + timeline-jump regression (non-zero exit on jump)
node test/en_smoke.cjs     # EN text / sequel chain / Ch.2 solo link / new-event coverage
```

---

## 📐 Design Constraints

- [`NEXT_STEPS.md`](./NEXT_STEPS.md) is the authoritative status summary; design docs are archived (`archive/GDD_v1.13.md`). On conflict, source code wins and the doc gets annotated.
- Sensitive legal events must be **neutral, procedural**; no presumption of guilt/innocence; avoid naming minors.
- The legacy single-file HTML prototype is archived under `archive/` and no longer maintained here.

---

## 📄 License

This project's code is open-sourced under the [MIT License](./LICENSE) — free to use, modify, and distribute (commercially included), as long as the copyright notice is retained.

> Disclaimer: This is a fan-made tribute project, not affiliated with Michael Jackson or his Estate. Names and life events referenced in the game are for narrative purposes only; all related rights belong to their respective owners.

---

<p align="center">Made with ♪ for the King of Pop · <i>"If you want to make the world a better place, take a look at yourself, and then make a change."</i></p>
