import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import type { SlideModel } from './pickLesson';

const OUT_DIR = path.join(process.cwd(), 'out');
const W = 1080;
const H = 1440;
const FPS = 30;

let bundled: string | null = null;
async function getBundled(): Promise<string> {
  if (bundled) return bundled;
  console.log('📦 Bundling Remotion...');
  bundled = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });
  return bundled;
}

async function comp(serveUrl: string, id: string, props: Record<string, any>) {
  return selectComposition({ serveUrl, id, inputProps: props });
}

export interface RenderResult {
  files: { path: string; type: 'video' | 'image'; slideIndex: number }[];
}

export async function renderSlides(model: SlideModel, lang: 'en' | 'sk'): Promise<RenderResult> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const serveUrl = await getBundled();
  const prefix = lang;
  const files: RenderResult['files'] = [];

  const les = lang === 'sk' ? model.lessonSk : model.lesson;
  const title = les.title;
  const moduleTitle = lang === 'sk' ? les.module_title_sk : les.module_title;
  const intro = lang === 'sk' ? (les.introduction_sk || les.introduction) : les.introduction;
  const chunks = lang === 'sk' ? model.learningChunksSk : model.learningChunks;
  const funFact = lang === 'sk' ? model.funFact.sk : model.funFact.en;
  const whyCare = lang === 'sk' ? model.whyCare.sk : model.whyCare.en;
  const totalSlides = 1 + 1 + chunks.length + 1 + 1 + 1; // video + intro + learning + funfact + whycare + cta

  // 1. Video slide
  const vProps = { title, moduleTitle, equipment: model.equipment, levelBadge: model.levelBadge?.[lang], lang };
  console.log(`🎬 [${lang}] Video: "${title}"`);
  const vComp = await comp(serveUrl, 'Slide1Video', vProps);
  const vPath = path.join(OUT_DIR, `${prefix}_s1.mp4`);
  await renderMedia({ composition: vComp, serveUrl, codec: 'h264', outputLocation: vPath, inputProps: vProps });
  files.push({ path: vPath, type: 'video', slideIndex: 0 });

  // 2. Intro slide
  const iProps = { content: intro || '', title, lang };
  console.log(`🖼️ [${lang}] Intro`);
  const iComp = await comp(serveUrl, 'SlideIntro', iProps);
  const iPath = path.join(OUT_DIR, `${prefix}_s2.png`);
  await renderStill({ composition: iComp, serveUrl, output: iPath, inputProps: iProps });
  files.push({ path: iPath, type: 'image', slideIndex: 1 });

  // 3-5. Learning slides
  for (let i = 0; i < chunks.length; i++) {
    const lProps = { content: chunks[i], slideNumber: i + 3, totalSlides, lang };
    console.log(`🖼️ [${lang}] Learning ${i + 1}: ${chunks[i].slice(0, 50)}...`);
    const lComp = await comp(serveUrl, 'SlideLearn', lProps);
    const lPath = path.join(OUT_DIR, `${prefix}_s${i + 3}.png`);
    await renderStill({ composition: lComp, serveUrl, output: lPath, inputProps: lProps });
    files.push({ path: lPath, type: 'image', slideIndex: i + 2 });
  }

  // 6. Fun Fact slide
  const ffProps = { content: funFact, type: 'funfact' as const, lang };
  console.log(`🖼️ [${lang}] Fun Fact`);
  const ffComp = await comp(serveUrl, 'SlideFunFact', ffProps);
  const ffPath = path.join(OUT_DIR, `${prefix}_s_ff.png`);
  await renderStill({ composition: ffComp, serveUrl, output: ffPath, inputProps: ffProps });
  files.push({ path: ffPath, type: 'image', slideIndex: files.length });

  // 7. Why Care slide
  const wcProps = { content: whyCare, equipment: model.equipment, lang };
  console.log(`🖼️ [${lang}] Why Care`);
  const wcComp = await comp(serveUrl, 'SlideWhyCare', wcProps);
  const wcPath = path.join(OUT_DIR, `${prefix}_s_wc.png`);
  await renderStill({ composition: wcComp, serveUrl, output: wcPath, inputProps: wcProps });
  files.push({ path: wcPath, type: 'image', slideIndex: files.length });

  // 8. CTA slide
  const ctaProps = { lang, equipment: model.equipment };
  console.log(`🖼️ [${lang}] CTA`);
  const ctaComp = await comp(serveUrl, 'SlideCTA', ctaProps);
  const ctaPath = path.join(OUT_DIR, `${prefix}_s_cta.png`);
  await renderStill({ composition: ctaComp, serveUrl, output: ctaPath, inputProps: ctaProps });
  files.push({ path: ctaPath, type: 'image', slideIndex: files.length });

  console.log(`✅ ${files.length} slides rendered for ${lang.toUpperCase()}`);
  return { files };
}
