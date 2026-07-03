import 'dotenv/config';
import { pickLesson, markPosted } from './pickLesson.js';
import { renderSlides } from './render.js';
import { uploadSlides } from './upload.js';
import { publishCarousel } from './instagram.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const lessonIdArg = args.findIndex(a => a === '--lesson-id');
const lessonId = lessonIdArg >= 0 ? parseInt(args[lessonIdArg + 1]) : undefined;

async function main() {
  console.log('🚀 Coduy Instagram Publisher');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (lessonId) console.log(`   Lesson ID: ${lessonId}`);
  console.log('');

  // 1. Pick lesson
  const model = await pickLesson(lessonId);
  if (!model) {
    console.log('❌ No lesson to post. Exiting.');
    process.exit(0);
  }

  // 2. Render slides for both languages
  console.log('\n=== Rendering EN slides ===');
  const enResult = await renderSlides(model, 'en');

  console.log('\n=== Rendering SK slides ===');
  const skResult = await renderSlides(model, 'sk');

  // 3. Upload to Supabase Storage
  console.log('\n=== Uploading to Supabase Storage ===');
  const enUploaded = await uploadSlides(model.lesson.id, enResult, 'en');
  const skUploaded = await uploadSlides(model.lesson.id, skResult, 'sk');

  // 4. Publish to Instagram (both accounts)
  const enToken = process.env.IG_PAGE_TOKEN_EN!;
  const skToken = process.env.IG_PAGE_TOKEN_SK!;
  const enUserId = process.env.IG_USER_ID_EN!;
  const skUserId = process.env.IG_USER_ID_SK!;

  console.log('\n=== Publishing to EN Instagram ===');
  const enMediaId = await publishCarousel(enUploaded, model.caption, enUserId, enToken, dryRun);

  console.log('\n=== Publishing to SK Instagram ===');
  const skMediaId = await publishCarousel(skUploaded, model.captionSk, skUserId, skToken, dryRun);

  // 5. Mark as posted
  if (!dryRun) {
    await markPosted(model.lesson.id, enMediaId, skMediaId);
  } else {
    console.log('\n🏁 DRY RUN complete — nothing was published to Instagram');
  }

  console.log('\n✅ DONE');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
