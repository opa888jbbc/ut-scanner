// js/ex05-maze.js - EX05 Corrosion Maze module (Stage 3 modular refactor, 2026-06-07 EDT).
// Extracted verbatim from core.js. Load order: registry.js -> ex0X modules -> core.js. Defines the
// maze functions + the `maze` namespace Proxy object + MAZE_STATE_KEYS + maze-only constants, then
// self-registers. The maze DATA globals (mazeSpots/mazeRevealed/MAZE_NORMAL_MM/... + txY) stay in
// core.js (top STATE block); the Proxy forwards to them and core init calls _bindMazeNamespace() -
// all resolved at runtime since this file loads before core.js. smoke "maze.state" depends on this.

// v63 §142 EO — Maze namespace object. Dual-write transition: new code can
// access `maze.state.spots`, `maze.config.PLATE_MM`, `maze.helpers.thicknessAt(p)`,
// but existing top-level globals (mazeSpots, mazeMarkers, MAZE_PLATE_MM, …) stay
// alive so all current callers keep working. Reduces window-namespace footprint
// for new code paths without forcing a single-shot rewrite.
var maze = {
  state:   {},
  config:  {},
  helpers: {}
};
function _defineMazeProxy(target, names){
  names.forEach(function(n){
    Object.defineProperty(target, n, {
      enumerable: true, configurable: true,
      get: function(){ return window[n]; },
      set: function(v){ window[n] = v; }
    });
  });
}
// Wire proxies after all globals exist. Re-runs are harmless (Object.defineProperty
// with configurable=true allows re-definition).
// v64 §160 FG — fixed list of maze.state proxy keys; used by mazeStateKeys()
// and to seal the namespace after binding so accidental `maze.state.newThing = x`
// writes are caught early.
var MAZE_STATE_KEYS = Object.freeze([
  'mazeSpots','mazeMarkers','mazeDifficulty','mazeRevealed','mazeStartTime',
  'mazeScore','mazeTrail','mazeBestScore','mazeProbeType','mazeMultiBounceOn',
  'mazeStrictMode','mazeDualRoofAngle','mazeSpatialGrid'
]);
function mazeStateKeys(){ return MAZE_STATE_KEYS.slice(); }
function _bindMazeNamespace(){
  _defineMazeProxy(maze.state, MAZE_STATE_KEYS);
  _defineMazeProxy(maze.config, [
    'MAZE_PLATE_MM','MAZE_NORMAL_MM','MAZE_THIN_MM','MAZE_DIFFICULTIES',
    'MAZE_TRAIL_MAX','MAZE_GRID_MM','DUAL_VPATH_BIAS','DUAL_ROOF_BIAS'
  ]);
  // helpers are functions — wrap once.
  if (typeof _mazeProbeMm === 'function')         maze.helpers.probeMm        = _mazeProbeMm;
  if (typeof _mazeProbeFootprint === 'function')  maze.helpers.probeFootprint = _mazeProbeFootprint;
  if (typeof _mazeThicknessAt === 'function')     maze.helpers.thicknessAt    = _mazeThicknessAt;
  if (typeof _mazeStrictTol === 'function')       maze.helpers.strictTol      = _mazeStrictTol;
  if (typeof _mazeStrictTolFor === 'function')    maze.helpers.strictTolFor   = _mazeStrictTolFor;
  if (typeof _mazeFootprintMm === 'function')     maze.helpers.footprintMm    = _mazeFootprintMm;
  if (typeof _mazeMultiBounceActive === 'function') maze.helpers.multiBounceActive = _mazeMultiBounceActive;
  if (typeof _dualVpathBias === 'function')       maze.helpers.dualVpathBias  = _dualVpathBias;
  if (typeof _mazeTrailDirection === 'function')  maze.helpers.trailDirection = _mazeTrailDirection;
  // v64 §160 FG — seal maze.state once all proxies are in place. Writes via the
  // registered keys keep working (the property descriptors stay configurable
  // through their setters), but any `maze.state.somethingNew = x` is rejected
  // in strict-mode contexts and logged in sloppy mode for early detection.
  // v65 §178 FY — Object.seal blocks new keys but fails *silently* in sloppy mode
  // (inline <script> default). Wrap maze.state in a Proxy whose set trap rejects
  // unknown keys with a console.warn, so a typo like `maze.state.newThing = x` is
  // caught immediately. try/catch falls back to the plain sealed object where Proxy
  // is unavailable (very old browsers).
  try {
    Object.seal(maze.state);
    if (typeof Proxy === 'function' && typeof Reflect === 'object') {
      maze.state = new Proxy(maze.state, {
        set: function(target, key, value){
          if (typeof key === 'string' && MAZE_STATE_KEYS.indexOf(key) === -1 && !(key in target)) {
            console.warn('[maze.state] reject unknown key:', key);
            return false;
          }
          return Reflect.set(target, key, value);
        }
      });
    }
  } catch(e){}
}
function _mazeMultiBounceActive(){
  if (mazeMultiBounceOn === true)  return true;
  if (mazeMultiBounceOn === false) return false;
  // null = follow ADVANCED/BASIC mode (advancedMode global).
  return (typeof advancedMode !== 'undefined') ? !!advancedMode : true;
}
// v63 §140 EM — strict TOL becomes proportional to spot Φ
// (ASNT Level 2: min(5 mm, 0.3·Φ) ⇒ Easy 7.5 mm cap → still capped at 5 mm,
// Hard 4 mm spot ⇒ 2.4 mm). Easy/Med/Hard see distinct thresholds.
// v64 §158 FE — non-strict path also caps at r * 2.5 (explicit) so future Φ<4 mm
// difficulties cannot silently widen the fixed 10 mm window.
function _mazeStrictTolFor(spot){
  var r = spot && typeof spot.r_mm === 'number' ? spot.r_mm : 5;
  if (!mazeStrictMode) return Math.min(10, r * 2.5);
  return Math.max(3, Math.min(5, r * 0.6));
}
// Back-compat scalar (no spot context — falls back to nominal 5 mm in strict).
function _mazeStrictTol(){ return mazeStrictMode ? 5 : 10; }
// v66 §187 GH — single source for the Strict button label so the inline TOL value
// stays consistent across HTML default, toggle, and EX-entry sync. ≤ values are the
// upper bounds (strict is per-spot ∝Φ; non-strict caps at min(10, Φ×2.5)).
function _strictBtnLabel(){
  return mazeStrictMode ? '🎯 Strict ON · ≤5 mm ∝Φ' : '🎯 Strict OFF · ≤10 mm';
}
function toggleMazeMultiBounce(){
  // Cycle: follow-mode → forced ON → forced OFF → follow-mode.
  if (mazeMultiBounceOn === null) mazeMultiBounceOn = true;
  else if (mazeMultiBounceOn === true) mazeMultiBounceOn = false;
  else mazeMultiBounceOn = null;
  safeLSSet(LS_KEYS.MAZE_MULTIBOUNCE, mazeMultiBounceOn === null ? null : (mazeMultiBounceOn ? 'on' : 'off'));
  _refreshMazeMultiBounceBtn();
  showToast('L2/L3 multi-bounce ' + (_mazeMultiBounceActive() ? 'ON' : 'OFF') + (mazeMultiBounceOn === null ? ' (follow mode)' : ' (manual)') + '.', 1800);
}
// v63 §132 EE — 3-state distinction: follow-mode badge "· auto" (muted),
// manual override badge "· lock" (orange). Lets students see at-a-glance
// whether the toggle is in follow-mode or locked by them.
function _refreshMazeMultiBounceBtn(){
  var btn = document.getElementById('mz-mb-toggle');
  if (!btn) return;
  var active = _mazeMultiBounceActive();
  var isAuto = (mazeMultiBounceOn === null);
  var stateWord = active ? 'ON' : 'OFF';
  var badge = isAuto ? 'auto' : 'lock';
  var badgeColor = isAuto ? 'rgba(180,200,220,0.65)' : 'rgba(255,165,0,0.95)';
  btn.innerHTML = stateWord + ' <span style="font-size:8px;color:' + badgeColor + ';font-weight:500;">· ' + badge + '</span>';
  btn.className = 'mz-diff-btn mz-diff-btn--toggle' + (active ? ' active' : '');
  // v64 §151 EX — title shows the full 3-state cycle order so the next click is predictable.
  var current = isAuto ? 'follow-mode' : (mazeMultiBounceOn ? 'ON · lock' : 'OFF · lock');
  btn.title = 'Click cycle: follow-mode → ON · lock → OFF · lock → follow-mode (current: ' + current + ')';
}
function toggleMazeStrict(){
  // v63 §134 EG / v64 §152 EY — explicit TOL old→new and easy/strict framing in toast.
  var existingMarkers = (typeof mazeMarkers !== 'undefined') ? mazeMarkers.length : 0;
  var oldTOL = mazeStrictMode ? 5 : 10;
  mazeStrictMode = !mazeStrictMode;
  var newTOL = mazeStrictMode ? 5 : 10;
  safeLSSet(LS_KEYS.MAZE_STRICT, mazeStrictMode ? 'on' : 'off');
  var btn = document.getElementById('mz-strict-toggle');
  if (btn) {
    btn.textContent = _strictBtnLabel(); // v66 §187 GH
    btn.className = 'mz-diff-btn mz-diff-btn--toggle' + (mazeStrictMode ? ' active' : '');
  }
  var chip = document.getElementById('mz-strict-stat');
  if (chip) chip.style.display = mazeStrictMode ? 'inline-block' : 'none';
  // v65 §170 FQ — concrete wording instead of abstract "alignment"; "spot centre"
  // tells an untrained student exactly what the tolerance governs. Shorter dwell.
  var direction = mazeStrictMode
    ? '−Strict = markers must sit closer to the spot centre'
    : '+Easy = markers may sit farther from the spot centre';
  var base = 'Strict mode ' + (mazeStrictMode ? 'ON' : 'OFF') + ' — TOL ' + oldTOL + ' mm → ' + newTOL + ' mm (' + direction + ').';
  if (existingMarkers > 0 && !mazeRevealed) {
    base += ' ' + existingMarkers + ' existing marker' + (existingMarkers>1?'s':'') + ' will be re-scored.';
  }
  showToast(base, existingMarkers > 0 ? 2800 : 2400);
}
// v63 §138 EK — Dual roof angle selector (5° / 7° / 10°).
function setMazeDualRoof(angle){
  if (DUAL_ROOF_BIAS[angle] === undefined) return;
  mazeDualRoofAngle = angle;
  safeLSSet(LS_KEYS.MAZE_DUAL_ROOF, String(angle));
  ['5','7','10'].forEach(function(a){
    var el = document.getElementById('mz-roof-'+a);
    // v66 §201 GV — preserve the --roof variant class (was stripped, killing the FM hue + GE icon).
    if (el) el.className = 'mz-diff-btn mz-diff-btn--roof' + (String(angle)===a?' active':'');
  });
  showToast('Dual roof angle ' + angle + '° — bias ' + ((_dualVpathBias()-1)*100).toFixed(1) + '%.', 1800);
}

// v63 §141 EN — Spatial grid hash for fast footprint queries.
// Bucket size 20 mm; each spot is registered in every bucket its (r + max footprint)
// reaches. _mazeProbeFootprint then iterates only 3×3 surrounding buckets instead
// of every spot — ~50× speedup in general-mode reveal sampling.
var MAZE_GRID_MM    = 20;
// v64 §159 FF — initialise to an empty Map up-front so `_mazeProbeFootprint`
// can drop its `if (mazeSpatialGrid)` fallback branch (the grid now always exists).
// v65 §177 FX — INVARIANT: mazeSpatialGrid is ALWAYS a Map (never null/undefined).
// An empty Map ⇒ no spots registered yet. Only _rebuildMazeSpatialGrid() reassigns it.
var mazeSpatialGrid = new Map();
function _gridKey(gx, gy){ return gx + ',' + gy; }
function _rebuildMazeSpatialGrid(){
  mazeSpatialGrid = new Map();
  var pad = _mazeFootprintMm() + 2;  // cover the footprint reach + small margin
  for (var i=0; i<mazeSpots.length; i++) {
    var s = mazeSpots[i];
    var reach = s.r_mm + pad;
    var gxMin = Math.floor((s.x_mm - reach) / MAZE_GRID_MM);
    var gxMax = Math.floor((s.x_mm + reach) / MAZE_GRID_MM);
    var gyMin = Math.floor((s.y_mm - reach) / MAZE_GRID_MM);
    var gyMax = Math.floor((s.y_mm + reach) / MAZE_GRID_MM);
    for (var gx=gxMin; gx<=gxMax; gx++) {
      for (var gy=gyMin; gy<=gyMax; gy++) {
        var k = _gridKey(gx, gy);
        var bucket = mazeSpatialGrid.get(k);
        if (!bucket) { bucket = []; mazeSpatialGrid.set(k, bucket); }
        bucket.push(i);
      }
    }
  }
}
function generateMaze() {
  var cfg = MAZE_DIFFICULTIES[mazeDifficulty];
  mazeSpots = [];
  // v60 §110 DI — General mode uses a wider margin band so the overlap field
  // covers most of the plate. Other difficulties keep the 20 mm edge buffer.
  var margin = (mazeDifficulty === 'general') ? 8 : 20;
  for (var i=0; i<cfg.count; i++) {
    mazeSpots.push({
      x_mm: margin + Math.random() * (MAZE_PLATE_MM - 2*margin),
      y_mm: margin + Math.random() * (MAZE_PLATE_MM - 2*margin),
      r_mm: cfg.radiusMm,
      // v61 §121 DT — per-spot roughness (0.3..1.2). Different spots feel
      // different on the A-scan instead of all being uniformly noisy.
      roughnessFactor: 0.3 + Math.random() * 0.9
    });
  }
  mazeMarkers   = [];
  mazeRevealed  = false;
  mazeStartTime = null;
  mazeScore     = null;
  mazeTrail     = [];          // v60 §104 DC
  _mazeTrailCounter = 0;
  _rebuildMazeSpatialGrid();    // v63 §141 EN
}
function setMazeDifficulty(level){
  if (!MAZE_DIFFICULTIES[level]) return;
  mazeDifficulty = level;
  // v60 §110 DI — include 'general' in active-class toggle.
  ['easy','medium','hard','general'].forEach(function(d){
    var el = document.getElementById('mz-diff-'+d);
    // v66 §201 GV — preserve the --diff variant class (was stripped, killing the FM hue +
    // the GE active ◆ icon after the first click).
    if (el) el.className = 'mz-diff-btn mz-diff-btn--diff' + (d===level?' active':'');
  });
  generateMaze();
  var ss = document.getElementById('mz-score-stat'); if (ss) ss.style.display = 'none';
  // v60 §108 DG — refresh best-score chip when switching difficulty.
  _refreshMazeBestChip();
}
// v60 §108 DG / v61 §119 DR — best + avg chip helper.
function _refreshMazeBestChip(){
  var chip = document.getElementById('mz-best-stat');
  var val  = document.getElementById('mz-best');
  var avgChip = document.getElementById('mz-avg-stat');
  var avgVal  = document.getElementById('mz-avg');
  var best = mazeBestScore[mazeDifficulty];
  if (chip && val) {
    if (best) {
      chip.style.display = 'inline';
      var pct = (best.hitRate*100).toFixed(0);
      var minStr = Math.floor(best.elapsed/60)+':'+String(best.elapsed%60).padStart(2,'0');
      val.textContent = pct+'% in '+minStr;
    } else {
      chip.style.display = 'none';
    }
  }
  if (avgChip && avgVal) {
    // v66 §191 GL — persistent attempts/avg chip from the first recorded round (was n ≥ 2).
    if (best && best.rounds && best.rounds >= 1) {
      avgChip.style.display = 'inline';
      avgVal.textContent = 'attempts: '+best.rounds+' · avg '+(best.avgHitRate*100).toFixed(0)+'%';
    } else {
      avgChip.style.display = 'none';
    }
  }
}
// v60 §112 DK — probe type toggle.
function setMazeProbeType(t){
  if (t !== 'single' && t !== 'dual') return;
  mazeProbeType = t;
  ['single','dual'].forEach(function(k){
    var el = document.getElementById('mz-probe-'+k);
    // v66 §201 GV — preserve the --probe variant class (was stripped, killing the FM purple hue + GE icon).
    if (el) el.className = 'mz-diff-btn mz-diff-btn--probe' + (k===t?' active':'');
  });
  // v63 §141 EN — footprint changes ⇒ spatial-grid pad changes, so rebuild.
  if (mazeSpots && mazeSpots.length) _rebuildMazeSpatialGrid();
  // v63 §138 EK — toggle the Dual roof-angle sub-row visibility.
  var roofRow = document.getElementById('mz-roof-group');
  if (roofRow) roofRow.style.display = (t === 'dual') ? 'flex' : 'none';
}
// v59 §101 CZ — Probe footprint radius. Real UT probes contact a finite area;
// the readout reflects the THINNEST point within this circular footprint.
// v60 §112 DK — dual-element probe has a slightly larger contact footprint.
function _mazeFootprintMm(){ return mazeProbeType === 'dual' ? 7.5 : 6; }

// Probe → (x_mm, y_mm) in maze coordinate space.
// v59 §95 CT — clamp output to [0, MAZE_PLATE_MM] in mm space so the readout
// can never display an off-plate position (previously canvas-px clamp could
// leak slightly outside on certain resize ratios).
function _mazeProbeMm(){
  var fx = (txX - MAT_X) / MAT_W;
  var fy = (txY - MAT_Y) / MAT_H;
  var x_mm = Math.max(0, Math.min(MAZE_PLATE_MM, fx * MAZE_PLATE_MM));
  var y_mm = Math.max(0, Math.min(MAZE_PLATE_MM, fy * MAZE_PLATE_MM));
  return { x_mm: x_mm, y_mm: y_mm };
}
// v59 §101 CZ + §102 DA — thickness at probe footprint.
// CZ: distance to spot edge is shrunk by footprint radius (probe covers area).
// DA: Gaussian falloff so spot edges blend smoothly NORMAL → THIN instead of binary.
//     thinness factor f(d) = exp(-1.5 · (max(0, d − footprint) / r)²)
//     d=0 → f≈1 (full thin); d=r → f≈0.22; d=2r → near 0.
// Picks the largest f (= worst-case thinning) across all spots — equivalent to
// "thinnest point inside the footprint".
// v60 §111 DJ / §113 DL — now returns rich data:
//   thickness ∈ [THIN, NORMAL]   — interpolated mean (for THICKNESS readout)
//   thinAmount ∈ [0, 1]          — fraction of footprint over a thin region; drives
//                                   DL dual-peak crossfade (1 − tA on normal BW,
//                                   tA on thin BW)
//   roughness  ∈ [0, 1]          — surface texture proxy for §111 DJ noise/widen
function _mazeProbeFootprint(p) {
  var maxThin = 0;
  var dominantRough = 1.0; // roughness factor of the spot that dominates
  var footprint = _mazeFootprintMm();
  // v63 §141 EN — iterate spatial-grid neighbourhood instead of every spot.
  // v64 §159 FF — mazeSpatialGrid is now pre-initialised to an empty Map (see
  // declaration above), so the legacy `if (mazeSpatialGrid)` fallback branch is
  // gone. An empty grid still gives an empty `candidates` list ⇒ the loop below
  // is a no-op and the function returns NORMAL thickness, same as before.
  var gx = Math.floor(p.x_mm / MAZE_GRID_MM);
  var gy = Math.floor(p.y_mm / MAZE_GRID_MM);
  var seen = null; // dedupe (Set) only allocated if we touch 2+ buckets
  var candidates = [];
  for (var dgx=-1; dgx<=1; dgx++) {
    for (var dgy=-1; dgy<=1; dgy++) {
      var bucket = mazeSpatialGrid.get(_gridKey(gx+dgx, gy+dgy));
      if (!bucket) continue;
      if (candidates.length === 0) { candidates = bucket.slice(); }
      else {
        if (!seen) { seen = new Set(candidates); }
        for (var bi=0; bi<bucket.length; bi++) {
          if (!seen.has(bucket[bi])) { seen.add(bucket[bi]); candidates.push(bucket[bi]); }
        }
      }
    }
  }
  for (var ci=0; ci<candidates.length; ci++) {
    var s = mazeSpots[candidates[ci]];
    var dx = p.x_mm - s.x_mm, dy = p.y_mm - s.y_mm;
    var d = Math.sqrt(dx*dx + dy*dy);
    var dEff = Math.max(0, d - footprint);
    var u = dEff / s.r_mm;
    var f = Math.exp(-1.5 * u * u);
    if (f > maxThin) {
      maxThin = f;
      // v61 §121 DT — capture the dominant spot's roughness factor so identical
      // thinAmount can feel different from spot to spot.
      dominantRough = (typeof s.roughnessFactor === 'number') ? s.roughnessFactor : 1.0;
    }
  }
  var thinAmount = Math.max(0, Math.min(1, maxThin));
  return {
    thickness:  MAZE_NORMAL_MM - (MAZE_NORMAL_MM - MAZE_THIN_MM) * thinAmount,
    thinAmount: thinAmount,
    // v61 §121 DT — contribution-weighted roughness (clamped to [0, 1.2]).
    roughness:  Math.min(1.2, thinAmount * dominantRough)
  };
}
// v63 §139 EL — Direction-aware footprint shift for L2/L3 sampling.
// v64 §157 FD — persistent fallback: when probe is slow (<0.5 mm/frame) keep using
// the LAST real direction instead of snapping to +X. Only the first-ever still
// frame uses +X. This stops L2/L3 peaks from sliding to identical positions
// during slow drags, which used to flatten the V-path bias signal.
// v65 §175 FD/FV — start null (not a dummy +X). Slow/insufficient frames fall back to
// +X only until a real direction is measured, then persist the last good direction
// instead of re-seeding +X every slow frame (which used to flatten the L2/L3 bias).
var _mazeLastDir = null;
function _mazeTrailDirection(){
  var fallback = _mazeLastDir || { dx: 1, dy: 0 };
  if (!mazeTrail || mazeTrail.length < 2) return fallback;
  var a = mazeTrail[mazeTrail.length - 2];
  var b = mazeTrail[mazeTrail.length - 1];
  var dx = b.x_mm - a.x_mm, dy = b.y_mm - a.y_mm;
  var len = Math.sqrt(dx*dx + dy*dy);
  if (len < 0.5) return fallback;
  _mazeLastDir = { dx: dx / len, dy: dy / len };
  return _mazeLastDir;
}
// v66 §192 GM — is the probe actually moving this frame? When it sits still on a spot,
// real multi-bounce echoes travel straight down the plate thickness (V-path stays under
// the probe), not laterally along the last drag direction. So L2/L3 should sample the same
// (x,y) with zero shift when stationary, and only wander along the trail while moving.
function _mazeProbeMoving(){
  if (!mazeTrail || mazeTrail.length < 2) return false;
  var a = mazeTrail[mazeTrail.length - 2];
  var b = mazeTrail[mazeTrail.length - 1];
  var dx = b.x_mm - a.x_mm, dy = b.y_mm - a.y_mm;
  return Math.sqrt(dx*dx + dy*dy) >= 0.5;
}
// Back-compat helper for callers that only want the scalar thickness.
function _mazeThicknessAt(p) { return _mazeProbeFootprint(p).thickness; }
// THIN-SPOT label trigger: thickness sub-midpoint between NORMAL and THIN.
function _mazeIsThin(thicknessMm){
  return thicknessMm < (MAZE_NORMAL_MM + MAZE_THIN_MM) * 0.5;
}
function dropMazeMarker(){
  if (mazeRevealed) { showToast('Maze already revealed — click 🔄 New maze or pick a different difficulty.', 2400); return; }
  if (!mazeStartTime) mazeStartTime = Date.now();
  var p = _mazeProbeMm();
  mazeMarkers.push({ x_mm: p.x_mm, y_mm: p.y_mm });
  document.getElementById('mz-marker-count').textContent = mazeMarkers.length;
  // v59 §96 CU — visible confirmation (was: silent + count tick only).
  showToast('📍 Marker #'+mazeMarkers.length+' dropped at ('+p.x_mm.toFixed(0)+', '+p.y_mm.toFixed(0)+') mm', 1600);
}
function undoMazeMarker(){
  if (mazeRevealed) return;
  mazeMarkers.pop();
  document.getElementById('mz-marker-count').textContent = mazeMarkers.length;
}
// v59 §97 CV — regenerate a fresh maze at the current difficulty without
// having to flip difficulty and lose your place. Quick "next round" button.
function newMaze(){
  generateMaze();
  var ss = document.getElementById('mz-score-stat'); if (ss) ss.style.display = 'none';
  document.getElementById('mz-marker-count').textContent = 0;
  var tm = document.getElementById('mz-timer'); if (tm) tm.textContent = '0:00';
  showToast('🔄 New '+mazeDifficulty+' maze generated — '+mazeSpots.length+' hidden thin spots.', 2200);
}
// v63 §143 EP — revealMaze() split into focused helpers (≤ 30 lines each).
// Each helper has one job, so future audits can change scoring / persistence
// / toasts independently without re-reading 100+ lines of mixed code.
function _computeMazeScore(markers, spots){
  // v63 §140 EM — per-spot proportional TOL when strict; legacy 10 mm otherwise.
  var hits = 0;
  for (var mi=0; mi<markers.length; mi++) {
    var m = markers[mi];
    for (var i=0; i<spots.length; i++) {
      var s = spots[i];
      var dx = m.x_mm - s.x_mm, dy = m.y_mm - s.y_mm;
      if (Math.sqrt(dx*dx + dy*dy) <= _mazeStrictTolFor(s) + s.r_mm) { hits++; break; }
    }
  }
  var total = spots.length;
  var elapsed = mazeStartTime ? Math.round((Date.now() - mazeStartTime)/1000) : 0;
  return {
    hits: hits, total: total, markers: markers.length,
    elapsed: elapsed,
    difficulty: mazeDifficulty,
    hitRate: total > 0 ? hits / total : 0
  };
}
function _recordMazeRound(score){
  try {
    findingsHistory.push({
      kind: 'maze',
      ts: new Date().toISOString().replace('T',' ').slice(0,19),
      exercise: 'EX05 Maze',
      difficulty: score.difficulty,
      hits: score.hits, total: score.total,
      markers: score.markers, elapsed: score.elapsed,
      hitRate: score.hitRate
    });
    var hc = document.getElementById('fs-history-count');
    if (hc) hc.textContent = findingsHistory.length;
  } catch(e) {}
}
function _updateBestScore(score){
  var prev = mazeBestScore[score.difficulty];
  // Migrate v60 single-best entries to v61 extended schema.
  if (prev && typeof prev.rounds !== 'number') {
    prev.rounds = 1;
    prev.totalHits = prev.hits; prev.totalTotal = prev.total;
    prev.totalElapsed = prev.elapsed;
    prev.avgHitRate = prev.hitRate; prev.avgElapsed = prev.elapsed;
  }
  var isNewBest = !prev
    || score.hitRate > prev.hitRate + 1e-9
    || (Math.abs(score.hitRate - prev.hitRate) < 1e-9 && score.elapsed < prev.elapsed);
  if (score.total <= 0) return { isNewBest:false, prev:prev };
  var entry = prev || { hitRate:0, elapsed:0, hits:0, total:0, when:0,
                        rounds:0, totalHits:0, totalTotal:0, totalElapsed:0,
                        avgHitRate:0, avgElapsed:0 };
  entry.rounds = (entry.rounds || 0) + 1;
  entry.totalHits = (entry.totalHits || 0) + score.hits;
  entry.totalTotal = (entry.totalTotal || 0) + score.total;
  entry.totalElapsed = (entry.totalElapsed || 0) + score.elapsed;
  entry.avgHitRate = entry.totalHits / Math.max(1, entry.totalTotal);
  entry.avgElapsed = entry.totalElapsed / entry.rounds;
  if (isNewBest) {
    entry.hitRate = score.hitRate; entry.elapsed = score.elapsed;
    entry.hits = score.hits; entry.total = score.total;
    entry.when = Date.now();
  }
  mazeBestScore[score.difficulty] = entry;
  safeLSSet(LS_KEYS.MAZE_BEST, mazeBestScore);
  return { isNewBest: isNewBest, prev: prev };
}
function _announceBestIfBeat(score, isNewBest){
  if (!isNewBest || score.total <= 0) return;
  var minStr = Math.floor(score.elapsed/60)+':'+String(score.elapsed%60).padStart(2,'0');
  setTimeout(function(){
    showToast('🏆 New best for '+MAZE_DIFFICULTIES[score.difficulty].label+' — '+(score.hitRate*100).toFixed(0)+'% in '+minStr+'!', 4200);
  }, 700);
}
function _announceEasyPassIfEligible(score){
  if (score.difficulty !== 'easy' || score.hitRate < 0.8) return;
  setTimeout(function(){
    showToast('✓ Easy passed ('+(score.hitRate*100).toFixed(0)+'%) — click Medium ▶ auto-regen at harder size · or 🔄 New maze for another Easy round.', 5400);
    var medBtn = document.getElementById('mz-diff-medium');
    if (medBtn) {
      medBtn.style.boxShadow = '0 0 10px rgba(0,229,255,0.7)';
      medBtn.style.animation = 'pulse-glow 1.4s ease-in-out 3';
      setTimeout(function(){ medBtn.style.boxShadow=''; medBtn.style.animation=''; }, 5000);
    }
  }, 1200);
}
// v64 §161 FH — Pure helpers extracted from _renderRevealedScore so the format
// logic is independently testable (called from smoke tests too).
function _formatHitRateDelta(score, prev){
  if (!prev || prev.hitRate === undefined) return '';
  var prevPct = prev.hitRate * 100;
  var nowPct  = score.hitRate * 100;
  var dHit = nowPct - prevPct;
  return (dHit >= 0 ? '+' : '') + dHit.toFixed(0) + '%pts ('
    + prevPct.toFixed(0) + '% → ' + nowPct.toFixed(0) + '%)';
}
function _formatElapsedDelta(score, prev){
  if (!prev || prev.elapsed === undefined) return '';
  var dEl   = score.elapsed - prev.elapsed;
  var dElPct = prev.elapsed > 0 ? (dEl / prev.elapsed * 100) : 0;
  var dElPctStr = (dElPct > 0 ? '+' : (dElPct < 0 ? '−' : '±')) + Math.abs(dElPct).toFixed(0) + '%';
  // v66 §190 GK — explicit slower/faster word. For elapsed time, "+" means worse (slower),
  // opposite to hit-rate where "+" is better — so the sign alone confuses students.
  var dir = dEl > 0 ? ', slower' : (dEl < 0 ? ', faster' : '');
  return (dEl > 0 ? '+' : (dEl < 0 ? '−' : '±')) + Math.abs(dEl) + 's (' + dElPctStr + dir + ')';
}
function _renderRevealedScore(score, prevForDelta){
  var minStr = Math.floor(score.elapsed/60)+':'+String(score.elapsed%60).padStart(2,'0');
  var ss = document.getElementById('mz-score-stat');
  var sv = document.getElementById('mz-score');
  if (ss) ss.style.display = 'inline';
  // v64 §154 FA — render score chip as flex-wrap container with independent
  // hit-rate / elapsed sub-chips so narrow screens wrap cleanly and the two
  // axes are colour-distinguished (hit=green/red, elapsed=yellow/grey).
  var baseHtml = '<span class="mz-score-chip">'
    + score.hits+'/'+score.total+' hits · '+score.markers+' markers · '+minStr;
  if (prevForDelta && prevForDelta.hitRate !== undefined) {
    var dHitStr = _formatHitRateDelta(score, prevForDelta);
    var dHitCls = (score.hitRate >= prevForDelta.hitRate) ? 'mz-delta-chip--hit-pos' : 'mz-delta-chip--hit-neg';
    var dElStr  = _formatElapsedDelta(score, prevForDelta);
    var dEl = score.elapsed - prevForDelta.elapsed;
    var dElCls = (dEl <= 0) ? 'mz-delta-chip--elapsed-neg' : 'mz-delta-chip--elapsed-pos';
    // v65 §172 FS — axis title + emoji prefix so students can tell the hit-rate
    // delta chip (🎯) from the elapsed delta chip (⏱) without guessing.
    baseHtml += ' · vs best'
      + ' <span class="mz-delta-chip ' + dHitCls + '" title="hit-rate Δ vs your best round at this difficulty">🎯 ' + dHitStr + '</span>'
      + ' <span class="mz-delta-chip ' + dElCls  + '" title="elapsed Δ vs your best round">⏱ ' + dElStr  + '</span>';
  }
  baseHtml += '</span>';
  if (sv) sv.innerHTML = baseHtml;
}
function revealMaze(){
  if (mazeRevealed) { showToast('Already revealed. Click 🔄 New maze for a fresh round.', 2400); return; }
  mazeRevealed = true;
  var score = _computeMazeScore(mazeMarkers, mazeSpots);
  mazeScore = score;
  var prevForDelta = mazeBestScore[score.difficulty];
  _renderRevealedScore(score, prevForDelta);
  // v63 §134 EG — explicitly tell the student the TOL used in scoring.
  var tolStr;
  if (mazeStrictMode) {
    var tols = mazeSpots.map(function(s){ return _mazeStrictTolFor(s); });
    var tmin = Math.min.apply(null, tols), tmax = Math.max.apply(null, tols);
    tolStr = (Math.abs(tmin-tmax)<0.05)
      ? tmin.toFixed(1)+' mm'
      : tmin.toFixed(1)+'–'+tmax.toFixed(1)+' mm (∝Φ)';
  } else {
    // v65 §176 FW — surface the r·2.5 cap when it actually bites (spots with Φ < 8 mm
    // get TOL < 10 mm) so the cap is observable instead of a flat "10 mm".
    var nsTols = mazeSpots.map(function(s){ return _mazeStrictTolFor(s); });
    var nsMin = nsTols.length ? Math.min.apply(null, nsTols) : 10;
    var nsMax = nsTols.length ? Math.max.apply(null, nsTols) : 10;
    tolStr = (nsMin < 9.95)
      ? (Math.abs(nsMin-nsMax)<0.05 ? nsMin.toFixed(1) : nsMin.toFixed(1)+'–'+nsMax.toFixed(1)) + ' mm (cap = spot Φ × 2.5)'
      : '10 mm';
  }
  var minStr = Math.floor(score.elapsed/60)+':'+String(score.elapsed%60).padStart(2,'0');
  showToast('Reveal: '+score.hits+' of '+score.total+' thin spots found in '+minStr+
    ' · scored with TOL '+tolStr+'. Light-blue circles = real maze; orange = your markers.', 5400);
  _recordMazeRound(score);
  var bestResult = _updateBestScore(score);
  _announceBestIfBeat(score, bestResult.isNewBest);
  _refreshMazeBestChip();
  _announceEasyPassIfEligible(score);
}
function _maybeUpdateMazeTimer(){
  if (exercise !== 'maze' || !mazeStartTime || mazeRevealed) return;
  var el = document.getElementById('mz-timer'); if (!el) return;
  var elapsed = Math.round((Date.now() - mazeStartTime)/1000);
  el.textContent = Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
  // v61 §115 DN + v62 §125 DX — delta vs best in both absolute s and percentage.
  var deltaEl = document.getElementById('mz-timer-delta');
  if (deltaEl) {
    var best = mazeBestScore[mazeDifficulty];
    if (best && best.elapsed) {
      var d = elapsed - best.elapsed;
      var sign = d > 0 ? '+' : (d < 0 ? '−' : '±');
      var pct = (d / best.elapsed * 100);
      var pctStr = (d > 0 ? '+' : (d < 0 ? '−' : '±')) + Math.abs(pct).toFixed(0) + '%';
      // v66 §190 GK — slower/faster word so the running timer delta isn't ambiguous either.
      var dir = d > 0 ? ' slower' : (d < 0 ? ' faster' : '');
      deltaEl.textContent = '('+sign+Math.abs(d)+'s '+pctStr+' vs best'+dir+')';
      deltaEl.className = 'mz-stat-delta ' + (d <= 0 ? 'mz-stat--delta-neg' : 'mz-stat--delta-pos');
    } else {
      deltaEl.textContent = '';
      deltaEl.className = 'mz-stat-delta';
    }
  }
}
// Maze plate rendering: top-down view of 250×250 mm steel sheet
// v66 §195 GP — PERF: this 60 fps hot path (and drawMazeAscan) reads the BARE globals
// (mazeSpots, mazeRevealed, …) directly — NOT maze.state.mazeSpots. The maze.state Proxy
// (§178 FY) forwards through an accessor to the same globals, so going via maze.state would
// add two indirections per access inside the draw loop. Keep hot-path reads on the bare
// globals; use maze.state only for namespaced/external access. (Write-passthrough is
// smoke-asserted in runSmokeTests.)
function drawMazeScan(ctx) {
  // Grid background
  ctx.fillStyle = '#1a2230';
  ctx.fillRect(MAT_X, MAT_Y, MAT_W, MAT_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  ctx.strokeRect(MAT_X, MAT_Y, MAT_W, MAT_H);
  // Tick marks every 50 mm
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.font = '9px JetBrains Mono,monospace';
  for (var mm=0; mm<=MAZE_PLATE_MM; mm+=50) {
    var fx = mm / MAZE_PLATE_MM;
    var x = MAT_X + fx * MAT_W;
    var y = MAT_Y + fx * MAT_H;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x, MAT_Y); ctx.lineTo(x, MAT_Y+MAT_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MAT_X, y); ctx.lineTo(MAT_X+MAT_W, y); ctx.stroke();
    if (mm > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.textAlign = 'center'; ctx.fillText(mm+'mm', x, MAT_Y - 3);
      ctx.textAlign = 'left';   ctx.fillText(mm+'', MAT_X - 28, y + 3);
    }
  }
  // Plate label
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Steel plate — top view 250 × 250 mm (nominal '+MAZE_NORMAL_MM+' mm thick, thin spots '+MAZE_THIN_MM+' mm)', MAT_X + 4, MAT_Y + MAT_H + 14);
  // If revealed, draw the actual thin-spot maze.
  // v59 §102 DA — Gaussian falloff (gradient + dashed nominal-r outline).
  // v60 §110 DI — General mode renders as a single heatmap rather than discrete
  // circles (60 overlapping soft spots → blends into continuous wall-loss).
  if (mazeRevealed) {
    if (mazeDifficulty === 'general') {
      // Heat-map: alpha map painted at lower res then blown up. Cheap and reads
      // as a continuous corrosion field rather than 60 separate discs.
      var STEP = Math.max(2, Math.floor(MAT_W / 80));
      for (var hx=MAT_X; hx<MAT_X+MAT_W; hx+=STEP) {
        for (var hy=MAT_Y; hy<MAT_Y+MAT_H; hy+=STEP) {
          var pp = { x_mm: ((hx - MAT_X) / MAT_W) * MAZE_PLATE_MM,
                     y_mm: ((hy - MAT_Y) / MAT_H) * MAZE_PLATE_MM };
          var f = _mazeProbeFootprint(pp).thinAmount;
          if (f > 0.05) {
            ctx.fillStyle = 'rgba(100,200,255,' + (0.10 + 0.40*f).toFixed(3) + ')';
            ctx.fillRect(hx, hy, STEP, STEP);
          }
        }
      }
    } else {
      mazeSpots.forEach(function(s){
        var sx = MAT_X + (s.x_mm / MAZE_PLATE_MM) * MAT_W;
        var sy = MAT_Y + (s.y_mm / MAZE_PLATE_MM) * MAT_H;
        var sr = (s.r_mm / MAZE_PLATE_MM) * MAT_W;
        var grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 1.6);
        grad.addColorStop(0,    'rgba(100,200,255,0.55)');
        grad.addColorStop(0.55, 'rgba(100,200,255,0.20)');
        grad.addColorStop(1,    'rgba(100,200,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sx, sy, sr * 1.6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(100,200,255,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }
  // v60 §104 DC + v61 §117 DP — scan trail rendered as dot cloud rather than a
  // polyline. Polylines connect sampled points with straight lines, which can
  // imply "I covered this area" even when the probe jumped past it. Dots show
  // only what was actually sampled.
  if (mazeRevealed && mazeTrail.length > 0) {
    ctx.fillStyle = 'rgba(0,229,255,0.40)';
    for (var ti=0; ti<mazeTrail.length; ti++) {
      var t = mazeTrail[ti];
      var dx = MAT_X + (t.x_mm/MAZE_PLATE_MM)*MAT_W;
      var dy = MAT_Y + (t.y_mm/MAZE_PLATE_MM)*MAT_H;
      ctx.fillRect(dx-1, dy-1, 2, 2);
    }
  }
  // v61 §116 DO + v62 §124 DW — Critical-patch markers on reveal, applied to
  // every difficulty. In General mode we sample the whole plate (no discrete
  // spots). In Easy/Medium/Hard we draw a red dashed core circle at every
  // spot to teach "marker quadrant accuracy ≠ spot coverage."
  // v63 §133 EF — critical core circles use ORANGE dashed instead of red, so they
  // are distinguishable from the red "✗ missed" labels (which stay rgba(255,90,90)).
  // Orange = "high-risk thinnest area", red = "missed detection" — distinct semantics.
  if (mazeRevealed && mazeDifficulty === 'general') {
    var SAMPLE_STEP = 12;
    ctx.strokeStyle = 'rgba(255,165,0,0.85)';
    ctx.lineWidth = 1.2; ctx.setLineDash([3,3]);
    for (var cx=10; cx<MAZE_PLATE_MM; cx+=SAMPLE_STEP) {
      for (var cy=10; cy<MAZE_PLATE_MM; cy+=SAMPLE_STEP) {
        var th = _mazeProbeFootprint({ x_mm:cx, y_mm:cy }).thickness;
        if (th < 8) {
          var sx = MAT_X + (cx/MAZE_PLATE_MM)*MAT_W;
          var sy = MAT_Y + (cy/MAZE_PLATE_MM)*MAT_H;
          ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2); ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
  } else if (mazeRevealed) {
    // v62 §124 DW — discrete-spot core (thinnest 50 % radius) drawn dashed
    // so students can see which quadrant of the spot their marker landed in.
    // v63 §133 EF — orange (not red) so it doesn't clash with "✗ missed" labels.
    ctx.strokeStyle = 'rgba(255,165,0,0.80)';
    ctx.lineWidth = 1; ctx.setLineDash([2,3]);
    mazeSpots.forEach(function(s){
      var sx = MAT_X + (s.x_mm / MAZE_PLATE_MM) * MAT_W;
      var sy = MAT_Y + (s.y_mm / MAZE_PLATE_MM) * MAT_H;
      var coreR = (s.r_mm * 0.5 / MAZE_PLATE_MM) * MAT_W;
      ctx.beginPath(); ctx.arc(sx, sy, coreR, 0, Math.PI*2); ctx.stroke();
    });
    ctx.setLineDash([]);
  }
  // v59 §101 CZ — draw the probe footprint so the student sees the sampling
  // area. v60 §104 DC — keep it visible after reveal too (dimmer alpha).
  if (txY !== 0) {
    var footRpx = (_mazeFootprintMm() / MAZE_PLATE_MM) * MAT_W;
    ctx.strokeStyle = mazeRevealed ? 'rgba(0,229,255,0.18)' : 'rgba(0,229,255,0.30)';
    ctx.lineWidth = 1; ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.arc(txX, txY, footRpx, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Draw student markers (orange dots).
  // v60 §107 DF — after reveal, each marker is labelled with distance to nearest
  // spot edge (✓ = hit, ✗ = miss). Spots that nobody marked are labelled "missed".
  mazeMarkers.forEach(function(m, idx){
    var mx = MAT_X + (m.x_mm / MAZE_PLATE_MM) * MAT_W;
    var my = MAT_Y + (m.y_mm / MAZE_PLATE_MM) * MAT_H;
    ctx.fillStyle = 'rgba(255,165,0,0.85)';
    ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.stroke();
    if (mazeRevealed && mazeSpots.length > 0) {
      var bestEdge = Infinity, bestS = null;
      for (var si=0; si<mazeSpots.length; si++) {
        var s = mazeSpots[si];
        var dd = Math.sqrt((m.x_mm-s.x_mm)*(m.x_mm-s.x_mm) + (m.y_mm-s.y_mm)*(m.y_mm-s.y_mm)) - s.r_mm;
        if (dd < bestEdge) { bestEdge = dd; bestS = s; }
      }
      // v62 §129 EB — strict mode tightens TOL.
      // v63 §140 EM — TOL is now proportional to the nearest spot's Φ when strict.
      var TOL = _mazeStrictTolFor(bestS);
      var hit = bestEdge <= TOL;
      ctx.fillStyle = hit ? 'rgba(63,225,120,0.95)' : 'rgba(255,90,90,0.95)';
      ctx.font = 'bold 9px JetBrains Mono,monospace'; ctx.textAlign = 'left';
      var label = hit
        ? '✓ '+Math.max(0,bestEdge).toFixed(0)+' mm'
        : '✗ '+bestEdge.toFixed(0)+' mm';
      ctx.fillText(label, mx + 7, my + 3);
    }
  });
  // v60 §107 DF — flag spots no marker landed on (missed detections).
  // v63 §140 EM — per-spot TOL (proportional to Φ when strict).
  if (mazeRevealed && mazeDifficulty !== 'general') {
    mazeSpots.forEach(function(s){
      var MISS_TOL = _mazeStrictTolFor(s);
      var hit = false;
      for (var mi=0; mi<mazeMarkers.length; mi++) {
        var mm0 = mazeMarkers[mi];
        var ddm = Math.sqrt((mm0.x_mm-s.x_mm)*(mm0.x_mm-s.x_mm) + (mm0.y_mm-s.y_mm)*(mm0.y_mm-s.y_mm));
        if (ddm <= s.r_mm + MISS_TOL) { hit = true; break; }
      }
      if (!hit) {
        var sx = MAT_X + (s.x_mm / MAZE_PLATE_MM) * MAT_W;
        var sy = MAT_Y + (s.y_mm / MAZE_PLATE_MM) * MAT_H;
        ctx.fillStyle = 'rgba(255,90,90,0.9)';
        ctx.font = 'bold 9px JetBrains Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillText('✗ missed', sx, sy - (s.r_mm/MAZE_PLATE_MM)*MAT_W - 6);
      }
    });
  }
  // Draw transducer (cyan circle) at current 2D probe position
  if (txY === 0) txY = MAT_Y + MAT_H * 0.5; // initial centre Y
  var probeRadius = Math.max(6, MAT_W * 0.012);
  ctx.shadowColor = 'rgba(0,229,255,0.9)'; ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(0,229,255,0.85)';
  ctx.beginPath(); ctx.arc(txX, txY, probeRadius, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(txX, txY, probeRadius, 0, Math.PI*2); ctx.stroke();
  // v60 §104 DC — sample probe pos into mazeTrail (every 6th frame to avoid
  // bloating the buffer while still capturing motion).
  if (!mazeRevealed) {
    _mazeTrailCounter = (_mazeTrailCounter + 1) % 6;
    if (_mazeTrailCounter === 0) {
      var pSample = _mazeProbeMm();
      mazeTrail.push(pSample);
      if (mazeTrail.length > MAZE_TRAIL_MAX) mazeTrail.shift();
    }
  }
  // POSITION + THICKNESS readout (top-left).
  // v60 §106 DE — append "↔ BW peak @ X.X mm" so the student can link the
  // THICKNESS readout to the BW peak X they see on the A-scan canvas.
  var p = _mazeProbeMm();
  var thicknessMm = _mazeThicknessAt(p);
  var isThin = _mazeIsThin(thicknessMm);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 10px JetBrains Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText('POSITION  '+p.x_mm.toFixed(1)+' mm,  '+p.y_mm.toFixed(1)+' mm', MAT_X + 4, MAT_Y + 12);
  ctx.fillStyle = isThin ? 'rgba(100,200,255,0.95)' : 'rgba(255,200,80,0.95)';
  ctx.fillText('THICKNESS  '+thicknessMm.toFixed(2)+' mm'+(isThin?'  [THIN SPOT]':''), MAT_X + 4, MAT_Y + 26);
  ctx.fillStyle = 'rgba(0,229,255,0.75)';
  ctx.font = '9px JetBrains Mono,monospace';
  ctx.fillText('↔ BW peak @ '+thicknessMm.toFixed(2)+' mm on A-scan', MAT_X + 4, MAT_Y + 40);
}
// Maze A-scan: only T peak + back-wall peak (position varies by thickness)
function drawMazeAscan(ctx, W, H) {
  ctx.fillStyle = '#080c12'; ctx.fillRect(0, 0, W, H);
  // grid
  ctx.strokeStyle = 'rgba(0,229,255,0.06)'; ctx.lineWidth = 0.5;
  for (var c=0; c<=10; c++) { var gx=c/10*W; ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (var r=0; r<=4; r++)  { var gy=r/4*H;  ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }
  // x-axis labels — show 0..25 mm range (zoomed in for thin plate)
  var AXIS_MAX_MM = 25;
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.font = '8px JetBrains Mono,monospace'; ctx.textAlign = 'center';
  for (var ml=0; ml<=AXIS_MAX_MM; ml+=5) {
    var lx = (ml / AXIS_MAX_MM) * W;
    ctx.fillText(ml+' mm', lx, H - 2);
  }
  var baseline = H - 12, displayH = baseline - 4;
  // v59 §103 DB — couplant Q scales the maze A-scan amplitudes the same way it
  // scales every other EX (CLAUDE.md §12). Low Q can hide a thin-spot echo.
  var qFactor = Math.max(0.001, couplantQ / 100);
  // v60 §112 DK / v61 §120 DS — dual-element probe has lower T peak (separate
  // Tx/Rx crystals reduce mainbang ringing) AND a shorter near-zone (T peak X
  // pushed left from 0.04W → 0.025W), opening up more A-scan real estate for
  // the thin-plate BW peak.
  var dualMode = (mazeProbeType === 'dual');
  var tX = W * (dualMode ? 0.025 : 0.04);
  var tAmp = (dualMode ? 0.5 : 1.0) * qFactor;
  ctx.fillStyle = 'rgba(63,185,80,0.85)';
  ctx.beginPath();
  ctx.moveTo(tX-3, baseline); ctx.lineTo(tX, baseline - tAmp*displayH*0.95); ctx.lineTo(tX+3, baseline); ctx.fill();
  ctx.fillStyle = 'rgba(63,185,80,1)'; ctx.font = 'bold 10px JetBrains Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('T', tX, 14);
  ctx.fillStyle = 'rgba(63,185,80,0.65)'; ctx.font = '7px JetBrains Mono,monospace';
  ctx.fillText(dualMode ? 't=0 · dual' : 't=0', tX, 24);
  // v60 §113 DL — BW dual-peak crossfade. Footprint-averaged thinAmount drives
  // BOTH peaks: normal-thickness BW fades out as thin-thickness BW fades in.
  // No instant jumps, no static peak — satisfies CLAUDE.md §1 smooth-attenuation.
  // v60 §111 DJ — peak width grows with roughness; A-scan baseline gets noise
  // proportional to roughness × thinAmount.
  var p   = _mazeProbeMm();
  var pf  = _mazeProbeFootprint(p);
  var tA  = pf.thinAmount;             // 0 = full normal, 1 = full thin
  var rgh = pf.roughness;
  // v72 §228 L3 — rising-edge of thinAmount > 0.5 → 50 ms haptic pulse (mobile).
  // Drawing happens every frame; only fire when crossing the threshold upward.
  var _thinNow = (tA > 0.5);
  if (_thinNow && !_hapticsLastMazeThin) _vibrate(50);
  _hapticsLastMazeThin = _thinNow;
  // v62 §130 EC — dual probe V-path bias: BW peak X reads ~2 % high (effective
  // path = thickness × bias). Demonstrates "swap probe ⇒ re-cal" to students.
  // v63 §138 EK — bias now driven by selected roof angle (5°/7°/10°).
  var vpathBias = dualMode ? _dualVpathBias() : 1.0;
  var bwX_normal = (MAZE_NORMAL_MM * vpathBias / AXIS_MAX_MM) * W;
  var bwX_thin   = (MAZE_THIN_MM   * vpathBias / AXIS_MAX_MM) * W;
  var ampMax     = 0.85 * qFactor;
  var amp_normal = (1 - tA) * ampMax;
  var amp_thin   = tA       * ampMax;
  // Peak half-width grows from 5 → 15 px with roughness.
  var halfW      = 5 + rgh * 10;
  // Baseline noise jitter: visible only when probe is in/near a thin spot.
  if (rgh > 0.05) {
    ctx.strokeStyle = 'rgba(100,200,255,0.35)';
    ctx.lineWidth = 0.6; ctx.beginPath();
    var noiseAmp = rgh * 0.18 * displayH;
    var noiseStartX = Math.max(W*0.10, bwX_thin - halfW*2);
    var noiseEndX   = Math.min(W*0.96, bwX_normal + halfW*2);
    ctx.moveTo(noiseStartX, baseline);
    for (var nx=noiseStartX; nx<noiseEndX; nx+=2) {
      var ny = baseline - (Math.random()*0.4 + 0.05) * noiseAmp;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
  }
  // Draw normal-thickness BW peak (yellow).
  if (amp_normal > 0.002) {
    var aN = amp_normal / ampMax; // 0..1 visibility
    ctx.fillStyle = 'rgba(255,200,80,' + (0.30 + 0.55*aN).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(bwX_normal-halfW, baseline);
    ctx.lineTo(bwX_normal, baseline - amp_normal*displayH*0.95);
    ctx.lineTo(bwX_normal+halfW, baseline);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,80,' + (0.45 + 0.55*aN).toFixed(3) + ')';
    ctx.font = 'bold 10px JetBrains Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('BW', bwX_normal, 14);
    ctx.font = '8px JetBrains Mono,monospace';
    ctx.fillText(MAZE_NORMAL_MM.toFixed(2)+' mm', bwX_normal, 26);
  }
  // Draw thin-spot BW peak (cyan).
  if (amp_thin > 0.002) {
    var aT = amp_thin / ampMax;
    ctx.fillStyle = 'rgba(100,200,255,' + (0.30 + 0.55*aT).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(bwX_thin-halfW, baseline);
    ctx.lineTo(bwX_thin, baseline - amp_thin*displayH*0.95);
    ctx.lineTo(bwX_thin+halfW, baseline);
    ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,' + (0.45 + 0.55*aT).toFixed(3) + ')';
    ctx.font = 'bold 10px JetBrains Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('BW', bwX_thin, 14);
    ctx.font = '8px JetBrains Mono,monospace';
    ctx.fillText(MAZE_THIN_MM.toFixed(2)+' mm THIN', bwX_thin, 26);
  }
  // v61 §122 DU — Maze BW multi-bounce. Real thin-plate UT shows leg-2 / leg-3
  // back-wall reverberations at X×2 / X×3 with progressive amplitude loss.
  // v62 §123 DV — gated by mazeMultiBounceOn (defaults follow mode).
  // v62 §131 ED — each leg re-samples the footprint at a horizontal offset
  // (+0.5·t / +1.0·t mm in +x) because real V-path beam wander makes L2/L3
  // pick up echoes from a slightly different sub-area than L1.
  if (_mazeMultiBounceActive()) {
    var bounceCfg = [{ leg:2, mult:0.55, shift:0.5 }, { leg:3, mult:0.30, shift:1.0 }];
    // v63 §139 EL — shift along probe's trail direction (anti-direction = trailing
    // edge wander). Static probe ⇒ fallback +X (matches v62 §131 ED behavior).
    var dirVec = _mazeTrailDirection();
    // v66 §192 GM — when the probe is stationary the V-path stays straight under it, so
    // L2/L3 sample the same (x,y) with zero shift. Only a moving probe wanders laterally.
    var moving = _mazeProbeMoving();
    bounceCfg.forEach(function(cfg){
      var bx_n = bwX_normal * cfg.leg;
      var bx_t = bwX_thin   * cfg.leg;
      var halfWB = halfW * 0.7;
      var shiftMm = moving ? cfg.shift * pf.thickness : 0;
      // Trail-direction-aware shift while moving (CLAUDE.md §139 EL); straight-down when still (§192 GM).
      var pShift = (shiftMm === 0) ? p
                 : { x_mm: Math.max(0, Math.min(MAZE_PLATE_MM, p.x_mm + dirVec.dx * shiftMm)),
                     y_mm: Math.max(0, Math.min(MAZE_PLATE_MM, p.y_mm + dirVec.dy * shiftMm)) };
      var pfL    = (shiftMm === 0) ? pf : _mazeProbeFootprint(pShift);
      var ampMax_leg = ampMax * cfg.mult;
      var a_n = (1 - pfL.thinAmount) * ampMax_leg;
      var a_t = pfL.thinAmount        * ampMax_leg;
      if (bx_n > tX && bx_n < W * 0.98 && a_n > 0.002) {
        ctx.fillStyle = 'rgba(255,200,80,' + (0.18 + 0.40*(a_n/ampMax)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(bx_n-halfWB, baseline);
        ctx.lineTo(bx_n, baseline - a_n*displayH*0.95);
        ctx.lineTo(bx_n+halfWB, baseline);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,200,80,0.55)';
        ctx.font = '7px JetBrains Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillText('L'+cfg.leg, bx_n, baseline - a_n*displayH*0.95 - 3);
      }
      if (bx_t > tX && bx_t < W * 0.98 && a_t > 0.002) {
        ctx.fillStyle = 'rgba(100,200,255,' + (0.18 + 0.40*(a_t/ampMax)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(bx_t-halfWB, baseline);
        ctx.lineTo(bx_t, baseline - a_t*displayH*0.95);
        ctx.lineTo(bx_t+halfWB, baseline);
        ctx.fill();
        ctx.fillStyle = 'rgba(100,200,255,0.55)';
        ctx.font = '7px JetBrains Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillText('L'+cfg.leg, bx_t, baseline - a_t*displayH*0.95 - 3);
      }
    });
  }
  // v62 §130 EC — small hint when dual probe biases thickness reading.
  // v63 §138 EK — roof angle is now student-selectable.
  if (dualMode) {
    var biasPct = ((_dualVpathBias() - 1) * 100).toFixed(1);
    ctx.fillStyle = 'rgba(255,160,80,0.85)';
    ctx.font = '7px JetBrains Mono,monospace'; ctx.textAlign = 'right';
    ctx.fillText('dual roof ' + mazeDualRoofAngle + '° · reads +' + biasPct + ' % (V-path)', W - 4, 12);
  }
  // v60 §106 DE — cyan dashed guide marking the dominant BW peak X.
  var bwGuideX = (pf.thickness / AXIS_MAX_MM) * W;
  ctx.strokeStyle = 'rgba(0,229,255,0.40)';
  ctx.lineWidth = 1; ctx.setLineDash([3,4]);
  ctx.beginPath(); ctx.moveTo(bwGuideX, 30); ctx.lineTo(bwGuideX, baseline-2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,229,255,0.75)'; ctx.font = '7px JetBrains Mono,monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Δt ∝ thickness', bwGuideX, baseline - 4);
  // v61 §114 DM — partial-coverage hint when both BW echoes are visible.
  // Triggers in the 0.2 < thinAmount < 0.8 band — the explicit "footprint
  // straddles a thin spot edge" zone.
  if (tA > 0.2 && tA < 0.8) {
    ctx.fillStyle = 'rgba(255,200,120,0.85)';
    ctx.font = '8px JetBrains Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('partial footprint coverage — both BW echoes visible', W * 0.5, H - 26);
  }
  // baseline
  ctx.strokeStyle = 'rgba(0,255,65,0.18)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, baseline); ctx.lineTo(W, baseline); ctx.stroke();
  // v59 §103 DB — coupling hint when Q is degraded.
  if (couplantQ < 70) {
    ctx.fillStyle = 'rgba(255,120,80,0.9)';
    ctx.font = '9px JetBrains Mono,monospace'; ctx.textAlign = 'right';
    ctx.fillText('⚠ couplant Q '+couplantQ+'% — echoes attenuated', W - 6, 14);
  }
  // v60 §112 DK — probe-type readout in A-scan top-left corner.
  ctx.fillStyle = 'rgba(180,200,220,0.7)';
  ctx.font = '8px JetBrains Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText(dualMode ? 'probe: dual element 1/2"' : 'probe: single 1/2"', 6, 10);
}
// v53 §49 AT — Material longitudinal velocity (mm/μs). Affects λ = c/f and SP↔TOF conversions.
// Standard values from Krautkrämer / ASNT handbook (steel default; carbon steel L wave).

function descHtmlMaze(env){ var META=env.META, DETAILS=env.DETAILS, DISCL=env.DISCL;
  // v58 §87 CL — EX05 Corrosion Maze instructions
  return '<strong>EX 05 · Corrosion Maze — Top-Down 2D Scan</strong>'+
      META+
      '<ol>'+
        '<li>Pick a <b>difficulty</b> (Easy / Medium / Hard) — the maze regenerates with hidden thin spots</li>'+
        '<li><b>Drag the cyan probe</b> across the plate; THICKNESS readout updates as you go. THIN SPOT label appears when you cross one</li>'+
        '<li>When you find a thin spot, click <b>📍 Drop Marker</b> to record its position (use ↶ Undo to remove the last)</li>'+
        '<li>When you think you found them all, click <b>👁 Reveal Maze</b> to compare orange markers vs the hidden light-blue maze</li>'+
        '<li>Score: each marker within ~10 mm of a real spot = hit. Try faster + more accurate over rounds</li>'+
      '</ol>'+
      DETAILS(
        '<b>What this teaches:</b> 2D corrosion mapping by hand — equivalent to a manual C-Scan. Real inspectors do this on tank floors, pressure-vessel walls, ship hulls.<br>'+
        '<b>Why this paradigm differs from EX01–EX04:</b> those show you a <i>cross-section</i> side view of one scan line. EX05 simulates the inspector walking the probe over a flat area, mapping wall-loss patterns.<br>'+
        '<b>Tip:</b> watch the THICKNESS readout — it smoothly drops from '+MAZE_NORMAL_MM+' mm toward '+MAZE_THIN_MM+' mm as you approach a thin spot. The A-scan BW peak shifts left at the same time.'
      )+
      // v59 §98 CW — disclaimer: random demo, not realistic corrosion distribution.
      '<div style="margin-top:8px;padding:6px 9px;border-radius:4px;background:rgba(255,90,90,0.08);border:1px dashed rgba(255,90,90,0.4);font-size:10px;color:rgba(255,180,180,0.95);">'+
        '⚠ <b>Simplified demo:</b> these thin spots are placed at random for training. Real corrosion clusters along drainage paths, weld toes, support contacts and grain boundaries — not uniformly random. Use this exercise to practise the <i>scan technique</i>, not to model field distributions.'+
      '</div>';
}

Exercises.register('maze',        { num:'EX05', name:'Maze',        group:'core', btnId:'btn-maze', activeClass:'active-maze',
  drawScene:function(ctx){ drawMazeScan(ctx); },
  drawAscan:function(ctx,W,H){ drawMazeAscan(ctx,W,H); _maybeUpdateMazeTimer(); },
  onEnter:function(){
    if (mazeSpots.length === 0) {
      generateMaze();
      // Centre probe initially
      txX = MAT_X + MAT_W * 0.5;
      txY = MAT_Y + MAT_H * 0.5;
    }
    // v60 §108 DG — best-score chip on (re-)entry
    if (typeof _refreshMazeBestChip === 'function') _refreshMazeBestChip();
    // v62 §123 DV / §129 EB — sync maze sub-toggle button labels on EX entry
    if (typeof _refreshMazeMultiBounceBtn === 'function') _refreshMazeMultiBounceBtn();
    var strictBtn = document.getElementById('mz-strict-toggle');
    if (strictBtn) {
      strictBtn.textContent = _strictBtnLabel(); // v66 §187 GH
      strictBtn.className = 'mz-diff-btn mz-diff-btn--toggle' + (mazeStrictMode ? ' active' : '');
    }
    var strictChip = document.getElementById('mz-strict-stat');
    if (strictChip) strictChip.style.display = mazeStrictMode ? 'inline-block' : 'none';
    // v64 §150 EW — first-time EX5 visitors get an orange pulse + "(3 hidden)" hint
    var seen = safeSSGet('_fsSettingsSeen', '');
    var summary = document.getElementById('mz-settings-summary');
    var details = document.getElementById('mz-settings');
    if (summary && details && seen !== '1') {
      summary.textContent = '⚙ Settings ▾ (3 hidden)';
      details.classList.add('mz-settings--pulse');
      var _settleSettingsSeen = function(){
        if (safeSSGet('_fsSettingsSeen','') === '1') return;
        safeSSSet('_fsSettingsSeen', '1');
        details.classList.remove('mz-settings--pulse');
        if (summary) summary.textContent = '⚙ Settings ▾';
        details.removeEventListener('toggle', _onToggleSeen);
      };
      var _onToggleSeen = function(){ _settleSettingsSeen(); };
      details.addEventListener('toggle', _onToggleSeen);
      // v65 §168 FO — mark "seen" after 6 s even without a toggle
      setTimeout(_settleSettingsSeen, 6000);
    } else if (summary) {
      summary.textContent = '⚙ Settings ▾';
    }
  }, descHtml:function(env){ return descHtmlMaze(env); }, getSignal:null });
