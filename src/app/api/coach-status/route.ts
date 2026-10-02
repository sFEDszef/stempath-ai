import {release} from '@/lib/ai/provider';
export function GET(){const ready=!!process.env.DEEPSEEK_API_KEY&&process.env.AI_PROVIDER!=='demo';return Response.json({...release,provider:ready?'deepseek':'demo',model:ready?(process.env.AI_MODEL||'deepseek-flash'):'deterministic'},{headers:{'Cache-Control':'no-store'}});}
