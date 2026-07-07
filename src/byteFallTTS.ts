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

// SK teacher voice — expressive
const VOICE_ID = 'DXwrzy2wtKORwDTbsMwk';

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

async function ttsSegment(text: string, speed = 1.8): Promise<{ audioBuffer: Buffer; wordTimings: WordTiming[]; duration: number }> {
  const { ttsText, originalWords, phoneticGroups } = buildWordMap(text);

  const res = await fetch(`${API}/text-to-speech/${VOICE_ID}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: ttsText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.25,
        similarity_boost: 0.75,
        style: 0.9,
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
): Promise<{ audioPath: string; words: WordTiming[]; duration: number }> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  fs.mkdirSync(outputDir, { recursive: true });

  // Build the script — teacher explains during fall, then repeats excitedly
  // Start speaking at ~1.5s into the video (after Byte drops in and term appears)
  const parts = termFull.split(' ');
  const secureWord = parts[0] || 'Secure';
  const shellWord = parts[1] || 'Shell';

  const script = [
    `${term}! ${termFull}.`,
    `${secureWord}, pretože komunikácia je šifrovaná a chránená.`,
    `${shellWord}, pretože ovládaš vzdialený počítač cez príkazový riadok.`,
    `${term}. ${termFull}. ${term}. ${termFull}.`,
  ];

  console.log(`🎙️ Generating ByteFall voiceover for ${term}...`);

  const allWords: WordTiming[] = [];
  const audioParts: string[] = [];
  let cumTime = 1.5; // Start at 1.5s — after Byte enters

  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    console.log(`  Part ${i + 1}: "${line}"`);

    // Last part (repeating) is more excited = faster
    const speed = i === script.length - 1 ? 2.0 : 1.8;
    const { audioBuffer, wordTimings, duration } = await ttsSegment(line, speed);

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
  const term = process.argv[2] || 'SSH';
  const termFull = process.argv[3] || 'Secure Shell';
  const definition = process.argv[4] || 'Bezpečný komunikačný protokol na vzdialený prístup k serverom';

  generateByteFallVoiceover(term, termFull, definition, path.join(__dirname, '../out/bytefall_tts'))
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
