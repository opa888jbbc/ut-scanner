# UT Scanner CHANGELOG

Per CLAUDE.md §145 ER — first formal version-diff document.
Audit / regression source-of-truth. Every ship from v63 onward records:
- New rules (§N..§M)
- Modified / new functions
- New DOM IDs
- New localStorage keys
- Touched files

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
