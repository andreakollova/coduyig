/**
 * Coduy Instagram Reels Publisher — Conversational format
 * Two Bytes talking: Student asks, Teacher explains
 */
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import { generateReelScript } from './reelScript';
import { generateConversationTTS } from './elevenlabs';
import type { ReelLineData, WordTiming } from '../remotion/reelComposition';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OUT_DIR = path.join(process.cwd(), 'out');
const BUCKET = 'ig-media';
const API = 'https://graph.facebook.com/v25.0';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const lessonIdArg = args.findIndex(a => a === '--lesson-id');
const lessonId = lessonIdArg >= 0 ? parseInt(args[lessonIdArg + 1]) : undefined;
const codeArg = args.findIndex(a => a === '--code');
const customCode = codeArg >= 0 ? args[codeArg + 1] : undefined;
const langArg = args.findIndex(a => a === '--lang');
const lang: 'en' | 'sk' = (langArg >= 0 && args[langArg + 1] === 'sk') ? 'sk' : 'en';

/* ========== EQUIPMENT ========== */

type DiffLevel = 'beginner' | 'advanced' | 'professional';
function getLevel(mn: number): DiffLevel {
  if (mn >= 18) return 'professional';
  if (mn >= 9) return 'advanced';
  return 'beginner';
}

// Student = basic look (white Byte)
const studentEquip: Record<string, string> = {};

// Teacher = equipped based on difficulty
const teacherEquipByLevel: Record<DiffLevel, Record<string, string>> = {
  beginner: { hat: 'hat-beanie', glasses: 'glasses-round' },
  advanced: { hat: 'hat-graduation', glasses: 'glasses-cool', accessory: 'acc-medal' },
  professional: { hat: 'hat-golden-crown', glasses: 'glasses-golden', aura: 'aura-golden', antenna: 'ant-golden-star' },
};

/* ========== INTRO GREETINGS ========== */

const INTRO_GREETINGS_EN = [
  { introStudent: 'Got a minute?', introTeacher: 'Always.' },
  { introStudent: 'Can you help me?', introTeacher: 'Of course.' },
  { introStudent: 'Quick question.', introTeacher: 'Go ahead.' },
  { introStudent: 'Where do I start?', introTeacher: 'Right here.' },
  { introStudent: 'Lots of questions.', introTeacher: "Let's start simple." },
  { introStudent: 'Sounds perfect.', introTeacher: 'Got questions?' },
  { introStudent: 'Teach me something!', introTeacher: "You'll love this." },
  { introStudent: 'Ready to learn!', introTeacher: "Let's go." },
  { introStudent: 'I need help.', introTeacher: "I got you." },
  { introStudent: "What's today's topic?", introTeacher: 'A good one.' },
];

const INTRO_GREETINGS_SK = [
  { introStudent: 'Máš chvíľku?', introTeacher: 'Jasné.' },
  { introStudent: 'Môžem sa opýtať?', introTeacher: 'Samozrejme.' },
  { introStudent: 'Mám otázku.', introTeacher: 'Pýtaj sa.' },
  { introStudent: 'Pomôžeš mi?', introTeacher: 'Vždy.' },
  { introStudent: 'Vysvetlíš mi to?', introTeacher: 'Jasné.' },
  { introStudent: 'Som pripravený.', introTeacher: 'Poďme.' },
  { introStudent: 'Čau!', introTeacher: 'Ahoj!' },
];

function pickIntroGreeting(lang: 'en' | 'sk') {
  const pool = lang === 'sk' ? INTRO_GREETINGS_SK : INTRO_GREETINGS_EN;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  console.log(`💬 Intro: Student: "${pick.introStudent}" | Teacher: "${pick.introTeacher}"`);
  return pick;
}

/* ========== IG API ========== */

async function igPost(url: string, params: Record<string, string>) {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) });
  const data = await res.json();
  if (data.error) throw new Error(`IG: ${data.error.message}`);
  return data;
}

async function waitForContainer(id: string, token: string, max = 60) {
  for (let i = 0; i < max; i++) {
    const res = await fetch(`${API}/${id}?fields=status_code&access_token=${token}`);
    const s = await res.json();
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Container: ${s.status_code}`);
    console.log(`  ⏳ ${s.status_code || 'processing'} (${i + 1}/${max})`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Container timed out');
}

/* ========== MAIN ========== */

async function main() {
  console.log('🎬 Coduy Conversational Reels Publisher');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Lang: ${lang.toUpperCase()}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Fetch lesson
  const skFields = lang === 'sk' ? ', title_sk, introduction_sk, learning_content_sk, key_takeaways_sk' : '';
  let query = sb.from('cb_lessons')
    .select(`id, title, introduction, learning_content, key_takeaways, module_id, lesson_number${skFields}`);

  if (lessonId) {
    query = query.eq('id', lessonId);
  } else {
    query = query.ilike('learning_content', '%def %').limit(50);
  }

  const { data: lessons, error } = await query;
  if (error || !lessons?.length) { console.log('❌ No lesson found'); process.exit(0); }
  const lesson = lessonId ? lessons[0] : lessons[Math.floor(Math.random() * lessons.length)];

  const { data: mod } = await sb.from('cb_modules').select('module_number, title, title_sk').eq('id', lesson.module_id).single();
  const moduleNumber = mod?.module_number || 1;
  const level = getLevel(moduleNumber);
  const equipTeacher = teacherEquipByLevel[level];

  // Pick correct language fields
  const lessonTitle = (lang === 'sk' && lesson.title_sk) ? lesson.title_sk : lesson.title;
  const lessonIntro = (lang === 'sk' && lesson.introduction_sk) ? lesson.introduction_sk : (lesson.introduction || '');
  const lessonContent = (lang === 'sk' && lesson.learning_content_sk) ? lesson.learning_content_sk : (lesson.learning_content || '');
  const lessonTakeaways = (lang === 'sk' && lesson.key_takeaways_sk) ? lesson.key_takeaways_sk : (lesson.key_takeaways || []);

  console.log(`📖 Lesson: ${lessonTitle} (id=${lesson.id}, M${moduleNumber}, ${level}, ${lang.toUpperCase()})`);

  // 2. Generate conversation script
  console.log('\n=== Generating script ===');
  const script = await generateReelScript(
    lessonTitle,
    lessonIntro,
    lessonContent,
    lessonTakeaways,
    lang,
  );
  // Override code if --code was provided
  if (customCode) {
    // Remove GPT's code, put custom code on the first teacher line
    for (const line of script.lines) line.code = undefined;
    const teacherLine = script.lines.find(l => l.speaker === 'teacher' && l.spoken);
    if (teacherLine) teacherLine.code = customCode;
    console.log(`📋 Custom code: ${customCode.slice(0, 50)}...`);
  }

  for (const line of script.lines) {
    console.log(`   [${line.speaker}]: "${line.spoken}" ${line.code ? '+ code' : ''}`);
  }

  // 3. Generate TTS for each line (two voices)
  console.log('\n=== Generating voiceover ===');
  const tts = await generateConversationTTS(
    script.lines.map(l => ({ speaker: l.speaker, spoken: l.spoken })),
    OUT_DIR,
    lang,
  );

  // 4. Upload audio files to Supabase
  console.log('\n=== Uploading audio ===');
  const timestamp = Date.now();
  const reelLines: ReelLineData[] = [];

  for (let i = 0; i < tts.lines.length; i++) {
    const tl = tts.lines[i];
    const sl = script.lines[i];

    // Skip silent lines (no audio)
    if (!tl.audioPath || tl.durationSeconds === 0) {
      console.log(`  Line ${i + 1}: (silent, skipped)`);
      continue;
    }

    // Upload audio
    const audioBytes = fs.readFileSync(tl.audioPath);
    const remotePath = `reels/${lesson.id}/${timestamp}/line_${i}.mp3`;
    await sb.storage.from(BUCKET).upload(remotePath, audioBytes, { contentType: 'audio/mpeg', upsert: true });
    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(remotePath);

    reelLines.push({
      speaker: tl.speaker,
      audioUrl: urlData.publicUrl,
      words: tl.wordTimings.map(w => ({ ...w, speaker: tl.speaker })),
      startTime: tl.wordTimings.length > 0 ? tl.wordTimings[0].start : 0,
      duration: tl.durationSeconds,
      code: sl.code,
    });
  }

  // 5. Render video
  console.log('\n=== Rendering video ===');
  const FPS = 30;
  const TITLE_S = 2;
  const CTA_S = 3;
  const durationInFrames = Math.ceil((tts.totalDuration + TITLE_S + CTA_S) * FPS) + 15;

  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });

  const reelProps = {
    lines: reelLines,
    equipmentStudent: studentEquip,
    equipmentTeacher: equipTeacher,
    durationInFrames,
    lessonTitle: lessonTitle,
    lessonNumber: lesson.lesson_number,
    moduleTitle: (lang === 'sk' && mod?.title_sk) ? mod.title_sk : mod?.title,
    lang,
    ...pickIntroGreeting(lang),
  };

  const comp = await selectComposition({ serveUrl, id: 'LessonReel', inputProps: reelProps });
  const videoPath = path.join(OUT_DIR, 'reel.mp4');
  await renderMedia({ composition: comp, serveUrl, codec: 'h264', outputLocation: videoPath, inputProps: reelProps });
  console.log(`🎬 Video rendered: ${videoPath} (${(durationInFrames / FPS).toFixed(1)}s)`);

  // 6. Upload video
  console.log('\n=== Uploading video ===');
  const videoBytes = fs.readFileSync(videoPath);
  const videoRemotePath = `reels/${lesson.id}/${timestamp}/reel.mp4`;
  await sb.storage.from(BUCKET).upload(videoRemotePath, videoBytes, { contentType: 'video/mp4', upsert: true });
  const { data: videoUrlData } = sb.storage.from(BUCKET).getPublicUrl(videoRemotePath);
  const videoUrl = videoUrlData.publicUrl;

  const caption = lang === 'sk'
    ? `CODUY Lekcia — ${lessonTitle}\n\nViac lekcií a cvičení nájdeš v aplikácii CODUY.\n📲 coduy.sk | Zadarmo na App Store a Google Play\n\n#coding #programming #learntocode #coduy #developer #tech #python #reels`
    : `CODUY Lesson — ${lessonTitle}\n\nFor more lessons and exercises download the CODUY app.\n📲 coduy.com | Free on App Store & Google Play\n\n#coding #programming #learntocode #coduy #developer #tech #python #reels`;

  if (dryRun) {
    console.log(`\n🏁 DRY RUN — video at ${videoPath}`);
    return;
  }

  // 7. Publish Reel
  console.log('\n=== Publishing Reel ===');
  const token = lang === 'sk' ? process.env.IG_PAGE_TOKEN_SK! : process.env.IG_PAGE_TOKEN_EN!;
  const userId = lang === 'sk' ? process.env.IG_USER_ID_SK! : process.env.IG_USER_ID_EN!;

  const container = await igPost(`${API}/${userId}/media`, {
    media_type: 'REELS', video_url: videoUrl, caption, access_token: token,
  });
  await waitForContainer(container.id, token);
  const published = await igPost(`${API}/${userId}/media_publish`, { creation_id: container.id, access_token: token });
  console.log(`🎉 Reel published! Media ID: ${published.id}`);

  // Cleanup
  const cleanupPaths = [`reels/${lesson.id}/${timestamp}`];
  // Don't cleanup yet — let it stay for debugging

  console.log('\n✅ DONE');
}

main().catch(err => { console.error('💥 Fatal:', err); process.exit(1); });
