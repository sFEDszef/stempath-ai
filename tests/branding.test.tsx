import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';
import {translate} from '@/lib/i18n';

describe('v0.6.1 public branding',()=>{
 it('renders the supplied artwork instead of a Sprout brand icon',()=>{
  const html=renderToStaticMarkup(<Header onNavigate={()=>{}}/>);
  expect(html).toContain('tequila-sunset-logo-original.jpg');
  expect(html).toContain('STEMPath AI logo');
  expect(html).not.toContain('<svg');
 });
 it('renders a semantic footer with keyboard-native contact and collapsed declaration',()=>{
  const html=renderToStaticMarkup(<Footer/>);
  expect(html).toContain('<footer');
  expect(html).toContain('mailto:1965499811@qq.com');
  expect(html).toContain('© 2026 Tequila Sunset');
  expect(html).toContain('<details><summary>Original Work &amp; Maintenance Statement');
  expect(html).not.toContain('<details open');
  expect(html).toContain('respective rights holders');
  expect(html).toContain('no other co-creators or co-maintainers');
 });
 it('switches the shared attribution and declaration translations without changing keys',()=>{
  expect(translate('Independently created and maintained by Tequila Sunset','zh-CN')).toBe('独立创建与维护：龙舌兰日落（Tequila Sunset）');
  expect(translate('Independently created and maintained by Tequila Sunset','en')).toBe('Independently created and maintained by Tequila Sunset');
  expect(translate('Original Work & Maintenance Statement','zh-CN')).toBe('原创与维护声明');
  expect(translate('Unless explicitly stated otherwise, STEMPath AI currently has no other co-creators or co-maintainers.','zh-CN')).toContain('不设其他共同创建者或共同维护者');
 });
 it('preserves header artwork and attribution while shipping versioned website icons',()=>{
  const bytes=readFileSync('public/brand/tequila-sunset-logo-original.jpg');
  expect([...bytes.subarray(0,3)]).toEqual([255,216,255]);
  const layout=readFileSync('src/app/layout.tsx','utf8');
  expect(layout).toContain('creator: "Tequila Sunset"');
  expect(layout).toContain('authors: [{ name: "Tequila Sunset" }]');
  expect(layout).not.toContain('tequila-sunset-logo-original.jpg');
  expect(layout).toContain('/favicon.ico?v=256e7993ff86');
  expect(layout).toContain('/brand/stempath-256e7993ff86-180.png');
  for (const size of [16,32,48,180,192,512]) {
   const png=readFileSync(`public/brand/stempath-256e7993ff86-${size}.png`);
   expect([...png.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
   expect(png.readUInt32BE(16)).toBe(size);
   expect(png.readUInt32BE(20)).toBe(size);
  }
  const ico=readFileSync('public/favicon.ico');
  expect([...ico.subarray(0,6)]).toEqual([0,0,1,0,3,0]);
 });
});
