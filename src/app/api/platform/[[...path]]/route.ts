import {platformAPI} from '@/lib/server/api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
async function route(request:Request,context:{params:Promise<{path?:string[]}>}){return platformAPI(request,(await context.params).path??[]);}
export {route as GET,route as POST,route as PUT,route as DELETE};
