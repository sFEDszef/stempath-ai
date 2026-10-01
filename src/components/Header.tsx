'use client';
import Image from 'next/image';
import {useI18n} from '@/lib/i18n';
export function Header({onNavigate,active='Home'}:{onNavigate:(page:string)=>void;active?:string}){
 const {t,locale,setLocale}=useI18n();
 return <header className="header"><button className="brand" onClick={()=>onNavigate('Home')} aria-label={t('STEMPath AI home')}><Image className="brand-icon" src="/brand/tequila-sunset-logo-original.jpg" alt={t('STEMPath AI logo')} width={44} height={44}/><span><strong>STEMPath <em>AI</em></strong><small>{t('Think · Explore · Build · Grow')}</small></span></button><nav aria-label={t('Main navigation')}>{['Home','Challenges','My Projects','Resources'].map(name=><button key={name} className={active===name?'nav-active':''} onClick={()=>onNavigate(name)}>{t(name)}</button>)}</nav><select aria-label="中文 / English" value={locale} onChange={e=>setLocale(e.target.value as 'zh-CN'|'en')}><option value="zh-CN">中文</option><option value="en">English</option></select></header>;
}
