/* ============================================================
   WheelChart — circular heatmap wheel for 6 life areas
   One color, saturation = score. Exports: window.WheelChart
   ============================================================ */

const WHEEL_SIZE = 340;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const WHEEL_RADIUS = 125;
const RINGS = [2, 4, 6, 8, 10];

/* Heatmap: single hue (olive green), saturation scales with score */
function heatColor(score, alpha) {
  // score 1 = very pale sage, 10 = deep saturated olive
  const t = Math.max(0, Math.min(1, (score - 1) / 9));
  // Interpolate from pale (#e8e8c8) to rich (#6e6d18)
  const r = Math.round(232 - t * (232 - 110));
  const g = Math.round(232 - t * (232 - 109));
  const b = Math.round(200 - t * (200 - 24));
  if (alpha !== undefined) return `rgba(${r},${g},${b},${alpha})`;
  return `rgb(${r},${g},${b})`;
}

function polarToXY(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: WHEEL_CENTER + radius * Math.cos(rad),
    y: WHEEL_CENTER + radius * Math.sin(rad),
  };
}

function sectorPath(startAngle, endAngle, outerR, innerR) {
  if (outerR < 1) outerR = 1;
  innerR = innerR || 0;
  const s1 = polarToXY(startAngle, outerR);
  const e1 = polarToXY(endAngle, outerR);
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
  if (innerR <= 0) {
    return [
      `M ${WHEEL_CENTER} ${WHEEL_CENTER}`,
      `L ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
      'Z',
    ].join(' ');
  }
  const s2 = polarToXY(endAngle, innerR);
  const e2 = polarToXY(startAngle, innerR);
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

function WheelChart({ areas, scores, priorities, onScoreChange }) {
  const n = areas.length;
  const angleStep = 360 / n;
  const GAP_DEG = 3;

  return (
    <svg
      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
      style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto' }}
    >
      {/* Background rings */}
      {RINGS.map((ring) => (
        <circle
          key={ring}
          cx={WHEEL_CENTER}
          cy={WHEEL_CENTER}
          r={(ring / 10) * WHEEL_RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={ring === 10 ? 1.2 : 0.4}
          strokeDasharray={ring < 10 ? '2,5' : 'none'}
          opacity={0.5}
        />
      ))}

      {/* Full-radius background sectors (light) */}
      {areas.map((area, i) => {
        const startAngle = i * angleStep + GAP_DEG / 2;
        const endAngle = (i + 1) * angleStep - GAP_DEG / 2;
        return (
          <path
            key={`bg-${area.id}`}
            d={sectorPath(startAngle, endAngle, WHEEL_RADIUS)}
            fill={heatColor(1, 0.12)}
            stroke="none"
          />
        );
      })}

      {/* Filled sectors — heatmap color by score */}
      {areas.map((area, i) => {
        const startAngle = i * angleStep + GAP_DEG / 2;
        const endAngle = (i + 1) * angleStep - GAP_DEG / 2;
        const val = scores[area.id] || 0;
        const r = (val / 10) * WHEEL_RADIUS;
        return (
          <path
            key={`sector-${area.id}`}
            d={sectorPath(startAngle, endAngle, r)}
            fill={heatColor(val, 0.55)}
            stroke={heatColor(val)}
            strokeWidth={1.5}
            strokeLinejoin="round"
            style={{ transition: 'all 0.35s ease' }}
          />
        );
      })}

      {/* Sector dividers (white gaps) */}
      {areas.map((_, i) => {
        const angle = i * angleStep;
        const end = polarToXY(angle, WHEEL_RADIUS + 1);
        return (
          <line
            key={`div-${i}`}
            x1={WHEEL_CENTER}
            y1={WHEEL_CENTER}
            x2={end.x}
            y2={end.y}
            stroke="var(--bg)"
            strokeWidth={3}
          />
        );
      })}

      {/* Outer ring */}
      <circle
        cx={WHEEL_CENTER}
        cy={WHEEL_CENTER}
        r={WHEEL_RADIUS}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
      />

      {/* Clickable hit areas for setting score */}
      {areas.map((area, i) => {
        const midAngle = i * angleStep + angleStep / 2;
        return Array.from({ length: 10 }, (_, s) => {
          const score = s + 1;
          const r = (score / 10) * WHEEL_RADIUS;
          const { x, y } = polarToXY(midAngle, r);
          return (
            <circle
              key={`hit-${area.id}-${score}`}
              cx={x}
              cy={y}
              r={11}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => onScoreChange(area.id, score)}
            >
              <title>{area.name}: {score}</title>
            </circle>
          );
        });
      })}

      {/* Labels */}
      {areas.map((area, i) => {
        const midAngle = i * angleStep + angleStep / 2;
        const labelR = WHEEL_RADIUS + 22;
        const { x, y } = polarToXY(midAngle, labelR);
        const isPriority = priorities.includes(area.id);
        const score = scores[area.id] || 0;

        return (
          <g key={`label-${area.id}`}>
            <text
              x={x}
              y={y - 2}
              textAnchor="middle"
              dominantBaseline="auto"
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: isPriority ? 700 : 500,
                fill: isPriority ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              {isPriority ? '★ ' : ''}{area.shortName || area.name}
            </text>
            {/* Score badge — heatmap colored */}
            <circle cx={x} cy={y + 13} r={10} fill={heatColor(score, 0.25)} />
            <text
              x={x}
              y={y + 13}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fill: heatColor(score),
              }}
            >
              {score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* Export heatColor so app can reuse */
Object.assign(window, { WheelChart, heatColor });
