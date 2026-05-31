# UT Scanner CHANGELOG

Per CLAUDE.md §145 ER — first formal version-diff document.
Audit / regression source-of-truth. Every ship from v63 onward records:
- New rules (§N..§M)
- Modified / new functions
- New DOM IDs
- New localStorage keys
- Touched files

---

## v73 — 2026-05-31 EDT

**Trigger:** Boss-flagged screenshot (EX01, 5 MHz porosity cluster, red-circled region): probe vertical shadow penetrating below the blue porosity defects — physically wrong, should be blocked at the defect. Boss command: "改完這個問題之後 UT73 版本繼續". v73 ships the SH hotfix only; the planned v73 main (P1+P2+P3+N1+K2) is bumped to v74.

### New rules (CLAUDE.md §231–§233)

| §   | Code | Theme                                  | One-liner |
|-----|------|----------------------------------------|-----------|
| 231 | SH1  | Shadow-clip at defect + smoothstep tail | Trapezoid bot Y clipped to shallowest in-column defect upper edge; 0.6r smoothstep falloff inside the defect avoids hard-cut look |
| 232 | SH2  | Shallowest-first occlusion              | When multiple defects sit inside the column, only the shallowest one occludes — deep defects are visually hidden behind shallow ones (optical intuition) |
| 233 | SH3  | Column half-width interp                | Defect must sit within `halfWidth(y) + r` of probeX (linear interp top→bot 0.95→0.30 × TX_W / 2) to be an occlusion candidate — prevents stray side defects from clipping |

### New / modified functions

- `_findShadowOcclusion(probeX, exerciseName, sTopY, sBotY, sTopW, sBotW)` — NEW (drawScan-adjacent). Returns shallowest in-column defect `{x, y, r}` or null. Filters per exerciseName: 'porosity' → PORES (5 pores, r ≈ MAT_W × 0.012), 'penetration' → 4 SDH, 'weld' → WELD_CRACKS (3 cracks). EX04 grating / EX05 maze return null (out of scope per §231 SH1).
- Shadow block in `drawScan` — REPLACED. Calls `_findShadowOcclusion`; on hit, clips trapezoid bot Y to `defect.y − defect.r` and renders a 6-stop smoothstep fade-out polygon from clip to `clip + 0.6·r`. End alpha of the main trapezoid is `midA × 0.5` when occluded (not 0) so the fade-out picks up smoothly. EX04 added to the skip list alongside maze.
- `__VERSION_DELTA__` — version bumped to 'v73', ruleCodes now `['SH1','SH2','SH3']`.

### Smoke test updates

- `ruleCodes count matches ship` expectation: 4 → 3.
- New `SH1 _findShadowOcclusion fn` typeof check.
- New `SH2 shallowest-first` — stubs MAT_X/Y/W/H + PORES at 3 depths, asserts y=60 (shallowest) is picked.
- New `SH3 column-width interp` — verifies offset-x defect at deep position outside column gets `null`, offset-x defect at shallow position inside column gets non-null.
- v72 carry-over checks (L1 inertia / L3 vibration / U2 alarm / U3 transition) all retained to guard regression.
- Smoke result: **48 / 48 pass** verified via puppeteer headless on `file://` v73.html.

### Touched files

- `今日工作區/ut-scanner-v73.html` (created from v72.html — 7544 lines + helper + smoke = ~7600)
- `今日工作區/CLAUDE.md` (§231–§233 inserted before "遠端開發生產 與「模糊歷史掃描」規範")
- `ut-scanner-github/ut-scanner-v72.html` removed; v73.html added.
- `ut-scanner-github/CLAUDE.md` synced.
- `今日工作區/AI優化與改善建議書.md` — SH hotfix proposal at top, marked accepted.

### Visual verification (puppeteer screenshots, `今日工作區/uploads/v73_test/`)

- `ex01_over_porosity.png` — probe at rx=0.50 (centre porosity cluster): shadow column truncated at the pore upper edge. ✓
- `ex01_off_porosity.png` — probe at rx=0.85 (right of cluster): shadow extends down to v71's 55 % depth (no occlusion). ✓
- `ex02_over_ref_sdh.png` — probe at rx=0.30 (over Ref SDH @ 50 mm): shadow column visibly stops at SDH top edge, doesn't reach back wall. ✓
- `ex05_maze.png` — top-down maze view, no vertical shadow rendered (`exercise !== 'maze'` skip). ✓

---

## v72 — 2026-05-31 EDT

**Trigger:** post-v71 six-lens proposal — user accepted "L1 + L3 + U2 + U3 (4 條,跳過 L2 音效)" from the rewritten v71-baseline proposal book. Theme: student-perspective immersion (probe inertia, mobile haptics) + UI alarm escalation + EX-switch continuity.

### New rules (CLAUDE.md §227–§230)

| §   | Code  | Theme                       | One-liner |
|-----|-------|-----------------------------|-----------|
| 227 | L1    | Probe inertia + bounce      | Drag release → glide with 0.92 damping; elastic bounce 30 % off MAT boundaries; maze 2-axis, standard 1-axis |
| 228 | L3    | Mobile haptics              | navigator.vibrate 30 ms D-peak ≥50 %, 100 ms ALARM, 50 ms maze thin spot; ☰ Settings toggle; iOS silent-fail |
| 229 | U2    | ALARM viewport glow         | gate-alert.trig rising edge → 0.6 s inset red box-shadow pulse on body::before, pointer-events:none |
| 230 | U3    | EX-switch transition        | setExercise wraps with 0.4 s slide+fade on .ex-content-host (out 200 ms → swap → in 200 ms); lock absorbs rapid re-clicks |

### New / modified functions

- `_pushDragTrail` / `_startInertiaFromTrail` / `_applyProbeInertia` — NEW. L1 inertia state machine. Called from loop() before drawScan; reads/mutates txX/txY/inertiaVx/inertiaVy.
- `loop()` — gains `_applyProbeInertia()` as first call.
- mousedown / mouseup / mouseleave / touchstart / touchend handlers — reset trail on press, start inertia on release.
- `_vibrate(ms)` / `toggleHaptics()` — NEW. L3 vibration helper + persistent toggle.
- `_alarmPulseTrigger()` — NEW. U2 viewport edge red glow trigger; adds + removes `body.alarm-pulse` for 0.6 s.
- gate-alert block in `drawAscan` — adds D-peak ≥50 % rising-edge L3 vibrate; ALARM rising edge fires L3 + U2; clear path resets `_hapticsLastAlarmTrig`.
- `drawMazeAscan` — adds maze thin-spot rising-edge L3 vibrate (thinAmount > 0.5 up-cross).
- `setExercise(ex)` — REPLACED. Now a transition orchestrator. Original body moved into `_setExerciseCore(ex)`. Calls `_onExChanged` inside the +200 ms callback to sync mobile-bar refresh with the visible content swap.

### New DOM IDs / classes

- `<div class="ex-content-host" id="ex-content-host">` — wraps `#ex-splash-wrap` + `#ex-desc` + `#gw-panel` so U3 transition only animates the per-EX content layer (canvas/ascan/HUD stay still).
- `.ex-transitioning-out` / `.ex-transitioning-in` — CSS animation classes applied by setExercise transition orchestrator.
- `body.alarm-pulse` + `body.alarm-pulse::before` — U2 viewport edge red glow overlay.

### New localStorage keys

- `LS_KEYS.HAPTICS = 'ut_haptics'` (value: `'on'` | `'off'`; mode `'string'`)

### Hotfix included

- `__VERSION_DELTA__.ruleCodes` aligned with CLAUDE.md spec names: `'A22'` was the v71 ruleCode but every comment tag used `A2.2` (the §222 spec name). The rule-audit regex `\bA22\b\s*[·—]` missed all of them → smoke FAIL → red banner at viewport bottom. Fixed by changing the ruleCode to `'A2.2'` and updating the smoke-assertion expected string. Same approach folded into v72 (ruleCodes line up with CLAUDE.md §227-230 names verbatim).

### Touched files

- `今日工作區/ut-scanner-v71.html` → moved to `歷史版本與日報庫/各版本/ut-scanner-v71.html`
- `今日工作區/ut-scanner-v72.html` — NEW (v71 base + L1/L3/U2/U3 + hotfix)
- `今日工作區/CLAUDE.md` — appended §227–§230
- `今日工作區/AI優化與改善建議書.md` — rewritten to v71 baseline (Lane L/P/N/K/D/U × 3 = 18 big-upgrade candidates) before user picked v72 ship list
- `ut-scanner-github/ut-scanner-v71.html` → removed; replaced with `ut-scanner-v72.html`
- `ut-scanner-github/CLAUDE.md` — synced
- `ut-scanner-github/CHANGELOG.md` — this entry

---

## v71 — 2026-05-31 EDT

**Trigger:** user feedback on v70 — (1) "EX1 陰影 動態影子沒改 我要的是漸漸消失不是什麼都沒有", (2) "EX2 的陰影固定在那邊看起來很假", (3) "EX4 也想要有 EX2 的那種教學", (4) "一些按鈕的收納你要再幫我改善 (自行決定怎麼收納)". v71 = 5 features answering each point.

### New rules (CLAUDE.md §222–§226)

| §   | Code  | Theme                | One-liner |
|-----|-------|----------------------|-----------|
| 222 | A2.2  | Shadow rework        | alpha 0.17→0.30 + dragging boost + surface contact glow at probe foot |
| 223 | CG    | EX04 guided lesson   | New `grating-lobes` 5-step walkthrough — Bragg condition + N-elements trade-off |
| 224 | B9    | UI declutter         | color-legend chip retired; ☰ Settings gets "🎨 Color legend" toast entry |
| 225 | B10   | UI declutter         | maze ⚙ popup retired; L2/L3 + Strict + Roof×3 become first-class ☰ Settings entries |
| 226 | B11   | UI consistency       | Three pre-v71 teach-banners now share CSS skin (border-radius / padding / font-size / margin) |

### New / modified functions

- `_drawV69Shadows` IIFE (inside drawScan) → rewritten as the v71 A2.2 block. Uses `dragging` to bump alpha and adds a radial contact glow at the probe surface footprint.
- `GW_FLOWS['grating-lobes']` — NEW 5-step flow (Step 1 confirm d/λ ≤ 0.5, Step 2 confirm grating lobes appear, Step 3 confirm N ≥ 16, Step 4 review w/ takeaway card, Step 5 done w/ Try-again + Close).
- `_EX_LESSON_MAP.grating` — `null` → `{ flowId:'grating-lobes', ... }`. Triggers splash-card enablement + 🎓 chip on EX4 button automatically (HU/HT-1 hooks).
- `_HD_REGISTRY` — 6 new entries: `🎨 Color legend` (all-EX, toast), `🔁 Maze L2/L3 cycle`, `🎯 Maze Strict mode`, `🏹 Maze Roof 5°/7°/10°` (all maze-only).

### New DOM

- `<span class="lesson-chip">🎓</span>` added inside `#btn-grating` (CG).

### New CSS

- `#color-legend { display:none !important; }` (B9)
- `#mz-settings { display:none !important; }` (B10)
- `#wedge-mismatch-banner, #v1-mode-hint { border-radius:8px; padding:10px 13px; font-size:11px; line-height:1.5; margin-bottom:8px; }` (B11)

### Touched files

- `今日工作區/ut-scanner-v71.html` (renamed from v70; 5 features + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§222–§226)
- `今日工作區/CHANGELOG.md` (this entry)

### Notes

- Puppeteer-verified per-EX drawer counts after v71: EX1=8 (was 7), EX4=9 (was 7, +Color Legend +Guided lesson), EX5=18 (was 11, +5 maze entries + Color Legend).
- Puppeteer-verified EX4 splash card primary enabled (no longer "coming v69"). Splash 藍卡 點下 → `gw.open('grating-lobes')`.
- Shadow contact-glow uses `ctx.scale(1, 0.32)` to flatten the radial gradient into an ellipse pinned to (txX, SURF_Y). Combined with the vertical trapezoid below it, the probe now reads as having a hard contact point that fades both laterally and downward — answering both "EX1 看不到" (visibility) and "EX2 固定看起來很假" (rooting).
- B11 keeps banner DOM separate for now; CSS-only consolidation = banner consistency at low risk. Content-swap merge into one container deferred to a later ship.

---

## v70 — 2026-05-31 EDT

**Trigger:** user "OK 開始 v70" (relayed via "UT 繼續" after proposal-book v3 confirmation). v70 batch = B4 header de-bloat + B5 controls-row de-bloat + B6 couplant/material row hidden + ☰ toggle + B7 tools-panel fully retired + A3 beam edge triple-feather. Scope per v3 proposal book Lane B's expanded 11-item plan (B1–B3 already shipped v69) and Lane A's A3 physics polish.

### New rules (CLAUDE.md §217–§221)

| §   | Code | Theme              | One-liner |
|-----|------|--------------------|-----------|
| 217 | B4   | UI declutter       | Header drops 5 badges (Pulse-Echo / freq / EX / MODE: BASIC / MODE: TUTORIAL) — only h1 + theme + ☰ left |
| 218 | B5   | UI declutter       | PEAK HOLD cell + DAC cell + Reset button hidden; PEAK HOLD now an ☰ Calibration entry |
| 219 | B6   | UI declutter       | Couplant + Material row hidden by default; new ☰ Probe toggle "💧 Couplant + Material" flips visibility |
| 220 | B7   | UI declutter       | tools-panel fully hidden — every button reachable only via ☰ (drawer is the sole secondary path) |
| 221 | A3   | Visual smoothness  | drawStandardBeam adds a third outer cone layer (1.25 × ffHW, blur 14, α 0.04) — beam edge dissolves into bg |

### New / modified functions

- `_HD_REGISTRY` extended — `💧 Couplant + Material` toggle (Probe) + `PEAK HOLD (toggle)` (Calibration)
- `drawStandardBeam` — A3 outermost bloom layer drawn before the existing HQ glow layer

### New DOM

- `id="cq-mat-row"` added to the controls-row containing `#cq-slider` + `#mat-sel` (B6)
- `.v70-shown` class on `#cq-mat-row` to flip visibility from ☰ toggle (B6)

### New CSS

- `.header > .badge, .header > #freq-badge, .header > #ex-badge, .header > #mode-toggle, .header > #learn-mode-toggle { display:none !important; }` (B4)
- `#ph-cell, #dac-cell, #reset-btn { display:none !important; }` (B5)
- `#cq-mat-row { display:none; }` + `#cq-mat-row.v70-shown { display:flex; }` (B6)
- `.controls-row.tools-panel { display:none !important; }` — overrides v69 §214 force-visible by source order (B7)

### Touched files

- `今日工作區/ut-scanner-v70.html` (renamed from v69; 5 features + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§217–§221)
- `今日工作區/CHANGELOG.md` (this entry)

### Notes

- Puppeteer-verified header now exposes exactly H1 + #theme-toggle + #hamburger-btn (filter via `getComputedStyle().display !== 'none'`).
- Puppeteer-verified EX02 drawer count after v70 = 17 items (15 from v69 + 2 new: Couplant toggle + PEAK HOLD); EX01 = 9 (was 7).
- A3 backport to `drawWeldBeam` deferred until v71 + (along with A4 60-FPS / A5 EX-switch flicker work) — drawWeldBeam has multi-leg rays so the bloom math needs per-leg accounting.
- B7 cleanly overrides v69 B3 by relying on CSS source-order; both rules co-exist in the file as audit trail. Reviewers should read §214 + §220 together for the full B-line story.

---

## v69 — 2026-05-31 EDT

**Trigger:** user "OK 開始 v69" after the proposal book was rewritten per the boss's 2026-05-31 directive (drop teacher tools, focus on student gameplay + program smoothness, add hamburger menu, per-EX contextual UI, dev-lens items become visible physics polish). Scope = B1 + B2 + B3 + A1 + A2 = 5 features. Remaining Lane A items (A3–A9), Lane B is now done, Lane C content queued v70 onward.

### New rules (CLAUDE.md §212–§216)

| §   | Code | Theme              | One-liner |
|-----|------|--------------------|-----------|
| 212 | B1   | UI architecture    | ☰ hamburger drawer (right-slide) — every secondary control categorised + EX-filtered |
| 213 | B2   | UI architecture    | Per-EX contextual control filter (`_EX_HIDE_MAP` + `_applyExFilter`) hides irrelevant rows |
| 214 | B3   | UI architecture    | More-tools toggle absorbed — tools-panel always visible, filtered by B2; legacy button hidden |
| 215 | A1   | Physics smoothness | Defect echo edge-fade replaces hard 0.005 clip with smoothstep(3x²−2x³) — no pop-in / pop-out |
| 216 | A2   | Visual smoothness  | Radial-gradient shadows under probe + each visible defect (EX01–EX04) — depth without competing with beam |

### New / modified functions

- `openHamburger()` / `closeHamburger()` / `_renderHamburger()` — B1 drawer open / close / EX-aware item render
- `injectHamburgerDOM()` IIFE — B1 backdrop + drawer DOM injection
- `_HD_REGISTRY` (frozen) + `_HD_SECTIONS` — B1 single source of truth for every control's `{ section, label, exs, onClick, title? }`
- `_EX_HIDE_MAP` + `_applyExFilter(ex)` — B2 contextual filter
- `_onExChanged` reassigned — preserves v68 mobile bar refresh + adds B2 filter pass per EX switch
- `_signalForSdh` — A1 smoothstep replacement of hard 0.005 cut-off
- `getCrackEcho` — A1 smoothstep applied to lateral-reach falloff `ov`
- `drawScan` (anonymous `_drawV69Shadows` IIFE inserted before transducer fill) — A2 radial-gradient shadow under probe + each defect
- `runSmokeTests` — `ruleCodes.length === 5` preserved; new assert `ruleCodes.join(',') === 'B1,B2,B3,A1,A2'`

### New DOM

- `#hamburger-btn` (header pill, B1)
- `#hamburger-backdrop` (body-injected, B1)
- `#hamburger-drawer` with `.hd-head`, `#hd-body`, `#hd-close-btn` (B1)
- `[data-ex-hidden="1"]` attribute on contextually hidden elements (B2)

### New CSS

- `.hamburger-btn{,:hover}` (B1 header)
- `.hamburger-backdrop{,.open}` + `.hamburger-drawer{,.open}` + theme-light variant (B1 drawer chrome)
- `.hd-head{ ,h3}`, `.hd-close{,:hover}`, `.hd-body`, `.hd-ex-pill`, `.hd-section{ ,summary,summary::after,[open] summary::after,section-body}`, `.hd-btn{,:hover,--primary,[disabled],[disabled]:hover}`, `.hd-empty` (B1 drawer interior)
- `[data-ex-hidden="1"] { display:none !important; }` (B2)
- `.controls-row.tools-panel { display:flex !important; }` + `#more-tools-toggle { display:none !important; }` (B3)

### Touched files

- `今日工作區/ut-scanner-v69.html` (renamed from v68; 5 features + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§212–§216)
- `今日工作區/CHANGELOG.md` (this entry)
- `今日工作區/AI優化與改善建議書.md` (rewritten 2026-05-31 per boss direction; v69 batch ticked off Lane B + A1/A2)

### Notes

- Boss direction recorded as two new memories: `feedback_no_teacher_tools` and `feedback_program_smoothness_focus`.
- `_HD_REGISTRY` total entries: 29; per-EX visible counts puppeteer-verified — resolution 7 / penetration 15 / weld 19 / grating 7 / maze 11.
- A1's smoothstep is applied independently to (a) SDH lateral overlap and (b) crack lateral reach. The existing §6 EJ Gaussian orientation factor stays untouched — A1 only smooths the *spatial* edge transition, not the angular one.
- A2 shadow alphas capped at 0.22 per CLAUDE.md §4 (beam stays the visual focus). EX05 maze skips A2 because the top-down view paradigm has no "below the probe" surface.
- Hamburger drawer fully keyboard-accessible (ESC closes); backdrop click-to-close included.

---

## v68 — 2026-05-31 EDT

**Trigger:** user "HT 全 + A 區全 C區做U1,2,6,8,9,11,22 D區做D5,6" adopting the v67→v68 menu in `AI優化與改善建議書.md`. Scope this version: HT (EX teaching-entry exposure 3-piece kit) + Stage 1 (IJ / IK / IL / HU) = 7 features. Remaining Stages 2–6 queued for v69~v72 to ship progressively (Level 1 basics → Level 2 advanced → Level 2/3 flagship). Source: user fix for v67 §206 HS guided lesson being buried in collapsed More-tools panel.

### New rules (CLAUDE.md §207–§211)

| §   | Code | Theme               | One-liner |
|-----|------|---------------------|-----------|
| 207 | HT   | EX2 fix             | EX-button 🎓 chip + EX2 split entry cards + first-time "Start here" bobbing arrow |
| 208 | HU   | UI framework        | Split cards extended to all EX (Guided / Free play); disabled card on EX w/o lesson |
| 209 | IJ   | Theme               | Dark ↔ Light theme toggle (full var override, projector / print friendly) |
| 210 | IK   | Mobile UX           | Sticky bottom action bar on ≤ 640 px (4 buttons, EX-aware swap for EX5 maze) |
| 211 | IL   | Canvas zoom         | Pinch / Ctrl-wheel zoom + pan on scan-canvas; UI overlays stay at 1× |

### New / modified functions

- `_renderExSplash(ex)` — NEW (HT/HU): renders splash cards into `#ex-splash-wrap`; consults `_EX_LESSON_MAP[ex]` for lesson availability; mounts HT-3 "Start here" chip on first EX2 visit
- `_pickExSplash(choice, ex)` — NEW (HT/HU): handles Guided / Free play card click; marks `ut_ex_splash_seen_<ex>` and `ut_ex2_seen_lesson` sessionStorage flags
- `toggleTheme()` — NEW (IJ): toggles `:root.theme-light`, writes `localStorage.ut_theme`
- `applyInitialTheme()` IIFE — NEW (IJ): reads saved theme on boot
- `_renderMobileBar()` — NEW (IK): EX-aware mobile bar content
- `_mbLesson()` / `_mbCycleEx()` — NEW (IK): mobile-bar lesson + EX-cycle handlers
- `injectMobileBar()` IIFE — NEW (IK): inserts `#mobile-bar` into the DOM
- `zoomCanvas(dir)` / `zoomReset()` / `_applyZoom()` — NEW (IL): canvas zoom/pan controls
- `wireZoom()` IIFE — NEW (IL): wires touch + wheel + mousedown listeners to `.canvas-zoom-wrap`
- `_onExChanged()` + `setExercise` wrapper — NEW: refreshes mobile bar (and any future hooks) on EX change
- `setExercise(ex)` — modified: now calls `_renderExSplash(ex)` near the end
- `gw.open()` — modified: also hides `#ex-splash-wrap`
- `gw.close()` — modified: calls `_renderExSplash(exercise)` to restore entry choice
- `runSmokeTests` — `ruleCodes.length === 3` → `=== 5`; v68 self-extras IIFE warns if any HT/HU/IJ/IK/IL seam is missing

### New DOM

- `#theme-toggle` (header pill, IJ)
- `#ex-splash-wrap` (sibling above `#ex-desc`, contains splash cards, HT/HU)
- `.start-here-chip#ex2-start-here-chip` (transient, HT-3)
- `#canvas-zoom-wrap` (wraps `#scan-canvas`, IL); contains `#zoom-controls` with `#zoom-out`, `#zoom-readout`, `#zoom-in`, `#zoom-reset`
- `#mobile-bar` (body-appended, IK); content rendered per EX
- `.lesson-chip` (inside `#btn-pen`, HT-1)

### New CSS

- `:root.theme-light` full-var override block (IJ)
- `.theme-toggle` / `.theme-toggle:hover` (IJ)
- `.ex-btn .lesson-chip` + `.theme-light` variant (HT-1)
- `.ex-splash{,-card}`, `.ex-splash-card.{primary,disabled,pulse}`, `.esc-{icon,title,sub,tag}`, `@keyframes pulse-card` (HT-2/HU)
- `.start-here-chip` + `@keyframes start-here-bob` + `.fadeout` (HT-3)
- `.mobile-bar` + `.mobile-bar button{,.primary,:active}` + `.mbb-icon` + `@media (max-width:640px)` (IK)
- `.canvas-zoom-wrap`, `.canvas-zoom-wrap.zooming > canvas`, `.zoom-controls`, `.zoom-controls button{,:hover}`, `.zoom-readout` + theme-light variants (IL)
- `@media (max-width:520px) { .ex-splash { grid-template-columns:1fr; } }` (HT-2 mobile single-column)

### New localStorage / sessionStorage keys

- localStorage `ut_theme` ('dark' | 'light') (IJ)
- sessionStorage `ut_ex2_seen_lesson` (HT-3 first-time arrow defeat) (HT-3)
- sessionStorage `ut_ex_splash_seen_<ex>` × 5 (per-EX splash pulse defeat) (HT-2/HU)

### Touched files

- `今日工作區/ut-scanner-v68.html` (renamed from v67; 7 features + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§207–§211)
- `今日工作區/CHANGELOG.md` (this entry)
- `今日工作區/AI優化與改善建議書.md` (compacted format + Stage P reframing of dev-lens items)

### Notes

- v67 §206 HS guided 6dB sizing button (`#gw-6db-btn` inside collapsed `#tools-panel`) is kept as an ADVANCED shortcut — HT exposes the same flow as the primary path via the EX2 splash card, without removing the legacy entry.
- HT-2 cards are *outside* `#ex-desc` so the per-EX `desc.innerHTML = ...` rewrite in `setExercise()` doesn't blow them away each switch.
- IL CSS transform on the canvas leaves HUD overlays (drag-hint, scan-hint, tx-pos-label) static at 1× per user's explicit "UI 不放大" requirement.
- IK mobile-bar uses `env(safe-area-inset-bottom, 10px)` so iPhone home-indicator doesn't overlap. `body { padding-bottom:78px }` only at ≤ 640 px.
- Stage P reframing in `AI優化與改善建議書.md`: the 6 original coder/dev-lens items (ID-II) — modular split, state machine, JSDoc, e2e tests, dev perf overlay, GW flow editor — are converted to 6 *visible* polish items (animation token unify, design token consolidation, EX-switch flicker fix, A-scan 60 FPS stabilisation, EX5 offscreen canvas, toast queue dedup). Will interleave 1–2 per ship from v69 onward.

---

## v67 — 2026-05-29 EDT

**Trigger:** user "先把 1 處理完再去做 3" — adopts D 區 option-1 from `AI優化與改善建議書.md`. Source: 3 Teachable.com screenshots + 1 min 9 s walkthrough video (`uploads/2026-05-29-22-11-19.mp4`). Goal: turn the sim from a tool palette into guided lessons.

### New rules (CLAUDE.md §204–§206)

| §   | Code | Theme            | One-liner |
|-----|------|------------------|-----------|
| 204 | HQ   | Beam Visual      | Outer soft-glow + dragging halo + defect-shadow ghost continuation (`drawStandardBeam`, `drawWeldBeam`) |
| 205 | HR   | Framework (D-V2) | Reusable Guided Walkthrough engine + panel + design tokens; public API `window.gw` |
| 206 | HS   | Exercise (D8)    | 5-step 6 dB drop guided sizing exercise on top of HR; recreates the Teachable video end-to-end |

### New / modified functions
- `drawStandardBeam` (HQ) — outer soft-glow layer, ghost extension below `beamCutY`, dragging halo
- `drawWeldBeam` (HQ) — dragging halo
- `drawScan` (HR) — calls `_drawGwCanvasMarks(ctx)` at end so the persistent L/R marks + width label render every frame
- `_drawGwCanvasMarks` (HR) — NEW: cyan dashed vlines + L/R labels + width annotation
- `gw` engine (HR) — NEW: `open(flowId)`, `close()`, `back()`, `goto(idx)`, `next()`, `submit()`, `feedback(type, msg, ctaCfg)`, `_clearFeedback()`, `render()`; exposed as `window.gw`
- `GW_FLOWS['6db-sizing']` (HS) — NEW: 5-step flow config with per-step `onSubmit` validators + `review` renderer
- `runSmokeTests` — count assertion → matches ship's adopted count (3); +3 new asserts for `window.gw` API and `GW_FLOWS`

### New DOM
- `#gw-panel` (hidden by default; populated by `gw.render()`) containing `#gw-title`, `#gw-step-dots`, `#gw-badge`, `#gw-step-title`, `#gw-step-desc`, `#gw-cta-row`, `#gw-feedback`, `#gw-review`, `#gw-back-btn`, `#gw-step-label`
- `#gw-6db-btn` — "🎓 Guided 6dB Sizing" button in the tools panel next to `#sizing-btn`

### New CSS
- `.gw-panel`, `.gw-panel-head`, `.gw-title`, `.gw-step-dots`, `.gw-step-dot{,--done,--current}`, `.gw-step-card`, `.gw-badge`, `.gw-step-body`, `.gw-step-title`, `.gw-step-desc`, `.gw-cta-row`, `.gw-cta{,--green,--purple,--blue,--red-filled}`, `.gw-feedback{,--error,--success}`, `.gw-footer`, `.gw-back-btn`, `.gw-result-row`, `.gw-result-card`, `.gw-takeaway{,-hd}`, `@media (max-width:420px)` rules

### New localStorage / sessionStorage keys
- None.

### Touched files
- `今日工作區/ut-scanner-v67.html` (renamed from v66; 3 features + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§204–§206)

### Notes
- HS Step 4 review reuses v66 §194 GO helpers (`_currentDefectSP`, `_estBeamWidthMm`) to drive the teaching takeaway — the GO toast warning is now upgraded into a full visual closed-loop lesson.
- The Step 2/3 echo-tolerance is `|amp − 0.5·ref| / ref < 0.08` (i.e. 42–58% of reference passes the 50% target).
- Actual SDH size used for the review is **Φ 3 mm** per CLAUDE.md §43 AN (ASTM E2491).

---

## v66 — 2026-05-29 EDT

**Trigger:** user "同意全部 (A 區 18 條)" on `AI優化與改善建議書.md` (六視角自玩 GG-GX).

### New rules (CLAUDE.md §186–§203)

| §   | Code | Lens     | One-liner |
|-----|------|----------|-----------|
| 186 | GG   | Student  | Strict / Roof (?) chips (consistency with the L2/L3 chip) |
| 187 | GH   | Student  | Strict button shows inline TOL value (≤10 mm / ≤5 mm ∝Φ) |
| 188 | GI   | Student  | Settings backdrop faint dim (rgba 0,0,0,0.12) so modal is perceivable |
| 189 | GJ   | Professor| Sparkline fixed pass line at hit-rate 0.8 ("— pass ≥80%") |
| 190 | GK   | Professor| Elapsed delta chips say slower / faster (not just +/−) |
| 191 | GL   | Professor| Persistent HUD "attempts: N · avg X%" chip (from round 1) |
| 192 | GM   | NDT      | Stationary probe ⇒ L2/L3 sample straight down (shift 0), not laterally |
| 193 | GN   | NDT      | Persistent popup note explains the non-strict min(10, Φ×2.5) cap |
| 194 | GO   | NDT      | 6 dB sizing warns when reflector < beam width (beam-width, not flaw) |
| 195 | GP   | Coder    | `maze.state` write-passthrough smoke assert + hot-path bare-globals note |
| 196 | GQ   | Coder    | Rule-code audit result cached (no per-run innerHTML re-serialise) |
| 197 | GR   | Coder    | `safeSSGet` documents its string-only (no-JSON) contract |
| 198 | GS   | Dev      | `?smoke=verbose` logs every assertion (pass/fail + info) |
| 199 | GT   | Dev      | Formatter smoke asserts test structure, not exact strings |
| 200 | GU   | Dev      | Smoke asserts `__VERSION_DELTA__.ruleCodes.length === 18` |
| 201 | GV   | UI       | Difficulty icon only on active button; FM/GE variant-class regression fix |
| 202 | GW   | UI       | Sparkline row wraps + shrinks caption on < 400 px (no overflow) |
| 203 | GX   | UI       | Popup open lifts canvas above backdrop so probe drag still works |

### New / modified functions
- `_strictBtnLabel` (GH) — NEW: single source for the Strict button label incl. inline TOL
- `toggleMazeStrict` / `setExercise` EX5 entry (GH) — use `_strictBtnLabel()`
- `_refreshMazeBestChip` (GL) — avg chip → persistent "attempts: N · avg X%" from round 1
- `_formatElapsedDelta` + `_maybeUpdateMazeTimer` (GK) — slower / faster word
- `_renderMazeSparkline` (GJ, GW) — fixed pass line + `.mz-sparkline-row`/`.mz-spark-caption` classes
- `_mazeProbeMoving` (GM) — NEW: detect probe movement; drawMazeAscan L2/L3 shift = 0 when still
- `setMazeDifficulty` / `setMazeProbeType` / `setMazeDualRoof` (GV) — preserve `--diff/--probe/--roof` variant class
- `_currentDefectSP` + `_estBeamWidthMm` (GO) — NEW: SP + −6 dB beam-width estimate; `sizingClick` beam-width warning
- `drawMazeScan` (GP) — hot-path bare-globals perf note
- `safeSSGet` (GR) — string-only contract comment
- `runSmokeTests` (GP, GQ, GS, GT, GU) — passthrough assert, cached audit (`_ruleAuditCache`), verbose log, structural formatter asserts, ruleCodes-count assert

### New DOM
- `(?)` help-chip `<span>` beside Strict (GG) + beside Roof row (GG); persistent non-strict-cap note `<div>` (GN); `#scan-canvas.mz-canvas-raised` class toggled on popup open (GX)

### New CSS
- `.mz-settings-backdrop` dim (GI); `#scan-canvas.mz-canvas-raised` (GX); `.mz-sparkline-row` + `@media (max-width:400px)` (GW); removed non-active `.mz-diff-btn--diff::before` outline icon (GV)

### New localStorage / sessionStorage keys
- None.

### Touched files
- `今日工作區/ut-scanner-v66.html` (renamed from v65; 18 changes + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§186–§203)

### Notes
- GV also fixes a v65 regression: `setMazeDifficulty/Probe/DualRoof` reset `className` to bare `'mz-diff-btn'`, stripping the §166 FM hue + §184 GE icon after the first click.

---

## v65 — 2026-05-28 EDT

**Trigger:** user "同意全部 (18 條)" on `AI優化與改善建議書.md` (六視角自玩 FO-GF).

### New rules (CLAUDE.md §168–§185)

| §   | Code | Lens     | One-liner |
|-----|------|----------|-----------|
| 168 | FO   | Student  | Settings pulse auto-dismisses after 6 s (no toggle needed) |
| 169 | FP   | Student  | L2/L3 (?) chip taps out the 3-state cycle (mobile, no hover) |
| 170 | FQ   | Student  | Strict toast concrete "spot centre" wording; dwell 3500→2800 |
| 171 | FR   | Professor| Sparkline best/avg lines named (— best / — avg) + alpha 0.70/0.65 |
| 172 | FS   | Professor| Delta sub-chips get axis title + emoji (🎯 hit / ⏱ elapsed) |
| 173 | FT   | Professor| Manual-override toast says how to release lock; dwell 1800→2400 |
| 174 | FU   | NDT      | Roof disclaimer bound to its row with hr + tinted bg |
| 175 | FV   | NDT      | `_mazeLastDir` starts null; persists last good direction |
| 176 | FW   | NDT      | Reveal toast surfaces non-strict r·2.5 TOL cap when it bites |
| 177 | FX   | Coder    | `mazeSpatialGrid` Map invariant documented + smoke-asserted |
| 178 | FY   | Coder    | `maze.state` Proxy set-trap warns on unknown keys (vs silent seal) |
| 179 | FZ   | Coder    | Smoke tests assert actual `_formatHitRateDelta` output (+ / − / 0) |
| 180 | GA   | Dev      | Smoke re-run gated on tab visibility + visibilitychange re-run |
| 181 | GB   | Dev      | Rule-code audit word-boundary regex (no false +/− matches) |
| 182 | GC   | Dev      | `safeLSGet` warns on unspecified mode (dev); callsites made explicit |
| 183 | GD   | UI       | Settings popup max-width + backdrop outside-click close |
| 184 | GE   | UI       | `.mz-diff-btn` shape icons (◇⊙☐△ → ◆⊚■▲) for colour-blind users |
| 185 | GF   | UI       | Sparkline scale labels moved to a left gutter (no polyline overlap) |

### New / modified functions
- `_mazeTrailDirection` (FV) — `_mazeLastDir` null-init + persistent fallback
- `_renderMazeSparkline` (FR, GF) — best/avg caption, alpha bump, gutter viewBox/labels
- `_renderRevealedScore` (FS) — delta-chip title + emoji
- `revealMaze` (FW) — non-strict cap TOL note in reveal toast
- `toggleMazeStrict` (FQ) — concrete wording + 2800 ms
- `toggleMode` (FT) — manual-override unlock-hint toast + 2400 ms
- `_bindMazeNamespace` (FY) — Proxy set-trap over sealed `maze.state`
- `safeLSGet` (GC) — dev-mode mode-unspecified warning
- `runSmokeTests` (FZ, GB, GA) — formatter output asserts, word-boundary audit regex, visibility-gated re-run
- `setExercise` EX5 entry (FO) — 6 s pulse auto-dismiss
- `wireMazeSettingsBackdrop` (GD) — new init IIFE: backdrop element + outside-click close

### New DOM
- `.mz-settings-backdrop` div (GD); `(?)` help-chip `<span>` beside L2/L3 (FP); `<hr>` + tinted disclaimer in roof group (FU)

### New localStorage / sessionStorage keys
- None — FO reuses `_fsSettingsSeen`; GC only adds explicit modes to existing keys.

### Touched files
- `今日工作區/ut-scanner-v65.html` (18 changes + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§168–§185)
- `今日工作區/CHANGELOG.md` (this entry)

---

## v64 — 2026-05-27 EDT

**Trigger:** user "同意全部 (18 條)" on `AI優化與改善建議書.md` (六視角自玩 EW-FN).

### New rules (CLAUDE.md §150–§167)

| §   | Code | Lens     | One-liner |
|-----|------|----------|-----------|
| 150 | EW   | Student  | Settings popup first-visit pulse + "(3 hidden)" hint |
| 151 | EX   | Student  | L2/L3 toggle title shows full cycle order (follow → ON·lock → OFF·lock → follow) |
| 152 | EY   | Student  | Strict toast adds "TOL X mm → Y mm" old-new comparison |
| 153 | EZ   | Professor| Sparkline best (cyan dashed) + avg (orange dashed) reference lines |
| 154 | FA   | Professor| Score chip flex-wrap + independent hit / elapsed delta sub-chips |
| 155 | FB   | Professor| Manual-override mode toast confirms L2/L3 stays locked |
| 156 | FC   | NDT      | Roof bias disclaimer + Olympus D790 handbook source attribute |
| 157 | FD   | NDT      | Trail-direction persistent fallback (`_mazeLastDir`) |
| 158 | FE   | NDT      | Non-strict TOL explicit cap `min(10, r * 2.5)` |
| 159 | FF   | Coder    | Spatial grid pre-built (empty Map) at init; fallback branch removed |
| 160 | FG   | Coder    | `maze.state` sealed + `mazeStateKeys()` iterator helper |
| 161 | FH   | Coder    | `_formatHitRateDelta` / `_formatElapsedDelta` extracted from render |
| 162 | FI   | Dev      | `window.runSmokeTests()` + 30 s dev-mode re-run |
| 163 | FJ   | Dev      | `__VERSION_DELTA__` object + smoke audit "rule X tagged" |
| 164 | FK   | Dev      | `safeLSGet(key, fallback, mode='string'\|'json')` explicit type |
| 165 | FL   | UI       | Settings popup body absolute float + shadow + z-index |
| 166 | FM   | UI       | `.mz-diff-btn` variants (diff/probe/toggle/roof) coloured by hue |
| 167 | FN   | UI       | Sparkline scale label 6 px + dark contrast rect |

### New / modified functions

- `safeLSGet(key, fallback, mode)` — new third arg, explicit `'string' | 'json'` (FK)
- `_refreshMazeMultiBounceBtn` — dynamic 3-state cycle title (EX) + variant class (FM)
- `toggleMazeStrict` — TOL old → new comparison toast (EY) + variant class (FM)
- `_mazeStrictTolFor(spot)` — non-strict path now `min(10, r * 2.5)` cap (FE)
- `mazeSpatialGrid` initialiser — pre-built `new Map()` so footprint fallback drops (FF)
- `_mazeProbeFootprint(p)` — `if (mazeSpatialGrid)` branch removed (FF)
- `_mazeTrailDirection()` — `_mazeLastDir` persistent fallback (FD)
- `mazeStateKeys()` — new iterator helper exposing the proxy key list (FG)
- `_bindMazeNamespace()` — `Object.seal(maze.state)` after binding (FG)
- `_formatHitRateDelta(score, prev)`, `_formatElapsedDelta(score, prev)` — new pure helpers (FH)
- `_renderRevealedScore(score, prev)` — uses helpers + flex-wrap sub-chip HTML (FA, FH)
- `toggleMode(forceState)` — manual-override branch issues new "stays locked" toast (FB)
- `_renderMazeSparkline(entries)` — adds best/avg reference lines (EZ) + 6 px dark rect labels (FN)
- `setExercise('maze')` — first-visit detection + pulse class + sessionStorage flag (EW); strict btn picks up `--toggle` variant (FM)
- `runSmokeTests()` — expanded assertion set; audits each `__VERSION_DELTA__` rule code (FI, FJ)
- `window.runSmokeTests` — global handle for DevTools (FI)
- 30 s `setInterval` re-run guarded by `?dev` URL flag (FI)

### New DOM IDs

- `#mz-settings`, `#mz-settings-summary` — settings popup identifiers for EW pulse / text swap

### New CSS classes

- `.mz-settings--pulse` + `@keyframes mz-settings-pulse` (EW)
- `.mz-diff-btn--diff`, `.mz-diff-btn--probe`, `.mz-diff-btn--toggle`, `.mz-diff-btn--roof` (FM)
- `.mz-score-chip`, `.mz-delta-chip`, `.mz-delta-chip--hit-pos/neg`, `.mz-delta-chip--elapsed-pos/neg` (FA)
- `.mz-settings-body { position:absolute; box-shadow; z-index:50; }` (FL)

### New globals

- `MAZE_STATE_KEYS` (frozen array, FG)
- `_mazeLastDir` (FD)
- `__VERSION_DELTA__` (frozen, FJ)

### New localStorage / sessionStorage keys

- sessionStorage `_fsSettingsSeen` (EW; '1' once popup expanded)

### Touched files

- `今日工作區/ut-scanner-v64.html` — all 18 implementations
- `今日工作區/CLAUDE.md` §150–§167 rule entries
- `今日工作區/CHANGELOG.md` (this entry)

---

## v63 — 2026-05-25 EDT

**Trigger:** user "同意全部 (18 條)" on `AI優化與改善建議書.md` (六視角自玩 EE-EV).

### New rules (CLAUDE.md §132–§149)

| §   | Code | Lens     | One-liner |
|-----|------|----------|-----------|
| 132 | EE   | Student  | L2/L3 toggle 3-state badge (auto vs lock) |
| 133 | EF   | Student  | Critical patches → orange dashed (no red collision with ✗ missed) |
| 134 | EG   | Student  | Strict toggle warns N existing markers will be re-scored |
| 135 | EH   | Professor| Hit-rate delta in percentage POINTS + baseline range |
| 136 | EI   | Professor| Sparkline midline + "higher = better" caption |
| 137 | EJ   | Professor| Mode toast on L2/L3 follow-mode visibility flip |
| 138 | EK   | NDT      | Dual roof-angle selector 5°/7°/10° (bias 1.011/1.020/1.040) |
| 139 | EL   | NDT      | Footprint shift along probe trail direction |
| 140 | EM   | NDT      | Proportional strict TOL by spot Φ (ASNT Level 2) |
| 141 | EN   | Coder    | Spatial grid hash for footprint queries (~50× faster) |
| 142 | EO   | Coder    | `maze.{state,config,helpers}` namespace via dual-write proxy |
| 143 | EP   | Coder    | `revealMaze` split into 6 single-responsibility helpers |
| 144 | EQ   | Dev      | Inline `runSmokeTests()` with dev banner on failure |
| 145 | ER   | Dev      | CHANGELOG.md emit per ship (this file) |
| 146 | ES   | Dev      | `LS_KEYS` registry + `safeLSGet`/`safeLSSet` wrappers |
| 147 | ET   | UI       | `⚙ Settings ▾` popup (L2/L3 + Strict + Roof) |
| 148 | EU   | UI       | Visual weight ladder (action 10 px / select 6 px / stat 3 px) |
| 149 | EV   | UI       | Sparkline contrast + scale labels + round line caps |

### New / modified functions

**New:**
- `safeLSGet(key, fallback)` / `safeLSSet(key, value)` — ES wrappers
- `safeSSGet(key, fallback)` / `safeSSSet(key, value)` — sessionStorage equivalents
- `_dualVpathBias()` — derives bias from `mazeDualRoofAngle` (EK)
- `setMazeDualRoof(angle)` — EK roof-angle selector handler
- `_mazeStrictTolFor(spot)` — EM proportional strict TOL
- `_rebuildMazeSpatialGrid()` — EN spatial hash builder
- `_mazeTrailDirection()` — EL probe-motion direction vector
- `_bindMazeNamespace()` — EO maze.{state,config,helpers} proxy binder
- `_computeMazeScore(markers, spots)` — EP split
- `_recordMazeRound(score)` — EP split
- `_updateBestScore(score)` — EP split
- `_announceBestIfBeat(score, isNewBest)` — EP split
- `_announceEasyPassIfEligible(score)` — EP split
- `_renderRevealedScore(score, prev)` — EP split (now %pts baseline EH)
- `runSmokeTests()` — EQ assertions + dev banner

**Modified:**
- `toggleMazeMultiBounce` — EE 3-state badge HTML
- `_refreshMazeMultiBounceBtn` — EE auto/lock badge
- `toggleMazeStrict` — EG warning toast
- `toggleMode` — EJ follow-mode visibility toast
- `revealMaze` — fully rewritten as orchestrator over EP helpers + EG TOL string
- `drawMazeAscan` — EK bias readout, EL trail-direction shift in L2/L3 loop
- `drawMazeScan` — EF orange critical core + missed loop using EM per-spot TOL
- `generateMaze` — EN spatial grid build at end
- `setMazeProbeType` — EN rebuild + EK roof-row visibility
- `_mazeProbeFootprint` — EN spatial-grid candidate iteration
- `_renderMazeSparkline` — EI midline + EV contrast + scale + round caps

### New DOM IDs

- `mz-roof-group` — dual roof-angle group container (EK)
- `mz-roof-5` / `mz-roof-7` / `mz-roof-10` — roof preset buttons (EK)
- `<details class="mz-settings">` Settings popup chip (ET) — no ID; `<summary>` text "⚙ Settings ▾"

### New localStorage / sessionStorage keys

- `ut_maze_dual_roof` — selected dual roof angle 5/7/10 (EK)

All existing keys (`ut_maze_best`, `ut_maze_strict`, `ut_maze_multibounce`, `ut_ex_completed`, `ut_learn_mode`, `ut_seen_drag_hint`, `ut_more_tools_open`, `_fsHistoryTab`) now flow through `LS_KEYS` registry (ES).

### Touched files

- `ut-scanner-v63.html` (created from v62 + 18 patches)
- `CLAUDE.md` (added §132–§149)
- `CHANGELOG.md` (this file — first entry)
- `2026-05-25_工作日誌.txt` (ship log entry per [[feedback_log_after_ship]])
