import 'server-only';
export interface PlatformConfig {persistence:'local'|'postgres';auth:'disabled'|'participant';browsing:'OPEN'|'ASSIGNED';}
export function platformConfig():PlatformConfig {
 const persistence=process.env.PERSISTENCE_MODE??'local',auth=process.env.AUTH_MODE??'disabled',browsing=process.env.STUDENT_TASK_MODE??'OPEN';
 if(!['local','postgres'].includes(persistence)||!['disabled','participant'].includes(auth)||!['OPEN','ASSIGNED'].includes(browsing))throw Error('Invalid platform configuration');
 if((persistence==='postgres')!==(auth==='participant'))throw Error('POSTGRES and participant authentication must be enabled together');
 return {persistence,auth,browsing} as PlatformConfig;
}
export function sessionSecret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32)throw Error('SESSION_SECRET must contain at least 32 characters');return s;}
