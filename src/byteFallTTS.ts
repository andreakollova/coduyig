/**
 * Generate TTS voiceover for ByteFall glossary animation.
 * Teacher voice explains the term while Byte falls, then repeats it excitedly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const API = 'https://api.elevenlabs.io/v1';

// Voice IDs per language
const VOICES = {
  sk: { teacher: 'DXwrzy2wtKORwDTbsMwk', student: '5TUD5nYN251MvBggIfLu' },
  en: { teacher: '3TStB8f3X3To0Uj5R7RK', student: 's3TPKV1kjDlVtZbl4Ksh' },
};

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

interface ELResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

function charsToWords(chars: ELResponse['alignment']): WordTiming[] {
  const words: WordTiming[] = [];
  let wordStart = -1;
  let wordChars: string[] = [];
  for (let i = 0; i < chars.characters.length; i++) {
    const ch = chars.characters[i];
    const st = chars.character_start_times_seconds[i];
    if (ch === ' ' || ch === '\n') {
      if (wordChars.length > 0 && wordStart >= 0) {
        words.push({ word: wordChars.join(''), start: wordStart, end: chars.character_end_times_seconds[i - 1] });
        wordChars = []; wordStart = -1;
      }
    } else {
      if (wordStart < 0) wordStart = st;
      wordChars.push(ch);
    }
  }
  if (wordChars.length > 0 && wordStart >= 0) {
    words.push({ word: wordChars.join(''), start: wordStart, end: chars.character_end_times_seconds[chars.characters.length - 1] });
  }
  return words;
}

// SK phonetics for TTS pronunciation
const SK_PHONETICS: Record<string, string> = {
  'SSH': 'es es ejč',
  'Secure': 'sekjúr',
  'Shell': 'šel',
  'API': 'ej pí aj',
  'HTTP': 'ejč tí tí pí',
  'HTTPS': 'ejč tí tí pí es',
  'SQL': 'es kjú el',
  'CSS': 'sí es es',
  'HTML': 'ejč tí em el',
  'DNS': 'dí en es',
  'URL': 'jú ár el',
  'IP': 'aj pí',
  'TCP': 'tí sí pí',
  'UDP': 'jú dí pí',
  'FTP': 'ef tí pí',
  'REST': 'rest',
  'JSON': 'džejson',
  'XML': 'eks em el',
  'GUI': 'džé jú aj',
  'CLI': 'sí el aj',
  'IDE': 'aj dí í',
  'OOP': 'ou ou pí',
  'RAM': 'rem',
  'CPU': 'sí pí jú',
  'GPU': 'džé pí jú',
  'SSD': 'es es dí',
  'HDD': 'ejč dí dí',
  'IoT': 'aj ou tí',
  'AI': 'ej aj',
  'ML': 'em el',
  'VPN': 'ví pí en',
  'CRUD': 'krad',
  'DOM': 'dom',
  'CDN': 'sí dí en',
  'SDK': 'es dí kej',
  'AJAX': 'ejdžeks',
  'CORS': 'kors',
  'JWT': 'džej dablju tí',
  'OAuth': 'ou ót',
  'SMTP': 'es em tí pí',
  'IMAP': 'aj mep',
  'POP': 'pop',
};

// Build a mapping from original words to their phonetic expansions
function buildWordMap(text: string): { ttsText: string; originalWords: string[]; phoneticGroups: number[] } {
  const originalWords = text.split(/\s+/).filter(Boolean);
  const ttsWords: string[] = [];
  const phoneticGroups: number[] = []; // for each tts word, which original word index it belongs to

  const sorted = Object.entries(SK_PHONETICS).sort((a, b) => b[0].length - a[0].length);

  for (let oi = 0; oi < originalWords.length; oi++) {
    const raw = originalWords[oi];
    // Strip punctuation for matching
    const clean = raw.replace(/[.,!?;:]/g, '');
    const punct = raw.slice(clean.length); // trailing punctuation
    const match = sorted.find(([en]) => clean === en);
    if (match) {
      const expanded = match[1].split(/\s+/);
      // Add punctuation to last expanded word
      for (let j = 0; j < expanded.length; j++) {
        ttsWords.push(j === expanded.length - 1 ? expanded[j] + punct : expanded[j]);
        phoneticGroups.push(oi);
      }
    } else {
      ttsWords.push(raw);
      phoneticGroups.push(oi);
    }
  }

  return { ttsText: ttsWords.join(' '), originalWords, phoneticGroups };
}

async function ttsSegment(text: string, voiceId: string, lang: 'sk' | 'en' = 'sk', speed = 1.8): Promise<{ audioBuffer: Buffer; wordTimings: WordTiming[]; duration: number }> {
  // Only apply phonetics for SK
  const usePhonetics = lang === 'sk';
  const { ttsText, originalWords, phoneticGroups } = usePhonetics
    ? buildWordMap(text)
    : { ttsText: text, originalWords: text.split(/\s+/).filter(Boolean), phoneticGroups: text.split(/\s+/).filter(Boolean).map((_, i) => i) };

  const model = lang === 'sk' ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5';

  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: ttsText,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.7,
        use_speaker_boost: true,
      },
      speed,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  const data: ELResponse = await res.json();
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const rawTimings = charsToWords(data.alignment);

  // Merge phonetic word groups back to original words
  const mergedTimings: WordTiming[] = [];
  let lastOrigIdx = -1;
  for (let ti = 0; ti < rawTimings.length; ti++) {
    const origIdx = ti < phoneticGroups.length ? phoneticGroups[ti] : -1;
    if (origIdx === lastOrigIdx && mergedTimings.length > 0) {
      // Extend the end time of the current merged word
      mergedTimings[mergedTimings.length - 1].end = rawTimings[ti].end;
    } else {
      mergedTimings.push({
        word: origIdx >= 0 && origIdx < originalWords.length ? originalWords[origIdx] : rawTimings[ti].word,
        start: rawTimings[ti].start,
        end: rawTimings[ti].end,
      });
      lastOrigIdx = origIdx;
    }
  }

  const duration = mergedTimings.length > 0 ? mergedTimings[mergedTimings.length - 1].end + 0.3 : 2;
  return { audioBuffer, wordTimings: mergedTimings, duration };
}

export async function generateByteFallVoiceover(
  term: string,
  termFull: string,
  definition: string,
  outputDir: string,
  lang: 'sk' | 'en' = 'sk',
  voice: 'teacher' | 'student' = 'student',
): Promise<{ audioPath: string; words: WordTiming[]; duration: number }> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  fs.mkdirSync(outputDir, { recursive: true });

  const voiceId = VOICES[lang][voice];
  const parts = termFull.split(' ');
  const word1 = parts[0] || '';
  const word2 = parts[1] || '';

  // Build script based on language
  let script: string[];
  if (lang === 'sk') {
    script = [
      `${term}! ${termFull}.`,
      `${word1} znamená, že spojenie je bezpečné a šifrované.`,
      `${word2 || 'To'} znamená, že ovládaš počítač na diaľku cez terminál.`,
      `${term}. ${termFull}. ${term}. ${termFull}.`,
    ];
  } else {
    script = [
      `${term}! ${termFull}.`,
      `${word1} means the connection is encrypted and protected.`,
      `${word2 || 'It'} means you control a computer remotely through a terminal.`,
      `${term}. ${termFull}. ${term}. ${termFull}.`,
    ];
  }

  console.log(`🎙️ Generating ByteFall voiceover for ${term} (${lang}, ${voice})...`);

  const allWords: WordTiming[] = [];
  const audioParts: string[] = [];
  let cumTime = 1.5;

  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    console.log(`  Part ${i + 1}: "${line}"`);

    const speed = lang === 'sk' ? (i === script.length - 1 ? 1.3 : 1.1) : (i === script.length - 1 ? 1.5 : 1.3);
    const { audioBuffer, wordTimings, duration } = await ttsSegment(line, voiceId, lang, speed);

    const rawPath = path.join(outputDir, `bytefall_${i}_raw.mp3`);
    const normPath = path.join(outputDir, `bytefall_${i}.mp3`);
    fs.writeFileSync(rawPath, audioBuffer);

    // Normalize audio
    try {
      execSync(`ffmpeg -y -i "${rawPath}" -af "loudnorm=I=-14:TP=-1:LRA=11" "${normPath}" 2>/dev/null`);
      fs.unlinkSync(rawPath);
    } catch {
      fs.renameSync(rawPath, normPath);
    }

    audioParts.push(normPath);

    // Offset word timings
    for (const w of wordTimings) {
      allWords.push({ word: w.word, start: w.start + cumTime, end: w.end + cumTime });
    }
    cumTime += duration + 0.3; // small gap between parts
  }

  // Concatenate all audio parts with gaps
  const listFile = path.join(outputDir, 'concat.txt');
  const silencePath = path.join(outputDir, 'silence.mp3');

  // Generate 1.5s silence for the intro delay
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 1.5 "${silencePath}" 2>/dev/null`);

  // Generate 0.3s gap
  const gapPath = path.join(outputDir, 'gap.mp3');
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 "${gapPath}" 2>/dev/null`);

  const concatLines = [`file '${silencePath}'`];
  for (let i = 0; i < audioParts.length; i++) {
    concatLines.push(`file '${audioParts[i]}'`);
    if (i < audioParts.length - 1) concatLines.push(`file '${gapPath}'`);
  }
  fs.writeFileSync(listFile, concatLines.join('\n'));

  const finalAudio = path.join(outputDir, 'bytefall_voice.mp3');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -q:a 2 "${finalAudio}" 2>/dev/null`);

  // Get actual audio duration
  const durationStr = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${finalAudio}" 2>/dev/null`).toString().trim();
  const totalDuration = parseFloat(durationStr);

  console.log(`✅ ByteFall voiceover: ${totalDuration.toFixed(1)}s, ${allWords.length} words`);

  return { audioPath: finalAudio, words: allWords, duration: totalDuration };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('byteFallTTS.ts')) {
  const lang = (process.argv[2] || 'sk') as 'sk' | 'en';
  const voice = (process.argv[3] || 'student') as 'teacher' | 'student';
  const term = process.argv[4] || 'SSH';
  const termFull = process.argv[5] || 'Secure Shell';
  const definition = process.argv[6] || 'Bezpečný komunikačný protokol na vzdialený prístup k serverom';

  generateByteFallVoiceover(term, termFull, definition, path.join(__dirname, '../out/bytefall_tts'), lang, voice)
    .then(result => {
      console.log('Audio:', result.audioPath);
      console.log('Words:', JSON.stringify(result.words, null, 2));
      // Save words for Remotion props
      fs.writeFileSync(
        path.join(__dirname, '../out/bytefall_tts/words.json'),
        JSON.stringify(result.words, null, 2),
      );
    })
    .catch(err => { console.error(err); process.exit(1); });
}
