import { cn } from '../ui/cn';

/**
 * GROUNDWORK football illustration set — hand-authored SVG.
 * Every asset is drawn from explicit geometry with layered gradients,
 * perspective, and a consistent hairline system so the whole set reads
 * as one technical drawing family.
 */

const HAIR = 'rgba(160,176,200,0.22)';
const HAIR_SOFT = 'rgba(160,176,200,0.11)';
const GREEN = '#b6ff1a';
const EMERALD = '#34d399';
const SKY = '#38bdf8';
const VIOLET = '#a78bfa';
const AMBER = '#fbbf24';

const SHARED = (
  <defs>
    <radialGradient id="fb-bloom" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stopColor={GREEN} stopOpacity="0.20" />
      <stop offset="60%" stopColor={GREEN} stopOpacity="0.05" />
      <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="fb-panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#16202f" />
      <stop offset="100%" stopColor="#070b12" />
    </linearGradient>
    <linearGradient id="fb-turf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#12603c" />
      <stop offset="48%" stopColor="#0d4a2e" />
      <stop offset="100%" stopColor="#062418" />
    </linearGradient>
    <linearGradient id="fb-leather" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stopColor="#f8fafc" />
      <stop offset="42%" stopColor="#dbe4ee" />
      <stop offset="100%" stopColor="#8f9dae" />
    </linearGradient>
    <linearGradient id="fb-metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f5f7fa" />
      <stop offset="45%" stopColor="#c3ccd8" />
      <stop offset="100%" stopColor="#727f90" />
    </linearGradient>
    <linearGradient id="fb-gold" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stopColor="#fde68a" />
      <stop offset="45%" stopColor="#f5b73c" />
      <stop offset="100%" stopColor="#a86a12" />
    </linearGradient>
    <linearGradient id="fb-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
    </linearGradient>
  </defs>
);

/* ─────────────────────────────────────────────────────────────────────────
   Football boot — layered side profile with stud plate + motion streaks
   ───────────────────────────────────────────────────────────────────────── */
export function BootIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 300" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <ellipse cx="230" cy="200" rx="190" ry="90" fill="url(#fb-bloom)" />

      {/* Motion streaks */}
      <g stroke={GREEN} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <path d="M28 168 H92" opacity="0.7" />
        <path d="M18 196 H78" opacity="0.45" />
        <path d="M40 224 H104" opacity="0.3" />
      </g>

      {/* Ground shadow */}
      <ellipse cx="238" cy="252" rx="150" ry="18" fill="#000" fillOpacity="0.45" />

      {/* Sole / stud plate */}
      <path
        d="M96 214 C126 236 176 246 232 246 C302 246 352 232 372 214 L372 228 C352 250 300 264 232 264 C168 264 118 250 96 228 Z"
        fill="#101a28"
        stroke={HAIR}
        strokeWidth="1.5"
      />
      {[130, 172, 218, 264, 310, 348].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 244 l6 16 h-12 z`} fill="#1d2b3d" stroke={HAIR_SOFT} />
          <circle cx={x} cy={260} r={2.4} fill={i % 2 === 0 ? GREEN : '#8fa3bb'} fillOpacity="0.7" />
        </g>
      ))}

      {/* Upper */}
      <path
        d="M100 214 C100 182 118 152 150 138 C176 127 196 122 216 118 C244 112 262 108 288 108 C332 108 366 132 372 176 C376 198 374 208 372 214 C352 232 302 246 232 246 C176 246 126 236 96 214 Z"
        fill="url(#fb-leather)"
        stroke="#a9b6c6"
        strokeWidth="1.2"
      />

      {/* Vamp highlight */}
      <path
        d="M150 138 C176 127 196 122 216 118 C244 112 262 108 288 108 C316 108 340 118 356 137 C330 130 296 126 262 132 C224 139 182 152 150 172 C128 186 116 200 108 216 C104 198 110 178 124 162 Z"
        fill="url(#fb-glass)"
      />

      {/* Lace panel */}
      <g stroke="#64748b" strokeOpacity="0.75" strokeWidth="1.4" strokeLinecap="round">
        <path d="M196 128 L246 120" />
        <path d="M204 138 L254 130" />
        <path d="M212 148 L262 140" />
      </g>
      <path d="M188 122 C202 116 224 111 248 108" stroke={GREEN} strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />

      {/* Heel counter + brand accent */}
      <path d="M330 122 C356 136 370 158 372 186" stroke={GREEN} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path
        d="M300 150 C324 152 344 166 356 190"
        stroke={EMERALD}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />

      {/* Toe shape line */}
      <path d="M112 206 C130 216 158 226 196 232" stroke="#8c9bad" strokeOpacity="0.6" strokeWidth="1.2" />

      {/* Contact point */}
      <circle cx="388" cy="176" r="5" fill={GREEN} fillOpacity="0.9" />
      <circle cx="388" cy="176" r="14" stroke={GREEN} strokeOpacity="0.28" strokeWidth="1.5" />

      <text x="24" y="282" fill="#64748b" fontSize="9" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        SPEC · FG · 214G
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Football — truncated icosahedron wireframe, luminous panels
   ───────────────────────────────────────────────────────────────────────── */
export function BallIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <ellipse cx="160" cy="160" rx="150" ry="150" fill="url(#fb-bloom)" />
      <circle cx="160" cy="160" r="118" fill="#0a1220" stroke={HAIR} strokeWidth="1.5" />
      <circle cx="160" cy="160" r="118" fill="url(#fb-glass)" />

      {/* Pentagons on a projected sphere */}
      <g stroke={GREEN} strokeOpacity="0.55" strokeWidth="1.4" fill="none">
        <path d="M160 74 L204 104 L188 155 L132 155 L116 104 Z" fill={GREEN} fillOpacity="0.10" />
        <path d="M62 132 L98 122 L112 168 L84 196 L52 174 Z" fill={EMERALD} fillOpacity="0.07" />
        <path d="M258 132 L222 122 L208 168 L236 196 L268 174 Z" fill={SKY} fillOpacity="0.07" />
        <path d="M104 232 L140 214 L172 236 L160 268 L120 268 Z" fill={VIOLET} fillOpacity="0.07" />
        <path d="M216 232 L180 214 L148 236 L160 268 L200 268 Z" fill={GREEN} fillOpacity="0.06" />
      </g>

      {/* Seam network */}
      <g stroke="#8fa3bb" strokeOpacity="0.28" strokeWidth="1.2">
        <path d="M204 104 L222 122" />
        <path d="M116 104 L98 122" />
        <path d="M188 155 L208 168" />
        <path d="M132 155 L112 168" />
        <path d="M84 196 L104 232" />
        <path d="M236 196 L216 232" />
        <path d="M140 214 L98 122" />
        <path d="M180 214 L222 122" />
      </g>

      {/* Specular */}
      <ellipse cx="126" cy="112" rx="34" ry="22" fill="#ffffff" fillOpacity="0.10" transform="rotate(-24 126 112)" />
      <circle cx="160" cy="160" r="118" stroke={GREEN} strokeOpacity="0.14" strokeWidth="1" />

      {/* Orbital ticks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const x1 = 160 + Math.cos(angle) * 124;
        const y1 = 160 + Math.sin(angle) * 124;
        const x2 = 160 + Math.cos(angle) * (i % 6 === 0 ? 138 : 131);
        const y2 = 160 + Math.sin(angle) * (i % 6 === 0 ? 138 : 131);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 6 === 0 ? GREEN : HAIR} strokeWidth="1" />;
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Tactics board — half-pitch with player nodes and passing lanes
   ───────────────────────────────────────────────────────────────────────── */
export function TacticsBoardIllustration({ className }: { className?: string }) {
  const nodes = [
    { x: 230, y: 300, label: 'GK', tone: AMBER },
    { x: 120, y: 246, label: 'LB', tone: SKY },
    { x: 230, y: 238, label: 'CB', tone: SKY },
    { x: 340, y: 246, label: 'RB', tone: SKY },
    { x: 230, y: 182, label: 'CDM', tone: GREEN },
    { x: 148, y: 148, label: 'CM', tone: EMERALD },
    { x: 312, y: 148, label: 'CM', tone: EMERALD },
    { x: 230, y: 92, label: 'ST', tone: VIOLET },
  ];
  const lanes: Array<[number, number]> = [
    [0, 2],
    [2, 1],
    [2, 3],
    [2, 4],
    [4, 5],
    [4, 6],
    [5, 7],
    [6, 7],
  ];

  return (
    <svg viewBox="0 0 460 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <rect x="18" y="18" width="424" height="364" rx="14" fill="#070b12" stroke={HAIR} />

      {/* Pitch */}
      <rect x="38" y="38" width="384" height="324" rx="8" fill="url(#fb-turf)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={i}
          x="38"
          y={38 + i * 36}
          width="384"
          height="18"
          fill="#ffffff"
          fillOpacity={i % 2 === 0 ? 0.022 : 0}
        />
      ))}

      {/* Markings */}
      <g stroke="#e8f2f8" strokeOpacity="0.34" strokeWidth="2" fill="none">
        <rect x="38" y="38" width="384" height="324" rx="8" />
        <path d="M38 214 H422" />
        <circle cx="230" cy="214" r="46" />
        <circle cx="230" cy="214" r="3" fill="#e8f2f8" fillOpacity="0.5" stroke="none" />
        <path d="M150 38 V100 H310 V38" />
        <path d="M182 38 V68 H278 V38" />
        <path d="M150 362 V300 H310 V362" />
        <path d="M182 362 V332 H278 V362" />
      </g>

      {/* Passing lanes */}
      {lanes.map(([a, b], i) => {
        const from = nodes[a];
        const to = nodes[b];
        return (
          <path
            key={i}
            d={`M${from.x} ${from.y} L${to.x} ${to.y}`}
            stroke={GREEN}
            strokeOpacity={0.16 + (i % 3) * 0.07}
            strokeWidth="1.5"
            strokeDasharray="5 7"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => (
        <g key={node.label + node.x + node.y}>
          <circle cx={node.x} cy={node.y} r="21" fill={node.tone} fillOpacity="0.10" stroke={node.tone} strokeOpacity="0.5" />
          <circle cx={node.x} cy={node.y} r="21" fill="url(#fb-glass)" />
          <text
            x={node.x}
            y={node.y + 3.5}
            fill={node.tone}
            fontSize="9.5"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.5"
          >
            {node.label}
          </text>
        </g>
      ))}

      {/* Highlighted movement */}
      <path d="M230 92 C262 78 300 84 312 112" stroke={VIOLET} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="4 5" />
      <path d="M312 112 l-8 -3 l3 9 z" fill={VIOLET} fillOpacity="0.8" />

      <text x="38" y="20" fill="#64748b" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        4-3-3 · PRESS TRIGGER
      </text>
      <text x="422" y="20" fill={GREEN} fontSize="8.5" fontWeight="700" letterSpacing="1.6" textAnchor="end" fontFamily="JetBrains Mono, monospace">
        SHAPE FIT 92
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Scouting radar — polar plot with player blips
   ───────────────────────────────────────────────────────────────────────── */
export function ScoutingRadarIllustration({ className }: { className?: string }) {
  const cx = 210;
  const cy = 196;
  const rings = [52, 92, 132];
  const spokes = 8;
  const blips = [
    { angle: 32, radius: 92, tone: GREEN },
    { angle: 118, radius: 60, tone: EMERALD },
    { angle: 196, radius: 118, tone: SKY },
    { angle: 268, radius: 76, tone: VIOLET },
    { angle: 330, radius: 108, tone: AMBER },
  ];

  return (
    <svg viewBox="0 0 420 392" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <rect x="0.5" y="0.5" width="419" height="391" rx="16" stroke={HAIR} />

      {/* Grid */}
      {rings.map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} stroke={HAIR_SOFT} strokeWidth="1" />
      ))}
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (i / spokes) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * 140}
            y2={cy + Math.sin(angle) * 140}
            stroke={HAIR_SOFT}
            strokeWidth="1"
          />
        );
      })}

      {/* Sweep */}
      <path
        d={`M${cx} ${cy} L${cx + Math.cos(-0.5) * 136} ${cy + Math.sin(-0.5) * 136} A136 136 0 0 1 ${cx + Math.cos(0.35) * 136} ${cy + Math.sin(0.35) * 136} Z`}
        fill={GREEN}
        fillOpacity="0.07"
      />
      <line x1={cx} y1={cy} x2={cx + 136} y2={cy} stroke={GREEN} strokeOpacity="0.5" strokeWidth="1.5" />

      {/* Attribute polygon */}
      <path
        d="M210 118 L282 154 L296 218 L246 268 L174 262 L136 202 L150 150 Z"
        fill={GREEN}
        fillOpacity="0.10"
        stroke={GREEN}
        strokeOpacity="0.6"
        strokeWidth="1.8"
      />

      {/* Blips */}
      {blips.map((blip, i) => {
        const angle = (blip.angle * Math.PI) / 180;
        const x = cx + Math.cos(angle) * blip.radius;
        const y = cy + Math.sin(angle) * blip.radius;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="10" fill={blip.tone} fillOpacity="0.14" />
            <circle cx={x} cy={y} r="4" fill={blip.tone} fillOpacity="0.95" />
            <circle cx={x} cy={y} r="16" stroke={blip.tone} strokeOpacity="0.24" strokeWidth="1" />
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="4" fill={GREEN} />
      <text x="18" y="26" fill="#64748b" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        RECRUITMENT RADAR
      </text>
      <text x="402" y="26" fill={GREEN} fontSize="8.5" fontWeight="700" letterSpacing="1.6" textAnchor="end" fontFamily="JetBrains Mono, monospace">
        6 DIMENSIONS
      </text>

      {/* Legend */}
      {[
        { label: 'Position', tone: GREEN },
        { label: 'Level', tone: EMERALD },
        { label: 'Region', tone: SKY },
        { label: 'Availability', tone: AMBER },
      ].map((item, i) => (
        <g key={item.label} transform={`translate(24 ${330 + (i % 2) * 20})`}>
          <circle cx="3" cy="0" r="3" fill={item.tone} />
          <text x="14" y="3.5" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
            {item.label}
          </text>
        </g>
      ))}
      <g transform="translate(210 330)">
        <circle cx="3" cy="0" r="3" fill={VIOLET} />
        <text x="14" y="3.5" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Attributes
        </text>
      </g>
      <g transform="translate(210 350)">
        <circle cx="3" cy="0" r="3" fill={EMERALD} />
        <text x="14" y="3.5" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
          Verified clubs only
        </text>
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Trophy — cup with plinth, engraved audit lines
   ───────────────────────────────────────────────────────────────────────── */
export function TrophyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 340" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <ellipse cx="180" cy="150" rx="150" ry="130" fill="url(#fb-bloom)" />

      {/* Handles */}
      <path d="M104 96 C60 96 52 156 100 172" stroke="url(#fb-gold)" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M256 96 C300 96 308 156 260 172" stroke="url(#fb-gold)" strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* Cup body */}
      <path
        d="M104 74 H256 V110 C256 164 222 198 180 198 C138 198 104 164 104 110 Z"
        fill="url(#fb-gold)"
        stroke="#7c4c07"
        strokeWidth="1.5"
      />
      <path
        d="M126 86 H234 V112 C234 154 210 180 180 180 C150 180 126 154 126 112 Z"
        fill="#000"
        fillOpacity="0.12"
      />
      <path d="M180 92 L196 124 L230 128 L206 152 L212 186 L180 170 L148 186 L154 152 L130 128 L164 124 Z" fill="#fffbe8" fillOpacity="0.55" />

      {/* Engraved audit lines */}
      <g stroke="#7c4c07" strokeOpacity="0.55" strokeWidth="1.4">
        <path d="M120 128 H240" strokeDasharray="3 5" />
        <path d="M126 142 H234" strokeDasharray="3 5" />
      </g>

      {/* Stem + plinth */}
      <path d="M166 198 H194 V216 H166 Z" fill="url(#fb-gold)" stroke="#7c4c07" strokeWidth="1.2" />
      <rect x="136" y="216" width="88" height="14" rx="4" fill="url(#fb-gold)" stroke="#7c4c07" strokeWidth="1.2" />
      <rect x="120" y="230" width="120" height="26" rx="6" fill="#16202f" stroke={HAIR} />
      <text
        x="180"
        y="247"
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
        const r1 = 152;
        const r2 = i % 4 === 0 ? 166 : 158;
        return (
          <line
            key={i}
            x1={180 + Math.cos(angle) * r1}
            y1={140 + Math.sin(angle) * r1}
            x2={180 + Math.cos(angle) * r2}
            y2={140 + Math.sin(angle) * r2}
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
   Club crest — shield with stripes, star, founding year
   ───────────────────────────────────────────────────────────────────────── */
export function CrestIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 280" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <path
        d="M120 18 L214 46 V138 C214 200 174 244 120 262 C66 244 26 200 26 138 V46 Z"
        fill="url(#fb-panel)"
        stroke={GREEN}
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      <path
        d="M120 32 L202 56 V138 C202 192 168 232 120 248 C72 232 38 192 38 138 V56 Z"
        stroke={HAIR}
        strokeWidth="1.2"
        fill="none"
      />
      {/* Stripes */}
      <g fill={GREEN} fillOpacity="0.14">
        <path d="M58 60 H80 V226 L58 238 Z" />
        <path d="M100 60 H122 V248 L100 250 Z" />
        <path d="M142 60 H164 V238 L142 226 Z" />
        <path d="M184 60 H202 V226 L184 212 Z" />
      </g>
      {/* Chevron */}
      <path d="M60 150 L120 108 L180 150 L180 172 L120 132 L60 172 Z" fill={GREEN} fillOpacity="0.65" />
      {/* Star */}
      <path
        d="M120 58 L128 78 L150 80 L133 94 L138 116 L120 104 L102 116 L107 94 L90 80 L112 78 Z"
        fill="url(#fb-gold)"
      />
      <text
        x="120"
        y="200"
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
        y="220"
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
   Whistle — refereeing authority, used for trial/decision states
   ───────────────────────────────────────────────────────────────────────── */
export function WhistleIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 300" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <ellipse cx="180" cy="160" rx="150" ry="110" fill="url(#fb-bloom)" />
      <ellipse cx="186" cy="252" rx="110" ry="16" fill="#000" fillOpacity="0.4" />

      {/* Body */}
      <path
        d="M92 138 C92 108 118 88 152 88 H236 C276 88 300 112 300 146 C300 186 270 210 232 210 H160 C122 210 92 184 92 152 Z"
        fill="url(#fb-metal)"
        stroke="#7c8899"
        strokeWidth="1.4"
      />
      <path
        d="M92 148 C92 118 118 96 152 96 H236 C270 96 292 118 292 148 C292 152 291 156 290 160 H94 C93 156 92 152 92 148 Z"
        fill="url(#fb-glass)"
      />

      {/* Mouthpiece */}
      <path d="M300 128 H326 C334 128 340 134 340 142 V158 C340 166 334 172 326 172 H300 Z" fill="url(#fb-metal)" stroke="#7c8899" strokeWidth="1.2" />

      {/* Cork ball */}
      <circle cx="168" cy="160" r="26" fill="#0a1220" stroke={GREEN} strokeOpacity="0.45" strokeWidth="1.5" />
      <circle cx="168" cy="160" r="10" fill={GREEN} fillOpacity="0.55" />

      {/* Air waves */}
      <g stroke={GREEN} strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round">
        <path d="M62 118 C44 138 44 178 62 198" />
        <path d="M40 100 C16 132 16 186 40 216" strokeOpacity="0.3" />
      </g>

      {/* Lanyard */}
      <path d="M232 96 C244 66 268 52 292 58" stroke="#8f9dae" strokeWidth="4" strokeLinecap="round" />
      <rect x="286" y="48" width="22" height="16" rx="3" fill="#16202f" stroke={HAIR} />

      <text x="20" y="284" fill="#64748b" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
        FINAL WHISTLE · STATUS LOCKED
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Jersey — shirt with number, used for squad slots
   ───────────────────────────────────────────────────────────────────────── */
export function JerseyIllustration({ className, number = '10' }: { className?: string; number?: string }) {
  return (
    <svg viewBox="0 0 260 260" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      {/* Sleeves */}
      <path d="M64 56 L18 92 L44 140 L76 122 Z" fill="#101a28" stroke={HAIR} strokeWidth="1.3" />
      <path d="M196 56 L242 92 L216 140 L184 122 Z" fill="#101a28" stroke={HAIR} strokeWidth="1.3" />
      {/* Body */}
      <path
        d="M64 44 H196 L204 96 C206 150 200 196 196 226 H64 C60 196 54 150 56 96 Z"
        fill="url(#fb-panel)"
        stroke={HAIR}
        strokeWidth="1.3"
      />
      {/* Collar */}
      <path d="M104 44 C112 62 148 62 156 44 L148 36 H112 Z" fill="#16202f" stroke={GREEN} strokeOpacity="0.45" strokeWidth="1.2" />
      {/* Chest band */}
      <path d="M56 140 C126 132 134 132 204 140 L204 156 C134 148 126 148 56 156 Z" fill={GREEN} fillOpacity="0.16" />
      {/* Number */}
      <text
        x="130"
        y="204"
        fill={GREEN}
        fontSize="72"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="-2"
        fontFamily="Space Grotesk, sans-serif"
        opacity="0.92"
      >
        {number}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Video player frame — clip with reviewable AI tags
   ───────────────────────────────────────────────────────────────────────── */
export function ClipReviewIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 340" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      {SHARED}
      <rect x="0.5" y="0.5" width="459" height="339" rx="16" stroke={HAIR} />
      <rect x="22" y="22" width="416" height="206" rx="10" fill="#05090f" stroke={HAIR} />

      {/* Turf inside the frame */}
      <rect x="22" y="132" width="416" height="96" fill="url(#fb-turf)" />
      <g stroke="#e8f2f8" strokeOpacity="0.2" strokeWidth="1.6">
        <path d="M22 180 H438" />
        <ellipse cx="230" cy="180" rx="48" ry="13" />
      </g>

      {/* Subject marker */}
      <circle cx="176" cy="164" r="13" stroke={GREEN} strokeOpacity="0.7" strokeWidth="1.6" />
      <circle cx="176" cy="158" r="4" fill={GREEN} fillOpacity="0.7" />
      <path d="M170 173 a6 6 0 0 1 12 0" fill={GREEN} fillOpacity="0.45" />
      <path d="M189 164 H236" stroke={GREEN} strokeOpacity="0.4" strokeWidth="1.2" strokeDasharray="4 4" />

      {/* Play control */}
      <circle cx="366" cy="62" r="22" fill={GREEN} fillOpacity="0.12" stroke={GREEN} strokeOpacity="0.5" />
      <path d="M360 52 L376 62 L360 72 Z" fill={GREEN} />

      {/* Timeline */}
      <rect x="22" y="240" width="416" height="4" rx="2" fill="#94a3b8" fillOpacity="0.14" />
      <rect x="22" y="240" width="168" height="4" rx="2" fill={GREEN} fillOpacity="0.85" />
      <circle cx="190" cy="242" r="5" fill={GREEN} />

      {/* Reviewable tags */}
      {['Right foot · visible', 'Attacking third', 'Passing sequence', 'Wide framing'].map((tag, i) => (
        <g key={tag} transform={`translate(${22 + (i % 2) * 212} ${262 + Math.floor(i / 2) * 34})`}>
          <rect width="200" height="26" rx="13" fill={VIOLET} fillOpacity="0.08" stroke={VIOLET} strokeOpacity="0.28" />
          <circle cx="14" cy="13" r="3" fill={VIOLET} />
          <text x="26" y="17" fill="#c4b5fd" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            {tag}
          </text>
        </g>
      ))}
      <text
        x="438"
        y="236"
        fill="#64748b"
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
   Onboarding step markers — abstracted glyphs for the guided flow
   ───────────────────────────────────────────────────────────────────────── */
export function StepGlyph({ tone = 'brand' }: { tone?: 'brand' | 'emerald' | 'sky' | 'violet' }) {
  const color =
    tone === 'brand' ? GREEN : tone === 'emerald' ? EMERALD : tone === 'sky' ? SKY : VIOLET;
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="39" rx="10" stroke={HAIR} />
      <circle cx="20" cy="20" r="11" stroke={color} strokeOpacity="0.35" />
      <circle cx="20" cy="20" r="4" fill={color} fillOpacity="0.85" />
      <path d="M20 4 V9 M20 31 V36 M4 20 H9 M31 20 H36" stroke={color} strokeOpacity="0.45" strokeWidth="1.4" />
    </svg>
  );
}

export function PitchSlotIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <rect x="6" y="6" width="188" height="128" rx="8" fill="url(#fb-turf)" fillOpacity="0.30" stroke={HAIR} />
      <g stroke={HAIR} strokeWidth="1.2">
        <path d="M100 6 V134" />
        <circle cx="100" cy="70" r="20" />
        <rect x="6" y="42" width="24" height="56" />
        <rect x="170" y="42" width="24" height="56" />
      </g>
      <circle cx="100" cy="70" r="3.5" fill={GREEN} />
    </svg>
  );
}