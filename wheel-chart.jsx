/* ============================================================
   WheelChart — radar/spider chart for 6 life areas
   Drag a vertex or click an axis to change score.
   Exports: window.WheelChart, window.heatColor
   ============================================================ */
const { useRef, useState } = React;

const CX    = 200;           /* SVG center X (user units) */
const CY    = 200;           /* SVG center Y (user units) */
const MAX_R = 132;            /* outer ring radius */
const LABEL_R = MAX_R + 46;  /* label distance from center = 178 */
const RINGS = [2, 4, 6, 8, 10];
/* viewBox: "-70 -50 540 500" — generous margin so labels never clip */

/* ── Olive heatColor — kept for cards / badges / HeatBar ── */
function heatColor(score, alpha) {
  const t = Math.max(0, Math.min(1, (score - 1) / 9));
  const r = Math.round(232 - t * 122);
  const g = Math.round(232 - t * 123);
  const b = Math.round(200 - t * 176);
  return alpha !== undefined ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

/* Radian angle for axis i  (0 = top, clockwise) */
function aRad(i, n) { return (i / n) * 2 * Math.PI - Math.PI / 2; }

/* SVG point on axis i at radius r */
function axPt(i, n, r) {
  const a = aRad(i, n);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

/* "x,y x,y …" string for a regular n-gon at radius r */
function polyPts(r, n) {
  return Array.from({ length: n }, (_, i) => {
    const { x, y } = axPt(i, n, r);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/* Polygon points from current scores */
function scorePts(areas, scores) {
  return areas.map((a, i) => {
    const r = ((scores[a.id] || 1) / 10) * MAX_R;
    const { x, y } = axPt(i, areas.length, r);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/* Score (1–10) from distance vector (dx, dy) from center */
function ds(dx, dy) {
  return Math.max(1, Math.min(10, Math.round((Math.hypot(dx, dy) / MAX_R) * 10)));
}

/* ── Design tokens ── */
const C_POLY_FILL   = 'rgba(162,160,67,0.18)';
const C_POLY_STROKE = '#8a8930';
const C_VERTEX      = '#a2a043';
const C_GRID        = '#d6d5b4';

/* ── WheelChart ─────────────────────────────────────────── */
function WheelChart({ areas, scores, priorities, onScoreChange }) {
  const n      = areas.length;
  const svgRef = useRef(null);
  const dragId = useRef(null);           /* areaId being dragged */
  const [isDragging, setIsDragging] = useState(false);

  /* Client pixel → SVG user-unit coordinate
     viewBox: x=-70, y=-50, w=540, h=500 */
  function toSVG(clientX, clientY) {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (540 / rect.width)  - 70,
      y: (clientY - rect.top)  * (500 / rect.height) - 50,
    };
  }

  function evXY(e) {
    const src = e.touches ? e.touches[0] : e;
    return toSVG(src.clientX, src.clientY);
  }

  function onMove(e) {
    if (!dragId.current) return;
    e.preventDefault();
    const { x, y } = evXY(e);
    onScoreChange(dragId.current, ds(x - CX, y - CY));
  }

  function onUp() {
    dragId.current = null;
    setIsDragging(false);
  }

  function onStart(areaId, e) {
    if (e.preventDefault) e.preventDefault();
    dragId.current = areaId;
    setIsDragging(true);
  }

  function onAxisClick(e, areaId) {
    const { x, y } = evXY(e);
    onScoreChange(areaId, ds(x - CX, y - CY));
  }

  return (
    <svg
      ref={svgRef}
      viewBox="-70 -50 540 500"
      style={{ width: '100%', maxWidth: 360, display: 'block', margin: '0 auto', userSelect: 'none' }}
      onMouseMove={onMove}    onMouseUp={onUp}    onMouseLeave={onUp}
      onTouchMove={onMove}    onTouchEnd={onUp}   onTouchCancel={onUp}
    >
      {/* ── Concentric circular grid ── */}
      {RINGS.map((ring) => (
        <circle
          key={ring}
          cx={CX} cy={CY}
          r={(ring / 10) * MAX_R}
          fill="none"
          stroke={C_GRID}
          strokeWidth={ring === 10 ? 1.3 : 0.7}
          strokeDasharray={ring < 10 ? '3,6' : undefined}
          opacity={ring === 10 ? 1 : 0.6}
        />
      ))}

      {/* ── Axis lines + fat invisible click strips ── */}
      {areas.map((area, i) => {
        const outer = axPt(i, n, MAX_R);
        return (
          <g key={`ax-${area.id}`}>
            {/* Visible thin line */}
            <line
              x1={CX} y1={CY} x2={outer.x} y2={outer.y}
              stroke={C_GRID} strokeWidth={0.8} opacity={0.65}
              style={{ pointerEvents: 'none' }}
            />
            {/* Fat transparent overlay — wide hit zone for click */}
            <line
              x1={CX} y1={CY} x2={outer.x} y2={outer.y}
              stroke="transparent" strokeWidth={30}
              style={{ cursor: 'crosshair' }}
              onClick={(e) => onAxisClick(e, area.id)}
            />
          </g>
        );
      })}

      {/* ── Scale numbers along axis 0 (top) ── */}
      {RINGS.map((ring) => {
        const { x, y } = axPt(0, n, (ring / 10) * MAX_R);
        return (
          <text
            key={`sc-${ring}`}
            x={x + 5} y={y + 1}
            textAnchor="start"
            style={{ fontSize: '9px', fontFamily: 'Onest,sans-serif', fill: '#bbb', pointerEvents: 'none' }}
          >{ring}</text>
        );
      })}

      {/* ── Score polygon (fills behind vertices) ── */}
      <polygon
        points={scorePts(areas, scores)}
        fill={C_POLY_FILL}
        stroke={C_POLY_STROKE}
        strokeWidth={2.5}
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
      />

      {/* ── Draggable vertex dots ── */}
      {areas.map((area, i) => {
        const r   = ((scores[area.id] || 1) / 10) * MAX_R;
        const { x, y } = axPt(i, n, r);
        const draggingThis = isDragging && dragId.current === area.id;
        return (
          <g
            key={`vx-${area.id}`}
            style={{
              /* CSS transform in SVG context: px = user units */
              transform: `translate(${x}px, ${y}px)`,
              transition: draggingThis ? 'none' : 'transform 0.28s ease',
            }}
          >
            {/* 44 × 44 touch/click target (r = 22) — Apple HIG */}
            <circle
              r={22} fill="transparent"
              style={{ cursor: 'grab' }}
              onMouseDown={(e) => onStart(area.id, e)}
              onTouchStart={(e) => onStart(area.id, e)}
            />
            {/* Visible dot */}
            <circle
              r={7} fill={C_VERTEX} stroke="#fff" strokeWidth={2.5}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      })}

      {/* ── Labels outside the outer ring ── */}
      {areas.map((area, i) => {
        const a    = aRad(i, n);
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const lx   = CX + LABEL_R * cosA;
        const ly   = CY + LABEL_R * sinA;

        /* text-anchor based on left/right/center of wheel */
        const anchor = cosA > 0.25 ? 'start' : cosA < -0.25 ? 'end' : 'middle';
        /* small nudge for pure top/bottom axes so text doesn't sit on the outer ring */
        const dy = sinA < -0.65 ? -5 : sinA > 0.65 ? 5 : 0;

        const isPri = priorities.includes(area.id);
        const sc    = scores[area.id] || 0;

        return (
          <text
            key={`lb-${area.id}`}
            x={lx} y={ly + dy}
            textAnchor={anchor}
            dominantBaseline="middle"
            style={{
              fontSize: '11.5px',
              fontFamily: 'Onest, sans-serif',
              fontWeight: isPri ? 700 : 500,
              fill: isPri ? C_VERTEX : '#3A2E22',
              pointerEvents: 'none',
            }}
          >{isPri ? '★ ' : ''}{area.shortName || area.name} · {sc}</text>
        );
      })}
    </svg>
  );
}

Object.assign(window, { WheelChart, heatColor });
