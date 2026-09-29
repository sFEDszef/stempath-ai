"use client";
import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  ChevronRight,
  X,
  ArrowRight,
  BookOpen,
  Compass,
  FlaskConical,
  Save,
} from "lucide-react";
import { Header } from "./Header";
import { ProgressSidebar } from "./ProgressSidebar";
import { ChallengeCard } from "./ChallengeCard";
import { AIChat } from "./AIChat";
import { STEMJourney } from "./STEMJourney";
import { ArtifactUploader } from "./ArtifactUploader";
import { HelpMeter } from "./HelpMeter";
import { taskStorageKey } from "@/lib/stem/tasks";
import { demoTasks } from "@/data/tasks";
import { getStages, keyQuestions, pedagogy } from "@/lib/stem/stages";
import { parseArtifacts } from "@/lib/stem/validation";
import { useAdaptive } from "@/lib/pedagogy/useAdaptive";
import { ResearchPanel } from "./ResearchPanel";
import type { ResearchController } from "@/lib/research/useResearchSession";
import { conditionConfig, initialLevel, aiEnabled, type ResearchConfig } from "@/lib/research/config";
import { sessionSummary, type Choice } from "@/lib/research/session";
import { decidePedagogicalAction } from "@/lib/pedagogy/decisionEngine";
import { readiness } from "@/lib/pedagogy/decisionEngine";
import { suggestedReplies } from "@/lib/pedagogy/responses";
import { SupportRecommendation } from "./SupportRecommendation";
import { LearningArtifacts } from "./LearningArtifacts";
import { AIChallenge } from "./AIChallenge";
import { apiCoach, CoachError } from "@/lib/coach";
import type { Artifact, Message, StageId, SupportLevel, ChatRequest, STEMTask, LearningArtifacts as Thinking } from "@/types";
export default function Workspace({task,onLoadTask,research,researchVisible,onResearchReset,onResearchClear,onAssignTask,onHideResearch}:{task:STEMTask;onLoadTask:()=>void;research:ResearchController;researchVisible:boolean;onResearchReset:(config:ResearchConfig,task?:STEMTask)=>void;onResearchClear:(all:boolean)=>void;onAssignTask:(task:STEMTask)=>void;onHideResearch:()=>void}) {
  const config=research.session?.config??conditionConfig();
  const coachEnabled=aiEnabled(config),finished=!!research.session?.completedAt;
  const manualSupport=config.allowManualSupportChange&&coachEnabled&&!finished;
  const lastArtifacts=useRef<Record<string,string>>({});
  const challengeRef=useRef<{id:string;stage:StageId}|null>(null);
  const suggestionRef=useRef('');
  const {event:researchEvent,language:researchLanguage}=research;
  const stages=getStages(task);
  const [records,setRecords]=useState<Thinking>({});
  const [restored,setRestored]=useState(false);
  const [mode,setMode]=useState<'auto'|'deepseek'|'demo'>('auto');
  const [responseMode,setResponseMode]=useState<'ai'|'demo'|undefined>();
  const [completionWarning,setCompletionWarning]=useState<string[]>([]);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);

  const [active, setActive] = useState<StageId>("understand");
  const [completed, setCompleted] = useState<StageId[]>([]);
  const [level, setLevel] = useState<SupportLevel>(initialLevel(config.condition));
  const [conversations, setConversations] = useState<
    Partial<Record<StageId, Message[]>>
  >({ understand: [{id:'welcome',role:'assistant',text:`Let’s explore “${task.title}”. ${pedagogy.understand.questions[0]}

You can use English or Chinese.`,suggestions:suggestedReplies('en')}] });
  const [pending, setPending] = useState<StageId[]>([]);
  const pendingRef = useRef(new Set<StageId>());
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const artifactRef = useRef<Artifact[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [chatErrors, setChatErrors] = useState<Partial<Record<StageId, {message:string; retryable:boolean; request:ChatRequest}>>>({});
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = stages.find((s) => s.id === active)!;
  const messages:Message[] = conversations[active] ?? [{id:`welcome-${active}`,role:'assistant',text:`For “${task.title}”, let’s explore ${stage.title}. ${stage.prompts[level-1]}`,suggestions:pedagogy[active].replies}];
  const adaptiveRequest:ChatRequest={task,stage:active,level,message:'',history:messages.slice(-12).map(({role,text})=>({role,text})),artifacts:records,completed,mode,research:config};
  const adaptive=useAdaptive(adaptiveRequest);
  const lang=adaptive.decision.state.language;
  useEffect(()=>{researchLanguage(lang);},[lang,researchLanguage]);
  const recommendationKey=adaptive.showRecommendation?`${active}:${adaptive.decision.reason}:${adaptive.decision.recommendation}`:'';
  useEffect(()=>{
    if(recommendationKey&&suggestionRef.current!==recommendationKey){const fade=adaptive.decision.reason==='fade';researchEvent(fade?'FADING_SUGGESTED':'ESCALATION_SUGGESTED',{supportRecommendation:adaptive.decision.recommendation,fadingSuggested:fade,escalationSuggested:!fade});}
    suggestionRef.current=recommendationKey;
  },[recommendationKey,adaptive.decision.reason,adaptive.decision.recommendation,researchEvent]);
  function changeLevel(next:SupportLevel){if(!manualSupport||next===level||pendingRef.current.has(active))return;research.support(next,'STUDENT');setLevel(next);void deliver({...adaptiveRequest,level:next,previousLevel:level,intent:'support-change',message:lang==='zh'?'请调整帮助。':'Please adjust the guidance.'});}
  function recordArtifact(field:string,value:string){const key=`${active}:${field}`;if(lastArtifacts.current[key]===value||(!value&&!lastArtifacts.current[key]))return;lastArtifacts.current[key]=value;research.artifact(active,field,value);}

  function completeStage(force=false){
    if(finished)return;
    if(completed.includes(active)){setCompleted(prev=>prev.filter(id=>id!==active));research.complete(active,false);return;}
    const missing=readiness(task,active,records).filter(field=>coachEnabled||!field.includes('AI'));
    if(!force&&missing.length){setCompletionWarning(missing);return;}
    setCompleted(prev=>[...prev,active]);setCompletionWarning([]);research.complete(active,true);
  }
  function chooseSupport(accept:boolean){
    if(!adaptive.showRecommendation||pendingRef.current.has(active)||finished)return;
    const fade=adaptive.decision.reason==='fade';
    research.event(fade?(accept?'FADING_ACCEPTED':'FADING_REJECTED'):(accept?'ESCALATION_ACCEPTED':'ESCALATION_REJECTED'),{supportRecommendation:adaptive.decision.recommendation,fadingAccepted:fade?accept:undefined,escalationAccepted:!fade?accept:undefined});
    const next=adaptive.resolveRecommendation(accept);
    if(accept&&next){research.support(next,'SYSTEM_RECOMMENDATION');setLevel(next);
      const history=messages.slice(-12).map(({role,text})=>({role,text}));
      void deliver({...adaptiveRequest,level:next,previousLevel:level,history,intent:'support-change',message:lang==='zh'?'请按我选择的支持等级继续引导。':'Please continue at my chosen support level.'});
    }
  }
  useEffect(() => {
    try {
      const raw=sessionStorage.getItem('stempath-progress-v3');
      if(raw){const data=JSON.parse(raw);if(data.task===JSON.stringify(task)){
        setRecords(parseArtifacts(data.records));
        if(Array.isArray(data.completed)&&data.completed.every((id:unknown)=>stages.some(s=>s.id===id)))setCompleted([...new Set<StageId>(data.completed)]);
        if(stages.some(s=>s.id===data.active))setActive(data.active);
        if([1,2,3].includes(data.level)&&config.condition==='ADAPTIVE_SUPPORT'){setLevel(data.level);research.support(data.level,'STUDENT');}
        research.event('WORKSPACE_RESTORED',{systemAction:'SAVED_LEARNING_DRAFT'});
        if(stages.some(s=>s.id===data.active))research.stage(data.active);
        for(const id of data.completed??[])if(stages.some(s=>s.id===id))research.complete(id,true);
        for(const [stageId,fields] of Object.entries(parseArtifacts(data.records)))for(const [field,value] of Object.entries(fields)){lastArtifacts.current[`${stageId}:${field}`]=value;}
      }}
      setNote(localStorage.getItem(`stempath-notebook-v3-${taskStorageKey(task)}`) ?? (task.id===demoTasks[0].id?localStorage.getItem("stempath-notebook-v1"):null) ?? "");
    } catch {
      // Storage may be unavailable; the notebook remains usable in memory.
    }
    setRestored(true);
    return () => artifactRef.current.forEach((a) => URL.revokeObjectURL(a.url));
  // TaskWorkspace remounts this workspace for every loaded task.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{if(!restored)return;try{sessionStorage.setItem('stempath-progress-v3',JSON.stringify({task:JSON.stringify(task),records,completed,active,level}));}catch{setError('Progress could not be saved. Keep this tab open or copy your notes.')}},[task,records,completed,active,level,restored]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  function selectStage(id: StageId) {
    research.stage(id);
    setActive(id);
    setCompletionWarning([]);
    setConversations((prev) =>
      prev[id]
        ? prev
        : {
            ...prev,
            [id]: [
              {
                id: crypto.randomUUID(),
                role: "assistant",
                text: lang==='zh'?`接下来探索“${task.title}”的 ${stages.find(s=>s.id===id)!.title} 阶段。你准备先思考什么？`:`For “${task.title}”, let’s explore ${stages.find((s) => s.id === id)!.title}.\n\n${stages.find((s) => s.id === id)!.prompts[level - 1]}`,
                suggestions: suggestedReplies(lang),
              },
            ],
          },
    );
  }
  async function deliver(request: ChatRequest) {
    if(!coachEnabled||finished)return;
    const requestStage = request.stage;
    if (pendingRef.current.has(requestStage)) return;
    pendingRef.current.add(requestStage);
    setPending(prev => [...prev, requestStage]);
    setChatErrors(prev => ({...prev, [requestStage]:undefined}));
    try {
      const response = await apiCoach.respond(request);
      if(!alive.current)return;
      research.event('AI_RESPONSE',{messageText:response.text,systemAction:response.mode.toUpperCase(),coach:response.metadata},requestStage,request.level);
      setResponseMode(response.mode);
      setConversations(prev => ({...prev,[requestStage]:[...(prev[requestStage]??[]),{id:crypto.randomUUID(),role:"assistant",...response}]}));
    } catch (error) {
      if(!alive.current)return;
      research.event('AI_ERROR',{systemAction:'GENERATION_FAILED'},requestStage);
      setChatErrors(prev => ({...prev,[requestStage]:{message:error instanceof Error?error.message:'The coach could not respond.',retryable:!(error instanceof CoachError)||error.retryable,request}}));
    } finally {
      pendingRef.current.delete(requestStage);
      setPending(prev => prev.filter(s => s !== requestStage));
    }
  }
  async function send(text: string, claim?:string) {
    if (!text.trim() || pendingRef.current.has(active)||!coachEnabled||finished) return;
    const studentText=claim?`Regarding this unverified claim: “${claim}”\n\n${text.trim()}`:text.trim();
    const request:ChatRequest = {stage:active,level,message:studentText,history:messages.slice(-12).map(({role,text})=>({role,text})),task,artifacts:records,completed,mode,research:config,intent:claim?"evaluate-claim":"chat",claim};
    adaptive.onStudentTurn();
    const decision=decidePedagogicalAction({...request,message:text.trim()});
    research.event('MESSAGE_SENT',{messageText:text.trim(),learnerSignal:Object.entries(decision.state.signals).filter(([,v])=>v).map(([key])=>key),pedagogicalDecision:decision.action,supportRecommendation:decision.recommendation});
    if(!claim&&challengeRef.current?.stage===active){const signals=decision.state.signals;const action=/test|trial|measure|测试|检验|测量/i.test(text)?'TEST':signals.reasoning?'REASON':signals.uncertain?'REQUEST_HELP':undefined;
      if(action)research.event('AI_CHALLENGE_FOLLOW_UP',{challengeId:challengeRef.current.id,followUpAction:action});}

    setConversations(prev => ({...prev,[active]:[...(prev[active]??[]),{id:crypto.randomUUID(),role:"student",text:studentText}]}));
    await deliver(request);
  }
  function retry() {
    const failed = chatErrors[active];
    // Reuse the failed turn without adding another student bubble; honour the current meter.
    if (failed?.retryable) void deliver({...failed.request,level,mode,research:config});
  }
  function onUpload() {
    uploadRef.current?.click();
  }
  function removeArtifact(id: string) {
    setArtifacts((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.url);
      const next = prev.filter((a) => a.id !== id);
      artifactRef.current = next;
      return next;
    });
  }
  function navigate(name: string) {
    if(name==="Challenges"){onLoadTask();return;}
    if (name === "AI Coach") {
      document
        .getElementById("ai-coach")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setModal(name);
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to learning workspace
      </a>
      <Header onNavigate={navigate} />
      <div className="workspace-shell">
        <ProgressSidebar
          stages={stages}
          active={active}
          completed={completed}
          onStage={selectStage}
          onTool={navigate}
        />
        <main id="main" className="main-workspace">
          <div className="breadcrumb">
            <button onClick={() => navigate("Challenges")}>Challenges</button>
            <ChevronRight size={13} />
            <span>{task.title}</span><button onClick={onLoadTask}>Load STEM Challenge</button>
          </div>
          <ChallengeCard task={task} />
          {coachEnabled&&<div className="coach-mode"><label>Coach mode <select aria-label="Coach mode" value={mode} onChange={e=>{setMode(e.target.value as 'auto'|'deepseek'|'demo');setResponseMode(undefined)}}><option value="auto">Auto · AI when available</option><option value="deepseek">DeepSeek · real AI only</option><option value="demo">Demo · local practice</option></select></label><span>{responseMode==='demo'?'Demo response · local guidance':responseMode==='ai'?'DeepSeek · real AI response':mode==='deepseek'?'DeepSeek only · errors allow retry.':'Practice with Demo when AI is unavailable.'}</span></div>}
          <AIChat
            recommendation={!finished&&adaptive.showRecommendation?<SupportRecommendation decision={adaptive.decision} onChoice={chooseSupport} disabled={pending.includes(active)}/>:undefined}
            coachDisabled={!coachEnabled||finished}
            supportDisabled={!manualSupport||pending.includes(active)}
            sessionFinished={finished}
            mode={responseMode??(mode==="auto"?undefined:mode)}
            stage={stage}
            level={level}
            messages={messages.map(m=>m.suggestions?{...m,suggestions:suggestedReplies(lang)}:m)}
            busy={pending.includes(active)}
            onSend={text=>void send(text)}
            error={chatErrors[active]}
            onRetry={retry}
            onUpload={onUpload}
            onComplete={()=>completeStage()}
            complete={completed.includes(active)}
            onLevel={changeLevel}
          />
          {completionWarning.length>0&&<section className="rail-section" role="alert"><p>{lang==='zh'?'你可以继续，但以下思考记录还不完整：':'You can continue, but these thinking records are still missing:'} {completionWarning.join(', ')}</p><button onClick={()=>setCompletionWarning([])}>{lang==='zh'?'返回补充':'Go back'}</button><button onClick={()=>completeStage(true)}>{lang==='zh'?'仍然继续':'Continue anyway'}</button></section>}
          {active==='reflect'&&completed.includes('reflect')&&research.session&&<section className="rail-section completion-summary"><h2>Your learning journey</h2><p>Stages completed: {sessionSummary(research.session).stages} · Thinking-record revisions: {sessionSummary(research.session).revisions} · Evidence-related messages: {sessionSummary(research.session).evidence} · AI challenges considered: {sessionSummary(research.session).challenges} · Support changes: {sessionSummary(research.session).supportChanges}</p><p>{finished?'This session is complete. You can review your notes or load a challenge to begin again.':'These describe your activity, not a score.'}</p>{!finished&&<button className="primary-button" disabled={pending.length>0} onClick={research.finish}>Finish learning session</button>}</section>}
          {researchVisible&&<ResearchPanel research={research} task={task} decision={adaptive.decision} onReset={onResearchReset} onClear={onResearchClear} onTask={onAssignTask} onHide={onHideResearch}/>}
          {completed.includes(active)&&stages.findIndex(s=>s.id===active)<6&&<button className="primary-button next-stage" onClick={()=>selectStage(stages[stages.findIndex(s=>s.id===active)+1].id)}>Continue to {stages[stages.findIndex(s=>s.id===active)+1].title}<ArrowRight size={14}/></button>}
          <p className="workspace-footer">
            <span>Every question is a step forward.</span>
            <span>STEMPath AI · Research prototype</span>
          </p>
        </main>
        <aside className="right-sidebar">
          <details className="rail-section questions"><summary>Key Questions</summary>
            <h2>
              <Lightbulb size={18} />
              Key Questions
            </h2>
            {keyQuestions(task,active).map((question, i) => (
              <div className="question" key={question}>
                <span>0{i + 1}</span>
                <p>{question}</p>
              </div>
            ))}
          </details>
          <STEMJourney
            stages={stages}
            active={active}
            completed={completed}
            onStage={selectStage}
          />
          <LearningArtifacts key={active} task={task} stage={active} records={records} onChange={(field,value)=>setRecords(prev=>({...prev,[active]:{...prev[active],[field]:value}}))} onRecord={recordArtifact} disabled={finished} aiAvailable={coachEnabled}/>
          <details className="rail-section"><summary>Your uploaded images</summary><ArtifactUploader
            artifacts={artifacts}
            onUpload={onUpload}
            onRemove={removeArtifact}
          />
          </details>
          {coachEnabled&&<HelpMeter level={level} onChange={changeLevel} disabled={!manualSupport||pending.includes(active)}/>}
          {coachEnabled&&<p className="support-status" aria-live="polite">{lang==='zh'?'AI 支持':'AI support'}: {adaptive.showRecommendation?(adaptive.decision.reason==='stronger'?(lang==='zh'?'可以尝试更具体的提示':'A stronger hint is available'):(lang==='zh'?'可以尝试更独立地思考':'Ready to try more independently')):(lang==='zh'?'按你选择的等级引导':'Guidance at your chosen level')}</p>}
          {!finished&&adaptive.decision.challengeEligible&&<AIChallenge language={lang} onTrigger={(claim)=>{const id=crypto.randomUUID();challengeRef.current={id,stage:active};research.event('AI_CHALLENGE_STARTED',{challengeId:id,aiChallengeTriggered:true,messageText:claim});}} onChoice={(choice:Choice)=>research.event('AI_CHALLENGE_RESPONSE',{challengeId:challengeRef.current?.id,learnerChoice:choice})} onRevision={revision=>research.event('AI_CHALLENGE_FOLLOW_UP',{challengeId:challengeRef.current?.id,laterRevision:revision})} disabled={pending.includes(active)} key={`${active}:${config.enableAIChallenge}`} request={adaptiveRequest} onRespond={(message,claim)=>void send(message,claim)}/>}

        </aside>
      </div>
      <input
        hidden
        type="file"
        ref={uploadRef}
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => {
          setError("");
          const files = Array.from(e.target.files ?? []);
          const valid = files.filter(
            (f) =>
              ["image/png", "image/jpeg", "image/webp"].includes(f.type) &&
              f.size <= 5 * 1024 * 1024,
          );
          if (valid.length !== files.length)
            setError(
              "Some files were skipped. Choose PNG, JPG or WebP images up to 5 MB.",
            );
          const next = valid.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            url: URL.createObjectURL(f),
          }));
          setArtifacts((prev) => {
            artifactRef.current = [...prev, ...next];
            return artifactRef.current;
          });
          e.target.value = "";
        }}
      />
      {error && (
        <div className="toast" role="alert">
          {error}
          <button aria-label="Dismiss message" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="modal-heading">
          <h2>{modal}</h2>
          <button aria-label="Close dialog" onClick={() => setModal(null)}>
            <X size={20} />
          </button>
        </div>
        {modal === "My Notebook" ? (
          <div className="notebook">
            <p>Capture your questions, observations, and ideas.</p>
            <textarea
              aria-label="Notebook notes"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
              placeholder="I wonder… / 我的发现…"
            />
            <button
              className="primary-button"
              onClick={() => {
                try {
                  localStorage.setItem(`stempath-notebook-v3-${taskStorageKey(task)}`, note);
                  setSaved(true);
                } catch {
                  setError(
                    "Your browser could not save the notebook. Copy your notes before leaving.",
                  );
                }
              }}
            >
              <Save size={16} />
              {saved ? "Saved in this browser" : "Save notes"}
            </button>
            <small>Your notebook stays on this device.</small>
          </div>
        ) : modal === "My Files" ? (
          <ArtifactUploader
            artifacts={artifacts}
            onUpload={onUpload}
            onRemove={removeArtifact}
          />
        ) : modal === "Resources" ? (
          <div className="resource-list">
            <article>
              <Compass />
              <h3>Explore your question</h3>
              <p>
                Write down what you know about {task.title}. Separate observations from assumptions and identify one question to investigate.
              </p>
            </article>
            <article>
              <FlaskConical />
              <h3>Make a fair test</h3>
              <p>
                Change one thing at a time. Keep relevant conditions consistent. Repeat your measurements and record every
                result.
              </p>
            </article>
            <article>
              <BookOpen />
              <h3>Think like a designer</h3>
              <p>
                Write down what you predict, what you observe, and what you
                would try next. An unexpected result is useful evidence.
              </p>
            </article>
          </div>
        ) : modal === "Help" ? (
          <div className="help-content"><p>Adaptive guidance uses interaction patterns, not psychological scores. Anonymous research metadata stays in this browser. Message and artifact text is excluded from the research trace by default; a researcher may explicitly enable local text capture. Learning drafts and notebook notes are stored separately. Research mode provides export and retention controls.</p>
            <p>
              Choose any STEM stage to explore. Use{" "}
              <strong>Complete stage</strong> when you are ready; select it
              again to undo completion.
            </p>
            <p>
              Share an idea in English or Chinese. Choose support level 1 for
              questions, 2 for a hint, or 3 for a thinking framework.
            </p>
            <p>
              Upload sketches through the image button. Images are previewed
              locally and are not analysed by the coach. Chats, images, and
              chat messages and images reset when you reload. The active task, stage progress and thinking records remain in this tab; notebook notes stay in this browser. Loading another task starts a fresh workspace.
            </p>
            <p>
              All seven stages support thinking about the active challenge. Auto mode uses AI when configured; otherwise responses are clearly marked Demo. Recent text and learning records are sent to OpenAI only in AI mode. AI claims are unverified: question them and collect evidence.
            </p>
          </div>
        ) : (
          <div className="project-overview">
            <Compass size={32} />
            <h3>
              {modal === "Home" ? "Welcome to STEMPath AI" : task.title}
            </h3>
            <p>
              {modal === "Home"
                ? "Think, explore, build, and grow with your own ideas. Your first challenge is ready."
                : `${task.description} ${completed.length} of 7 stages completed.`}
            </p>
            <button className="primary-button" onClick={() => setModal(null)}>
              Continue challenge
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
