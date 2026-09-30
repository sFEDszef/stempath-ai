'use client';
import {createContext,useContext,useEffect,useState,useCallback} from 'react';
import {zh} from './zh';
export type Locale='zh-CN'|'en';
export const LANGUAGE_KEY='stempath-language-v1';
const en:Record<string,string>={"context":"Context","objectives":"Objectives","constraints":"Constraints","successCriteria":"Success criteria","availableMaterials":"Materials / resources","relevantDomains":"Relevant domains","subject":"Subject","gradeLevel":"Grade level","lessonNumber":"Lesson","estimatedMinutes":"Estimated time","safetyNotes":"Safety notes","teacherNotes":"Teacher notes","additionalInstructions":"Additional task information","tags":"Tags","engineering-design":"Engineering design","scientific-inquiry":"Scientific inquiry","experimental-investigation":"Experimental investigation","optimization":"Optimization","modelling":"Modelling","general-stem":"General STEM",'stage.understand':'Understand','stage.imagine':'Imagine','stage.plan':'Plan','stage.build':'Build / Investigate','stage.test':'Test','stage.improve':'Improve','stage.reflect':'Reflect'};
export function translate(key:string,locale:Locale){return locale==='zh-CN'?(zh[key]??key):(en[key]??key);}
const Context=createContext({locale:'zh-CN' as Locale,setLocale:(v:Locale)=>{void v;},t:(s:string)=>s});
export function I18nProvider({children}:{children:React.ReactNode}){
 const [locale,setState]=useState<Locale>('zh-CN');
 useEffect(()=>{try{const v=localStorage.getItem(LANGUAGE_KEY);if(v==='en'||v==='zh-CN')setState(v);}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=locale;},[locale]);
 const setLocale=useCallback((v:Locale)=>{setState(v);try{localStorage.setItem(LANGUAGE_KEY,v);}catch{}},[]);
 const t=useCallback((s:string)=>translate(s,locale),[locale]);
 return <Context.Provider value={{locale,setLocale,t}}>{children}</Context.Provider>;
}
export const useI18n=()=>useContext(Context);
