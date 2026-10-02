'use client';
import {useEffect,useState} from 'react';
import {I18nProvider,useI18n} from '@/lib/i18n';
import {Header} from './Header';
import {Footer} from './Footer';
import TaskWorkspace from './TaskWorkspace';
import {ResearcherAccounts} from './ResearcherAccounts';
import {platformFetch,PersistenceError} from '@/lib/persistence/client';
import type {Account} from '@/lib/server/accounts';
import type {PlatformConfig} from '@/lib/server/config';
export function ParticipantPortal({config}:{config:PlatformConfig}){return <I18nProvider><Portal config={config}/></I18nProvider>;}
function Portal({config}:{config:PlatformConfig}){
 const {locale}=useI18n(),zh=locale==='zh-CN';const [account,setAccount]=useState<Account|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[admin,setAdmin]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let alive=true;platformFetch<{account:Account}>('session').then(r=>{if(alive){setAccount(r.account);setReady(true);}}).catch(e=>{if(alive){if(e instanceof PersistenceError&&e.status===401)setReady(true);else setError(zh?'暂时无法连接，请重试。':'Connection unavailable. Please retry.');}});return()=>{alive=false;};},[retry,zh]);
 async function login(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,data=new FormData(form);setBusy(true);setError('');try{const r=await platformFetch<{account:Account}>('login','POST',{participantCode:data.get('participantCode'),pin:data.get('pin')});form.reset();setAccount(r.account);authChanged();}catch(e){setError(e instanceof Error?e.message:'Please retry');}finally{setBusy(false);}}
 function authChanged(){const channel=new BroadcastChannel('stempath-auth');channel.postMessage('changed');channel.close();}
 useEffect(()=>{const channel=new BroadcastChannel('stempath-auth');channel.onmessage=()=>{setAccount(null);setReady(false);setRetry(v=>v+1);};return()=>channel.close();},[]);
 async function logout(){await platformFetch('logout','POST',{});setAccount(null);setAdmin(false);authChanged();}
 if(account&&!admin)return <TaskWorkspace key={account.id} serverAccount={account} taskMode={config.browsing} onLogout={logout} onAdmin={()=>setAdmin(true)}/>;
 return <><Header onNavigate={()=>{if(account)setAdmin(false);}}/><main className="project-hub">{account?<><div className="hub-actions"><button onClick={()=>setAdmin(false)}>{zh?'返回学习空间':'Back to learning'}</button><button onClick={()=>void logout().catch(e=>setError(e instanceof Error?e.message:'Please retry'))}>{zh?'退出':'Sign out'}</button></div>{error&&<p role="alert">{error}</p>}<ResearcherAccounts/></>:<section className="hub-card participant-login"><h1>{zh?'欢迎来到 STEMPath':'Welcome to STEMPath'}</h1><p>{zh?'用老师给你的研究编号和 PIN，继续你的学习。':'Use the code and PIN from your teacher to continue learning.'}</p>{ready?<form onSubmit={login}><label>{zh?'研究编号':'Participant Code'}<input name="participantCode" autoComplete="username" required maxLength={32} autoCapitalize="characters"/></label><label>{zh?'学习 PIN':'Learning PIN'}<input name="pin" type="password" inputMode="numeric" autoComplete="off" required minLength={4} maxLength={12}/></label><button className="primary-button" disabled={busy}>{busy?(zh?'正在进入…':'Signing in…'):(zh?'进入 STEMPath':'Enter STEMPath')}</button></form>:<p>{zh?'正在连接学习空间…':'Connecting…'}</p>}{error&&<p role="alert">{error}</p>}{!ready&&error&&<button onClick={()=>{setError('');setRetry(v=>v+1);}}>{zh?'重试':'Retry'}</button>}</section>}</main><Footer/></>;
}
