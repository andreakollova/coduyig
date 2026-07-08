/**
 * ByteSurf publisher — fully automated "Behind the Scenes" explainer reels.
 * Picks random topic, generates script via GPT, TTS with two voices,
 * renders surfing animation, publishes to IG as Reel + Story.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import { generateBTSVoiceover } from './btsSurfTTS.js';
import { publishStory } from './instagram.js';
import { randomByteFallEquipment } from './byteFallTTS.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const OUT_DIR = path.join(process.cwd(), 'out');
const FPS = 30;
const API = 'https://graph.facebook.com/v25.0';

// === TOPICS ===
const TOPICS = [
  { id: 'chatgpt', questionEn: 'What happens when you send a prompt to ChatGPT?', questionSk: 'Čo sa stane keď pošleš prompt do ChatGPT?' },
  { id: 'google', questionEn: 'What happens when you type google.com?', questionSk: 'Čo sa stane keď napíšeš google.com?' },
  { id: 'signin-google', questionEn: 'What happens when you click Sign in with Google?', questionSk: 'Čo sa stane keď klikneš Prihlásiť sa cez Google?' },
  { id: 'not-robot', questionEn: 'What happens when you click I am not a robot?', questionSk: 'Čo sa stane keď klikneš Nie som robot?' },
  { id: 'card-tap', questionEn: 'What happens when you tap your credit card?', questionSk: 'Čo sa stane keď priložíš kartu?' },
  { id: 'face-id', questionEn: 'What happens when Face ID recognizes you?', questionSk: 'Čo sa stane keď ťa Face ID rozpozná?' },
  { id: 'qr-code', questionEn: 'What happens when you scan a QR code?', questionSk: 'Čo sa stane keď naskenuješ QR kód?' },
  { id: 'whatsapp', questionEn: 'What happens when you send a WhatsApp message?', questionSk: 'Čo sa stane keď pošleš správu cez WhatsApp?' },
  { id: 'install-app', questionEn: 'What happens when you install an app?', questionSk: 'Čo sa stane keď si nainštaluješ aplikáciu?' },
  { id: 'wifi', questionEn: 'What happens when you connect to Wi-Fi?', questionSk: 'Čo sa stane keď sa pripojíš na Wi-Fi?' },
  { id: 'usb', questionEn: 'What happens when you plug in a USB drive?', questionSk: 'Čo sa stane keď zapojíš USB kľúč?' },
  { id: 'save', questionEn: 'What happens when you press Save?', questionSk: 'Čo sa stane keď stlačíš Uložiť?' },
  { id: 'download', questionEn: 'What happens when you click Download?', questionSk: 'Čo sa stane keď klikneš Stiahnuť?' },
  { id: 'pay-now', questionEn: 'What happens when you click Pay Now?', questionSk: 'Čo sa stane keď klikneš Zaplatiť?' },
  { id: 'git-push', questionEn: 'What happens when you push code to GitHub?', questionSk: 'Čo sa stane keď pushneš kód na GitHub?' },
  { id: 'youtube', questionEn: 'What happens when you open a YouTube video?', questionSk: 'Čo sa stane keď otvoríš YouTube video?' },
  { id: 'notification', questionEn: 'What happens when your phone receives a notification?', questionSk: 'Čo sa stane keď telefón dostane notifikáciu?' },
  { id: 'location', questionEn: 'What happens when your phone knows your location?', questionSk: 'Čo sa stane keď telefón vie tvoju polohu?' },
  { id: 'ai-image', questionEn: 'What happens when you ask AI to generate an image?', questionSk: 'Čo sa stane keď požiadaš AI o vygenerovanie obrázka?' },
  { id: 'forgot-password', questionEn: 'What happens when you click Forgot Password?', questionSk: 'Čo sa stane keď klikneš Zabudnuté heslo?' },
];

// === TRACKING ===
async function getPostedIds(): Promise<string[]> {
  try {
    const { data } = await sb.storage.from('ig-media').download('tracking/bytesurf_posted.json');
    if (data) return JSON.parse(await data.text());
  } catch {}
  return [];
}

async function markPosted(id: string) {
  const posted = await getPostedIds();
  posted.push(id);
  await sb.storage.from('ig-media').upload('tracking/bytesurf_posted.json', Buffer.from(JSON.stringify(posted)), { contentType: 'application/json', upsert: true });
}

// === GENERATE SCRIPT VIA GPT ===
async function generateScript(question: string, lang: 'sk' | 'en'): Promise<string> {
  const prompt = lang === 'sk'
    ? `Napíš vysvetlenie pre krátke video (30-40 sekúnd hovorenia) na tému: "${question}"

Pravidlá:
- Píš ako keby si to vysvetľoval kamarátovi, nie ako učebnica
- Plynulé dlhé vety spojené čiarkami, nie krátke bodka za bodkou
- Vysvetli krok za krokom čo sa deje, aby tomu rozumel aj úplný laik
- Použi "ty" formu — "napíšeš", "vidíš", "tvoj telefón"
- Použi prirovnania k bežnému životu ak to pomôže
- Nesmie tam byť žiadna skratka bez vysvetlenia
- Na konci spomeň niečo prekvapivé alebo zaujímavé
- Max 100 slov
- Slovenčina (NIKDY čeština)
- Vrať LEN text vysvetlenia, nič iné`
    : `Write an explanation for a short video (30-40 seconds spoken) on the topic: "${question}"

Rules:
- Write like you are explaining to a friend, not a textbook
- Flowing long sentences connected with commas, not short choppy ones
- Explain step by step what happens so a complete beginner understands
- Use "you" form — "you type", "you see", "your phone"
- Use real-life comparisons if they help
- No abbreviation without explanation
- Mention something surprising or interesting at the end
- Max 100 words
- Return ONLY the explanation text, nothing else`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o', temperature: 0.4, max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// === IG HELPERS ===
async function igPost(url: string, params: Record<string, string>) {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) });
  const data = await res.json();
  if ((data as any).error) throw new Error((data as any).error.message);
  return data as { id: string };
}

async function waitForContainer(id: string, token: string) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${API}/${id}?fields=status_code&access_token=${token}`);
    const d: any = await res.json();
    if (d.status_code === 'FINISHED') return;
    if (d.status_code === 'ERROR') throw new Error('Container error');
    console.log(`  ⏳ ${d.status_code} (${i + 1})`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Container timeout');
}

// === MAIN ===
async function main() {
  console.log('🏄 ByteSurf Publisher\n');

  // Pick random unposted topic
  const postedIds = await getPostedIds();
  let available = TOPICS.filter(t => !postedIds.includes(t.id));
  if (available.length === 0) {
    console.log('🔄 All topics posted — resetting cycle');
    await sb.storage.from('ig-media').remove(['tracking/bytesurf_posted.json']);
    available = TOPICS;
  }

  const topic = available[Math.floor(Math.random() * available.length)];
  console.log(`📖 Topic: ${topic.questionEn} [${available.length} remaining]\n`);

  // Bundle Remotion
  console.log('📦 Bundling Remotion...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Blue surf equipment
  const equipment = { hat: 'hat-ice-crown', glasses: 'glasses-frost' };

  for (const lang of ['sk', 'en'] as const) {
    const question = lang === 'sk' ? topic.questionSk : topic.questionEn;

    // Generate script via GPT
    console.log(`\n✍️ [${lang}] Generating script...`);
    const script = await generateScript(question, lang);
    console.log(`  Script: "${script.slice(0, 80)}..."`);

    // Generate TTS with two voices
    const ttsDir = path.join(OUT_DIR, `bytesurf_tts_${lang}`);
    const { audioPath, words, duration, questionerStart, questionerEnd } = await generateBTSVoiceover(
      question, script, ttsDir, lang
    );

    // Copy audio to bundle
    const audioFileName = `bytesurf_voice_${lang}.mp3`;
    const publicDir = path.join(serveUrl, 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    fs.copyFileSync(audioPath, path.join(publicDir, audioFileName));

    // Also copy sea.wav to bundle
    const seaSrc = path.join(process.cwd(), 'public', 'sea.wav');
    if (fs.existsSync(seaSrc)) {
      fs.copyFileSync(seaSrc, path.join(publicDir, 'sea.wav'));
    }

    // Render
    const lastWordEnd = words.length > 0 ? words[words.length - 1].end : duration;
    const durationFrames = Math.ceil((lastWordEnd + 0.3) * FPS);
    const props = {
      equipment, durationInFrames: durationFrames, question,
      audioUrl: audioFileName, words,
      questionerStart, questionerEnd,
    };

    console.log(`🎬 [${lang}] Rendering (${durationFrames} frames, ${(durationFrames / FPS).toFixed(1)}s)...`);
    const composition = await selectComposition({ serveUrl, id: 'ByteSurf', inputProps: props });
    const outPath = path.join(OUT_DIR, `bytesurf_${lang}.mp4`);
    await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: outPath, inputProps: props });

    // Upload
    const storagePath = `bytesurf/${lang}_${topic.id}_${Date.now()}.mp4`;
    await sb.storage.from('ig-media').upload(storagePath, fs.readFileSync(outPath), { contentType: 'video/mp4', upsert: true });
    const { data: urlData } = sb.storage.from('ig-media').getPublicUrl(storagePath);
    const videoUrl = urlData.publicUrl;
    console.log(`📤 Uploaded: ${videoUrl}`);

    // Publish Reel
    const token = lang === 'sk' ? process.env.IG_PAGE_TOKEN_SK! : process.env.IG_PAGE_TOKEN_EN!;
    const userId = lang === 'sk' ? process.env.IG_USER_ID_SK! : process.env.IG_USER_ID_EN!;
    const caption = lang === 'sk'
      ? `🏄 People often ask me...\n\n\n\n${question}\n\n📲 coduy.sk\n\n#coding #programming #tech #coduy #learntocode #developer`
      : `🏄 People often ask me...\n\n\n\n${question}\n\n📲 coduy.com\n\n#coding #programming #tech #coduy #learntocode #developer`;

    console.log(`📱 [${lang}] Publishing Reel...`);
    const container = await igPost(`${API}/${userId}/media`, {
      media_type: 'REELS', video_url: videoUrl, caption, access_token: token,
    });
    await waitForContainer(container.id, token);
    const published = await igPost(`${API}/${userId}/media_publish`, {
      creation_id: container.id, access_token: token,
    });
    console.log(`🎉 [${lang}] Reel: ${published.id}`);

    // Story
    console.log(`📖 [${lang}] Publishing Story...`);
    try {
      await publishStory({ url: videoUrl, type: 'video' }, userId, token, false);
    } catch (err) {
      console.error(`⚠️ [${lang}] Story failed:`, err);
    }
  }

  await markPosted(topic.id);
  console.log(`\n✅ DONE — ${topic.id} posted!`);
}

main().catch(err => { console.error('💥', err); process.exit(1); });
