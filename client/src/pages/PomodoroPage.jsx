import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePomodoro } from "../context/PomodoroContext.jsx";
import { clock, dayKey, duration, summarize } from "../lib/pomodoro.js";

const panel = "rounded-2xl border border-line bg-surface p-5 sm:p-6";
const button = "rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-40";
const primary = "rounded-xl bg-teal px-6 py-3 text-sm font-semibold text-surface hover:opacity-90";
const input = "mt-2 w-full rounded-xl border border-line bg-page px-3 py-2.5 text-ink";

function Settings({ settings, setSettings }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(settings); }, [settings.focus, settings.break, settings.goal]);
  return <form className={panel} onSubmit={event => { event.preventDefault(); setSettings(draft); setSaved(true); }}>
    <h2 className="text-lg font-semibold">Your rhythm</h2>
    <p className="mt-1 text-sm text-muted">Changes apply to the next session.</p>
    <div className="mt-5 grid grid-cols-3 gap-3">
      {[["focus", "Focus (min)"], ["break", "Break (min)"], ["goal", "Daily goal"]].map(([key, label]) => <label key={key} className="text-xs text-muted">
        {label}<input required type="number" min="1" max={key === "goal" ? 30 : 180} step="1" value={draft[key]} className={input}
          onChange={event => { setDraft({ ...draft, [key]: event.target.value === "" ? "" : Number(event.target.value) }); setSaved(false); }} />
      </label>)}
    </div>
    <button className={`${button} mt-4`} type="submit">Save settings</button>
    {saved && <span className="ml-3 text-xs text-teal" role="status">Saved on this browser</span>}
  </form>;
}

function Review({ active, finish }) {
  const [lost, setLost] = useState("0");
  const [note, setNote] = useState("");
  const lostMs = Math.round(Number(lost) * 60000);
  const valid = lost !== "" && Number.isFinite(lostMs) && lostMs >= 0 && lostMs <= active.elapsedMs;
  return <form className="mt-6 rounded-xl border border-teal/30 bg-teal/5 p-4 text-left" onSubmit={event => { event.preventDefault(); if (active.kind === "break" || valid) finish(lostMs, note); }}>
    <h3 className="font-semibold">{active.elapsedMs === active.plannedMs ? "Session complete" : "Session ended early"}</h3>
    <p className="mt-1 text-sm text-muted">{duration(active.elapsedMs)} timed · {duration(active.pausedMs)} paused</p>
    {active.kind === "focus" && <label className="mt-4 block text-sm">How many timed minutes were distracted?
      <input type="number" min="0" max={active.elapsedMs / 60000} step="any" required className={input} value={lost} onChange={event => setLost(event.target.value)} />
      <span className="mt-1 block text-xs text-muted">Estimate up to {(active.elapsedMs / 60000).toFixed(2)} minutes. This is subtracted from your focus time.</span>
      {!valid && <span className="text-xs text-coral">Enter a value within this session’s timed duration.</span>}
    </label>}
    <label className="mt-4 block text-sm">{active.kind === "focus" ? "What did you accomplish? What got in the way?" : "Break notes"} <span className="text-muted">(optional)</span>
      <textarea className={input} maxLength={1000} rows={2} value={note} onChange={event => setNote(event.target.value)} />
    </label>
    <button type="submit" disabled={active.kind === "focus" && !valid} className={`${primary} mt-4 disabled:opacity-40`}>Save session</button>
  </form>;
}

export default function PomodoroPage() {
  const pom = usePomodoro();
  const { active, settings, sessions } = pom;
  const [task, setTask] = useState("");
  const [kind, setKind] = useState("focus");
  const [range, setRange] = useState(7);
  const [selectedDay, setSelectedDay] = useState(dayKey());
  const today = dayKey();
  const todayStats = summarize(sessions.filter(row => row.day === today));
  const days = Array.from({ length: range }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (range - index - 1));
    const key = dayKey(date);
    return { key, label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), ...summarize(sessions.filter(row => row.day === key)) };
  });
  const rangeKeys = new Set(days.map(day => day.key));
  const stats = summarize(sessions.filter(row => rangeKeys.has(row.day)));
  const tracked = stats.focus + stats.distracted + stats.paused;
  const rate = tracked ? Math.round(stats.focus / tracked * 100) : null;
  const max = Math.max(60000, ...days.map(day => day.focus + day.distracted + day.paused + day.break));
  const history = sessions.filter(row => row.day === selectedDay).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  const currentKind = active?.kind || kind;
  const remaining = active ? active.plannedMs - active.elapsedMs : settings[kind] * 60000;
  const progress = active ? active.elapsedMs / active.plannedMs * 100 : 0;

  return <div className="page-pad mx-auto max-w-7xl pb-24">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal">Make room for deep work</p><h1 className="text-3xl font-semibold tracking-tight">Pomodoro</h1><p className="mt-2 text-sm text-muted">One clear task. A little focus. A proper break.</p></div>
      <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm"><span className="font-semibold text-teal">{todayStats.completed} / {settings.goal}</span><span className="ml-2 text-muted">today’s focus goal</span></div>
    </div>
    {(pom.error || pom.storageError) && <div role="alert" className="mb-5 rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm">
      <p>{pom.error}</p><p>{pom.storageError}</p><button className={`${button} mt-3`} onClick={pom.sync}>Retry sync</button>
    </div>}
    <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_1fr]">
      <section className={`${panel} text-center`} aria-label="Pomodoro timer">
        <div className="inline-flex gap-1 rounded-full border border-line bg-page p-1">
          {["focus", "break"].map(mode => <button key={mode} disabled={!!active} onClick={() => setKind(mode)} className={`rounded-full px-5 py-2 text-sm capitalize disabled:cursor-default ${currentKind === mode ? "bg-teal/15 text-teal" : "text-muted"}`}>{mode === "focus" ? "Focus" : "Short break"}</button>)}
        </div>
        <div className="relative mx-auto my-7 flex h-56 w-56 flex-col items-center justify-center rounded-full sm:h-64 sm:w-64" style={{ background: `conic-gradient(var(--ui-teal) ${progress}%, var(--ui-line) ${progress}%)` }}>
          <div className="absolute inset-[3px] rounded-full bg-surface" />
          <span className="relative text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl" role="timer" aria-label={`${currentKind} time remaining`}>{clock(remaining)}</span>
          <span className="relative mt-3 text-xs uppercase tracking-widest text-muted">{active?.status === "review" ? "Ready to review" : active?.status === "paused" ? "Paused" : currentKind === "focus" ? "Stay with your task" : "Breathe. Stretch. Reset."}</span>
        </div>
        {!active ? <form onSubmit={event => { event.preventDefault(); pom.start(kind, task); }}>
          {kind === "focus" && <label className="mx-auto mb-5 block max-w-md text-left text-sm text-muted">What are you focusing on?
            <input className={input} maxLength={200} placeholder="e.g. Finish the JavaScript practice" value={task} onChange={event => setTask(event.target.value)} />
          </label>}
          <button type="submit" className={primary}>Start {kind === "focus" ? "focus" : "break"}</button>
          <p className="mt-4 text-xs text-muted">{kind === "focus" ? "After saving your session, start a break when you’re ready." : "Breaks are tracked separately from work."}</p>
        </form> : <>
          {active.task && <p className="break-words text-sm text-muted">{active.task}</p>}
          {active.status === "review" ? <Review key={active.sessionId} active={active} finish={(lost, note) => { pom.finish(lost, note); setKind(active.kind === "focus" ? "break" : "focus"); }} /> : <div className="mt-5 flex justify-center gap-3">
            <button className={primary} onClick={pom.togglePause}>{active.status === "paused" ? "Resume" : "Pause"}</button>
            <button className={button} onClick={pom.end}>End & review</button>
          </div>}
          <p className="mt-4 text-xs text-muted" role="status">{active.status === "review" ? "Save your review to add this session to your statistics." : "Timer continues across pages and refreshes. Pause when you step away."}</p>
        </>}
        <div className="mt-6 border-t border-line pt-4 text-left">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={pom.keepAwake} onChange={event => pom.setKeepAwake(event.target.checked)} className="h-4 w-4 accent-teal" />
            Keep screen awake while the timer runs
          </label>
          <p className="mt-2 text-xs text-muted" role="status">
            {pom.wakeLock.status === "active" ? "Screen will stay awake. Keep BetterMe open in the foreground." :
              pom.wakeLock.status === "unsupported" ? "Screen wake lock is unavailable here. Use an updated browser over HTTPS." :
              ["blocked", "released"].includes(pom.wakeLock.status) ? "Your device isn’t keeping the screen awake. Check battery saver or try again." :
              pom.wakeLock.status === "requesting" ? "Keeping your screen awake…" :
              pom.keepAwake ? "Prevents automatic screen sleep during focus and breaks. Released when paused or finished." : "Your phone’s normal screen timeout applies."}
          </p>
          {["blocked", "released"].includes(pom.wakeLock.status) && <button type="button" className={`${button} mt-3`} onClick={pom.wakeLock.retry}>Try keeping screen awake</button>}
        </div>
      </section>
      <div className="space-y-5">
        <Settings settings={settings} setSettings={pom.setSettings} />
        <section className={panel}>
          <h2 className="text-lg font-semibold">Today’s time</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[["Focused", todayStats.focus, "text-teal"], ["Distracted", todayStats.distracted, "text-coral"], ["Paused", todayStats.paused, "text-gold"], ["Breaks", todayStats.break, "text-cyan"]].map(([label, value, color]) => <div key={label}><p className={`text-2xl font-semibold ${color}`}>{duration(value)}</p><p className="mt-1 text-xs text-muted">{label}</p></div>)}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted">Focus = timed work minus distractions you report. Pauses and breaks are separate. Untracked hours aren’t labelled as wasted. Totals include saved sessions.</p>
          <Link to="/sit25" className="mt-4 inline-block text-sm text-teal">Need a movement break? →</Link>
        </section>
      </div>
    </div>
    <section className={`${panel} mt-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Your focus over time</h2><p className="mt-1 text-xs text-muted">Select a day to see its sessions below.</p></div><select aria-label="Statistics period" className="rounded-xl border border-line bg-page px-3 py-2 text-sm" value={range} onChange={event => setRange(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></div>
      <div className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[["Focused", duration(stats.focus)], ["Completed / started", `${stats.completed} / ${stats.attempts}`], ["Focus share", rate === null ? "—" : `${rate}%`], ["Break time", duration(stats.break)]].map(([label, value]) => <div key={label} className="rounded-xl bg-page p-3"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted">{label}</p></div>)}
      </div>
      {pom.loading && <p className="mb-3 text-sm text-muted" role="status">Loading saved sessions…</p>}
      <div className="overflow-x-auto pb-2"><div className="flex h-44 items-end gap-2" style={{ minWidth: range === 30 ? 760 : 280 }}>
        {days.map(day => <button key={day.key} title={`${day.label}: ${duration(day.focus)} focused, ${duration(day.distracted)} distracted, ${duration(day.paused)} paused, ${duration(day.break)} break`} aria-label={`${day.label}: ${duration(day.focus)} focused. View sessions.`} aria-pressed={selectedDay === day.key} onClick={() => setSelectedDay(day.key)} className={`flex h-full min-w-0 flex-1 flex-col justify-end rounded-lg px-1 pt-2 ${selectedDay === day.key ? "bg-teal/10 ring-1 ring-teal/40" : "hover:bg-white/5"}`}>
          <div className="flex h-32 w-full flex-col justify-end overflow-hidden rounded-t-md bg-page">
            {[["break", "bg-cyan"], ["paused", "bg-gold"], ["distracted", "bg-coral"], ["focus", "bg-teal"]].map(([key, color]) => <div key={key} className={`w-full shrink-0 ${color}`} style={{ height: `${day[key] / max * 100}%` }} />)}
          </div><span className="mt-2 pb-1 text-[10px] text-muted">{day.label}</span>
        </button>)}
      </div></div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">{[["Focus", "bg-teal"], ["Distracted", "bg-coral"], ["Paused", "bg-gold"], ["Break", "bg-cyan"]].map(([label, color]) => <span key={label} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>)}</div>
      <p className="mt-4 text-xs text-muted">Focus share includes timed work and pauses, excluding breaks. Sessions are grouped by their local start date.</p>
      {!stats.attempts && !stats.break && <p className="mt-4 text-sm text-muted">Your first saved session will appear here. Build a little consistency each day.</p>}
    </section>
    <section className={`${panel} mt-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Session history</h2><label className="text-sm text-muted">Day <input aria-label="History date" type="date" value={selectedDay} max={today} onChange={event => setSelectedDay(event.target.value)} className="ml-2 rounded-xl border border-line bg-page px-3 py-2 text-ink" /></label></div>
      {history.length ? <ul className="mt-5 divide-y divide-line">{history.map(row => <li key={row.sessionId} className="py-4 first:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-medium">{row.kind === "break" ? "Short break" : row.task || "Focus session"}</h3><span className={`rounded-full px-3 py-1 text-xs ${row.completed ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold"}`}>{row.completed ? "Completed" : "Ended early"}{pom.pending.includes(row.sessionId) ? " · Pending sync" : ""}</span></div>
        <p className="mt-2 text-xs text-muted">{new Date(row.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Planned {duration(row.plannedMs)} · {row.kind === "focus" ? `${duration(row.elapsedMs - row.distractedMs)} focused · ${duration(row.distractedMs)} distracted` : `${duration(row.elapsedMs)} break`} · {duration(row.pausedMs)} paused</p>
        {row.note && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">{row.note}</p>}
      </li>)}</ul> : <p className="mt-5 text-sm text-muted">No saved sessions for this day.</p>}
    </section>
  </div>;
}
