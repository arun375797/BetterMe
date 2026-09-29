import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCareToday, getHealthProfile, updateCareToday } from "../api.js";

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function HealthTodayPage() {
  const day = todayKey();
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getHealthProfile(), getCareToday(day)])
      .then(([care, today]) => { setProfile(care); setLogs(today.logs || []); })
      .catch((err) => setError(err.message));
  }, [day]);

  const tasks = useMemo(() => [
    { id: "glucose-am", title: "Record a glucose check", detail: profile?.glucoseTargets ? `Care-plan targets: before food ${profile.glucoseTargets.beforeMin}–${profile.glucoseTargets.beforeMax}; after food ${profile.glucoseTargets.afterMin}–${profile.glucoseTargets.afterMax} mg/dL.` : "Use the timing and target from your care plan.", path: "/health/sugar", icon: "🩸" },
    ...(profile?.medications?.length ? [{ id: "medicines", title: "Take prescribed medicines", detail: profile.medications.map((item) => `${item.name}${item.timing ? ` · ${item.timing}` : ""}`).join("; "), path: "/health/care-plan", icon: "💊" }] : []),
    { id: "meals", title: "Log meals accurately", detail: "Eaten, skipped, and not logged remain separate.", path: "/health/food", icon: "🥗" },
    { id: "movement", title: "Record appropriate movement", detail: profile?.exerciseLimits || "Follow the exercise limits agreed with your clinician.", path: "/health/exercise", icon: "🏸" },
    { id: "glucose-pm", title: "Record another glucose check if planned", detail: "Mark whether it was before or after food so the correct care-plan target is used.", path: "/health/sugar", icon: "🩸" },
    { id: "sleep", title: "Prepare for and record sleep", detail: "Keep sleep timing and quality in the same history.", path: "/health/sleep", icon: "🌙" },
  ], [profile]);
  const doneMap = Object.fromEntries(logs.map((item) => [item.taskId, item.done]));
  const doneCount = tasks.filter((task) => doneMap[task.id]).length;

  async function toggle(taskId) {
    const next = !doneMap[taskId];
    setLogs((current) => [...current.filter((item) => item.taskId !== taskId), { taskId, done: next, day }]);
    try { await updateCareToday(taskId, { day, done: next }); } catch (err) { setError(err.message); }
  }

  return <div className="page-pad">
    <p className="text-[12px] tracking-[0.18em] text-coral uppercase">My Health · Today</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold sm:text-3xl">Today’s care checklist</h1><p className="mt-2 max-w-2xl text-sm text-muted">A short guide from your care plan. Checking an item records completion; the linked tracker stores the health detail.</p></div><span className="rounded-full bg-teal/10 px-3 py-1.5 text-sm font-medium text-teal ring-1 ring-teal/25">{doneCount} / {tasks.length} complete</span></div>
    {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}
    <div className="mt-7 max-w-3xl space-y-3">{tasks.map((task) => <div key={task.id} className={`flex items-start gap-3 rounded-2xl border p-4 ${doneMap[task.id] ? "border-teal/25 bg-teal/[0.06]" : "border-line bg-raised/80"}`}><button type="button" onClick={() => toggle(task.id)} aria-label={doneMap[task.id] ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${doneMap[task.id] ? "border-teal bg-teal/20 text-teal" : "border-line"}`}>{doneMap[task.id] ? "✓" : ""}</button><span className="text-xl" aria-hidden="true">{task.icon}</span><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${doneMap[task.id] ? "text-muted line-through" : "text-ink"}`}>{task.title}</p><p className="mt-1 text-xs leading-5 text-muted">{task.detail}</p></div><Link to={task.path} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-cyan hover:bg-cyan/10">Open</Link></div>)}</div>
    <div className="mt-7 max-w-3xl rounded-2xl border border-gold/25 bg-gold/8 p-4 text-sm leading-6 text-muted"><span className="font-semibold text-gold">If something feels wrong:</span> follow the instructions saved in <Link to="/health/care-plan" className="text-ink underline">My care plan</Link>, and contact your care team or emergency services as instructed.{profile?.lowGlucoseInstructions ? <span className="mt-2 block"><span className="font-medium text-ink">Low-glucose plan:</span> {profile.lowGlucoseInstructions}</span> : null}{profile?.sickDayInstructions ? <span className="mt-2 block"><span className="font-medium text-ink">Sick-day plan:</span> {profile.sickDayInstructions}</span> : null}</div>
  </div>;
}
