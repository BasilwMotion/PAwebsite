import { useState, useEffect, useRef, useCallback } from "react";

// ─── PALETTE & CONSTANTS ────────────────────────────────────────────────────
const ACCENT = "#00FFB2";
const ACCENT2 = "#FF6B35";
const GOLD = "#FFD700";
const PURPLE = "#A78BFA";
const BG = "#080C10";
const CARD = "#0D1117";
const CARD2 = "#111820";
const BORDER = "#1E2A3A";
const TEXT = "#E8F4FF";
const MUTED = "#4A6080";
const TARGET_ZAR = 10_000_000;
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const START_DATE = new Date("2025-06-05");

// ─── THE FULL APP SOURCE (self-referential) ───────────────────────────────────
// This string is passed to APEX when edit mode is on, so it can rewrite the app.
// When the user applies a patch, the new code is saved to localStorage and shown
// in the Code Editor. A "copy to clipboard" lets them paste it back into Claude.ai.

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const store = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  goals: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  finance: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  ai: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2M8 12h8M12 8v8",
  tasks: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  brain: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.13A3 3 0 0 1 4.46 9a3 3 0 0 1 .5-5.77A2.5 2.5 0 0 1 9.5 2",
  send: "M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  chart: "M18 20V10M12 20V4M6 20v-6",
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  collapse: "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3",
  money: "M2 17l10 5 10-5M2 12l10 5 10-5M2 7l10-5 10 5-10 5-10-5z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  copy: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H8zM14 2v6h6",
  history: "M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3.5M3 4v4h4",
  apply: "M5 13l4 4L19 7",
  diff: "M12 2v20M2 12h20M7 7l10 10M17 7L7 17",
  wand: "M15 4l5 5-12.5 12.5L2 22l1.5-5.5L15 4zM18 2l4 4",
};

// ─── MINI SPARKLINE ──────────────────────────────────────────────────────────
function Sparkline({ data, color = ACCENT, height = 40, width = 120 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sg${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ─── RADIAL PROGRESS ─────────────────────────────────────────────────────────
function RadialProgress({ pct, size = 80, stroke = 7, color = ACCENT }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BORDER} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: size * 0.2, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>
          {Math.round(pct * 100)}%
        </div>
      </div>
    </div>
  );
}

// ─── BAR CHART ───────────────────────────────────────────────────────────────
function BarChart({ data, color = ACCENT, height = 80, labels }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div style={{
              width: "100%", borderRadius: "3px 3px 0 0",
              background: `linear-gradient(180deg, ${d.color || color}, ${d.color || color}88)`,
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 3 : 0,
              transition: "height 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          {labels && <div style={{ fontSize: 9, color: MUTED, whiteSpace: "nowrap" }}>{labels[i]}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── GOAL ITEM ────────────────────────────────────────────────────────────────
function GoalItem({ goal, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.text);
  const done = goal.done;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      background: done ? `${ACCENT}0A` : CARD2, borderRadius: 10,
      border: `1px solid ${done ? ACCENT + "40" : BORDER}`,
      marginBottom: 6, transition: "all 0.2s",
    }}>
      <button onClick={() => onToggle(goal.id)} style={{
        width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? ACCENT : BORDER}`,
        background: done ? ACCENT : "transparent", flexShrink: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
      }}>
        {done && <Icon d={icons.check} size={12} color={BG} />}
      </button>
      {editing ? (
        <input value={text} onChange={e => setText(e.target.value)}
          onBlur={() => { onEdit(goal.id, text); setEditing(false); }}
          onKeyDown={e => e.key === "Enter" && (onEdit(goal.id, text), setEditing(false))}
          autoFocus style={{ flex: 1, background: "transparent", border: "none", outline: `1px solid ${ACCENT}`, color: TEXT, fontSize: 13, padding: "2px 6px", borderRadius: 4 }} />
      ) : (
        <span style={{ flex: 1, fontSize: 13, color: done ? MUTED : TEXT, textDecoration: done ? "line-through" : "none", cursor: "pointer" }}
          onDoubleClick={() => setEditing(true)}>{goal.text}</span>
      )}
      {goal.priority && (
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: goal.priority === "high" ? `${ACCENT2}22` : `${ACCENT}22`, color: goal.priority === "high" ? ACCENT2 : ACCENT }}>
          {goal.priority}
        </span>
      )}
      <button onClick={() => onDelete(goal.id)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2 }}>
        <Icon d={icons.trash} size={13} />
      </button>
    </div>
  );
}

// ─── ADD GOAL FORM ────────────────────────────────────────────────────────────
function AddGoalForm({ onAdd, placeholder = "Add goal…" }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && text.trim() && (onAdd(text, priority), setText(""))}
        placeholder={placeholder}
        style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", color: TEXT, fontSize: 13, outline: "none" }} />
      <select value={priority} onChange={e => setPriority(e.target.value)}
        style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 12, padding: "0 8px" }}>
        <option value="low">Low</option>
        <option value="medium">Mid</option>
        <option value="high">High</option>
      </select>
      <button onClick={() => text.trim() && (onAdd(text, priority), setText(""))}
        style={{ background: ACCENT, color: BG, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+</button>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accent = ACCENT, extra, style: s = {} }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", ...s }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icon} size={15} color={accent} />
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, color: TEXT, letterSpacing: 1 }}>{title}</span>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

// ─── STAT TILE ────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, color = ACCENT, sparkData }) {
  return (
    <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", flex: 1, minWidth: 120, position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1.5, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{sub}</div>}
      {sparkData && <div style={{ position: "absolute", bottom: 0, right: 0, opacity: 0.3 }}><Sparkline data={sparkData} color={color} width={80} height={32} /></div>}
    </div>
  );
}

// ─── BRANCH NODE ─────────────────────────────────────────────────────────────
function BranchNode({ node, depth = 0, onAdd, onDelete, onEdit, onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const colors = [ACCENT, ACCENT2, GOLD, PURPLE, "#60A5FA", "#F472B6"];
  const c = colors[depth % colors.length];
  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0, position: "relative" }}>
      {depth > 0 && <div style={{ position: "absolute", left: -12, top: 14, width: 10, height: 1, background: `${c}50` }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${c}30`, background: `${c}08`, marginBottom: 4 }}>
        {node.children?.length > 0 && (
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: c, padding: 0, width: 16 }}>
            <Icon d={collapsed ? icons.expand : icons.collapse} size={12} color={c} />
          </button>
        )}
        <button onClick={() => onToggle(node.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${node.done ? c : BORDER}`, background: node.done ? c : "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {node.done && <Icon d={icons.check} size={9} color={BG} />}
        </button>
        {editing ? (
          <input value={text} onChange={e => setText(e.target.value)}
            onBlur={() => { onEdit(node.id, text); setEditing(false); }}
            onKeyDown={e => e.key === "Enter" && (onEdit(node.id, text), setEditing(false))}
            autoFocus style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: 12 }} />
        ) : (
          <span onDoubleClick={() => setEditing(true)} style={{ flex: 1, fontSize: 12, color: node.done ? MUTED : TEXT, textDecoration: node.done ? "line-through" : "none" }}>{node.text}</span>
        )}
        <button onClick={() => setAdding(!adding)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2 }}><Icon d={icons.plus} size={11} /></button>
        <button onClick={() => onDelete(node.id)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2 }}><Icon d={icons.trash} size={11} /></button>
      </div>
      {adding && (
        <div style={{ marginLeft: 20, marginBottom: 4, display: "flex", gap: 6 }}>
          <input value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newText.trim()) { onAdd(node.id, newText); setNewText(""); setAdding(false); } if (e.key === "Escape") setAdding(false); }}
            placeholder="Branch name…" autoFocus style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 10px", color: TEXT, fontSize: 12, outline: "none" }} />
          <button onClick={() => { if (newText.trim()) { onAdd(node.id, newText); setNewText(""); setAdding(false); } }} style={{ background: c, color: BG, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+</button>
        </div>
      )}
      {!collapsed && node.children?.map(child => (
        <BranchNode key={child.id} node={child} depth={depth + 1} onAdd={onAdd} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} />
      ))}
    </div>
  );
}

// ─── CHAT BUBBLE ─────────────────────────────────────────────────────────────
function ChatBubble({ msg, onApplyPatch }) {
  const isUser = msg.role === "user";
  const hasPatch = msg.patch !== undefined;

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10, flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {!isUser && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, #00A878)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon d={icons.bolt} size={14} color={BG} />
          </div>
        )}
        <div style={{
          maxWidth: "78%", padding: "10px 14px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser ? `linear-gradient(135deg, ${ACCENT}22, ${ACCENT}15)` : CARD2,
          border: `1px solid ${isUser ? ACCENT + "40" : BORDER}`,
          fontSize: 13, color: TEXT, lineHeight: 1.6, whiteSpace: "pre-wrap"
        }}>
          {msg.content}
        </div>
      </div>
      {hasPatch && (
        <div style={{ marginLeft: 36, marginTop: 8, maxWidth: "90%" }}>
          <PatchPreview patch={msg.patch} onApply={() => onApplyPatch(msg.patch)} />
        </div>
      )}
    </div>
  );
}

// ─── PATCH PREVIEW (the diff card) ───────────────────────────────────────────
function PatchPreview({ patch, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = patch.newCode.split("\n");
  const oldLines = patch.oldSnippet ? patch.oldSnippet.split("\n") : [];
  const newLines = patch.newSnippet ? patch.newSnippet.split("\n") : [];

  const handleApply = () => {
    onApply();
    setApplied(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(patch.newCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: "#0A1628", border: `1px solid ${PURPLE}40`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: `${PURPLE}12`, borderBottom: `1px solid ${PURPLE}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={icons.wand} size={14} color={PURPLE} />
          <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE, fontFamily: "'Space Mono', monospace" }}>APP EDIT PROPOSED</span>
          <span style={{ fontSize: 10, color: MUTED, background: CARD2, padding: "1px 7px", borderRadius: 10 }}>{lines.length} lines</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px", color: MUTED, fontSize: 11, cursor: "pointer" }}>
            {expanded ? "Collapse" : "View diff"}
          </button>
          <button onClick={handleCopy} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px", color: copied ? ACCENT : MUTED, fontSize: 11, cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "Copy code"}
          </button>
          <button onClick={handleApply} disabled={applied} style={{
            background: applied ? `${ACCENT}22` : `linear-gradient(135deg, ${ACCENT}, #00A878)`,
            border: "none", borderRadius: 6, padding: "4px 14px",
            color: applied ? ACCENT : BG, fontSize: 11, fontWeight: 700, cursor: applied ? "default" : "pointer"
          }}>
            {applied ? "✓ Saved to Editor" : "⚡ Apply Patch"}
          </button>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: "8px 14px", fontSize: 12, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ color: MUTED }}>Change: </span>{patch.description}
      </div>

      {/* Diff view */}
      {expanded && (
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "8px 0" }}>
          {patch.oldSnippet && (
            <div style={{ padding: "0 14px 8px" }}>
              <div style={{ fontSize: 10, color: ACCENT2, fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>BEFORE</div>
              {oldLines.map((line, i) => (
                <div key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: `${ACCENT2}CC`, background: `${ACCENT2}08`, padding: "1px 8px", borderLeft: `2px solid ${ACCENT2}40` }}>
                  - {line}
                </div>
              ))}
            </div>
          )}
          {patch.newSnippet && (
            <div style={{ padding: "0 14px 8px" }}>
              <div style={{ fontSize: 10, color: ACCENT, fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>AFTER</div>
              {newLines.map((line, i) => (
                <div key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: `${ACCENT}CC`, background: `${ACCENT}08`, padding: "1px 8px", borderLeft: `2px solid ${ACCENT}40` }}>
                  + {line}
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: "0 14px" }}>
            <div style={{ fontSize: 10, color: PURPLE, fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>FULL NEW CODE PREVIEW</div>
            {lines.slice(0, 30).map((line, i) => (
              <div key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED, padding: "0px 8px" }}>{line}</div>
            ))}
            {lines.length > 30 && <div style={{ fontSize: 10, color: MUTED, padding: "4px 8px" }}>…{lines.length - 30} more lines</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CODE EDITOR TAB ─────────────────────────────────────────────────────────
function CodeEditor({ appSource, setAppSource, codeHistory, onRestoreVersion }) {
  const [editText, setEditText] = useState(appSource);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { setEditText(appSource); }, [appSource]);

  const handleSave = () => {
    setAppSource(editText);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lineCount = editText.split("\n").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", gap: 0 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${PURPLE}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.code} size={16} color={PURPLE} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15 }}>Code Editor</div>
            <div style={{ fontSize: 11, color: MUTED }}>self-improvement-app.jsx · {lineCount} lines</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${showHistory ? PURPLE + "80" : BORDER}`, background: showHistory ? `${PURPLE}15` : CARD2, color: showHistory ? PURPLE : MUTED, fontSize: 12, cursor: "pointer" }}>
            <Icon d={icons.history} size={13} color={showHistory ? PURPLE : MUTED} /> History ({codeHistory.length})
          </button>
          <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: copied ? ACCENT : MUTED, fontSize: 12, cursor: "pointer" }}>
            <Icon d={icons.copy} size={13} color={copied ? ACCENT : MUTED} /> {copied ? "Copied!" : "Copy all"}
          </button>
          <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 8, border: "none", background: saved ? `${ACCENT}30` : `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: saved ? ACCENT : TEXT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Icon d={icons.apply} size={13} color={saved ? ACCENT : TEXT} /> {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
        {/* Main editor */}
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex" }}>
            {/* Line numbers */}
            <div style={{ width: 44, background: "#090D13", borderRadius: "12px 0 0 12px", border: `1px solid ${BORDER}`, borderRight: "none", padding: "16px 0", overflowY: "hidden", flexShrink: 0 }}>
              {editText.split("\n").map((_, i) => (
                <div key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: MUTED, textAlign: "right", paddingRight: 10, lineHeight: "20px", height: 20 }}>{i + 1}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, background: "#090D13", border: `1px solid ${BORDER}`, borderRadius: "0 12px 12px 0",
                padding: "16px 16px", color: "#C9D5E0", fontFamily: "'Space Mono', monospace", fontSize: 11,
                lineHeight: "20px", resize: "none", outline: "none", overflowY: "auto",
                tabSize: 2,
              }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const val = e.target.value;
                  setEditText(val.substring(0, start) + "  " + val.substring(end));
                  setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
                }
                if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        {/* Version history panel */}
        {showHistory && (
          <div style={{ width: 260, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: PURPLE, fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>VERSION HISTORY</div>
            {codeHistory.length === 0 && <div style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: 20 }}>No versions saved yet. Apply a patch from APEX AI to create one.</div>}
            {[...codeHistory].reverse().map((v, i) => (
              <div key={i} style={{ marginBottom: 8, padding: "10px 12px", background: CARD2, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 3 }}>v{codeHistory.length - i}</div>
                <div style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>{v.timestamp}</div>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>{v.description}</div>
                <button onClick={() => { onRestoreVersion(v.code); setEditText(v.code); }} style={{ fontSize: 11, color: PURPLE, background: `${PURPLE}15`, border: `1px solid ${PURPLE}30`, borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 10, fontSize: 11, color: MUTED, display: "flex", gap: 20 }}>
        <span>Ctrl+S to save</span>
        <span>Tab for indent</span>
        <span style={{ color: PURPLE }}>⚡ Apply patches from APEX AI → code appears here automatically</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dailyGoals, setDailyGoals] = useState(() => store.get("daily_goals", []));
  const [monthlyGoals, setMonthlyGoals] = useState(() => store.get("monthly_goals", []));
  const [quarterGoals, setQuarterGoals] = useState(() => store.get("quarter_goals", []));
  const [revenues, setRevenues] = useState(() => store.get("revenues", []));
  const [expenses, setExpenses] = useState(() => store.get("expenses", []));
  const [chatMessages, setChatMessages] = useState(() => store.get("chat_messages", [{
    role: "assistant",
    content: `Hey! I'm APEX — your AI performance partner. 🚀\n\nYour goal: R10,000,000 in 2 years. That's R416,667/month or R13,889/day.\n\nI can:\n• Suggest daily tasks & goals\n• Research income opportunities\n• Analyze your progress\n• Edit this app with your permission\n\nTry: "Change the accent color to purple" or "Add a habit tracker section" when Edit App is ON.`
  }]));
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [webPermission, setWebPermission] = useState(false);
  const [filePermission, setFilePermission] = useState(false);
  const [editAppPermission, setEditAppPermission] = useState(false);
  const [branches, setBranches] = useState(() => store.get("branches", [
    { id: "1", text: "🎯 10M ZAR Mission", done: false, children: [
      { id: "1-1", text: "Primary Income Stream", done: false, children: [
        { id: "1-1-1", text: "Identify core skill", done: false, children: [] },
        { id: "1-1-2", text: "Package as service/product", done: false, children: [] },
      ]},
      { id: "1-2", text: "Secondary Income Streams", done: false, children: [] },
      { id: "1-3", text: "Investment Portfolio", done: false, children: [] },
    ]}
  ]));
  const [dailyHistory, setDailyHistory] = useState(() => store.get("daily_history", []));
  const [newRevenue, setNewRevenue] = useState({ label: "", amount: "", category: "freelance" });
  const [newExpense, setNewExpense] = useState({ label: "", amount: "", category: "business" });

  // ── CODE EDITOR STATE ────────────────────────────────────────────────────
  // The "live" source is what APEX edits. Starts with placeholder; real edits saved here.
  const [appSource, setAppSource] = useState(() => store.get("app_source_v1", "// Your app source will appear here after APEX makes its first edit.\n// Ask APEX AI to change something with Edit App permission ON.\n// Example: \"Change the accent color to purple\" or \"Add a notes section\""));
  const [codeHistory, setCodeHistory] = useState(() => store.get("code_history", []));

  const chatEndRef = useRef(null);
  const fileRef = useRef(null);

  // ── PERSIST ──────────────────────────────────────────────────────────────
  useEffect(() => { store.set("daily_goals", dailyGoals); }, [dailyGoals]);
  useEffect(() => { store.set("monthly_goals", monthlyGoals); }, [monthlyGoals]);
  useEffect(() => { store.set("quarter_goals", quarterGoals); }, [quarterGoals]);
  useEffect(() => { store.set("revenues", revenues); }, [revenues]);
  useEffect(() => { store.set("expenses", expenses); }, [expenses]);
  useEffect(() => { store.set("chat_messages", chatMessages.slice(-100)); }, [chatMessages]);
  useEffect(() => { store.set("branches", branches); }, [branches]);
  useEffect(() => { store.set("daily_history", dailyHistory); }, [dailyHistory]);
  useEffect(() => { store.set("app_source_v1", appSource); }, [appSource]);
  useEffect(() => { store.set("code_history", codeHistory); }, [codeHistory]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // record daily completion
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (dailyGoals.length > 0) {
      const pct = dailyGoals.filter(g => g.done).length / dailyGoals.length;
      setDailyHistory(h => {
        const existing = h.findIndex(d => d.date === today);
        if (existing >= 0) { const n = [...h]; n[existing] = { date: today, pct }; return n; }
        return [...h.slice(-29), { date: today, pct }];
      });
    }
  }, [dailyGoals]);

  // ── GOAL HELPERS ──────────────────────────────────────────────────────────
  const makeGoal = (text, priority) => ({ id: Date.now().toString(), text, done: false, priority, createdAt: new Date().toISOString() });
  const goalOps = setter => ({
    add: (text, priority) => setter(g => [...g, makeGoal(text, priority)]),
    toggle: id => setter(g => g.map(x => x.id === id ? { ...x, done: !x.done } : x)),
    delete: id => setter(g => g.filter(x => x.id !== id)),
    edit: (id, text) => setter(g => g.map(x => x.id === id ? { ...x, text } : x)),
  });
  const daily = goalOps(setDailyGoals);
  const monthly = goalOps(setMonthlyGoals);
  const quarter = goalOps(setQuarterGoals);

  // ── FINANCIAL HELPERS ─────────────────────────────────────────────────────
  const totalRevenue = revenues.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netIncome = totalRevenue - totalExpenses;
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - START_DATE.getTime()) / 86400000));
  const daysRemaining = Math.max(0, Math.floor((START_DATE.getTime() + TWO_YEARS_MS - Date.now()) / 86400000));
  const pctTimeGone = Math.min(1, daysSinceStart / 730);
  const targetByNow = TARGET_ZAR * pctTimeGone;
  const progressPct = Math.min(1, totalRevenue / TARGET_ZAR);
  const monthlyTarget = TARGET_ZAR / 24;
  const dailyTarget = TARGET_ZAR / 730;

  // ── BRANCH HELPERS ────────────────────────────────────────────────────────
  const deepMap = (nodes, id, fn) => nodes.map(n => n.id === id ? fn(n) : { ...n, children: deepMap(n.children || [], id, fn) });
  const deepFilter = (nodes, id) => nodes.filter(n => n.id !== id).map(n => ({ ...n, children: deepFilter(n.children || [], id) }));
  const addBranch = (parentId, text) => {
    const newNode = { id: Date.now().toString(), text, done: false, children: [] };
    if (!parentId) { setBranches(b => [...b, newNode]); return; }
    setBranches(b => deepMap(b, parentId, n => ({ ...n, children: [...(n.children || []), newNode] })));
  };
  const deleteBranch = id => setBranches(b => deepFilter(b, id));
  const editBranch = (id, text) => setBranches(b => deepMap(b, id, n => ({ ...n, text })));
  const toggleBranch = id => setBranches(b => deepMap(b, id, n => ({ ...n, done: !n.done })));

  // ── APPLY PATCH ───────────────────────────────────────────────────────────
  const applyPatch = useCallback((patch) => {
    // Save old version to history
    const version = {
      code: appSource,
      timestamp: new Date().toLocaleString("en-ZA"),
      description: `Before: ${patch.description}`,
    };
    setCodeHistory(h => [...h.slice(-19), version]);
    // Apply new code
    setAppSource(patch.newCode);
    // Switch to code editor so user can see it
    setActiveTab("code");
  }, [appSource]);

  const restoreVersion = useCallback((code) => {
    setAppSource(code);
  }, []);

  // ── AI CHAT ───────────────────────────────────────────────────────────────
  const sendChat = async (overrideMsg) => {
    const text = (overrideMsg || chatInput).trim();
    if (!text) return;
    setChatInput("");
    const userMsg = { role: "user", content: text };
    setChatMessages(m => [...m, userMsg]);
    setIsTyping(true);

    // Detect edit intent
    const editKeywords = ["change", "edit", "modify", "add", "remove", "update", "make the", "fix", "rename", "replace", "refactor", "color", "theme", "section", "tab", "button", "font", "style"];
    const isEditRequest = editAppPermission && editKeywords.some(k => text.toLowerCase().includes(k));

    const systemPrompt = `You are APEX — an elite AI performance coach and business strategist.
User goal: Earn R10,000,000 ZAR in 2 years (started June 2025).
Daily target: R${dailyTarget.toLocaleString("en-ZA", { maximumFractionDigits: 0 })} | Monthly: R${monthlyTarget.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
Current revenue: R${totalRevenue.toLocaleString("en-ZA")} | Net: R${netIncome.toLocaleString("en-ZA")} | Days left: ${daysRemaining}
Daily goals: ${dailyGoals.map(g => `${g.done ? "✓" : "○"} ${g.text}`).join(", ") || "none"}
Monthly goals: ${monthlyGoals.map(g => `${g.done ? "✓" : "○"} ${g.text}`).join(", ") || "none"}
Web access: ${webPermission ? "ENABLED" : "disabled"} | Edit App: ${editAppPermission ? "ENABLED" : "disabled"}

${isEditRequest ? `
IMPORTANT: The user wants to edit the app. You MUST respond in this EXACT JSON format and nothing else:
{
  "message": "Your friendly explanation of what you changed and why",
  "patch": {
    "description": "Brief one-line summary of the change",
    "oldSnippet": "The specific old code lines you are replacing (3-8 lines max)",
    "newSnippet": "The replacement code lines (3-8 lines max)",
    "newCode": "THE COMPLETE UPDATED JSX FILE — every single line, nothing omitted. This is critical: output the ENTIRE file with the change applied."
  }
}

The current app source code to edit:
\`\`\`jsx
${appSource.slice(0, 8000)}
${appSource.length > 8000 ? "... (truncated, but output full file in newCode)" : ""}
\`\`\`

Rules for newCode:
- Output the COMPLETE file, not just the changed part
- Keep all existing functionality intact
- Only change what was asked
- Make sure the JSX is valid React
` : `
You are a high-performance coach. Give ACTIONABLE, SPECIFIC advice. South African context. 
Be direct, motivating, practical. Use numbered lists for goals/tasks.
Keep responses concise but impactful.`}`;

    try {
      const tools = webPermission ? [{ type: "web_search_20250305", name: "web_search" }] : undefined;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: isEditRequest ? 8000 : 1000,
          system: systemPrompt,
          messages: [...chatMessages.filter(m => m.role).slice(-10), userMsg].map(m => ({ role: m.role, content: m.content })),
          ...(tools ? { tools } : {})
        })
      });

      const data = await response.json();
      const rawText = (data.content || []).map(item => item.type === "text" ? item.text : "").filter(Boolean).join("\n");

      if (isEditRequest) {
        // Try to parse the JSON patch response
        try {
          const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          // Find the JSON object
          const jsonStart = clean.indexOf("{");
          const jsonStr = clean.slice(jsonStart);
          const parsed = JSON.parse(jsonStr);
          setChatMessages(m => [...m, {
            role: "assistant",
            content: parsed.message || "Here's the edit I've prepared:",
            patch: parsed.patch
          }]);
        } catch (parseErr) {
          // Fallback: show raw response if JSON parse fails
          setChatMessages(m => [...m, {
            role: "assistant",
            content: "I prepared an edit but had trouble formatting it. Here's what I changed:\n\n" + rawText.slice(0, 500)
          }]);
        }
      } else {
        setChatMessages(m => [...m, { role: "assistant", content: rawText || "I encountered an issue. Please try again." }]);
      }
    } catch (err) {
      setChatMessages(m => [...m, { role: "assistant", content: "Connection error. Please check your setup and try again." }]);
    }
    setIsTyping(false);
  };

  // ── COMPUTED ──────────────────────────────────────────────────────────────
  const dailyCompletion = dailyGoals.length > 0 ? dailyGoals.filter(g => g.done).length / dailyGoals.length : 0;
  const monthlyCompletion = monthlyGoals.length > 0 ? monthlyGoals.filter(g => g.done).length / monthlyGoals.length : 0;
  const quarterCompletion = quarterGoals.length > 0 ? quarterGoals.filter(g => g.done).length / quarterGoals.length : 0;
  const historyData = dailyHistory.slice(-7).map(d => ({ value: d.pct * 100, color: ACCENT }));
  const revenueByCategory = revenues.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + Number(r.amount); return a; }, {});

  const quickPrompts = [
    "Suggest 5 daily goals for today",
    "What are the best ways to make money in SA?",
    "Analyze my progress toward R10M",
    "Give me a productivity schedule for today",
  ];

  const editPrompts = [
    "Change the accent color to electric blue",
    "Add a Habits tracker section to the sidebar",
    "Make the sidebar wider and add icons labels",
    "Add a countdown timer widget to the dashboard",
  ];

  // ── NAV ───────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", icon: icons.dashboard, label: "Dashboard" },
    { id: "goals", icon: icons.goals, label: "Goals" },
    { id: "finance", icon: icons.finance, label: "Finance" },
    { id: "ai", icon: icons.ai, label: "APEX AI" },
    { id: "productivity", icon: icons.brain, label: "Workspace" },
    { id: "code", icon: icons.code, label: "Code Editor", accent: PURPLE },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${CARD}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }
        input::placeholder { color: ${MUTED}; }
        textarea::placeholder { color: ${MUTED}; }
        select option { background: ${CARD}; color: ${TEXT}; }
        .nav-item:hover { background: ${ACCENT}10 !important; }
        .btn-glow:hover { box-shadow: 0 0 20px ${ACCENT}60; }
        .chip:hover { background: ${ACCENT}22 !important; color: ${ACCENT} !important; }
        .edit-chip:hover { background: ${PURPLE}22 !important; color: ${PURPLE} !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slide-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 8px ${PURPLE}40} 50%{box-shadow:0 0 20px ${PURPLE}80} }
        .typing-dot { width:6px;height:6px;border-radius:50%;background:${ACCENT};animation:pulse 1.2s infinite; }
        .edit-active { animation: glow-pulse 2s infinite; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 220, background: CARD, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #00A878)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.bolt} size={18} color={BG} />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, color: ACCENT }}>APEX</div>
              <div style={{ fontSize: 10, color: MUTED }}>R10M in 2 Years</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 10px", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} className="nav-item" onClick={() => setActiveTab(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "none",
              background: activeTab === item.id ? `${item.accent || ACCENT}18` : "transparent",
              color: activeTab === item.id ? (item.accent || ACCENT) : MUTED,
              cursor: "pointer", fontSize: 13, fontWeight: activeTab === item.id ? 700 : 400,
              marginBottom: 2, transition: "all 0.15s",
            }}>
              <Icon d={item.icon} size={16} color={activeTab === item.id ? (item.accent || ACCENT) : MUTED} />
              {item.label}
              {item.id === "code" && codeHistory.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 9, background: `${PURPLE}30`, color: PURPLE, padding: "1px 6px", borderRadius: 10 }}>v{codeHistory.length + 1}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 14px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>MISSION PROGRESS</div>
          <div style={{ background: `${ACCENT}15`, borderRadius: 6, height: 5, marginBottom: 5 }}>
            <div style={{ background: `linear-gradient(90deg, ${ACCENT}, #00D9A6)`, height: "100%", borderRadius: 6, width: `${progressPct * 100}%`, transition: "width 0.8s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span style={{ color: ACCENT, fontFamily: "'Space Mono', monospace" }}>R{(totalRevenue / 1000).toFixed(0)}K</span>
            <span style={{ color: MUTED }}>R10M</span>
          </div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{daysRemaining} days left</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>

        {/* ════ DASHBOARD ════ */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "slide-in 0.3s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700 }}>
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"} 👋
              </h1>
              <div style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>
                {new Date().toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {" · "}<span style={{ color: ACCENT }}>Day {daysSinceStart} of 730</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <StatTile label="Total Revenue" value={`R${totalRevenue.toLocaleString("en-ZA")}`} sub={`Target: R${targetByNow.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`} color={totalRevenue >= targetByNow ? ACCENT : ACCENT2} sparkData={dailyHistory.slice(-6).map(d => d.pct * 100)} />
              <StatTile label="Daily Target" value={`R${dailyTarget.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`} sub="per day to hit R10M" color={GOLD} />
              <StatTile label="Monthly Target" value={`R${(monthlyTarget / 1000).toFixed(0)}K`} sub="per month required" color={PURPLE} />
              <StatTile label="Days Left" value={daysRemaining} sub={`${Math.round(daysRemaining / 30)} months`} color={ACCENT2} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              <SectionCard title="TODAY'S GOALS" icon={icons.tasks} accent={ACCENT}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <RadialProgress pct={dailyCompletion} size={64} color={ACCENT} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: ACCENT, fontFamily: "'Space Mono', monospace" }}>{dailyGoals.filter(g => g.done).length}/{dailyGoals.length}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>completed</div>
                  </div>
                </div>
                {dailyGoals.slice(0, 3).map(g => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 12, color: g.done ? MUTED : TEXT }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: g.done ? ACCENT : BORDER, flexShrink: 0 }} />
                    <span style={{ textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                  </div>
                ))}
                {dailyGoals.length > 3 && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>+{dailyGoals.length - 3} more</div>}
              </SectionCard>
              <SectionCard title="MONTHLY GOALS" icon={icons.calendar} accent={ACCENT2}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <RadialProgress pct={monthlyCompletion} size={64} color={ACCENT2} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: ACCENT2, fontFamily: "'Space Mono', monospace" }}>{monthlyGoals.filter(g => g.done).length}/{monthlyGoals.length}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>completed</div>
                  </div>
                </div>
                {monthlyGoals.slice(0, 3).map(g => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 12, color: g.done ? MUTED : TEXT }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: g.done ? ACCENT2 : BORDER, flexShrink: 0 }} />
                    <span style={{ textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                  </div>
                ))}
              </SectionCard>
              <SectionCard title="FINANCE" icon={icons.money} accent={GOLD}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>NET INCOME</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: netIncome >= 0 ? ACCENT : ACCENT2, fontFamily: "'Space Mono', monospace" }}>R{netIncome.toLocaleString("en-ZA")}</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div><div style={{ fontSize: 10, color: MUTED }}>Revenue</div><div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>R{totalRevenue.toLocaleString("en-ZA")}</div></div>
                  <div><div style={{ fontSize: 10, color: MUTED }}>Expenses</div><div style={{ fontSize: 14, fontWeight: 700, color: ACCENT2 }}>R{totalExpenses.toLocaleString("en-ZA")}</div></div>
                </div>
                <div style={{ marginTop: 10, background: `${ACCENT}15`, borderRadius: 6, height: 4 }}>
                  <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${ACCENT})`, height: "100%", borderRadius: 6, width: `${progressPct * 100}%` }} />
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{(progressPct * 100).toFixed(3)}% toward R10M</div>
              </SectionCard>
            </div>
            <SectionCard title="7-DAY COMPLETION RATE" icon={icons.chart} accent={ACCENT} style={{ marginBottom: 16 }}>
              {dailyHistory.length > 0 ? (
                <BarChart data={historyData} height={80} labels={dailyHistory.slice(-7).map(d => d.date.slice(5))} />
              ) : (
                <div style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Start completing daily goals to see your history!</div>
              )}
            </SectionCard>
            <SectionCard title="QUICK AI ACTIONS" icon={icons.bolt} accent={GOLD}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {quickPrompts.map((p, i) => (
                  <button key={i} className="chip" onClick={() => { setActiveTab("ai"); setTimeout(() => sendChat(p), 100); }}
                    style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "7px 14px", color: MUTED, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>{p}</button>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ════ GOALS ════ */}
        {activeTab === "goals" && (
          <div style={{ animation: "slide-in 0.3s ease" }}>
            <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Goal Tracker</h1>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>Daily · Monthly · 3-Month milestones toward R10M</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <SectionCard title="DAILY GOALS" icon={icons.tasks} accent={ACCENT} extra={<RadialProgress pct={dailyCompletion} size={44} color={ACCENT} />}>
                <div style={{ height: 60, marginBottom: 12 }}>
                  <BarChart data={historyData.length > 0 ? historyData : [{ value: 0, color: ACCENT }]} height={60} />
                  <div style={{ fontSize: 9, color: MUTED, textAlign: "right", marginTop: 2 }}>7-day completion</div>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {dailyGoals.map(g => <GoalItem key={g.id} goal={g} onToggle={daily.toggle} onDelete={daily.delete} onEdit={daily.edit} />)}
                  {dailyGoals.length === 0 && <div style={{ color: MUTED, fontSize: 12, textAlign: "center", padding: "16px 0" }}>No goals yet!</div>}
                </div>
                <AddGoalForm onAdd={daily.add} placeholder="Today's goal…" />
              </SectionCard>
              <SectionCard title="MONTHLY GOALS" icon={icons.calendar} accent={ACCENT2} extra={<RadialProgress pct={monthlyCompletion} size={44} color={ACCENT2} />}>
                <div style={{ height: 60, marginBottom: 12 }}>
                  <BarChart data={[
                    { value: monthlyGoals.filter(g => g.priority === "high" && g.done).length, color: ACCENT2 },
                    { value: monthlyGoals.filter(g => g.priority === "medium" && g.done).length, color: ACCENT },
                    { value: monthlyGoals.filter(g => g.priority === "low" && g.done).length, color: GOLD },
                    { value: monthlyGoals.filter(g => g.priority === "high" && !g.done).length, color: `${ACCENT2}44` },
                    { value: monthlyGoals.filter(g => g.priority === "medium" && !g.done).length, color: `${ACCENT}44` },
                    { value: monthlyGoals.filter(g => g.priority === "low" && !g.done).length, color: `${GOLD}44` },
                  ]} height={60} labels={["✓H", "✓M", "✓L", "○H", "○M", "○L"]} />
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {monthlyGoals.map(g => <GoalItem key={g.id} goal={g} onToggle={monthly.toggle} onDelete={monthly.delete} onEdit={monthly.edit} />)}
                  {monthlyGoals.length === 0 && <div style={{ color: MUTED, fontSize: 12, textAlign: "center", padding: "16px 0" }}>No monthly goals set.</div>}
                </div>
                <AddGoalForm onAdd={monthly.add} placeholder="This month's goal…" />
              </SectionCard>
              <SectionCard title="3-MONTH GOALS" icon={icons.target} accent={GOLD} extra={<RadialProgress pct={quarterCompletion} size={44} color={GOLD} />}>
                <div style={{ height: 60, marginBottom: 12 }}>
                  <BarChart data={[{ value: quarterGoals.filter(g => g.done).length, color: GOLD }, { value: quarterGoals.filter(g => !g.done).length, color: `${GOLD}33` }]} height={60} labels={["Done", "Pending"]} />
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {quarterGoals.map(g => <GoalItem key={g.id} goal={g} onToggle={quarter.toggle} onDelete={quarter.delete} onEdit={quarter.edit} />)}
                  {quarterGoals.length === 0 && <div style={{ color: MUTED, fontSize: 12, textAlign: "center", padding: "16px 0" }}>No quarterly goals set.</div>}
                </div>
                <AddGoalForm onAdd={quarter.add} placeholder="3-month milestone…" />
              </SectionCard>
            </div>
          </div>
        )}

        {/* ════ FINANCE ════ */}
        {activeTab === "finance" && (
          <div style={{ animation: "slide-in 0.3s ease" }}>
            <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Financial Tracker</h1>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>Track revenue, expenses, and your path to R10,000,000</p>
            <div style={{ background: `linear-gradient(135deg, ${CARD} 0%, #0F1A14 100%)`, border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: 28, marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `${ACCENT}08` }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Mono', monospace", letterSpacing: 2 }}>TOTAL REVENUE</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: ACCENT, fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>R{totalRevenue.toLocaleString("en-ZA")}</div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Goal: R10,000,000 · {(progressPct * 100).toFixed(3)}% there</div>
                </div>
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                  <div><div style={{ fontSize: 10, color: MUTED }}>ON-TRACK TARGET</div><div style={{ fontSize: 20, fontWeight: 800, color: targetByNow > totalRevenue ? ACCENT2 : ACCENT, fontFamily: "'Space Mono', monospace" }}>R{targetByNow.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}</div></div>
                  <div><div style={{ fontSize: 10, color: MUTED }}>GAP</div><div style={{ fontSize: 20, fontWeight: 800, color: ACCENT2, fontFamily: "'Space Mono', monospace" }}>R{Math.max(0, targetByNow - totalRevenue).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}</div></div>
                  <div><div style={{ fontSize: 10, color: MUTED }}>NET</div><div style={{ fontSize: 20, fontWeight: 800, color: netIncome >= 0 ? ACCENT : ACCENT2, fontFamily: "'Space Mono', monospace" }}>R{netIncome.toLocaleString("en-ZA")}</div></div>
                </div>
              </div>
              <div style={{ marginTop: 20, background: BORDER, borderRadius: 8, height: 8 }}>
                <div style={{ background: `linear-gradient(90deg, ${ACCENT}, #00D9A6 60%, ${GOLD})`, height: "100%", borderRadius: 8, width: `${Math.max(progressPct * 100, 0.5)}%`, transition: "width 1s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: MUTED, marginTop: 4 }}>
                <span>R0</span><span>R2.5M</span><span>R5M</span><span>R7.5M</span><span>R10M 🎯</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Daily Need", value: `R${dailyTarget.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`, color: ACCENT },
                { label: "Monthly Need", value: `R${monthlyTarget.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`, color: ACCENT2 },
                { label: "Yearly Need", value: `R${(monthlyTarget * 12).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`, color: GOLD },
                { label: "Months Left", value: `${Math.round(daysRemaining / 30)}`, color: PURPLE },
              ].map((s, i) => <StatTile key={i} {...s} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <SectionCard title="REVENUE STREAMS" icon={icons.money} accent={ACCENT}>
                {Object.entries(revenueByCategory).length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <BarChart data={Object.entries(revenueByCategory).map(([, v]) => ({ value: v, color: ACCENT }))} height={60} labels={Object.keys(revenueByCategory)} />
                  </div>
                )}
                <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
                  {revenues.length === 0 && <div style={{ color: MUTED, fontSize: 12, textAlign: "center", padding: "12px 0" }}>No revenue entries yet.</div>}
                  {revenues.map(r => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                      <div><div style={{ color: TEXT }}>{r.label}</div><div style={{ fontSize: 10, color: MUTED }}>{r.category} · {r.date}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: ACCENT, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>+R{Number(r.amount).toLocaleString("en-ZA")}</span>
                        <button onClick={() => setRevenues(rv => rv.filter(x => x.id !== r.id))} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><Icon d={icons.trash} size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={newRevenue.label} onChange={e => setNewRevenue(r => ({ ...r, label: e.target.value }))} placeholder="Source label" style={{ flex: 2, minWidth: 80, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", color: TEXT, fontSize: 12, outline: "none" }} />
                  <input value={newRevenue.amount} onChange={e => setNewRevenue(r => ({ ...r, amount: e.target.value }))} placeholder="R Amount" type="number" style={{ flex: 1, minWidth: 70, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", color: TEXT, fontSize: 12, outline: "none" }} />
                  <select value={newRevenue.category} onChange={e => setNewRevenue(r => ({ ...r, category: e.target.value }))} style={{ flex: 1, minWidth: 80, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", color: MUTED, fontSize: 12, outline: "none" }}>
                    {["freelance", "consulting", "product", "investment", "salary", "other"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => { if (newRevenue.label && newRevenue.amount) { setRevenues(r => [...r, { ...newRevenue, id: Date.now().toString(), date: new Date().toLocaleDateString("en-ZA") }]); setNewRevenue({ label: "", amount: "", category: "freelance" }); } }} style={{ background: ACCENT, color: BG, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+</button>
                </div>
              </SectionCard>
              <SectionCard title="EXPENSES" icon={icons.chart} accent={ACCENT2}>
                <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
                  {expenses.length === 0 && <div style={{ color: MUTED, fontSize: 12, textAlign: "center", padding: "12px 0" }}>No expenses yet.</div>}
                  {expenses.map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                      <div><div style={{ color: TEXT }}>{e.label}</div><div style={{ fontSize: 10, color: MUTED }}>{e.category} · {e.date}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: ACCENT2, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>-R{Number(e.amount).toLocaleString("en-ZA")}</span>
                        <button onClick={() => setExpenses(ex => ex.filter(x => x.id !== e.id))} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><Icon d={icons.trash} size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={newExpense.label} onChange={e => setNewExpense(r => ({ ...r, label: e.target.value }))} placeholder="Expense label" style={{ flex: 2, minWidth: 80, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", color: TEXT, fontSize: 12, outline: "none" }} />
                  <input value={newExpense.amount} onChange={e => setNewExpense(r => ({ ...r, amount: e.target.value }))} placeholder="R Amount" type="number" style={{ flex: 1, minWidth: 70, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", color: TEXT, fontSize: 12, outline: "none" }} />
                  <button onClick={() => { if (newExpense.label && newExpense.amount) { setExpenses(ex => [...ex, { ...newExpense, id: Date.now().toString(), date: new Date().toLocaleDateString("en-ZA") }]); setNewExpense({ label: "", amount: "", category: "business" }); } }} style={{ background: ACCENT2, color: BG, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+</button>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* ════ AI ════ */}
        {activeTab === "ai" && (
          <div style={{ animation: "slide-in 0.3s ease", display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${ACCENT}, #00A878)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={icons.bolt} size={20} color={BG} />
                </div>
                <div>
                  <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700 }}>APEX AI</h1>
                  <div style={{ fontSize: 12, color: MUTED }}>Your personal performance intelligence engine</div>
                </div>
              </div>

              {/* Permissions */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { key: "web", label: "🌐 Web Search", val: webPermission, set: setWebPermission, activeColor: ACCENT },
                  { key: "file", label: "📁 File Access", val: filePermission, set: setFilePermission, activeColor: GOLD },
                  { key: "edit", label: "⚙️ Edit App", val: editAppPermission, set: setEditAppPermission, activeColor: PURPLE },
                ].map(p => (
                  <button key={p.key} onClick={() => p.set(!p.val)} className={p.val && p.key === "edit" ? "edit-active" : ""} style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                    background: p.val ? `${p.activeColor}22` : CARD2,
                    border: `1px solid ${p.val ? p.activeColor : BORDER}`,
                    color: p.val ? p.activeColor : MUTED, fontWeight: p.val ? 700 : 400
                  }}>
                    {p.label} {p.val ? "✓ ON" : "OFF"}
                  </button>
                ))}
                <input ref={fileRef} type="file" style={{ display: "none" }} onChange={async e => {
                  const file = e.target.files[0];
                  if (file) { const text = await file.text().catch(() => "Binary file"); sendChat(`[File uploaded: ${file.name}]\n${text.slice(0, 3000)}`); }
                }} />
                {filePermission && (
                  <button onClick={() => fileRef.current?.click()} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", background: `${GOLD}15`, border: `1px solid ${GOLD}50`, color: GOLD }}>
                    📎 Upload File
                  </button>
                )}
              </div>

              {/* Edit app mode banner */}
              {editAppPermission && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: `${PURPLE}12`, border: `1px solid ${PURPLE}40`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon d={icons.wand} size={14} color={PURPLE} />
                  <span style={{ fontSize: 12, color: PURPLE, fontWeight: 600 }}>Edit App mode is ON — describe changes and APEX will generate a patch for you to apply.</span>
                </div>
              )}
            </div>

            {/* Chat area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 0", minHeight: 0 }}>
              {chatMessages.map((msg, i) => <ChatBubble key={i} msg={msg} onApplyPatch={applyPatch} />)}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, #00A878)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon d={icons.bolt} size={14} color={BG} />
                  </div>
                  <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "14px 14px 14px 4px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
                    {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
                    {editAppPermission && <span style={{ fontSize: 10, color: PURPLE, marginLeft: 8 }}>generating patch…</span>}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>COACHING</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {quickPrompts.map((p, i) => (
                  <button key={i} className="chip" onClick={() => sendChat(p)} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "5px 12px", color: MUTED, fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>{p}</button>
                ))}
              </div>
              {editAppPermission && (
                <>
                  <div style={{ fontSize: 10, color: PURPLE, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>✦ APP EDITS</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {editPrompts.map((p, i) => (
                      <button key={i} className="edit-chip" onClick={() => sendChat(p)} style={{ background: `${PURPLE}10`, border: `1px solid ${PURPLE}30`, borderRadius: 16, padding: "5px 12px", color: MUTED, fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>{p}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 10 }}>
              <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder={editAppPermission ? "Describe a change: 'Add a notes section', 'Change accent to blue'…" : "Ask APEX anything… (Enter to send)"}
                rows={2} style={{
                  flex: 1, background: CARD, border: `1px solid ${editAppPermission ? PURPLE + "60" : BORDER}`, borderRadius: 12,
                  padding: "12px 16px", color: TEXT, fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = editAppPermission ? PURPLE : ACCENT}
                onBlur={e => e.target.style.borderColor = editAppPermission ? `${PURPLE}60` : BORDER} />
              <button onClick={() => sendChat()} disabled={!chatInput.trim() || isTyping} style={{
                background: editAppPermission ? `linear-gradient(135deg, ${PURPLE}, #7C3AED)` : `linear-gradient(135deg, ${ACCENT}, #00A878)`,
                color: BG, border: "none", borderRadius: 12, padding: "0 20px", cursor: "pointer", fontWeight: 800, fontSize: 18,
                opacity: (!chatInput.trim() || isTyping) ? 0.5 : 1
              }}>
                <Icon d={editAppPermission ? icons.wand : icons.send} size={20} color={TEXT} />
              </button>
            </div>
          </div>
        )}

        {/* ════ PRODUCTIVITY ════ */}
        {activeTab === "productivity" && (
          <div style={{ animation: "slide-in 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700 }}>Workspace</h1>
                <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Organized branches · Double-click any node to edit</p>
              </div>
              <button onClick={() => addBranch(null, "New Branch")} style={{ background: `linear-gradient(135deg, ${ACCENT}, #00A878)`, color: BG, border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                <Icon d={icons.plus} size={15} color={BG} /> New Root Branch
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <SectionCard title="PROJECT BRANCHES" icon={icons.brain} accent={ACCENT}>
                <div style={{ maxHeight: 600, overflowY: "auto" }}>
                  {branches.map(node => <BranchNode key={node.id} node={node} depth={0} onAdd={addBranch} onDelete={deleteBranch} onEdit={editBranch} onToggle={toggleBranch} />)}
                  {branches.length === 0 && <div style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No branches yet. Create your first root branch!</div>}
                </div>
              </SectionCard>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SectionCard title="BRANCH PROGRESS" icon={icons.chart} accent={ACCENT2}>
                  {(() => {
                    const all = []; const flatten = ns => ns.forEach(n => { all.push(n); flatten(n.children || []); }); flatten(branches);
                    const done = all.filter(n => n.done).length; const total = all.length;
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <RadialProgress pct={total > 0 ? done / total : 0} size={80} color={ACCENT2} />
                        <div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT2, fontFamily: "'Space Mono', monospace" }}>{done}/{total}</div>
                          <div style={{ fontSize: 12, color: MUTED }}>tasks across all branches</div>
                          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{total - done} remaining</div>
                        </div>
                      </div>
                    );
                  })()}
                </SectionCard>
                <SectionCard title="AI WORKSPACE ASSISTANT" icon={icons.bolt} accent={GOLD}>
                  <div style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>Ask APEX to help organize or restructure your workspace</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {["Suggest branches for reaching R10M", "Give me a skill-building roadmap", "What systems should I build first?", "Create a marketing branch structure"].map((q, i) => (
                      <button key={i} className="chip" onClick={() => { setActiveTab("ai"); setTimeout(() => sendChat(q), 100); }}
                        style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                        <span style={{ color: GOLD, marginRight: 6 }}>→</span>{q}
                      </button>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="TODAY'S STATS" icon={icons.target} accent={ACCENT}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <StatTile label="Daily" value={`${dailyGoals.filter(g => g.done).length}/${dailyGoals.length}`} color={ACCENT} />
                    <StatTile label="Monthly" value={`${monthlyGoals.filter(g => g.done).length}/${monthlyGoals.length}`} color={ACCENT2} />
                    <StatTile label="3-Month" value={`${quarterGoals.filter(g => g.done).length}/${quarterGoals.length}`} color={GOLD} />
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}

        {/* ════ CODE EDITOR ════ */}
        {activeTab === "code" && (
          <div style={{ animation: "slide-in 0.3s ease" }}>
            <CodeEditor
              appSource={appSource}
              setAppSource={setAppSource}
              codeHistory={codeHistory}
              onRestoreVersion={restoreVersion}
            />
          </div>
        )}

      </div>
    </div>
  );
}
