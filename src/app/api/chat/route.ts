import {guardedCoach} from '@/lib/server/coachAccess';
import { handleChat } from '@/lib/stem/handler';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request: Request) { return guardedCoach(request,handleChat); }
