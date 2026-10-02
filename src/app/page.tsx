import TaskWorkspace from '@/components/TaskWorkspace';
import {ParticipantPortal} from '@/components/ParticipantPortal';
import {platformConfig} from '@/lib/server/config';
export const dynamic='force-dynamic';
export default function Page(){const config=platformConfig();return config.auth==='participant'?<ParticipantPortal config={config}/>:<TaskWorkspace/>;}
