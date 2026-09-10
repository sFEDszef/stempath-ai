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
export interface CoachRequest {
  stage: StageId;
  level: SupportLevel;
  messages: Message[];
}
export interface CoachResponse {
  text: string;
  suggestions: string[];
}
export interface CoachService {
  respond(request: CoachRequest): Promise<CoachResponse>;
}
export interface Artifact {
  id: string;
  name: string;
  url: string;
}
