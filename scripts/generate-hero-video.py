#!/usr/bin/env python3
"""Renders the GROUNDWORK cinematic hero background.

Produces an original, procedurally generated stadium-at-night scene:
perspective pitch, floodlight glows, volumetric beams, drifting dust,
vignette and film grain. The animation is periodic so the clip loops
seamlessly.

Outputs:
  public/media/hero.mp4        1920x1080, 24fps, 8s seamless loop
  public/media/hero-poster.jpg static poster frame

Requires: numpy, pillow, ffmpeg on PATH.
"""

from __future__ import annotations

import math
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT_W, OUT_H = 1920, 1080
SS = 1.5
W, H = int(OUT_W * SS), int(OUT_H * SS)
FPS = 24
DUR = 8.0
N = int(FPS * DUR)

HORIZON = 0.455 * H
FOCAL = 1.18 * W
CAM_H = 1.75
HALF_W = 34.0

FOG = np.array([18, 30, 46], np.float32)
GREEN_A = np.array([46, 132, 82], np.float32)
GREEN_B = np.array([58, 158, 98], np.float32)
SURROUND = np.array([8, 13, 21], np.float32)
SKY_TOP = np.array([7, 14, 26], np.float32)
SKY_LOW = np.array([26, 44, 68], np.float32)
LINE = np.array([236, 244, 250], np.float32)
BRAND = np.array([204, 255, 0], np.float32)

ys = np.arange(H, dtype=np.float32)
xs = np.arange(W, dtype=np.float32)

_dz = np.maximum(ys - HORIZON, 1.0)
z_row = np.where(ys > HORIZON, CAM_H * FOCAL / _dz, 1e6).astype(np.float32)
half_px = (HALF_W * FOCAL / z_row).astype(np.float32)

yy, xx = np.mgrid[0:H, 0:W]
xx = xx.astype(np.float32)
yy = yy.astype(np.float32)

_nx = (xx - W / 2) / (W / 2)
_ny = (yy - H / 2) / (H / 2)
VIGNETTE = np.clip(1.0 - 0.20 * (_nx**2 * 0.72 + _ny**2 * 0.95), 0.68, 1.0)[..., None].astype(np.float32)
del _nx, _ny

# Floodlight rig: (x, y, phase, tint)
LIGHTS = [
    (W * 0.10, H * 0.055, 0.00, np.array([255, 246, 226], np.float32)),
    (W * 0.34, H * 0.020, 0.35, np.array([255, 250, 236], np.float32)),
    (W * 0.66, H * 0.020, 0.70, np.array([255, 250, 236], np.float32)),
    (W * 0.90, H * 0.055, 0.15, np.array([236, 255, 214], np.float32)),
]

rng = np.random.default_rng(20261020)
P_COUNT = 260
P_X = rng.uniform(0, W, P_COUNT).astype(np.float32)
P_Y = rng.uniform(0, H, P_COUNT).astype(np.float32)
P_R = rng.uniform(0.6, 2.4, P_COUNT).astype(np.float32) * SS
P_A = rng.uniform(0.05, 0.30, P_COUNT).astype(np.float32)


def project(xm: float, zm: float, cx: float) -> tuple[float, float]:
    return cx + xm * FOCAL / zm, HORIZON + CAM_H * FOCAL / zm


def render(t: float) -> np.ndarray:
    cx = W / 2 + 16 * SS * math.sin(2 * math.pi * t)

    # ---- sky -------------------------------------------------------------
    sky_t = np.clip(ys / HORIZON, 0, 1)[:, None]
    sky = SKY_TOP[None, :] * (1 - sky_t) + SKY_LOW[None, :] * sky_t
    img = np.repeat(sky[:, None, :], W, axis=1)

    # ---- pitch -----------------------------------------------------------
    stripe = (np.floor(z_row / 5.25) % 2).astype(np.float32)
    base = GREEN_A[None, :] * (1 - stripe[:, None]) + GREEN_B[None, :] * stripe[:, None]
    shade = np.clip(1.55 - (z_row - 6) / 130.0, 0.55, 1.30)[:, None]
    base = base * shade

    fogf = np.clip((z_row - 45) / 110.0, 0, 0.82)[:, None]
    base = base * (1 - fogf) + FOG[None, :] * fogf

    sur = SURROUND[None, :] * np.clip(1.0 - (z_row - 6) / 220.0, 0.35, 1.0)[:, None]
    sur = sur * (1 - fogf) + FOG[None, :] * fogf

    on_pitch = (np.abs(xs[None, :] - cx) <= half_px[:, None]) & (ys[:, None] > HORIZON)
    ground = np.where(on_pitch[..., None], base[:, None, :], sur[:, None, :])
    img = np.where((ys[:, None] > HORIZON)[..., None], ground, img)

    # ---- pitch markings --------------------------------------------------
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    def line_width(zm: float) -> int:
        return max(1, int(round(2.6 * SS * 42.0 / zm)))

    def stroke(points: list[tuple[float, float]], zm: float, alpha: int) -> None:
        if len(points) > 1:
            draw.line(points, fill=(int(LINE[0]), int(LINE[1]), int(LINE[2]), alpha), width=line_width(zm), joint="curve")

    zs = np.linspace(6.0, 118.0, 220)
    for side in (-1, 1):
        stroke([project(side * HALF_W, float(z), cx) for z in zs], 30.0, 190)

    # halfway line
    stroke([project(-HALF_W, 52.5, cx), project(HALF_W, 52.5, cx)], 52.5, 200)

    # centre circle
    circle = [
        project(9.15 * math.cos(a), 52.5 + 9.15 * math.sin(a), cx)
        for a in np.linspace(0, 2 * math.pi, 96)
    ]
    stroke(circle, 52.5, 200)

    # far penalty area + goal
    stroke([project(-20.15, 88.5, cx), project(20.15, 88.5, cx)], 88.5, 175)
    stroke([project(-20.15, 88.5, cx), project(-20.15, 105, cx)], 96.0, 175)
    stroke([project(20.15, 88.5, cx), project(20.15, 105, cx)], 96.0, 175)
    stroke([project(-3.66, 105, cx), project(3.66, 105, cx)], 105.0, 210)

    overlay = overlay.filter(ImageFilter.GaussianBlur(0.6 * SS))
    img = np.asarray(Image.alpha_composite(Image.fromarray(img.astype(np.uint8)).convert("RGBA"), overlay).convert("RGB"), dtype=np.float32)

    # ---- floodlight glows ------------------------------------------------
    glow = np.zeros((H, W, 3), np.float32)
    for lx, ly, phase, tint in LIGHTS:
        pulse = 0.82 + 0.18 * math.sin(2 * math.pi * (t + phase))
        d2 = (xx - lx) ** 2 + (yy - ly) ** 2
        g = np.exp(-d2 / (2 * (0.055 * W) ** 2)) * pulse
        glow += g[..., None] * tint * 0.85
    img += glow

    # ---- volumetric beams ------------------------------------------------
    beams = np.zeros((H, W), np.float32)
    for lx, ly, phase, _tint in LIGHTS:
        dx = xx - lx
        dy = yy - ly
        ang = np.arctan2(dx, np.maximum(dy, 1.0))
        dist = np.sqrt(dx * dx + dy * dy)
        sweep = 0.30 * math.sin(2 * math.pi * (t + phase))
        a = np.exp(-(((ang - sweep) / 0.115) ** 2))
        falloff = np.exp(-dist / (0.55 * H))
        beams += a * falloff
    beams = np.clip(beams, 0, 1.6)
    img += beams[..., None] * np.array([255, 250, 236], np.float32) * 0.22

    # ---- horizon accent --------------------------------------------------
    band = np.exp(-((ys - HORIZON) / (0.035 * H)) ** 2)[:, None, None]
    img += band * BRAND[None, None, :] * 0.10

    # ---- dust ------------------------------------------------------------
    dust = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dust)
    for i in range(P_COUNT):
        px = float((P_X[i] + 26 * SS * math.sin(2 * math.pi * (t + i * 0.017))) % W)
        py = float((P_Y[i] - H * t) % H)
        r = float(P_R[i])
        a = int(255 * P_A[i] * (0.55 + 0.45 * math.sin(2 * math.pi * (t * 2 + i * 0.11))))
        dd.ellipse([px - r, py - r, px + r, py + r], fill=(255, 252, 240, max(0, a)))
    dust = dust.filter(ImageFilter.GaussianBlur(0.9 * SS))
    img = np.asarray(Image.alpha_composite(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA"), dust).convert("RGB"), dtype=np.float32)

    # ---- grade -----------------------------------------------------------
    img *= VIGNETTE
    img += rng.normal(0, 2.1, (H, W, 1)).astype(np.float32)

    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    out = out.resize((OUT_W, OUT_H), Image.LANCZOS)
    return np.asarray(out, dtype=np.uint8)


def main() -> int:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("ffmpeg not found on PATH", file=sys.stderr)
        return 1

    os.makedirs(os.path.join("public", "media"), exist_ok=True)
    mp4 = os.path.join("public", "media", "hero.mp4")
    poster = os.path.join("public", "media", "hero-poster.jpg")

    cmd = [
        ffmpeg, "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{OUT_W}x{OUT_H}", "-r", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "slow", "-crf", "24",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for i in range(N):
        frame = render(i / N)
        if i == 10:
            Image.fromarray(frame).save(poster, quality=84, optimize=True)
        proc.stdin.write(frame.tobytes())
        if i % 24 == 0:
            print(f"  frame {i}/{N}", flush=True)

    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        print("ffmpeg failed", file=sys.stderr)
        return proc.returncode

    print(f"wrote {mp4} ({os.path.getsize(mp4) / 1024:.0f} KB)")
    print(f"wrote {poster} ({os.path.getsize(poster) / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())






