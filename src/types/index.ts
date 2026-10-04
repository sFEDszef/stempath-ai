export type StageId =
  "understand" | "imagine" | "plan" | "build" | "test" | "improve" | "reflect";
export type TargetGradeBand = "G3-4" | "G5-6" | "G7+";
export type SupportLevel = 1 | 2 | 3;
export interface Stage {
  id: StageId;
  title: string;
  description: string;
  question: string;
  prompts: [string, string, string];
}
export interface Message {
  metadata?: CoachMetadata;
  dialogue?: DialogueCompletion;
  id: string;
  role: "assistant" | "student";
  text: string;
  suggestions?: string[];
}
export type ChatIntent = "chat" | "challenge" | "evaluate-claim" | "support-change";
export interface DialogueCompletion {intent:ChatIntent;replyTo?:string;successful?:boolean;receipt?:string;}
export interface StageCriterion {id:string;kind:CriterionKind;label:string;}
export type CriterionKind = "TASK_GOAL"|"SUCCESS_CRITERION"|"ONE_CONSTRAINT_OR_RESOURCE"|"AT_LEAST_TWO_IDEAS"|"CHOSEN_DIRECTION"|"SIMPLE_REASON"|"CHANGE_FACTOR"|"AT_LEAST_ONE_CONTROLLED_CONDITION"|"MEASUREMENT"|"SIMPLE_PROCEDURE"|"ACTUAL_BUILD_ACTION"|"SECOND_ACTUAL_ACTION_OR_DETAIL"|"BUILD_OBSERVATION_OR_PROBLEM"|"ACTUAL_TRIAL_1"|"ACTUAL_TRIAL_2"|"COMPARE_WITH_GOAL"|"IDENTIFY_REVISION"|"HOW_TO_REVISE"|"LINK_TO_TEST_EVIDENCE"|"ONE_TAKEAWAY"|"EVIDENCE_OR_EXPERIENCE_CONNECTION"|"ONE_CHANGE_IN_THINKING_OR_NEXT_TIME";
export type ProgressionCriteria = {minimumMeaningfulTurnsPerStage:number;profile:"wind-car"|"bridge"|"filtration"|"insulation"|"plants"|"engineering"|"inquiry"} & Record<StageId,StageCriterion[]>;
export type DialogueMessage=Pick<Message,"id"|"role"|"text"|"dialogue">;
export interface ChatRequest {
  messageId?:string;
  progressionHistory?:DialogueMessage[];
  priorReadiness?:import("@/lib/stem/readiness").StageReadinessAssessment;
  continueExploring?:boolean;
  projectId?:string;
  /** Conversation mode only; never grants readiness or completes a stage. */
  stageReady?:boolean;
  interfaceLanguage?: "zh-CN"|"en";
  taskLanguage?: "zh-CN"|"en";
  stage: StageId;
  level: SupportLevel;
  message: string;
  history: Pick<Message, "role" | "text">[];
  task: STEMTask;
  artifacts: LearningArtifacts;
  completed: StageId[];
  mode?: "auto" | "deepseek" | "demo";
  intent?: "chat" | "challenge" | "evaluate-claim" | "support-change";
  claim?: string;
  previousLevel?: SupportLevel;
  research?: import("@/lib/research/config").ResearchConfig;
}
export interface CoachResponse {
  roundReceipt?:string;
  readiness?: import("@/lib/stem/readiness").StageReadinessAssessment;
  metadata?: CoachMetadata;
  dialogue?: DialogueCompletion;
  text: string;
  suggestions: string[];
  mode: "ai" | "demo";
}
export interface CoachService {
  respond(request: ChatRequest): Promise<CoachResponse>;
}
export interface Artifact {
  id: string;
  name: string;
  url: string;
}

export type TaskType = "engineering-design" | "scientific-inquiry" | "experimental-investigation" | "optimization" | "modelling" | "general-stem";
export interface STEMTask {
  taskRevision?: number;
  progressionCriteria?: ProgressionCriteria;
  id: string;
  title: string;
  description: string;
  type: TaskType;
  subject?: string;
  gradeLevel?: string;
  targetGradeBand?: TargetGradeBand;
  lessonNumber?: string;
  estimatedMinutes?: number;
  teacherNotes?: string;
  safetyNotes?: string;
  tags?: string[];
  translations?: Partial<Record<"zh-CN"|"en",TaskTranslation>>;
  context?: string;
  objectives?: string[];
  constraints?: string[];
  successCriteria?: string[];
  availableMaterials?: string[];
  relevantDomains?: string[];
  additionalInstructions?: string;
}
export type LearningArtifacts = Partial<Record<StageId, Record<string, string>>>;
export interface StagePedagogy {
  title: string;
  description: string;
  objective: string;
  student: string;
  coach: string;
  avoid: string;
  examples: [string, string, string];
  questions: [string, string, string];
  fields: string[];
  replies: string[];
}

export interface CoachMetadata {
 provider:'deepseek'|'demo';model:string;responseMode:'ai'|'demo';
 STEMPathVersion:'0.6'|'0.6.2'|'0.7';promptVersion:'deepseek-v2'|'young-learner-v3'|'young-learner-v4'|'young-learner-v5'|'young-learner-v6';readinessPolicyVersion?:'gentle-v1'|'task-rubric-v1';supportPolicyVersion?:import('@/lib/stem/supportLevels').SupportPolicyVersion;
 providerAttempted?:boolean;diagnostic?:string;compliance?:'COMPLIANCE_CHECK_PASSED'|'COMPLIANCE_FALLBACK_DEMO';
 tokenUsage?:{inputTokens:number;outputTokens:number;totalTokens:number};
 fallbackReason?:string;
}

export type TaskTranslation=Partial<Pick<STEMTask,"title"|"description"|"context"|"objectives"|"constraints"|"successCriteria"|"availableMaterials"|"relevantDomains"|"subject"|"gradeLevel"|"safetyNotes">>;
