import { useRef } from 'react';
import { cn } from '../ui/cn';

/**
 * GROUNDWORK football illustration set — hand-authored SVG.
 *
 * Every gradient id is scoped per instance. A shared `<defs>` block would be
 * simpler, but duplicate ids across the many SVGs on one page make every
 * `url(#...)` resolve to whichever definition rendered first — which is how the
 * boot ended up painting itself with the near-white leather gradient intended
 * for the ball. Scoping ids keeps each drawing self-contained.
 */

const HAIR = 'rgba(160,176,200,0.22)';
const HAIR_SOFT = 'rgba(160,176,200,0.11)';
const GREEN = '#b6ff1a';
const EMERALD = '#34d399';
const SKY = '#38bdf8';
const VIOLET = '#a78bfa';
const AMBER = '#fbbf24';

let idSequence = 0;

/** Stable, collision-free id prefix for one mounted illustration. */
function useUid(prefix: string): string {
  const ref = useRef<string | null>(null);
  if (ref.current === null) {
    idSequence += 1;
    ref.current = `${prefix}${idSequence}`;
  }
  return ref.current;
}

/** Shared gradient library, namespaced by the caller's uid. */
function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <radialGradient id={`${uid}-bloom`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor={GREEN} stopOpacity="0.16" />
        <stop offset="58%" stopColor={GREEN} stopOpacity="0.04" />
        <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#182334" />
        <stop offset="100%" stopColor="#070b12" />
      </linearGradient>
      <linearGradient id={`${uid}-turf`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#14663f" />
        <stop offset="52%" stopColor="#0d4a2e" />
        <stop offset="100%" stopColor="#06281a" />
      </linearGradient>
      <linearGradient id={`${uid}-upper`} x1="0.1" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#2b3a4f" />
        <stop offset="46%" stopColor="#182534" />
        <stop offset="100%" stopColor="#0a111b" />
      </linearGradient>
      <linearGradient id={`${uid}-leather`} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#f4f7fa" />
        <stop offset="54%" stopColor="#d6dfe9" />
        <stop offset="100%" stopColor="#9fadbd" />
      </linearGradient>
      <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stopColor="#eef2f7" />
        <stop offset="48%" stopColor="#b6c2d0" />
        <stop offset="100%" stopColor="#6b7889" />
      </linearGradient>
      <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="42%" stopColor="#f5b73c" />
        <stop offset="100%" stopColor="#a2650c" />
      </linearGradient>
      <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/** Regular polygon points, first vertex pointing up. */
function polygon(cx: number, cy: number, r: number, sides: number, rotation: number = -Math.PI / 2) {
  return Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i * Math.PI * 2) / sides;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
}

function toPath(points: ReadonlyArray<readonly [number, number]>): string {
  return `${points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')} Z`;
}

/* ─────────────────────────────────────────────────────────────────────────
   Football boot — side profile, dark upper with a lime chassis accent
   ───────────────────────────────────────────────────────────────────────── */
export function BootIllustration({ className }: { className?: string }) {
  const uid = useUid('gwBoot');
  return (
    <svg viewBox="0 0 460 300" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <ellipse cx="240" cy="180" rx="200" ry="110" fill={`url(#${uid}-bloom)`} />

      {/* Motion streaks */}
      <g stroke={GREEN} strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round">
        <path d="M22 158 H74" opacity="0.75" />
        <path d="M12 186 H60" opacity="0.42" />
        <path d="M34 214 H84" opacity="0.26" />
      </g>

      {/* Ground contact shadow */}
      <ellipse cx="250" cy="258" rx="146" ry="13" fill="#000" fillOpacity="0.55" />

      {/* Studs */}
      {[122, 168, 216, 264, 312, 356].map((x) => (
        <path key={x} d={`M${x} 240 l5 13 h-10 z`} fill="#16212e" stroke={HAIR_SOFT} strokeWidth="1" />
      ))}

      {/* Sole plate */}
      <path
        d="M96 228 H392 C400 228 406 233 406 240 V244 C406 250 400 254 392 254 H118 C104 254 96 247 96 239 Z"
        fill="#0c141f"
        stroke={HAIR}
        strokeWidth="1.4"
      />
      <path d="M100 232 H400" stroke={GREEN} strokeOpacity="0.3" strokeWidth="1.6" />

      {/* Upper — heel rises to the collar, long sweep down to the toe */}
      <path
        d="M100 228 V190 C100 163 120 143 152 132 L208 116 C226 111 244 115 258 124 C304 152 352 176 384 191 C395 196 401 205 401 215 V228 Z"
        fill={`url(#${uid}-upper)`}
        stroke="#33445c"
        strokeWidth="1.4"
      />

      {/* Collar opening */}
      <path
        d="M156 133 C168 121 196 114 216 113 C236 112 252 117 262 124 C246 126 224 129 204 134 C184 139 168 143 158 148 Z"
        fill="#070c13"
        stroke="#3b4d66"
        strokeWidth="1.2"
      />

      {/* Instep highlight */}
      <path
        d="M150 141 C176 128 202 120 228 119 C246 119 258 123 268 129 C296 148 330 168 358 182 C332 176 300 164 268 148 C240 134 210 132 178 142 C162 147 150 153 143 159 Z"
        fill={`url(#${uid}-glass)`}
      />

      {/* Lace panel */}
      <g stroke="#0a1119" strokeOpacity="0.75" strokeWidth="2.4" strokeLinecap="round">
        <path d="M196 141 L232 133" />
        <path d="M206 154 L242 146" />
        <path d="M216 167 L252 159" />
      </g>
      <g stroke={GREEN} strokeOpacity="0.42" strokeWidth="1.1" strokeLinecap="round">
        <path d="M196 136 L232 128" />
        <path d="M206 149 L242 141" />
        <path d="M216 162 L252 154" />
      </g>

      {/* Lime chassis swoosh + heel counter */}
      <path
        d="M118 196 C126 172 146 154 176 143 C204 133 232 134 256 143"
        stroke={GREEN}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeOpacity="0.92"
      />
      <path d="M340 172 C362 182 378 189 390 196" stroke={EMERALD} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.6" />

      {/* Toe cap seam */}
      <path d="M356 196 C370 201 382 205 392 209" stroke="#4b5f78" strokeWidth="1.6" strokeLinecap="round" />

      {/* Contact point */}
      <circle cx="412" cy="196" r="5" fill={GREEN} />
      <circle cx="412" cy="196" r="14" stroke={GREEN} strokeOpacity="0.3" strokeWidth="1.4" />

      <text
        x="22"
        y="284"
        fill="#5b6b80"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1.6"
        fontFamily="JetBrains Mono, monospace"
      >
        SPEC · FG · 214G
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Match ball — classic panel layout so it reads instantly as a football
   ───────────────────────────────────────────────────────────────────────── */
export function BallIllustration({ className }: { className?: string }) {
  const uid = useUid('gwBall');
  const center = 160;
  const radius = 116;

  const corePentagon = polygon(center, center, 44, 5);
  const ringHexagons = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    return polygon(center + Math.cos(a) * 76, center + Math.sin(a) * 76, 40, 6, a + Math.PI / 6);
  });
  const rimPentagons = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + Math.PI / 5 + (i * Math.PI * 2) / 5;
    return polygon(center + Math.cos(a) * radius * 0.92, center + Math.sin(a) * radius * 0.92, 30, 5, a + Math.PI / 5);
  });

  return (
    <svg viewBox="0 0 320 320" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <ellipse cx="160" cy="164" rx="150" ry="146" fill={`url(#${uid}-bloom)`} />

      <circle cx={center} cy={center} r={radius} fill={`url(#${uid}-leather)`} />
      <circle cx={center} cy={center} r={radius} fill={`url(#${uid}-glass)`} />

      {/* Dark panels */}
      <g fill="#0d1725">
        <path d={toPath(corePentagon)} />
        {rimPentagons.map((points, i) => (
          <path key={`rim-${i}`} d={toPath(points)} opacity="0.88" />
        ))}
      </g>

      {/* Seams */}
      <g stroke="#0d1725" strokeOpacity="0.55" strokeWidth="1.8" fill="none">
        {ringHexagons.map((points, i) => (
          <path key={`hex-${i}`} d={toPath(points)} />
        ))}
      </g>

      {/* Lime accent on the central panel */}
      <path d={toPath(corePentagon)} fill="none" stroke={GREEN} strokeOpacity="0.5" strokeWidth="1.6" />

      {/* Specular highlight */}
      <ellipse cx="120" cy="104" rx="36" ry="22" fill="#ffffff" fillOpacity="0.35" transform="rotate(-28 120 104)" />

      {/* Rim */}
      <circle cx={center} cy={center} r={radius} stroke="#7f8ea0" strokeOpacity="0.5" strokeWidth="1.6" />
      <circle cx={center} cy={center} r={radius} stroke={GREEN} strokeOpacity="0.2" strokeWidth="1" />

      {/* Orbital ticks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const inner = radius + 8;
        const outer = radius + (i % 6 === 0 ? 20 : 13);
        return (
          <line
            key={i}
            x1={center + Math.cos(angle) * inner}
            y1={center + Math.sin(angle) * inner}
            x2={center + Math.cos(angle) * outer}
            y2={center + Math.sin(angle) * outer}
            stroke={i % 6 === 0 ? GREEN : HAIR}
            strokeWidth="1.1"
          />
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Tactics board — full pitch with a 4-3-3 shape and passing lanes
   ───────────────────────────────────────────────────────────────────────── */
export function TacticsBoardIllustration({ className }: { className?: string }) {
  const uid = useUid('gwTactics');
  const nodes = [
    { x: 230, y: 312, label: 'GK', tone: AMBER },
    { x: 122, y: 254, label: 'LB', tone: SKY },
    { x: 230, y: 246, label: 'CB', tone: SKY },
    { x: 338, y: 254, label: 'RB', tone: SKY },
    { x: 230, y: 190, label: 'CDM', tone: GREEN },
    { x: 150, y: 152, label: 'CM', tone: EMERALD },
    { x: 310, y: 152, label: 'CM', tone: EMERALD },
    { x: 230, y: 96, label: 'ST', tone: VIOLET },
  ];
  const lanes: Array<[number, number]> = [
    [0, 2],
    [2, 1],
    [2, 3],
    [2, 4],
    [1, 5],
    [3, 6],
    [4, 5],
    [4, 6],
    [5, 7],
    [6, 7],
  ];

  return (
    <svg viewBox="0 0 460 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <rect x="18" y="18" width="424" height="364" rx="14" fill="#060a11" stroke={HAIR} />

      {/* Pitch */}
      <rect x="38" y="38" width="384" height="324" rx="6" fill={`url(#${uid}-turf)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x="38" y={38 + i * 36} width="384" height="18" fill="#ffffff" fillOpacity={i % 2 === 0 ? 0.025 : 0} />
      ))}

      {/* Markings */}
      <g stroke="#e8f2f8" strokeOpacity="0.38" strokeWidth="2" fill="none">
        <rect x="38" y="38" width="384" height="324" rx="6" />
        <path d="M38 206 H422" />
        <circle cx="230" cy="206" r="44" />
        <path d="M150 38 V96 H310 V38" />
        <path d="M182 38 V64 H278 V38" />
        <path d="M150 362 V304 H310 V362" />
        <path d="M182 362 V336 H278 V362" />
      </g>
      <circle cx="230" cy="206" r="3" fill="#e8f2f8" fillOpacity="0.6" />

      {/* Passing lanes */}
      {lanes.map(([a, b], i) => {
        const from = nodes[a];
        const to = nodes[b];
        return (
          <path
            key={i}
            d={`M${from.x} ${from.y} L${to.x} ${to.y}`}
            stroke={GREEN}
            strokeOpacity={0.14 + (i % 3) * 0.06}
            strokeWidth="1.5"
            strokeDasharray="5 7"
          />
        );
      })}

      {/* Player nodes */}
      {nodes.map((node) => (
        <g key={node.label + node.x + node.y}>
          <circle
            cx={node.x}
            cy={node.y}
            r="20"
            fill={node.tone}
            fillOpacity="0.14"
            stroke={node.tone}
            strokeOpacity="0.6"
            strokeWidth="1.4"
          />
          <circle cx={node.x} cy={node.y} r="20" fill={`url(#${uid}-glass)`} />
          <text
            x={node.x}
            y={node.y + 3.5}
            fill={node.tone}
            fontSize="9.5"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            {node.label}
          </text>
        </g>
      ))}

      {/* Highlighted run */}
      <path d="M230 96 C266 80 304 88 318 118" stroke={VIOLET} strokeOpacity="0.6" strokeWidth="2" strokeDasharray="4 5" />
      <path d="M318 118 l-9 -2 l2 9 z" fill={VIOLET} fillOpacity="0.85" />

      <text x="38" y="20" fill="#5b6b80" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        4-3-3 · PRESS TRIGGER
      </text>
      <text
        x="422"
        y="20"
        fill={GREEN}
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="1.6"
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
      >
        SHAPE FIT 92
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Scouting radar — polar plot with player blips
   ───────────────────────────────────────────────────────────────────────── */
export function ScoutingRadarIllustration({ className }: { className?: string }) {
  const uid = useUid('gwRadar');
  const cx = 210;
  const cy = 200;
  const rings = [54, 94, 134];
  const spokes = 8;
  const blips = [
    { angle: 34, radius: 94, tone: GREEN },
    { angle: 118, radius: 62, tone: EMERALD },
    { angle: 196, radius: 108, tone: SKY },
    { angle: 268, radius: 78, tone: VIOLET },
    { angle: 322, radius: 126, tone: AMBER },
  ];
  const sweepStart = -90;
  const sweepEnd = 34;

  const pointAt = (angleDeg: number, r: number) =>
    [cx + Math.cos((angleDeg * Math.PI) / 180) * r, cy + Math.sin((angleDeg * Math.PI) / 180) * r] as const;

  const [sx, sy] = pointAt(sweepStart, rings[2]);
  const [ex, ey] = pointAt(sweepEnd, rings[2]);

  return (
    <svg viewBox="0 0 420 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <ellipse cx={cx} cy={cy} rx="190" ry="180" fill={`url(#${uid}-bloom)`} />

      {/* Sweep wedge */}
      <path
        d={`M${cx} ${cy} L${sx} ${sy} A ${rings[2]} ${rings[2]} 0 0 1 ${ex} ${ey} Z`}
        fill={GREEN}
        fillOpacity="0.09"
      />

      {/* Rings */}
      {rings.map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} stroke={HAIR} strokeWidth="1.2" fill="none" />
      ))}

      {/* Spokes */}
      {Array.from({ length: spokes }).map((_, i) => {
        const [x, y] = pointAt((i / spokes) * 360 - 90, rings[2]);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={HAIR_SOFT} strokeWidth="1" />;
      })}

      {/* Axis labels */}
      {['PACE', 'POWER', 'PRESS', 'PASS'].map((label, i) => {
        const [x, y] = pointAt((i / 4) * 360 - 90, rings[2] + 22);
        return (
          <text
            key={label}
            x={x}
            y={y + 3}
            fill="#5b6b80"
            fontSize="8"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="1.2"
            fontFamily="JetBrains Mono, monospace"
          >
            {label}
          </text>
        );
      })}

      {/* Player shape polygon */}
      <path
        d={`M${blips.map((b) => pointAt(b.angle, b.radius).join(' ')).join(' L ')} Z`}
        fill={GREEN}
        fillOpacity="0.1"
        stroke={GREEN}
        strokeOpacity="0.55"
        strokeWidth="1.8"
      />

      {/* Blips */}
      {blips.map((blip, i) => {
        const [x, y] = pointAt(blip.angle, blip.radius);
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="9"
              fill={blip.tone}
              fillOpacity="0.16"
              stroke={blip.tone}
              strokeOpacity="0.7"
              strokeWidth="1.4"
            />
            <circle cx={x} cy={y} r="3" fill={blip.tone} />
          </g>
        );
      })}

      {/* Clock hand */}
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={GREEN} strokeOpacity="0.8" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="4" fill={GREEN} />

      <text x="20" y="376" fill="#5b6b80" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        SCOUTING RADAR · 5 CANDIDATES
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Trophy — signed/audited state marker
   ───────────────────────────────────────────────────────────────────────── */
export function TrophyIllustration({ className }: { className?: string }) {
  const uid = useUid('gwTrophy');
  return (
    <svg viewBox="0 0 360 340" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <ellipse cx="180" cy="150" rx="150" ry="130" fill={`url(#${uid}-bloom)`} />

      {/* Handles */}
      <path d="M104 92 C58 92 50 158 100 174" stroke={`url(#${uid}-gold)`} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M256 92 C302 92 310 158 260 174" stroke={`url(#${uid}-gold)`} strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* Cup */}
      <path
        d="M104 70 H256 V108 C256 162 222 196 180 196 C138 196 104 162 104 108 Z"
        fill={`url(#${uid}-gold)`}
        stroke="#7c4c07"
        strokeWidth="1.5"
      />
      <path d="M128 84 H232 V110 C232 150 208 176 180 176 C152 176 128 150 128 110 Z" fill="#000" fillOpacity="0.14" />
      <path
        d="M180 88 L196 120 L230 124 L205 148 L211 182 L180 166 L149 182 L155 148 L130 124 L164 120 Z"
        fill="#fffbe8"
        fillOpacity="0.6"
      />

      {/* Engraved audit lines */}
      <g stroke="#7c4c07" strokeOpacity="0.5" strokeWidth="1.4">
        <path d="M122 126 H238" strokeDasharray="3 5" />
        <path d="M128 140 H232" strokeDasharray="3 5" />
      </g>

      {/* Stem + plinth */}
      <path d="M166 196 H194 V214 H166 Z" fill={`url(#${uid}-gold)`} stroke="#7c4c07" strokeWidth="1.2" />
      <rect x="136" y="214" width="88" height="14" rx="4" fill={`url(#${uid}-gold)`} stroke="#7c4c07" strokeWidth="1.2" />
      <rect x="118" y="228" width="124" height="28" rx="6" fill="#141f2c" stroke={HAIR} />
      <text
        x="180"
        y="246"
        fill={GREEN}
        fontSize="8.5"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="1.8"
        fontFamily="JetBrains Mono, monospace"
      >
        SIGNED · AUDITED
      </text>

      {/* Radiating ticks */}
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const r1 = 146;
        const r2 = i % 4 === 0 ? 162 : 154;
        return (
          <line
            key={i}
            x1={180 + Math.cos(angle) * r1}
            y1={136 + Math.sin(angle) * r1}
            x2={180 + Math.cos(angle) * r2}
            y2={136 + Math.sin(angle) * r2}
            stroke={i % 4 === 0 ? GREEN : HAIR_SOFT}
            strokeOpacity={i % 4 === 0 ? 0.6 : 1}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Club crest — shield with stripes, star and founding year
   ───────────────────────────────────────────────────────────────────────── */
export function CrestIllustration({ className }: { className?: string }) {
  const uid = useUid('gwCrest');
  return (
    <svg viewBox="0 0 240 280" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <path
        d="M120 16 L216 46 V138 C216 202 174 246 120 264 C66 246 24 202 24 138 V46 Z"
        fill={`url(#${uid}-panel)`}
        stroke={GREEN}
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      <path
        d="M120 30 L204 56 V138 C204 194 168 234 120 250 C72 234 36 194 36 138 V56 Z"
        stroke={HAIR}
        strokeWidth="1.2"
        fill="none"
      />

      {/* Stripes */}
      <g fill={GREEN} fillOpacity="0.15">
        <path d="M56 62 H78 V228 L56 240 Z" />
        <path d="M98 62 H120 V248 L98 250 Z" />
        <path d="M142 62 H164 V240 L142 228 Z" />
        <path d="M184 62 H204 V226 L184 212 Z" />
      </g>

      {/* Chevron */}
      <path d="M58 152 L120 108 L182 152 L182 176 L120 134 L58 176 Z" fill={GREEN} fillOpacity="0.62" />

      {/* Star */}
      <path
        d="M120 56 L129 78 L152 80 L134 95 L139 118 L120 106 L101 118 L106 95 L88 80 L111 78 Z"
        fill={`url(#${uid}-gold)`}
        stroke="#7c4c07"
        strokeWidth="0.8"
      />

      <text
        x="120"
        y="202"
        fill="#e2e8f0"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="2.4"
        fontFamily="Space Grotesk, sans-serif"
      >
        EST 1898
      </text>
      <text
        x="120"
        y="222"
        fill={GREEN}
        fontSize="8"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="2"
        fontFamily="JetBrains Mono, monospace"
      >
        YOUTH VERIFIED
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Whistle — final-decision marker
   ───────────────────────────────────────────────────────────────────────── */
export function WhistleIllustration({ className }: { className?: string }) {
  const uid = useUid('gwWhistle');
  return (
    <svg viewBox="0 0 360 300" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <ellipse cx="180" cy="160" rx="150" ry="110" fill={`url(#${uid}-bloom)`} />
      <ellipse cx="190" cy="252" rx="108" ry="15" fill="#000" fillOpacity="0.5" />

      {/* Body */}
      <path
        d="M92 140 C92 110 118 90 152 90 H232 C272 90 296 114 296 148 C296 186 268 210 230 210 H160 C122 210 92 186 92 154 Z"
        fill={`url(#${uid}-metal)`}
        stroke="#6f7c8d"
        strokeWidth="1.4"
      />
      <path
        d="M92 150 C92 120 118 98 152 98 H232 C266 98 288 120 288 150 C288 154 287 158 286 162 H94 C93 158 92 154 92 150 Z"
        fill={`url(#${uid}-glass)`}
      />

      {/* Mouthpiece */}
      <path
        d="M296 130 H322 C330 130 336 136 336 144 V160 C336 168 330 174 322 174 H296 Z"
        fill={`url(#${uid}-metal)`}
        stroke="#6f7c8d"
        strokeWidth="1.2"
      />

      {/* Cork ball */}
      <circle cx="168" cy="162" r="25" fill="#0a1220" stroke={GREEN} strokeOpacity="0.5" strokeWidth="1.6" />
      <circle cx="168" cy="162" r="9" fill={GREEN} fillOpacity="0.6" />

      {/* Air waves */}
      <g stroke={GREEN} strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M62 120 C44 140 44 180 62 200" />
        <path d="M38 102 C14 134 14 188 38 218" strokeOpacity="0.28" />
      </g>

      {/* Lanyard */}
      <path d="M228 98 C240 68 264 54 288 60" stroke="#8f9dae" strokeWidth="4" strokeLinecap="round" />
      <rect x="282" y="50" width="22" height="16" rx="3" fill="#141f2c" stroke={HAIR} />

      <text x="20" y="284" fill="#5b6b80" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        FINAL WHISTLE · STATUS LOCKED
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Jersey — shirt with squad number
   ───────────────────────────────────────────────────────────────────────── */
export function JerseyIllustration({ className, number = '10' }: { className?: string; number?: string }) {
  const uid = useUid('gwJersey');
  return (
    <svg viewBox="0 0 260 260" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />

      {/* Sleeves */}
      <path d="M66 58 L18 94 L46 142 L78 124 Z" fill="#101a28" stroke="#33445c" strokeWidth="1.3" />
      <path d="M194 58 L242 94 L214 142 L182 124 Z" fill="#101a28" stroke="#33445c" strokeWidth="1.3" />

      {/* Body */}
      <path
        d="M66 42 H194 L204 96 C206 150 200 196 196 226 H64 C60 196 54 150 56 96 Z"
        fill={`url(#${uid}-panel)`}
        stroke="#33445c"
        strokeWidth="1.3"
      />

      {/* Collar */}
      <path d="M104 42 C112 62 148 62 156 42 L148 34 H112 Z" fill="#0d1725" stroke={GREEN} strokeOpacity="0.5" strokeWidth="1.2" />

      {/* Chest band */}
      <path d="M56 142 C126 134 134 134 204 142 L204 158 C134 150 126 150 56 158 Z" fill={GREEN} fillOpacity="0.18" />

      {/* Shoulder seams */}
      <g stroke={GREEN} strokeOpacity="0.28" strokeWidth="1.2" fill="none">
        <path d="M76 46 C88 78 84 120 80 160" />
        <path d="M184 46 C172 78 176 120 180 160" />
      </g>

      {/* Number */}
      <text
        x="130"
        y="206"
        fill={GREEN}
        fontSize="72"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="-2"
        fontFamily="Space Grotesk, sans-serif"
        opacity="0.95"
      >
        {number}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Video frame — clip with reviewable tags
   ───────────────────────────────────────────────────────────────────────── */
export function ClipReviewIllustration({ className }: { className?: string }) {
  const uid = useUid('gwClip');
  return (
    <svg viewBox="0 0 460 340" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <rect x="0.5" y="0.5" width="459" height="339" rx="16" stroke={HAIR} />
      <rect x="22" y="22" width="416" height="206" rx="10" fill="#05090f" stroke={HAIR} />

      {/* Turf inside the frame */}
      <rect x="22" y="128" width="416" height="100" fill={`url(#${uid}-turf)`} />
      <g stroke="#e8f2f8" strokeOpacity="0.22" strokeWidth="1.6">
        <path d="M22 178 H438" />
        <ellipse cx="230" cy="178" rx="48" ry="13" />
      </g>

      {/* Subject marker */}
      <circle cx="176" cy="162" r="13" stroke={GREEN} strokeOpacity="0.75" strokeWidth="1.6" />
      <circle cx="176" cy="156" r="4" fill={GREEN} fillOpacity="0.75" />
      <path d="M170 171 a6 6 0 0 1 12 0" fill={GREEN} fillOpacity="0.5" />
      <path d="M189 162 H236" stroke={GREEN} strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="4 4" />

      {/* Play control */}
      <circle cx="366" cy="62" r="22" fill={GREEN} fillOpacity="0.14" stroke={GREEN} strokeOpacity="0.55" />
      <path d="M360 52 L376 62 L360 72 Z" fill={GREEN} />

      {/* Timeline */}
      <rect x="22" y="240" width="416" height="4" rx="2" fill="#94a3b8" fillOpacity="0.16" />
      <rect x="22" y="240" width="168" height="4" rx="2" fill={GREEN} fillOpacity="0.85" />
      <circle cx="190" cy="242" r="5" fill={GREEN} />

      {/* Reviewable tags */}
      {['Right foot · visible', 'Attacking third', 'Passing sequence', 'Wide framing'].map((tag, i) => (
        <g key={tag} transform={`translate(${22 + (i % 2) * 212} ${260 + Math.floor(i / 2) * 34})`}>
          <rect width="200" height="26" rx="13" fill={VIOLET} fillOpacity="0.1" stroke={VIOLET} strokeOpacity="0.32" />
          <circle cx="14" cy="13" r="3" fill={VIOLET} />
          <text x="26" y="17" fill="#c4b5fd" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            {tag}
          </text>
        </g>
      ))}
      <text
        x="432"
        y="234"
        fill="#5b6b80"
        fontSize="8"
        fontWeight="600"
        textAnchor="end"
        letterSpacing="1.4"
        fontFamily="JetBrains Mono, monospace"
      >
        AI-ASSISTED · PLAYER REVIEWED
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Onboarding step marker
   ───────────────────────────────────────────────────────────────────────── */
export function StepGlyph({ tone = 'brand' }: { tone?: 'brand' | 'emerald' | 'sky' | 'violet' }) {
  const color = tone === 'brand' ? GREEN : tone === 'emerald' ? EMERALD : tone === 'sky' ? SKY : VIOLET;
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="39" rx="10" stroke={HAIR} />
      <circle cx="20" cy="20" r="11" stroke={color} strokeOpacity="0.4" />
      <circle cx="20" cy="20" r="4" fill={color} fillOpacity="0.9" />
      <path d="M20 4 V9 M20 31 V36 M4 20 H9 M31 20 H36" stroke={color} strokeOpacity="0.5" strokeWidth="1.4" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Pitch slot — compact single-position marker
   ───────────────────────────────────────────────────────────────────────── */
export function PitchSlotIllustration({ className }: { className?: string }) {
  const uid = useUid('gwSlot');
  return (
    <svg viewBox="0 0 200 140" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <Defs uid={uid} />
      <rect x="6" y="6" width="188" height="128" rx="8" fill={`url(#${uid}-turf)`} fillOpacity="0.45" stroke={HAIR} />
      <g stroke={HAIR} strokeWidth="1.2" fill="none">
        <path d="M100 6 V134" />
        <circle cx="100" cy="70" r="20" />
        <rect x="6" y="42" width="24" height="56" />
        <rect x="170" y="42" width="24" height="56" />
      </g>
      <circle cx="100" cy="70" r="3.5" fill={GREEN} />
    </svg>
  );
}
