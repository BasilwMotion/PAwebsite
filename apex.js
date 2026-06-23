// ============================================================
// APEX — Self-Improvement App
// Pure vanilla JavaScript — no HTML, no CSS files, no frameworks
// Run with: <script src="apex.js"></script> in a blank HTML page,
// OR open index.html that just has: <script src="apex.js"></script>
// Everything is built entirely through JS DOM APIs.
// ============================================================

(function () {
  "use strict";

  // ── CONSTANTS ──────────────────────────────────────────────
  const ACCENT  = "#00FFB2";
  const ACCENT2 = "#FF6B35";
  const GOLD    = "#FFD700";
  const PURPLE  = "#A78BFA";
  const BG      = "#080C10";
  const CARD    = "#0D1117";
  const CARD2   = "#111820";
  const BORDER  = "#1E2A3A";
  const TEXT    = "#E8F4FF";
  const MUTED   = "#4A6080";
  const TARGET  = 10_000_000;
  const START   = new Date("2025-06-05");
  const TWO_YR  = 2 * 365 * 24 * 60 * 60 * 1000;

  // ── STORAGE ────────────────────────────────────────────────
  const store = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // ── STATE ──────────────────────────────────────────────────
  const state = {
    activeTab: "dashboard",
    dailyGoals:   store.get("dg", []),
    monthlyGoals: store.get("mg", []),
    quarterGoals: store.get("qg", []),
    revenues:  store.get("rev", []),
    expenses:  store.get("exp", []),
    branches:  store.get("branches", [
      { id:"b1", text:"🎯 10M ZAR Mission", done:false, children:[
        { id:"b1-1", text:"Primary Income Stream", done:false, children:[
          { id:"b1-1-1", text:"Identify core skill", done:false, children:[] },
          { id:"b1-1-2", text:"Package as product/service", done:false, children:[] }
        ]},
        { id:"b1-2", text:"Secondary Income Streams", done:false, children:[] },
        { id:"b1-3", text:"Investment Portfolio", done:false, children:[] }
      ]}
    ]),
    dailyHistory: store.get("dh", []),
    chatMessages: store.get("cm", [{
      role:"assistant",
      content:`Hey! I'm APEX — your AI performance partner. 🚀\n\nYour goal: R10,000,000 in 2 years.\nThat's R416,667/month or R13,889/day.\n\nI can:\n• Suggest daily tasks & goals\n• Research income opportunities\n• Analyze your financial progress\n• Edit this app (turn on Edit App mode)\n\nWhat would you like to tackle first?`
    }]),
    webPermission:  false,
    filePermission: false,
    editPermission: false,
    appSource: store.get("appsrc", "// APEX will write edited app code here when Edit App is ON.\n// Ask APEX: \"Change the accent color\" or \"Add a habits section\""),
    codeHistory: store.get("codehist", []),
    isTyping: false,
    newRevLabel:"", newRevAmount:"", newRevCat:"freelance",
    newExpLabel:"", newExpAmount:"",
    chatInput: "",
  };

  function save() {
    store.set("dg", state.dailyGoals);
    store.set("mg", state.monthlyGoals);
    store.set("qg", state.quarterGoals);
    store.set("rev", state.revenues);
    store.set("exp", state.expenses);
    store.set("branches", state.branches);
    store.set("dh", state.dailyHistory);
    store.set("cm", state.chatMessages.slice(-100));
    store.set("appsrc", state.appSource);
    store.set("codehist", state.codeHistory);
  }

  // ── COMPUTED ───────────────────────────────────────────────
  function computed() {
    const now      = Date.now();
    const totalRev = state.revenues.reduce((s,r) => s + Number(r.amount), 0);
    const totalExp = state.expenses.reduce((s,e) => s + Number(e.amount), 0);
    const net      = totalRev - totalExp;
    const daysSince = Math.max(1, Math.floor((now - START.getTime()) / 86400000));
    const daysLeft  = Math.max(0, Math.floor((START.getTime() + TWO_YR - now) / 86400000));
    const pctTime   = Math.min(1, daysSince / 730);
    const targetNow = TARGET * pctTime;
    const progress  = Math.min(1, totalRev / TARGET);
    const mTarget   = TARGET / 24;
    const dTarget   = TARGET / 730;
    const dComp = state.dailyGoals.length   > 0 ? state.dailyGoals.filter(g=>g.done).length   / state.dailyGoals.length   : 0;
    const mComp = state.monthlyGoals.length > 0 ? state.monthlyGoals.filter(g=>g.done).length / state.monthlyGoals.length : 0;
    const qComp = state.quarterGoals.length > 0 ? state.quarterGoals.filter(g=>g.done).length / state.quarterGoals.length : 0;
    return { totalRev, totalExp, net, daysSince, daysLeft, pctTime, targetNow, progress, mTarget, dTarget, dComp, mComp, qComp };
  }

  // ── DOM HELPERS ────────────────────────────────────────────
  function el(tag, styles, attrs) {
    const e = document.createElement(tag);
    if (styles) Object.assign(e.style, styles);
    if (attrs)  Object.entries(attrs).forEach(([k,v]) => { if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v; else e.setAttribute(k,v); });
    return e;
  }
  function div(styles, attrs)   { return el("div",    styles, attrs); }
  function btn(styles, attrs)   { return el("button", styles, attrs); }
  function inp(styles, attrs)   { return el("input",  styles, attrs); }
  function span(styles, attrs)  { return el("span",   styles, attrs); }

  function applyHover(e, onStyles, offStyles) {
    e.addEventListener("mouseenter", () => Object.assign(e.style, onStyles));
    e.addEventListener("mouseleave", () => Object.assign(e.style, offStyles));
  }

  function svgIcon(path, size=18, color="currentColor") {
    const ns = "http://www.w3.org/2000/svg";
    const s  = document.createElementNS(ns, "svg");
    s.setAttribute("width", size); s.setAttribute("height", size);
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none");
    s.setAttribute("stroke", color); s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", path);
    s.appendChild(p);
    return s;
  }

  const ICONS = {
    dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    goals:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    finance:   "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    ai:        "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2M8 12h8M12 8v8",
    brain:     "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.13A3 3 0 0 1 4.46 9a3 3 0 0 1 .5-5.77A2.5 2.5 0 0 1 9.5 2",
    code:      "M16 18l6-6-6-6M8 6l-6 6 6 6",
    bolt:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    send:      "M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z",
    plus:      "M12 5v14M5 12h14",
    trash:     "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    check:     "M20 6L9 17l-5-5",
    chart:     "M18 20V10M12 20V4M6 20v-6",
    calendar:  "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
    target:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    money:     "M2 17l10 5 10-5M2 12l10 5 10-5M2 7l10-5 10 5-10 5-10-5z",
    wand:      "M15 4l5 5-12.5 12.5L2 22l1.5-5.5L15 4zM18 2l4 4",
    copy:      "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H8zM14 2v6h6",
    history:   "M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3.5M3 4v4h4",
    expand:    "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
    collapse:  "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3",
  };

  // ── INJECT GLOBAL STYLES ───────────────────────────────────
  function injectGlobalStyles() {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; background: ${BG}; color: ${TEXT}; font-family: 'DM Sans', 'Segoe UI', sans-serif; overflow: hidden; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: ${CARD}; }
      ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }
      input, textarea, select { font-family: inherit; color: ${TEXT}; }
      input::placeholder, textarea::placeholder { color: ${MUTED}; }
      select option { background: ${CARD}; color: ${TEXT}; }
      button { font-family: inherit; cursor: pointer; }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      @keyframes glowPulse { 0%,100%{box-shadow:0 0 8px ${PURPLE}40} 50%{box-shadow:0 0 20px ${PURPLE}80} }
      .apex-slide { animation: slideIn 0.25s ease; }
      .apex-typing-dot { width:6px;height:6px;border-radius:50%;background:${ACCENT};display:inline-block;animation:pulse 1.2s infinite; }
      .apex-typing-dot:nth-child(2){animation-delay:.2s}
      .apex-typing-dot:nth-child(3){animation-delay:.4s}
    `;
    document.head.appendChild(s);
  }

  // ── RADIAL PROGRESS ────────────────────────────────────────
  function makeRadial(pct, size=80, color=ACCENT) {
    const ns   = "http://www.w3.org/2000/svg";
    const wrap = div({ position:"relative", width:size+"px", height:size+"px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:"0" });
    const svg  = document.createElementNS(ns, "svg");
    svg.setAttribute("width", size); svg.setAttribute("height", size);
    svg.style.cssText = `position:absolute;transform:rotate(-90deg)`;
    const stroke = Math.max(5, size * 0.09);
    const r      = (size - stroke * 2) / 2;
    const circ   = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(pct, 1));
    const mkCirc = (clr, dash, off) => {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", size/2); c.setAttribute("cy", size/2); c.setAttribute("r", r);
      c.setAttribute("fill", "none"); c.setAttribute("stroke", clr); c.setAttribute("stroke-width", stroke);
      c.setAttribute("stroke-dasharray", dash); c.setAttribute("stroke-dashoffset", off);
      c.setAttribute("stroke-linecap", "round");
      return c;
    };
    svg.appendChild(mkCirc(BORDER, circ, 0));
    svg.appendChild(mkCirc(color, circ, offset));
    wrap.appendChild(svg);
    const lbl = div({ textAlign:"center", zIndex:"1", position:"relative" });
    lbl.appendChild(span({ fontSize: size*0.2+"px", fontWeight:"800", color, fontFamily:"'Space Mono',monospace", lineHeight:"1" }, { text: Math.round(pct*100)+"%" }));
    wrap.appendChild(lbl);
    return wrap;
  }

  // ── BAR CHART ─────────────────────────────────────────────
  function makeBarChart(data, height=80, labels) {
    const max = Math.max(...data.map(d=>d.value), 1);
    const wrap = div({ display:"flex", alignItems:"flex-end", gap:"4px", height:height+"px" });
    data.forEach((d, i) => {
      const col = div({ flex:"1", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", height:"100%" });
      const barWrap = div({ flex:"1", width:"100%", display:"flex", alignItems:"flex-end" });
      const bar = div({ width:"100%", borderRadius:"3px 3px 0 0", background:`linear-gradient(180deg,${d.color||ACCENT},${(d.color||ACCENT)+"88"})`, height:`${(d.value/max)*100}%`, minHeight: d.value>0?"3px":"0", transition:"height 0.5s ease" });
      barWrap.appendChild(bar);
      col.appendChild(barWrap);
      if (labels) { const lbl = span({ fontSize:"9px", color:MUTED, whiteSpace:"nowrap" }, { text: labels[i] }); col.appendChild(lbl); }
      wrap.appendChild(col);
    });
    return wrap;
  }

  // ── SPARKLINE ─────────────────────────────────────────────
  function makeSparkline(data, color=ACCENT, w=80, h=32) {
    if (!data || data.length < 2) return div({});
    const ns  = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", w); svg.setAttribute("height", h);
    const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max-min||1;
    const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
    const gId = "sg"+color.replace("#","");
    svg.innerHTML = `<defs><linearGradient id="${gId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${gId})"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
    return svg;
  }

  // ── SECTION CARD ──────────────────────────────────────────
  function makeSectionCard(title, iconPath, accent=ACCENT, extra) {
    const card = div({ background:CARD, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"20px", position:"relative", overflow:"hidden" });
    const topBar = div({ position:"absolute", top:"0", left:"0", right:"0", height:"2px", background:`linear-gradient(90deg,${accent},${accent}00)` });
    card.appendChild(topBar);
    const header = div({ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" });
    const left   = div({ display:"flex", alignItems:"center", gap:"9px" });
    const iconWrap = div({ width:"30px", height:"30px", borderRadius:"8px", background:`${accent}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:"0" });
    iconWrap.appendChild(svgIcon(iconPath, 15, accent));
    left.appendChild(iconWrap);
    left.appendChild(span({ fontFamily:"'Space Mono',monospace", fontWeight:"700", fontSize:"13px", color:TEXT, letterSpacing:"1px" }, { text: title }));
    header.appendChild(left);
    if (extra) header.appendChild(extra);
    card.appendChild(header);
    return card;
  }

  // ── STAT TILE ─────────────────────────────────────────────
  function makeStatTile(label, value, sub, color=ACCENT, sparkData) {
    const tile = div({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"14px 16px", flex:"1", minWidth:"120px", position:"relative", overflow:"hidden" });
    tile.appendChild(div({ fontSize:"10px", color:MUTED, letterSpacing:"1.5px", fontFamily:"'Space Mono',monospace", textTransform:"uppercase", marginBottom:"6px" }, { text: label }));
    tile.appendChild(div({ fontSize:"22px", fontWeight:"800", color, fontFamily:"'Space Mono',monospace", lineHeight:"1" }, { text: value }));
    if (sub) tile.appendChild(div({ fontSize:"11px", color:MUTED, marginTop:"4px" }, { text: sub }));
    if (sparkData) {
      const sparkWrap = div({ position:"absolute", bottom:"0", right:"0", opacity:"0.3" });
      sparkWrap.appendChild(makeSparkline(sparkData, color));
      tile.appendChild(sparkWrap);
    }
    return tile;
  }

  // ── GOAL ITEM ─────────────────────────────────────────────
  function makeGoalItem(goal, onToggle, onDelete, onEdit) {
    const row = div({ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background: goal.done ? `${ACCENT}0A` : CARD2, borderRadius:"10px", border:`1px solid ${goal.done ? ACCENT+"40" : BORDER}`, marginBottom:"6px", transition:"all 0.2s" });
    const cb  = btn({ width:"22px", height:"22px", borderRadius:"6px", border:`2px solid ${goal.done ? ACCENT : BORDER}`, background: goal.done ? ACCENT : "transparent", flexShrink:"0", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" });
    if (goal.done) cb.appendChild(svgIcon(ICONS.check, 12, BG));
    cb.addEventListener("click", () => { onToggle(goal.id); renderApp(); });
    row.appendChild(cb);
    const lbl = span({ flex:"1", fontSize:"13px", color: goal.done ? MUTED : TEXT, textDecoration: goal.done ? "line-through" : "none", cursor:"pointer" }, { text: goal.text });
    lbl.addEventListener("dblclick", () => {
      const ed = inp({ flex:"1", background:"transparent", border:"none", outline:`1px solid ${ACCENT}`, color:TEXT, fontSize:"13px", padding:"2px 6px", borderRadius:"4px" });
      ed.value = goal.text;
      ed.addEventListener("blur", () => { onEdit(goal.id, ed.value); renderApp(); });
      ed.addEventListener("keydown", e => { if (e.key==="Enter") { onEdit(goal.id, ed.value); renderApp(); } });
      row.replaceChild(ed, lbl); ed.focus();
    });
    row.appendChild(lbl);
    if (goal.priority) {
      const p = span({ fontSize:"10px", padding:"2px 7px", borderRadius:"10px", background: goal.priority==="high" ? `${ACCENT2}22` : `${ACCENT}22`, color: goal.priority==="high" ? ACCENT2 : ACCENT }, { text: goal.priority });
      row.appendChild(p);
    }
    const del = btn({ background:"none", border:"none", color:MUTED, padding:"2px", display:"flex" });
    del.appendChild(svgIcon(ICONS.trash, 13, MUTED));
    del.addEventListener("click", () => { onDelete(goal.id); renderApp(); });
    row.appendChild(del);
    return row;
  }

  // ── ADD GOAL FORM ─────────────────────────────────────────
  function makeAddGoalForm(onAdd, placeholder="Add goal…") {
    const row = div({ display:"flex", gap:"8px", marginTop:"8px" });
    const input = inp({ flex:"1", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"8px 12px", color:TEXT, fontSize:"13px", outline:"none" });
    input.placeholder = placeholder;
    const sel = el("select", { background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", color:MUTED, fontSize:"12px", padding:"0 8px" });
    ["low","medium","high"].forEach(v => { const o = document.createElement("option"); o.value=v; o.text=v.charAt(0).toUpperCase()+v.slice(1); if(v==="medium") o.selected=true; sel.appendChild(o); });
    const addBtn = btn({ background:ACCENT, color:BG, border:"none", borderRadius:"8px", padding:"8px 14px", fontWeight:"700", fontSize:"13px" }, { text: "+" });
    const doAdd = () => { const t = input.value.trim(); if (t) { onAdd(t, sel.value); input.value=""; renderApp(); } };
    input.addEventListener("keydown", e => { if(e.key==="Enter") doAdd(); });
    addBtn.addEventListener("click", doAdd);
    row.appendChild(input); row.appendChild(sel); row.appendChild(addBtn);
    return row;
  }

  // ── GOAL OPERATIONS ───────────────────────────────────────
  function goalOps(key) {
    const get = () => state[key];
    return {
      add:    (text, pri)  => { state[key] = [...get(), { id: Date.now()+"", text, done:false, priority:pri, createdAt: new Date().toISOString() }]; save(); },
      toggle: id           => { state[key] = get().map(g => g.id===id ? {...g, done:!g.done} : g); save(); },
      delete: id           => { state[key] = get().filter(g => g.id!==id); save(); },
      edit:   (id, text)   => { state[key] = get().map(g => g.id===id ? {...g, text} : g); save(); },
    };
  }
  const daily   = goalOps("dailyGoals");
  const monthly = goalOps("monthlyGoals");
  const quarter = goalOps("quarterGoals");

  // ── BRANCH HELPERS ────────────────────────────────────────
  function deepMap(nodes, id, fn) { return nodes.map(n => n.id===id ? fn(n) : {...n, children: deepMap(n.children||[], id, fn)}); }
  function deepFilter(nodes, id) { return nodes.filter(n=>n.id!==id).map(n=>({...n, children: deepFilter(n.children||[], id)})); }
  function addBranch(parentId, text) {
    const node = { id: "b"+Date.now(), text, done:false, children:[] };
    if (!parentId) state.branches = [...state.branches, node];
    else state.branches = deepMap(state.branches, parentId, n => ({...n, children:[...(n.children||[]), node]}));
    save();
  }
  function deleteBranch(id) { state.branches = deepFilter(state.branches, id); save(); }
  function editBranch(id, t) { state.branches = deepMap(state.branches, id, n=>({...n, text:t})); save(); }
  function toggleBranch(id) { state.branches = deepMap(state.branches, id, n=>({...n, done:!n.done})); save(); }

  // ── BRANCH NODE ───────────────────────────────────────────
  const DEPTH_COLORS = [ACCENT, ACCENT2, GOLD, PURPLE, "#60A5FA", "#F472B6"];
  function makeBranchNode(node, depth=0) {
    const c     = DEPTH_COLORS[depth % DEPTH_COLORS.length];
    const wrap  = div({ marginLeft: depth>0 ? "20px" : "0", position:"relative" });
    if (depth>0) {
      const line = div({ position:"absolute", left:"-12px", top:"14px", width:"10px", height:"1px", background:`${c}50` });
      wrap.appendChild(line);
    }
    const row = div({ display:"flex", alignItems:"center", gap:"6px", padding:"7px 10px", borderRadius:"8px", border:`1px solid ${c}30`, background:`${c}08`, marginBottom:"4px" });
    let childrenWrap = null;
    let collapsed = false;

    // collapse toggle
    if ((node.children||[]).length > 0) {
      const tog = btn({ background:"none", border:"none", color:c, padding:"0", width:"16px", display:"flex" });
      tog.appendChild(svgIcon(ICONS.collapse, 12, c));
      tog.addEventListener("click", () => {
        collapsed = !collapsed;
        childrenWrap.style.display = collapsed ? "none" : "block";
        tog.innerHTML = ""; tog.appendChild(svgIcon(collapsed ? ICONS.expand : ICONS.collapse, 12, c));
      });
      row.appendChild(tog);
    }

    // done toggle
    const done = btn({ width:"16px", height:"16px", borderRadius:"4px", border:`1.5px solid ${node.done ? c : BORDER}`, background: node.done ? c : "transparent", flexShrink:"0", display:"flex", alignItems:"center", justifyContent:"center" });
    if (node.done) done.appendChild(svgIcon(ICONS.check, 9, BG));
    done.addEventListener("click", () => { toggleBranch(node.id); renderApp(); });
    row.appendChild(done);

    // label
    const lbl = span({ flex:"1", fontSize:"12px", color: node.done ? MUTED : TEXT, textDecoration: node.done ? "line-through" : "none" }, { text: node.text });
    lbl.addEventListener("dblclick", () => {
      const ed = inp({ flex:"1", background:"transparent", border:"none", outline:"none", color:TEXT, fontSize:"12px" });
      ed.value = node.text;
      ed.addEventListener("blur",    () => { editBranch(node.id, ed.value); renderApp(); });
      ed.addEventListener("keydown", e => { if(e.key==="Enter") { editBranch(node.id, ed.value); renderApp(); } });
      row.replaceChild(ed, lbl); ed.focus();
    });
    row.appendChild(lbl);

    // add child
    let addOpen = false;
    let addRow  = null;
    const addBtn = btn({ background:"none", border:"none", color:MUTED, padding:"2px", display:"flex" });
    addBtn.appendChild(svgIcon(ICONS.plus, 11, MUTED));
    addBtn.addEventListener("click", () => {
      addOpen = !addOpen;
      if (addRow) addRow.style.display = addOpen ? "flex" : "none";
    });
    row.appendChild(addBtn);

    const delBtn = btn({ background:"none", border:"none", color:MUTED, padding:"2px", display:"flex" });
    delBtn.appendChild(svgIcon(ICONS.trash, 11, MUTED));
    delBtn.addEventListener("click", () => { deleteBranch(node.id); renderApp(); });
    row.appendChild(delBtn);
    wrap.appendChild(row);

    // add child input
    addRow = div({ display:"none", marginLeft:"20px", marginBottom:"4px", gap:"6px" });
    const addInp = inp({ flex:"1", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"5px 10px", color:TEXT, fontSize:"12px", outline:"none" });
    addInp.placeholder = "Branch name…";
    const confBtn = btn({ background:c, color:BG, border:"none", borderRadius:"6px", padding:"5px 10px", fontWeight:"700", fontSize:"12px" }, { text:"+" });
    const doAddChild = () => { const t = addInp.value.trim(); if(t) { addBranch(node.id, t); renderApp(); } };
    addInp.addEventListener("keydown", e => { if(e.key==="Enter") doAddChild(); if(e.key==="Escape") { addOpen=false; addRow.style.display="none"; } });
    confBtn.addEventListener("click", doAddChild);
    addRow.appendChild(addInp); addRow.appendChild(confBtn);
    wrap.appendChild(addRow);

    // children
    childrenWrap = div({});
    (node.children||[]).forEach(child => childrenWrap.appendChild(makeBranchNode(child, depth+1)));
    wrap.appendChild(childrenWrap);
    return wrap;
  }

  // ── AI CHAT ───────────────────────────────────────────────
  async function sendChat(overrideMsg) {
    const text = (overrideMsg || state.chatInput).trim();
    if (!text || state.isTyping) return;
    state.chatInput = "";
    state.chatMessages = [...state.chatMessages, { role:"user", content:text }];
    state.isTyping = true;
    renderApp();

    const c = computed();
    const editKW = ["change","edit","modify","add","remove","update","make the","fix","rename","replace","color","theme","section","tab","button","font","style"];
    const isEdit = state.editPermission && editKW.some(k => text.toLowerCase().includes(k));

    const sys = `You are APEX — an elite AI performance coach and business strategist.
User goal: Earn R10,000,000 ZAR in 2 years (started June 2025).
Daily target: R${c.dTarget.toLocaleString("en-ZA",{maximumFractionDigits:0})} | Monthly: R${c.mTarget.toLocaleString("en-ZA",{maximumFractionDigits:0})}
Current revenue: R${c.totalRev.toLocaleString("en-ZA")} | Net: R${c.net.toLocaleString("en-ZA")} | Days left: ${c.daysLeft}
Daily goals: ${state.dailyGoals.map(g=>`${g.done?"✓":"○"} ${g.text}`).join(", ")||"none"}
Edit App: ${state.editPermission?"ENABLED":"disabled"} | Web: ${state.webPermission?"ENABLED":"disabled"}
${isEdit ? `
IMPORTANT: User wants to edit the app. Respond ONLY in this JSON format, nothing else:
{"message":"friendly explanation","patch":{"description":"one-line summary","oldSnippet":"old lines","newSnippet":"new lines","newCode":"THE COMPLETE UPDATED JS FILE — all lines"}}
Current app source (first 6000 chars):
${state.appSource.slice(0,6000)}` : `Be a high-performance coach. Give ACTIONABLE, SPECIFIC advice. South African context. Be direct and motivating.`}`;

    try {
      const tools = state.webPermission ? [{type:"web_search_20250305",name:"web_search"}] : undefined;
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens: isEdit ? 8000 : 1000,
          system: sys,
          messages: [...state.chatMessages.filter(m=>m.role).slice(-12), {role:"user",content:text}].map(m=>({role:m.role,content:m.content})),
          ...(tools?{tools}:{})
        })
      });
      const data = await resp.json();
      const raw  = (data.content||[]).map(i=>i.type==="text"?i.text:"").filter(Boolean).join("\n");
      if (isEdit) {
        try {
          const clean = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
          const parsed = JSON.parse(clean.slice(clean.indexOf("{")));
          state.chatMessages = [...state.chatMessages, { role:"assistant", content: parsed.message||"Here's the edit:", patch: parsed.patch }];
        } catch {
          state.chatMessages = [...state.chatMessages, { role:"assistant", content: "I prepared an edit but had a formatting issue. Here's a summary:\n\n"+raw.slice(0,400) }];
        }
      } else {
        state.chatMessages = [...state.chatMessages, { role:"assistant", content: raw||"Something went wrong. Try again." }];
      }
    } catch {
      state.chatMessages = [...state.chatMessages, { role:"assistant", content:"Connection error. Please try again." }];
    }
    state.isTyping = false;
    save();
    renderApp();
  }

  function applyPatch(patch) {
    state.codeHistory = [...state.codeHistory.slice(-19), { code: state.appSource, timestamp: new Date().toLocaleString("en-ZA"), description:"Before: "+patch.description }];
    state.appSource = patch.newCode;
    save();
    state.activeTab = "code";
    renderApp();
  }

  // ── CHAT BUBBLE ───────────────────────────────────────────
  function makeChatBubble(msg) {
    const isUser = msg.role === "user";
    const outer  = div({ display:"flex", flexDirection:"column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom:"10px" });
    const row    = div({ display:"flex", alignItems:"flex-start", gap:"8px" });
    if (!isUser) {
      const avatar = div({ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${ACCENT},#00A878)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:"0", marginTop:"2px" });
      avatar.appendChild(svgIcon(ICONS.bolt, 14, BG));
      row.appendChild(avatar);
    }
    const bubble = div({
      maxWidth:"78%", padding:"10px 14px",
      borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
      background: isUser ? `linear-gradient(135deg,${ACCENT}22,${ACCENT}15)` : CARD2,
      border: `1px solid ${isUser ? ACCENT+"40" : BORDER}`,
      fontSize:"13px", color:TEXT, lineHeight:"1.6", whiteSpace:"pre-wrap", wordBreak:"break-word"
    }, { text: msg.content });
    row.appendChild(bubble);
    outer.appendChild(row);

    if (msg.patch) {
      const patchCard = makePatchCard(msg.patch);
      patchCard.style.cssText += "margin-left:36px;margin-top:8px;max-width:90%;";
      outer.appendChild(patchCard);
    }
    return outer;
  }

  // ── PATCH CARD ────────────────────────────────────────────
  function makePatchCard(patch) {
    let applied = false;
    const card = div({ background:"#0A1628", border:`1px solid ${PURPLE}40`, borderRadius:"12px", overflow:"hidden" });
    let expanded = false;

    const header = div({ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:`${PURPLE}12`, borderBottom:`1px solid ${PURPLE}30` });
    const left   = div({ display:"flex", alignItems:"center", gap:"8px" });
    left.appendChild(svgIcon(ICONS.wand, 14, PURPLE));
    left.appendChild(span({ fontSize:"12px", fontWeight:"700", color:PURPLE, fontFamily:"'Space Mono',monospace" }, { text:"APP EDIT PROPOSED" }));
    const lineCount = span({ fontSize:"10px", color:MUTED, background:CARD2, padding:"1px 7px", borderRadius:"10px" }, { text: (patch.newCode||"").split("\n").length+" lines" });
    left.appendChild(lineCount);
    header.appendChild(left);

    const btns = div({ display:"flex", gap:"8px" });

    const togBtn = btn({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"4px 10px", color:MUTED, fontSize:"11px" }, { text:"View diff" });
    let diffWrap = null;
    togBtn.addEventListener("click", () => {
      expanded = !expanded;
      togBtn.textContent = expanded ? "Collapse" : "View diff";
      if (diffWrap) diffWrap.style.display = expanded ? "block" : "none";
    });

    const cpBtn = btn({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"6px", padding:"4px 10px", color:MUTED, fontSize:"11px" }, { text:"Copy code" });
    cpBtn.addEventListener("click", () => { navigator.clipboard.writeText(patch.newCode||""); cpBtn.textContent="✓ Copied!"; setTimeout(()=>cpBtn.textContent="Copy code",2000); });

    const applyBtn = btn({ background:`linear-gradient(135deg,${PURPLE},#7C3AED)`, border:"none", borderRadius:"6px", padding:"4px 14px", color:TEXT, fontSize:"11px", fontWeight:"700" }, { text:"⚡ Apply Patch" });
    applyBtn.addEventListener("click", () => {
      if (applied) return;
      applyPatch(patch);
      applyBtn.textContent = "✓ Saved";
      applyBtn.style.background = `${ACCENT}22`;
      applyBtn.style.color = ACCENT;
      applied = true;
    });

    btns.appendChild(togBtn); btns.appendChild(cpBtn); btns.appendChild(applyBtn);
    header.appendChild(btns);
    card.appendChild(header);

    const descRow = div({ padding:"8px 14px", fontSize:"12px", color:TEXT, borderBottom:`1px solid ${BORDER}` });
    descRow.appendChild(span({ color:MUTED }, { text:"Change: " }));
    descRow.appendChild(span({}, { text: patch.description||"" }));
    card.appendChild(descRow);

    diffWrap = div({ display:"none", maxHeight:"280px", overflowY:"auto", padding:"8px 0" });
    if (patch.oldSnippet) {
      const sec = div({ padding:"0 14px 8px" });
      sec.appendChild(div({ fontSize:"10px", color:ACCENT2, fontFamily:"'Space Mono',monospace", marginBottom:"4px" }, { text:"BEFORE" }));
      patch.oldSnippet.split("\n").forEach(line => {
        sec.appendChild(div({ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:`${ACCENT2}CC`, background:`${ACCENT2}08`, padding:"1px 8px", borderLeft:`2px solid ${ACCENT2}40` }, { text:"- "+line }));
      });
      diffWrap.appendChild(sec);
    }
    if (patch.newSnippet) {
      const sec = div({ padding:"0 14px 8px" });
      sec.appendChild(div({ fontSize:"10px", color:ACCENT, fontFamily:"'Space Mono',monospace", marginBottom:"4px" }, { text:"AFTER" }));
      patch.newSnippet.split("\n").forEach(line => {
        sec.appendChild(div({ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:`${ACCENT}CC`, background:`${ACCENT}08`, padding:"1px 8px", borderLeft:`2px solid ${ACCENT}40` }, { text:"+ "+line }));
      });
      diffWrap.appendChild(sec);
    }
    card.appendChild(diffWrap);
    return card;
  }

  // ═══════════════════════════════════════════════════════════
  // ── TAB RENDERERS ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  function renderDashboard() {
    const c   = computed();
    const now = new Date();
    const hr  = now.getHours();
    const greeting = hr<12 ? "Morning" : hr<17 ? "Afternoon" : "Evening";
    const page = div({ animation:"slideIn 0.25s ease" }); page.classList.add("apex-slide");

    // header
    const h1 = el("h1", { fontFamily:"'Space Mono',monospace", fontSize:"26px", fontWeight:"700", color:TEXT }, { text:`Good ${greeting} 👋` });
    page.appendChild(h1);
    page.appendChild(div({ color:MUTED, fontSize:"13px", marginTop:"4px", marginBottom:"24px" }, { html: `${now.toLocaleDateString("en-ZA",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · <span style="color:${ACCENT}">Day ${c.daysSince} of 730</span>` }));

    // stat row
    const statRow = div({ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" });
    statRow.appendChild(makeStatTile("Total Revenue", `R${c.totalRev.toLocaleString("en-ZA")}`, `Target: R${c.targetNow.toLocaleString("en-ZA",{maximumFractionDigits:0})}`, c.totalRev>=c.targetNow?ACCENT:ACCENT2, state.dailyHistory.slice(-6).map(d=>d.pct*100)));
    statRow.appendChild(makeStatTile("Daily Target", `R${c.dTarget.toLocaleString("en-ZA",{maximumFractionDigits:0})}`, "per day to R10M", GOLD));
    statRow.appendChild(makeStatTile("Monthly Target", `R${(c.mTarget/1000).toFixed(0)}K`, "per month needed", PURPLE));
    statRow.appendChild(makeStatTile("Days Left", `${c.daysLeft}`, `${Math.round(c.daysLeft/30)} months`, ACCENT2));
    page.appendChild(statRow);

    // 3-col cards
    const grid = div({ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"20px" });

    // daily card
    const dc = makeSectionCard("TODAY'S GOALS", ICONS.tasks, ACCENT);
    const dRow = div({ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" });
    dRow.appendChild(makeRadial(c.dComp, 64, ACCENT));
    const dRight = div({ textAlign:"right" });
    dRight.appendChild(div({ fontSize:"22px", fontWeight:"800", color:ACCENT, fontFamily:"'Space Mono',monospace" }, { text:`${state.dailyGoals.filter(g=>g.done).length}/${state.dailyGoals.length}` }));
    dRight.appendChild(div({ fontSize:"11px", color:MUTED }, { text:"completed" }));
    dRow.appendChild(dRight);
    dc.appendChild(dRow);
    state.dailyGoals.slice(0,3).forEach(g => {
      const r = div({ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px", fontSize:"12px", color: g.done?MUTED:TEXT });
      const dot = div({ width:"6px", height:"6px", borderRadius:"50%", background: g.done?ACCENT:BORDER, flexShrink:"0" });
      r.appendChild(dot);
      r.appendChild(span({ textDecoration: g.done?"line-through":"none" }, { text:g.text }));
      dc.appendChild(r);
    });
    if (state.dailyGoals.length > 3) dc.appendChild(div({ fontSize:"11px", color:MUTED, marginTop:"4px" }, { text:`+${state.dailyGoals.length-3} more` }));
    grid.appendChild(dc);

    // monthly card
    const mc = makeSectionCard("MONTHLY GOALS", ICONS.calendar, ACCENT2);
    const mRow = div({ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" });
    mRow.appendChild(makeRadial(c.mComp, 64, ACCENT2));
    const mRight = div({ textAlign:"right" });
    mRight.appendChild(div({ fontSize:"22px", fontWeight:"800", color:ACCENT2, fontFamily:"'Space Mono',monospace" }, { text:`${state.monthlyGoals.filter(g=>g.done).length}/${state.monthlyGoals.length}` }));
    mRight.appendChild(div({ fontSize:"11px", color:MUTED }, { text:"completed" }));
    mRow.appendChild(mRight);
    mc.appendChild(mRow);
    state.monthlyGoals.slice(0,3).forEach(g => {
      const r = div({ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px", fontSize:"12px", color: g.done?MUTED:TEXT });
      r.appendChild(div({ width:"6px", height:"6px", borderRadius:"50%", background: g.done?ACCENT2:BORDER, flexShrink:"0" }));
      r.appendChild(span({ textDecoration: g.done?"line-through":"none" }, { text:g.text }));
      mc.appendChild(r);
    });
    grid.appendChild(mc);

    // finance card
    const fc = makeSectionCard("FINANCE", ICONS.money, GOLD);
    fc.appendChild(div({ fontSize:"10px", color:MUTED, marginBottom:"3px" }, { text:"NET INCOME" }));
    fc.appendChild(div({ fontSize:"24px", fontWeight:"800", color: c.net>=0?ACCENT:ACCENT2, fontFamily:"'Space Mono',monospace", marginBottom:"10px" }, { text:`R${c.net.toLocaleString("en-ZA")}` }));
    const fRow = div({ display:"flex", gap:"12px", marginBottom:"10px" });
    const fRev = div({}); fRev.appendChild(div({ fontSize:"10px", color:MUTED }, { text:"Revenue" })); fRev.appendChild(div({ fontSize:"14px", fontWeight:"700", color:ACCENT }, { text:`R${c.totalRev.toLocaleString("en-ZA")}` }));
    const fExp = div({}); fExp.appendChild(div({ fontSize:"10px", color:MUTED }, { text:"Expenses" })); fExp.appendChild(div({ fontSize:"14px", fontWeight:"700", color:ACCENT2 }, { text:`R${c.totalExp.toLocaleString("en-ZA")}` }));
    fRow.appendChild(fRev); fRow.appendChild(fExp); fc.appendChild(fRow);
    const progBar = div({ background:`${ACCENT}15`, borderRadius:"6px", height:"4px" });
    const progFill = div({ background:`linear-gradient(90deg,${GOLD},${ACCENT})`, height:"100%", borderRadius:"6px", width:`${c.progress*100}%` });
    progBar.appendChild(progFill); fc.appendChild(progBar);
    fc.appendChild(div({ fontSize:"10px", color:MUTED, marginTop:"3px" }, { text:`${(c.progress*100).toFixed(3)}% toward R10M` }));
    grid.appendChild(fc);
    page.appendChild(grid);

    // history chart
    const hc = makeSectionCard("7-DAY COMPLETION RATE", ICONS.chart, ACCENT);
    const hist7 = state.dailyHistory.slice(-7);
    if (hist7.length > 0) {
      hc.appendChild(makeBarChart(hist7.map(d=>({value:d.pct*100,color:ACCENT})), 80, hist7.map(d=>d.date.slice(5))));
    } else {
      hc.appendChild(div({ color:MUTED, fontSize:"13px", textAlign:"center", padding:"20px 0" }, { text:"Complete daily goals to see your history!" }));
    }
    hc.style.marginBottom = "16px";
    page.appendChild(hc);

    // quick AI
    const qa = makeSectionCard("QUICK AI ACTIONS", ICONS.bolt, GOLD);
    const qRow = div({ display:"flex", flexWrap:"wrap", gap:"8px" });
    ["Suggest 5 daily goals for today","Best ways to make money in SA?","Analyze my R10M progress","Build me a productivity schedule"].forEach(p => {
      const b = btn({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"20px", padding:"7px 14px", color:MUTED, fontSize:"12px", transition:"all 0.2s" }, { text:p });
      applyHover(b, {background:`${ACCENT}22`,color:ACCENT}, {background:CARD2,color:MUTED});
      b.addEventListener("click", () => { state.activeTab="ai"; renderApp(); setTimeout(()=>sendChat(p),50); });
      qRow.appendChild(b);
    });
    qa.appendChild(qRow);
    page.appendChild(qa);
    return page;
  }

  function renderGoals() {
    const c    = computed();
    const page = div({}); page.classList.add("apex-slide");
    page.appendChild(el("h1", { fontFamily:"'Space Mono',monospace", fontSize:"24px", fontWeight:"700", marginBottom:"6px" }, { text:"Goal Tracker" }));
    page.appendChild(div({ color:MUTED, fontSize:"13px", marginBottom:"24px" }, { text:"Daily · Monthly · 3-Month milestones toward R10M" }));

    const grid = div({ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"20px" });

    // helper to make a goal column
    function goalCol(title, icon, accent, goals, ops, pct, barData, barLabels, placeholder) {
      const card = makeSectionCard(title, icon, accent, makeRadial(pct, 44, accent));
      const barWrap = div({ height:"60px", marginBottom:"12px" });
      barWrap.appendChild(makeBarChart(barData, 60, barLabels));
      card.appendChild(barWrap);
      const scroll = div({ maxHeight:"300px", overflowY:"auto" });
      if (goals.length === 0) scroll.appendChild(div({ color:MUTED, fontSize:"12px", textAlign:"center", padding:"16px 0" }, { text:"No goals yet." }));
      goals.forEach(g => scroll.appendChild(makeGoalItem(g, ops.toggle, ops.delete, ops.edit)));
      card.appendChild(scroll);
      card.appendChild(makeAddGoalForm(ops.add, placeholder));
      return card;
    }

    const hist7 = state.dailyHistory.slice(-7);
    grid.appendChild(goalCol("DAILY GOALS", ICONS.tasks, ACCENT, state.dailyGoals, daily, c.dComp,
      hist7.length>0 ? hist7.map(d=>({value:d.pct*100,color:ACCENT})) : [{value:0,color:ACCENT}],
      hist7.map(d=>d.date.slice(5)), "Today's goal…"));

    grid.appendChild(goalCol("MONTHLY GOALS", ICONS.calendar, ACCENT2, state.monthlyGoals, monthly, c.mComp, [
      {value:state.monthlyGoals.filter(g=>g.priority==="high"&&g.done).length,color:ACCENT2},
      {value:state.monthlyGoals.filter(g=>g.priority==="medium"&&g.done).length,color:ACCENT},
      {value:state.monthlyGoals.filter(g=>g.priority==="low"&&g.done).length,color:GOLD},
      {value:state.monthlyGoals.filter(g=>g.priority==="high"&&!g.done).length,color:ACCENT2+"44"},
      {value:state.monthlyGoals.filter(g=>g.priority==="medium"&&!g.done).length,color:ACCENT+"44"},
      {value:state.monthlyGoals.filter(g=>g.priority==="low"&&!g.done).length,color:GOLD+"44"},
    ], ["✓H","✓M","✓L","○H","○M","○L"], "This month's goal…"));

    grid.appendChild(goalCol("3-MONTH GOALS", ICONS.target, GOLD, state.quarterGoals, quarter, c.qComp,
      [{value:state.quarterGoals.filter(g=>g.done).length,color:GOLD},{value:state.quarterGoals.filter(g=>!g.done).length,color:GOLD+"33"}],
      ["Done","Pending"], "3-month milestone…"));

    page.appendChild(grid);
    return page;
  }

  function renderFinance() {
    const c    = computed();
    const page = div({}); page.classList.add("apex-slide");
    page.appendChild(el("h1", { fontFamily:"'Space Mono',monospace", fontSize:"24px", fontWeight:"700", marginBottom:"6px" }, { text:"Financial Tracker" }));
    page.appendChild(div({ color:MUTED, fontSize:"13px", marginBottom:"24px" }, { text:"Track revenue, expenses, and your path to R10,000,000" }));

    // big progress card
    const hero = div({ background:`linear-gradient(135deg,${CARD} 0%,#0F1A14 100%)`, border:`1px solid ${ACCENT}30`, borderRadius:"20px", padding:"28px", marginBottom:"20px", position:"relative", overflow:"hidden" });
    const glowCirc = div({ position:"absolute", top:"-40px", right:"-40px", width:"160px", height:"160px", borderRadius:"50%", background:`${ACCENT}08` });
    hero.appendChild(glowCirc);
    const heroInner = div({ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"20px" });
    const heroLeft  = div({});
    heroLeft.appendChild(div({ fontSize:"11px", color:MUTED, fontFamily:"'Space Mono',monospace", letterSpacing:"2px" }, { text:"TOTAL REVENUE" }));
    heroLeft.appendChild(div({ fontSize:"42px", fontWeight:"900", color:ACCENT, fontFamily:"'Space Mono',monospace", lineHeight:"1.1" }, { text:`R${c.totalRev.toLocaleString("en-ZA")}` }));
    heroLeft.appendChild(div({ fontSize:"13px", color:MUTED, marginTop:"4px" }, { text:`Goal: R10,000,000 · ${(c.progress*100).toFixed(3)}% there` }));
    heroInner.appendChild(heroLeft);
    const heroRight = div({ display:"flex", gap:"40px", flexWrap:"wrap" });
    const mkHeroStat = (lbl, val, clr) => { const d2=div({}); d2.appendChild(div({fontSize:"10px",color:MUTED},{text:lbl})); d2.appendChild(div({fontSize:"20px",fontWeight:"800",color:clr,fontFamily:"'Space Mono',monospace"},{text:val})); return d2; };
    heroRight.appendChild(mkHeroStat("ON-TRACK TARGET", `R${c.targetNow.toLocaleString("en-ZA",{maximumFractionDigits:0})}`, c.targetNow>c.totalRev?ACCENT2:ACCENT));
    heroRight.appendChild(mkHeroStat("GAP", `R${Math.max(0,c.targetNow-c.totalRev).toLocaleString("en-ZA",{maximumFractionDigits:0})}`, ACCENT2));
    heroRight.appendChild(mkHeroStat("NET", `R${c.net.toLocaleString("en-ZA")}`, c.net>=0?ACCENT:ACCENT2));
    heroInner.appendChild(heroRight);
    hero.appendChild(heroInner);
    const progWrap = div({ marginTop:"20px", background:BORDER, borderRadius:"8px", height:"8px" });
    const progFill = div({ background:`linear-gradient(90deg,${ACCENT},#00D9A6 60%,${GOLD})`, height:"100%", borderRadius:"8px", width:`${Math.max(c.progress*100,0.5)}%`, transition:"width 1s" });
    progWrap.appendChild(progFill); hero.appendChild(progWrap);
    const milestones = div({ display:"flex", justifyContent:"space-between", fontSize:"10px", color:MUTED, marginTop:"4px" });
    ["R0","R2.5M","R5M","R7.5M","R10M 🎯"].forEach(m => milestones.appendChild(span({},{text:m})));
    hero.appendChild(milestones);
    page.appendChild(hero);

    // stat row
    const statRow = div({ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" });
    statRow.appendChild(makeStatTile("Daily Need", `R${c.dTarget.toLocaleString("en-ZA",{maximumFractionDigits:0})}`, "", ACCENT));
    statRow.appendChild(makeStatTile("Monthly Need", `R${c.mTarget.toLocaleString("en-ZA",{maximumFractionDigits:0})}`, "", ACCENT2));
    statRow.appendChild(makeStatTile("Yearly Need", `R${(c.mTarget*12).toLocaleString("en-ZA",{maximumFractionDigits:0})}`, "", GOLD));
    statRow.appendChild(makeStatTile("Months Left", `${Math.round(c.daysLeft/30)}`, "", PURPLE));
    page.appendChild(statRow);

    const grid = div({ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" });

    // revenue card
    const revCard = makeSectionCard("REVENUE STREAMS", ICONS.money, ACCENT);
    const revByCat = state.revenues.reduce((a,r)=>{ a[r.category]=(a[r.category]||0)+Number(r.amount); return a; }, {});
    if (Object.keys(revByCat).length > 0) {
      const bw = div({ marginBottom:"12px" });
      bw.appendChild(makeBarChart(Object.values(revByCat).map(v=>({value:v,color:ACCENT})), 60, Object.keys(revByCat)));
      revCard.appendChild(bw);
    }
    const revScroll = div({ maxHeight:"220px", overflowY:"auto", marginBottom:"12px" });
    if (state.revenues.length===0) revScroll.appendChild(div({ color:MUTED, fontSize:"12px", textAlign:"center", padding:"12px 0" }, { text:"No revenue entries yet." }));
    state.revenues.forEach(r => {
      const row = div({ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${BORDER}`, fontSize:"13px" });
      const left = div({}); left.appendChild(div({ color:TEXT }, { text:r.label })); left.appendChild(div({ fontSize:"10px", color:MUTED }, { text:`${r.category} · ${r.date}` }));
      const right = div({ display:"flex", alignItems:"center", gap:"10px" });
      right.appendChild(span({ color:ACCENT, fontFamily:"'Space Mono',monospace", fontWeight:"700" }, { text:`+R${Number(r.amount).toLocaleString("en-ZA")}` }));
      const db = btn({ background:"none", border:"none", color:MUTED, display:"flex" }); db.appendChild(svgIcon(ICONS.trash,13,MUTED)); db.addEventListener("click",()=>{ state.revenues=state.revenues.filter(x=>x.id!==r.id); save(); renderApp(); });
      right.appendChild(db); row.appendChild(left); row.appendChild(right); revScroll.appendChild(row);
    });
    revCard.appendChild(revScroll);
    // add rev
    const addRevRow = div({ display:"flex", gap:"8px", flexWrap:"wrap" });
    const rl = inp({ flex:"2", minWidth:"80px", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"7px 10px", color:TEXT, fontSize:"12px", outline:"none" }); rl.placeholder="Source label";
    const ra = inp({ flex:"1", minWidth:"70px", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"7px 10px", color:TEXT, fontSize:"12px", outline:"none" }); ra.placeholder="R Amount"; ra.type="number";
    const rc = el("select", { flex:"1", minWidth:"80px", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"7px 10px", color:MUTED, fontSize:"12px", outline:"none" });
    ["freelance","consulting","product","investment","salary","other"].forEach(v=>{ const o=document.createElement("option"); o.value=v; o.text=v; rc.appendChild(o); });
    const rb = btn({ background:ACCENT, color:BG, border:"none", borderRadius:"8px", padding:"7px 14px", fontWeight:"700", fontSize:"13px" }, { text:"+" });
    rb.addEventListener("click", () => { if(rl.value&&ra.value){ state.revenues=[...state.revenues,{id:Date.now()+"",label:rl.value,amount:ra.value,category:rc.value,date:new Date().toLocaleDateString("en-ZA")}]; rl.value=""; ra.value=""; save(); renderApp(); } });
    addRevRow.appendChild(rl); addRevRow.appendChild(ra); addRevRow.appendChild(rc); addRevRow.appendChild(rb);
    revCard.appendChild(addRevRow);
    grid.appendChild(revCard);

    // expense card
    const expCard = makeSectionCard("EXPENSES", ICONS.chart, ACCENT2);
    const expScroll = div({ maxHeight:"220px", overflowY:"auto", marginBottom:"12px" });
    if (state.expenses.length===0) expScroll.appendChild(div({ color:MUTED, fontSize:"12px", textAlign:"center", padding:"12px 0" }, { text:"No expenses yet." }));
    state.expenses.forEach(e => {
      const row = div({ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${BORDER}`, fontSize:"13px" });
      const left = div({}); left.appendChild(div({ color:TEXT }, { text:e.label })); left.appendChild(div({ fontSize:"10px", color:MUTED }, { text:`${e.category} · ${e.date}` }));
      const right = div({ display:"flex", alignItems:"center", gap:"10px" });
      right.appendChild(span({ color:ACCENT2, fontFamily:"'Space Mono',monospace", fontWeight:"700" }, { text:`-R${Number(e.amount).toLocaleString("en-ZA")}` }));
      const db = btn({ background:"none", border:"none", color:MUTED, display:"flex" }); db.appendChild(svgIcon(ICONS.trash,13,MUTED)); db.addEventListener("click",()=>{ state.expenses=state.expenses.filter(x=>x.id!==e.id); save(); renderApp(); });
      right.appendChild(db); row.appendChild(left); row.appendChild(right); expScroll.appendChild(row);
    });
    expCard.appendChild(expScroll);
    const addExpRow = div({ display:"flex", gap:"8px", flexWrap:"wrap" });
    const el2 = inp({ flex:"2", minWidth:"80px", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"7px 10px", color:TEXT, fontSize:"12px", outline:"none" }); el2.placeholder="Expense label";
    const ea  = inp({ flex:"1", minWidth:"70px", background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"7px 10px", color:TEXT, fontSize:"12px", outline:"none" }); ea.placeholder="R Amount"; ea.type="number";
    const eb  = btn({ background:ACCENT2, color:BG, border:"none", borderRadius:"8px", padding:"7px 14px", fontWeight:"700", fontSize:"13px" }, { text:"+" });
    eb.addEventListener("click", () => { if(el2.value&&ea.value){ state.expenses=[...state.expenses,{id:Date.now()+"",label:el2.value,amount:ea.value,category:"business",date:new Date().toLocaleDateString("en-ZA")}]; el2.value=""; ea.value=""; save(); renderApp(); } });
    addExpRow.appendChild(el2); addExpRow.appendChild(ea); addExpRow.appendChild(eb);
    expCard.appendChild(addExpRow);
    grid.appendChild(expCard);
    page.appendChild(grid);
    return page;
  }

  function renderAI() {
    const page = div({ display:"flex", flexDirection:"column", height:"calc(100vh - 56px)" }); page.classList.add("apex-slide");

    // header
    const hdr = div({ marginBottom:"16px" });
    const hdrTop = div({ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" });
    const avatar = div({ width:"40px", height:"40px", borderRadius:"12px", background:`linear-gradient(135deg,${ACCENT},#00A878)`, display:"flex", alignItems:"center", justifyContent:"center" });
    avatar.appendChild(svgIcon(ICONS.bolt, 20, BG));
    hdrTop.appendChild(avatar);
    const hdrText = div({});
    hdrText.appendChild(el("h1", { fontFamily:"'Space Mono',monospace", fontSize:"22px", fontWeight:"700" }, { text:"APEX AI" }));
    hdrText.appendChild(div({ fontSize:"12px", color:MUTED }, { text:"Your personal performance intelligence engine" }));
    hdrTop.appendChild(hdrText);
    hdr.appendChild(hdrTop);

    // permissions
    const permRow = div({ display:"flex", gap:"10px", flexWrap:"wrap" });
    const perms = [
      { label:"🌐 Web Search", key:"webPermission",  color:ACCENT },
      { label:"📁 File Access", key:"filePermission", color:GOLD  },
      { label:"⚙️ Edit App",   key:"editPermission", color:PURPLE},
    ];
    perms.forEach(p => {
      const b = btn({ padding:"6px 14px", borderRadius:"20px", fontSize:"12px", transition:"all 0.2s",
        background: state[p.key] ? `${p.color}22` : CARD2,
        border: `1px solid ${state[p.key] ? p.color : BORDER}`,
        color: state[p.key] ? p.color : MUTED, fontWeight: state[p.key] ? "700" : "400"
      }, { text:`${p.label} ${state[p.key]?"✓ ON":"OFF"}` });
      b.addEventListener("click", () => { state[p.key] = !state[p.key]; renderApp(); });
      permRow.appendChild(b);
    });

    // file input
    const fileInput = document.createElement("input");
    fileInput.type = "file"; fileInput.style.display = "none";
    fileInput.addEventListener("change", async e => {
      const f = e.target.files[0];
      if (f) { const t = await f.text().catch(()=>"Binary file"); sendChat(`[File: ${f.name}]\n${t.slice(0,3000)}`); }
    });
    permRow.appendChild(fileInput);
    if (state.filePermission) {
      const fb = btn({ padding:"6px 14px", borderRadius:"20px", fontSize:"12px", background:`${GOLD}15`, border:`1px solid ${GOLD}50`, color:GOLD }, { text:"📎 Upload File" });
      fb.addEventListener("click", ()=>fileInput.click());
      permRow.appendChild(fb);
    }
    hdr.appendChild(permRow);

    if (state.editPermission) {
      const banner = div({ marginTop:"10px", padding:"10px 14px", background:`${PURPLE}12`, border:`1px solid ${PURPLE}40`, borderRadius:"10px", display:"flex", alignItems:"center", gap:"10px" });
      banner.appendChild(svgIcon(ICONS.wand, 14, PURPLE));
      banner.appendChild(span({ fontSize:"12px", color:PURPLE, fontWeight:"600" }, { text:'Edit App mode ON — describe a change and APEX will generate a patch.' }));
      hdr.appendChild(banner);
    }
    page.appendChild(hdr);

    // chat area
    const chatArea = div({ flex:"1", overflowY:"auto", padding:"16px 0", minHeight:"0" });
    state.chatMessages.forEach(m => chatArea.appendChild(makeChatBubble(m)));
    if (state.isTyping) {
      const typRow = div({ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" });
      const ta = div({ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${ACCENT},#00A878)`, display:"flex", alignItems:"center", justifyContent:"center" });
      ta.appendChild(svgIcon(ICONS.bolt, 14, BG));
      typRow.appendChild(ta);
      const typBubble = div({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"14px 14px 14px 4px", padding:"12px 16px", display:"flex", gap:"4px", alignItems:"center" });
      [0,1,2].forEach(i => { const d = document.createElement("span"); d.className="apex-typing-dot"; d.style.animationDelay=`${i*0.2}s`; typBubble.appendChild(d); });
      if (state.editPermission) typBubble.appendChild(span({ fontSize:"10px", color:PURPLE, marginLeft:"8px" }, { text:"generating patch…" }));
      typRow.appendChild(typBubble);
      chatArea.appendChild(typRow);
    }
    // scroll to bottom
    requestAnimationFrame(() => { chatArea.scrollTop = chatArea.scrollHeight; });
    page.appendChild(chatArea);

    // quick prompts
    const qSection = div({ marginBottom:"8px" });
    qSection.appendChild(div({ fontSize:"10px", color:MUTED, marginBottom:"6px", fontFamily:"'Space Mono',monospace" }, { text:"COACHING" }));
    const qRow = div({ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"8px" });
    ["Suggest 5 daily goals","Best money-making in SA?","Analyze R10M progress","Build a daily schedule"].forEach(p => {
      const b = btn({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"16px", padding:"5px 12px", color:MUTED, fontSize:"11px", transition:"all 0.2s" }, { text:p });
      applyHover(b, {background:`${ACCENT}22`,color:ACCENT}, {background:CARD2,color:MUTED});
      b.addEventListener("click", ()=>sendChat(p));
      qRow.appendChild(b);
    });
    qSection.appendChild(qRow);
    if (state.editPermission) {
      qSection.appendChild(div({ fontSize:"10px", color:PURPLE, marginBottom:"6px", fontFamily:"'Space Mono',monospace" }, { text:"✦ APP EDITS" }));
      const eRow = div({ display:"flex", gap:"6px", flexWrap:"wrap" });
      ["Change accent color to electric blue","Add a Habits tracker section","Make the sidebar wider","Add a countdown timer widget"].forEach(p => {
        const b = btn({ background:`${PURPLE}10`, border:`1px solid ${PURPLE}30`, borderRadius:"16px", padding:"5px 12px", color:MUTED, fontSize:"11px", transition:"all 0.2s" }, { text:p });
        applyHover(b, {background:`${PURPLE}22`,color:PURPLE}, {background:`${PURPLE}10`,color:MUTED});
        b.addEventListener("click", ()=>sendChat(p));
        eRow.appendChild(b);
      });
      qSection.appendChild(eRow);
    }
    page.appendChild(qSection);

    // input row
    const inputRow = div({ display:"flex", gap:"10px" });
    const ta2 = el("textarea", { flex:"1", background:CARD, border:`1px solid ${state.editPermission?PURPLE+"60":BORDER}`, borderRadius:"12px", padding:"12px 16px", color:TEXT, fontSize:"13px", resize:"none", outline:"none", fontFamily:"inherit", transition:"border-color 0.2s" });
    ta2.rows = 2;
    ta2.placeholder = state.editPermission ? "Describe a change: 'Add a notes section'…" : "Ask APEX anything… (Enter to send)";
    ta2.value = state.chatInput;
    ta2.addEventListener("input", e => { state.chatInput = e.target.value; });
    ta2.addEventListener("focus", () => { ta2.style.borderColor = state.editPermission ? PURPLE : ACCENT; });
    ta2.addEventListener("blur",  () => { ta2.style.borderColor = state.editPermission ? `${PURPLE}60` : BORDER; });
    ta2.addEventListener("keydown", e => { if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendChat(); } });
    const sendBtn = btn({ background: state.editPermission ? `linear-gradient(135deg,${PURPLE},#7C3AED)` : `linear-gradient(135deg,${ACCENT},#00A878)`, color:TEXT, border:"none", borderRadius:"12px", padding:"0 20px", fontWeight:"800", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", opacity: state.isTyping?"0.5":"1" });
    sendBtn.appendChild(svgIcon(state.editPermission ? ICONS.wand : ICONS.send, 20, state.editPermission?TEXT:BG));
    sendBtn.addEventListener("click", ()=>sendChat());
    inputRow.appendChild(ta2); inputRow.appendChild(sendBtn);
    page.appendChild(inputRow);
    return page;
  }

  function renderWorkspace() {
    const page = div({}); page.classList.add("apex-slide");
    const topRow = div({ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" });
    const topLeft = div({});
    topLeft.appendChild(el("h1", { fontFamily:"'Space Mono',monospace", fontSize:"24px", fontWeight:"700" }, { text:"Workspace" }));
    topLeft.appendChild(div({ color:MUTED, fontSize:"13px", marginTop:"4px" }, { text:"Organized branches · Double-click any node to edit" }));
    topRow.appendChild(topLeft);
    const newBranchBtn = btn({ background:`linear-gradient(135deg,${ACCENT},#00A878)`, color:BG, border:"none", borderRadius:"10px", padding:"10px 18px", fontWeight:"700", fontSize:"13px", display:"flex", alignItems:"center", gap:"7px" });
    newBranchBtn.appendChild(svgIcon(ICONS.plus, 15, BG));
    newBranchBtn.appendChild(span({},{text:"New Root Branch"}));
    newBranchBtn.addEventListener("click", ()=>{ addBranch(null,"New Branch"); renderApp(); });
    topRow.appendChild(newBranchBtn);
    page.appendChild(topRow);

    const grid = div({ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" });

    // branch tree
    const bc = makeSectionCard("PROJECT BRANCHES", ICONS.brain, ACCENT);
    const bScroll = div({ maxHeight:"600px", overflowY:"auto" });
    if (state.branches.length===0) bScroll.appendChild(div({ color:MUTED, fontSize:"13px", textAlign:"center", padding:"20px 0" }, { text:"No branches yet. Create your first root branch!" }));
    state.branches.forEach(n => bScroll.appendChild(makeBranchNode(n, 0)));
    bc.appendChild(bScroll);
    grid.appendChild(bc);

    // right column
    const right = div({ display:"flex", flexDirection:"column", gap:"16px" });

    // progress card
    const allNodes = []; (function flat(ns){ ns.forEach(n=>{allNodes.push(n);flat(n.children||[]);}); })(state.branches);
    const doneN = allNodes.filter(n=>n.done).length, totalN = allNodes.length;
    const progCard = makeSectionCard("BRANCH PROGRESS", ICONS.chart, ACCENT2);
    const pRow = div({ display:"flex", alignItems:"center", gap:"20px" });
    pRow.appendChild(makeRadial(totalN>0?doneN/totalN:0, 80, ACCENT2));
    const pText = div({});
    pText.appendChild(div({ fontSize:"28px", fontWeight:"800", color:ACCENT2, fontFamily:"'Space Mono',monospace" }, { text:`${doneN}/${totalN}` }));
    pText.appendChild(div({ fontSize:"12px", color:MUTED }, { text:"tasks across all branches" }));
    pText.appendChild(div({ fontSize:"11px", color:MUTED, marginTop:"4px" }, { text:`${totalN-doneN} remaining` }));
    pRow.appendChild(pText); progCard.appendChild(pRow);
    right.appendChild(progCard);

    // AI assistant
    const aiCard = makeSectionCard("AI WORKSPACE ASSISTANT", ICONS.bolt, GOLD);
    aiCard.appendChild(div({ color:MUTED, fontSize:"12px", marginBottom:"12px" }, { text:"Ask APEX to help organize or build your workspace" }));
    const aiBtns = div({ display:"flex", flexDirection:"column", gap:"7px" });
    ["Suggest branches for reaching R10M","Give me a skill-building roadmap","What systems should I build first?","Create a marketing branch structure"].forEach(q=>{
      const b = btn({ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"9px 12px", color:MUTED, fontSize:"12px", textAlign:"left", transition:"all 0.2s" });
      b.appendChild(span({ color:GOLD, marginRight:"6px" }, { text:"→" })); b.appendChild(span({},{text:q}));
      applyHover(b, {background:`${GOLD}12`,color:GOLD,borderColor:`${GOLD}40`}, {background:CARD2,color:MUTED,borderColor:BORDER});
      b.addEventListener("click", ()=>{ state.activeTab="ai"; renderApp(); setTimeout(()=>sendChat(q),50); });
      aiBtns.appendChild(b);
    });
    aiCard.appendChild(aiBtns);
    right.appendChild(aiCard);

    // today's stats
    const c = computed();
    const statsCard = makeSectionCard("TODAY'S STATS", ICONS.target, ACCENT);
    const sRow = div({ display:"flex", gap:"12px" });
    sRow.appendChild(makeStatTile("Daily", `${state.dailyGoals.filter(g=>g.done).length}/${state.dailyGoals.length}`, "", ACCENT));
    sRow.appendChild(makeStatTile("Monthly", `${state.monthlyGoals.filter(g=>g.done).length}/${state.monthlyGoals.length}`, "", ACCENT2));
    sRow.appendChild(makeStatTile("3-Month", `${state.quarterGoals.filter(g=>g.done).length}/${state.quarterGoals.length}`, "", GOLD));
    statsCard.appendChild(sRow);
    right.appendChild(statsCard);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  function renderCode() {
    const page = div({}); page.classList.add("apex-slide");

    // toolbar
    const toolbar = div({ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" });
    const tlLeft  = div({ display:"flex", alignItems:"center", gap:"10px" });
    const tlIcon  = div({ width:"32px", height:"32px", borderRadius:"8px", background:`${PURPLE}20`, display:"flex", alignItems:"center", justifyContent:"center" });
    tlIcon.appendChild(svgIcon(ICONS.code, 16, PURPLE));
    tlLeft.appendChild(tlIcon);
    const tlTitle = div({});
    tlTitle.appendChild(div({ fontFamily:"'Space Mono',monospace", fontWeight:"700", fontSize:"15px" }, { text:"Code Editor" }));
    tlTitle.appendChild(div({ fontSize:"11px", color:MUTED }, { text:`apex.js · ${state.appSource.split("\n").length} lines` }));
    tlLeft.appendChild(tlTitle);
    toolbar.appendChild(tlLeft);

    const tlBtns = div({ display:"flex", gap:"8px", alignItems:"center" });
    const cpBtn = btn({ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"8px", border:`1px solid ${BORDER}`, background:CARD2, color:MUTED, fontSize:"12px" });
    cpBtn.appendChild(svgIcon(ICONS.copy, 13, MUTED)); cpBtn.appendChild(span({},{text:"Copy all"}));
    cpBtn.addEventListener("click", ()=>{ navigator.clipboard.writeText(state.appSource); cpBtn.lastChild.textContent="✓ Copied!"; setTimeout(()=>cpBtn.lastChild.textContent="Copy all",2000); });

    const saveBtn = btn({ display:"flex", alignItems:"center", gap:"6px", padding:"7px 18px", borderRadius:"8px", border:"none", background:`linear-gradient(135deg,${PURPLE},#7C3AED)`, color:TEXT, fontSize:"12px", fontWeight:"700" });
    saveBtn.appendChild(svgIcon(ICONS.check, 13, TEXT)); saveBtn.appendChild(span({},{text:"Save"}));
    saveBtn.addEventListener("click", ()=>{ save(); saveBtn.lastChild.textContent="Saved!"; saveBtn.style.background=`${ACCENT}22`; saveBtn.style.color=ACCENT; setTimeout(()=>{ saveBtn.lastChild.textContent="Save"; saveBtn.style.background=`linear-gradient(135deg,${PURPLE},#7C3AED)`; saveBtn.style.color=TEXT; },2000); });
    tlBtns.appendChild(cpBtn); tlBtns.appendChild(saveBtn);
    toolbar.appendChild(tlBtns);
    page.appendChild(toolbar);

    // editor area
    const editorWrap = div({ display:"flex", gap:"0", height:"calc(100vh - 200px)", borderRadius:"12px", overflow:"hidden", border:`1px solid ${BORDER}` });
    const lineNums   = div({ width:"46px", background:"#090D13", padding:"16px 0", overflowY:"hidden", flexShrink:"0", borderRight:`1px solid ${BORDER}` });
    const lines      = state.appSource.split("\n");
    lines.forEach((_, i) => {
      lineNums.appendChild(div({ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:MUTED, textAlign:"right", paddingRight:"10px", lineHeight:"20px", height:"20px", userSelect:"none" }, { text: `${i+1}` }));
    });

    const ta = el("textarea", { flex:"1", background:"#090D13", padding:"16px", color:"#C9D5E0", fontFamily:"'Space Mono',monospace", fontSize:"11px", lineHeight:"20px", resize:"none", outline:"none", border:"none", overflowY:"auto", tabSize:"2", width:"100%" });
    ta.value = state.appSource;
    ta.addEventListener("input", e => {
      state.appSource = e.target.value;
      // refresh line numbers
      const ls = state.appSource.split("\n");
      lineNums.innerHTML = "";
      ls.forEach((_,i) => {
        lineNums.appendChild(div({ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:MUTED, textAlign:"right", paddingRight:"10px", lineHeight:"20px", height:"20px", userSelect:"none" }, { text:`${i+1}` }));
      });
    });
    ta.addEventListener("keydown", e => {
      if (e.key==="Tab") { e.preventDefault(); const s=e.target.selectionStart, end=e.target.selectionEnd; state.appSource=state.appSource.substring(0,s)+"  "+state.appSource.substring(end); ta.value=state.appSource; ta.selectionStart=ta.selectionEnd=s+2; }
      if (e.key==="s"&&(e.ctrlKey||e.metaKey)) { e.preventDefault(); save(); }
    });
    editorWrap.appendChild(lineNums); editorWrap.appendChild(ta);
    page.appendChild(editorWrap);

    // version history
    if (state.codeHistory.length > 0) {
      const histSection = div({ marginTop:"16px" });
      histSection.appendChild(div({ fontSize:"12px", fontWeight:"700", color:PURPLE, fontFamily:"'Space Mono',monospace", marginBottom:"10px" }, { text:"VERSION HISTORY" }));
      const histRow = div({ display:"flex", gap:"10px", flexWrap:"wrap" });
      [...state.codeHistory].reverse().forEach((v, i) => {
        const vCard = div({ padding:"10px 14px", background:CARD, border:`1px solid ${BORDER}`, borderRadius:"10px", minWidth:"200px" });
        vCard.appendChild(div({ fontSize:"11px", fontWeight:"700", color:TEXT }, { text:`v${state.codeHistory.length-i}` }));
        vCard.appendChild(div({ fontSize:"10px", color:MUTED, marginBottom:"4px" }, { text:v.timestamp }));
        vCard.appendChild(div({ fontSize:"11px", color:MUTED, marginBottom:"8px", lineHeight:"1.4" }, { text:v.description }));
        const restBtn = btn({ fontSize:"11px", color:PURPLE, background:`${PURPLE}15`, border:`1px solid ${PURPLE}30`, borderRadius:"5px", padding:"3px 10px" }, { text:"Restore" });
        restBtn.addEventListener("click", ()=>{ state.appSource=v.code; save(); renderApp(); });
        vCard.appendChild(restBtn);
        histRow.appendChild(vCard);
      });
      histSection.appendChild(histRow);
      page.appendChild(histSection);
    }

    page.appendChild(div({ marginTop:"10px", fontSize:"11px", color:MUTED }, { text:"Ctrl+S to save · Tab for indent · Apply patches from APEX AI to populate history" }));
    return page;
  }

  // ── RECORD DAILY HISTORY ──────────────────────────────────
  function recordDailyHistory() {
    if (state.dailyGoals.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const pct   = state.dailyGoals.filter(g=>g.done).length / state.dailyGoals.length;
    const existing = state.dailyHistory.findIndex(d=>d.date===today);
    if (existing >= 0) { state.dailyHistory[existing] = {date:today,pct}; }
    else { state.dailyHistory = [...state.dailyHistory.slice(-29), {date:today,pct}]; }
    save();
  }
  setInterval(recordDailyHistory, 30000);
  recordDailyHistory();

  // ── MAIN RENDER ───────────────────────────────────────────
  let appRoot = null;
  let sidebar = null;
  let mainContent = null;

  const NAV = [
    { id:"dashboard", icon:ICONS.dashboard, label:"Dashboard",  accent:ACCENT  },
    { id:"goals",     icon:ICONS.goals,     label:"Goals",      accent:ACCENT  },
    { id:"finance",   icon:ICONS.finance,   label:"Finance",    accent:GOLD    },
    { id:"ai",        icon:ICONS.ai,        label:"APEX AI",    accent:ACCENT  },
    { id:"productivity",icon:ICONS.brain,   label:"Workspace",  accent:ACCENT  },
    { id:"code",      icon:ICONS.code,      label:"Code Editor",accent:PURPLE  },
  ];

  function buildSidebar() {
    const c = computed();
    sidebar = div({ width:"220px", background:CARD, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", position:"fixed", top:"0", left:"0", height:"100vh", zIndex:"10", flexShrink:"0" });

    // logo
    const logo = div({ padding:"20px 16px 16px", borderBottom:`1px solid ${BORDER}` });
    const logoInner = div({ display:"flex", alignItems:"center", gap:"10px" });
    const logoIcon  = div({ width:"36px", height:"36px", borderRadius:"10px", background:`linear-gradient(135deg,${ACCENT},#00A878)`, display:"flex", alignItems:"center", justifyContent:"center" });
    logoIcon.appendChild(svgIcon(ICONS.bolt, 18, BG));
    logoInner.appendChild(logoIcon);
    const logoText = div({});
    logoText.appendChild(div({ fontFamily:"'Space Mono',monospace", fontWeight:"700", fontSize:"15px", color:ACCENT }, { text:"APEX" }));
    logoText.appendChild(div({ fontSize:"10px", color:MUTED }, { text:"R10M in 2 Years" }));
    logoInner.appendChild(logoText);
    logo.appendChild(logoInner);
    sidebar.appendChild(logo);

    // nav
    const nav = div({ padding:"12px 10px", flex:"1" });
    NAV.forEach(item => {
      const b = btn({ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", border:"none", background: state.activeTab===item.id ? `${item.accent}18` : "transparent", color: state.activeTab===item.id ? item.accent : MUTED, fontSize:"13px", fontWeight: state.activeTab===item.id ? "700" : "400", marginBottom:"2px", transition:"all 0.15s", textAlign:"left" });
      b.appendChild(svgIcon(item.icon, 16, state.activeTab===item.id ? item.accent : MUTED));
      b.appendChild(span({},{text:item.label}));
      if (item.id==="code" && state.codeHistory.length>0) {
        const badge = span({ marginLeft:"auto", fontSize:"9px", background:`${PURPLE}30`, color:PURPLE, padding:"1px 6px", borderRadius:"10px" }, { text:`v${state.codeHistory.length+1}` });
        b.appendChild(badge);
      }
      applyHover(b, {background:`${item.accent}10`}, {background: state.activeTab===item.id ? `${item.accent}18` : "transparent"});
      b.addEventListener("click", ()=>{ state.activeTab=item.id; renderApp(); });
      nav.appendChild(b);
    });
    sidebar.appendChild(nav);

    // mission progress
    const foot = div({ padding:"12px 14px", borderTop:`1px solid ${BORDER}` });
    foot.appendChild(div({ fontSize:"10px", color:MUTED, marginBottom:"6px", fontFamily:"'Space Mono',monospace" }, { text:"MISSION PROGRESS" }));
    const bar  = div({ background:`${ACCENT}15`, borderRadius:"6px", height:"5px", marginBottom:"5px" });
    const fill = div({ background:`linear-gradient(90deg,${ACCENT},#00D9A6)`, height:"100%", borderRadius:"6px", width:`${c.progress*100}%`, transition:"width 0.8s" });
    bar.appendChild(fill); foot.appendChild(bar);
    const barLabels = div({ display:"flex", justifyContent:"space-between", fontSize:"10px" });
    barLabels.appendChild(span({ color:ACCENT, fontFamily:"'Space Mono',monospace" }, { text:`R${(c.totalRev/1000).toFixed(0)}K` }));
    barLabels.appendChild(span({ color:MUTED }, { text:"R10M" }));
    foot.appendChild(barLabels);
    foot.appendChild(div({ fontSize:"10px", color:MUTED, marginTop:"4px" }, { text:`${c.daysLeft} days left` }));
    sidebar.appendChild(foot);
    return sidebar;
  }

  function renderApp() {
    if (!appRoot) return;
    appRoot.innerHTML = "";

    const layout = div({ display:"flex", minHeight:"100vh" });
    layout.appendChild(buildSidebar());

    mainContent = div({ flex:"1", overflowY:"auto", padding:"28px 32px", marginLeft:"220px" });

    let content;
    if      (state.activeTab==="dashboard")    content = renderDashboard();
    else if (state.activeTab==="goals")        content = renderGoals();
    else if (state.activeTab==="finance")      content = renderFinance();
    else if (state.activeTab==="ai")           content = renderAI();
    else if (state.activeTab==="productivity") content = renderWorkspace();
    else if (state.activeTab==="code")         content = renderCode();
    else content = renderDashboard();

    mainContent.appendChild(content);
    layout.appendChild(mainContent);
    appRoot.appendChild(layout);
  }

  // ── BOOTSTRAP ─────────────────────────────────────────────
  function init() {
    document.title = "APEX — R10M Dashboard";
    document.documentElement.style.cssText = `height:100%;background:${BG};`;
    document.body.style.cssText = `height:100%;margin:0;background:${BG};`;
    injectGlobalStyles();
    appRoot = div({ width:"100%", minHeight:"100vh" });
    document.body.appendChild(appRoot);
    renderApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
