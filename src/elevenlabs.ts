/**
 * ElevenLabs TTS — supports two voices for conversational reels.
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const API = 'https://api.elevenlabs.io/v1';

// Two voices for conversation
const VOICES = {
  teacher: 'q0IMILNRPxOgtBTS4taI', // Drew — casual, curious, fun
  student: 's3TPKV1kjDlVtZbl4Ksh', // Ada — young, curious
};

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface LineTTS {
  speaker: 'student' | 'teacher';
  audioPath: string;
  wordTimings: WordTiming[];
  durationSeconds: number;
}

export interface ConversationTTS {
  lines: LineTTS[];
  totalDuration: number;
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
    const en = chars.character_end_times_seconds[i];

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

async function ttsLine(text: string, voiceId: string): Promise<{ audioBuffer: Buffer; wordTimings: WordTiming[]; duration: number }> {
  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.4, use_speaker_boost: true, speed: 1.15 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  const data: ELResponse = await res.json();
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const wordTimings = charsToWords(data.alignment);
  const duration = wordTimings.length > 0 ? wordTimings[wordTimings.length - 1].end + 0.3 : 2;

  return { audioBuffer, wordTimings, duration };
}

/**
 * Generate TTS for a multi-line conversation.
 * Each line gets its own audio file with word timings.
 * Timings are offset so they're sequential (line 2 starts after line 1 ends).
 */
export async function generateConversationTTS(
  lines: { speaker: 'student' | 'teacher'; spoken: string }[],
  outputDir: string,
): Promise<ConversationTTS> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  console.log(`🎙️ Generating conversation TTS (${lines.length} lines)...`);

  const result: LineTTS[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const voiceId = VOICES[line.speaker];

    console.log(`  Line ${i + 1} [${line.speaker}]: "${line.spoken.slice(0, 50)}..."`);

    const { audioBuffer, wordTimings, duration } = await ttsLine(line.spoken, voiceId);

    // Save audio file
    const audioPath = path.join(outputDir, `line_${i}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);

    // Offset word timings to be sequential
    const offsetTimings = wordTimings.map(w => ({
      word: w.word,
      start: w.start + cumulativeTime,
      end: w.end + cumulativeTime,
    }));

    result.push({
      speaker: line.speaker,
      audioPath,
      wordTimings: offsetTimings,
      durationSeconds: duration,
    });

    // Small gap between lines (0.3s pause)
    cumulativeTime += duration + 0.3;
  }

  const totalDuration = cumulativeTime;
  console.log(`✅ Conversation: ${lines.length} lines, ${totalDuration.toFixed(1)}s total`);

  // Save timestamps
  fs.writeFileSync(path.join(outputDir, 'timestamps.json'), JSON.stringify({ lines: result, totalDuration }, null, 2));

  return { lines: result, totalDuration };
}
