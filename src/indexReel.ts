/**
 * Coduy Instagram Reels Publisher
 * lesson → script → TTS → render → upload → publish as Reel
 */
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import { generateReelScript, type ReelScript } from './reelScript';
import { generateTTS, type WordTiming } from './elevenlabs';
import type { ReelSection } from '../remotion/reelComposition';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const OUT_DIR = path.join(process.cwd(), 'out');
const BUCKET = 'ig-media';
const API = 'https://graph.facebook.com/v25.0';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const lessonIdArg = args.findIndex(a => a === '--lesson-id');
const lessonId = lessonIdArg >= 0 ? parseInt(args[lessonIdArg + 1]) : undefined;

/* ========== DIFFICULTY / EQUIPMENT (reuse from pickLesson logic) ========== */

type DiffLevel = 'beginner' | 'advanced' | 'professional';
function getLevel(moduleNumber: number): DiffLevel {
  if (moduleNumber >= 18) return 'professional';
  if (moduleNumber >= 9) return 'advanced';
  return 'beginner';
}

const beginnerEquip: Record<string, string>[] = [
  { hat: 'hat-beanie' }, { glasses: 'glasses-round' }, { hat: 'hat-headband' }, {},
];
const advancedEquip: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool', accessory: 'acc-medal' },
  { hat: 'hat-cowboy', glasses: 'glasses-aviator', antenna: 'ant-lightning' },
];
const professionalEquip: Record<string, string>[] = [
  { hat: 'hat-golden-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold', aura: 'aura-golden', antenna: 'ant-golden-star' },
  { hat: 'hat-galaxy', glasses: 'glasses-laser', accessory: 'acc-diamond', aura: 'aura-galaxy', antenna: 'ant-sun' },
];

function pickEquipment(moduleNumber: number, lessonId: number): Record<string, string> {
  const level = getLevel(moduleNumber);
  const pool = level === 'professional' ? professionalEquip : level === 'advanced' ? advancedEquip : beginnerEquip;
  return pool[lessonId % pool.length];
}

/* ========== IG API HELPERS ========== */

async function igPost(url: string, params: Record<string, string>) {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) });
  const data = await res.json();
  if (data.error) throw new Error(`IG: ${data.error.message}`);
  return data;
}

async function waitForContainer(containerId: string, token: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${API}/${containerId}?fields=status_code&access_token=${token}`);
    const status = await res.json();
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      throw new Error(`Container ${containerId}: ${status.status_code}`);
    }
    console.log(`  ⏳ Reel container: ${status.status_code || 'processing'} (${i + 1}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, 5000)); // 5s between polls
  }
  throw new Error('Reel container timed out');
}

/* ========== MAIN ========== */

async function main() {
  console.log('🎬 Coduy Instagram Reels Publisher');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (lessonId) console.log(`   Lesson ID: ${lessonId}`);
  console.log('');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Fetch lesson
  let query = sb.from('cb_lessons')
    .select('id, title, learning_content, key_takeaways, module_id, lesson_number');

  if (lessonId) {
    query = query.eq('id', lessonId);
  } else {
    // Pick a random lesson that has learning_content with code
    query = query.ilike('learning_content', '%def %').limit(50);
  }

  const { data: lessons, error } = await query;
  if (error || !lessons || lessons.length === 0) {
    console.log('❌ No lesson found'); process.exit(0);
  }

  // Pick random if no specific ID
  const lesson = lessonId ? lessons[0] : lessons[Math.floor(Math.random() * lessons.length)];

  // Get module info
  const { data: mod } = await sb.from('cb_modules').select('module_number, title').eq('id', lesson.module_id).single();
  const moduleNumber = mod?.module_number || 1;
  const equipment = pickEquipment(moduleNumber, lesson.id);

  console.log(`📖 Lesson: ${lesson.title} (id=${lesson.id}, M${moduleNumber})`);

  // 2. Generate script
  console.log('\n=== Generating script ===');
  const script = await generateReelScript(
    lesson.title,
    lesson.learning_content || '',
    lesson.key_takeaways || [],
  );
  console.log(`📝 Sections: ${script.sections.map(s => s.label).join(' → ')}`);
  for (const s of script.sections) {
    console.log(`   ${s.label}: "${s.spoken}" ${s.code ? '+ code' : ''}`);
  }

  // 3. Generate TTS with timestamps
  console.log('\n=== Generating voiceover ===');
  const tts = await generateTTS(script.spokenText, OUT_DIR);
  console.log(`🎙️ Duration: ${tts.durationSeconds.toFixed(1)}s`);

  if (tts.durationSeconds > 16) {
    console.warn('⚠️ Audio longer than 15s — video may exceed limit');
  }

  // 4. Map word timings to sections
  console.log('\n=== Mapping timestamps to sections ===');
  const sections = mapTimingsToSections(script, tts.wordTimings);

  // 5. Upload audio to Supabase for public URL
  console.log('\n=== Uploading audio ===');
  const audioBytes = fs.readFileSync(tts.audioPath);
  const audioRemotePath = `reels/${lesson.id}/${Date.now()}/voiceover.mp3`;
  await sb.storage.from(BUCKET).upload(audioRemotePath, audioBytes, { contentType: 'audio/mpeg', upsert: true });
  const { data: audioUrlData } = sb.storage.from(BUCKET).getPublicUrl(audioRemotePath);
  const audioUrl = audioUrlData.publicUrl;
  console.log(`📤 Audio URL: ${audioUrl}`);

  // BG music URL (static file in public/)
  // We'll use a staticFile reference in Remotion instead
  const bgMusicUrl = undefined; // handled via staticFile in composition

  // 6. Render video
  console.log('\n=== Rendering video ===');
  const durationInFrames = Math.ceil(tts.durationSeconds * 30) + 15; // + 0.5s padding

  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });

  const reelProps = { sections, audioUrl, bgMusicUrl, equipment, durationInFrames };
  const comp = await selectComposition({ serveUrl, id: 'LessonReel', inputProps: reelProps });

  const videoPath = path.join(OUT_DIR, 'reel.mp4');
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: 'h264',
    outputLocation: videoPath,
    inputProps: reelProps,
  });
  console.log(`🎬 Video rendered: ${videoPath}`);

  // 7. Upload video to Supabase
  console.log('\n=== Uploading video ===');
  const videoBytes = fs.readFileSync(videoPath);
  const videoRemotePath = `reels/${lesson.id}/${Date.now()}/reel.mp4`;
  await sb.storage.from(BUCKET).upload(videoRemotePath, videoBytes, { contentType: 'video/mp4', upsert: true });
  const { data: videoUrlData } = sb.storage.from(BUCKET).getPublicUrl(videoRemotePath);
  const videoUrl = videoUrlData.publicUrl;
  console.log(`📤 Video URL: ${videoUrl}`);

  // 8. Publish to Instagram as Reel
  const token = process.env.IG_PAGE_TOKEN_EN!;
  const userId = process.env.IG_USER_ID_EN!;

  const caption = `CODUY Lesson — ${lesson.title}\n\nFor more lessons and exercises download the CODUY app.\n📲 coduy.com | Free on App Store & Google Play\n\n#coding #programming #learntocode #coduy #developer #tech #python #reels`;

  if (dryRun) {
    console.log('\n🏁 DRY RUN — video rendered but not published');
    console.log(`   Video: ${videoPath}`);
    console.log(`   Caption: ${caption.slice(0, 80)}...`);
    return;
  }

  console.log('\n=== Publishing Reel to Instagram ===');

  // Create reel container
  const container = await igPost(`${API}/${userId}/media`, {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    access_token: token,
  });
  console.log(`📦 Reel container: ${container.id}`);

  // Wait for processing (reels take longer)
  await waitForContainer(container.id, token);

  // Publish
  const published = await igPost(`${API}/${userId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  console.log(`🎉 Reel published! Media ID: ${published.id}`);

  // Clean up storage
  await sb.storage.from(BUCKET).remove([audioRemotePath, videoRemotePath]);
  console.log('🗑️ Storage cleaned up');

  console.log('\n✅ DONE');
}

/**
 * Map word timings back to script sections.
 * Each section knows which words belong to it based on the spoken text.
 */
function mapTimingsToSections(script: ReelScript, wordTimings: WordTiming[]): ReelSection[] {
  let wordIdx = 0;

  return script.sections.map(section => {
    const sectionWordCount = section.spoken.split(/\s+/).filter(w => w).length;
    const sectionWords = wordTimings.slice(wordIdx, wordIdx + sectionWordCount);
    wordIdx += sectionWordCount;

    return {
      label: section.label,
      words: sectionWords,
      code: section.code,
    };
  });
}

main().catch(err => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
