import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { pickCodeChallenge } from './pickCodeChallenge';
import { uploadSlides } from './upload';
import { publishCarousel } from './instagram';

const OUT_DIR = path.join(process.cwd(), 'out');
const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('💻 Coduy Code Challenge Publisher');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const challenge = await pickCodeChallenge();
  if (!challenge) { console.log('❌ No challenge.'); process.exit(0); }

  console.log('📦 Bundling Remotion...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  async function comp(id: string, props: Record<string, any>) {
    return selectComposition({ serveUrl, id, inputProps: props });
  }

  for (const lang of ['en', 'sk'] as const) {
    const prompt = lang === 'sk' ? challenge.prompt_sk : challenge.prompt_en;

    // Slide 1: Question — VIDEO
    const s1Props = { prompt, codeSnippet: challenge.codeSnippet, options: challenge.options, equipment: challenge.equipment, lang };
    console.log(`🎬 [${lang}] Code question video`);
    const c1 = await comp('SlideCodeQuestion', s1Props);
    const p1 = path.join(OUT_DIR, `${lang}_code1.mp4`);
    await renderMedia({ composition: c1, serveUrl, codec: 'h264', outputLocation: p1, inputProps: s1Props });

    // Slide 2: Answer — VIDEO
    const s2Props = { prompt, codeAnswer: challenge.codeAnswer, correct: challenge.correct, options: challenge.options, equipment: challenge.equipment, lang };
    console.log(`🎬 [${lang}] Code answer video`);
    const c2 = await comp('SlideCodeAnswer', s2Props);
    const p2 = path.join(OUT_DIR, `${lang}_code2.mp4`);
    await renderMedia({ composition: c2, serveUrl, codec: 'h264', outputLocation: p2, inputProps: s2Props });

    // Slide 3: Explanation
    const explanation = lang === 'sk' ? challenge.explanation.sk : challenge.explanation.en;
    const s3Props = { prompt, correct: challenge.correct, explanation, lang };
    console.log(`🖼️ [${lang}] Explanation`);
    const c3 = await comp('SlideCodeExplanation', s3Props);
    const p3 = path.join(OUT_DIR, `${lang}_code3.png`);
    await renderStill({ composition: c3, serveUrl, output: p3, inputProps: s3Props });

    // Slide 4: CTA
    const s4Props = { lang, equipment: {} };
    console.log(`🖼️ [${lang}] CTA`);
    const c4 = await comp('SlideCTA', s4Props);
    const p4 = path.join(OUT_DIR, `${lang}_code4.png`);
    await renderStill({ composition: c4, serveUrl, output: p4, inputProps: s4Props });

    console.log(`✅ ${lang.toUpperCase()} code challenge slides rendered`);
  }

  // Upload
  console.log('\n=== Uploading ===');
  const mkFiles = (lang: string) => ({
    files: [
      { path: path.join(OUT_DIR, `${lang}_code1.mp4`), type: 'video' as const, slideIndex: 0 },
      { path: path.join(OUT_DIR, `${lang}_code2.mp4`), type: 'video' as const, slideIndex: 1 },
      { path: path.join(OUT_DIR, `${lang}_code3.png`), type: 'image' as const, slideIndex: 2 },
      { path: path.join(OUT_DIR, `${lang}_code4.png`), type: 'image' as const, slideIndex: 3 },
    ],
  });
  const enUp = await uploadSlides(0, mkFiles('en'), 'en');
  const skUp = await uploadSlides(0, mkFiles('sk'), 'sk');

  // Captions
  const captionEn = `CODUY Code Challenge #${challenge.postNumber} 💻\n\n${challenge.prompt_en}\n\nCan you fill in the blank? Swipe to see the answer! →\n\n📲 Practice coding on Coduy app. Visit coduy.com or download free on the App Store and Google Play.\n\n#coding #programming #codechallenge #python #learntocode #coduy #developer`;
  const captionSk = `CODUY Doplň kód #${challenge.postNumber} 💻\n\n${challenge.prompt_sk}\n\nVieš čo tam patrí? Swipni a zisti! →\n\n📲 Precvič si kód na Coduy app. Navštív coduy.sk alebo sťahuj free na App Store a Google Play.\n\n#coding #programming #codechallenge #python #learntocode #coduy #developer`;

  // Publish
  console.log('\n=== Publishing to EN ===');
  await publishCarousel(enUp, captionEn, process.env.IG_USER_ID_EN!, process.env.IG_PAGE_TOKEN_EN!, dryRun);
  console.log('\n=== Publishing to SK ===');
  await publishCarousel(skUp, captionSk, process.env.IG_USER_ID_SK!, process.env.IG_PAGE_TOKEN_SK!, dryRun);

  console.log('\n✅ DONE');
}

main().catch(err => { console.error('💥 Fatal:', err); process.exit(1); });
