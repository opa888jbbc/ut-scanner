// js/ex06-immersion.js - EX06 / Module 5 Immersion UT module (Stage 3 modular refactor, 2026-06-07 EDT).
// Extracted verbatim from core.js. Load order: registry.js -> ex0X modules -> core.js. Defines its
// data globals + constants + render functions, then self-registers. Cross-cutting callers
// (setMaterial / resetExercise / smoke M5-8) stay in core and resolve these at runtime.

// ═══════════════════════════════════════════════════
// v74 — EX06 IMMERSION (Module 5 · M5-5/6/7/8)
// CLAUDE.md §234 M5-5 (Immersion basis) / §235 M5-6 (Wheel) / §236 M5-7 (Bubbler+Squirter) / §237 M5-8 (Z impedance)
// Vault wiki/ut-immersion.md is the physics source (water path, FS echo, IF gate, sub-mode characteristics).
// ═══════════════════════════════════════════════════
var immersionSubMode = 'tank';            // 'tank' | 'wheel' | 'bubbler' | 'squirter'
var immersionWaterPathMm = 35;            // adjustable 5–50 mm, default 35 (safely > thickness × 0.25 = 25 mm for 100 mm steel)
var IMMERSION_THICKNESS_MM = 100;         // EX06 part thickness — matches MAT_H 100 mm convention used by EX01–EX03
var IMMERSION_DEFECT_DEPTH_MM = 50;       // single SDH at mid-depth — Level-1 reference reflector convention
var IMMERSION_DEFECT_RX = 0.50;           // horizontal centre — student drags probe across to find max echo
var C_WATER_M_S = 1480;                   // longitudinal speed in water (m/s) — Vault impedance table value

// Density (g/cm³) lookup so Z = ρ × c (MRayl) is live with material selector.
var IMMERSION_DENSITY_BY_C = { 5.9: 7.85, 6.32: 2.70, 4.66: 8.96, 4.5: 7.20 };

// Sub-mode visual presets — Vault wiki/ut-immersion.md application matrix:
//   tank      — full immersion bath (large blue volume around probe + part top)
//   wheel     — rolling rubber-tyre housing with probe inside; tyre touches surface
//   bubbler   — short low-velocity water column from a nozzle, probe at top
//   squirter  — high-velocity long jet (water column ~50 mm), spray fringe
var IMMERSION_SUBMODE_META = {
  tank:     { label:'Tank',     wpHint:'25–100 mm', tag:'lab / aerospace' },
  wheel:    { label:'Wheel',    wpHint:'10–20 mm (inside tyre)', tag:'composite skin / hand-scan · hybrid' },
  bubbler:  { label:'Bubbler',  wpHint:'10–25 mm (short column)', tag:'production-line plate / coil' },
  squirter: { label:'Squirter', wpHint:'30–100 mm (long jet)', tag:'aerospace · irregular surfaces' }
};

function setImmersionSubMode(mode) {
  if (!IMMERSION_SUBMODE_META[mode]) return;
  immersionSubMode = mode;
  ['tank','wheel','bubbler','squirter'].forEach(function(m){
    var el = document.getElementById('im-mode-'+m);
    if (el) el.className = (m===mode) ? 'im-mode-btn active' : 'im-mode-btn';
  });
  if (typeof showToast === 'function') {
    var meta = IMMERSION_SUBMODE_META[mode];
    showToast(meta.label + ' mode · ' + meta.tag + ' · typical WP ' + meta.wpHint, 2400);
  }
}
function onWpChange() {
  var el = document.getElementById('wp-slider'); if (!el) return;
  immersionWaterPathMm = +el.value;
  var v = document.getElementById('wp-val'); if (v) v.textContent = immersionWaterPathMm + ' mm';
  _updateImWpWarning();
}
function _immersionCriticalWpMm() {
  // FS 2nd round-trip = 2 × WP / c_water. BW round-trip = 2 × t / c_steel. Safe when FS 2nd > BW:
  //   WP > thickness × (c_water / c_steel).  For 100 mm steel & c=5.9 mm/μs → ~25 mm.
  return IMMERSION_THICKNESS_MM * (C_WATER_M_S / (materialC * 1000));
}
function _updateImWpWarning() {
  var warn = document.getElementById('im-wp-warning'); if (!warn) return;
  var crit = _immersionCriticalWpMm();
  if (immersionWaterPathMm < crit) {
    warn.style.display = 'block';
    warn.innerHTML = '⚠ <b>FS 2nd echo will appear before BW</b> — WP ' + immersionWaterPathMm + ' mm &lt; critical ' + crit.toFixed(1) +
      ' mm. Per Vault: <code>WP<sub>min</sub> = t × (c<sub>water</sub> / c<sub>steel</sub>) ≈ t × ' + (C_WATER_M_S / (materialC * 1000)).toFixed(3) +
      '</code>. Increase WP or accept overlap on the in-steel window.';
  } else {
    warn.style.display = 'none';
  }
}
function updateImpedancePanel() {
  // Z = ρ × c · in MRayl with ρ in g/cm³ and c in mm/μs. Steel: 7.85 × 5.9 = 46.3.
  var density = IMMERSION_DENSITY_BY_C[materialC] || 7.85;
  var zMat = density * materialC;
  var zWater = 1.5;
  var rEnergy = Math.pow((zMat - zWater) / (zMat + zWater), 2);  // intensity reflection coefficient
  var tEnergy = 1 - rEnergy;
  var zEl  = document.getElementById('im-impedance-z');
  var rtEl = document.getElementById('im-impedance-rt');
  if (zEl)  zEl.innerHTML  = 'Z<span class="im-z-mat">(mat)='+zMat.toFixed(1)+'</span> · Z<span class="im-z-water">(water)=1.5</span> MRayl';
  if (rtEl) rtEl.innerHTML = 'R<span class="im-rt-r">='+(rEnergy*100).toFixed(1)+'%</span> · T<span class="im-rt-t">='+(tEnergy*100).toFixed(1)+'%</span>';
  _updateImWpWarning(); // critical WP depends on materialC too — keep in sync
}

// ─── drawImmersionScene · side-view scan canvas ──────────────────────────────
// Probe sits ABOVE the part (no contact). Water column visualised between probe
// face and steel surface. Sub-mode changes the housing geometry around probe.
function drawImmersionScene(ctx) {
  ctx.clearRect(0,0,CW,CH);
  ctx.fillStyle='#0a0d14'; ctx.fillRect(0,0,CW,CH);
  // Grid (same convention as EX01–EX03)
  ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
  var gs = MAT_W/8;
  for (var i=0;i<=8;i++){ var gx=MAT_X+i*gs; ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,CH);ctx.stroke(); }
  ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='center';
  for (var j=0;j<=8;j++) ctx.fillText((j*30)+'mm', MAT_X+j*gs, CH-3);
  // Steel block (same chrome as standard EX)
  var grad=ctx.createLinearGradient(0,MAT_Y,0,MAT_Y+MAT_H);
  grad.addColorStop(0,'#3a4a5c'); grad.addColorStop(0.35,'#2e3d50'); grad.addColorStop(1,'#1a2a3a');
  ctx.fillStyle=grad; ctx.beginPath(); ctx.roundRect(MAT_X,MAT_Y,MAT_W,MAT_H,4); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.font='9px DM Sans,sans-serif'; ctx.textAlign='left';
  ctx.fillText('Steel · '+IMMERSION_THICKNESS_MM+' mm · '+IMMERSION_SUBMODE_META[immersionSubMode].label+' mode', MAT_X+6, MAT_Y+12);
  // Depth ticks
  ctx.fillStyle='rgba(255,255,255,0.13)'; ctx.font='8px JetBrains Mono,monospace'; ctx.textAlign='right';
  for (var d=0;d<=4;d++){
    var dy=MAT_Y+(d/4)*MAT_H;
    ctx.fillText((d*25)+'mm', MAT_X-2, dy+3);
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(MAT_X,dy);ctx.lineTo(MAT_X+MAT_W,dy);ctx.stroke();
  }
  // Water path in canvas px — scale slider mm to px using MAT_H as the 100 mm reference.
  var wpPx = (immersionWaterPathMm / IMMERSION_THICKNESS_MM) * MAT_H;
  // Clamp visually so probe stays inside the canvas top.
  if (wpPx > SURF_Y - 12) wpPx = SURF_Y - 12;
  var probeFaceY = SURF_Y - wpPx;
  // Sub-mode coupling visualisation (water column / housing).
  _drawImmersionCoupling(ctx, txX, probeFaceY, wpPx);
  // SDH defect at 50 mm depth, fixed X (rx 0.50) — student drags probe to find max echo.
  var defX = MAT_X + IMMERSION_DEFECT_RX * MAT_W;
  var defY = MAT_Y + (IMMERSION_DEFECT_DEPTH_MM / IMMERSION_THICKNESS_MM) * MAT_H;
  var defR = Math.max(3, MAT_W*0.005);
  // Sensitivity: peak when probe is over the defect
  var senDx = Math.abs(txX - defX);
  var senBW = MAT_W * 0.15;
  var sen   = Math.max(0, 1 - senDx/senBW);
  ctx.shadowColor='rgba(255,165,0,0.85)'; ctx.shadowBlur=4 + sen*10;
  ctx.fillStyle='rgba(255,165,0,'+(0.45+sen*0.45)+')';
  ctx.beginPath(); ctx.arc(defX, defY, defR, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,200,80,0.85)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(defX, defY, defR, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle='rgba(255,200,140,0.85)'; ctx.font='8px DM Sans,sans-serif'; ctx.textAlign='left';
  ctx.fillText('SDH Φ3 @ 50 mm', defX + defR + 4, defY + 3);
  // Probe (rendered after water so it sits on top)
  _drawImmersionProbe(ctx, txX, probeFaceY);
  // WP measurement annotation
  ctx.save();
  ctx.strokeStyle='rgba(120,200,255,0.55)'; ctx.lineWidth=1;
  ctx.setLineDash([3,3]);
  var labelX = Math.min(txX + 30, MAT_X + MAT_W - 80);
  ctx.beginPath(); ctx.moveTo(labelX, probeFaceY); ctx.lineTo(labelX, SURF_Y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(120,200,255,0.95)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='left';
  ctx.fillText('WP ' + immersionWaterPathMm + ' mm', labelX + 4, (probeFaceY + SURF_Y)/2 + 3);
  ctx.restore();
  // Material outline
  ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(MAT_X,MAT_Y,MAT_W,MAT_H,4); ctx.stroke();
}

function _drawImmersionProbe(ctx, x, y) {
  // Generic dark-grey probe block, similar to the standard PE transducer chrome.
  var w = TX_W, h = TX_H;
  ctx.fillStyle='#262e3a';
  ctx.fillRect(x - w/2, y - h, w, h);
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
  ctx.strokeRect(x - w/2, y - h, w, h);
  // Active face (cyan glow underside) — student associates this as Tx/Rx surface
  ctx.fillStyle='rgba(0,229,255,0.55)';
  ctx.fillRect(x - w/2 + 3, y - 2, w - 6, 2);
  // Cable nub
  ctx.fillStyle='#3a4250'; ctx.fillRect(x - 3, y - h - 4, 6, 4);
}

function _drawImmersionCoupling(ctx, x, probeFaceY, wpPx) {
  // Common: a vertical water column from probe face down to surface.
  var waterTop = probeFaceY;
  var waterBot = SURF_Y;
  // Tank: large blue volume around probe + extending laterally as far as canvas
  if (immersionSubMode === 'tank') {
    // Full-width pool from probe top to surface
    ctx.fillStyle='rgba(80,170,235,0.18)';
    ctx.fillRect(MAT_X, Math.max(0, waterTop - TX_H - 6), MAT_W, waterBot - Math.max(0, waterTop - TX_H - 6));
    // Water-line at top
    ctx.strokeStyle='rgba(120,200,255,0.45)'; ctx.lineWidth=1;
    ctx.setLineDash([4,3]);
    var topLine = Math.max(0, waterTop - TX_H - 6);
    ctx.beginPath(); ctx.moveTo(MAT_X, topLine); ctx.lineTo(MAT_X + MAT_W, topLine); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  // Wheel: rubber tyre encloses probe; tyre underside touches surface (hybrid).
  if (immersionSubMode === 'wheel') {
    var wheelR = wpPx + TX_H * 0.55 + 8;
    var wheelCY = waterBot - wheelR + 6;     // touches surface
    var wheelCX = x;
    // Tyre rubber ring
    ctx.fillStyle='rgba(40,40,50,0.85)';
    ctx.beginPath(); ctx.arc(wheelCX, wheelCY, wheelR, 0, Math.PI*2); ctx.fill();
    // Water-filled interior
    ctx.fillStyle='rgba(80,170,235,0.30)';
    ctx.beginPath(); ctx.arc(wheelCX, wheelCY, wheelR - 6, 0, Math.PI*2); ctx.fill();
    // Tyre outline
    ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(wheelCX, wheelCY, wheelR, 0, Math.PI*2); ctx.stroke();
    // Axle / spokes (gives rolling cue)
    ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1;
    var spokeAng = ((typeof performance!=='undefined'?performance.now():Date.now())/300) % (Math.PI*2);
    for (var s=0; s<4; s++) {
      var a = spokeAng + s * Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(wheelCX + Math.cos(a)*4, wheelCY + Math.sin(a)*4);
      ctx.lineTo(wheelCX + Math.cos(a)*(wheelR-4), wheelCY + Math.sin(a)*(wheelR-4));
      ctx.stroke();
    }
    // Hybrid badge
    ctx.fillStyle='rgba(255,200,80,0.75)'; ctx.font='7px JetBrains Mono,monospace'; ctx.textAlign='left';
    ctx.fillText('HYBRID · half-immersion + contact tyre', MAT_X + 6, MAT_Y - 6);
    return;
  }
  // Bubbler: short narrow column with rising bubbles.
  if (immersionSubMode === 'bubbler') {
    var colW = TX_W * 1.05;
    var colX = x - colW/2;
    // Nozzle housing
    ctx.fillStyle='rgba(60,70,90,0.85)';
    ctx.fillRect(colX - 4, probeFaceY - TX_H - 10, colW + 8, 10);
    // Water column
    ctx.fillStyle='rgba(80,170,235,0.32)';
    ctx.fillRect(colX, waterTop, colW, waterBot - waterTop);
    // Edges
    ctx.strokeStyle='rgba(120,200,255,0.55)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(colX, waterTop); ctx.lineTo(colX, waterBot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(colX+colW, waterTop); ctx.lineTo(colX+colW, waterBot); ctx.stroke();
    // Bubbles
    var t = (typeof performance!=='undefined'?performance.now():Date.now()) / 1000;
    for (var b=0; b<5; b++) {
      var phase = (t * 0.6 + b * 0.2) % 1;
      var bx = colX + 4 + (b%3) * (colW-8)/3 + Math.sin(t*2 + b)*1.5;
      var by = waterBot - phase * (waterBot - waterTop);
      var br = 1.4 + Math.sin(t*3 + b)*0.4;
      ctx.fillStyle='rgba(220,240,255,'+(0.40 + (1-phase)*0.30)+')';
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill();
    }
    return;
  }
  // Squirter: long high-velocity jet — column extends well above probe; lateral spray fringe.
  if (immersionSubMode === 'squirter') {
    var jetW = TX_W * 0.75;
    var jetX = x - jetW/2;
    // Nozzle stem extending well above the canvas top — visual hint that source is "far above"
    ctx.fillStyle='rgba(60,70,90,0.95)';
    ctx.fillRect(jetX - 5, 0, jetW + 10, Math.max(0, probeFaceY - TX_H - 8));
    // High-velocity water column (denser opacity to signal high pressure)
    var jetGrad = ctx.createLinearGradient(0, 0, 0, waterBot);
    jetGrad.addColorStop(0, 'rgba(80,170,235,0.50)');
    jetGrad.addColorStop(0.5, 'rgba(80,170,235,0.45)');
    jetGrad.addColorStop(1, 'rgba(80,170,235,0.40)');
    ctx.fillStyle = jetGrad;
    ctx.fillRect(jetX, 0, jetW, waterBot);
    // Speed streaks inside jet
    ctx.strokeStyle='rgba(220,240,255,0.40)'; ctx.lineWidth=1;
    var t2 = (typeof performance!=='undefined'?performance.now():Date.now()) / 1000;
    for (var k=0; k<6; k++) {
      var phase2 = ((t2 * 1.8 + k * 0.18) % 1);
      var sy = phase2 * (waterBot - 2);
      ctx.beginPath();
      ctx.moveTo(jetX + 4 + (k%3) * (jetW-8)/3, sy);
      ctx.lineTo(jetX + 4 + (k%3) * (jetW-8)/3, sy + 8);
      ctx.stroke();
    }
    // Lateral spray fringe near impingement (where jet meets steel)
    var sprayCount = 12;
    for (var p=0; p<sprayCount; p++) {
      var ang = (Math.PI * (p / (sprayCount-1))) - Math.PI/2; // -90° to +90° around impingement
      var len = 6 + ((t2*4 + p)%3) * 2;
      var sx0 = x;
      var sy0 = waterBot;
      var sx1 = sx0 + Math.cos(ang) * len;
      var sy1 = sy0 + Math.abs(Math.sin(ang)) * 2; // bias downward-spread
      ctx.strokeStyle='rgba(220,240,255,'+(0.30 + Math.random()*0.20)+')';
      ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
    }
    return;
  }
}

// ─── drawImmersionAscan · 4-peak A-scan (IP → FS → D → BW) ──────────────────
// X-axis convention: keep T (IP) anchored at AX_LEFT (the existing T-peak x), then layout FS, D, BW
// proportionally. We do NOT try to share the contact-PE A-scan: the time domains differ (in
// immersion the first part of the trace is water transit, not steel). Instead we draw a
// standalone immersion-only A-scan with annotations + IF gate band.
function drawImmersionAscan(ctx, W, H) {
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0a0d14'; ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  for (var gx=0; gx<=10; gx++){ var gxp = gx/10 * W; ctx.beginPath(); ctx.moveTo(gxp,0); ctx.lineTo(gxp,H); ctx.stroke(); }
  for (var gy=0; gy<=4; gy++){ var gyp = gy/4 * H; ctx.beginPath(); ctx.moveTo(0,gyp); ctx.lineTo(W,gyp); ctx.stroke(); }
  // Baseline
  var baselineY = H * 0.85;
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0, baselineY); ctx.lineTo(W, baselineY); ctx.stroke();
  // ── Time → X mapping. Use μs as the unit. ToF for water round-trip = 2·WP/c_water.
  //    ToF for steel round-trip = 2·t/c_steel.  Display range 0 .. (ToF_water_2RT + ToF_steel_RT + 20%) μs.
  var tWater = (2 * immersionWaterPathMm) / C_WATER_M_S * 1000;            // μs round-trip in water
  var tSteel = (2 * IMMERSION_THICKNESS_MM) / (materialC * 1000) * 1000;    // μs round-trip in steel
  var tDefect = (2 * IMMERSION_DEFECT_DEPTH_MM) / (materialC * 1000) * 1000;
  var tFS = tWater;                                // FS arrives after one water round-trip
  var tD  = tFS + tDefect;                         // D arrives after FS + defect round-trip
  var tBW = tFS + tSteel;                          // BW arrives after FS + full-steel round-trip
  var tFS2 = tFS * 2;                              // FS 2nd echo — water round-trip again on top of FS
  // Pick an X-axis maximum that comfortably fits everything plus headroom
  var tMax = Math.max(tBW * 1.15, tFS2 * 1.05, 30);
  function timeToX(t){ return (t / tMax) * W; }
  // Axis labels (μs ticks)
  ctx.fillStyle='rgba(255,255,255,0.40)'; ctx.font='8px JetBrains Mono,monospace'; ctx.textAlign='center';
  for (var ti=0; ti<=10; ti++){
    var lt = (ti/10) * tMax;
    var lx = timeToX(lt);
    ctx.fillText(lt.toFixed(0)+'μs', lx, H-2);
  }
  // ── IF gate band — between FS+0.5μs and BW (the "in-steel" window).
  var ifLeft  = timeToX(tFS + 0.5);
  var ifRight = timeToX(tBW);
  ctx.fillStyle='rgba(63,225,120,0.10)';
  ctx.fillRect(ifLeft, H*0.10, Math.max(2, ifRight - ifLeft), H*0.75);
  ctx.strokeStyle='rgba(63,225,120,0.55)'; ctx.lineWidth=1;
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(ifLeft, H*0.10); ctx.lineTo(ifLeft, H*0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ifRight,H*0.10); ctx.lineTo(ifRight,H*0.85); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(120,235,170,0.85)'; ctx.font='8px JetBrains Mono,monospace'; ctx.textAlign='left';
  ctx.fillText('IF gate (in-steel window)', ifLeft + 4, H*0.10 + 9);
  // ── Peak amplitudes (pedagogical; uses Vault impedance numbers as starting point).
  //    Water→Steel R≈0.88 → FS dominant. T≈0.12 per pass → in-steel echoes are 0.12² × reflectivity.
  //    A SDH at 50 mm with default reference visible ~30% FSH; max when probe centered.
  var defX_px = MAT_X + IMMERSION_DEFECT_RX * MAT_W;
  var senDx   = Math.abs(txX - defX_px);
  var senBW   = MAT_W * 0.15;
  var sen     = Math.max(0, 1 - senDx/senBW);
  var qFactor = couplantQ / 100;            // CLAUDE.md §12 — couplant slider also applies in immersion
  var gainAmp = Math.pow(10, (gainDB - 40) / 20);  // dB → linear (40 dB ref baseline)
  var ampIP   = 0.95 * qFactor;
  var ampFS   = 0.85 * qFactor;             // FS reflection from water-steel
  var ampD    = sen * 0.45 * qFactor * gainAmp;
  var ampBW   = 0.55 * qFactor * gainAmp;
  // Clip top so peaks don't blow out the canvas
  function clipAmp(a){ return Math.min(1.2, Math.max(0, a)); }
  ampIP = clipAmp(ampIP); ampFS = clipAmp(ampFS); ampD = clipAmp(ampD); ampBW = clipAmp(ampBW);
  // FS 2nd echo amplitude (decays one extra water round-trip)
  var ampFS2 = clipAmp(ampFS * 0.55);
  // ── Draw peaks (filled triangles, like the existing A-scan style)
  function drawPeak(t, amp, color, label, sub) {
    var x = timeToX(t);
    var pw = 4;
    var topY = baselineY - amp * (H * 0.70);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - pw, baselineY);
    ctx.lineTo(x,       topY);
    ctx.lineTo(x + pw,  baselineY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - pw, baselineY); ctx.lineTo(x, topY); ctx.lineTo(x + pw, baselineY);
    ctx.stroke();
    ctx.fillStyle = color; ctx.font = '9px JetBrains Mono,monospace'; ctx.textAlign='center';
    ctx.fillText(label, x, topY - 4);
    if (sub) {
      ctx.fillStyle='rgba(255,255,255,0.50)'; ctx.font='7px JetBrains Mono,monospace';
      ctx.fillText(sub, x, topY - 14);
    }
  }
  drawPeak(0,           ampIP,  'rgba(63,225,120,0.95)', 'IP', 't=0');
  drawPeak(tFS,         ampFS,  'rgba(120,200,255,0.95)','FS', tFS.toFixed(1)+'μs');
  if (ampD > 0.04) drawPeak(tD,   ampD,  'rgba(255,165,0,0.95)', 'D',  tD.toFixed(1)+'μs · '+(ampD*100).toFixed(0)+'%');
  drawPeak(tBW,         ampBW,  'rgba(210,153,34,0.95)', 'BW', tBW.toFixed(1)+'μs');
  // FS 2nd echo — drawn dimmer so it's visibly secondary, only when within axis
  if (tFS2 < tMax) {
    drawPeak(tFS2, ampFS2, 'rgba(120,200,255,0.45)', 'FS₂', tFS2.toFixed(1)+'μs');
    if (tFS2 < tBW) {
      // Overlap warning band on A-scan itself
      ctx.fillStyle='rgba(255,90,90,0.10)';
      ctx.fillRect(timeToX(tFS2)-8, H*0.05, 16, H*0.80);
      ctx.fillStyle='rgba(255,140,140,0.85)'; ctx.font='8px JetBrains Mono,monospace'; ctx.textAlign='center';
      ctx.fillText('⚠ overlap', timeToX(tFS2), H*0.06);
    }
  }
  // Title strip
  ctx.fillStyle='rgba(120,200,255,0.85)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='left';
  ctx.fillText('EX06 IMMERSION · '+IMMERSION_SUBMODE_META[immersionSubMode].label+' · WP '+immersionWaterPathMm+' mm', 4, 12);
}


function descHtmlImmersion(env){ var META=env.META, DETAILS=env.DETAILS, DISCL=env.DISCL;
  // v74 §234 M5-5 / §235 M5-6 / §236 M5-7 / §237 M5-8 — Module 5 Immersion UT.
  // Layered logic per Vault wiki/ut-immersion.md: why-water → water-path → FS echo / IF gate
  // → focused probe → 4 sub-modes (tank / wheel / bubbler / squirter) → decision tree.
  return '<strong>EX 06 · Immersion UT · Water-Coupled Inspection</strong>'+
      META+
      '<ol class="step-locked" id="ex06-ol">'+
        '<li><b>Observe the A-scan</b> — you now see 4 peaks instead of 3: <code>IP → FS → D → BW</code>. The tall <b>FS</b> peak is the water/steel front-surface reflection (~88 % energy bounces here per Vault impedance table).</li>'+
        '<li class="locked"><b>Drag the probe</b> over the SDH at 50 mm depth — watch the D peak rise inside the green <b>IF gate</b> (in-steel window between FS and BW).</li>'+
        '<li class="locked"><b>Drop the Water Path slider</b> below 25 mm — the red <b>FS₂ overlap warning</b> appears: the 2nd water round-trip now lands before BW and pollutes the in-steel window.</li>'+
        '<li class="locked"><b>Cycle the 4 sub-modes</b> (Tank · Wheel · Bubbler · Squirter) — the housing changes but the A-scan physics stays the same; only the coupling geometry differs (Vault application matrix).</li>'+
        '<li class="locked"><b>Switch material</b> (Aluminium / Copper / Cast iron) — the live Z impedance panel updates R/T at the water-material interface. Steel→Al drops R from 88 % to ~70 %.</li>'+
      '</ol>'+
      DETAILS(
        '<b>Why water?</b> Air↔Steel reflects 99.99 % — UT impossible without coupling. Water↔Steel reflects ~88 %, transmits ~12 % per pass → double-pass efficiency ~1.4 % → run gain 50–70 dB.<br>'+
        '<b>Water Path minimum:</b> <code>WP<sub>min</sub> = thickness × c<sub>water</sub> / c<sub>steel</sub> ≈ thickness × 0.25</code>. For 100 mm steel → WP > 25 mm keeps FS 2nd echo behind BW. Slider default 35 mm = safe margin.<br>'+
        '<b>IF gate:</b> rejects FS, gates the in-steel window — student sees only D & BW relevant peaks after gating.<br>'+
        '<b>4 sub-modes (Vault):</b> <i>Tank</i> = lab/aerospace high-precision · <i>Wheel</i> = composite skins, hybrid contact tyre · <i>Bubbler</i> = production-line plate/coil · <i>Squirter</i> = long-jet aerospace and irregular surfaces. Same physics, different geometry for different industry use-cases.<br>'+
        '<b>Z impedance:</b> Z = ρ × c (MRayl). Switching material changes Z<sub>mat</sub> and R/T live — explains why immersion R is much higher than contact-PE gel coupling (~5 %).'
      )+
      DISCL('⚠ Sim simplification — focused probe geometry not modelled (real immersion uses focused transducers, WP=F − M<sub>p</sub>·4). 4 sub-modes share the same A-scan physics; in reality squirter loses high freq in long jets, wheel adds tyre echo, bubbler has slow water-flow ripple. Use this EX to learn coupling philosophy, not exam-grade procedure.');
}

Exercises.register('immersion',   { num:'EX06', name:'Immersion',   group:'m5', btnId:'btn-immersion', activeClass:'active-immersion',
  drawScene:function(ctx){ drawImmersionScene(ctx); },
  drawAscan:function(ctx,W,H){ drawImmersionAscan(ctx,W,H); },
  onEnter:function(){
    // Centre probe horizontally on first entry so the SDH at rx=0.50 sits straight below
    if (txX < MAT_X + 10 || txX > MAT_X + MAT_W - 10) txX = MAT_X + MAT_W * 0.5;
    if (typeof updateImpedancePanel === 'function') updateImpedancePanel();
    if (typeof _updateImWpWarning === 'function') _updateImWpWarning();
  }, descHtml:function(env){ return descHtmlImmersion(env); }, getSignal:null });
