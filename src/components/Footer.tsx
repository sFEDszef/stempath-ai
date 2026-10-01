
'use client';
import {useI18n} from '@/lib/i18n';
export function Footer(){
 const {t}=useI18n();
 return <footer className="site-footer"><div className="footer-inner"><strong>STEMPath AI</strong><p>{t('Independently created and maintained by Tequila Sunset')}</p><p>{t('Contact:')} <a href="mailto:1965499811@qq.com">1965499811@qq.com</a></p><p>© 2026 Tequila Sunset</p><details><summary>{t('Original Work & Maintenance Statement')}</summary><p>{t("STEMPath AI is independently initiated, designed, established, and continuously maintained by Tequila Sunset.")}</p><p>{t("The platform architecture, educational interaction design, research-feature integration, and overall product design of STEMPath AI are independently developed and maintained by Tequila Sunset.")}</p><p>{t("AI tools, AI models, open-source software, frameworks, fonts, icon libraries, hosting platforms, and other third-party services used during development serve only as development or technical support tools. The relevant rights to those third-party technologies remain with their respective rights holders.")}</p><p>{t("Unless explicitly stated otherwise, STEMPath AI currently has no other co-creators or co-maintainers.")}</p></details></div></footer>;
}
