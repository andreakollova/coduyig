import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { pickQuiz, markQuizPosted } from './pickQuiz';
import { uploadSlides } from './upload';
import { publishCarousel } from './instagram';

const OUT_DIR = path.join(process.cwd(), 'out');
const W = 1080;
const H = 1440;
const FPS = 30;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function main() {
  console.log('🧠 Coduy Quiz Publisher');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const quiz = await pickQuiz();
  if (!quiz) { console.log('❌ No quiz to post.'); process.exit(0); }

  console.log('📦 Bundling Remotion...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  async function comp(id: string, props: Record<string, any>) {
    return selectComposition({ serveUrl, id, inputProps: props });
  }

  // Render for both languages
  for (const lang of ['en', 'sk'] as const) {
    const question = lang === 'sk' ? quiz.question_text_sk : quiz.question_text;
    const options = quiz.options.map(o => ({
      label: o.option_label,
      text: lang === 'sk' ? o.option_text_sk : o.option_text,
      isCorrect: o.is_correct,
    }));
    const explanation = lang === 'sk' ? quiz.explanation.sk : quiz.explanation.en;

    const baseProps = { question, options, codeSnippet: quiz.code_snippet, lang };

    // Slide 1: Question
    console.log(`🖼️ [${lang}] Question slide`);
    const q1 = await comp('SlideQuestion', baseProps);
    const p1 = path.join(OUT_DIR, `${lang}_quiz1.png`);
    await renderStill({ composition: q1, serveUrl, output: p1, inputProps: baseProps });

    // Slide 2: Answer
    console.log(`🖼️ [${lang}] Answer slide`);
    const q2 = await comp('SlideAnswer', { ...baseProps, showAnswer: true });
    const p2 = path.join(OUT_DIR, `${lang}_quiz2.png`);
    await renderStill({ composition: q2, serveUrl, output: p2, inputProps: { ...baseProps, showAnswer: true } });

    // Slide 3: Explanation
    console.log(`🖼️ [${lang}] Explanation slide`);
    const q3 = await comp('SlideExplanation', { ...baseProps, explanation });
    const p3 = path.join(OUT_DIR, `${lang}_quiz3.png`);
    await renderStill({ composition: q3, serveUrl, output: p3, inputProps: { ...baseProps, explanation } });

    // Slide 4: CTA
    console.log(`🖼️ [${lang}] CTA slide`);
    const q4 = await comp('SlideCTA', { lang, equipment: {} });
    const p4 = path.join(OUT_DIR, `${lang}_quiz4.png`);
    await renderStill({ composition: q4, serveUrl, output: p4, inputProps: { lang, equipment: {} } });

    console.log(`✅ ${lang.toUpperCase()} quiz slides rendered`);
  }

  // Upload
  console.log('\n=== Uploading ===');
  const enFiles = { files: [0, 1, 2, 3].map(i => ({ path: path.join(OUT_DIR, `en_quiz${i + 1}.png`), type: 'image' as const, slideIndex: i })) };
  const skFiles = { files: [0, 1, 2, 3].map(i => ({ path: path.join(OUT_DIR, `sk_quiz${i + 1}.png`), type: 'image' as const, slideIndex: i })) };

  const enUploaded = await uploadSlides(quiz.id, enFiles, 'en');
  const skUploaded = await uploadSlides(quiz.id, skFiles, 'sk');

  // Caption
  const captionEn = `CODUY Quiz #${quiz.postNumber} 🧠\n\n${quiz.question_text}\n\nDo you know the answer? Swipe to find out! →\n\n📲 Full lesson on Coduy app. Visit coduy.com or download free on the App Store and Google Play.\n\n#coding #programming #quiz #learntocode #coduy #tech #developer`;
  const captionSk = `CODUY Kvíz #${quiz.postNumber} 🧠\n\n${quiz.question_text_sk}\n\nVieš správnu odpoveď? Swipni a zisti! →\n\n📲 Celá lekcia na Coduy app. Navštív coduy.sk alebo sťahuj free na App Store a Google Play.\n\n#coding #programming #quiz #learntocode #coduy #tech #developer`;

  // Publish
  console.log('\n=== Publishing to EN ===');
  const enId = await publishCarousel(enUploaded, captionEn, process.env.IG_USER_ID_EN!, process.env.IG_PAGE_TOKEN_EN!, dryRun);
  console.log('\n=== Publishing to SK ===');
  const skId = await publishCarousel(skUploaded, captionSk, process.env.IG_USER_ID_SK!, process.env.IG_PAGE_TOKEN_SK!, dryRun);

  if (!dryRun) {
    await markQuizPosted(quiz.id);
  }

  console.log('\n✅ DONE');
}

main().catch(err => { console.error('💥 Fatal:', err); process.exit(1); });
