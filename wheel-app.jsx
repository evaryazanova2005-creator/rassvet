/* ============================================================
   WheelApp v2 — wheel top (centered), 3-col cards, sphere picker
   Depends on: window.WheelChart, window.heatColor
   ============================================================ */

const { useState, useEffect, useCallback, useRef } = React;

const STORAGE_KEY = window.WHEEL_STORAGE_KEY || 'rassvet_wheel_v3';

/* ── Sphere catalogue (same as stratsession SPHERE_GROUPS) ── */
const SPHERE_GROUPS = [
  { label: 'Тело и здоровье', emoji: '💚', items: [
    'Здоровье и тело', 'Физическая активность / спорт', 'Питание',
    'Сон и восстановление', 'Энергия / состояние', 'Внешность и стиль',
  ]},
  { label: 'Отношения', emoji: '💞', items: [
    'Партнёр / любовные отношения', 'Семья / родители', 'Дети',
    'Дружба', 'Сексуальность', 'Окружение / люди вокруг',
  ]},
  { label: 'Деньги и дело', emoji: '💰', items: [
    'Финансы / доход', 'Карьера / работа по найму', 'Бизнес / своё дело',
    'Профессиональный рост', 'Личный бренд / публичность',
  ]},
  { label: 'Внутреннее', emoji: '🌱', items: [
    'Личностный рост / саморазвитие', 'Психика и эмоции',
    'Духовность / смыслы', 'Дисциплина и привычки', 'Обучение / новые знания',
  ]},
  { label: 'Жизнь и среда', emoji: '✨', items: [
    'Хобби и увлечения', 'Творчество и реализация', 'Отдых и восстановление',
    'Путешествия и приключения', 'Дом и быт', 'Тайм-менеджмент',
    'Комьюнити / своё сообщество',
  ]},
];

function emojiForItem(name) {
  for (const g of SPHERE_GROUPS) {
    if (g.items.includes(name)) return g.emoji;
  }
  return '⭐';
}

/* Short label for the wheel SVG */
function shortLabel(name) {
  const part = name.split(' / ')[0].trim();
  return part.length > 13 ? part.slice(0, 12) + '…' : part;
}

const DEFAULT_AREAS = [
  { id: 'health',   name: 'Здоровье и тело',               emoji: '💚' },
  { id: 'career',   name: 'Карьера / работа по найму',      emoji: '💰' },
  { id: 'finance',  name: 'Финансы / доход',                emoji: '💰' },
  { id: 'relation', name: 'Партнёр / любовные отношения',   emoji: '💞' },
  { id: 'growth',   name: 'Личностный рост / саморазвитие', emoji: '🌱' },
  { id: 'joy',      name: 'Отдых и восстановление',         emoji: '✨' },
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

/* ── SphereDropdown ──────────────────────────────────────── */
function SphereDropdown({ current, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
      minWidth: 240, maxHeight: 300, overflowY: 'auto',
      padding: '6px 0',
    }}>
      {SPHERE_GROUPS.map((group) => (
        <div key={group.label}>
          <div style={{
            fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-soft)',
            padding: '8px 14px 3px',
          }}>{group.emoji} {group.label}</div>
          {group.items.map((item) => {
            const active = item === current;
            return (
              <div
                key={item}
                onMouseDown={() => { onSelect(item); onClose(); }}
                style={{
                  padding: '6px 14px 6px 24px', fontSize: '0.84rem',
                  cursor: 'pointer', lineHeight: 1.35,
                  background: active ? 'rgba(162,160,67,0.10)' : 'transparent',
                  color: active ? '#7a7a1e' : 'var(--ink)',
                  fontWeight: active ? 500 : 400,
                }}
              >{item}{active ? ' ✓' : ''}</div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── TaskItem ────────────────────────────────────────────── */
function TaskItem({ task, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(!task.text);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onUpdate({ ...task, done: !task.done })}
        style={{ accentColor: 'var(--accent)', width: 14, height: 14, flexShrink: 0, cursor: 'pointer', marginTop: 3 }}
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
            fontFamily: 'var(--font-body)', fontSize: '0.83rem',
            color: 'var(--ink)', outline: 'none', lineHeight: 1.45,
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            flex: 1, fontSize: '0.83rem', cursor: 'text', lineHeight: 1.45,
            textDecoration: task.done ? 'line-through' : 'none',
            opacity: task.done ? 0.4 : 1,
          }}
        >{task.text}</span>
      )}
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3,
          color: 'var(--ink)', fontSize: '0.78rem', padding: '0 2px', flexShrink: 0, marginTop: 2,
        }}
      >✕</button>
    </div>
  );
}

/* ── AreaCard ────────────────────────────────────────────── */
function AreaCard({ area, score, tasks, onScoreChange, onTasksChange, onSphereChange }) {
  const [showPicker, setShowPicker] = useState(false);

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
      overflow: 'visible',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Top accent strip */}
      <div style={{
        height: 5, borderRadius: '22px 22px 0 0',
        background: `linear-gradient(to right, ${barColor} ${score * 10}%, var(--border) ${score * 10}%)`,
      }} />

      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Name + score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          {/* Sphere picker button */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              title="Нажми, чтобы выбрать сферу"
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-display)', fontSize: '0.98rem', fontWeight: 500,
                color: 'var(--ink)', textAlign: 'left', maxWidth: '100%',
              }}
            >
              <span>{area.emoji}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{area.name}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--ink-soft)', flexShrink: 0 }}>▾</span>
            </button>
            {showPicker && (
              <SphereDropdown
                current={area.name}
                onSelect={(name) => onSphereChange(area.id, name, emojiForItem(name))}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: barColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>/10</span>
          </div>
        </div>

        {/* Slider */}
        <input
          type="range" min={1} max={10} step={1} value={score}
          onChange={(e) => onScoreChange(area.id, parseInt(e.target.value))}
          style={{ width: '100%', accentColor: barColor, cursor: 'pointer', margin: '-2px 0' }}
        />

        {/* Tasks */}
        <div style={{ paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={updateTask} onRemove={() => removeTask(task.id)} />
          ))}
          <button
            onClick={addTask}
            style={{
              display: 'block', width: '100%', marginTop: tasks.length ? 8 : 0,
              background: 'none', border: '1px dashed var(--border)', borderRadius: 8,
              padding: '6px 10px', fontFamily: 'var(--font-body)', fontSize: '0.77rem',
              color: 'var(--ink-soft)', cursor: 'pointer', textAlign: 'left',
            }}
          >+ задача</button>
          {tasks.length > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', textAlign: 'right', marginTop: 4 }}>
              {doneCount}/{tasks.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── WheelApp ────────────────────────────────────────────── */
function WheelApp() {
  const saved = loadState();
  const [scores,       setScores]       = useState(saved?.scores       || Object.fromEntries(DEFAULT_AREAS.map((a) => [a.id, 5])));
  const [goals,        setGoals]        = useState(saved?.goals        || Object.fromEntries(DEFAULT_AREAS.map((a) => [a.id, []])));
  const [customNames,  setCustomNames]  = useState(saved?.customNames  || {});
  const [customEmojis, setCustomEmojis] = useState(saved?.customEmojis || {});

  const areas = DEFAULT_AREAS.map((a) => {
    const name  = customNames[a.id]  || a.name;
    const emoji = customEmojis[a.id] || a.emoji;
    return { ...a, name, emoji, shortName: shortLabel(name) };
  });

  useEffect(() => {
    saveState({ scores, goals, customNames, customEmojis });
  }, [scores, goals, customNames, customEmojis]);

  const handleScoreChange = useCallback((id, val) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleGoalsChange = useCallback((areaId, newGoals) => {
    setGoals((prev) => ({ ...prev, [areaId]: newGoals }));
  }, []);

  const handleSphereChange = useCallback((areaId, newName, newEmoji) => {
    setCustomNames((prev)  => ({ ...prev, [areaId]: newName  }));
    setCustomEmojis((prev) => ({ ...prev, [areaId]: newEmoji }));
  }, []);

  return (
    <div>
      {/* ── WHEEL at top, centered ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 32 }}>
        <WheelChart
          areas={areas}
          scores={scores}
          priorities={[]}
          onScoreChange={handleScoreChange}
        />
        <p style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', marginTop: 8, textAlign: 'center' }}>
          Перетащи точку на колесе или двигай ползунок на карточке
        </p>
      </div>

      {/* ── CARDS below, 3 columns ── */}
      <div className="cards-grid">
        {areas.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            score={scores[area.id] || 0}
            tasks={goals[area.id]  || []}
            onScoreChange={handleScoreChange}
            onTasksChange={(g) => handleGoalsChange(area.id, g)}
            onSphereChange={handleSphereChange}
          />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { WheelApp });
