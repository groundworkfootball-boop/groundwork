import { cn } from '../ui/cn';

/**
 * GROUNDWORK illustration set — hand-authored SVG.
 * Every shape is drawn explicitly: layered gradients, perspective geometry,
 * depth shadows and consistent hairlines. No third-party assets.
 */

const HAIR = 'rgba(148,163,184,0.22)';
const HAIR_SOFT = 'rgba(148,163,184,0.12)';

/* ─────────────────────────────────────────────────────────────────────────
   Stadium at night — perspective pitch with floodlights and crowd depth
   ───────────────────────────────────────────────────────────────────────── */
export function StadiumIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 720 460" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050a14" />
          <stop offset="55%" stopColor="#0a1526" />
          <stop offset="100%" stopColor="#122238" />
        </linearGradient>
        <linearGradient id="st-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d6b45" />
          <stop offset="45%" stopColor="#175638" />
          <stop offset="100%" stopColor="#0c2f20" />
        </linearGradient>
        <linearGradient id="st-stand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16233a" />
          <stop offset="100%" stopColor="#0a1220" />
        </linearGradient>
        <radialGradient id="st-flood" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fffdf2" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#e8f5c8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ccff00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="st-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4ffe0" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#e8ffc0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f4ffe0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="st-pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ccff00" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ccff00" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="st-vignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050a14" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#050a14" stopOpacity="0" />
          <stop offset="100%" stopColor="#050a14" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id="st-clip">
          <rect width="720" height="460" rx="20" />
        </clipPath>
      </defs>

      <g clipPath="url(#st-clip)">
        <rect width="720" height="460" fill="url(#st-sky)" />

        {/* Distant stand silhouette */}
        <path d="M0 196 L720 196 L720 214 L0 214 Z" fill="url(#st-stand)" />
        <g opacity="0.5">
          {Array.from({ length: 36 }).map((_, i) => (
            <rect key={i} x={8 + i * 20} y={200} width="9" height="4" rx="1" fill="#2b3d5c" />
          ))}
        </g>

        {/* Pitch */}
        <path d="M0 214 L720 214 L720 460 L0 460 Z" fill="url(#st-turf)" />

        {/* Light pools on the turf */}
        <ellipse cx="96" cy="330" rx="170" ry="56" fill="url(#st-pool)" />
        <ellipse cx="624" cy="330" rx="170" ry="56" fill="url(#st-pool)" />
        <ellipse cx="360" cy="300" rx="210" ry="62" fill="url(#st-pool)" opacity="0.8" />

        {/* Floodlight beams — drawn over the pitch so they read as light */}
        <path d="M96 60 L-30 340 L222 340 Z" fill="url(#st-beam)" />
        <path d="M624 60 L498 340 L750 340 Z" fill="url(#st-beam)" />
        <path d="M300 44 L228 340 L372 340 Z" fill="url(#st-beam)" opacity="0.75" />
        <path d="M420 44 L348 340 L492 340 Z" fill="url(#st-beam)" opacity="0.75" />

        {/* Mow stripes in perspective */}
        <g opacity="0.5">
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 214 + i * 28;
            return <rect key={i} x="0" y={y} width="720" height="14" fill="#ffffff" fillOpacity={i % 2 === 0 ? 0.022 : 0} />;
          })}
        </g>

        {/* Pitch markings in perspective — above the beams for legibility */}
        <g stroke="#eef6fb" strokeOpacity="0.72" strokeWidth="2.4" fill="none">
          <path d="M-40 460 L150 214" />
          <path d="M760 460 L570 214" />
          <path d="M0 300 L720 300" />
          <ellipse cx="360" cy="300" rx="86" ry="26" />
          <path d="M232 214 L232 258 L488 258 L488 214" />
          <path d="M300 214 L300 232 L420 232 L420 214" />
        </g>
        <circle cx="360" cy="300" r="3" fill="#eef6fb" fillOpacity="0.6" />

        {/* Floodlight glows */}
        <circle cx="96" cy="60" r="120" fill="url(#st-flood)" />
        <circle cx="624" cy="60" r="120" fill="url(#st-flood)" />
        <circle cx="300" cy="44" r="86" fill="url(#st-flood)" opacity="0.7" />
        <circle cx="420" cy="44" r="86" fill="url(#st-flood)" opacity="0.7" />

        {/* Floodlight housings */}
        {[
          [96, 60],
          [624, 60],
          [300, 44],
          [420, 44],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x - 22} y={y - 7} width="44" height="14" rx="3" fill="#1b2a44" stroke="#2f4463" strokeWidth="1" />
            {Array.from({ length: 4 }).map((_, j) => (
              <rect key={j} x={x - 18 + j * 10} y={y - 4} width="7" height="8" rx="1.5" fill="#f6ffe4" fillOpacity="0.9" />
            ))}
          </g>
        ))}

        {/* Player markers with deterministic link lines */}
        <g>
          <path d="M250 330 L360 292 L470 344" stroke="#ccff00" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="250" cy="330" r="30" stroke="#ccff00" strokeOpacity="0.14" strokeWidth="1.5" />
          <circle cx="250" cy="330" r="17" stroke="#ccff00" strokeOpacity="0.3" strokeWidth="1.5" />
          <circle cx="250" cy="330" r="8" fill="#ccff00" fillOpacity="0.9" />
          <circle cx="360" cy="292" r="24" stroke="#38bdf8" strokeOpacity="0.16" strokeWidth="1.5" />
          <circle cx="360" cy="292" r="6" fill="#38bdf8" fillOpacity="0.85" />
          <circle cx="470" cy="344" r="24" stroke="#a78bfa" strokeOpacity="0.16" strokeWidth="1.5" />
          <circle cx="470" cy="344" r="6" fill="#a78bfa" fillOpacity="0.85" />
        </g>

        <rect width="720" height="460" fill="url(#st-vignette)" opacity="0.75" />
      </g>
      <rect x="0.5" y="0.5" width="719" height="459" rx="20" stroke={HAIR} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Player dossier card — layered profile with attribute bars
   ───────────────────────────────────────────────────────────────────────── */
export function DossierIllustration({ className }: { className?: string }) {
  const rows = [
    { label: 'Position', pct: 100, color: '#ccff00' },
    { label: 'Level', pct: 92, color: '#34d399' },
    { label: 'Attributes', pct: 85, color: '#a78bfa' },
    { label: 'Distance', pct: 78, color: '#38bdf8' },
    { label: 'Availability', pct: 70, color: '#fbbf24' },
  ];

  return (
    <svg viewBox="0 0 460 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="ds-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a44" />
          <stop offset="100%" stopColor="#0a1220" />
        </linearGradient>
        <linearGradient id="ds-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ccff00" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id="ds-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ccff00" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ccff00" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="230" cy="200" rx="210" ry="170" fill="url(#ds-glow)" />

      {/* Back card (depth) */}
      <rect x="46" y="34" width="368" height="330" rx="18" fill="#0d1728" stroke={HAIR_SOFT} transform="rotate(-2 230 200)" />

      {/* Main card */}
      <rect x="34" y="26" width="392" height="340" rx="18" fill="url(#ds-card)" stroke={HAIR} />

      {/* Header band */}
      <path d="M34 44 a18 18 0 0 1 18 -18 h356 a18 18 0 0 1 18 18 v56 h-392 z" fill="url(#ds-head)" />
      <line x1="34" y1="100" x2="426" y2="100" stroke={HAIR_SOFT} />

      {/* Avatar */}
      <circle cx="76" cy="63" r="21" fill="#0a1220" stroke="#ccff00" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="76" cy="57" r="7" fill="#ccff00" fillOpacity="0.55" />
      <path d="M62 76 a14 14 0 0 1 28 0" fill="#ccff00" fillOpacity="0.35" />

      <text x="110" y="56" fill="#ffffff" fontSize="14" fontWeight="700" letterSpacing="-0.2">Alex Morgan</text>
      <text x="110" y="73" fill="#94a3b8" fontSize="9.5" fontWeight="600" letterSpacing="1.2">CENTRAL MIDFIELDER · STEP 4</text>

      {/* Verified pill */}
      <rect x="330" y="46" width="76" height="22" rx="11" fill="#34d399" fillOpacity="0.12" stroke="#34d399" strokeOpacity="0.35" />
      <circle cx="343" cy="57" r="3" fill="#34d399" />
      <text x="352" y="60.5" fill="#6ee7b7" fontSize="8.5" fontWeight="700" letterSpacing="0.6">VERIFIED</text>

      {/* Score block */}
      <text x="46" y="146" fill="#64748b" fontSize="8.5" fontWeight="700" letterSpacing="1.6">MATCH SCORE</text>
      <text x="46" y="188" fill="#ffffff" fontSize="42" fontWeight="700" letterSpacing="-2">87.4</text>
      <text x="132" y="188" fill="#ccff00" fontSize="15" fontWeight="700">%</text>

      {/* Ring */}
      <g transform="translate(340 158)">
        <circle r="34" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="7" fill="none" />
        <circle
          r="34"
          stroke="#ccff00"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="213.6"
          strokeDashoffset="27"
          transform="rotate(-90)"
        />
        <text y="4" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">87%</text>
      </g>

      <line x1="46" y1="206" x2="414" y2="206" stroke={HAIR_SOFT} />

      {/* Attribute rows */}
      {rows.map((row, i) => (
        <g key={row.label} transform={`translate(46 ${228 + i * 26})`}>
          <text x="0" y="0" fill="#cbd5e1" fontSize="10" fontWeight="500">{row.label}</text>
          <text x="368" y="0" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="end">{row.pct}%</text>
          <rect x="0" y="7" width="368" height="4" rx="2" fill="#94a3b8" fillOpacity="0.12" />
          <rect x="0" y="7" width={(368 * row.pct) / 100} height="4" rx="2" fill={row.color} fillOpacity="0.9" />
        </g>
      ))}

      {/* Footer */}
      <line x1="34" y1="352" x2="426" y2="352" stroke={HAIR_SOFT} />
      <circle cx="50" cy="362" r="3" fill="#34d399" />
      <text x="60" y="365.5" fill="#64748b" fontSize="8" fontWeight="600" letterSpacing="1">CONFIG v3 · AUDITABLE · REPRODUCIBLE</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Safeguarding — layered shield with consent gate
   ───────────────────────────────────────────────────────────────────────── */
export function SafeguardingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="sg-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.30" />
          <stop offset="55%" stopColor="#10b981" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.03" />
        </linearGradient>
        <radialGradient id="sg-glow" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="10" y="10" width="440" height="380" rx="18" fill="#0a1220" stroke={HAIR} />
      <ellipse cx="230" cy="180" rx="180" ry="150" fill="url(#sg-glow)" />

      {/* Concentric rings */}
      <circle cx="230" cy="172" r="118" stroke="#34d399" strokeOpacity="0.10" strokeWidth="1.5" />
      <circle cx="230" cy="172" r="94" stroke="#34d399" strokeOpacity="0.16" strokeWidth="1.5" strokeDasharray="4 6" />
      <circle cx="230" cy="172" r="70" stroke="#34d399" strokeOpacity="0.22" strokeWidth="1.5" />

      {/* Shield */}
      <path
        d="M230 78 L296 104 V166 C296 212 268 244 230 258 C192 244 164 212 164 166 V104 Z"
        fill="url(#sg-shield)"
        stroke="#34d399"
        strokeOpacity="0.7"
        strokeWidth="2"
      />
      <path
        d="M230 92 L284 113 V166 C284 205 261 232 230 244 C199 232 176 205 176 166 V113 Z"
        stroke="#34d399"
        strokeOpacity="0.22"
        strokeWidth="1"
        fill="none"
      />

      {/* Check */}
      <path d="M204 168 L222 186 L258 148" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Consent gate rows */}
      <g transform="translate(34 296)">
        <rect width="392" height="72" rx="12" fill="#34d399" fillOpacity="0.05" stroke="#34d399" strokeOpacity="0.18" />
        {[
          { label: 'Guardian consent', state: 'Granted' },
          { label: 'Club youth verification', state: 'Live' },
          { label: 'Profile searchable', state: 'Enabled' },
        ].map((row, i) => (
          <g key={row.label} transform={`translate(16 ${14 + i * 20})`}>
            <circle cx="4" cy="0" r="3" fill="#34d399" />
            <text x="16" y="3.5" fill="#a7f3d0" fontSize="9.5" fontWeight="500">{row.label}</text>
            <text x="360" y="3.5" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="end">{row.state}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Recruitment board — candidate rows with scores
   ───────────────────────────────────────────────────────────────────────── */
export function RecruitmentIllustration({ className }: { className?: string }) {
  const candidates = [
    { pos: 'ST', score: 94, tone: '#ccff00', width: 132 },
    { pos: 'CM', score: 87, tone: '#34d399', width: 108 },
    { pos: 'CB', score: 81, tone: '#38bdf8', width: 92 },
    { pos: 'LW', score: 76, tone: '#a78bfa', width: 78 },
  ];

  return (
    <svg viewBox="0 0 460 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="rc-head" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="10" y="10" width="440" height="380" rx="18" fill="#0a1220" stroke={HAIR} />

      {/* Header */}
      <path d="M10 28 a18 18 0 0 1 18 -18 h404 a18 18 0 0 1 18 18 v40 h-440 z" fill="url(#rc-head)" />
      <text x="34" y="42" fill="#7dd3fc" fontSize="8.5" fontWeight="700" letterSpacing="1.6">RECRUITMENT BOARD</text>
      <text x="34" y="60" fill="#ffffff" fontSize="13" fontWeight="700">Shortlist · Step 4 targets</text>
      <rect x="352" y="34" width="74" height="20" rx="10" fill="#38bdf8" fillOpacity="0.12" stroke="#38bdf8" strokeOpacity="0.3" />
      <text x="389" y="47.5" fill="#7dd3fc" fontSize="8" fontWeight="700" textAnchor="middle" letterSpacing="0.5">4 PLAYERS</text>
      <line x1="10" y1="86" x2="450" y2="86" stroke={HAIR_SOFT} />

      {/* Candidate rows */}
      {candidates.map((c, i) => (
        <g key={c.pos} transform={`translate(34 ${108 + i * 66})`}>
          <rect width="392" height="54" rx="10" fill="#ffffff" fillOpacity="0.028" stroke={HAIR_SOFT} />
          <circle cx="30" cy="27" r="16" fill={c.tone} fillOpacity="0.14" />
          <circle cx="30" cy="27" r="16" stroke={c.tone} strokeOpacity="0.4" />
          <text x="30" y="31" fill={c.tone} fontSize="10" fontWeight="700" textAnchor="middle">{c.pos}</text>

          <rect x="58" y="16" width={c.width} height="6" rx="3" fill="#e2e8f0" fillOpacity="0.5" />
          <rect x="58" y="30" width={c.width * 0.62} height="4" rx="2" fill="#94a3b8" fillOpacity="0.28" />

          <rect x="300" y="15" width="76" height="24" rx="12" fill={c.tone} fillOpacity="0.12" />
          <text x="338" y="31" fill={c.tone} fontSize="10" fontWeight="700" textAnchor="middle">{c.score}%</text>
        </g>
      ))}

      {/* Footer */}
      <line x1="10" y1="372" x2="450" y2="372" stroke={HAIR_SOFT} />
      <circle cx="30" cy="384" r="3" fill="#38bdf8" />
      <text x="40" y="387.5" fill="#64748b" fontSize="8" fontWeight="600" letterSpacing="1">PRECOMPUTED · CURSOR PAGINATED · CLUB-SCOPED</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Video analysis — frame with observable tags
   ───────────────────────────────────────────────────────────────────────── */
export function VideoAnalysisIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 400" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="va-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d6b45" />
          <stop offset="100%" stopColor="#0c2f20" />
        </linearGradient>
        <linearGradient id="va-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="10" y="10" width="440" height="380" rx="18" fill="#0a1220" stroke={HAIR} />

      {/* Video frame */}
      <rect x="34" y="34" width="392" height="212" rx="12" fill="#050a14" stroke={HAIR} />
      <rect x="34" y="150" width="392" height="96" fill="url(#va-turf)" />
      <line x1="34" y1="150" x2="426" y2="150" stroke="#e8f2f8" strokeOpacity="0.18" />
      <ellipse cx="230" cy="150" rx="52" ry="14" stroke="#e8f2f8" strokeOpacity="0.18" fill="none" />

      {/* Scan line */}
      <rect x="34" y="120" width="392" height="60" fill="url(#va-scan)" />

      {/* Play button */}
      <circle cx="230" cy="120" r="30" fill="#ccff00" fillOpacity="0.12" stroke="#ccff00" strokeOpacity="0.5" />
      <path d="M222 108 L242 120 L222 132 Z" fill="#ccff00" />

      {/* Corner brackets */}
      <g stroke="#a78bfa" strokeOpacity="0.6" strokeWidth="2" fill="none">
        <path d="M46 46 h16 M46 46 v16" />
        <path d="M414 46 h-16 M414 46 v16" />
        <path d="M46 234 h16 M46 234 v-16" />
        <path d="M414 234 h-16 M414 234 v-16" />
      </g>

      {/* Timeline */}
      <rect x="34" y="258" width="392" height="4" rx="2" fill="#94a3b8" fillOpacity="0.14" />
      <rect x="34" y="258" width="148" height="4" rx="2" fill="#a78bfa" fillOpacity="0.8" />
      <circle cx="182" cy="260" r="5" fill="#a78bfa" />

      {/* Tags */}
      <g transform="translate(34 282)">
        {['Attacking third', 'Right foot', 'Passing sequence'].map((tag, i) => (
          <g key={tag} transform={`translate(${i * 128} 0)`}>
            <rect width="120" height="26" rx="13" fill="#a78bfa" fillOpacity="0.10" stroke="#a78bfa" strokeOpacity="0.28" />
            <text x="60" y="17" fill="#c4b5fd" fontSize="9" fontWeight="600" textAnchor="middle">{tag}</text>
          </g>
        ))}
      </g>

      {/* Footer */}
      <line x1="10" y1="336" x2="450" y2="336" stroke={HAIR_SOFT} />
      <circle cx="30" cy="356" r="3" fill="#a78bfa" />
      <text x="40" y="359.5" fill="#64748b" fontSize="8" fontWeight="600" letterSpacing="1">AI-ASSISTED · REVIEWABLE · NEVER SCORED</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Small empty-state pitch
   ───────────────────────────────────────────────────────────────────────── */
export function EmptyPitchIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <rect x="8" y="8" width="184" height="124" rx="10" stroke={HAIR} strokeWidth="1.5" />
      <line x1="100" y1="8" x2="100" y2="132" stroke={HAIR} strokeWidth="1.5" />
      <circle cx="100" cy="70" r="22" stroke={HAIR} strokeWidth="1.5" />
      <rect x="8" y="42" width="26" height="56" stroke={HAIR} strokeWidth="1.5" />
      <rect x="166" y="42" width="26" height="56" stroke={HAIR} strokeWidth="1.5" />
      <circle cx="100" cy="70" r="4" fill="#ccff00" fillOpacity="0.5" />
    </svg>
  );
}


