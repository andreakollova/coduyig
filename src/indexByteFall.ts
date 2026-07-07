/**
 * ByteFall publisher — generates and publishes ByteFall glossary Reels.
 * Picks a random term from the glossary, generates TTS, renders video, publishes to IG.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';
import { selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import { generateByteFallVoiceover, randomByteFallEquipment, byteFallCaption } from './byteFallTTS.js';
import { publishStory } from './instagram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OUT_DIR = path.join(process.cwd(), 'out');
const FPS = 30;

const API = 'https://graph.facebook.com/v25.0';

// Glossary terms with definitions for both languages
const GLOSSARY = [
  { id: 'api', term: 'API', termFull: 'Application Programming Interface',
    defSk: 'Rozhranie, cez ktoré spolu komunikujú aplikácie.',
    defEn: 'An interface that allows applications to communicate with each other.' },
  { id: 'json', term: 'JSON', termFull: 'JavaScript Object Notation',
    defSk: 'Univerzálny formát na ukladanie a prenos dát medzi systémami.',
    defEn: 'A universal format for storing and transferring data between systems.' },
  { id: 'html', term: 'HTML', termFull: 'HyperText Markup Language',
    defSk: 'Značkovací jazyk na definovanie štruktúry webových stránok.',
    defEn: 'A markup language for defining the structure of web pages.' },
  { id: 'css', term: 'CSS', termFull: 'Cascading Style Sheets',
    defSk: 'Štýlovací jazyk na vizuálnu prezentáciu HTML dokumentov.',
    defEn: 'A styling language for the visual presentation of HTML documents.' },
  { id: 'sql', term: 'SQL', termFull: 'Structured Query Language',
    defSk: 'Jazyk na správu a manipuláciu s relačnými databázami.',
    defEn: 'A language for managing and manipulating relational databases.' },
  { id: 'git', term: 'Git', termFull: 'Version Control System',
    defSk: 'Distribuovaný systém na správu verzií zdrojového kódu.',
    defEn: 'A distributed version control system for source code.' },
  { id: 'npm', term: 'npm', termFull: 'Node Package Manager',
    defSk: 'Správca balíkov pre ekosystém Node.js.',
    defEn: 'A package manager for the Node.js ecosystem.' },
  { id: 'http', term: 'HTTP', termFull: 'HyperText Transfer Protocol',
    defSk: 'Aplikačný protokol na prenos dát cez internet.',
    defEn: 'An application protocol for transferring data over the internet.' },
  { id: 'dns', term: 'DNS', termFull: 'Domain Name System',
    defSk: 'Systém na preklad doménových mien na IP adresy.',
    defEn: 'A system that translates domain names into IP addresses.' },
  { id: 'ram', term: 'RAM', termFull: 'Random Access Memory',
    defSk: 'Rýchla dočasná pamäť počítača na bežiace procesy.',
    defEn: 'Fast temporary memory for running processes.' },
  { id: 'cpu', term: 'CPU', termFull: 'Central Processing Unit',
    defSk: 'Centrálna výpočtová jednotka, ktorá vykonáva inštrukcie.',
    defEn: 'The central processing unit that executes instructions.' },
  { id: 'ssd', term: 'SSD', termFull: 'Solid State Drive',
    defSk: 'Úložisko využívajúce flash pamäť bez pohyblivých častí.',
    defEn: 'Storage using flash memory with no moving parts.' },
  { id: 'crud', term: 'CRUD', termFull: 'Create Read Update Delete',
    defSk: 'Štyri základné operácie s dátami v databáze.',
    defEn: 'The four basic data operations in a database.' },
  { id: 'jwt', term: 'JWT', termFull: 'JSON Web Token',
    defSk: 'Kompaktný token na bezpečný prenos overovacích informácií.',
    defEn: 'A compact token for securely transmitting authentication information.' },
  { id: 'dom', term: 'DOM', termFull: 'Document Object Model',
    defSk: 'Stromová reprezentácia HTML dokumentu v prehliadači.',
    defEn: 'A tree representation of an HTML document in the browser.' },
  { id: 'ssh', term: 'SSH', termFull: 'Secure Shell',
    defSk: 'Bezpečný komunikačný protokol na vzdialený prístup k serverom.',
    defEn: 'A secure communication protocol for remote access to servers.' },
  { id: 'tcp', term: 'TCP', termFull: 'Transmission Control Protocol',
    defSk: 'Transportný protokol, ktorý zaručuje spoľahlivé doručenie dát.',
    defEn: 'A transport protocol that guarantees reliable data delivery.' },
  { id: 'oauth', term: 'OAuth', termFull: 'Open Authorization',
    defSk: 'Autorizačný protokol na prístup k zdrojom bez hesla.',
    defEn: 'An authorization protocol for accessing resources without a password.' },
];

// Track posted terms
async function getPostedIds(): Promise<string[]> {
  try {
    const { data } = await sb.storage.from('ig-media').download('tracking/bytefall_posted.json');
    if (data) return JSON.parse(await data.text());
  } catch {}
  return [];
}

async function markPosted(id: string) {
  const posted = await getPostedIds();
  posted.push(id);
  const buf = Buffer.from(JSON.stringify(posted));
  await sb.storage.from('ig-media').upload('tracking/bytefall_posted.json', buf, { contentType: 'application/json', upsert: true });
}

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
    console.log(`  ⏳ ${d.status_code} (attempt ${i + 1})`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Container processing timeout');
}

async function main() {
  console.log('🪂 ByteFall Publisher\n');

  // Pick random unposted term
  const postedIds = await getPostedIds();
  let available = GLOSSARY.filter(g => !postedIds.includes(g.id));
  if (available.length === 0) {
    console.log('🔄 All terms posted — resetting cycle');
    await sb.storage.from('ig-media').remove(['tracking/bytefall_posted.json']);
    available = GLOSSARY;
  }

  const entry = available[Math.floor(Math.random() * available.length)];
  console.log(`📖 Picked: ${entry.term} (${entry.termFull}) [${available.length} remaining]\n`);

  // Bundle Remotion
  console.log('📦 Bundling Remotion...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'remotion', 'index.tsx') });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const equipment = randomByteFallEquipment();
  console.log(`🎽 Equipment: ${JSON.stringify(equipment)}\n`);

  for (const lang of ['sk', 'en'] as const) {
    const def = lang === 'sk' ? entry.defSk : entry.defEn;

    // Generate TTS
    const ttsDir = path.join(OUT_DIR, `bytefall_tts_${lang}`);
    const { audioPath, words, duration } = await generateByteFallVoiceover(
      entry.term, entry.termFull, def, ttsDir, lang, 'student'
    );

    // Copy audio to public
    fs.copyFileSync(audioPath, path.join(process.cwd(), 'public', 'bytefall_voice.mp3'));

    // Render video
    const durationFrames = Math.max(420, Math.ceil((duration + 3) * FPS));
    const props = {
      equipment,
      durationInFrames: durationFrames,
      term: entry.term,
      termFull: entry.termFull,
      definition: def,
      audioUrl: 'bytefall_voice.mp3',
      words,
    };

    console.log(`\n🎬 [${lang}] Rendering ByteFall (${durationFrames} frames)...`);
    const composition = await selectComposition({ serveUrl, id: 'ByteFall', inputProps: props });
    const outPath = path.join(OUT_DIR, `bytefall_${lang}.mp4`);
    await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: outPath, inputProps: props });

    // Upload to Supabase
    const storagePath = `bytefall/${lang}_${entry.id}_${Date.now()}.mp4`;
    const buf = fs.readFileSync(outPath);
    await sb.storage.from('ig-media').upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
    const { data: urlData } = sb.storage.from('ig-media').getPublicUrl(storagePath);
    const videoUrl = urlData.publicUrl;
    console.log(`📤 Uploaded: ${videoUrl}`);

    // Publish Reel
    const token = lang === 'sk' ? process.env.IG_PAGE_TOKEN_SK! : process.env.IG_PAGE_TOKEN_EN!;
    const userId = lang === 'sk' ? process.env.IG_USER_ID_SK! : process.env.IG_USER_ID_EN!;
    const caption = byteFallCaption(entry.term, entry.termFull, def, lang);

    console.log(`\n📱 [${lang}] Publishing Reel...`);
    const container = await igPost(`${API}/${userId}/media`, {
      media_type: 'REELS', video_url: videoUrl, caption, access_token: token,
    });
    await waitForContainer(container.id, token);
    const published = await igPost(`${API}/${userId}/media_publish`, {
      creation_id: container.id, access_token: token,
    });
    console.log(`🎉 [${lang}] Reel published: ${published.id}`);

    // Publish Story
    console.log(`📖 [${lang}] Publishing Story...`);
    try {
      await publishStory({ url: videoUrl, type: 'video' }, userId, token, false);
    } catch (err) {
      console.error(`⚠️ [${lang}] Story failed (non-fatal):`, err);
    }
  }

  // Mark as posted
  await markPosted(entry.id);
  console.log(`\n✅ DONE — ${entry.term} posted!`);
}

main().catch(err => { console.error(err); process.exit(1); });
