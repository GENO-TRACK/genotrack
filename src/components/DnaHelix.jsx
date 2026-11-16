/* ---------- 3D-style DNA helix (built once, shared by Login and Signup) ---------- */
const HELIX_HEIGHT = 1000;
const HELIX_CENTER = 200;
const HELIX_RADIUS = 110;
const HELIX_TURNS = 3.2;
const HELIX_RUNGS = 34;

function buildStrandPath(phaseOffset) {
  const steps = 160;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * HELIX_HEIGHT;
    const angle = t * HELIX_TURNS * Math.PI * 2 + phaseOffset;
    const x = HELIX_CENTER + Math.sin(angle) * HELIX_RADIUS;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}

const STRAND_A = buildStrandPath(0);
const STRAND_B = buildStrandPath(Math.PI);

const HELIX_RUNG_DATA = Array.from({ length: HELIX_RUNGS }).map((_, i) => {
  const t = (i + 0.5) / HELIX_RUNGS;
  const y = t * HELIX_HEIGHT;
  const angle = t * HELIX_TURNS * Math.PI * 2;
  const s = Math.sin(angle);
  const depth = Math.cos(angle); // -1 (back) to 1 (front)
  const depthNorm = (depth + 1) / 2;
  return {
    y,
    x1: HELIX_CENTER + s * HELIX_RADIUS,
    x2: HELIX_CENTER - s * HELIX_RADIUS,
    radius1: 3 + depthNorm * 4,
    radius2: 3 + (1 - depthNorm) * 4,
    opacity1: 0.35 + depthNorm * 0.65,
    opacity2: 0.35 + (1 - depthNorm) * 0.65,
    rungOpacity: 0.15 + Math.abs(depth) * 0.35,
  };
});

export default function DnaHelix() {
  return (
    <svg
      className="dna-helix"
      viewBox="0 0 400 1000"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <defs>
        <linearGradient id="dnaStrandA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="dnaStrandB" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="50%" stopColor="#0f9d8f" />
          <stop offset="100%" stopColor="#99f6e4" />
        </linearGradient>
        <radialGradient id="dnaNodeGlow">
          <stop offset="0%" stopColor="#ccfbf1" />
          <stop offset="55%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </radialGradient>
        <filter id="dnaGlow" x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rungs */}
      <g>
        {HELIX_RUNG_DATA.map((r, i) => (
          <line
            key={`rung-${i}`}
            x1={r.x1}
            y1={r.y}
            x2={r.x2}
            y2={r.y}
            stroke="#2dd4bf"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity={r.rungOpacity}
          />
        ))}
      </g>

      {/* Glowing ribbons */}
      <g
        filter="url(#dnaGlow)"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={STRAND_A} stroke="url(#dnaStrandA)" strokeWidth="5" />
        <path d={STRAND_B} stroke="url(#dnaStrandB)" strokeWidth="5" />
      </g>

      {/* Nodes: bigger and brighter when facing front */}
      <g>
        {HELIX_RUNG_DATA.map((r, i) => (
          <g key={`node-${i}`}>
            <circle
              cx={r.x1}
              cy={r.y}
              r={r.radius1 * 2.4}
              fill="url(#dnaNodeGlow)"
              opacity={r.opacity1 * 0.6}
            />
            <circle
              cx={r.x1}
              cy={r.y}
              r={r.radius1}
              fill="#99f6e4"
              opacity={r.opacity1}
            />
            <circle
              cx={r.x2}
              cy={r.y}
              r={r.radius2 * 2.4}
              fill="url(#dnaNodeGlow)"
              opacity={r.opacity2 * 0.6}
            />
            <circle
              cx={r.x2}
              cy={r.y}
              r={r.radius2}
              fill="#99f6e4"
              opacity={r.opacity2}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
