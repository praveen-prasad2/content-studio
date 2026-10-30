"use client";
import "./robot-studio.css";
import { useId, useState, type CSSProperties } from "react";
import { AudioLines, ArrowUpRight, Pause, Play, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { WorkerMenu } from "./WorkerMenu";
import { StudioRoom, areaPosition } from "./StudioRoom";

const specialties: Record<string, string[]> = {
 research: ["Trend Scout", "Competitor Watch", "Transcript Reader"], strategy: ["Idea Planner", "Hook Builder", "Content Architect"],
 copywriting: ["Script Writer", "Caption Writer", "Voice Editor"], editing: ["Clip Cutter", "Caption Studio", "Sound Designer"],
 publishing: ["Scheduler", "Channel Manager", "Launch Monitor"], analysing: ["View Tracker", "Engagement", "Growth Analyst"],
};
function RobotDesk({ label, variant }: { label: string; variant: number }) {
 const id = useId().replace(/:/g, "");
 return <div className="robot-pod" style={{ "--robot-delay": `${variant * -0.7}s` } as CSSProperties}>
  <div className="robot-monitor"><span>{label}</span><div className="monitor-content"><i /><div><b /><b /><b /><b /></div></div></div>
  <svg viewBox="0 0 170 190" className="robot-model" aria-hidden="true">
   <defs><linearGradient id={`${id}-body`} x2="1" y2="1"><stop stopColor="#b494ff" /><stop offset=".45" stopColor="#7653ef" /><stop offset="1" stopColor="#392385" /></linearGradient><linearGradient id={`${id}-head`} x2=".8" y2="1"><stop stopColor="#fff" /><stop offset=".5" stopColor="#d3cbe7" /><stop offset="1" stopColor="#6e6688" /></linearGradient><linearGradient id={`${id}-desk`} x2="1" y2="1"><stop stopColor="#5b427f" /><stop offset="1" stopColor="#241638" /></linearGradient></defs>
   <ellipse cx="87" cy="167" rx="55" ry="14" fill="#07030e" opacity=".5" />
   <g className="robot-body"><path d="M76 109v23m25-23v23" stroke="#746197" strokeWidth="11" strokeLinecap="round" /><rect x="65" y="77" width="48" height="44" rx="15" fill={`url(#${id}-body)`} /><path className="robot-arms" d="M63 86Q48 94 55 112M114 86q15 8 8 26" fill="none" stroke="#ad98df" strokeWidth="10" strokeLinecap="round" /><circle cx="89" cy="97" r="6" className="robot-light" />
    <g className="robot-head"><path d="M89 38V25" stroke="#bba0df" strokeWidth="3" /><circle cx="89" cy="23" r="5" className="robot-light" /><rect x="56" y="39" width="66" height="42" rx="20" fill={`url(#${id}-head)`} /><rect x="63" y="46" width="52" height="27" rx="13" fill="#10121f" /><g className="robot-eyes"><ellipse cx="78" cy="59" rx="5" ry="6" className="robot-light" /><ellipse cx="100" cy="59" rx="5" ry="6" className="robot-light" /></g><path d="M54 53v12m70-12v12" stroke="#8876ae" strokeWidth="5" strokeLinecap="round" /></g>
   </g>
   <path d="M22 127v27l66 28v-29M147 129v28l-59 25v-29" fill="#221532" stroke="#493361" strokeWidth="2" /><path d="M20 126l59-23 70 25-61 27Z" fill={`url(#${id}-desk)`} stroke="#8f69bb" strokeWidth="1.5" /><path d="M59 124l25-9 29 10-25 10Z" fill="#171023" stroke="#8e6bab" /><path d="M67 124l20-6m-13 10 20-7m-12 10 20-7" stroke="#a481cb" strokeWidth="1.5" /><path d="M28 134v27m111-24v27" stroke="#57406e" strokeWidth="4" />
  </svg>
 </div>;
}
export function StudioBoard() {
 const workers = useWorkspaceStore((s) => s.workers);
 const reels = useWorkspaceStore((s) => s.reels);
 const simulation = useWorkspaceStore((s) => s.simulation.enabled);
 const { togglePause, openReel, openWorkerEditor, setAddWorkerOpen } = useWorkspaceStore.getState();
 const [motionEnabled, setMotionEnabled] = useState(true);
 return <div className="studio-board" data-animated={motionEnabled && simulation}>
  <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-muted"><span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-violet-200">{simulation ? "STUDIO SIMULATION · LIVE" : "STUDIO SIMULATION · OFF"}</span><span>{workers.filter((w) => w.status === "working").length} workers active</span><button onClick={() => setMotionEnabled(!motionEnabled)} aria-pressed={motionEnabled} className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 hover:bg-white/10"><AudioLines size={13} />Motion {motionEnabled ? "on" : "off"}</button></div>
  <StudioRoom areas={workers}><div className="room-team-areas">
   {workers.map((worker, index) => {
    const assigned = reels.filter((r) => r.workerId === worker.id);
    const labels = specialties[worker.role] ?? ["Task Planner", "Creative Worker", "Quality Check"];
    return <section key={worker.id} className="robot-station" data-working={worker.status === "working"} style={{ "--station-color": worker.accentColor, left: areaPosition(index).x, top: areaPosition(index).y } as CSSProperties} aria-label={`${worker.title} station, ${worker.name}, ${worker.status}`}>
     <div className="room-zone-outline" aria-hidden="true" /><header className="robot-stage-label"><span>{String(index + 1).padStart(2, "0")}</span><h2>{worker.title}</h2><WorkerMenu worker={worker} index={index} total={workers.length} /></header>
     <div className="robot-reel-wall">{assigned.slice(0, 4).map((reel) => <button key={reel.id} onClick={() => openReel(reel.id)} className="robot-reel" aria-label={`Open reel ${reel.number}: ${reel.title}`}><ReelThumb src={reel.thumbnail} seed={reel.id} rate={0} /><span><Play size={10} fill="currentColor" />{reel.title}</span></button>)}{!assigned.length && <div className="robot-empty-wall">Ready for the next idea<span>Assign a reel from the task queue</span></div>}</div>
     <div className="robot-team-platform"><div className="robot-platform-floor" aria-hidden="true" /><div className="robot-agent-status"><span className="robot-light-dot" /><button onClick={() => openWorkerEditor(worker.id)}>{worker.name} <span>· {worker.status}</span></button><span className="ml-auto tabular-nums">{Math.round(worker.progress)}%</span><button className="robot-pause" onClick={() => togglePause(worker.id)} aria-label={`${worker.status === "paused" ? "Resume" : "Pause"} ${worker.name}`}>{worker.status === "paused" ? <Play size={12} /> : <Pause size={12} />}</button></div><div className="robot-pods" aria-hidden="true">{labels.map((label, i) => <RobotDesk key={label} label={label} variant={i} />)}</div><div className="robot-stage-progress" role="progressbar" aria-label={`${worker.name} progress`} aria-valuenow={Math.round(worker.progress)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${worker.progress}%` }} /></div></div>
     <button className="robot-task-link" onClick={() => worker.currentReelId ? openReel(worker.currentReelId) : openWorkerEditor(worker.id)}><span>{worker.currentTask || "Configure worker"}</span><ArrowUpRight size={13} /></button>
    </section>;
   })}
  </div></StudioRoom><button onClick={() => setAddWorkerOpen(true)} className="robot-add"><Plus size={16} />Add a creative station</button>
 </div>;
}

