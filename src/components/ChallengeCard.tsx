import { Compass, Flag, MoveUpRight } from "lucide-react";
import { demoVisuals } from "@/data/tasks";
import type { STEMTask } from "@/types";
export function ChallengeCard({task}:{task:STEMTask}) {
 return <section className="challenge-card"><div className="challenge-copy"><h1>{task.title}</h1><p>{task.description}</p><div className="challenge-goal"><Flag size={15}/><span>Your goal: <strong>{task.successCriteria?.[0]??task.objectives?.[0]??'Define what success means for this challenge'}</strong></span></div></div><div className="challenge-image" role="img" aria-label={`${task.title} challenge illustration`}>{demoVisuals[task.id]?<div className="demo-illustration"><span className="demo-panel"/><span className="demo-base"/><span className="wheel wheel-one"/><span className="wheel wheel-two"/></div>:<Compass size={70} strokeWidth={1.2}/>}<span className="image-caption">A question. Your discoveries. <MoveUpRight size={13}/></span></div></section>;
}
