import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { pickGlossary } from './pickGlossary';
import { uploadSlides } from './upload';
import { publishCarousel } from './instagram';

const OUT_DIR = path.join(process.cwd(), 'out');
const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('📖 Coduy Glossary Publisher');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const entry = await pickGlossary();
  if (!entry) { console.log('❌ No glossary entry.'); process.exit(0); }

  console.log('📦 Bundling Remotion...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  async function comp(id: string, props: Record<string, any>) {
    return selectComposition({ serveUrl, id, inputProps: props });
  }

  for (const lang of ['en', 'sk'] as const) {
    const explanation = lang === 'sk' ? entry.explanation_sk : entry.explanation_en;
    const simpleExp = lang === 'sk' ? entry.simpleExplanation.sk : entry.simpleExplanation.en;

    // Slide 1: Term + definition + code — VIDEO (animated antenna)
    const s1Props = { term: entry.term, short: entry.short, category: entry.category, explanation, example: entry.example, antenna: entry.antenna, lang };
    console.log(`🎬 [${lang}] Term video: ${entry.term}`);
    const c1 = await comp('SlideGlossaryTerm', s1Props);
    const p1 = path.join(OUT_DIR, `${lang}_gloss1.mp4`);
    await renderMedia({ composition: c1, serveUrl, codec: 'h264', outputLocation: p1, inputProps: s1Props });

    // Slide 2: Simple explanation
    const s2Props = { term: entry.term, simpleExplanation: simpleExp, lang, equipment: entry.equipment };
    console.log(`🖼️ [${lang}] Simple explanation`);
    const c2 = await comp('SlideGlossarySimple', s2Props);
    const p2 = path.join(OUT_DIR, `${lang}_gloss2.png`);
    await renderStill({ composition: c2, serveUrl, output: p2, inputProps: s2Props });

    // Slide 3: CTA
    const s3Props = { lang, equipment: {} };
    console.log(`🖼️ [${lang}] CTA`);
    const c3 = await comp('SlideCTA', s3Props);
    const p3 = path.join(OUT_DIR, `${lang}_gloss3.png`);
    await renderStill({ composition: c3, serveUrl, output: p3, inputProps: s3Props });

    console.log(`✅ ${lang.toUpperCase()} glossary slides rendered`);
  }

  // Upload
  console.log('\n=== Uploading ===');
  const mkFiles = (lang: string) => ({
    files: [
      { path: path.join(OUT_DIR, `${lang}_gloss1.mp4`), type: 'video' as const, slideIndex: 0 },
      { path: path.join(OUT_DIR, `${lang}_gloss2.png`), type: 'image' as const, slideIndex: 1 },
      { path: path.join(OUT_DIR, `${lang}_gloss3.png`), type: 'image' as const, slideIndex: 2 },
    ],
  });
  const enUp = await uploadSlides(0, mkFiles('en'), 'en');
  const skUp = await uploadSlides(0, mkFiles('sk'), 'sk');

  // Captions
  const captionEn = `📖 ${entry.term} — ${entry.short}\n\n${entry.explanation_en}\n\n💡 ${entry.simpleExplanation.en}\n\n📲 Full glossary on Coduy app. Visit coduy.com or download free on the App Store and Google Play.\n\n#coding #programming #glossary #learntocode #coduy #tech #developer #${entry.term.toLowerCase().replace(/[^a-z]/g, '')}`;
  const captionSk = `📖 ${entry.term} — ${entry.short}\n\n${entry.explanation_sk}\n\n💡 ${entry.simpleExplanation.sk}\n\n📲 Celý slovník na Coduy app. Navštív coduy.sk alebo sťahuj free na App Store a Google Play.\n\n#coding #programming #glossary #learntocode #coduy #tech #developer #${entry.term.toLowerCase().replace(/[^a-z]/g, '')}`;

  // Publish
  console.log('\n=== Publishing to EN ===');
  await publishCarousel(enUp, captionEn, process.env.IG_USER_ID_EN!, process.env.IG_PAGE_TOKEN_EN!, dryRun);
  console.log('\n=== Publishing to SK ===');
  await publishCarousel(skUp, captionSk, process.env.IG_USER_ID_SK!, process.env.IG_PAGE_TOKEN_SK!, dryRun);

  console.log('\n✅ DONE');
}

main().catch(err => { console.error('💥 Fatal:', err); process.exit(1); });
