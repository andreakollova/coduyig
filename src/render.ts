import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill } from '@remotion/renderer';
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

export async function renderSlides(model: SlideModel, lang: 'en' | 'sk'): Promise<RenderResult> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const serveUrl = await getBundled();
  const prefix = lang;
  const files: RenderResult['files'] = [];

  const title = lang === 'sk' ? model.lesson.title_sk : model.lesson.title;
  const moduleTitle = lang === 'sk' ? model.lesson.module_title_sk : model.lesson.module_title;
  const learningChunks = lang === 'sk' ? model.learningChunksSk : model.learningChunks;
  const realWorld = lang === 'sk' ? model.lesson.real_world_sk : model.lesson.real_world;

  // Slide 1: Video (mascot + title)
  const videoPath = path.join(OUT_DIR, `${prefix}_slide1.mp4`);
  console.log(`🎬 Rendering video slide (${lang})...`);
  await renderMedia({
    composition: {
      id: 'Slide1Video',
      durationInFrames: VIDEO_DURATION * FPS,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {},
      defaultCodec: 'h264',
    },
    serveUrl,
    codec: 'h264',
    outputLocation: videoPath,
    inputProps: { title, moduleTitle, equipment: model.equipment },
  });
  files.push({ path: videoPath, type: 'video', slideIndex: 0 });

  // Slides 2-4: Learning content
  for (let i = 0; i < learningChunks.length; i++) {
    const imgPath = path.join(OUT_DIR, `${prefix}_slide${i + 2}.png`);
    console.log(`🖼️  Rendering learning slide ${i + 2} (${lang})...`);
    await renderStill({
      composition: {
        id: 'SlideLearn',
        durationInFrames: 1,
        fps: FPS,
        width: W,
        height: H,
        defaultProps: {},
        defaultCodec: 'h264',
      },
      serveUrl,
      output: imgPath,
      inputProps: {
        content: learningChunks[i],
        slideNumber: i + 2,
        totalSlides: learningChunks.length + 3, // learning + realworld + cta
        equipment: model.equipment,
      },
    });
    files.push({ path: imgPath, type: 'image', slideIndex: i + 1 });
  }

  // Slide 5: Real World / Why Care
  if (realWorld) {
    const rwPath = path.join(OUT_DIR, `${prefix}_slide_rw.png`);
    console.log(`🖼️  Rendering real-world slide (${lang})...`);
    await renderStill({
      composition: {
        id: 'SlideRealWorld',
        durationInFrames: 1,
        fps: FPS,
        width: W,
        height: H,
        defaultProps: {},
        defaultCodec: 'h264',
      },
      serveUrl,
      output: rwPath,
      inputProps: { content: realWorld.slice(0, 1500), equipment: model.equipment },
    });
    files.push({ path: rwPath, type: 'image', slideIndex: learningChunks.length + 1 });
  }

  // Slide 6: CTA
  const ctaPath = path.join(OUT_DIR, `${prefix}_slide_cta.png`);
  console.log(`🖼️  Rendering CTA slide (${lang})...`);
  await renderStill({
    composition: {
      id: 'SlideCTA',
      durationInFrames: 1,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {},
      defaultCodec: 'h264',
    },
    serveUrl,
    output: ctaPath,
    inputProps: { lang, equipment: model.equipment },
  });
  files.push({ path: ctaPath, type: 'image', slideIndex: files.length });

  console.log(`✅ Rendered ${files.length} slides for ${lang.toUpperCase()}`);
  return { files };
}
