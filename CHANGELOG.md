# UT Scanner CHANGELOG

Per CLAUDE.md §145 ER — first formal version-diff document.
Audit / regression source-of-truth. Every ship from v63 onward records:
- New rules (§N..§M)
- Modified / new functions
- New DOM IDs
- New localStorage keys
- Touched files

---

## v79 — 2026-06-03 EDT

**Hotfix 2026-06-04 EDT (user red-light):** (1) **BO-5 removed** — the clipped cyan interface highlight ("藍色高光不符合我的需求"); no cyan/extra line above the defect. (2) **`getPlanarSignal().block` rewritten** from `maxOverlap / _maxPossOv` (jumped 0→1 over a tiny probe move on a Φ3mm SDH → shadow/BW snapped on) to a **geometric distance + smoothstep** model: `block = smoothstep(max(0, 1 − dist/beamHalfWidthPx()))`, `dist = |txX − active-SDH centre|`. Occlusion now fades smoothly across the whole beam width (verified sweep: block 1.0 → 0.78 → 0.35 → 0.03 → 0; bwAmp rises in step). ruleCodes back to `BO-1..BO-4`; smoke 69/69. (3) **EX01 occlusion unified with EX02** — extracted shared `calculateBeamOcclusion(probeX, objLeft, objRight)` (reach = `beamHalfWidth + objectHalfWidth`, smoothstep). Both `getPlanarSignal` (EX02 SDH) and `getLineDefSignal` (EX01 cluster) call it; EX01 `interactionBlock` + BW now driven by it → EX01 & EX02 produce an **identical** smooth curve (both sweep 1.0 → 0.784 → 0.352 → 0.028 → 0). Boundary-aware `reach` handles the wide pore cluster vs the point SDH. No regression; smoke 69/69.

**Trigger:** continued iteration on the EX01/EX02 beam-occlusion complaint (4th–6th passes). v75/76/77 only tweaked the shadow gradient. v79 = Beam Overhaul (BO-1..BO-5). A wavefront/arc "animated beam" was prototyped and **rejected** by the user ("方向不對，不用往黃色光束方向去做") — it lived only in a throwaway proto and was never shipped. Final direction: bold beam + strong occlusion + no reflection + a clipped cyan interface highlight (user red-light authorised 2026-06-04).

### New rules (CLAUDE.md §256–§260)

| §   | Code | One-liner |
|-----|------|-----------|
| 256 | BO-1 | Bold incident cone — core gradient alpha 0.52→0.82 / 0.20→0.46 / 0.05→0.14 |
| 257 | BO-2 | Reflection visuals REMOVED (SH5 wave + SH9 specular + reflected-ray cue) per user "不需要有東西從球體反射回來" |
| 258 | BO-3 | Strong occlusion — `_belowFactor`/`_bloomBelow` = 1 − smoothstep(interactionBlock)×0.95 |
| 259 | BO-4 | Declutter — near-field band / cone dashed / θ label / sound-path dashed dimmed |
| 260 | BO-5 | Clipped interface highlight — cyan line along beam∩defect at the SDH top (EX02) |

### Modified functions
- `drawStandardBeam` — BO-1 (`_v74AlphaAt` + gradient stops), BO-3 (`_occ` smoothstep + `_belowFactor`/`_bloomBelow`), BO-4 (dim near-field band/cone edge/divider/θ label), BO-5 (clipped interface highlight at the tail; **additive only** — does not touch `beamGrad`, `interactionBlock`, or any geometry var).
- EX01 pore loop + EX02 `_drawSdh` — removed `_drawSH5ReflectionWave` / `_drawSH9SpecularReflection` calls + EX02 reflected-ray cue (BO-2). Helper fns kept DEFINED (smoke guards).

### Smoke tests
- `ruleCodes.length === 5` + join `'BO-1,BO-2,BO-3,BO-4,BO-5'`; rule-audit §256–§260 tags present. **70 assertions pass.**
- Existing beam guards (`_belowFactor`, `interactionBlock`, `hWBot, beamBot`) still pass.

### Touched files
- `今日工作區/ut-scanner-v79.html` (renamed from v78; BO-1..BO-5 + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§256–§260)
- `今日工作區/CHANGELOG.md` (this entry)

### Notes
- Verified headless (puppeteer + Chrome): bold cone, strong shadow below the object, no reflection, cyan clipped highlight on the SDH top. Public share via trycloudflare quick tunnel.
- EX03 weld (drawWeldBeam) out of scope. EX01 blue-pore interface highlight (BO-5 analog) flagged as a follow-up.

---

## v77 — 2026-06-02 EDT

**Trigger:** user "SH9 Physics Correction Directive (UT Energy Redistribution Model)" + "OK SH9 全採". Major paradigm pivot: beam stops being modeled as light + shadow and becomes acoustic energy that redistributes on contact (reflection / scattering / transmission / minimal residual shadow). All v75/v76 SH4/SH6/SH7 work is reverted; replaced by the SH9 family.

### New rules (CLAUDE.md §243–§251)

| §   | Code   | Theme                                | One-liner |
|-----|--------|--------------------------------------|-----------|
| 243 | SH9-a  | Incident Wave Preservation           | Cone always full from probe to BW; no defect-dependent geometry |
| 244 | SH9-b  | Reflection Primary                   | `getReflectionPath()` generic helper + `_drawSH9SpecularReflection()`: 3 phased ripple packets per SDH travel along def→probe; intensity = defAmp |
| 245 | SH9-c  | Pore Mie Scatter                     | `_drawSH9PoreScatter()`: 7 rays per pore, pore-index seeded angular jitter; intensity = `_perPoreAmp(i).amp` |
| 246 | SH9-d  | Minimal Residual Shadow              | 2.5% alpha dim spot at BW under defect X only |
| 247 | SH9-e  | Transmitted Energy                   | Gradient-stop split at interactionY: above unchanged (v74-identical); below × 0.85 |
| 248 | SH9-f  | BW Behavior (audit)                  | §1 linear attenuation preserved in `getPlanarSignal().bwAmp` + `getLineDefSignal().bwAmp` |
| 249 | SH9-g  | A-Scan Coupling                      | Every visual ripple intensity uses the SAME value the A-scan uses |
| 250 | SH9-h  | Educational Goal (documentation)     | Teach reflection / scattering / redistribution; not flashlight / shadow |
| 251 | SH9-i  | Amplitude Coupling                   | `_perPoreAmp(i)` extracted as shared helper; getPoreSignals + SH9-c renderer both consume |

### Deprecated rules (audit trail preserved in CLAUDE.md)

- §239 SH4 (smooth fade band) — reverted in drawStandardBeam; replaced by SH9-a + SH9-e
- §241 SH6 (ghost taper) — reverted; energy past defect now handled by SH9-e gradient stop + SH9-d shadow
- §242 SH7 (EX01 pore-driven hasCut) — reverted; replaced by SH9-c scatter ripples + SH9-e energy split

### Modified functions

- `getPoreSignals` — refactored to call `_perPoreAmp(i)` per pore (SH9-i shared source). Output entries now include `poreIdx` field.
- `drawStandardBeam` — substantial rewrite (SH9-a + SH9-e + SH9-d). `ps2 / hasCut / beamCutY / fadeEndY / hWFadeEnd / ghost` all gone. New `hasInteraction / interactionY` only drives the gradient-stop split, never the polygon shape. `_v74AlphaAt(t)` inner helper computes the v74-equivalent gradient value at any normalised position so the upper portion stays bit-identical to v74.
- EX01 pore drawing loop (`drawScan` `exercise==='resolution'` branch) — appends `_drawSH9PoreScatter(ctx, wx, wy, rr, _perPoreAmp(pi).amp, pi)` after each pore (keeps SH5 surface highlight per decision 2).
- EX02 `_drawSdh` helper (inside `drawScan` `exercise==='penetration'` branch) — appends `_drawSH9SpecularReflection(ctx, cx, cy, txX, SURF_Y, sdhSig.defAmp)` after the cyan SH5 highlight.

### New functions

- `_perPoreAmp(poreIdx)` — SH9-i shared per-pore amp formula. Returns `{amp, sen, p, wx}`. Out-of-range index returns safe zero.
- `getReflectionPath(defX, defY, probeX, probeY)` — SH9-b generic. Returns `{dx, dy, len, ux, uy}` — unit vector pointing FROM defect TO probe. NEVER hardcodes upward. Future-compatible with EX03 weld 45°/60°/70° / PAUT / sector scans.
- `_drawSH9SpecularReflection(ctx, defX, defY, probeX, probeY, defAmp)` — directional cyan ripple packet from defect along reflection path. 3 phased packets staggered 500 ms each (1500 ms cycle). Focused cone half-width scales with defAmp.
- `_drawSH9PoreScatter(ctx, poreX, poreY, poreR, poreAmp, poreIdx)` — pore Mie scattering. 7 rays at deterministic pseudo-random angles seeded by poreIdx; phase offsets per ray; expanding radius animation; alpha fades with phase.

### Smoke tests

- `ruleCodes.length === 9` + matches `'SH9-a,SH9-b,SH9-c,SH9-d,SH9-e,SH9-f,SH9-g,SH9-h,SH9-i'`
- `getReflectionPath` returns generic non-upward result for off-axis probe
- `_drawSH9SpecularReflection` / `_drawSH9PoreScatter` present
- `_perPoreAmp` returns the expected shape + safe on out-of-range
- `drawStandardBeam.toString()` no longer contains `fadeEndY` / `hWFadeEnd` (SH9-a revert verified by code inspection)
- `drawStandardBeam.toString()` contains the SH9-d 0.025 shadow alpha literal

### Touched files

- `今日工作區/ut-scanner-v77.html` (renamed from v76; SH9 family + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§243-§251 added; §239 SH4 / §241 SH6 / §242 SH7 marked DEPRECATED with audit-trail comments)
- `今日工作區/CHANGELOG.md` (this entry)
- `今日工作區/AI優化與改善建議書.md` (SH9-a..SH9-i marked ✅ shipped; v78 = M5-1/2/3/4 PE/PC/TT next)
- Vault `wiki/acoustic-shadow-bea.md` (created during SH8 research; physics correct but paradigm direction wrong — kept for reference, superseded by SH9 directive)

### Notes

- This is the third hotfix attempt at the same complaint. v75 (SH4/SH6) used a sharp fade band, v76 (SH7) extended scope, both still felt like "beam blockage" to the user. v77 SH9 finally pivots away from optical-shadow modeling entirely.
- The cone shape is now byte-identical to v74 above the defect; only the gradient gets two extra colour stops below the interaction point.
- SH9-h is a documentation-only rule (no code touch points) — included to anchor all future visual decisions to the energy-redistribution paradigm.
- EX03 weld is NOT in scope per decision 3 (user agreed). drawWeldBeam has its own ray-marching + per-leg overlap logic (§50 AR-full) and will be updated to SH9 paradigm in a separate batch later.
- The Vault note `wiki/acoustic-shadow-bea.md` was written during SH8 brainstorming but the user pointed out the paradigm direction itself was wrong. The note's BEA / Mirror-Shadow / umbra-penumbra physics is still correct; just not the right teaching frame for this simulator. Note kept for reference.

---

## v76 — 2026-06-02 EDT

**Trigger:** user "先把我說的陰影的部分處理好其他的先不動" with annotated screenshot `uploads/螢幕擷取畫面 2026-06-02 023101.png` showing purple paint over the cone region below the EX01 porosity cluster (= "this region should be dark / shadowed but it's currently bright"). v75's SH4/SH6 rules explicitly excluded EX01 with the comment "pore 體積散射不擋 beam, 無 cut" — that was a scope error. Pores DO attenuate beam through volumetric scattering. v76 fixes the scope only; no other changes.

### New rule (CLAUDE.md §242)

| §   | Code  | Theme                                  | One-liner |
|-----|-------|----------------------------------------|-----------|
| 242 | SH7   | SH4/SH6 scope extended to EX01 porosity | drawStandardBeam hasCut detection adds EX01 branch; max-sen pore drives beamCutY + larger fade band |

### Modified functions

- `drawStandardBeam` (SH7) — hasCut/beamCutY/defectR_px computation refactored. New `else if (exercise === 'resolution' && PORES.length > 0)` branch iterates pores, finds max-sensitivity in-beam pore (same `1 - |txX - poreX|/beamHW` model as the pore drawing loop), sets `hasCut=true / beamCutY=that pore's Y / defectR_px=pore radius`. SH4 fade band + SH6 ghost taper code paths unchanged — EX01 inherits the visual automatically.

### Smoke tests

- `ruleCodes.length === 1` / `ruleCodes === 'SH7'`
- `SH7 EX01 sen calc valid`: probe over first pore → sen=1 > 0.10 (triggers); probe one beamHW away → sen=0 ≤ 0.10 (does not trigger). Validates the threshold geometry.

### Touched files

- `今日工作區/ut-scanner-v76.html` (renamed from v75; SH7 patch + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§242 + §239 SH4 / §241 SH6 適用範圍註記修正)
- `今日工作區/CHANGELOG.md` (this entry)
- `今日工作區/AI優化與改善建議書.md` (SH7 marked ✅ shipped v76)

### Notes

- This is a hotfix-of-hotfix. v75 shipped SH4/SH5/SH6 but excluded EX01 from SH4/SH6. The user's earlier "OK SH4-SH6 全採" was intended to cover EX01 (their original message said "ex1,2") — my scope decision in v75 was wrong.
- §3 collision-truncation rule unchanged — SH7 just extends what counts as a "collision" from planar reflectors (SDH/crack) to volumetric scatterers (pore cluster).
- SH5 cyan reflection wave on EX01 pores was already shipped in v75 (per-pore ripple in pore loop); v76 only fixes the beam-shadow side of the equation.

---

## v75 — 2026-06-01 EDT

**Trigger:** user "OK SH4-SH6 全採" adopting all 3 hotfix entries from the proposal book. Source: `uploads/2026-06-01-09-36-19.mp4` (Teachable Step 1/5 walkthrough). User comparison: "ex1,2 的聲波正常來說照到 crack 應該要像它一樣漸漸消失才對, 而不是像 ex2 那樣直接消失". The video shows three visible elements missing from sim: (a) horizontal cyan reflection wave along crack surface, (b) smooth beam fade rather than hard cut, (c) beam continuing past crack to back wall. v75 patches all three in `drawStandardBeam` + EX01/EX02 defect loops.

### New rules (CLAUDE.md §239–§241)

| §   | Code  | Theme                                  | One-liner |
|-----|-------|----------------------------------------|-----------|
| 239 | SH4   | Smooth beam fade (replaces hard cut)   | Polygon bottom moves beamCutY → fadeEndY = beamCutY + max(4, 1.5 × defectR); gradient adds smoothstep stops through crack zone |
| 240 | SH5   | Cyan reflection wave on defect surface | `_drawSH5ReflectionWave` helper; ellipse along defect upper edge; width 2r→6r with sensitivity; lateral alpha falloff; breathing jitter |
| 241 | SH6   | Enhanced ghost continuation            | Alpha 0.04 → 0.08; width tapers DOWN hWCut → 0.40 × hWCut at beamBot (narrow pencil, not v67 HQ expansion) |

### Modified functions

- `drawStandardBeam` (SH4 + SH6) — replaced hard cut at beamCutY with smoothstep fade band; new vars `hasCut` / `defectR_px` / `fadeBandPx` / `fadeEndY` / `hWFadeEnd`; all 3 cone layers (ultra-soft bloom 1.25× / HQ glow 1.10× / main gradient) now end at fadeEndY; main gradient gains 4 smoothstep colour stops through crack zone; ghost continuation rewritten with shrinking taper
- `drawScan` EX01 pore loop (SH5) — calls `_drawSH5ReflectionWave(ctx, wx, wy, rr, sen)` after each pore circle drawn
- `drawScan` EX02 `_drawSdh` helper (SH5) — calls `_drawSH5ReflectionWave(ctx, cx, cy, r, ov)` at the end of each SDH render

### New functions

- `_drawSH5ReflectionWave(ctx, cx, cy, defR, sen)` — Standalone helper drawing horizontal cyan reflection ripple. Returns early when sen ≤ 0.05. Uses 5-stop linear gradient (0 → ctrAlpha*0.20 → ctrAlpha → ctrAlpha*0.20 → 0), `performance.now()/400` breathing phase. Inner brighter highlight at sen > 0.45.

### Smoke tests

- Replaced v74's 12 immersion-specific asserts with 8 carry-over + v75 hotfix asserts: `ruleCodes.length === 3` / `ruleCodes === 'SH4,SH5,SH6'` / `_drawSH5ReflectionWave` typeof / sen=0 no-throw guard / SH4 fade band ≥ 4 px / §3 anchor still in HTML / SH6 taper < 1.0 / carry-over: drawImmersionScene + updateImpedancePanel + btn-immersion still present.

### Touched files

- `今日工作區/ut-scanner-v75.html` (renamed from v74; SH4+SH5+SH6 patches + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§239–§241)
- `今日工作區/CHANGELOG.md` (this entry)
- `今日工作區/AI優化與改善建議書.md` (SH4-SH6 marked ✅ shipped; v75 hotfix row inserted before v76 = M5-1/2/3/4)

### Notes

- §3 carbon-rule "碰撞截斷機制" stays in CLAUDE.md unchanged — SH4 is its smooth visual implementation, NOT a replacement. The `beamCutY` variable still drives the optical truncation point; SH4 just extends the polygon and gradient to fade out around it instead of slicing.
- EX01 (porosity) does NOT get SH4 / SH6 because pores are volumetric scatterers in CLAUDE.md (don't trigger beam-cut path). EX01 only receives SH5 (cyan ripple per pore) which gives the missing "interaction visual" without changing beam shape.
- EX03 weld is on the drawWeldBeam path with its own multi-crack physics (§50 AR-full / §74 BR / §85 CJ corner-trap + tip-diffraction). Not touched in v75 to avoid coupling SH4/SH5/SH6 with the weld-specific beam topology.
- EX06 immersion bypasses drawStandardBeam entirely (drawImmersionScene early-return) so SH4-SH6 do not affect Module 5.

---

## v74 — 2026-06-01 EDT

**Trigger:** user "OK M5 全採 → 繼續 74 版本" adopting all 9 Module-5 entries from the proposal book. Boss separately stipulated "Module 5 是浸水式所以呈現的方式要更有邏輯 — 知識庫內找資料". v74 ships the immersion-coherent batch (5 of the 9 M5 entries: M5-5, M5-6, M5-7, M5-8, M5-9); v75 will ship the remaining 4 (M5-1 PE/PC/TT selector, M5-2 EX07 PC, M5-3 PC sensitive zone, M5-4 EX08 TT). Physics source = Vault `wiki/ut-immersion.md` (4 sub-modes matrix, water-path formula `WP_min = t × c_water / c_steel`, FS echo 88 % reflection, focused probe trade-offs).

### New rules (CLAUDE.md §234–§238)

| §   | Code  | Theme                          | One-liner |
|-----|-------|--------------------------------|-----------|
| 234 | M5-5  | EX06 Immersion basis           | Probe-above-water + 4-peak A-scan (IP→FS→D→BW) + WP slider 5-50 mm + IF gate band + FS₂ overlap warn |
| 235 | M5-6  | Wheel sub-mode                 | Rolling rubber-tyre housing (water inside) + spinning spokes + hybrid badge |
| 236 | M5-7  | Bubbler + Squirter sub-modes   | Bubbler short column with rising bubbles · Squirter long high-pressure jet with speed streaks + lateral spray fringe |
| 237 | M5-8  | Acoustic Impedance Z + R/T     | Live Z = ρ × c · R/T at water-material interface; follows material selector via density-by-c lookup |
| 238 | M5-9  | ex-bar Module 5 grouping       | Vertical "M5 · TECHNIQUES" dashed-bordered label between EX05 and EX06; sky-blue accent |

### New / modified functions

- `setImmersionSubMode(mode)` — NEW (M5-6 / M5-7): switches between 4 sub-modes; updates button classes + fires explanatory toast
- `onWpChange()` — NEW (M5-5): WP slider input handler; updates `wp-val` chip + recomputes overlap warning
- `_immersionCriticalWpMm()` — NEW (M5-5 / M5-8): `IMMERSION_THICKNESS_MM × (C_WATER_M_S / (materialC × 1000))` per Vault formula
- `_updateImWpWarning()` — NEW (M5-5): shows / hides the red "FS 2nd echo before BW" banner based on slider vs critical
- `updateImpedancePanel()` — NEW (M5-8): live Z + R/T calc; hooked into `setMaterial()` so material switching ripples through immediately
- `drawImmersionScene(ctx)` — NEW (M5-5 / M5-6 / M5-7): side-view scan canvas; calls `_drawImmersionCoupling()` for sub-mode visuals and `_drawImmersionProbe()` for suspended probe
- `_drawImmersionCoupling(ctx, x, probeFaceY, wpPx)` — NEW (M5-6 / M5-7): 4 sub-mode water column rendering (tank full bath / wheel tyre + spokes / bubbler nozzle + bubbles / squirter long jet + spray)
- `_drawImmersionProbe(ctx, x, y)` — NEW (M5-5): dark-grey probe block with cyan active-face glow
- `drawImmersionAscan(ctx, W, H)` — NEW (M5-5): standalone immersion A-scan (μs time domain) with 4 peaks, IF gate band, FS₂ overlap visual marker
- `drawScan` — modified (M5-5): early-returns to `drawImmersionScene` for EX06
- `drawAscan` — modified (M5-5): early-returns to `drawImmersionAscan` for EX06
- `_setExerciseCore` — modified (M5-5 / M5-9): handles `'immersion'` branch, sets button className, shows / hides immersion controls, centres probe horizontally on first entry, calls impedance panel update
- `setMaterial` — modified (M5-8): calls `updateImpedancePanel()` after materialC update
- `resetExercise` — modified (M5-5): resets WP slider to 35 mm + sub-mode to 'tank' when EX06 is active
- `runSmokeTests` — `ruleCodes.length === 5` count + ship is `'M5-5,M5-6,M5-7,M5-8,M5-9'`; 10 new asserts for immersion plumbing (drawImmersionScene fn / drawImmersionAscan fn / onWpChange fn / WP default safe / setImmersionSubMode fn / 4 sub-modes present / invalid sub-mode rejected / updateImpedancePanel fn / steel R≈88% / critical WP formula)

### New DOM

- `<button id="btn-immersion">` — EX06 ex-bar button with 💧 Immersion label (M5-5)
- `<span class="ex-group-label">M5 · TECHNIQUES</span>` — vertical grouping divider between EX05 and EX06 (M5-9)
- `<div id="immersion-controls">` — collapsible controls bar (M5-5 / M5-6 / M5-7 / M5-8) containing:
  - 4 × `.im-mode-btn` (im-mode-tank / im-mode-wheel / im-mode-bubbler / im-mode-squirter)
  - `<input id="wp-slider" min="5" max="50" value="35">` + `<span id="wp-val">35 mm</span>`
  - `<span id="im-impedance-z">` + `<span id="im-impedance-rt">` (M5-8 Z and R/T chips)
  - `<div id="im-wp-warning">` (M5-5 FS₂ overlap banner)

### New CSS

- `.ex-btn.active-immersion` + sky-blue (#1e90ff) hue (M5-5)
- `.ex-group-label` + `.theme-light .ex-group-label` — vertical writing-mode dashed-bordered grouping divider (M5-9)
- `.immersion-controls{ .visible }` + `.im-group` + `.im-mode-btn{ :hover, .active }` + `#wp-slider` + `#wp-val` + `.im-stat` + `.im-warning` + light-theme variants (M5-5 / M5-6 / M5-7 / M5-8)
- Inline colour spans inside Z and R/T chips: `.im-z-mat` (orange) / `.im-z-water` (cyan) / `.im-rt-r` (red) / `.im-rt-t` (green) (M5-8)

### New globals

- `immersionSubMode` ('tank' / 'wheel' / 'bubbler' / 'squirter')
- `immersionWaterPathMm` (5–50, default 35)
- `IMMERSION_THICKNESS_MM` (100, frozen by convention)
- `IMMERSION_DEFECT_DEPTH_MM` (50, single SDH reference)
- `IMMERSION_DEFECT_RX` (0.50, centre of plate)
- `C_WATER_M_S` (1480, Vault impedance table)
- `IMMERSION_DENSITY_BY_C` (steel 7.85 / aluminium 2.70 / copper 8.96 / cast iron 7.20)
- `IMMERSION_SUBMODE_META` (label / wpHint / industry tag per sub-mode)

### New localStorage / sessionStorage keys

- None. Immersion state is session-only (slider + sub-mode reset on page reload).

### Keyboard shortcuts

- `6` → `setExercise('immersion')` added to the existing 1–4 EX shortcuts. `5` and `0` still control freq (precedence preserved).

### Touched files

- `今日工作區/ut-scanner-v74.html` (renamed from v73; 5 features + 3 user-visible version strings + `__VERSION_DELTA__`)
- `今日工作區/CLAUDE.md` (§234–§238)
- `今日工作區/CHANGELOG.md` (this entry)
- `今日工作區/AI優化與改善建議書.md` (M5-5/6/7/8/9 marked ✅ shipped; schedule rebased so v75 takes M5-1/2/3/4 + remaining six-lens items)

### Notes

- Vault `wiki/ut-immersion.md` was the single physics source — already complete (4 sub-modes / water-path formula / FS echo / impedance / decision tree). No new ingest needed.
- Boss feedback "Module 5 是浸水式所以呈現的方式要更有邏輯" satisfied by: (1) layered ex-desc walking through the 4 sub-modes one by one tied to industry use-cases, (2) WP slider with live critical-warning visualising the physics inequality, (3) IF gate band annotated on the A-scan, (4) Z/R/T panel that updates live when materialC changes (steel→Al drops R from 88% to ~70%, observable in real time).
- v75 plan: M5-1 (header PE/PC/TT chip selector) + M5-2 (EX07 PC lab) + M5-3 (PC sensitive zone visualization) + M5-4 (EX08 TT lab). The Module 5 grouping divider added in M5-9 already accommodates the additional buttons.
- v74 grandfathers v73 SH carry-over smoke (SH1 _findShadowOcclusion / SH2 shallowest / SH3 column-width) so the EX01–EX03 shadow occlusion fix doesn't regress.

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
