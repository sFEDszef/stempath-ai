import { snapshot, type ResearchSession } from './session';
export function exportJSON(session:ResearchSession,now=Date.now()){return JSON.stringify({exportedAt:new Date(now).toISOString(),...snapshot(session,now)},null,2);}
function cell(value:unknown){let text=value===undefined?'':typeof value==='object'?JSON.stringify(value):String(value);if(/^[\s]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
/** Long-form CSV: each row has a recordType; nested signals are JSON in a quoted cell. */
export function exportCSV(session:ResearchSession,now=Date.now()) {
 const s=snapshot(session,now);
 const {events,tasks,stageTimings,supportHistory,artifactRevisions,...metadata}=s;
 const rows:Record<string,unknown>[]=[{recordType:'session',...metadata},...tasks.map(v=>({recordType:'task',sessionId:s.sessionId,...v})),...events.map(v=>({recordType:'event',...v})),...stageTimings.map(v=>({recordType:'stageTiming',sessionId:s.sessionId,...v})),...supportHistory.map(v=>({recordType:'support',sessionId:s.sessionId,...v})),...artifactRevisions.map(v=>({recordType:'artifact',sessionId:s.sessionId,...v}))];
 const columns=[...new Set(rows.flatMap(Object.keys))];
 return [columns.map(cell).join(','),...rows.map(row=>columns.map(key=>cell(row[key])).join(','))].join('\r\n');
}
export function downloadSession(s:ResearchSession,format:'json'|'csv',now=Date.now()) {
 const blob=new Blob([format==='json'?exportJSON(s,now):'\uFEFF'+exportCSV(s,now)],{type:format==='json'?'application/json':'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`stempath-session-${s.sessionId}.${format}`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
