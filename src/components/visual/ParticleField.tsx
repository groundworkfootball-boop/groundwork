import { useEffect, useRef } from 'react';
import { cn } from '../ui/cn';
/**
 * GROUNDWORK particle engine.
 *
 * Raw WebGL (no dependencies) rendering an orbital node field tinted by the
 * signal-green accent. Designed as an instrument panel, not decoration:
 * - additive glow point sprites with soft falloff
 * - slow orbital camera with calm pointer parallax
 * - pauses when offscreen or when the tab is hidden
 * - degrades to a static gradient when WebGL or motion is unavailable
 */

const VERT = `
attribute vec4 aSeed;   // x,y,z unit-sphere direction, w = variation seed
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPixelScale;
varying float vDepth;
varying float vSpark;

mat4 rotationY(float a) {
  float s = sin(a); float c = cos(a);
  return mat4(c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c, 0.0, 0.0, 0.0, 0.0, 1.0);
}
mat4 rotationX(float a) {
  float s = sin(a); float c = cos(a);
  return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, s, 0.0, 0.0, -s, c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

void main() {
  float t = uTime * 0.11;
  vec3 base = aSeed.xyz * 3.1;

  vec3 pos = (rotationY(t + aSeed.w * 6.2831) * rotationX(t * 0.45) * vec4(base, 1.0)).xyz;
  pos.y += sin(uTime * 0.35 + aSeed.x * 9.0) * 0.16;

  pos.x += uPointer.x * (0.22 + aSeed.z * 0.14);
  pos.y += uPointer.y * (0.18 + aSeed.y * 0.12);

  vec4 viewPos = uView * vec4(pos, 1.0);
  gl_Position = uProj * viewPos;

  float dist = -viewPos.z;
  vDepth = clamp((dist - 2.0) / 8.0, 0.0, 1.0);
  vSpark = 0.45 + 0.55 * fract(aSeed.w * 13.73);

  // Point size is expressed in device pixels relative to the viewport height so
  // the field looks identical at any canvas size (a fixed multiplier would blow
  // the particles up into a single bloom blob on small containers).
  float worldSize = (0.008 + aSeed.w * 0.016) * (9.0 / max(dist, 1.1));
  gl_PointSize = clamp(worldSize * uPixelScale, 1.0, 14.0);
}
`;

const FRAG = `
precision mediump float;
varying float vDepth;
varying float vSpark;
uniform vec3 uAccent;
uniform vec3 uGlow;

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  if (d > 0.5) discard;

  // Tight core + soft halo. Kept deliberately dim: hundreds of overlapping
  // sprites add up fast, and anything brighter saturates to pure white.
  float core = smoothstep(0.5, 0.0, d);
  float halo = pow(core, 4.0);
  float a = (core * 0.18 + halo * 0.55) * (1.0 - vDepth * 0.75);

  vec3 tint = mix(uGlow, uAccent, vSpark);
  // The canvas is premultiplied, so colour must be premultiplied by alpha here.
  // Emitting un-premultiplied RGB is what previously made the field composite as
  // a solid white wash instead of a glow on black.
  gl_FragColor = vec4(tint * a, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return [0.71, 1, 0.1];
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

export interface ParticleFieldProps {
  className?: string;
  /** Particle count. Keep under ~2600 for mobile GPUs. */
  count?: number;
  accent?: string;
  glow?: string;
}

export function ParticleField({
  className,
  count = 1600,
  accent = '#b6ff1a',
  glow = '#34d399',
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      // Uniform direction on a unit sphere (golden spiral) with varied radius.
      const u = (i + 0.5) / count;
      const phi = Math.acos(1 - 2 * u);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 0.62 + 0.38 * (((i * 37 + 11) % 100) / 100);
      seeds[i * 4] = Math.sin(phi) * Math.cos(theta) * radius;
      seeds[i * 4 + 1] = Math.cos(phi) * radius * 0.78;
      seeds[i * 4 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      seeds[i * 4 + 3] = ((i * 73) % 997) / 997;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

    const aSeed = gl.getAttribLocation(program, 'aSeed');
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 0, 0);

    const uProj = gl.getUniformLocation(program, 'uProj');
    const uView = gl.getUniformLocation(program, 'uView');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uPointer = gl.getUniformLocation(program, 'uPointer');
    const uAccent = gl.getUniformLocation(program, 'uAccent');
    const uGlow = gl.getUniformLocation(program, 'uGlow');
    const uPixelScale = gl.getUniformLocation(program, 'uPixelScale');

    gl.uniform3fv(uAccent, hexToRgb(accent));
    gl.uniform3fv(uGlow, hexToRgb(glow));

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    // Premultiplied source over destination keeps the accumulated alpha bounded,
    // so overlapping sprites glow instead of saturating to white.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
          // Scale particle size with the canvas so the field reads the same in a
          // 300px panel and a full-height hero.
          gl.useProgram(program);
          gl.uniform1f(uPixelScale, Math.max(0.35, Math.min(3.2, height / 620)));
        };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.ty = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
    };
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });

    let visible = true;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0.01 });
    visibility.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) visible = false;
    };
    document.addEventListener('visibilitychange', onVisibility);

    let frame = 0;
    const started = performance.now();

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;

      const pointer = pointerRef.current;
      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniformMatrix4fv(uProj, false, perspective(0.92, width / height, 0.1, 40));
      gl.uniformMatrix4fv(uView, false, identity);
      gl.uniform1f(uTime, (now - started) / 1000);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.POINTS, 0, count);
    };

    frame = requestAnimationFrame(render);

    const onMotionChange = () => {
      if (reduced.matches) {
        cancelAnimationFrame(frame);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
    reduced.addEventListener('change', onMotionChange);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      reduced.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [count, accent, glow]);

  return <canvas ref={canvasRef} className={cn('h-full w-full', className)} aria-hidden role="presentation" />;
}