/**
 * TaskLog — slide-up panel listing the last 20 assistant actions.
 * The parent owns visibility (toggled when the user clicks the orb).
 */

const ICONS = {
  browser:      '\uD83C\uDF10',   // 🌐
  email:        '\u2709\uFE0F',   // ✉️
  calendar:     '\uD83D\uDCC5',   // 📅
  file:         '\uD83D\uDCC1',   // 📁
  system:       '\uD83D\uDCBB',   // 💻
  memory:       '\uD83E\uDDE0',   // 🧠
  developer:    '\u2699\uFE0F',   // ⚙️
  whatsapp:     '\uD83D\uDCAC',   // 💬
  task:         '\u2705',         // ✅
  web:          '\uD83D\uDD0E',   // 🔎
  orchestrator: '\u26A1',         // ⚡
  generic:      '\u00B7',
};

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_e) {
    return '';
  }
}

export default function TaskLog({ entries = [], visible }) {
  return (
    <div className={`task-log-overlay ${visible ? '' : 'hidden'}`}>
      {entries.length === 0 && (
        <div className="task-log-entry" style={{ opacity: 0.5 }}>
          <span className="task-log-icon">{ICONS.generic}</span>
          <span className="task-log-text">No actions yet.</span>
        </div>
      )}
      {entries.map((entry) => (
        <div key={entry.id} className="task-log-entry">
          <span className="task-log-icon">{ICONS[entry.kind] || ICONS.generic}</span>
          <span className="task-log-text">{entry.text}</span>
          <span className="task-log-time">{formatTime(entry.ts)}</span>
        </div>
      ))}
    </div>
  );
}
