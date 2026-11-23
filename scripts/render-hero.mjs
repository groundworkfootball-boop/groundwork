#!/usr/bin/env node
/**
 * Renders the GROUNDWORK hero background.
 *
 * A cinematic night stadium viewed from behind the goal at pitch level:
 *
 *   sky, stars, floodlight masts
 *   tiered stands + crowd speckle
 *   roof rim light
 *   advertising hoardings
 *   horizon
 *   perspective pitch + painted markings
 *   goal net foreground
 *
 * Everything static is rendered once into a base buffer; each frame only adds
 * drifting dust, a slow lighting breath and film grain. That keeps the render
 * fast while still producing real motion.
 *
 * Outputs:
 *   public/media/hero.mp4        1920x1080, 24fps, 8s seamless loop
 *   public/media/hero-poster.jpg static poster frame
 *
 * Requires ffmpeg on PATH. No npm dependencies.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import zlib from 'node:zlib';
import { resolve } from 'node:path';

const OUT_W = 1920;
const OUT_H = 1080;
const SS = 1.5; // supersample factor for the base render
const W = Math.round(OUT_W * SS);
const H = Math.round(OUT_H * SS);
const FPS = 24;
const DURATION = 8;
const FRAMES = FPS * DURATION;

const HORIZON = Math.round(H * 0.442);
const STANDS_TOP = Math.round(H * 0.145);
const CAM_H = 1.75;
const FOCAL = 1.05 * W;
const PITCH_HALF_W = 34;

const BRAND = [182, 255, 26];

/* ── Deterministic RNG ─────────────────────────────────────────────── */
function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a + (b - a) * t;
const sfc = (v) => Math.round(v);

/* ── Precomputed depth tables ──────────────────────────────────────── */
const rowZ = new Float32Array(H);
const rowFog = new Float32Array(H);
const rowLight = new Float32Array(H);
for (let y = 0; y < H; y += 1) {
  const d = y - HORIZON;
  if (d > 0) {
    const z = (CAM_H * FOCAL) / d;
    rowZ[y] = z;
    rowFog[y] = Math.pow(clamp01(1 - d / (H * 0.34)), 2.1);
    rowLight[y] = 1 / (1 + z * 0.052);
  } else {
    rowZ[y] = 1e6;
    rowFog[y] = 0;
    rowLight[y] = 0;
  }
}

const vignette = new Float32Array(W * H);
for (let y = 0; y < H; y += 1) {
  const ny = (y / H - 0.54) * 2;
  for (let x = 0; x < W; x += 1) {
    const nx = (x / W - 0.5) * 2;
    const r = Math.sqrt(nx * nx * 1.02 + ny * ny * 0.86);
    vignette[y * W + x] = Math.max(0.2, 1 - Math.pow(Math.min(1, r) * 0.74, 1.7));
  }
}

/* Crowd speckle table. */
const CROWD_ROWS = 220;
const crowd = new Uint8Array(W * CROWD_ROWS);
{
  const rng = makeRng(0x51ee7);
  for (let i = 0; i < crowd.length; i += 1) {
    const r = rng();
    crowd[i] = r < 0.012 ? 210 : r < 0.05 ? 110 + ((rng() * 90) | 0) : r < 0.1 ? 55 : 0;
  }
}

/* Dust motes. */
const DUST = 170;
const dust = new Float32Array(DUST * 5);
{
  const rng = makeRng(0x9a3d11);
  for (let i = 0; i < DUST; i += 1) {
    dust[i * 5] = rng();
    dust[i * 5 + 1] = rng();
    dust[i * 5 + 2] = 0.18 + rng() * 0.6;
    dust[i * 5 + 3] = rng() * Math.PI * 2;
    dust[i * 5 + 4] = 0.35 + rng() * 0.65;
  }
}

/* Floodlight masts. */
const MASTS = [
  { x: 0.115, y: 0.10, scale: 1.0, power: 1.0 },
  { x: 0.375, y: 0.035, scale: 0.82, power: 0.78 },
  { x: 0.625, y: 0.035, scale: 0.82, power: 0.78 },
  { x: 0.885, y: 0.10, scale: 1.0, power: 1.0 },
];

/* ── Base buffer ───────────────────────────────────────────────────── */
const base = new Float32Array(W * H * 3);

function addPixel(x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  base[i] += r;
  base[i + 1] += g;
  base[i + 2] += b;
}

function fillRect(x0, y0, x1, y1, r, g, b) {
  const ax = Math.max(0, Math.floor(x0));
  const bx = Math.min(W - 1, Math.ceil(x1));
  const ay = Math.max(0, Math.floor(y0));
  const by = Math.min(H - 1, Math.ceil(y1));
  for (let y = ay; y <= by; y += 1) {
    for (let x = ax; x <= bx; x += 1) {
      const i = (y * W + x) * 3;
      base[i] += r;
      base[i + 1] += g;
      base[i + 2] += b;
    }
  }
}

/* ── Sky ───────────────────────────────────────────────────────────── */
function drawSky() {
  const rng = makeRng(0xc0ffee);

  for (let y = 0; y < STANDS_TOP; y += 1) {
    const k = y / STANDS_TOP;
    const r = mix(4, 17, Math.pow(k, 1.6));
    const g = mix(7, 27, Math.pow(k, 1.6));
    const b = mix(14, 43, Math.pow(k, 1.5));
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 3;
      base[i] = r;
      base[i + 1] = g;
      base[i + 2] = b;
    }
  }

  for (let s = 0; s < 950; s += 1) {
    const x = (rng() * W) | 0;
    const y = (Math.pow(rng(), 1.35) * STANDS_TOP * 0.96) | 0;
    const bright = 0.18 + rng() * 0.55;
    const tint = rng();
    addPixel(x, y, 120 * bright * (0.7 + tint * 0.3), 132 * bright, 150 * bright * (1.05 - tint * 0.2));
    if (bright > 0.62) {
      addPixel(x + 1, y, 48 * bright, 52 * bright, 60 * bright);
      addPixel(x, y + 1, 40 * bright, 45 * bright, 52 * bright);
    }
  }
}

/* ── Stands + crowd ────────────────────────────────────────────────── */
function drawStands() {
  const standH = HORIZON - STANDS_TOP;

  for (let y = STANDS_TOP; y < HORIZON; y += 1) {
    const t = (y - STANDS_TOP) / standH;
    const roofShade = t < 0.09 ? 0.22 + (t / 0.09) * 0.42 : 1;
    const tierLight = 0.5 + Math.pow(t, 1.25) * 1.5;
    const r = 7 * tierLight * roofShade;
    const g = 11 * tierLight * roofShade;
    const b = 18 * tierLight * roofShade;
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 3;
      base[i] = r;
      base[i + 1] = g;
      base[i + 2] = b;
    }
  }

  // Tier separators.
  const tiers = 4;
  for (let tier = 1; tier < tiers; tier += 1) {
    const top = STANDS_TOP + (standH / tiers) * tier;
    fillRect(0, top, W, top + standH * 0.011, 3, 5, 9);
  }

  // Crowd speckle rows.
  for (let row = 0; row < CROWD_ROWS; row += 1) {
    const y = STANDS_TOP + Math.round((row / CROWD_ROWS) * (standH - 2));
    if (y < STANDS_TOP || y >= HORIZON) continue;
    const t = (y - STANDS_TOP) / standH;
    const light = (0.35 + Math.pow(t, 1.3) * 1.15) * 0.6;
    const rowOffset = (row * 37) % W;
    for (let x = 0; x < W; x += 1) {
      const v = crowd[row * W + ((x + rowOffset) % W)];
      if (v === 0) continue;
      const a = (v / 255) * light;
      const i = (y * W + x) * 3;
      base[i] += 62 * a;
      base[i + 1] += 74 * a;
      base[i + 2] += 90 * a;
    }
  }

  // Roof rim light.
  for (let x = 0; x < W; x += 1) {
    const edge = 0.35 + 0.65 * Math.pow(Math.sin((x / W) * Math.PI), 0.6);
    for (let d = 0; d < 5; d += 1) {
      const a = (1 - d / 5) * 0.6 * edge;
      addPixel(x, STANDS_TOP - d, 26 * a, 34 * a, 42 * a);
      addPixel(x, STANDS_TOP + d, 15 * a, 20 * a, 25 * a);
    }
  }

  // Tunnel / stair breaks in the stand.
  for (const gx of [0.06, 0.28, 0.53, 0.77, 0.94]) {
    const cx = gx * W;
    const wdt = W * 0.012;
    for (let y = STANDS_TOP; y < HORIZON; y += 1) {
      const t = (y - STANDS_TOP) / standH;
      const a = 0.5 * (0.4 + t * 0.6);
      for (let x = Math.floor(cx - wdt); x < cx + wdt; x += 1) {
        const i = (y * W + x) * 3;
        base[i] *= 1 - a * 0.7;
        base[i + 1] *= 1 - a * 0.7;
        base[i + 2] *= 1 - a * 0.7;
      }
    }
  }
}

/* ── Advertising hoardings ─────────────────────────────────────────── */
function drawHoardings() {
  const top = HORIZON - Math.round(H * 0.034);
  const bottom = HORIZON - Math.round(H * 0.003);
  const hgt = bottom - top;
  const panelW = W / 14;

  for (let x = 0; x < W; x += 1) {
    const panel = Math.floor(x / panelW);
    const inPanel = (x % panelW) / panelW;
    const seam = inPanel < 0.012 || inPanel > 0.988 ? 0.35 : 1;

    let r = 9;
    let g = 13;
    let b = 19;

    if (panel % 3 === 1) {
      const glow = 0.3 + 0.16 * Math.sin((x / W) * 22);
      r += BRAND[0] * glow * 0.36;
      g += BRAND[1] * glow * 0.36;
      b += BRAND[2] * glow * 0.36;
    }

    for (let y = top; y < bottom; y += 1) {
      const t = (y - top) / hgt;
      const shade = (0.55 + (1 - t) * 0.55) * seam;
      const i = (y * W + x) * 3;
      base[i] = r * shade;
      base[i + 1] = g * shade;
      base[i + 2] = b * shade;
    }
  }

  for (let x = 0; x < W; x += 1) {
    addPixel(x, top - 1, 11, 15, 17);
    addPixel(x, top - 2, 5, 7, 8);
  }
}

/* ── Pitch ─────────────────────────────────────────────────────────── */
function drawPitch() {
  const centreX = W / 2;
  const sixYard = 5.5;
  const penaltySpot = 11;
  const boxDepth = 16.5;
  const halfway = 52.5;

  for (let y = HORIZON; y < H; y += 1) {
    const z = rowZ[y];
    const fog = rowFog[y];
    const light = rowLight[y];
    const pxPerM = FOCAL / z;
    const halfWpx = (PITCH_HALF_W * FOCAL) / z;
    const band = Math.floor(z / 5.2) % 2;

    for (let x = 0; x < W; x += 1) {
      const dx = x - centreX;
      const worldX = (dx * z) / FOCAL;

      let r;
      let g;
      let b;

      if (Math.abs(dx) > halfWpx) {
        const over = (Math.abs(dx) - halfWpx) / Math.max(1, halfWpx);
        const fade = Math.max(0, 1 - over * 3.2);
        r = 5 + fade * 4;
        g = 7 + fade * 6;
        b = 11 + fade * 9;
      } else {
        r = band ? 15 : 19;
        g = band ? 47 : 57;
        b = band ? 32 : 38;

        const poolA = 1 / (Math.pow(worldX - 24, 2) * 0.006 + Math.pow(z - 30, 2) * 0.010 + 1);
        const poolB = 1 / (Math.pow(worldX + 24, 2) * 0.006 + Math.pow(z - 30, 2) * 0.010 + 1);
        const poolC = 1 / (Math.pow(worldX, 2) * 0.004 + Math.pow(z - 12, 2) * 0.016 + 1);
        const lit = Math.min(2.4, 0.5 + poolA * 1.05 + poolB * 1.05 + poolC * 0.9) * (0.35 + light * 0.9);

        r = r * lit + 3;
        g = g * lit + 5;
        b = b * lit + 2;

        let painted = 0;
                const ax = Math.abs(worldX);

                // Parallel markings (penalty area, halfway). The goal line and six-yard
                // line sit behind the camera in this behind-the-goal framing.
                const parallel = [
                  [boxDepth, 20.16],
                  [halfway, PITCH_HALF_W],
                ];
                for (let m = 0; m < parallel.length; m += 1) {
                  const [depth, halfSpan] = parallel[m];
                  if (Math.abs(z - depth) < 0.2 && ax < halfSpan) painted = 1;
                }

                // Perpendicular box sides.
                if (z > 0.95 && z <= boxDepth && Math.abs(ax - 20.16) < 0.13) painted = 1;

                // Touchlines.
                if (ax > PITCH_HALF_W - 0.13 && ax < PITCH_HALF_W + 0.13) painted = 1;

                // Penalty spot.
                const sdz = z - penaltySpot;
                if (worldX * worldX + sdz * sdz < 0.012) painted = 1;

                // Centre circle.
                const ccz = z - halfway;
                const ccDist = Math.sqrt(worldX * worldX + ccz * ccz);
                if (Math.abs(ccDist - 9.15) < 0.16) painted = 1;

                if (painted > 0) {
                  const a = 0.58 * (0.25 + light * 1.0);
                  r += (206 - r) * a;
                  g += (224 - g) * a;
                  b += (214 - b) * a;
                }
              }

              // Near-field falloff keeps the hero legible under UI overlays.
              const near = clamp01((y - HORIZON) / (H - HORIZON));
              const darken = 1 - Math.pow(near, 2.4) * 0.72;
              r *= darken;
              g *= darken;
              b *= darken;

              // Distance haze only near the horizon.
              const f = fog * 0.8;
      r = r * (1 - f) + 19 * f;
      g = g * (1 - f) + 30 * f;
      b = b * (1 - f) + 45 * f;

      const v = vignette[y * W + x];
      const i = (y * W + x) * 3;
      base[i] = r * v;
      base[i + 1] = g * v;
      base[i + 2] = b * v;
    }
  }
}

/* ── Goal net foreground ───────────────────────────────────────────── */
function drawGoalNet() {
  const postW = Math.max(4, W * 0.0042);
  const leftX = W * 0.075;
  const rightX = W * 0.925;
  const crossbarY = H * 0.115;

  for (let y = Math.round(crossbarY); y < H; y += 1) {
    const t = (y - crossbarY) / (H - crossbarY);
    const shade = 0.16 + t * 0.24;
    for (let dx = 0; dx < postW; dx += 1) {
      addPixel(Math.round(leftX) + dx, y, 28 * shade, 34 * shade, 40 * shade);
      addPixel(Math.round(rightX) - dx, y, 24 * shade, 30 * shade, 36 * shade);
    }
  }

  for (let x = Math.round(leftX); x <= rightX; x += 1) {
    for (let dy = 0; dy < postW; dy += 1) {
      addPixel(x, Math.round(crossbarY) + dy, 21, 26, 31);
    }
  }

  const spacing = Math.max(10, W * 0.017);
  for (let d = -H; d < W + H; d += spacing) {
    for (let y = Math.round(crossbarY); y < H; y += 1) {
      const fadeN = 1 - (y - crossbarY) / (H - crossbarY);

      const x1 = d + (y - crossbarY) * 0.42;
      if (x1 > leftX && x1 < rightX) {
        const a = 0.06 * fadeN;
        addPixel(Math.round(x1), y, 92 * a, 102 * a, 110 * a);
      }

      const x2 = d - (y - crossbarY) * 0.42;
      if (x2 > leftX && x2 < rightX) {
        const a = 0.05 * fadeN;
        addPixel(Math.round(x2), y, 82 * a, 92 * a, 100 * a);
      }
    }
  }
}

/* ── Floodlight masts ──────────────────────────────────────────────── */
function drawMasts() {
  for (let mi = 0; mi < MASTS.length; mi += 1) {
    const mast = MASTS[mi];
    const cx = mast.x * W;
    const cy = mast.y * H;
    const scale = mast.scale;
    const headW = W * 0.05 * scale;
    const headH = H * 0.036 * scale;

    const mastBottom = STANDS_TOP + H * 0.035;
    const mastWidth = Math.max(3, W * 0.0038 * scale);
    for (let y = Math.round(cy); y < mastBottom; y += 1) {
      const t = (y - cy) / (mastBottom - cy);
      const w = mastWidth * (0.5 + t * 0.9);
      const shade = 0.4 + t * 0.25;
      for (let dx = -w; dx <= w; dx += 1) {
        addPixel(Math.round(cx + dx), y, 20 * shade, 25 * shade, 31 * shade);
      }
      if (y % Math.max(6, Math.round(10 * scale)) === 0) {
        for (let dx = -w; dx <= w; dx += 1) addPixel(Math.round(cx + dx), y, 10, 13, 17);
      }
    }

    const hx0 = cx - headW / 2;
    const hy0 = cy - headH / 2;
    fillRect(hx0 - 4, hy0 - 4, hx0 + headW + 4, hy0 + headH + 4, 5, 7, 9);

    const cols = 4;
    const rows = 2;
    const cellW = headW / cols;
    const cellH = headH / rows;
    for (let ry = 0; ry < rows; ry += 1) {
      for (let rx = 0; rx < cols; rx += 1) {
        const lx = hx0 + cellW * (rx + 0.22);
        const ly = hy0 + cellH * (ry + 0.22);
        fillRect(lx, ly, lx + cellW * 0.56, ly + cellH * 0.56, 180 * mast.power, 196 * mast.power, 208 * mast.power);
      }
    }

    // Bloom.
    const bloomR = headW * 1.5;
    for (let by = Math.floor(hy0 - bloomR); by <= hy0 + headH + bloomR; by += 1) {
      if (by < 0 || by >= H) continue;
      for (let bx = Math.floor(hx0 - bloomR); bx <= hx0 + headW + bloomR; bx += 1) {
        if (bx < 0 || bx >= W) continue;
        const dxn = (bx - (hx0 + headW / 2)) / bloomR;
        const dyn = (by - (hy0 + headH / 2)) / (bloomR * 0.72);
        const d2 = dxn * dxn + dyn * dyn;
        if (d2 > 1) continue;
        const fall = Math.pow(1 - d2, 3.4);
        addPixel(bx, by, 150 * fall * mast.power, 168 * fall * mast.power, 176 * fall * mast.power);
      }
    }

    // Volumetric cone.
    const coneLen = H * 0.5;
    const coneSpread = 0.145;
    for (let y = Math.round(cy); y < cy + coneLen; y += 1) {
      const dy = y - cy;
      const fall = Math.pow(clamp01(1 - dy / coneLen), 2.0);
      if (fall <= 0.002) continue;
      const halfW = dy * coneSpread + headW * 0.3;
      for (let dx = -halfW; dx <= halfW; dx += 1) {
        const edge = 1 - Math.abs(dx) / halfW;
        const a = edge * edge * edge * fall * 0.115 * mast.power;
        addPixel(Math.round(cx + dx), y, a * 84, a * 108, a * 100);
      }
    }

    // Anamorphic streak.
    const bandH = Math.max(2, Math.round(4 * scale));
    for (let dy = -bandH; dy <= bandH; dy += 1) {
      const y = Math.round(cy + dy);
      if (y < 0 || y >= H) continue;
      const strength = (1 - Math.abs(dy) / (bandH + 0.5)) * 0.42 * mast.power;
      for (let x = 0; x < W; x += 1) {
        const d = Math.abs(x - cx);
        const fall = Math.max(0, 1 - d / (W * 0.26));
        if (fall <= 0) continue;
        const a = fall * fall * strength;
        addPixel(x, y, a * 120, a * 150, a * 128);
      }
    }
  }
}

/* ── Static render ─────────────────────────────────────────────────── */
console.log('[hero] rendering static stadium base…');
const staticStart = Date.now();
drawSky();
drawStands();
drawHoardings();
drawPitch();
drawGoalNet();
drawMasts();
console.log(`[hero] base done in ${((Date.now() - staticStart) / 1000).toFixed(1)}s`);

/* ── Per-frame compositing ─────────────────────────────────────────── */
const frame = new Uint8Array(W * H * 3);

function renderFrame(t) {
  const phase = (t / DURATION) * Math.PI * 2;
  const breath = 1 + Math.sin(phase) * 0.02;

  for (let i = 0; i < base.length; i += 1) {
    const v = base[i] * breath;
    frame[i] = v > 255 ? 255 : v < 0 ? 0 : v;
  }

  for (let d = 0; d < DUST; d += 1) {
    const bx = dust[d * 5];
    const by = dust[d * 5 + 1];
    const speed = dust[d * 5 + 2];
    const phaseD = dust[d * 5 + 3];
    const bright = dust[d * 5 + 4];

    const x = Math.round(bx * W + Math.sin(phase * 0.54 + phaseD) * W * 0.02);
    const yRaw = by * H - ((t * speed * 26) % (H * 0.5));
    const y = Math.round(((yRaw % H) + H) % H);

    if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) continue;

    const lum = (frame[(y * W + x) * 3] + frame[(y * W + x) * 3 + 1] + frame[(y * W + x) * 3 + 2]) / 765;
    const pulse = 0.45 + 0.55 * Math.sin(phase * 1.4 + phaseD * 2);
    const a = bright * pulse * (0.1 + lum * 0.55) * 0.6;

    for (let oy = -1; oy <= 1; oy += 1) {
      for (let ox = -1; ox <= 1; ox += 1) {
        const w = oy === 0 && ox === 0 ? 1 : 0.28;
        const j = ((y + oy) * W + (x + ox)) * 3;
        frame[j] = Math.min(255, frame[j] + a * w * 120);
        frame[j + 1] = Math.min(255, frame[j + 1] + a * w * 138);
        frame[j + 2] = Math.min(255, frame[j + 2] + a * w * 118);
      }
    }
  }

  const rng = makeRng(((t * 1000) | 0) + 977);
  for (let n = 0; n < W * 26; n += 1) {
    const idx = ((rng() * W * H) | 0) * 3;
    const grain = (rng() - 0.5) * 7;
    frame[idx] = Math.max(0, Math.min(255, frame[idx] + grain));
    frame[idx + 1] = Math.max(0, Math.min(255, frame[idx + 1] + grain));
    frame[idx + 2] = Math.max(0, Math.min(255, frame[idx + 2] + grain));
  }
}

/* ── Encode ────────────────────────────────────────────────────────── */
const mediaDir = resolve(process.cwd(), 'public/media');
mkdirSync(mediaDir, { recursive: true });

const ffmpeg = spawn(
  'ffmpeg',
  [
    '-y', '-v', 'error',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-s', `${W}x${H}`,
    '-r', String(FPS),
    '-i', '-',
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '21',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    resolve(mediaDir, 'hero.mp4'),
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);

const writeFrame = (buf) =>
  new Promise((res, rej) => {
    const ok = ffmpeg.stdin.write(buf, (err) => (err ? rej(err) : res()));
    if (!ok) ffmpeg.stdin.once('drain', res);
  });

console.log(`[hero] encoding ${FRAMES} frames → ${OUT_W}x${OUT_H}`);
const encodeStart = Date.now();

(async () => {
  for (let f = 0; f < FRAMES; f += 1) {
    renderFrame((f / FPS) % DURATION);
    await writeFrame(Buffer.from(frame));
    if (f % 24 === 0) process.stdout.write(`\r[hero] ${Math.round((f / FRAMES) * 100)}%`);
  }
  ffmpeg.stdin.end();
  await new Promise((res) => ffmpeg.on('close', res));
  console.log(`\n[hero] video done in ${((Date.now() - encodeStart) / 1000).toFixed(1)}s`);

  renderFrame(2.6);
  const posterPng = resolve(mediaDir, 'hero-poster.png');
  writeFileSync(posterPng, pngFromRgb(frame, W, H));
  await new Promise((res, rej) => {
    const p = spawn(
      'ffmpeg',
      ['-y', '-v', 'error', '-i', posterPng, '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`, '-q:v', '3', resolve(mediaDir, 'hero-poster.jpg')],
      { stdio: 'inherit' },
    );
    p.on('close', (code) => (code === 0 ? res() : rej(new Error(`poster exit ${code}`))));
  });
  unlinkSync(posterPng);
  console.log('[hero] poster done');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

/* ── Dependency-free PNG encoder ───────────────────────────────────── */
function pngFromRgb(rgb, width, height) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i += 1) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };

  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 8 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}