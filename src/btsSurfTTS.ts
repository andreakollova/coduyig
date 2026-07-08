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

  // Part 1+2 combined: Byte intro + questioner question in one line
  const introAndQuestion = lang === 'sk'
    ? `Ľudia sa ma často pýtajú, kámo ale čo sa vlastne stane keď ${question.replace(/^Čo sa stane keď /i, '').replace(/\?$/, '')}?`
    : `People keep asking me, dude what actually happens when you ${question.replace(/^What happens when (you )?/i, '').replace(/\?$/, '')}?`;

  // Part 3a: "Nechaj ma" / "Leave me alone"
  const answerPart1 = lang === 'sk'
    ? 'A ja im odpoviem: Nechaj ma.'
    : 'And I tell them: Leave me alone.';

  // Part 3b: "veď surfujem!" / "I am surfing!"
  const answerPart2 = lang === 'sk'
    ? 'Veď surfujem!'
    : 'I am surfing!';

  // Part 3c: "Ale v pohode... funguje to takto." / "But ok... here is how it works."
  const answerPart3 = lang === 'sk'
    ? 'Ale v pohode... funguje to takto.'
    : 'But ok... here is how it works.';

  // Part 6: Closing
  const closing = lang === 'sk' ? 'Takže vlastne, nič zložité, kámo.' : 'So yeah, nothing complicated, dude.';

  console.log(`🎙️ Generating BTS voiceover (${lang})...`);
  console.log(`  Intro+Q: "${introAndQuestion.slice(0, 80)}..."`);
  console.log(`  Answer: "${script.slice(0, 60)}..."`);

  // Generate all parts
  // Sequential to avoid rate limits
  const p1 = await tts(introAndQuestion, QUESTIONER_VOICE, 0.95, 0.7);
  const p3a = await tts(answerPart1, BYTE_VOICE, 1.0, 0.5);
  const p3b = await tts(answerPart2, BYTE_VOICE, 1.0, 0.6);
  const p3c = await tts(answerPart3, BYTE_VOICE, 0.95, 0.4);
  const p4 = await tts(script, BYTE_VOICE, 1.0, 0.5);
  const p5 = await tts(closing, BYTE_VOICE, 0.85, 0.6);

  // Save and normalize audio parts
  const parts = [p1, p3a, p3b, p3c, p4, p5];
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
  const longerGap = 0.8; // longer pause after "surfujem!" before explanation

  for (let i = 0; i < parts.length; i++) {
    const partWords = parts[i].words;
    for (let j = 0; j < partWords.length; j++) {
      let word = partWords[j].word;
      // No separate quote wrapping needed — it's all one line now
      allWords.push({ word, start: partWords[j].start + cumTime, end: partWords[j].end + cumTime });
    }
    // Longer pause after "surfujem!" (index 2) and after "Ale v pohode" (index 3)
    const gap = (i === 2 || i === 3) ? longerGap : gapBetween;
    cumTime += parts[i].duration + gap;
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
