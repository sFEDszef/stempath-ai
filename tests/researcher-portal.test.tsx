import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {I18nProvider} from '@/lib/i18n';
import {ResearchDataViewer} from '@/components/ResearchDataViewer';
import {isResearchRole} from '@/lib/auth/roles';
import {readResearchBundle} from '@/lib/research/review';
import {researchChangeReason} from '@/lib/research/continuation';
import {conditionConfig} from '@/lib/research/config';
import {recordEvent, startSession, endSession} from '@/lib/research/session';
import {demoTasks} from '@/data/tasks';

function session(capture = false) {
  const config = {...conditionConfig(), storeMessageText: capture};
  let s = {...startSession(demoTasks[0], config, Date.now(), {interfaceLanguage:'zh-CN',taskLanguage:'zh-CN',provider:'demo',model:'deterministic'}), participantCode:'P001'};
  s = recordEvent(s, 'MESSAGE_SENT', {messageText:'我想比较两种车身重量'}) as typeof s;
  s = recordEvent(s, 'AI_RESPONSE', {messageText:'你准备让哪些条件保持一样？'}) as typeof s;
  return s;
}
function render(s = session()) {
  return renderToStaticMarkup(<I18nProvider><ResearchDataViewer review={{code:'P001', text:'{}', sessions:[s]}} onClose={() => {}}/></I18nProvider>);
}
describe('researcher roles and policy-filtered learning data', () => {
  it('accepts only authenticated privileged role names', () => {
    for (const role of ['ADMIN','RESEARCHER']) expect(isResearchRole(role)).toBe(true);
    for (const role of ['STUDENT','admin',undefined,null,'?research=1']) expect(isResearchRole(role)).toBe(false);
  });
  it('reads validated participant data and empty exports', () => {
    expect(readResearchBundle(JSON.stringify({schemaVersion:'0.6',sessions:[session()]}),'P001')).toHaveLength(1);
    expect(readResearchBundle('{"schemaVersion":"0.6","sessions":[]}', 'P001')).toEqual([]);
  });
  it('rejects participant mismatch, malformed data and unauthorized text capture', () => {
    const s = session();
    expect(() => readResearchBundle(JSON.stringify({schemaVersion:'0.6',sessions:[s]}),'P002')).toThrow('Participant mismatch');
    expect(() => readResearchBundle('{"sessions":[]}', 'P001')).toThrow();
    s.events[0].messageText = 'not authorized for research export';
    expect(() => readResearchBundle(JSON.stringify({schemaVersion:'0.6',sessions:[s]}),'P001')).toThrow();
  });
  it('reads deployed v6 archives without relabeling or mixing new prompt responses', () => {
    const s = session(); s.promptVersion = 'young-learner-v6'; s.configSnapshot.promptVersion = 'young-learner-v6';
    const [saved] = readResearchBundle(JSON.stringify({schemaVersion:'0.6',sessions:[s]}),'P001');
    expect(saved.promptVersion).toBe('young-learner-v6');
    expect(saved.readinessPolicyVersion).toBe('task-rubric-v1');
    expect(researchChangeReason(saved)).toBe('PROMPT_VERSION_CHANGE');
    expect(endSession(saved,researchChangeReason(saved)!).endReason).toBe('PROMPT_VERSION_CHANGE');
    expect(researchChangeReason(session())).toBeUndefined();
    expect(() => readResearchBundle(JSON.stringify({schemaVersion:'0.6',sessions:[{...s,promptVersion:'unknown'}]}),'P001')).toThrow();
  });
  it('shows usage metrics but never text with capture OFF', () => {
    const s = session(); s.events[0].messageText = 'hidden learning text';
    const html = render(s);
    expect(html).toContain('学习数据'); expect(html).toContain('模型 API 调用');
    expect(html).toContain('本次任务未开启研究文字采集'); expect(html).not.toContain('hidden learning text');
  });
  it('renders opted-in learner and coach text safely', () => {
    const s = session(true); s.events.find(e => e.eventType === 'AI_RESPONSE')!.messageText = '<script>untrusted</script>';
    const html = render(s);
    expect(html).toContain('我想比较两种车身重量'); expect(html).toContain('&lt;script&gt;untrusted&lt;/script&gt;');
    expect(html).not.toContain('<script>untrusted</script>');
  });
});
