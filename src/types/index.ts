export type StageId =
  "understand" | "imagine" | "plan" | "build" | "test" | "improve" | "reflect";
export type SupportLevel = 1 | 2 | 3;
export interface Stage {
  id: StageId;
  title: string;
  description: string;
  question: string;
  prompts: [string, string, string];
}
export interface Message {
  id: string;
  role: "assistant" | "student";
  text: string;
  suggestions?: string[];
}
export interface ChatRequest {
  stage: StageId;
  level: SupportLevel;
  message: string;
  history: Pick<Message, "role" | "text">[];
  task: STEMTask;
  artifacts: LearningArtifacts;
  completed: StageId[];
  mode?: "auto" | "demo";
  intent?: "chat" | "challenge" | "evaluate-claim";
  claim?: string;
}
export interface CoachResponse {
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
  id: string;
  title: string;
  description: string;
  type: TaskType;
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
