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
  // === Core abbreviations ===
  { id: 'api', term: 'API', termFull: 'Application Programming Interface',
    defSk: 'Rozhranie na komunikáciu medzi aplikáciami.', defEn: 'An interface for communication between applications.' },
  { id: 'cli', term: 'CLI', termFull: 'Command Line Interface',
    defSk: 'Ovládanie programu cez terminál.', defEn: 'Controlling a program through the terminal.' },
  { id: 'gui', term: 'GUI', termFull: 'Graphical User Interface',
    defSk: 'Grafické používateľské rozhranie.', defEn: 'A graphical user interface for interacting with software.' },
  { id: 'ide', term: 'IDE', termFull: 'Integrated Development Environment',
    defSk: 'Program na vývoj aplikácií.', defEn: 'A program for developing applications.' },
  { id: 'sdk', term: 'SDK', termFull: 'Software Development Kit',
    defSk: 'Balík nástrojov pre vývojárov.', defEn: 'A toolkit for software developers.' },
  { id: 'ssh', term: 'SSH', termFull: 'Secure Shell',
    defSk: 'Bezpečné vzdialené pripojenie k serverom.', defEn: 'A secure remote connection to servers.' },
  // === Web protocols ===
  { id: 'http', term: 'HTTP', termFull: 'HyperText Transfer Protocol',
    defSk: 'Protokol na prenos webových stránok.', defEn: 'A protocol for transferring web pages.' },
  { id: 'https', term: 'HTTPS', termFull: 'HyperText Transfer Protocol Secure',
    defSk: 'Šifrovaná verzia HTTP.', defEn: 'The encrypted version of HTTP.' },
  { id: 'tcp', term: 'TCP', termFull: 'Transmission Control Protocol',
    defSk: 'Protokol na spoľahlivý prenos dát.', defEn: 'A protocol for reliable data transmission.' },
  { id: 'ip', term: 'IP', termFull: 'Internet Protocol',
    defSk: 'Identifikuje zariadenia v sieti.', defEn: 'Identifies devices on a network.' },
  { id: 'dns', term: 'DNS', termFull: 'Domain Name System',
    defSk: 'Prekladá názvy domén na IP adresy.', defEn: 'Translates domain names into IP addresses.' },
  { id: 'url', term: 'URL', termFull: 'Uniform Resource Locator',
    defSk: 'Webová adresa zdroja.', defEn: 'A web address of a resource.' },
  { id: 'uri', term: 'URI', termFull: 'Uniform Resource Identifier',
    defSk: 'Identifikátor zdroja na internete.', defEn: 'An identifier for a resource on the internet.' },
  { id: 'ssl', term: 'SSL', termFull: 'Secure Sockets Layer',
    defSk: 'Starší bezpečnostný protokol pre web.', defEn: 'An older security protocol for the web.' },
  { id: 'tls', term: 'TLS', termFull: 'Transport Layer Security',
    defSk: 'Moderné šifrovanie komunikácie.', defEn: 'Modern encryption for communication.' },
  { id: 'cdn', term: 'CDN', termFull: 'Content Delivery Network',
    defSk: 'Sieť serverov na rýchle doručovanie obsahu.', defEn: 'A network of servers for fast content delivery.' },
  { id: 'vpn', term: 'VPN', termFull: 'Virtual Private Network',
    defSk: 'Šifrované sieťové pripojenie.', defEn: 'An encrypted network connection.' },
  // === Data formats ===
  { id: 'json', term: 'JSON', termFull: 'JavaScript Object Notation',
    defSk: 'Formát na výmenu dát medzi systémami.', defEn: 'A format for exchanging data between systems.' },
  { id: 'xml', term: 'XML', termFull: 'eXtensible Markup Language',
    defSk: 'Formát na ukladanie štruktúrovaných dát.', defEn: 'A format for storing structured data.' },
  { id: 'csv', term: 'CSV', termFull: 'Comma Separated Values',
    defSk: 'Formát tabuľkových dát.', defEn: 'A format for tabular data.' },
  { id: 'html', term: 'HTML', termFull: 'HyperText Markup Language',
    defSk: 'Značkovací jazyk na štruktúru webových stránok.', defEn: 'A markup language for structuring web pages.' },
  { id: 'css', term: 'CSS', termFull: 'Cascading Style Sheets',
    defSk: 'Štýlovací jazyk na vizuál webových stránok.', defEn: 'A styling language for the visual appearance of web pages.' },
  // === Database & backend ===
  { id: 'sql', term: 'SQL', termFull: 'Structured Query Language',
    defSk: 'Jazyk na prácu s databázami.', defEn: 'A language for working with databases.' },
  { id: 'orm', term: 'ORM', termFull: 'Object Relational Mapping',
    defSk: 'Prepája objekty v kóde s databázou.', defEn: 'Maps code objects to database tables.' },
  { id: 'crud', term: 'CRUD', termFull: 'Create Read Update Delete',
    defSk: 'Štyri základné operácie s dátami.', defEn: 'The four basic data operations.' },
  // === Auth & security ===
  { id: 'jwt', term: 'JWT', termFull: 'JSON Web Token',
    defSk: 'Token na prihlasovanie používateľov.', defEn: 'A token for user authentication.' },
  { id: 'oauth', term: 'OAuth', termFull: 'Open Authorization',
    defSk: 'Štandard na autorizáciu prístupu.', defEn: 'A standard for authorizing access.' },
  // === Hardware ===
  { id: 'cpu', term: 'CPU', termFull: 'Central Processing Unit',
    defSk: 'Procesor počítača, vykonáva inštrukcie.', defEn: 'The computer processor that executes instructions.' },
  { id: 'gpu', term: 'GPU', termFull: 'Graphics Processing Unit',
    defSk: 'Grafický procesor na paralelné výpočty.', defEn: 'A graphics processor for parallel computation.' },
  { id: 'ram', term: 'RAM', termFull: 'Random Access Memory',
    defSk: 'Rýchla dočasná pamäť počítača.', defEn: 'Fast temporary computer memory.' },
  { id: 'ssd', term: 'SSD', termFull: 'Solid State Drive',
    defSk: 'Rýchle úložisko bez pohyblivých častí.', defEn: 'Fast storage with no moving parts.' },
  { id: 'hdd', term: 'HDD', termFull: 'Hard Disk Drive',
    defSk: 'Klasický pevný disk s mechanickými časťami.', defEn: 'A traditional hard drive with mechanical parts.' },
  { id: 'bios', term: 'BIOS', termFull: 'Basic Input Output System',
    defSk: 'Softvér spúšťaný pri štarte počítača.', defEn: 'Software that runs when a computer starts.' },
  { id: 'uefi', term: 'UEFI', termFull: 'Unified Extensible Firmware Interface',
    defSk: 'Moderná náhrada BIOS-u.', defEn: 'A modern replacement for BIOS.' },
  // === System & infra ===
  { id: 'os', term: 'OS', termFull: 'Operating System',
    defSk: 'Operačný systém počítača.', defEn: 'The operating system of a computer.' },
  { id: 'vm', term: 'VM', termFull: 'Virtual Machine',
    defSk: 'Virtuálny počítač bežiaci vo vnútri skutočného.', defEn: 'A virtual computer running inside a real one.' },
  { id: 'vps', term: 'VPS', termFull: 'Virtual Private Server',
    defSk: 'Virtuálny server na hostovanie aplikácií.', defEn: 'A virtual server for hosting applications.' },
  // === Web architecture ===
  { id: 'dom', term: 'DOM', termFull: 'Document Object Model',
    defSk: 'Objektová reprezentácia HTML stránky.', defEn: 'An object representation of an HTML page.' },
  { id: 'jsx', term: 'JSX', termFull: 'JavaScript XML',
    defSk: 'Syntax Reactu podobná HTML.', defEn: 'React syntax that looks like HTML.' },
  { id: 'csr', term: 'CSR', termFull: 'Client Side Rendering',
    defSk: 'Renderovanie stránky v prehliadači.', defEn: 'Rendering the page in the browser.' },
  { id: 'ssr', term: 'SSR', termFull: 'Server Side Rendering',
    defSk: 'Renderovanie stránky na serveri.', defEn: 'Rendering the page on the server.' },
  { id: 'ssg', term: 'SSG', termFull: 'Static Site Generation',
    defSk: 'Generovanie statických stránok vopred.', defEn: 'Generating static pages in advance.' },
  { id: 'isr', term: 'ISR', termFull: 'Incremental Static Regeneration',
    defSk: 'Postupná aktualizácia statických stránok.', defEn: 'Gradually updating static pages.' },
  { id: 'spa', term: 'SPA', termFull: 'Single Page Application',
    defSk: 'Jednostránková webová aplikácia.', defEn: 'A single-page web application.' },
  { id: 'pwa', term: 'PWA', termFull: 'Progressive Web App',
    defSk: 'Web fungujúci ako mobilná aplikácia.', defEn: 'A web app that works like a mobile app.' },
  { id: 'mvc', term: 'MVC', termFull: 'Model View Controller',
    defSk: 'Architektúra rozdelenia aplikácie na tri časti.', defEn: 'Architecture that separates an app into three parts.' },
  { id: 'mvvm', term: 'MVVM', termFull: 'Model View ViewModel',
    defSk: 'Architektúra často používaná vo frontende.', defEn: 'Architecture commonly used in frontend development.' },
  // === Programming paradigms ===
  { id: 'oop', term: 'OOP', termFull: 'Object Oriented Programming',
    defSk: 'Objektovo orientované programovanie.', defEn: 'Object-oriented programming paradigm.' },
  { id: 'fp', term: 'FP', termFull: 'Functional Programming',
    defSk: 'Funkcionálne programovanie.', defEn: 'Functional programming paradigm.' },
  // === AI & ML ===
  { id: 'mcp', term: 'MCP', termFull: 'Model Context Protocol',
    defSk: 'Protokol prepájajúci AI modely s nástrojmi.', defEn: 'A protocol connecting AI models with tools.' },
  { id: 'llm', term: 'LLM', termFull: 'Large Language Model',
    defSk: 'Veľký jazykový model trénovaný na texte.', defEn: 'A large language model trained on text.' },
  { id: 'vlm', term: 'VLM', termFull: 'Vision Language Model',
    defSk: 'AI pracujúca s textom aj obrázkami.', defEn: 'AI that works with both text and images.' },
  { id: 'rag', term: 'RAG', termFull: 'Retrieval Augmented Generation',
    defSk: 'AI si pred odpoveďou vyhľadá informácie.', defEn: 'AI retrieves information before generating an answer.' },
  { id: 'a2a', term: 'A2A', termFull: 'Agent to Agent',
    defSk: 'Komunikácia medzi AI agentmi.', defEn: 'Communication between AI agents.' },
  { id: 'cot', term: 'CoT', termFull: 'Chain of Thought',
    defSk: 'Postupné uvažovanie AI modelu.', defEn: 'Step-by-step reasoning by an AI model.' },
  { id: 'moe', term: 'MoE', termFull: 'Mixture of Experts',
    defSk: 'AI architektúra s viacerými expertmi.', defEn: 'AI architecture with multiple specialized experts.' },
  { id: 'rlhf', term: 'RLHF', termFull: 'Reinforcement Learning from Human Feedback',
    defSk: 'Trénovanie AI pomocou spätnej väzby od ľudí.', defEn: 'Training AI using human feedback.' },
  { id: 'tts', term: 'TTS', termFull: 'Text to Speech',
    defSk: 'Prevod textu na hovorené slovo.', defEn: 'Converting text into spoken words.' },
  { id: 'stt', term: 'STT', termFull: 'Speech to Text',
    defSk: 'Prevod hovoreného slova na text.', defEn: 'Converting spoken words into text.' },
  { id: 'nlp', term: 'NLP', termFull: 'Natural Language Processing',
    defSk: 'Spracovanie prirodzeného jazyka počítačom.', defEn: 'Computer processing of natural language.' },
  { id: 'cv', term: 'CV', termFull: 'Computer Vision',
    defSk: 'Spracovanie obrazu pomocou AI.', defEn: 'Image processing using AI.' },
  { id: 'asr', term: 'ASR', termFull: 'Automatic Speech Recognition',
    defSk: 'Automatické rozpoznávanie reči.', defEn: 'Automatic speech recognition.' },
  { id: 'gpt', term: 'GPT', termFull: 'Generative Pre-trained Transformer',
    defSk: 'Typ generatívneho AI modelu.', defEn: 'A type of generative AI model.' },
  { id: 'lora', term: 'LoRA', termFull: 'Low Rank Adaptation',
    defSk: 'Efektívne dolaďovanie AI modelov.', defEn: 'Efficient fine-tuning of AI models.' },
  { id: 'peft', term: 'PEFT', termFull: 'Parameter Efficient Fine-Tuning',
    defSk: 'Úsporné dolaďovanie AI modelov.', defEn: 'Memory-efficient fine-tuning of AI models.' },
  { id: 'rl', term: 'RL', termFull: 'Reinforcement Learning',
    defSk: 'Učenie posilňovaním pomocou odmien.', defEn: 'Learning through rewards and penalties.' },
  { id: 'ocr', term: 'OCR', termFull: 'Optical Character Recognition',
    defSk: 'Rozpoznávanie textu z obrázkov.', defEn: 'Recognizing text from images.' },
  { id: 'uuid', term: 'UUID', termFull: 'Universally Unique Identifier',
    defSk: 'Jedinečný identifikátor pre dáta.', defEn: 'A unique identifier for data.' },
  // === DevOps & CI/CD ===
  { id: 'cicd', term: 'CI/CD', termFull: 'Continuous Integration Continuous Delivery',
    defSk: 'Automatické testovanie a nasadzovanie aplikácií.', defEn: 'Automated testing and deployment of applications.' },
  // === Package managers & tools ===
  { id: 'npm', term: 'npm', termFull: 'Node Package Manager',
    defSk: 'Správca balíkov pre JavaScript.', defEn: 'A package manager for JavaScript.' },
  { id: 'tdd', term: 'TDD', termFull: 'Test Driven Development',
    defSk: 'Vývoj riadený testami.', defEn: 'Test-driven development methodology.' },
  { id: 'gil', term: 'GIL', termFull: 'Global Interpreter Lock',
    defSk: 'Zámok, ktorý obmedzuje Python na jedno vlákno.', defEn: 'A lock that limits Python to one thread at a time.' },
  { id: 'git', term: 'Git', termFull: 'Version Control System',
    defSk: 'Systém na správu verzií zdrojového kódu.', defEn: 'A version control system for source code.' },
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

    // Copy audio to bundled public directory so staticFile() can find it
    const audioFileName = `bytefall_voice_${lang}.mp3`;
    const publicDir = path.join(serveUrl, 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    fs.copyFileSync(audioPath, path.join(publicDir, audioFileName));

    // Render video
    const durationFrames = Math.max(420, Math.ceil((duration + 3) * FPS));
    const props = {
      equipment,
      durationInFrames: durationFrames,
      term: entry.term,
      termFull: entry.termFull,
      definition: def,
      audioUrl: audioFileName,
      words,
    };

    console.log(`\n🎬 [${lang}] Rendering ByteFall (${durationFrames} frames)...`);
    const composition = await selectComposition({ serveUrl, timeoutInMilliseconds: 120000, id: 'ByteFall', inputProps: props });
    const outPath = path.join(OUT_DIR, `bytefall_${lang}.mp4`);
    await renderMedia({ composition, serveUrl, timeoutInMilliseconds: 120000, codec: 'h264', outputLocation: outPath, inputProps: props });

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
    const termNumber = postedIds.length + 1;
    const caption = byteFallCaption(entry.term, entry.termFull, def, lang, termNumber);

    console.log(`\n📱 [${lang}] Publishing Reel...`);
    const container = await igPost(`${API}/${userId}/media`, {
      media_type: 'REELS', video_url: videoUrl, caption, access_token: token,
    });
    await waitForContainer(container.id, token);
    const published = await igPost(`${API}/${userId}/media_publish`, {
      creation_id: container.id, access_token: token,
    });
    console.log(`🎉 [${lang}] Reel published: ${published.id}`);

    // Delete old reels for same term+lang
    try {
      const { data: trackData } = await sb.storage.from('ig-media').download('tracking/bytefall_media.json');
      let mediaTrack: any[] = trackData ? JSON.parse(await trackData.text()) : [];
      const oldReels = mediaTrack.filter(r => r.termId === entry.id && r.lang === lang && r.mediaId);
      for (const old of oldReels) {
        try {
          const delRes = await fetch(`${API}/${old.mediaId}?access_token=${token}`, { method: 'DELETE' });
          console.log(delRes.ok ? `🗑️ Deleted old reel ${old.mediaId}` : `⚠️ Could not delete ${old.mediaId}`);
        } catch {}
      }
      mediaTrack = mediaTrack.filter(r => !(r.termId === entry.id && r.lang === lang));
      mediaTrack.push({ termId: entry.id, lang, mediaId: published.id, publishedAt: new Date().toISOString() });
      await sb.storage.from('ig-media').upload('tracking/bytefall_media.json', Buffer.from(JSON.stringify(mediaTrack)), { contentType: 'application/json', upsert: true });
    } catch (err) { console.log('⚠️ Media tracking failed (non-fatal):', err); }

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
