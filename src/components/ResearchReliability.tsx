'use client';
import {useState} from 'react';
import {useI18n} from '@/lib/i18n';
import type {ResearchController} from '@/lib/research/useResearchSession';
import {snapshot} from '@/lib/research/session';
import {validateSession} from '@/lib/research/integrity';
import {listSavedSessions,readSavedSession,restoreBundle,storageEstimate} from '@/lib/research/storage';
import {exportBundle,combinedCSV,educatorReview} from '@/lib/research/export';
import {usageSummary} from '@/lib/research/reliability';
import {limitReached} from '@/lib/research/requestGate';
function download(text:string,name:string){const url=URL.createObjectURL(new Blob([text],{type:name.endsWith('.csv')?'text/csv;charset=utf-8':'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function ResearchReliability({research}:{research:ResearchController}){
 const {locale}=useI18n();const zh=locale==='zh-CN',label=(cn:string,en:string)=>zh?cn:en;
 const s=research.session;
 const [code,setCode]=useState(s?.participantCode??''),[baseline,setBaseline]=useState(JSON.stringify(s?.baselineMeasures??{})),[outcome,setOutcome]=useState(JSON.stringify(s?.outcomeMeasures??{})),[notice,setNotice]=useState(''),[backup,setBackup]=useState(''),[preview,setPreview]=useState('');
 const [textConfirmed,setTextConfirmed]=useState(false);
 if(!s)return null;
 const report=validateSession(snapshot(s)),usage=usageSummary(s),timing=snapshot(s);
 function action(fn:()=>void){try{fn();setNotice(label('已完成。','Done.'));}catch(error){setNotice(error instanceof Error?error.message:'Invalid data');}}
 return <section className="research-reliability">
 <h3>{label('v0.6 研究可靠性 · 受监督原型','v0.6 Research reliability · supervised prototype')}</h3>
 <p>{label('此面板没有访问控制。请勿填写姓名或其他个人信息。浏览器存储不是安全的长期研究数据库。','This panel has no access control. Do not enter names or other personal information. Browser storage is not secure long-term research storage.')}</p>
 <label>{label('研究编号（请勿填写姓名）','Research participant code — do not enter names')}<input value={code} maxLength={32} placeholder="P001" onChange={e=>setCode(e.target.value)}/></label>
 <label>{label('基线数值（JSON）','Baseline measures (JSON)')}<textarea value={baseline} onChange={e=>setBaseline(e.target.value)} placeholder={'{"stemPretest":62}'}/></label>
 <label>{label('后测数值（JSON）','Outcome measures (JSON)')}<textarea value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder={'{"stemPosttest":78}'}/></label>
 <button onClick={()=>action(()=>research.study(code.trim(),JSON.parse(baseline),JSON.parse(outcome)))}>{label('保存研究变量','Save study variables')}</button>
 <p>{label('只保存数值，不计算因果效应或调整后均值。','Stores numeric variables only; no causal effects or adjusted means are calculated.')}</p>
 <details><summary>{label('初始配置快照（只读）','Initial configuration snapshot (read only)')}</summary><pre>{JSON.stringify(s.configSnapshot,null,2)}</pre></details>
 <h4>{label('数据完整性检查','Data Quality Check')} · {report.status}</h4><ul>{report.checks.map(v=><li key={v}>✓ {v}</li>)}{report.warnings.map(v=><li key={v}>⚠ {v}</li>)}{report.errors.map(v=><li key={v}>✕ {v}</li>)}</ul>
 <p>{label('经过时间 / 估计活跃交互时间（秒）','Elapsed / estimated active interaction time (seconds)')}: {Math.round(timing.elapsedDurationMs/1000)} / {Math.round(timing.activeDurationMs/1000)}</p>
 <p>{label('这不是注意力或学习时间测量。','This does not measure attention or learning time.')}</p>
 <h4>{label('使用量','Usage')}</h4><p>{label('AI 调用 / 输入 / 输出 / 总 token','AI calls / input / output / total tokens')}: {usage.aiCalls} / {usage.inputTokens} / {usage.outputTokens} / {usage.totalTokens}</p>
 <p>Demo: {usage.demoResponses} · {label('回退','Fallbacks')}: {usage.fallbacks} · {label('错误','Errors')}: {usage.errors}</p>
 {(['maxAICallsPerSession','maxTokensPerSession','idleThresholdMs'] as const).map(key=><label key={key}>{key}<input type="number" min={1} max={10000000} value={s.config[key]} onChange={e=>{const v=Number(e.target.value);if(Number.isSafeInteger(v)&&v>0&&v<=10000000)research.configure({...s.config,[key]:v});}}/></label>)}
 {limitReached(s.usage,s.config)&&<p role="status">{label('已达到使用上限','Usage limit reached')}</p>}
 <details><summary>{label('诊断与合规记录','Diagnostics and compliance')}</summary>{s.events.filter(e=>e.diagnostic||e.eventType.startsWith('COMPLIANCE')).map(e=><p key={e.eventId}>{e.timestamp} · {e.diagnostic??e.eventType} · {e.stage} · L{e.supportLevel}</p>)}</details>
 <h4>{label('试点准备清单','Pilot readiness checklist')}</h4><ul>{[[!!s.tasks[0],label('已选择任务并固定修订','Task selected and revision fixed')],[!!s.condition,label('已选择条件','Condition selected')],[!!s.interfaceLanguage,label('已选择界面语言','Interface language selected')],[s.configSnapshot.provider!=='auto',label('提供商状态已获取','Provider status retrieved')],[!!s.participantCode,label('已填写可选匿名编号','Optional anonymous code entered')],[textConfirmed,label('已确认文本捕获选择','Text capture choice confirmed')],[s.config.maxAICallsPerSession>0,label('已配置使用上限','Usage limits configured')],[!!s.startedAt,label('研究会话已启动','Research session started')]].map(([ok,name])=><li key={String(name)}>{ok?'✓':'○'} {name}</li>)}</ul>
 <label><input type="checkbox" checked={textConfirmed} onChange={e=>setTextConfirmed(e.target.checked)}/>{label('我已检查文本捕获选择','I have checked the text capture choice')}</label><small>{label('此清单不是伦理审批或同意书。','This checklist is not ethics approval or consent.')}</small>
 <h4>{label('备份与恢复','Backup and restore')}</h4>
 <button onClick={()=>action(()=>{const all=listSavedSessions(localStorage).map(v=>readSavedSession(localStorage,v.sessionId));const text=exportBundle(all);setPreview(text);download(text,'stempath-v06-backup.json');const estimate=storageEstimate(localStorage);setNotice(`${estimate.count} sessions · ~${estimate.bytes} bytes`);})}>{label('导出所有会话 JSON','Export all saved sessions JSON')}</button>
 <button onClick={()=>action(()=>{const text=combinedCSV(listSavedSessions(localStorage).map(v=>readSavedSession(localStorage,v.sessionId)));setPreview(text);download('\uFEFF'+text,'stempath-v06-analysis.csv');})}>{label('导出所有会话 CSV','Export all saved sessions CSV')}</button>
 <button onClick={()=>action(()=>{const text=JSON.stringify({schemaVersion:'0.6',ratingChoices:['Yes','No','Unsure'],cases:educatorReview(s)},null,2);setPreview(text);download(text,'stempath-educator-review.json');})}>{label('导出教育者评阅样本','Export educator review samples')}</button>
 <p>{label('评阅在离线文件中进行，不会用于自动调整支持决策。','Review ratings are recorded offline and never change live support decisions.')}</p>
 <label>{label('恢复 v0.6 JSON 备份（不覆盖）','Restore v0.6 JSON backup (no overwrite)')}<textarea value={backup} maxLength={20000000} onChange={e=>setBackup(e.target.value)}/></label><button onClick={()=>action(()=>{restoreBundle(localStorage,backup);setBackup('');})}>{label('验证并恢复','Validate and restore')}</button>
 <button onClick={()=>{const e=storageEstimate(localStorage);setNotice(`${e.count} sessions · ~${e.bytes} bytes`);}}>{label('检查本地研究存储大小','Check research storage size')}</button>
 {preview&&<details><summary>{label('导出预览','Export preview')}</summary><textarea readOnly value={preview} rows={8}/></details>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
