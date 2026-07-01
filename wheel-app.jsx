/* ============================================================
   WheelApp — wheel left (sticky) + 2-col area cards right
   No analytics. Tasks always visible per sphere.
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

/* ── TaskItem ──────────────────────────────────────────── */
function TaskItem({ task, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(!task.text);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '7px 0', borderBottom: '1px solid var(--border)',
    }}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onUpdate({ ...task, done: !task.done })}
        style={{ accentColor: 'var(--accent)', width: 14, height: 14, flexShrink: 0, cursor: 'pointer', marginTop: 4 }}
      />
      {editing ? (
        <input
          ref={inputRef}
          value={task.text}
          placeholder="Напиши задачу…"
          onChange={(e) => onUpdate({ ...task, text: e.target.value })}
          onBlur={() => task.text && setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && task.text) setEditing(false); }}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: '0.85rem',
            color: 'var(--ink)', outline: 'none', lineHeight: 1.45,
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            flex: 1, fontSize: '0.85rem', cursor: 'text',
            textDecoration: task.done ? 'line-through' : 'none',
            opacity: task.done ? 0.4 : 1, lineHeight: 1.45,
          }}
        >{task.text}</span>
      )}
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.8rem', opacity: 0.3, color: 'var(--ink)',
          padding: '2px', flexShrink: 0, marginTop: 2, lineHeight: 1,
        }}
      >✕</button>
    </div>
  );
}

/* ── AreaCard ──────────────────────────────────────────── */
function AreaCard({ area, score, tasks, onScoreChange, onTasksChange, onRenameArea }) {
  const [editingName, setEditingName] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { if (editingName && nameRef.current) nameRef.current.focus(); }, [editingName]);

  function addTask() {
    onTasksChange([...tasks, { id: Date.now(), text: '', done: false }]);
  }
  function updateTask(updated) {
    onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }
  function removeTask(id) {
    onTasksChange(tasks.filter((t) => t.id !== id));
  }

  const barColor  = heatColor(score);
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Score accent strip */}
      <div style={{
        height: 4,
        background: `linear-gradient(to right, ${barColor} ${score * 10}%, var(--border) ${score * 10}%)`,
      }} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Header: name + score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {editingName ? (
            <input
              ref={nameRef}
              value={area.name}
              onChange={(e) => onRenameArea(area.id, e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500,
                color: 'var(--ink)', border: 'none', borderBottom: '1px solid var(--accent)',
                background: 'transparent', outline: 'none', flex: 1,
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setEditingName(true)}
              title="Двойной клик — переименовать"
              style={{
                fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500,
                color: 'var(--ink)', cursor: 'default', lineHeight: 1.2,
              }}
            >{area.emoji} {area.name}</span>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, marginLeft: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: barColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>/10</span>
          </div>
        </div>

        {/* Slider */}
        <input
          type="range" min={1} max={10} step={1} value={score}
          onChange={(e) => onScoreChange(area.id, parseInt(e.target.value))}
          style={{ width: '100%', accentColor: barColor, cursor: 'pointer' }}
        />

        {/* Tasks */}
        <div style={{ borderTop: tasks.length ? '1px solid var(--border)' : 'none', paddingTop: tasks.length ? 8 : 0 }}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={updateTask} onRemove={() => removeTask(task.id)} />
          ))}
          <button
            onClick={addTask}
            style={{
              display: 'block', width: '100%', marginTop: tasks.length ? 8 : 0,
              background: 'none', border: '1px dashed var(--border)', borderRadius: 8,
              padding: '6px 10px', fontFamily: 'var(--font-body)', fontSize: '0.78rem',
              color: 'var(--ink-soft)', cursor: 'pointer', textAlign: 'left',
            }}
          >+ задача</button>
          {tasks.length > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', textAlign: 'right', marginTop: 4 }}>
              {doneCount}/{tasks.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── WheelApp ──────────────────────────────────────────── */
function WheelApp() {
  const saved = loadState();
  const [scores,      setScores]      = useState(saved?.scores      || Object.fromEntries(DEFAULT_AREAS.map((a) => [a.id, 5])));
  const [goals,       setGoals]       = useState(saved?.goals       || Object.fromEntries(DEFAULT_AREAS.map((a) => [a.id, []])));
  const [customNames, setCustomNames] = useState(saved?.customNames || {});

  const areas = DEFAULT_AREAS.map((a) => ({
    ...a,
    name:      customNames[a.id] || a.name,
    shortName: customNames[a.id] || a.shortName,
  }));

  useEffect(() => {
    saveState({ scores, goals, customNames });
  }, [scores, goals, customNames]);

  const handleScoreChange = useCallback((id, val) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleGoalsChange = useCallback((areaId, newGoals) => {
    setGoals((prev) => ({ ...prev, [areaId]: newGoals }));
  }, []);

  const handleRenameArea = useCallback((areaId, newName) => {
    setCustomNames((prev) => ({ ...prev, [areaId]: newName }));
  }, []);

  return (
    <div className="wheel-layout">
      {/* LEFT: sticky wheel */}
      <div className="wheel-sticky">
        <WheelChart
          areas={areas}
          scores={scores}
          priorities={[]}
          onScoreChange={handleScoreChange}
        />
        <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: 8 }}>
          Перетащи точку или двигай ползунок на карточке
        </p>
      </div>

      {/* RIGHT: 2-col cards */}
      <div className="wheel-cards">
        <div className="cards-grid">
          {areas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              score={scores[area.id] || 0}
              tasks={goals[area.id] || []}
              onScoreChange={handleScoreChange}
              onTasksChange={(g) => handleGoalsChange(area.id, g)}
              onRenameArea={handleRenameArea}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WheelApp });
