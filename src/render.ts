import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import type { SlideModel } from './pickLesson';

const OUT_DIR = path.join(process.cwd(), 'out');
const W = 1080;
const H = 1440;
const FPS = 30;
const VIDEO_DURATION = 5; // seconds

let bundled: string | null = null;

async function getBundled(): Promise<string> {
  if (bundled) return bundled;
  console.log('📦 Bundling Remotion compositions...');
  bundled = await bundle({
    entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx'),
  });
  return bundled;
}

export interface RenderResult {
  files: { path: string; type: 'video' | 'image'; slideIndex: number }[];
}

async function getComposition(serveUrl: string, id: string, props: Record<string, any>) {
  return selectComposition({
    serveUrl,
    id,
    inputProps: props,
  });
}

export async function renderSlides(model: SlideModel, lang: 'en' | 'sk'): Promise<RenderResult> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const serveUrl = await getBundled();
  const prefix = lang;
  const files: RenderResult['files'] = [];

  const les = lang === 'sk' ? model.lessonSk : model.lesson;
  const title = les.title;
  const moduleTitle = lang === 'sk' ? les.module_title_sk : les.module_title;
  const levelBadge = model.levelBadge?.[lang] || '';
  const learningChunks = lang === 'sk' ? model.learningChunksSk : model.learningChunks;
  const realWorld = les.real_world;

  // Slide 1: Video (mascot + title)
  const videoProps = { title, moduleTitle, equipment: model.equipment, levelBadge, lang };
  const videoPath = path.join(OUT_DIR, `${prefix}_slide1.mp4`);
  console.log(`🎬 Rendering video slide (${lang}): "${title}"`);
  const videoComp = await getComposition(serveUrl, 'Slide1Video', videoProps);
  await renderMedia({
    composition: videoComp,
    serveUrl,
    codec: 'h264',
    outputLocation: videoPath,
    inputProps: videoProps,
  });
  files.push({ path: videoPath, type: 'video', slideIndex: 0 });

  // Slides 2-4: Learning content
  const hasRealWorld = !!realWorld;
  const totalSlides = 1 + learningChunks.length + (hasRealWorld ? 1 : 0) + 1; // video + learning + realworld + cta
  for (let i = 0; i < learningChunks.length; i++) {
    const slideProps = {
      content: learningChunks[i],
      slideNumber: i + 2,
      totalSlides,
      equipment: model.equipment,
      lang,
    };
    const imgPath = path.join(OUT_DIR, `${prefix}_slide${i + 2}.png`);
    console.log(`🖼️  Rendering learning slide ${i + 2} (${lang}): ${learningChunks[i].slice(0, 60)}...`);
    const learnComp = await getComposition(serveUrl, 'SlideLearn', slideProps);
    await renderStill({
      composition: learnComp,
      serveUrl,
      output: imgPath,
      inputProps: slideProps,
    });
    files.push({ path: imgPath, type: 'image', slideIndex: i + 1 });
  }

  // Slide 5: Real World / Why Care
  if (realWorld) {
    const rwProps = { content: realWorld.slice(0, 1500), equipment: model.equipment, lang };
    const rwPath = path.join(OUT_DIR, `${prefix}_slide_rw.png`);
    console.log(`🖼️  Rendering real-world slide (${lang})`);
    const rwComp = await getComposition(serveUrl, 'SlideRealWorld', rwProps);
    await renderStill({
      composition: rwComp,
      serveUrl,
      output: rwPath,
      inputProps: rwProps,
    });
    files.push({ path: rwPath, type: 'image', slideIndex: learningChunks.length + 1 });
  }

  // Slide 6: CTA
  const ctaProps = { lang, equipment: model.equipment };
  const ctaPath = path.join(OUT_DIR, `${prefix}_slide_cta.png`);
  console.log(`🖼️  Rendering CTA slide (${lang})`);
  const ctaComp = await getComposition(serveUrl, 'SlideCTA', ctaProps);
  await renderStill({
    composition: ctaComp,
    serveUrl,
    output: ctaPath,
    inputProps: ctaProps,
  });
  files.push({ path: ctaPath, type: 'image', slideIndex: files.length });

  console.log(`✅ Rendered ${files.length} slides for ${lang.toUpperCase()}`);
  return { files };
}
