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
  { id: 'qr-corners', questionEn: 'Why do QR codes have big squares in the corners?', questionSk: 'Prečo sú v rohoch QR kódu veľké štvorce?' },
  { id: 'airplane-mode', questionEn: 'How does Airplane mode work on your phone?', questionSk: 'Ako funguje režim Lietadlo na mojom mobile?' },
  { id: 'zip', questionEn: 'How does ZIP file compression work?', questionSk: 'Ako funguje kompresia ZIP súborov?' },
  { id: 'keyboard', questionEn: 'How does a keyboard know which key you pressed?', questionSk: 'Ako klávesnica vie, ktoré tlačidlo si stlačil?' },
  { id: 'delete-file', questionEn: 'What happens when you delete a file from disk?', questionSk: 'Čo sa deje, keď vymažeš súbor z disku?' },
  { id: 'drag-drop', questionEn: 'What happens during drag and drop between apps?', questionSk: 'Čo sa deje pri drag and drop medzi aplikáciami?' },
  { id: 'clipboard', questionEn: 'How does clipboard work when copying text and files?', questionSk: 'Ako funguje clipboard pri kopírovaní textu a súborov?' },
  { id: 'ssl-cert', questionEn: 'How do SSL certificates work on websites?', questionSk: 'Ako funguje SSL certifikát na webových stránkach?' },
  { id: 'vpn', questionEn: 'How does a VPN work and what does it actually do?', questionSk: 'Ako funguje VPN a čo vlastne robí?' },
  { id: 'cdn', questionEn: 'How does a CDN work and why does it speed up websites?', questionSk: 'Ako funguje CDN a prečo zrýchľuje weby?' },
  { id: 'cache', questionEn: 'How does cache work and why does it save time?', questionSk: 'Ako funguje cache a prečo šetrí čas?' },
  { id: 'slow-internet', questionEn: 'Why is the internet sometimes slow?', questionSk: 'Prečo je internet niekedy pomalý?' },
  { id: 'cookies', questionEn: 'How do cookies work on websites?', questionSk: 'Ako fungujú cookies na webových stránkach?' },
  { id: 'git-save', questionEn: 'How does Git save your changes?', questionSk: 'Ako funguje Git pri ukladaní zmien?' },
  { id: 'db-find-row', questionEn: 'How does a database find one row out of a million?', questionSk: 'Ako databáza nájde jeden riadok z milióna?' },
  { id: 'ai-hallucinate', questionEn: 'Why does AI sometimes hallucinate?', questionSk: 'Prečo AI niekedy halucinuje?' },
  { id: 'ai-images', questionEn: 'How does AI understand images?', questionSk: 'Ako AI chápe obrázky?' },
  { id: 'face-id', questionEn: 'How does Face ID work in iPhone?', questionSk: 'Ako funguje Face ID v iPhone?' },
  { id: 'touch-id', questionEn: 'How does Touch ID work?', questionSk: 'Ako funguje Touch ID?' },
  { id: 'gps', questionEn: 'How does GPS work in your phone?', questionSk: 'Ako funguje GPS v mobile?' },
  { id: 'push-notif', questionEn: 'How do push notifications work?', questionSk: 'Ako fungujú push notifikácie?' },
  { id: 'nfc', questionEn: 'How does NFC work when paying?', questionSk: 'Ako funguje NFC pri platení?' },
  { id: 'airdrop', questionEn: 'How does AirDrop work between iPhones?', questionSk: 'Ako funguje AirDrop medzi iPhonmi?' },
  { id: 'password', questionEn: 'How does a password work when logging in?', questionSk: 'Ako funguje heslo pri prihlasovaní?' },
  { id: 'ram-forget', questionEn: 'Why does RAM forget everything when you turn off your computer?', questionSk: 'Prečo RAM po vypnutí zabudne všetko?' },
  { id: 'ssd-files', questionEn: 'How does an SSD know where your files are?', questionSk: 'Ako SSD vie, kde sú tvoje súbory?' },
  { id: 'crash', questionEn: 'Why does a program sometimes crash?', questionSk: 'Prečo program niekedy spadne?' },
  { id: 'ram-speed', questionEn: 'How does RAM work and why is it so fast?', questionSk: 'Ako funguje RAM a prečo je taká rýchla?' },
  { id: 'multicore', questionEn: 'How does a processor work with multiple cores?', questionSk: 'Ako funguje procesor s viacerými jadrami?' },
  { id: 'open-website', questionEn: 'What happens when you open a website?', questionSk: 'Čo sa deje, keď otvoríš webovú stránku?' },
  { id: 'press-enter', questionEn: 'What happens when you press Enter?', questionSk: 'Čo sa deje, keď stlačíš tlačidlo Enter?' },
  { id: 'cloud', questionEn: 'How does the cloud work and where is your data?', questionSk: 'Ako funguje cloud a kde sú tvoje dáta?' },
  { id: 'usb-two-tries', questionEn: 'Why does USB take two tries to plug in?', questionSk: 'Prečo má USB dva pokusy na zapojenie?' },
  { id: 'computer-clock', questionEn: 'How does a computer know what time it is?', questionSk: 'Ako počítač vie, koľko je hodín?' },
  { id: 'monitor-colors', questionEn: 'How does a monitor display millions of colors?', questionSk: 'Ako monitor zobrazí milióny farieb?' },
  { id: 'youtube-recommend', questionEn: 'How does YouTube recommend videos?', questionSk: 'Ako funguje YouTube odporúčanie videí?' },
  { id: 'instagram-realtime', questionEn: 'How does Instagram show new posts without refreshing?', questionSk: 'Ako vie Instagram zobraziť nové príspevky bez obnovenia stránky?' },
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
- Vysvetli to jednoducho a jasne, krok za krokom, ako kamarátovi
- Štruktúra: 1) Čo to je v jednej vete, 2) Ako to funguje prakticky, 3) Konkrétny príklad z reálneho života
- Plynulé vety, nie krátke bodka za bodkou
- Použi "ty" formu — "napíšeš", "vidíš", "tvoj telefón"
- Použi jedno konkrétne prirovnanie k bežnému životu
- NIKDY nepoužívaj skratky okrem: AI, API, CPU, DNS, GPS, QR, RAM, REST, SQL, SSD, USB, VPN, CDN, SSL
- NIKDY nezačínaj opakovaním otázky! Začni rovno vysvetlením
- NIKDY nepíš výzvy typu "napíš do komentov", "daj follow", "poslem ti kód" alebo čokoľvek podobné
- Max 100 slov
- Slovenčina (NIKDY čeština)
- Vrať LEN text vysvetlenia, nič iné`
    : `Write an explanation for a short video (30-40 seconds spoken) on the topic: "${question}"

Rules:
- Explain it simply and clearly, step by step, like to a friend
- Structure: 1) What it is in one sentence, 2) How it works practically, 3) One concrete real-life example
- Flowing sentences, not short choppy ones
- Use "you" form — "you type", "you see", "your phone"
- Use one specific real-life comparison
- NEVER use abbreviations except: AI, API, CPU, DNS, GPS, QR, RAM, REST, SQL, SSD, USB, VPN, CDN, SSL
- NEVER start by repeating the question! Just go straight to the answer
- NEVER write calls to action like "write start in comments", "follow me", "I will send you the code" or anything similar
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

async function translateScript(enScript: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o', temperature: 0.3, max_tokens: 500,
      messages: [{ role: 'user', content: `Prelož tento anglický text do slovenčiny. Zachovaj rovnaký obsah, fakty a štruktúru. Neprekladaj technické názvy (API, CPU, RAM atď.). Použi neformálnu slovenčinu, "ty" formu. NIKDY čeština. Max 100 slov. Vráť LEN preklad, nič iné.

Text:
${enScript}` }],
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || enScript;
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

  // Random equipment — different every video, any color
  const equipment = randomByteFallEquipment();

  // Random surfboard color
  const SURF_COLORS = [
    ['#f59e0b', '#fb923c'], // orange
    ['#3b82f6', '#60a5fa'], // blue
    ['#ef4444', '#f87171'], // red
    ['#8b5cf6', '#a78bfa'], // purple
    ['#10b981', '#34d399'], // green
    ['#ec4899', '#f472b6'], // pink
    ['#f97316', '#fdba74'], // amber
    ['#06b6d4', '#22d3ee'], // cyan
  ];
  const surfColorPick = SURF_COLORS[Math.floor(Math.random() * SURF_COLORS.length)];
  console.log(`🎽 Equipment: ${JSON.stringify(equipment)}\n`);

  // Generate both scripts independently
  console.log('✍️ Generating scripts...');
  const scriptEn = await generateScript(topic.questionEn, 'en');
  console.log(`  EN: "${scriptEn.slice(0, 80)}..."`);
  const scriptSk = await generateScript(topic.questionSk, 'sk');
  console.log(`  SK: "${scriptSk.slice(0, 80)}..."`);

  for (const lang of ['sk', 'en'] as const) {
    const question = lang === 'sk' ? topic.questionSk : topic.questionEn;
    const script = lang === 'sk' ? scriptSk : scriptEn;

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
      surfColor1: surfColorPick[0], surfColor2: surfColorPick[1],
    };

    console.log(`🎬 [${lang}] Rendering (${durationFrames} frames, ${(durationFrames / FPS).toFixed(1)}s)...`);
    const composition = await selectComposition({ serveUrl, timeoutInMilliseconds: 120000, id: 'ByteSurf', inputProps: props });
    const outPath = path.join(OUT_DIR, `bytesurf_${lang}.mp4`);
    await renderMedia({ composition, serveUrl, timeoutInMilliseconds: 120000, codec: 'h264', outputLocation: outPath, inputProps: props });

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
      ? `🏄 Ľudia sa ma často pýtajú...\n\n${question}\n\n📲 coduy.sk\n\n#coding #programming #tech #coduy #learntocode #developer`
      : `🏄 People often ask me...\n\n${question}\n\n📲 coduy.com\n\n#coding #programming #tech #coduy #learntocode #developer`;

    console.log(`📱 [${lang}] Publishing Reel...`);
    const container = await igPost(`${API}/${userId}/media`, {
      media_type: 'REELS', video_url: videoUrl, caption, access_token: token,
    });
    await waitForContainer(container.id, token);
    const published = await igPost(`${API}/${userId}/media_publish`, {
      creation_id: container.id, access_token: token,
    });
    console.log(`🎉 [${lang}] Reel: ${published.id}`);

    // Delete old reels for same topic+lang
    try {
      const { data: trackData } = await sb.storage.from('ig-media').download('tracking/bytesurf_media.json');
      let mediaTrack: any[] = trackData ? JSON.parse(await trackData.text()) : [];
      const oldReels = mediaTrack.filter(r => r.topicId === topic.id && r.lang === lang && r.mediaId);
      for (const old of oldReels) {
        try {
          const delRes = await fetch(`${API}/${old.mediaId}?access_token=${token}`, { method: 'DELETE' });
          console.log(delRes.ok ? `🗑️ Deleted old reel ${old.mediaId}` : `⚠️ Could not delete ${old.mediaId}`);
        } catch {}
      }
      mediaTrack = mediaTrack.filter(r => !(r.topicId === topic.id && r.lang === lang));
      mediaTrack.push({ topicId: topic.id, lang, mediaId: published.id, publishedAt: new Date().toISOString() });
      await sb.storage.from('ig-media').upload('tracking/bytesurf_media.json', Buffer.from(JSON.stringify(mediaTrack)), { contentType: 'application/json', upsert: true });
    } catch (err) { console.log('⚠️ Media tracking failed (non-fatal):', err); }

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
