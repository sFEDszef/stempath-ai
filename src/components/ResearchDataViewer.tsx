'use client';
import {useI18n} from '@/lib/i18n';
import type {ResearchSession} from '@/lib/research/session';
import {stageIds} from '@/lib/stem/stages';

export interface ParticipantReview {code: string; text: string; sessions: ResearchSession[];}
const stageNames = ['看懂任务', '想办法', '做计划', '动手试试', '测一测', '改一改', '想一想'];
function downloadReview(review: ParticipantReview) {
  const url = URL.createObjectURL(new Blob([review.text], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url; link.download = `research-${review.code}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ResearchDataViewer({review, onClose}: {review: ParticipantReview; onClose: () => void}) {
  const {locale} = useI18n(), zh = locale === 'zh-CN';
  const stageName = (stage: typeof stageIds[number]) => zh ? stageNames[stageIds.indexOf(stage)] : stage;
  return <section className="hub-card research-review" aria-labelledby="research-review-title">
    <div className="hub-actions"><button onClick={onClose}>{zh ? '返回研究者管理' : 'Back to researcher management'}</button>
      <button onClick={() => downloadReview(review)}>{zh ? '下载研究数据 JSON' : 'Download research JSON'}</button></div>
    <h1 id="research-review-title">{zh ? '学习数据' : 'Learning data'} · {review.code}</h1>
    <p>{zh ? '仅供获授权的研究者使用。数据来自服务器保存的研究记录；活跃时长是操作估计，不代表注意力或学习能力评分。' : 'For authorized researchers. These are saved server records; active time estimates interaction, not attention or learning ability.'}</p>
    {!review.sessions.length && <p role="status">{zh ? '这个账号还没有保存的研究记录。分配任务并完成学习操作后，可在这里重新查看。' : 'No saved research sessions yet. Assign a task and return after learning activity is saved.'}</p>}
    {review.sessions.map(session => <section key={session.sessionId} className="research-session">
      <h2>{zh ? '学习记录' : 'Learning session'} · {new Date(session.startedAt).toLocaleString(zh ? 'zh-CN' : 'en-GB')}</h2>
      <p>{session.completedAt ? (zh ? '项目已完成' : 'Project completed') : session.endedAt ? (zh ? '已归档' : 'Archived') : (zh ? '学习进行中' : 'In progress')} · {session.condition} · {session.promptVersion}</p>
      <dl className="research-metrics">
        <div><dt>{zh ? '当前阶段' : 'Current stage'}</dt><dd>{stageName(session.currentStage)}</dd></div>
        <div><dt>{zh ? '完成阶段' : 'Completed stages'}</dt><dd>{session.completedStages.length} / 7</dd></div>
        <div><dt>{zh ? '帮助等级' : 'Support level'}</dt><dd>{session.supportLevel}</dd></div>
        <div><dt>{zh ? 'AI 回复次数' : 'Coach responses'}</dt><dd>{session.events.filter(e => e.eventType === 'AI_RESPONSE').length}</dd></div>
        <div><dt>{zh ? '模型 API 调用' : 'Model API calls'}</dt><dd>{session.usage.aiCalls}</dd></div>
        <div><dt>{zh ? 'Token 用量' : 'Token usage'}</dt><dd>{session.usage.totalTokens}</dd></div>
        <div><dt>{zh ? '活跃分钟（估计）' : 'Active minutes (estimate)'}</dt><dd>{(session.activeDurationMs / 60000).toFixed(1)}</dd></div>
        <div><dt>{zh ? 'AI 来源' : 'AI provider'}</dt><dd>{session.provider} · {session.model}</dd></div>
      </dl>
      <details><summary>{zh ? '查看阶段与帮助等级记录' : 'Stage and support history'}</summary>
        <div className="account-table"><table><thead><tr><th>{zh ? '阶段' : 'Stage'}</th><th>{zh ? '停留秒数' : 'Seconds'}</th></tr></thead>
          <tbody>{session.stageTimings.map((entry, index) => <tr key={index}><td>{stageName(entry.stage)}</td><td>{Math.round(entry.durationMs / 1000)}</td></tr>)}</tbody></table></div>
        <ul>{session.supportHistory.map((entry, index) => <li key={index}>{stageName(entry.stage)} · {entry.from ?? '—'} → {entry.to} · {entry.initiator}</li>)}</ul>
      </details>
      <details><summary>{zh ? '查看研究对话记录' : 'Research conversation records'}</summary>
        {!session.config.storeMessageText ? <p>{zh ? '本次任务未开启研究文字采集，不显示或补采对话原文。学习对话保存与研究导出是不同功能。' : 'Research text capture was OFF. Text is not shown or collected retroactively. Learning storage and research export are separate.'}</p>
          : <><p>{zh ? '以下仅显示按该次任务采集设置保存的文字，未采集的内容不会补录。' : 'Only text saved under this session’s capture policy is shown; missing text is not reconstructed.'}</p>
            <ol className="research-transcript">{session.events.filter(e => ['MESSAGE_SENT', 'AI_RESPONSE'].includes(e.eventType) && e.messageText !== undefined).map(event => <li key={event.eventId}><strong>{event.eventType === 'MESSAGE_SENT' ? (zh ? '学生' : 'Student') : (zh ? '学习伙伴' : 'Coach')} · {stageName(event.stage)} · {zh ? '等级' : 'Level'} {event.supportLevel}</strong><p>{event.messageText}</p></li>)}</ol></>}
      </details>
    </section>)}
  </section>;
}
