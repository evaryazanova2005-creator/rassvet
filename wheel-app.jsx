/* ============================================================
   WheelApp — split layout: sticky wheel left, cards right
   Depends on: window.WheelChart, window.heatColor
   ============================================================ */

const { useState, useEffect, useCallback, useRef } = React;

const STORAGE_KEY = window.WHEEL_STORAGE_KEY || 'rassvet_wheel_v3';

const DEFAULT_AREAS = [
  { id: 'health',   name: 'Здоровье',       shortName: 'Здоровье',  emoji: '💚' },
  { id: 'career',   name: 'Карьера и дело',  shortName: 'Карьера',   emoji: '🚀' },
  { id: 'finance',  name: 'Финансы',         shortName: 'Финансы',   emoji: '💰' },
  { id: 'relation', name: 'Отношения',       shortName: 'Отношения', emoji: '💞' },
  { id: 'growth',   name: 'Развитие',        shortName: 'Развитие',  emoji: '🌱' },
  { id: 'joy',      name: 'Отдых и радость', shortName: 'Отдых',     emoji: '✨' },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const v2 = localStorage.getItem('rassvet_wheel_v2');
    if (v2) return JSON.parse(v2);
  } catch (e) {}
  return null;
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ── StatusBadge ─────────────────────────────────────── */
function StatusBadge({ score }) {
  let label;
  if (score <= 3) label = 'Нужно внимание';
  else if (score <= 6) label = 'Можно лучше';
  else label = 'Хорошо';

  const color = heatColor(score);
  const bg    = heatColor(score, 0.15);

  return (
    <span style={{
      display: 'inline-block', fontSize: '0.72rem', fontWeight: 600,
      padding: '3px 10px', borderRadius: 999, background: bg, color,
    }}>{label}</span>
  );
}

/* ── HeatBar ─────────────────────────────────────────── */
function HeatBar({ score }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 10 }, (_, i) => {
        const filled = i < score;
        return (
          <div key={i} style={{
            width: 8, height: 20, borderRadius: 3,
            background: filled ? heatColor(score, 0.2 + 0.08 * i) : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        );
      })}
    </div>
  );
}

/* ── GoalItem ────────────────────────────────────────── */
function GoalItem({ goal, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={goal.done}
          onChange={() => onUpdate({ ...goal, done: !goal.done })}
          style={{ accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
        />
        {editing ? (
          <input
            ref={inputRef}
            value={goal.text}
            onChange={(e) => onUpdate({ ...goal, text: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            style={{
              flex: 1, border: 'none', borderBottom: '1px solid var(--accent)',
              background: 'transparent', fontFamily: 'var(--font-body)',
              fontSize: '0.9rem', padding: '2px 0', outline: 'none', color: 'var(--ink)',
            }}
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            style={{
              flex: 1, fontSize: '0.9rem', cursor: 'text',
              textDecoration: goal.done ? 'line-through' : 'none',
              opacity: goal.done ? 0.5 : 1,
            }}
          >{goal.text || 'Нажми, чтобы написать…'}</span>
        )}
        <button
          onClick={onRemove}
          style={{
            background: 'none', border: 'none', color: 'var(--ink-soft)',
            cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', opacity: 0.5,
          }}
          title="Удалить"
        >✕</button>
      </div>
    </div>
  );
}

/* ── AreaCard ─────────────────────────────────────────── */
function AreaCard({ area, score, isPriority, goals, onTogglePriority, onScoreChange, onGoalsChange, onRenameArea }) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => { if (editingName && nameInputRef.current) nameInputRef.current.focus(); }, [editingName]);

  function addGoal() {
    onGoalsChange([...goals, { id: Date.now(), text: '', done: false }]);
  }
  function updateGoal(updated) {
    onGoalsChange(goals.map((g) => (g.id === updated.id ? updated : g)));
  }
  function removeGoal(id) {
    onGoalsChange(goals.filter((g) => g.id !== id));
  }

  const doneCount  = goals.filter((g) => g.done).length;
  const borderLeft = `4px solid ${heatColor(score)}`;

  return (
    <div style={{
      background: isPriority ? 'rgba(162,160,67,0.06)' : 'var(--bg-card)',
      border: `1px solid ${isPriority ? 'var(--accent-soft)' : 'var(--border)'}`,
      borderLeft: borderLeft,
      borderRadius: 'var(--radius)', padding: '18px 20px',
      transition: 'all 0.25s',
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {editingName ? (
              <input
                ref={nameInputRef}
                value={area.name}
                onChange={(e) => onRenameArea(area.id, e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500,
                  color: isPriority ? 'var(--accent)' : 'var(--ink)',
                  border: 'none', borderBottom: '1px solid var(--accent)',
                  background: 'transparent', padding: '0 0 2px', outline: 'none',
                  width: Math.max(80, area.name.length * 10),
                }}
              />
            ) : (
              <span
                onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500,
                  color: isPriority ? 'var(--accent)' : 'var(--ink)',
                  cursor: 'text',
                }}
                title="Двойной клик — переименовать"
              >
                {area.name}
              </span>
            )}
            <StatusBadge score={score} />
            {isPriority && (
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)' }}>★ Приоритет</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <HeatBar score={score} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: heatColor(score) }}>{score}/10</span>
          </div>
          {goals.length > 0 && (
            <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: 4, display: 'block' }}>
              {doneCount}/{goals.length} целей выполнено
            </span>
          )}
        </div>

        <span style={{
          fontSize: '1.2rem', color: 'var(--ink-soft)', transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s', flexShrink: 0,
        }}>›</span>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ marginTop: 16 }}>
          {/* Score slider */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
              Оценка: {score} из 10
            </label>
            <input
              type="range" min={1} max={10} step={1} value={score}
              onChange={(e) => onScoreChange(area.id, parseInt(e.target.value))}
              style={{ width: '100%', accentColor: heatColor(score) }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--ink-soft)', marginTop: 2 }}>
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 999, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--ink-soft)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Переименовать
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePriority(area.id); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 999, border: '1px solid',
                borderColor: isPriority ? 'var(--accent)' : 'var(--border)',
                background: isPriority ? 'var(--accent)' : 'transparent',
                color: isPriority ? '#fff' : 'var(--ink-soft)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {isPriority ? '★ Приоритетная сфера' : '☆ Отметить как приоритет'}
            </button>
          </div>

          {/* Goals */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>Цели и задачи</span>
              <button
                onClick={addGoal}
                style={{
                  background: 'var(--bg-soft)', border: '1px solid var(--border)',
                  borderRadius: 999, padding: '5px 12px', fontFamily: 'var(--font-body)',
                  fontSize: '0.78rem', fontWeight: 500, color: 'var(--accent)', cursor: 'pointer',
                }}
              >+ Добавить</button>
            </div>
            {goals.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                Пока нет целей. Нажми «Добавить», чтобы начать.
              </p>
            )}
            {goals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} onUpdate={updateGoal} onRemove={() => removeGoal(goal.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── InsightsPanel ────────────────────────────────────── */
function InsightsPanel({ areas, scores, priorities }) {
  const entries  = areas.map((a) => ({ ...a, score: scores[a.id] || 0 }));
  const avg      = entries.reduce((s, e) => s + e.score, 0) / entries.length;
  const weakest  = [...entries].sort((a, b) => a.score - b.score).slice(0, 2);
  const strongest= [...entries].sort((a, b) => b.score - a.score).slice(0, 2);
  const gap      = strongest[0].score - weakest[0].score;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(162,160,67,0.08), rgba(196,195,138,0.04))',
      border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius)',
      padding: '20px 22px', marginBottom: 20,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
        Аналитика
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{avg.toFixed(1)}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>Средний балл</div>
        </div>
        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: gap > 5 ? heatColor(2) : 'var(--ink)' }}>{gap}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>Разброс max–min</div>
        </div>
      </div>
      <div style={{ fontSize: '0.84rem', color: 'var(--ink)', lineHeight: 1.55 }}>
        {weakest[0].score <= 3 && (
          <p style={{ marginBottom: 5 }}>⚠️ <strong>{weakest[0].name}</strong> — зона, которая просит внимания.</p>
        )}
        {gap > 5 && (
          <p style={{ marginBottom: 5 }}>📊 Большой разброс — стоит подтянуть слабые стороны.</p>
        )}
        {priorities.length === 0 && (
          <p>💡 Выбери 1–2 приоритетные сферы для фокуса на месяц.</p>
        )}
        {priorities.length > 0 && (
          <p>🎯 Приоритеты: {priorities.map((pid) => {
            const a = areas.find((aa) => aa.id === pid);
            return a ? a.name : '';
          }).join(', ')}</p>
        )}
      </div>
    </div>
  );
}

/* ── WheelApp — split layout ──────────────────────────── */
function WheelApp() {
  const saved = loadState();
  const [scores,      setScores]      = useState(saved?.scores      || Object.fromEntries(DEFAULT_AREAS.map((a) => [a.id, 5])));
  const [priorities,  setPriorities]  = useState(saved?.priorities  || []);
  const [goals,       setGoals]       = useState(saved?.goals       || Object.fromEntries(DEFAULT_AREAS.map((a) => [a.id, []])));
  const [customNames, setCustomNames] = useState(saved?.customNames || {});

  const areas = DEFAULT_AREAS.map((a) => ({
    ...a,
    name:      customNames[a.id] || a.name,
    shortName: customNames[a.id] || a.shortName,
  }));

  useEffect(() => {
    saveState({ scores, priorities, goals, customNames });
  }, [scores, priorities, goals, customNames]);

  const handleScoreChange = useCallback((id, val) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleTogglePriority = useCallback((id) => {
    setPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleGoalsChange = useCallback((areaId, newGoals) => {
    setGoals((prev) => ({ ...prev, [areaId]: newGoals }));
  }, []);

  const handleRenameArea = useCallback((areaId, newName) => {
    setCustomNames((prev) => ({ ...prev, [areaId]: newName }));
  }, []);

  const sortedAreas = [...areas].sort((a, b) => {
    const ap = priorities.includes(a.id) ? 0 : 1;
    const bp = priorities.includes(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (scores[a.id] || 0) - (scores[b.id] || 0);
  });

  return (
    <div className="wheel-layout">
      {/* LEFT: sticky wheel */}
      <div className="wheel-sticky">
        <WheelChart
          areas={areas}
          scores={scores}
          priorities={priorities}
          onScoreChange={handleScoreChange}
        />
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 10 }}>
          Перетащи точку или нажми на ось, чтобы изменить оценку
        </p>
      </div>

      {/* RIGHT: scrollable cards */}
      <div className="wheel-cards">
        <InsightsPanel areas={areas} scores={scores} priorities={priorities} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedAreas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              score={scores[area.id] || 0}
              isPriority={priorities.includes(area.id)}
              goals={goals[area.id] || []}
              onTogglePriority={handleTogglePriority}
              onScoreChange={handleScoreChange}
              onGoalsChange={(g) => handleGoalsChange(area.id, g)}
              onRenameArea={handleRenameArea}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WheelApp });
