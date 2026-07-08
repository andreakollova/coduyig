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

async function tts(text: string, voiceId: string, speed = 1.1, style = 0.5): Promise<{ audio: Buffer; words: WordTiming[]; duration: number }> {
  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style, use_speaker_boost: true },
      speed,
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data: ELResponse = await res.json();
  const audio = Buffer.from(data.audio_base64, 'base64');
  const words = charsToWords(data.alignment);
  const duration = words.length > 0 ? words[words.length - 1].end + 0.3 : 2;
  return { audio, words, duration };
}

export async function generateBTSVoiceover(
  question: string,
  script: string,
  outputDir: string,
  lang: 'sk' | 'en' = 'sk',
): Promise<{ audioPath: string; words: WordTiming[]; duration: number }> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');
  fs.mkdirSync(outputDir, { recursive: true });

  // Part 1: Byte intro — "People often ask me"
  const intro = lang === 'sk'
    ? 'Ľudia sa ma často pýtajú.'
    : 'People keep asking me.';

  // Part 2: Questioner — "Bro what happens when X?"
  const questionText = lang === 'sk'
    ? `Kámo ale čo sa vlastne stane keď ${question.replace(/^Čo sa stane keď /i, '').replace(/\?$/, '')}?`
    : `Dude, what actually happens when ${question.replace(/^What happens when (you )?/i, '').replace(/\?$/, '')}?`;

  // Part 3: Byte answer — casual transition
  const answerIntro = lang === 'sk'
    ? 'A ja im odpoviem, nechaj ma veď surfujem. Ale okej. Funguje to takto.'
    : 'And I tell them, leave me alone I am surfing. But okay. Here is how it works.';

  console.log(`🎙️ Generating BTS voiceover (${lang})...`);
  console.log(`  Intro: "${intro}"`);
  console.log(`  Question: "${questionText}"`);
  console.log(`  Answer: "${script.slice(0, 60)}..."`);

  // Generate all parts
  // Sequential to avoid rate limits
  const p1 = await tts(intro, BYTE_VOICE, 1.1, 0.5);
  const p2 = await tts(questionText, QUESTIONER_VOICE, 1.0, 0.8);
  const p3 = await tts(answerIntro, BYTE_VOICE, 1.1, 0.4);
  const p4 = await tts(script, BYTE_VOICE, 1.1, 0.5);

  // Save and normalize audio parts
  const parts = [p1, p2, p3, p4];
  const audioPaths: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const rawPath = path.join(outputDir, `bts_${i}_raw.mp3`);
    const normPath = path.join(outputDir, `bts_${i}.mp3`);
    fs.writeFileSync(rawPath, parts[i].audio);
    try {
      execSync(`ffmpeg -y -i "${rawPath}" -af "loudnorm=I=-14:TP=-1:LRA=11" "${normPath}" 2>/dev/null`);
      fs.unlinkSync(rawPath);
    } catch { fs.renameSync(rawPath, normPath); }
    audioPaths.push(normPath);
  }

  // Build word timings with offsets
  const allWords: WordTiming[] = [];
  let cumTime = 0.3; // small initial gap
  const gapBetween = 0.4;

  for (let i = 0; i < parts.length; i++) {
    for (const w of parts[i].words) {
      allWords.push({ word: w.word, start: w.start + cumTime, end: w.end + cumTime });
    }
    cumTime += parts[i].duration + gapBetween;
  }

  // Concatenate with gaps
  const silencePath = path.join(outputDir, 'silence.mp3');
  const gapPath = path.join(outputDir, 'gap.mp3');
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 "${silencePath}" 2>/dev/null`);
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${gapBetween} "${gapPath}" 2>/dev/null`);

  const listFile = path.join(outputDir, 'concat.txt');
  const lines = [`file '${silencePath}'`];
  for (let i = 0; i < audioPaths.length; i++) {
    lines.push(`file '${audioPaths[i]}'`);
    if (i < audioPaths.length - 1) lines.push(`file '${gapPath}'`);
  }
  fs.writeFileSync(listFile, lines.join('\n'));

  const finalAudio = path.join(outputDir, 'bts_final.mp3');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -q:a 2 "${finalAudio}" 2>/dev/null`);

  const durationStr = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${finalAudio}" 2>/dev/null`).toString().trim();
  const totalDuration = parseFloat(durationStr);

  console.log(`✅ BTS voiceover: ${totalDuration.toFixed(1)}s, ${allWords.length} words`);
  return { audioPath: finalAudio, words: allWords, duration: totalDuration };
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
