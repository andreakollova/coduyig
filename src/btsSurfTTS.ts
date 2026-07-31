/**
 * Behind the Scenes — TTS with two voices
 * Voice 1 (questioner): "Bro what happens when..."
 * Voice 2 (Byte): "And I just tell them that..."
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const API = 'https://api.elevenlabs.io/v1';

// Byte's voice (main explainer)
const BYTE_VOICE = 'Ewvy14akxdhONg4fmNry';
// Questioner voice (someone else asking) — use student voice for contrast
const QUESTIONER_VOICE = '5TUD5nYN251MvBggIfLu'; // SK student voice — sounds like a different person

interface WordTiming { word: string; start: number; end: number; }
interface ELResponse { audio_base64: string; alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[]; }; }

function charsToWords(chars: ELResponse['alignment']): WordTiming[] {
  const words: WordTiming[] = [];
  let ws = -1, wc: string[] = [];
  for (let i = 0; i < chars.characters.length; i++) {
    const ch = chars.characters[i];
    if (ch === ' ' || ch === '\n') {
      if (wc.length > 0 && ws >= 0) { words.push({ word: wc.join(''), start: ws, end: chars.character_end_times_seconds[i - 1] }); wc = []; ws = -1; }
    } else { if (ws < 0) ws = chars.character_start_times_seconds[i]; wc.push(ch); }
  }
  if (wc.length > 0 && ws >= 0) words.push({ word: wc.join(''), start: ws, end: chars.character_end_times_seconds[chars.characters.length - 1] });
  return words;
}

/** Sanitize file extensions and dotted terms for spoken TTS */
function sanitizeDottedTerms(text: string): string {
  // Replace common file extensions: "súbor.zip" → "súbor zip", "config.json" → "config json"
  return text
    .replace(/(\w)\.(zip|rar|tar|gz|7z|exe|dmg|apk|iso|img)\b/gi, '$1 $2')
    .replace(/(\w)\.(json|xml|html|css|js|ts|tsx|jsx|py|java|cpp|c|h|rb|go|rs|swift|kt)\b/gi, '$1 $2')
    .replace(/(\w)\.(txt|csv|pdf|doc|docx|xls|xlsx|ppt|pptx|md|yaml|yml|toml|ini|cfg|conf|env|log)\b/gi, '$1 $2')
    .replace(/(\w)\.(png|jpg|jpeg|gif|svg|webp|ico|mp3|mp4|wav|avi|mov|mkv)\b/gi, '$1 $2')
    .replace(/(\w)\.(com|org|net|io|sk|cz|dev|app)\b/gi, '$1 bodka $2');
}

// Slovak letter names for abbreviation expansion (NOT English!)
// A=á, B=bé, C=cé, D=dé, E=é, F=ef, G=gé, H=há, I=í, J=jé, K=ká,
// L=el, M=em, N=en, O=ó, P=pé, Q=kvé, R=er, S=es, T=té, U=ú, V=vé,
// W=dvojité vé, X=iks, Y=ypsilon, Z=zet
const SK_LETTER: Record<string, string> = {
  A: 'á', B: 'bé', C: 'cé', D: 'dé', E: 'é', F: 'ef', G: 'gé', H: 'há',
  I: 'í', J: 'jé', K: 'ká', L: 'el', M: 'em', N: 'en', O: 'ó', P: 'pé',
  Q: 'kvé', R: 'er', S: 'es', T: 'té', U: 'ú', V: 'vé', W: 'dvojité vé',
  X: 'iks', Y: 'ypsilon', Z: 'zet',
};

// How Slovaks actually pronounce these abbreviations (mix of SK and EN letter names)
const SK_ABBREV: Record<string, string> = {
  SQL: 'es kvé el', API: 'ej pí aj', CPU: 'sí pí jú', GPU: 'dží pí jú',
  RAM: 'rem', SSD: 'es es dí', DNS: 'dí en es', URL: 'jú ár el',
  HTTP: 'ejč tí tí pí', HTTPS: 'ejč tí tí pí es', HTML: 'ejč tí em el',
  CSS: 'sí es es', USB: 'jú es bí', VPN: 'ví pí en', CDN: 'sí dí en',
  SSL: 'es es el', TLS: 'tí el es', NFC: 'en ef sí', GPS: 'dží pí es',
  QR: 'kjú ár', AI: 'ej aj', REST: 'rest', JSON: 'džejson', XML: 'eks em el',
  LED: 'el í dí', IP: 'aj pí', TCP: 'tí sí pí', UDP: 'jú dí pí',
  FTP: 'ef tí pí', SSH: 'es es ejč', IoT: 'aj ou tí', JWT: 'džej dablju tí',
  OAuth: 'ó ót', ZIP: 'zip', AJAX: 'ejdžeks', DOM: 'dom', CLI: 'sí el aj',
  GUI: 'dží jú aj', IDE: 'aj dí í', OOP: 'ó ó pé', SDK: 'es dí kej',
  LLM: 'el el em', BIOS: 'bajos',
};

/** Expand any uppercase abbreviation to Slovak letter names */
function expandAbbrevSk(text: string): string {
  let result = text;
  // First apply known abbreviations (longest first)
  const sorted = Object.entries(SK_ABBREV).sort((a, b) => b[0].length - a[0].length);
  for (const [abbr, phonetic] of sorted) {
    result = result.replace(new RegExp(`\\b${abbr}\\b`, 'g'), phonetic);
  }
  // Expand any remaining uppercase abbreviations (2+ letters) using Slovak letter names
  result = result.replace(/\b[A-Z]{2,}\b/g, (match) => {
    return match.split('').map(c => SK_LETTER[c] || c).join(' ');
  });
  return result;
}

/** Convert SK text to phonetic spelling for TTS — uses Slovak letter names + GPT for foreign words */
async function skPhonetics(text: string): Promise<string> {
  // Sanitize dotted terms, then expand abbreviations with SLOVAK letter names
  let result = sanitizeDottedTerms(text);
  result = expandAbbrevSk(result);

  if (!OPENAI_KEY) return result;

  // Find remaining words that MIGHT be English — skip obvious Slovak words
  const remaining = result.match(/\b[A-Za-z][a-z]{2,}\b/g)?.filter(w => {
    const skip = new Set([
      // Slovak grammar
      'je', 'to', 'na', 'sa', 'si', 'ak', 'aj', 'ale', 'ako', 'ani', 'aby',
      'pri', 'pre', 'pod', 'nad', 'bez', 'od', 'do', 'vo', 'tu', 'tam', 'ten', 'nie',
      'iba', 'len', 'tak', 'lebo', 'alebo', 'potom', 'teda', 'kde', 'kam', 'odkial',
      'viac', 'menej', 'este', 'stále', 'presne', 'vlastne', 'jeden', 'alebo',
      'tvoj', 'tvoje', 'jeho', 'jej', 'ich', 'nás', 'vás', 'bol', 'bola', 'bolo',
      'keď', 'kde', 'preto', 'toto', 'toho', 'ktorý', 'ktorá', 'ktoré',
      // Slovak verbs/nouns that look English-ish
      'funguje', 'pozri', 'robí', 'hovorí', 'platení', 'surfujem', 'ukladá',
      'mobile', 'mobil', 'mobilu', 'mobily', 'mobilom', 'mobiloch',
      'online', 'offline',
      'video', 'videa', 'videí', 'audio',
      'model', 'modelu', 'modely', 'modelov',
      'super', 'ultra', 'extra', 'mega', 'mini', 'maxi',
      'final', 'reálne', 'ideálne', 'normálne', 'špeciálne',
      'profile', 'profil', 'profilu',
      'moderne', 'moderný', 'moderna',
      'principe', 'princíp', 'princípu',
      // SK words with -ov, -om, -och, -ami endings that look foreign
      'signál', 'signálov', 'signálom', 'signály',
      'kanál', 'kanálov', 'kanálom', 'kanály',
      'satelit', 'satelitov', 'satelitom', 'satelity',
      // Tech words adopted into Slovak (read as Slovak, not English)
      'server', 'servera', 'serverov', 'serveri', 'serverom',
      'klient', 'klienta', 'klientov', 'klientom',
      'router', 'routera', 'routerov', 'routerom',
      'tablet', 'tabletu', 'tabletov', 'tabletom',
      'internet', 'internetu', 'internetom',
      'program', 'programu', 'programov', 'programom',
      'proces', 'procesu', 'procesov', 'procesom',
      'protokol', 'protokolu', 'protokolom',
      'typ', 'index', 'test', 'port', 'disk', 'bit', 'bajt', 'pixel',
      // From SK_ABBREV expansions
      'rem', 'rest', 'dom', 'zip', 'pop',
    ]);
    return !skip.has(w.toLowerCase());
  }) || [];

  if (remaining.length === 0) return result;

  try {
    const unique = [...new Set(remaining)];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: `Tieto slová sa nachádzajú v SLOVENSKOM texte. Rozhodni pre každé slovo:
- Ak je to SLOVENSKÉ slovo (aj keď vyzerá anglicky, napr. "mobile", "signálov", "moderne") → vráť ho NEZMENENÉ
- Ak je to ANGLICKÝ technický termín ktorý Slováci vyslovujú anglicky (napr. "cache", "thread", "handshake") → preveď na slovenskú fonetiku

Vráť JSON: {"phonetics": {"word": "phonetic"}}

Slová: ${unique.join(', ')}

Príklady anglických slov: cache→keš, thread→tred, queue→kjú, framework→frejmvork, handshake→hendšejk, buffer→bafr, pointer→pojntr, cookies→kúkís, Bluetooth→blútúf, streaming→strímovanie
Príklady slovenských slov (NEMENIŤ): mobile→mobile, signálov→signálov, moderne→moderne, principe→principe, reálne→reálne` }],
      }),
    });
    const data = await res.json();
    const phonetics = JSON.parse(data.choices?.[0]?.message?.content || '{}').phonetics || {};
    for (const [en, sk] of Object.entries(phonetics) as [string, string][]) {
      // Only apply if GPT actually changed the word (skip if returned unchanged)
      if (en.toLowerCase() !== sk.toLowerCase()) {
        result = result.replace(new RegExp(`\\b${en}\\b`, 'g'), sk);
      }
    }
  } catch {}

  return result;
}

/** Build word map: for each original word, track how many phonetic words it expands to */
function buildWordMap(original: string, phonetic: string): { phoneticGroups: number[] } {
  const origWords = original.split(/\s+/);
  const phonWords = phonetic.split(/\s+/);

  // Try to align by walking through both arrays
  const phoneticGroups: number[] = [];
  let pi = 0;
  for (let oi = 0; oi < origWords.length; oi++) {
    const orig = origWords[oi].replace(/[""".,!?;:]/g, '').toLowerCase();
    // Check if this original word was expanded (e.g. "GPS" → "gé pé es" = 3 words)
    // or replaced (e.g. "mobile" → "moubajl" = 1 word)
    // Find how many phonetic words correspond to this original word
    if (pi >= phonWords.length) {
      phoneticGroups.push(0);
      continue;
    }
    // Check if phonetic word at pi matches original (unchanged word)
    const phonClean = phonWords[pi].replace(/[""".,!?;:]/g, '').toLowerCase();
    if (phonClean === orig) {
      phoneticGroups.push(1);
      pi++;
    } else {
      // Word was changed — could be 1-to-1 replacement or 1-to-many expansion
      // Look ahead in phonetic words to find where the next original word starts
      let count = 1;
      if (oi + 1 < origWords.length) {
        const nextOrig = origWords[oi + 1].replace(/[""".,!?;:]/g, '').toLowerCase();
        // Scan forward to find next matching original word
        for (let scan = pi + 1; scan < phonWords.length && scan < pi + 8; scan++) {
          const scanClean = phonWords[scan].replace(/[""".,!?;:]/g, '').toLowerCase();
          if (scanClean === nextOrig) {
            count = scan - pi;
            break;
          }
        }
      } else {
        // Last original word — all remaining phonetic words belong to it
        count = phonWords.length - pi;
      }
      phoneticGroups.push(count);
      pi += count;
    }
  }
  return { phoneticGroups };
}

async function tts(text: string, voiceId: string, speed = 1.1, style = 0.5, lang: 'sk' | 'en' = 'sk'): Promise<{ audio: Buffer; words: WordTiming[]; duration: number }> {
  const originalWords = text.split(/\s+/);
  // SK: expand abbreviations with Slovak letter names + GPT phonetics for foreign words
  // EN: just sanitize dotted terms (ElevenLabs reads English natively)
  const ttsText = lang === 'sk' ? await skPhonetics(text) : sanitizeDottedTerms(text);

  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: ttsText, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.65, similarity_boost: 0.8, style, use_speaker_boost: true },
      speed,
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data: ELResponse = await res.json();
  const audio = Buffer.from(data.audio_base64, 'base64');
  const ttsWords = charsToWords(data.alignment);

  // Map phonetic words back to original words for captions
  // e.g. "GPS" expanded to "gé pé es" (3 TTS words) → merge back to 1 caption word "GPS"
  const { phoneticGroups } = buildWordMap(text, ttsText);
  const captionWords: WordTiming[] = [];
  let ti = 0;
  for (let oi = 0; oi < originalWords.length && ti < ttsWords.length; oi++) {
    const count = phoneticGroups[oi] || 1;
    const start = ttsWords[ti].start;
    const end = ttsWords[Math.min(ti + count - 1, ttsWords.length - 1)].end;
    captionWords.push({ word: originalWords[oi], start, end });
    ti += count;
  }

  const duration = captionWords.length > 0 ? captionWords[captionWords.length - 1].end + 0.3 : 2;
  return { audio, words: captionWords, duration };
}

export async function generateBTSVoiceover(
  question: string,
  script: string,
  outputDir: string,
  lang: 'sk' | 'en' = 'sk',
): Promise<{ audioPath: string; words: WordTiming[]; duration: number }> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');
  fs.mkdirSync(outputDir, { recursive: true });

  // Random greeting — varied for each video
  const skGreetings = ['kámo', 'bráško', 'kámo', 'bráško'];
  const enGreetings = ['bro', 'dude', 'buddy', 'pal'];
  const greetIdx = Math.floor(Math.random() * 4);
  const greeting = lang === 'sk' ? skGreetings[greetIdx] : enGreetings[greetIdx];

  // Part 1: Byte intro (BYTE voice) — random variations
  const skIntros = [
    'Ľudia sa ma často pýtajú:',
    'Niekedy za mnou niekto príde a pýta sa:',
    'Ľudia mi niekedy napíšu:',
    'Včera za mnou prišiel týpek a pýta sa ma že:',
  ];
  const enIntros = [
    'People keep asking me:',
    'Sometimes someone comes up to me and asks:',
    'People sometimes message me:',
    'Yesterday some guy came up to me and asked:',
  ];
  const introIdx = Math.floor(Math.random() * skIntros.length);
  const intro = lang === 'sk' ? skIntros[introIdx] : enIntros[introIdx];
  const isPastTense = introIdx === 3; // "Včera..." / "Yesterday..."

  // Part 2: Questioner question (QUESTIONER voice)
  const greetingCap = greeting.charAt(0).toUpperCase() + greeting.slice(1);
  // Questioner just asks the question directly with greeting
  const prefix = lang === 'sk' ? `${greetingCap}` : `Hey ${greeting}`;
  const questionText = `"${prefix}, ${question.charAt(0).toLowerCase()}${question.slice(1)}"`;

  // Part 3a: "Nechaj ma" / "Leave me alone" / "Give me a break"
  const dismiss = lang === 'sk' ? 'Nechaj ma...' : 'Leave me alone...';
  const answerPart1 = lang === 'sk'
    ? (isPastTense ? `A ja som mu odpovedal... ${dismiss}` : `A ja im odpoviem... ${dismiss}`)
    : (isPastTense ? `And I told him... ${dismiss}` : `And I tell them... ${dismiss}`);

  // Part 3b: "veď surfujem!" / "I am surfing!"
  const answerPart2 = lang === 'sk'
    ? 'Veď práve surfujem!'
    : 'I am surfing!';

  // Part 3c: "Ale v pohode... funguje to takto." / "But ok... here is how it works."
  const answerPart3 = lang === 'sk'
    ? 'Ale v pohode... funguje to takto.'
    : 'But ok... here is how it works.';

  // Part 6: Closing
  const skClosings = [
    `Takže vlastne, nič zložité, ${greeting}.`,
    `A to je celé, ${greeting}.`,
    `Vidíš, žiadna veda, ${greeting}.`,
    `Proste tak to funguje, ${greeting}.`,
    `Easy, ${greeting}.`,
  ];
  const enClosings = [
    `So yeah, nothing complicated, ${greeting}.`,
    `And that is basically it, ${greeting}.`,
    `See, no rocket science, ${greeting}.`,
    `That is how it works, ${greeting}.`,
    `Easy, ${greeting}.`,
  ];
  const closingIdx = Math.floor(Math.random() * 5);
  const closing = lang === 'sk' ? skClosings[closingIdx] : enClosings[closingIdx];

  console.log(`🎙️ Generating BTS voiceover (${lang})...`);
  console.log(`  Byte: "${intro}"`);
  console.log(`  Questioner: "${questionText}"`);
  console.log(`  Answer: "${script.slice(0, 60)}..."`);

  // Generate all parts
  // Sequential to avoid rate limits
  // All parts get SK phonetics — now using Slovak letter names (cé, gé, pé)
  // instead of English (see, gee, pee), so ElevenLabs stays in Slovak mode
  const p1 = await tts(intro, BYTE_VOICE, 1.0, 0.5, lang);
  const p2 = await tts(questionText, QUESTIONER_VOICE, 0.95, 0.8, lang);
  const p3a = await tts(answerPart1, BYTE_VOICE, 1.0, 0.5, lang);
  const p3b = await tts(answerPart2, BYTE_VOICE, 1.0, 0.6, lang);
  const p3c = await tts(answerPart3, BYTE_VOICE, 0.95, 0.4, lang);
  const p4 = await tts(script, BYTE_VOICE, 1.0, 0.5, lang);
  const p5 = await tts(closing, BYTE_VOICE, 0.85, 0.6, lang);

  // Save and normalize audio parts, measure ACTUAL durations after normalization
  const parts = [p1, p2, p3a, p3b, p3c, p4, p5];
  const audioPaths: string[] = [];
  const actualDurations: number[] = [];

  // Parts: 0=intro, 1=questioner, 2=answerPart1, 3=answerPart2, 4=answerPart3, 5=script, 6=closing
  // Short parts (everything except script at index 5) need volume boost for consistent loudness
  for (let i = 0; i < parts.length; i++) {
    const rawPath = path.join(outputDir, `bts_${i}_raw.mp3`);
    const normPath = path.join(outputDir, `bts_${i}.mp3`);
    fs.writeFileSync(rawPath, parts[i].audio);
    try {
      const isShort = i !== 5; // everything except the main explanation
      const boost = isShort ? 'volume=2.5,' : '';
      const target = '-14';
      execSync(`ffmpeg -y -i "${rawPath}" -af "${boost}acompressor=threshold=-25dB:ratio=4:attack=5:release=50:makeup=3,loudnorm=I=${target}:TP=-1:LRA=7" "${normPath}" 2>/dev/null`);
      fs.unlinkSync(rawPath);
    } catch { fs.renameSync(rawPath, normPath); }
    audioPaths.push(normPath);

    // Measure ACTUAL duration after normalization
    const durStr = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${normPath}" 2>/dev/null`).toString().trim();
    actualDurations.push(parseFloat(durStr));
  }

  // Build word timings using ACTUAL audio durations (not TTS-reported)
  const allWords: WordTiming[] = [];
  let cumTime = 0.3; // initial silence
  const gapBetween = 0.4;
  const longerGap = 0.8;

  for (let i = 0; i < parts.length; i++) {
    // Scale word timings to match actual normalized audio duration
    const ttsDuration = parts[i].duration;
    const actualDuration = actualDurations[i];
    const scale = actualDuration / ttsDuration;

    const partWords = parts[i].words;
    for (let j = 0; j < partWords.length; j++) {
      let word = partWords[j].word;
      // No separate quote wrapping needed — it's all one line now
      allWords.push({ word, start: partWords[j].start * scale + cumTime, end: partWords[j].end * scale + cumTime });
    }
    // Longer pause after "surfujem!" (index 3) and after "Ale v pohode" (index 4)
    const gap = (i === 3 || i === 4) ? longerGap : gapBetween;
    cumTime += actualDuration + gap;
  }

  // Concatenate with correct gap sizes matching word timing offsets
  const silencePath = path.join(outputDir, 'silence.mp3');
  const gapShortPath = path.join(outputDir, 'gap_short.mp3');
  const gapLongPath = path.join(outputDir, 'gap_long.mp3');
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 "${silencePath}" 2>/dev/null`);
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${gapBetween} "${gapShortPath}" 2>/dev/null`);
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${longerGap} "${gapLongPath}" 2>/dev/null`);

  const listFile = path.join(outputDir, 'concat.txt');
  const lines = [`file '${path.resolve(silencePath)}'`];
  for (let i = 0; i < audioPaths.length; i++) {
    lines.push(`file '${path.resolve(audioPaths[i])}'`);
    if (i < audioPaths.length - 1) {
      const useGap = (i === 3 || i === 4) ? gapLongPath : gapShortPath;
      lines.push(`file '${path.resolve(useGap)}'`);
    }
  }
  fs.writeFileSync(listFile, lines.join('\n'));

  const concatRaw = path.join(outputDir, 'bts_concat_raw.mp3');
  const finalAudio = path.join(outputDir, 'bts_final.mp3');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${path.resolve(listFile)}" -c:a libmp3lame -q:a 2 "${path.resolve(concatRaw)}" 2>/dev/null`);
  // Final normalization pass on entire audio — ensures consistent volume across ALL segments
  execSync(`ffmpeg -y -i "${path.resolve(concatRaw)}" -af "acompressor=threshold=-20dB:ratio=6:attack=3:release=30:makeup=4,loudnorm=I=-14:TP=-1:LRA=5" -c:a libmp3lame -q:a 2 "${path.resolve(finalAudio)}" 2>/dev/null`);
  try { fs.unlinkSync(concatRaw); } catch {}

  const durationStr = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${finalAudio}" 2>/dev/null`).toString().trim();
  const totalDuration = parseFloat(durationStr);

  // Calculate questioner timing using actual durations
  let qStart = 0.3 + actualDurations[0] + gapBetween;
  let qEnd = qStart + actualDurations[1];

  console.log(`✅ BTS voiceover: ${totalDuration.toFixed(1)}s, ${allWords.length} words, questioner: ${qStart.toFixed(1)}-${qEnd.toFixed(1)}s`);
  return { audioPath: finalAudio, words: allWords, duration: totalDuration, questionerStart: qStart, questionerEnd: qEnd };
}

// CLI
if (process.argv[1]?.endsWith('btsSurfTTS.ts')) {
  const lang = (process.argv[2] || 'sk') as 'sk' | 'en';
  const question = process.argv[3] || 'Čo sa stane keď napíšeš google.com?';
  const script = process.argv[4] || 'Napíšeš google.com a stlačíš enter. Ale tvoj počítač netuší čo google.com znamená.';

  generateBTSVoiceover(question, script, path.join(__dirname, '../out/bts_tts'), lang)
    .then(r => {
      fs.writeFileSync(path.join(__dirname, '../out/bts_tts/words.json'), JSON.stringify(r.words, null, 2));
      console.log('Audio:', r.audioPath);
    })
    .catch(err => { console.error(err); process.exit(1); });
}
