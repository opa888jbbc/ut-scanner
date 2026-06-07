// js/ex04-grating.js - EX04 PAUT Grating Lobes module (Stage 3 modular refactor, 2026-06-07 EDT).
// Extracted verbatim from core.js. Load order: registry.js -> THIS -> core.js. Defines its render
// functions then self-registers. Shared state (pitchMm/nElements/MAT_*/freq) and the controls /
// export / reset / guided-walkthrough references stay in core.js and resolve at runtime (core
// loads after this file, so its globals exist by the time these functions are ever called).

// ═══════════════════════════════════════════════════
// EX04 — PAUT GRATING LOBE VISUALISATION
// ─── Physics ──────────────────────────────────────
//  Bragg / grating equation:     sinθ_m  =  m · λ / d        (m = ±1, ±2, …)
//   - main lobe                  m = 0  (always present, normal incidence)
//   - grating-lobe count         2·floor(d/λ)   (one pair per integer order)
//   - main-lobe FWHM             ~ λ / (N·d)   — wider with fewer elements
//  λ in steel (longitudinal): λ = c/f, c ≈ 5.9 mm/μs
//  N elements, isotropic, simple line-array, no apodisation, no steering.
// ═══════════════════════════════════════════════════
function drawGratingScan(ctx) {
  // Array sits at top centre of canvas; beams radiate downward into a quarter-plane.
  var cx = CW * 0.5;
  var topY = CH * 0.13;
  var bottomY = CH * 0.95;
  var planeH = bottomY - topY;

  // Background quarter-plane (test piece)
  var grad = ctx.createLinearGradient(0, topY, 0, bottomY);
  grad.addColorStop(0,'#1a2230'); grad.addColorStop(1,'#0d1320');
  ctx.fillStyle = grad;
  ctx.fillRect(MAT_X, topY, MAT_W, planeH);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  ctx.strokeRect(MAT_X, topY, MAT_W, planeH);

  // Polar-style angle grid every 15°
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 0.5;
  var maxR = Math.min(planeH * 0.96, MAT_W * 0.48);
  for (var a = -75; a <= 75; a += 15) {
    var rad = a * Math.PI / 180;
    var ex = cx + maxR * Math.sin(rad);
    var ey = topY + maxR * Math.cos(rad);
    ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.font = '8px JetBrains Mono,monospace';
    ctx.textAlign = a < 0 ? 'right' : (a > 0 ? 'left' : 'center');
    ctx.fillText(a+'°', ex + (a<0?-2:a>0?2:0), ey + (a===0?-2:8));
  }
  // arcs (range rings)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for (var rr = 0.25; rr < 1.01; rr += 0.25) {
    ctx.beginPath();
    ctx.arc(cx, topY, maxR*rr, 0, Math.PI);
    ctx.stroke();
  }

  // Physics
  var lambda = materialC / freq;       // v53 §49 AT — was hardcoded 5.9 (steel)
  var dOverL = pitchMm / lambda;
  var maxOrder = Math.floor(dOverL);

  // ── Main lobe (m = 0) — green Glow, downward
  // Width inversely proportional to N (more elements → narrower main lobe)
  var mainHalfWidthDeg = Math.max(2.0, 30 / nElements);
  drawLobe(ctx, cx, topY, maxR, 0, mainHalfWidthDeg, '#3fb950', 1.0);

  // ── Grating lobes (m = ±1 .. ±maxOrder) — red Glow, each pair side-symmetric
  for (var m = 1; m <= maxOrder; m++) {
    var sinTheta = m * lambda / pitchMm;
    if (Math.abs(sinTheta) > 1) break;
    var thetaDeg = Math.asin(sinTheta) * 180 / Math.PI;
    // amplitude drops with order (rough envelope); colour fades
    var amp = Math.max(0.35, 1 - m * 0.18);
    var halfW = Math.max(2.0, 30 / nElements);
    drawLobe(ctx, cx, topY, maxR, +thetaDeg, halfW, '#f85149', amp);
    drawLobe(ctx, cx, topY, maxR, -thetaDeg, halfW, '#f85149', amp);
    // label
    ctx.fillStyle = 'rgba(248,81,73,0.85)';
    ctx.font = 'bold 9px JetBrains Mono,monospace';
    ctx.textAlign = 'center';
    var lx = cx + maxR * 0.55 * Math.sin(thetaDeg*Math.PI/180);
    var ly = topY + maxR * 0.55 * Math.cos(thetaDeg*Math.PI/180);
    ctx.fillText('m=+'+m+' ('+thetaDeg.toFixed(0)+'°)', lx, ly);
    var lx2 = cx + maxR * 0.55 * Math.sin(-thetaDeg*Math.PI/180);
    ctx.fillText('m=-'+m+' (-'+thetaDeg.toFixed(0)+'°)', lx2, ly);
  }

  // ── PAUT array: N elements centred on cx at the top
  var arrayWidth = (nElements - 1) * pitchMm * (MAT_W / 60); // visual scale: 60mm spans MAT_W
  arrayWidth = Math.min(arrayWidth, MAT_W * 0.55);
  var elW = Math.max(3, arrayWidth / nElements * 0.7);
  var elH = Math.max(8, CH * 0.05);
  for (var i = 0; i < nElements; i++) {
    var ex2 = cx - arrayWidth/2 + (i + 0.5) * (arrayWidth / nElements);
    ctx.fillStyle = '#bc8cff';
    ctx.fillRect(ex2 - elW/2, topY - elH, elW, elH);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(ex2 - elW/2, topY - elH, elW, elH);
  }
  // array baseline
  ctx.strokeStyle = '#bc8cff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - arrayWidth/2 - 4, topY);
  ctx.lineTo(cx + arrayWidth/2 + 4, topY);
  ctx.stroke();

  // Title overlay
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 11px JetBrains Mono,monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PAUT BEAM PATTERN', MAT_X + 8, topY - elH - 6);
  ctx.font = '9px JetBrains Mono,monospace';
  ctx.fillStyle = 'rgba(63,185,80,0.9)';
  ctx.fillText('● MAIN (m=0)', MAT_X + 8, CH - 18);
  ctx.fillStyle = 'rgba(248,81,73,0.9)';
  ctx.fillText('● GRATING (|m|≥1)', MAT_X + 100, CH - 18);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('d/λ = '+dOverL.toFixed(2)+'  |  '+(maxOrder===0?'NO grating lobes':maxOrder+' order(s) → '+(2*maxOrder)+' lobes'),
               MAT_X + 8, CH - 4);
}

function drawLobe(ctx, cx, cy, R, centreDeg, halfWidthDeg, color, intensity) {
  // Draw a fan-shaped lobe with radial Glow gradient.
  var c = centreDeg * Math.PI / 180;
  var hw = halfWidthDeg * Math.PI / 180;
  // Convert from "0° = down" to canvas angles (0° = +x, sweeping clockwise = +y).
  // Down corresponds to angle = π/2 in standard math frame; here we project as sin/cos.
  var grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, R);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color + (intensity > 0.7 ? 'cc' : '88'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.globalAlpha = intensity;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  // Sample fan boundary
  var steps = 12;
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    var ang = c - hw + 2 * hw * t;
    var x = cx + R * Math.sin(ang);
    var y = cy + R * Math.cos(ang);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;
  // crisp centre line
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R*0.96*Math.sin(c), cy + R*0.96*Math.cos(c));
  ctx.stroke();
}

function drawGratingAscan(ctx, W, H) {
  // v53 §49 AT — wavelength uses materialC
  // A-scan canvas is repurposed as "Angular Intensity Pattern" |Ψ(θ)| vs θ.
  // Array factor:   |AF(θ)| = |sin(Nπd sinθ / λ) / (N sin(πd sinθ / λ))|
  // Plot 20·log10(AF) clipped to [-40, 0] dB across θ ∈ [-90°, +90°].
  ctx.fillStyle = '#080c12'; ctx.fillRect(0, 0, W, H);
  // grid
  ctx.strokeStyle = 'rgba(63,185,80,0.06)'; ctx.lineWidth = 0.5;
  for (var c = 0; c <= 12; c++) {
    var gx = c/12*W;
    ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
  }
  for (var r = 0; r <= 4; r++) {
    var gy = r/4*H;
    ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
  }
  // axes labels
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.font = '8px JetBrains Mono,monospace';
  ctx.textAlign = 'center';
  for (var a = -90; a <= 90; a += 30) {
    var x = W * (a + 90) / 180;
    ctx.fillText(a+'°', x, H - 2);
  }
  ctx.textAlign = 'left';
  ctx.fillText('0 dB',  2, 10);
  ctx.fillText('-20 dB', 2, H/2 + 4);
  ctx.fillText('-40 dB', 2, H - 14);

  // Compute and plot the array factor
  var lambda = materialC / freq;  // v53 §49 AT
  ctx.strokeStyle = '#3fb950';
  ctx.lineWidth = 1.4;
  ctx.shadowColor = 'rgba(63,185,80,0.55)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  var firstPoint = true;
  for (var px = 0; px <= W; px++) {
    var theta = (px / W - 0.5) * Math.PI; // -π/2 .. +π/2
    var phi = Math.PI * pitchMm * Math.sin(theta) / lambda;
    var af;
    if (Math.abs(Math.sin(phi)) < 1e-7) {
      af = 1.0;   // limit at sin(φ)=0
    } else {
      af = Math.abs(Math.sin(nElements * phi) / (nElements * Math.sin(phi)));
    }
    var dB = 20 * Math.log10(Math.max(af, 1e-5));
    // map dB ∈ [-40, 0] → y ∈ [H-2, 2]
    var y = (1 - (dB + 40) / 40) * (H - 4) + 2;
    if (firstPoint) { ctx.moveTo(px, y); firstPoint = false; }
    else { ctx.lineTo(px, y); }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Highlight grating-lobe angles with red vertical lines
  var maxOrder = Math.floor(pitchMm / lambda);
  ctx.strokeStyle = 'rgba(248,81,73,0.85)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3,3]);
  for (var m = 1; m <= maxOrder; m++) {
    var sinT = m * lambda / pitchMm;
    if (Math.abs(sinT) > 1) break;
    var tDeg = Math.asin(sinT) * 180 / Math.PI;
    [+tDeg, -tDeg].forEach(function(deg){
      var xL = W * (deg + 90) / 180;
      ctx.beginPath(); ctx.moveTo(xL, 0); ctx.lineTo(xL, H); ctx.stroke();
    });
  }
  ctx.setLineDash([]);

  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = 'bold 9px JetBrains Mono,monospace';
  ctx.textAlign = 'left';
  ctx.fillText('|AF(θ)| — ARRAY FACTOR (dB)', 4, 22);
}


function descHtmlGrating(env){ var META=env.META, DETAILS=env.DETAILS, DISCL=env.DISCL;
  return '<strong>EX 04 · PAUT Grating Lobes</strong>'+
      META+
      '<ol>'+
        '<li>Slide <b>ELEMENT PITCH</b> from small to large — watch when grating lobes (red) appear</li>'+
        '<li>Observe: <code>d/λ ≤ 0.5</code> gives only the main lobe (green) — textbook PAUT design target</li>'+
        '<li>Increase <b>N ELEMENTS</b> — main lobe <b>narrows</b>, directivity sharpens</li>'+
      '</ol>'+
      DETAILS(
        '<b>Bragg condition:</b> sinθ = m·λ/d — grating lobes appear at integer multiples once d/λ &gt; 0.5.<br>'+
        '<b>Design target:</b> pitch d ≤ λ/2 keeps only the main lobe (m = 0) and avoids ambiguous echoes from side angles.<br>'+
        '<b>Why N matters:</b> main-lobe full-width ≈ λ/(N·d). More elements → sharper directivity, but cost and complexity scale up.'
      );
}

Exercises.register('grating',     { num:'EX04', name:'Grating',     group:'core', btnId:'btn-grating', activeClass:'active-grating',
  drawScene:function(ctx){ drawGratingScan(ctx); },
  drawAscan:function(ctx,W,H){ drawGratingAscan(ctx,W,H); }, descHtml:function(env){ return descHtmlGrating(env); }, getSignal:null });
