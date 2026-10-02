"use client";
import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  ChevronRight,
  X,
} from "lucide-react";
import { Header } from "./Header";
import { ProgressSidebar } from "./ProgressSidebar";
import { ChallengeCard } from "./ChallengeCard";
import { AIChat } from "./AIChat";
import { STEMJourney } from "./STEMJourney";
import { ArtifactUploader } from "./ArtifactUploader";
import { HelpMeter } from "./HelpMeter";
import {useI18n} from "@/lib/i18n";
import {StageCheckpoint} from "./StageCheckpoint";
import {boundedHistory} from "@/lib/stem/context";
import {youngReply,youngQuestion} from "@/lib/stem/youngLearner";
import {targetGradeBand} from "@/lib/stem/gradeBands";
import {checkpointState,accessibleStage,nextStage,childStageNames} from "@/lib/stem/stageCheckpoints";
import type {Project,ProjectProgress} from "@/lib/projects/storage";
import { getStages, keyQuestions, pedagogy } from "@/lib/stem/stages";

import { useAdaptive } from "@/lib/pedagogy/useAdaptive";
import { ResearchPanel } from "./ResearchPanel";
import type { ResearchController } from "@/lib/research/useResearchSession";
import { conditionConfig, initialLevel, aiEnabled, type ResearchConfig } from "@/lib/research/config";
import { type Choice } from "@/lib/research/session";
import { decidePedagogicalAction } from "@/lib/pedagogy/decisionEngine";
import { suggestedReplies } from "@/lib/pedagogy/responses";
import { SupportRecommendation } from "./SupportRecommendation";
import { AIChallenge } from "./AIChallenge";
import { CoachError } from "@/lib/coach";
import type { Artifact, Message, StageId, SupportLevel, ChatRequest, STEMTask, LearningArtifacts as Thinking } from "@/types";
export default function Workspace({task,initialProject,saveStatus,onSaveRetry,onProgress,onNavigate,onLoadTask,research,researchVisible,onResearchReset,onResearchClear,onAssignTask,onHideResearch}:{initialProject:Project;saveStatus:"saved"|"saving"|"failed";onSaveRetry:()=>void;onProgress:(p:ProjectProgress)=>void;onNavigate:(name:string)=>void;task:STEMTask;onLoadTask:()=>void;research:ResearchController;researchVisible:boolean;onResearchReset:(config:ResearchConfig,task?:STEMTask)=>void;onResearchClear:(all:boolean)=>void;onAssignTask:(task:STEMTask)=>void;onHideResearch:()=>void}) {
  const {t,locale}=useI18n();
  const config=research.session?.config??conditionConfig();
  const coachEnabled=aiEnabled(config),finished=!!research.session?.completedAt;
  const manualSupport=config.allowManualSupportChange&&coachEnabled&&!finished;
  const lastArtifacts=useRef<Record<string,string>>({});
  const challengeRef=useRef<{id:string;stage:StageId}|null>(null);
  const suggestionRef=useRef('');
  const {event:researchEvent,language:researchLanguage}=research;
  const primary=targetGradeBand(task)!=="G7+";
  const stages=getStages(task).map(s=>({...s,title:primary?(locale==="zh-CN"&&s.id==="build"&&/inquiry|investigation/.test(task.type)?"开始探究":childStageNames[s.id][locale==="zh-CN"?0:1]):locale==="zh-CN"?t(`stage.${s.id}`):s.title,description:primary?({understand:["任务要做什么","Find the goal"],imagine:["想一个办法","Think of an idea"],plan:["准备怎么做","Plan a small step"],build:["亲手试一试","Try your plan"],test:["看看结果","Look at the result"],improve:["试着改一点","Try a small change"],reflect:["说说学到了什么","Share what you learned"]}[s.id][locale==="zh-CN"?0:1]):t(s.description),question:primary?youngQuestion({task,stage:s.id,level:1,message:"",history:[],artifacts:{},completed:[]},locale==="zh-CN"):t(s.question)}));
  const [records,setRecords]=useState<Thinking>(initialProject.records);
  const [restored,setRestored]=useState(false);
  const [mode,setMode]=useState<'auto'|'deepseek'|'demo'>('auto');
  const [responseMode,setResponseMode]=useState<'ai'|'demo'|undefined>();
  const [completionWarning,setCompletionWarning]=useState<string[]>([]);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);

  const [active, setActive] = useState<StageId>(initialProject.active);
  const [completed, setCompleted] = useState<StageId[]>(initialProject.completed);
  const [level, setLevel] = useState<SupportLevel>(initialProject.level??initialLevel(config.condition,config.initialSupportLevel));
  const [conversations, setConversations] = useState<
    Partial<Record<StageId, Message[]>>
  >(initialProject.conversations);
  const [pending, setPending] = useState<StageId[]>([]);
  const pendingRef = useRef(new Set<StageId>());
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const artifactRef = useRef<Artifact[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [note, setNote] = useState(initialProject.notebook);
  const [challenges,setChallenges]=useState(initialProject.challenges);
  const [chatErrors, setChatErrors] = useState<Partial<Record<StageId, {message:string; retryable:boolean; request:ChatRequest}>>>({});
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = stages.find((s) => s.id === active)!;
  const messages:Message[] = conversations[active] ?? [{id:`welcome-${active}`,role:'assistant',text:`${task.title} · ${stage.title}。${youngReply({task,stage:active,level,message:'',history:[],artifacts:records,completed},locale==='zh-CN')}`,suggestions:suggestedReplies(locale==='zh-CN'?'zh':'en')}];
  const adaptiveRequest:ChatRequest={projectId:initialProject.id,interfaceLanguage:locale,taskLanguage:/[\u3400-\u9fff]/.test(task.title)?'zh-CN':'en',task,stage:active,level,message:'',history:boundedHistory(messages),artifacts:records,completed,mode,research:config};
  const adaptive=useAdaptive(adaptiveRequest);
  const lang=adaptive.decision.state.language;
  useEffect(()=>{researchLanguage(lang);},[lang,researchLanguage]);
  const recommendationKey=adaptive.showRecommendation?`${active}:${adaptive.decision.reason}:${adaptive.decision.recommendation}`:'';
  useEffect(()=>{
    if(recommendationKey&&suggestionRef.current!==recommendationKey){const fade=adaptive.decision.reason==='fade';researchEvent(fade?'FADING_SUGGESTED':'ESCALATION_SUGGESTED',{supportRecommendation:adaptive.decision.recommendation,fadingSuggested:fade,escalationSuggested:!fade});}
    suggestionRef.current=recommendationKey;
  },[recommendationKey,adaptive.decision.reason,adaptive.decision.recommendation,researchEvent]);
  function changeLevel(next:SupportLevel){if(!manualSupport||next===level||(pendingRef.current.size>0||research.busy))return;research.support(next,'STUDENT');setLevel(next);void deliver({...adaptiveRequest,level:next,previousLevel:level,intent:'support-change',message:locale==='zh-CN'?'请调整帮助。':'Please adjust the guidance.'});}
  function recordArtifact(field:string,value:string){const key=`${active}:${field}`;if(lastArtifacts.current[key]===value||(!value&&!lastArtifacts.current[key]))return;lastArtifacts.current[key]=value;research.artifact(active,field,value);}

  const checkpoint=checkpointState(task,active,records,completed);
  const readyRef=useRef('');
  useEffect(()=>{const key=checkpoint.status==='READY'?active:'';if(key&&readyRef.current!==key)researchEvent('STAGE_READY',{systemAction:'MINIMUM_CHECKPOINT_NOT_MASTERY'},active);readyRef.current=key;},[checkpoint.status,active,researchEvent]);
  function completeStage(force=false){
    if(finished||pendingRef.current.size||research.busy)return;
    const missing=checkpoint.missing;
    if(!completed.includes(active)&&missing.length&&!(force&&researchVisible)){setCompletionWarning([locale==='zh-CN'?missing[0].zh:missing[0].en]);return;}
    if(force&&researchVisible&&missing.length)research.event('STAGE_OVERRIDE',{systemAction:'TEACHER_FORCE_CONTINUE'});
    if(!completed.includes(active)){setCompleted(prev=>[...prev,active]);research.complete(active,true);}
    setCompletionWarning([]);const next=nextStage(active);
    if(next)enterStage(next);else research.finish();
  }
  function chooseSupport(accept:boolean){
    if(!adaptive.showRecommendation||(pendingRef.current.size>0||research.busy)||finished)return;
    const fade=adaptive.decision.reason==='fade';
    research.event(fade?(accept?'FADING_ACCEPTED':'FADING_REJECTED'):(accept?'ESCALATION_ACCEPTED':'ESCALATION_REJECTED'),{supportRecommendation:adaptive.decision.recommendation,fadingAccepted:fade?accept:undefined,escalationAccepted:!fade?accept:undefined});
    const next=adaptive.resolveRecommendation(accept);
    if(accept&&next){research.support(next,'SYSTEM_RECOMMENDATION');setLevel(next);
      const history=boundedHistory(messages);
      void deliver({...adaptiveRequest,level:next,previousLevel:level,history,intent:'support-change',message:locale==='zh-CN'?'请按我选择的支持等级继续引导。':'Please continue at my chosen support level.'});
    }
  }
  useEffect(() => {
    try {
      research.event('WORKSPACE_RESTORED',{systemAction:'SAVED_PROJECT'});
      research.stage(initialProject.active);research.support(initialProject.level,'STUDENT');
      for(const id of initialProject.completed)research.complete(id,true);

    } catch {
      // Storage may be unavailable; the notebook remains usable in memory.
    }
    setRestored(true);
    return () => artifactRef.current.forEach((a) => URL.revokeObjectURL(a.url));
  // TaskWorkspace remounts this workspace for every loaded task.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{if(restored)onProgress({records,completed,active,level,conversations,notebook:note,challenges});},[records,completed,active,level,conversations,note,challenges,restored,onProgress]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  function selectStage(id:StageId){if(!accessibleStage(id,active,completed,researchVisible))return;if(researchVisible&&!accessibleStage(id,active,completed))research.event("STAGE_OVERRIDE",{systemAction:"TEACHER_FREE_NAVIGATION"});enterStage(id);}
  function enterStage(id: StageId) {
    research.stage(id);
    setActive(id);
    requestAnimationFrame(()=>{const el=document.getElementById("main");el?.focus();el?.scrollIntoView({behavior:"smooth"});});
    setCompletionWarning([]);
    setConversations((prev) =>
      prev[id]?.length
        ? prev
        : {
            ...prev,
            [id]: [
              {
                id: crypto.randomUUID(),
                role: "assistant",
                text: `${task.title} · ${stages.find(s=>s.id===id)!.title}。${youngReply({...adaptiveRequest,stage:id,history:[],message:""},locale==='zh-CN')}`,
                suggestions: suggestedReplies(locale==='zh-CN'?'zh':'en'),
              },
            ],
          },
    );
  }
  async function deliver(request: ChatRequest) {
    if(!coachEnabled||finished)return;
    const requestStage = request.stage;
    if ((pendingRef.current.size>0||research.busy)) return;
    pendingRef.current.add(requestStage);
    setPending(prev => [...prev, requestStage]);
    setChatErrors(prev => ({...prev, [requestStage]:undefined}));
    try {
      const response = await research.generate(request);
      if(!alive.current)return;

      setResponseMode(response.mode);
      setConversations(prev => ({...prev,[requestStage]:[...(prev[requestStage]??[]),{id:crypto.randomUUID(),role:"assistant",...response}]}));
    } catch (error) {
      if(!alive.current)return;

      setChatErrors(prev => ({...prev,[requestStage]:{message:error instanceof Error?error.message:'The coach could not respond.',retryable:!(error instanceof CoachError)||error.retryable,request}}));
    } finally {
      pendingRef.current.delete(requestStage);
      setPending(prev => prev.filter(s => s !== requestStage));
    }
  }
  async function send(text: string, claim?:string) {
    if (!text.trim() || (pendingRef.current.size>0||research.busy)||!coachEnabled||finished) return;
    const studentText=claim?`Regarding this unverified claim: “${claim}”\n\n${text.trim()}`:text.trim();
    const request:ChatRequest = {projectId:initialProject.id,interfaceLanguage:locale,taskLanguage:/[\u3400-\u9fff]/.test(task.title)?'zh-CN':'en',stage:active,level,message:studentText,history:boundedHistory(messages),task,artifacts:records,completed,mode,research:config,intent:claim?"evaluate-claim":"chat",claim};
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
    if(!failed&&messages.at(-1)?.role==='student'){void deliver({...adaptiveRequest,message:messages.at(-1)!.text,history:boundedHistory(messages.slice(0,-1))});return;}
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
    if(["Home","Challenges","My Projects","Resources"].includes(name)){onNavigate(name);return;}
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
      <a href="#main" className="skip-link">{t("Skip to learning workspace")}</a>
      <Header onNavigate={navigate} />
      <div className="workspace-shell">
        <ProgressSidebar
          stages={stages}
          active={active}
          completed={completed}
          locked={stages.filter(s=>!accessibleStage(s.id,active,completed,researchVisible)).map(s=>s.id)}
          onStage={selectStage}
          onTool={navigate}
        />
        <main tabIndex={-1} id="main" className="main-workspace">
          <div className="breadcrumb">
            <button onClick={() => navigate("Challenges")}>{t("Challenges")}</button>
            <ChevronRight size={13} />
            <span>{task.title}</span><button onClick={onLoadTask}>{t("Load STEM Challenge")}</button>
          </div>
          <ChallengeCard task={task} />
          <p className="save-status" role="status">{t(saveStatus==='saved'?'Saved':saveStatus==='saving'?'Saving…':'Save failed')}{saveStatus==='failed'&&<button onClick={onSaveRetry}>{t('Retry saving')}</button>}</p>
          {coachEnabled&&researchVisible&&<div className="coach-mode"><label>{t("Coach mode")}<select aria-label={t("Coach mode")} value={mode} onChange={e=>{research.event('CONFIG_CHANGED',{systemAction:'MODE_'+e.target.value.toUpperCase()});setMode(e.target.value as 'auto'|'deepseek'|'demo');setResponseMode(undefined)}}><option value="auto">{t("Auto · AI when available")}</option><option value="deepseek">{t("DeepSeek · real AI only")}</option><option value="demo">{t("Demo · local practice")}</option></select></label><span>{responseMode==='demo'?t("Demo response · local guidance"):responseMode==='ai'?t("DeepSeek · real AI response"):mode==='deepseek'?t("DeepSeek only · errors allow retry."):t("Practice with Demo when AI is unavailable.")}</span></div>}
          <AIChat
            researchVisible={researchVisible}
            recommendation={!finished&&adaptive.showRecommendation?<SupportRecommendation decision={{...adaptive.decision,state:{...adaptive.decision.state,language:locale==='zh-CN'?'zh':'en'}}} onChoice={chooseSupport} disabled={(pending.length>0||research.busy)}/>:undefined}
            coachDisabled={!coachEnabled||finished}
            supportDisabled={!manualSupport||(pending.length>0||research.busy)}
            sessionFinished={finished}
            mode={responseMode??(mode==="auto"?undefined:mode)}
            stage={stage}
            level={level}
            messages={messages.map(m=>m.role==='assistant'&&m.suggestions?.length?{...m,suggestions:suggestedReplies(locale==='zh-CN'?'zh':'en')}:m)}
            busy={(pending.length>0||research.busy)}
            onSend={text=>void send(text)}
            error={chatErrors[active]??(!pending.length&&messages.at(-1)?.role==='student'?{message:t("The coach could not respond. Please retry."),retryable:true}:undefined)}
            onRetry={retry}
            onUpload={onUpload}
            completionLabel={t(active==='reflect'?'Finish Project':'Finish & Go to Next Step')}
            onComplete={()=>completeStage()}
            complete={completed.includes(active)}
            onLevel={changeLevel}
          />
          {completionWarning.length>0&&<section className="rail-section" role="alert"><p>{t('One more thing:')} {completionWarning[0]}</p>{researchVisible&&<button onClick={()=>completeStage(true)}>{t('Force Continue (teacher)')}</button>}</section>}
          {completed.includes('reflect')&&<section className="rail-section completion-summary"><h2>{t('Project complete!')}</h2><p>{t('You can revisit your steps and notes.')}</p></section>}
          {researchVisible&&<ResearchPanel research={research} task={task} decision={adaptive.decision} onReset={onResearchReset} onClear={onResearchClear} onTask={onAssignTask} onHide={onHideResearch}/>}
          <p className="workspace-footer">
            <span>{t("Every question is a step forward.")}</span>
            <span>{t("STEMPath AI · Research prototype")}</span>
          </p>
        </main>
        <aside className="right-sidebar">
          <details className="rail-section questions"><summary>{t("Key Questions")}</summary>
            <h2>
              <Lightbulb size={18} />{t("Key Questions")}</h2>
            {(primary?[youngQuestion(adaptiveRequest,locale==='zh-CN')]:(locale==='zh-CN'?pedagogy[active].questions.map(t):keyQuestions(task,active))).map((question, i) => (
              <div className="question" key={question}>
                <span>{t("0")}{i + 1}</span>
                <p>{question}</p>
              </div>
            ))}
          </details>
          <STEMJourney
            stages={stages}
            active={active}
            completed={completed}
            locked={stages.filter(s=>!accessibleStage(s.id,active,completed,researchVisible)).map(s=>s.id)}
          onStage={selectStage}
          />
          <StageCheckpoint task={task} stage={active} records={records} messages={messages} aiUsed={coachEnabled} onChange={(field,value)=>setRecords(prev=>({...prev,[active]:{...prev[active],[field]:value}}))} onRecord={recordArtifact} disabled={finished}/>

          <details className="rail-section"><summary>{t("Your uploaded images")}</summary><p>{t("Images last only until you leave this workspace.")}</p><ArtifactUploader
            artifacts={artifacts}
            onUpload={onUpload}
            onRemove={removeArtifact}
          />
          </details>
          {coachEnabled&&<HelpMeter level={level} onChange={changeLevel} disabled={!manualSupport||(pending.length>0||research.busy)}/>}
          {coachEnabled&&<p className="support-status" aria-live="polite">{locale==='zh-CN'?t("AI 支持"):t("AI support")}{t(":")}{adaptive.showRecommendation?(adaptive.decision.reason==='stronger'?(locale==='zh-CN'?'可以尝试更强的拆解支持':'Step-by-step guidance is available'):(locale==='zh-CN'?'可以尝试更独立地思考':'Ready to try more independently')):(locale==='zh-CN'?'按你选择的等级引导':'Guidance at your chosen level')}</p>}
          {!finished&&coachEnabled&&(adaptive.decision.challengeEligible||!!challenges[active]?.claim)&&<AIChallenge initial={challenges[active]} onSave={value=>setChallenges(prev=>({...prev,[active]:value}))} generateResponse={research.generate} language={locale==='zh-CN'?'zh':'en'} onTrigger={(claim)=>{const id=crypto.randomUUID();challengeRef.current={id,stage:active};research.event('AI_CHALLENGE_STARTED',{challengeId:id,aiChallengeTriggered:true,messageText:claim});}} onChoice={(choice:Choice)=>research.event('AI_CHALLENGE_RESPONSE',{challengeId:challengeRef.current?.id,learnerChoice:choice})} onRevision={revision=>research.event('AI_CHALLENGE_FOLLOW_UP',{challengeId:challengeRef.current?.id,laterRevision:revision})} disabled={(pending.length>0||research.busy)} key={`${active}:${config.enableAIChallenge}`} request={adaptiveRequest} onRespond={(message,claim)=>void send(message,claim)}/>}

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
          {t(error)}
          <button aria-label={t("Dismiss message")} onClick={() => setError("")}>
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
          <h2>{t(modal??"")}</h2>
          <button aria-label={t("Close dialog")} onClick={() => setModal(null)}>
            <X size={20} />
          </button>
        </div>
        {modal === "My Notebook" ? (
          <div className="notebook">
            <p>{t("Capture your questions, observations, and ideas.")}</p>
            <textarea
              aria-label={t("Notebook notes")}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);

              }}
              placeholder={t("I wonder… / 我的发现…")}
            />
            <small>{t("Your notebook stays on this device.")}</small>
          </div>
        ) : modal === "My Files" ? (
          <ArtifactUploader
            artifacts={artifacts}
            onUpload={onUpload}
            onRemove={removeArtifact}
          />
        ) : (
          <div className="help-content"><p>{t('Choose a stage, record your thinking and mark it complete when ready. You can reopen any stage.')}</p><p>{t('Choose questions, a hint or a thinking framework. AI suggestions can be wrong; check them with evidence.')}</p><p>{t('Projects, conversations and notes are saved on this device. Images are temporary. No cross-device sync.')}</p></div>
        )}
      </dialog>
    </>
  );
}
