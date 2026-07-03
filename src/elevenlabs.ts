/**
 * ElevenLabs TTS with word-level timestamps.
 * Uses the /v1/text-to-speech/{voice_id}/with-timestamps endpoint.
 */

import fs from 'fs';
import path from 'path';

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const API = 'https://api.elevenlabs.io/v1';

// Antoni — young, clear male voice (works on free tier)
const DEFAULT_VOICE_ID = 'ErXwobaYiN019PkySvjV';

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface TTSResult {
  audioPath: string;       // path to saved MP3 file
  wordTimings: WordTiming[];
  durationSeconds: number;
}

interface ELCharTimestamp {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/**
 * Convert character-level timestamps to word-level.
 */
function charsToWords(text: string, chars: ELCharTimestamp): WordTiming[] {
  const words: WordTiming[] = [];
  let wordStart = -1;
  let wordChars: string[] = [];

  for (let i = 0; i < chars.characters.length; i++) {
    const ch = chars.characters[i];
    const startTime = chars.character_start_times_seconds[i];
    const endTime = chars.character_end_times_seconds[i];

    if (ch === ' ' || ch === '\n') {
      // End of word
      if (wordChars.length > 0 && wordStart >= 0) {
        words.push({
          word: wordChars.join(''),
          start: wordStart,
          end: chars.character_end_times_seconds[i - 1],
        });
        wordChars = [];
        wordStart = -1;
      }
    } else {
      if (wordStart < 0) wordStart = startTime;
      wordChars.push(ch);
    }
  }

  // Last word
  if (wordChars.length > 0 && wordStart >= 0) {
    words.push({
      word: wordChars.join(''),
      start: wordStart,
      end: chars.character_end_times_seconds[chars.characters.length - 1],
    });
  }

  return words;
}

export async function generateTTS(
  text: string,
  outputDir: string,
  voiceId = DEFAULT_VOICE_ID,
): Promise<TTSResult> {
  if (!API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }

  console.log(`🎙️ Generating TTS (${text.split(/\s+/).length} words)...`);

  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${err}`);
  }

  const data = await res.json();

  // data.audio_base64 — the audio
  // data.alignment — character timestamps
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const audioPath = path.join(outputDir, 'voiceover.mp3');
  fs.writeFileSync(audioPath, audioBuffer);
  console.log(`✅ Audio saved: ${audioPath} (${(audioBuffer.length / 1024).toFixed(0)} KB)`);

  // Convert character timestamps to word timestamps
  const wordTimings = charsToWords(text, data.alignment);
  console.log(`✅ Word timings: ${wordTimings.length} words`);

  // Duration = end time of last word + small padding
  const durationSeconds = wordTimings.length > 0
    ? wordTimings[wordTimings.length - 1].end + 0.5
    : 5;

  // Save timestamps for debugging
  const tsPath = path.join(outputDir, 'timestamps.json');
  fs.writeFileSync(tsPath, JSON.stringify({ wordTimings, durationSeconds }, null, 2));

  return { audioPath, wordTimings, durationSeconds };
}
