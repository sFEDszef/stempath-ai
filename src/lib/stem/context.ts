import type {Message} from '@/types';
/** Keep full conversations locally; cap provider history by count AND character budget. */
export function boundedHistory(messages:Pick<Message,'role'|'text'>[]){let budget=8000;const result:Pick<Message,'role'|'text'>[]=[];for(const m of messages.slice(-8).reverse()){if(budget<=0)break;const text=m.text.slice(0,Math.min(2000,budget));budget-=text.length;result.unshift({role:m.role,text});}return result;}
