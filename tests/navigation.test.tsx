import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProjectHub,type View} from '@/components/ProjectHub';
import {I18nProvider} from '@/lib/i18n';
import {demoTasks} from '@/data/tasks';
import {newProject} from '@/lib/projects/storage';
const noop=vi.fn();
function render(view:View,researchMode=false){return renderToStaticMarkup(<I18nProvider><ProjectHub view={view} researchMode={researchMode} library={[]} examples={demoTasks} projects={view==='My Projects'?[newProject(demoTasks[1])]:[]} preview={demoTasks[1]} editing={null} onView={noop} onPreview={noop} onStart={noop} onContinue={noop} onSave={noop} onEdit={noop} onDelete={noop} onRemove={noop} onRestart={noop} onImport={noop}/></I18nProvider>);}
describe('distinct project navigation and selection boundaries',()=>{
 it('fresh home offers choose/create and no learning workspace',()=>{const html=render('Home');expect(html).toContain('选择一个 STEM 项目');expect(html).toContain('你还没有开始项目');expect(html).not.toContain('ai-coach');expect(html).not.toContain('>开始项目</button>');expect(noop).not.toHaveBeenCalled();});
 it('challenge browser offers preview without automatically starting',()=>{const html=render('Challenges');expect(html).toContain('预览');expect(html).toContain('植物生长');expect(html).not.toContain('>开始项目</button>');});
 it('preview presents the selected task and explicit start',()=>{const html=render('Preview');expect(html).toContain('纸桥承重挑战');expect(html).toContain('开始项目');expect(html).not.toContain('风力小车');});
 it('My Projects only contains started learner instances',()=>{const html=render('My Projects');expect(html).toContain('继续项目');expect(html).toContain('重新开始');expect(html).not.toContain('风力小车');});
 it('resources are independent general guidance',()=>{const html=render('Resources');expect(html).toContain('公平比较');expect(html).not.toContain('继续项目');});
 it('library management is research-only',()=>{expect(render('Home')).not.toContain('研究 / 教师模式');const html=render('Library',true);expect(html).toContain('JSON');expect(html).toContain('导入');});
});
