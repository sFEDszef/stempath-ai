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
  id: string;
  role: "assistant" | "student";
  text: string;
  suggestions?: string[];
}
export interface ChatRequest {
  projectId?:string;
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
  metadata?: CoachMetadata;
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
 STEMPathVersion:'0.6'|'0.6.2'|'0.7';promptVersion:'deepseek-v2'|'young-learner-v3';
 providerAttempted?:boolean;diagnostic?:string;compliance?:'COMPLIANCE_CHECK_PASSED'|'COMPLIANCE_FALLBACK_DEMO';
 tokenUsage?:{inputTokens:number;outputTokens:number;totalTokens:number};
 fallbackReason?:string;
}

export type TaskTranslation=Partial<Pick<STEMTask,"title"|"description"|"context"|"objectives"|"constraints"|"successCriteria"|"availableMaterials"|"relevantDomains"|"subject"|"gradeLevel"|"safetyNotes">>;
