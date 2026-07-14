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
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const API = 'https://api.elevenlabs.io/v1';

async function generateWordExplanations(term: string, termFull: string, definition: string, lang: 'sk' | 'en'): Promise<string[]> {
  if (!OPENAI_KEY) {
    // Fallback
    const words = termFull.split(' ');
    if (lang === 'sk') {
      return words.map(w => `${w} znamená, že ${definition.toLowerCase()}.`);
    }
    return words.map(w => `${w} means ${definition.toLowerCase()}.`);
  }

  const words = termFull.split(' ');
  const prompt = lang === 'sk'
    ? `Skratka: ${term} = ${termFull}
Definícia: ${definition}

Pre každé slovo z "${termFull}" napíš JEDNU krátku vetu vo formáte:
"[Slovo] znamená, že [krátke vysvetlenie max 8 slov]."

Pravidlá:
- Max 8 slov po "znamená, že"
- Jednoduché, zrozumiteľné
- Žiadne analógie, žiadne príklady
- Slovenčina (NIKDY čeština)
- Vrať LEN JSON pole reťazcov

Príklad pre SSH = Secure Shell:
["Secure znamená, že spojenie je bezpečné a šifrované.", "Shell znamená, že ovládaš počítač na diaľku cez terminál."]

Vrať JSON objekt: {"lines": ["...", "..."]}

Pre ${termFull}:`
    : `Abbreviation: ${term} = ${termFull}
Definition: ${definition}

For each word in "${termFull}" write ONE short sentence in the format:
"[Word] means [short explanation max 8 words]."

Rules:
- Max 8 words after "means"
- Simple, clear
- No analogies, no examples
- Return ONLY a JSON array of strings

Example for SSH = Secure Shell:
["Secure means the connection is safe and encrypted.", "Shell means you control a computer through a terminal."]

Return JSON object: {"lines": ["...", "..."]}

For ${termFull}:`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    const parsed = JSON.parse(content);
    const arr = parsed.lines || (Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray)) || [];
    if (arr.length >= words.length) return arr.slice(0, words.length);
  } catch (e) {
    console.error('GPT explanation generation failed:', e);
  }

  // Fallback
  if (lang === 'sk') {
    return words.map(w => `${w} znamená, že ${definition.toLowerCase()}.`);
  }
  return words.map(w => `${w} means ${definition.toLowerCase()}.`);
}

// Voice IDs per language
const VOICES = {
  sk: { teacher: 'DXwrzy2wtKORwDTbsMwk', student: '5TUD5nYN251MvBggIfLu', bytefall: 'Ewvy14akxdhONg4fmNry' },
  en: { teacher: '3TStB8f3X3To0Uj5R7RK', student: 's3TPKV1kjDlVtZbl4Ksh', bytefall: 'Ewvy14akxdhONg4fmNry' },
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

// EN phonetics — only abbreviations (uppercase), no regular English words

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
  'OOP': 'ó ó pé',
  'RAM': 'rem',
  'CPU': 'sí pí jú',
  'GPU': 'džé pí jú',
  'SSD': 'es es dí',
  'HDD': 'ejč dí dí',
  'IoT': 'aj ou tí',
  'AI': 'ej aj',
  'ID': 'aj dí',
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
  // New abbreviations
  'SSL': 'es es el',
  'TLS': 'tí el es',
  'URI': 'jú ár aj',
  'CSV': 'sí es ví',
  'ORM': 'ou ár em',
  'BIOS': 'bajos',
  'UEFI': 'jú í ef aj',
  'OS': 'ou es',
  'VM': 'ví em',
  'VPS': 'ví pí es',
  'JSX': 'džej es eks',
  'CSR': 'sí es ár',
  'SSR': 'es es ár',
  'SSG': 'es es džé',
  'ISR': 'aj es ár',
  'SPA': 'es pí ej',
  'PWA': 'pí dablju ej',
  'MVC': 'em ví sí',
  'MVVM': 'em ví ví em',
  'FP': 'ef pí',
  'MCP': 'em sí pí',
  'LLM': 'el el em',
  'VLM': 'ví el em',
  'RAG': 'reg',
  'A2A': 'ej tú ej',
  'CoT': 'sí ou tí',
  'MoE': 'em ou í',
  'RLHF': 'ár el ejč ef',
  'TTS': 'tí tí es',
  'STT': 'es tí tí',
  'NLP': 'en el pí',
  'CV': 'sí ví',
  'ASR': 'ej es ár',
  'GPT': 'džé pí tí',
  'LoRA': 'lora',
  'PEFT': 'peft',
  'RL': 'ár el',
  'OCR': 'ou sí ár',
  'UUID': 'jú jú aj dí',
  'CI/CD': 'sí aj sí dí',
  'TS': 'tí es',
  'AWS': 'ej dablju es',
  'GraphQL': 'graf kjú el',
  // termFull words — English pronunciation for SK voice
  'Application': 'eplikejšn',
  'Programming': 'prógraming',
  'Interface': 'interfejs',
  'Command': 'kománd',
  'Line': 'lajn',
  'Graphical': 'grafikal',
  'User': 'júzer',
  'Integrated': 'integrejtid',
  'Development': 'divélopment',
  'Environment': 'envajronment',
  'Software': 'softvér',
  'Kit': 'kit',
  'Secure': 'sekjúr',
  'Shell': 'šel',
  'HyperText': 'hajpertekst',
  'Transfer': 'transfer',
  'Protocol': 'protokol',
  'Transmission': 'transmišn',
  'Control': 'kontról',
  'Internet': 'internet',
  'Domain': 'domejn',
  'Name': 'nejm',
  'System': 'sistém',
  'Uniform': 'júniform',
  'Resource': 'rízorc',
  'Locator': 'lokejtor',
  'Identifier': 'ajdentifajer',
  'Sockets': 'sokéts',
  'Layer': 'lejer',
  'Security': 'sekjúriti',
  'Transport': 'transport',
  'Content': 'kontent',
  'Delivery': 'deliveri',
  'Network': 'netvork',
  'Virtual': 'vírčuál',
  'Private': 'prajvit',
  'JavaScript': 'džáva skript',
  'Object': 'objékt',
  'Notation': 'notejšn',
  'eXtensible': 'extensibl',
  'Extensible': 'extensibl',
  'Markup': 'markup',
  'Language': 'lengvidž',
  'Comma': 'koma',
  'Separated': 'separejtid',
  'Values': 'valjúz',
  'Structured': 'strakčrd',
  'Query': 'kvíri',
  'Relational': 'rilejšnl',
  'Mapping': 'meping',
  'Create': 'krijejt',
  'Read': 'ríd',
  'Update': 'apdejt',
  'Delete': 'dilít',
  'Token': 'tóukn',
  'Open': 'óupn',
  'Authorization': 'otorizejšn',
  'Central': 'central',
  'Processing': 'prosesing',
  'Unit': 'júnit',
  'Graphics': 'grafiks',
  'Random': 'random',
  'Access': 'ekses',
  'Memory': 'memori',
  'Solid': 'solid',
  'State': 'stejt',
  'Drive': 'drajv',
  'Hard': 'hárd',
  'Disk': 'disk',
  'Basic': 'bejsik',
  'Input': 'input',
  'Output': 'autput',
  'Unified': 'júnifajd',
  'Firmware': 'fírmvér',
  'Operating': 'operejting',
  'Machine': 'mašín',
  'Server': 'server',
  'Document': 'dokjument',
  'Model': 'model',
  'Client': 'klajent',
  'Side': 'sajd',
  'Rendering': 'rendering',
  'Static': 'statik',
  'Site': 'sajt',
  'Generation': 'dženerejšn',
  'Incremental': 'inkrementl',
  'Regeneration': 'ridženerejšn',
  'Single': 'singl',
  'Page': 'pejdž',
  'Progressive': 'progresív',
  'Web': 'veb',
  'App': 'ep',
  'View': 'vjú',
  'Controller': 'kontroler',
  'ViewModel': 'vjú model',
  'Oriented': 'orientid',
  'Functional': 'fankšnl',
  'Context': 'kontekst',
  'Large': 'lárdž',
  'Vision': 'vížn',
  'Retrieval': 'ritrívl',
  'Augmented': 'ogmentid',
  'Agent': 'ejdžent',
  'Chain': 'čejn',
  'Thought': 'tót',
  'Mixture': 'mikstúr',
  'Experts': 'eksperts',
  'Reinforcement': 'rínforsment',
  'Learning': 'lérning',
  'Human': 'hjúmen',
  'Feedback': 'fídbek',
  'Text': 'tekst',
  'Speech': 'spíč',
  'Natural': 'nečrl',
  'Computer': 'kompjúter',
  'Automatic': 'otomatic',
  'Recognition': 'rekogníšn',
  'Generative': 'dženeretív',
  'Pre-trained': 'prí trejnd',
  'Transformer': 'transformer',
  'Low': 'ló',
  'Rank': 'renk',
  'Adaptation': 'edeptejšn',
  'Parameter': 'parameter',
  'Efficient': 'efišnt',
  'Fine-Tuning': 'fajn tjúning',
  'Optical': 'optikal',
  'Character': 'kerekter',
  'Universally': 'junivérzli',
  'Unique': 'juník',
  'Continuous': 'kontinuás',
  'Integration': 'integrejšn',
  'Node': 'nóud',
  'Package': 'pekidž',
  'Manager': 'menedžer',
  'Version': 'veržn',
  'Cascading': 'kaskejding',
  'Style': 'stajl',
  'Sheets': 'šíts',
  'QR': 'kjú ár',
  'npm': 'en pí em',
  'Git': 'git',
  // From lessons
  'LEGB': 'el í džé bí',
  'OWASP': 'ou vasp',
  'TDD': 'tí dí dí',
  'GIL': 'džé aj el',
  'PEP': 'pep',
  'CISC': 'sisk',
  'RISC': 'risk',
  'JIT': 'džit',
  'VS': 'ví es',
  'OOP': 'ó ó pé',
  'SMTP': 'es em tí pí',
  'IMAP': 'aj mep',
};

// Only abbreviations for EN — skip regular English words
const EN_ONLY_ABBREVS = new Set(
  Object.keys(SK_PHONETICS).filter(k => {
    // Keep abbreviations (mostly uppercase or known mixed-case)
    const isAbbrev = k === k.toUpperCase() || ['IoT', 'OAuth', 'LoRA', 'CoT', 'MoE', 'GraphQL', 'CI/CD', 'JSX'].includes(k);
    // Skip regular English words
    const skipWords = ['Secure', 'Shell', 'try', 'Try', 'except', 'Except', 'print', 'import', 'lambda',
      'while', 'While', 'break', 'Break', 'continue', 'Continue', 'raise', 'Raise', 'yield', 'Yield',
      'async', 'Async', 'await', 'Await', 'None', 'True', 'False', 'tuple', 'Tuple', 'cache', 'Cache',
      'thread', 'Thread', 'scope', 'Scope', 'debug', 'Debug', 'debugger', 'Debugger', 'loop', 'Loop',
      'boolean', 'Boolean', 'byte', 'Byte', 'float', 'Float', 'string', 'queue', 'Queue', 'stack', 'Stack',
      'slice', 'Slice', 'range', 'Range', 'finally', 'Finally',
      'TypeError', 'ValueError', 'KeyError', 'IndexError', 'NameError', 'FileNotFoundError',
      'ZeroDivisionError', 'AttributeError'];
    return isAbbrev && !skipWords.includes(k);
  })
);
// EN TTS (ElevenLabs) reads most abbreviations correctly on its own.
// Only override the few that it mispronounces.
const EN_PHONETICS: Record<string, string> = {
  'CRUD': 'crud',
  'AJAX': 'ay-jax',
  'OAuth': 'oh-auth',
  'UEFI': 'you-ee-eff-eye',
  'JSX': 'jay-ess-ex',
  'LEGB': 'ell-ee-gee-bee',
  'OWASP': 'oh-wasp',
  'CISC': 'sisk',
  'RISC': 'risk',
  'JIT': 'jit',
  'GIL': 'gill',
  'CI/CD': 'see-eye see-dee',
};

// Build a mapping from original words to their phonetic expansions
function buildWordMap(text: string, lang: 'sk' | 'en' = 'sk'): { ttsText: string; originalWords: string[]; phoneticGroups: number[] } {
  const originalWords = text.split(/\s+/).filter(Boolean);
  const ttsWords: string[] = [];
  const phoneticGroups: number[] = [];

  const phoneticsMap = lang === 'sk' ? SK_PHONETICS : EN_PHONETICS;
  const sorted = Object.entries(phoneticsMap).sort((a, b) => b[0].length - a[0].length);

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
  const { ttsText, originalWords, phoneticGroups } = buildWordMap(text, lang);

  const model = 'eleven_multilingual_v2';

  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: ttsText,
      model_id: model,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.4,
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
    if (origIdx >= 0 && origIdx === lastOrigIdx && mergedTimings.length > 0) {
      // Extend the end time of the current merged word
      mergedTimings[mergedTimings.length - 1].end = rawTimings[ti].end;
    } else if (origIdx >= 0 && origIdx < originalWords.length) {
      mergedTimings.push({
        word: originalWords[origIdx],
        start: rawTimings[ti].start,
        end: rawTimings[ti].end,
      });
      lastOrigIdx = origIdx;
    } else {
      // Extra words from TTS beyond our mapping — use raw word, don't merge
      const rawWord = rawTimings[ti].word.replace(/[.,!?;:]/g, '').trim();
      if (rawWord) {
        mergedTimings.push({
          word: rawTimings[ti].word,
          start: rawTimings[ti].start,
          end: rawTimings[ti].end,
        });
      }
      lastOrigIdx = -1;
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

  const voiceId = VOICES[lang].bytefall;
  const parts = termFull.split(' ');
  const word1 = parts[0] || '';
  const word2 = parts[1] || '';

  // Random exciting intro
  const skIntros = [
    'Čaute kamoši!',
    'Ahojte kamoši!',
    'Čaute kamoši!',
    'Ahojte kamoši!',
  ];
  const enIntros = [
    'Yo, guys!',
    'Hey guys!',
    'Yo, guys!',
    'Hey guys!',
  ];
  const introGreeting = lang === 'sk'
    ? skIntros[Math.floor(Math.random() * skIntros.length)]
    : enIntros[Math.floor(Math.random() * enIntros.length)];

  const introLine = lang === 'sk'
    ? `${introGreeting} Dnes si vysvetlíme ďalšiu skratku!`
    : `${introGreeting} Today we are breaking down another abbreviation!`;

  // Build script based on language
  const explains = await generateWordExplanations(term, termFull, definition, lang);

  let script: string[];
  if (lang === 'sk') {
    script = [
      introLine,
      `${term}! ${termFull}.`,
      ...explains,
      `${term}. ${termFull}.`,
      (() => {
        const sk = [
          'Ak chceš vedieť viac, celé vysvetlenie nájdeš v popise pod videom.',
          'Kompletnejšie vysvetlenie tejto skratky nájdeš v popise.',
          'Viac detailov nájdeš v popise, určite si to prečítaj.',
          'Celé vysvetlenie som ti napísal do popisu pod videom.',
        ];
        return sk[Math.floor(Math.random() * sk.length)];
      })(),
    ];
  } else {
    script = [
      introLine,
      `${term}! ${termFull}.`,
      ...explains,
      `${term}!`,
      `${termFull}.`,
      (() => {
        const en = [
          'If you want to know more, the full explanation is in the description below.',
          'Check the description for a more complete breakdown of this one.',
          'I wrote a full explanation in the caption, make sure to check it out.',
          'More details are in the description below the video.',
        ];
        return en[Math.floor(Math.random() * en.length)];
      })(),
    ];
  }

  console.log(`🎙️ Generating ByteFall voiceover for ${term} (${lang}, ${voice})...`);

  const allWords: WordTiming[] = [];
  const audioParts: string[] = [];
  let cumTime = 1.0; // Start at 1s — 0.5s visible before speaking

  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    console.log(`  Part ${i + 1}: "${line}"`);

    const speed = lang === 'sk' ? (i === script.length - 1 ? 1.3 : 1.1) : (i === script.length - 1 ? 1.1 : 1.2);
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
  execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 1.0 "${silencePath}" 2>/dev/null`);

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

// Random equipment for ByteFall — different every time
// Every outfit has something colorful (blue/purple/orange/gold/fire/frost)
const BYTEFALL_OUTFITS: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool' },           // blue sunglasses
  { hat: 'hat-cowboy', glasses: 'glasses-aviator' },             // brown hat
  { hat: 'hat-pilot', glasses: 'glasses-frost' },                // blue frost glasses
  { hat: 'hat-samurai', glasses: 'glasses-frost' },              // blue frost
  { hat: 'hat-fire-crown', glasses: 'glasses-flame' },           // orange fire
  { hat: 'hat-ice-crown', glasses: 'glasses-frost' },            // blue ice
  { hat: 'hat-ice-crown', glasses: 'glasses-cool' },             // blue mix
  { hat: 'hat-golden-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold' },  // gold
  { hat: 'hat-void-crown', glasses: 'glasses-void', accessory: 'acc-cosmic-cape' },     // purple
  { hat: 'hat-galaxy', glasses: 'glasses-laser', accessory: 'acc-diamond' },            // galaxy purple
  { hat: 'hat-fire-crown', glasses: 'glasses-aviator' },         // orange + brown
  { hat: 'hat-samurai', glasses: 'glasses-flame' },              // red samurai
];

export function randomByteFallEquipment(): Record<string, string> {
  return BYTEFALL_OUTFITS[Math.floor(Math.random() * BYTEFALL_OUTFITS.length)];
}

export async function generateCaptionExplanation(term: string, termFull: string, definition: string, lang: 'sk' | 'en'): Promise<string> {
  const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
  if (!OPENAI_KEY) return '';

  const prompt = lang === 'sk'
    ? `Napíš 2 krátke odstavce (každý 2-3 vety) vysvetľujúce čo je ${term} (${termFull}) a prečo je to dôležité v programovaní. Píš jednoducho, pre začiatočníkov. Slovensky. Bez nadpisov, bez odrážok, len čistý text.`
    : `Write 2 short paragraphs (2-3 sentences each) explaining what ${term} (${termFull}) is and why it matters in programming. Write simply, for beginners. No headings, no bullet points, just plain text.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    if (text) console.log(`📝 [${lang}] Caption explanation generated (${text.split(/\s+/).length} words)`);
    return text;
  } catch (err) {
    console.error('⚠️ Caption explanation failed:', err);
    return '';
  }
}

export async function byteFallCaption(term: string, termFull: string, definition: string, lang: 'sk' | 'en', termNumber?: number): Promise<string> {
  const counter = termNumber ? ` #${termNumber}` : '';
  const explanation = await generateCaptionExplanation(term, termFull, definition, lang);
  const explBlock = explanation ? `\n\n${explanation}` : '';

  if (lang === 'sk') {
    return `🪂 Parachute Glossary${counter}: ${term}

Daj si parachute glossary so mnou! 🪂

${term} = ${termFull}

${definition}${explBlock}

Vedel si to? 🤔💬
Ulož si to a zdieľaj s niekým, kto sa učí programovať! 🔖

📲 Celý slovník na Coduy app - coduy.sk

#coding #programming #developer #learntocode #coduy #tech #glossary #${term.toLowerCase().replace(/[^a-z]/g, '')}`;
  }

  return `🪂 Parachute Glossary${counter}: ${term}

Join me for a parachute glossary! 🪂

${term} = ${termFull}

${definition}${explBlock}

Did you know this one? 🤔💬
Save it & share with someone learning to code! 🔖

📲 Full glossary on Coduy app - coduy.com

#coding #programming #developer #learntocode #coduy #tech #glossary #${term.toLowerCase().replace(/[^a-z]/g, '')}`;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('byteFallTTS.ts')) {
  const lang = (process.argv[2] || 'sk') as 'sk' | 'en';
  const voice = (process.argv[3] || 'student') as 'teacher' | 'student';
  const term = process.argv[4] || 'SSH';
  const termFull = process.argv[5] || 'Secure Shell';
  const definition = process.argv[6] || 'Bezpečný komunikačný protokol na vzdialený prístup k serverom';

  const equipment = randomByteFallEquipment();
  console.log('🎽 Equipment:', JSON.stringify(equipment));

  generateByteFallVoiceover(term, termFull, definition, path.join(__dirname, '../out/bytefall_tts'), lang, voice)
    .then(result => {
      console.log('Audio:', result.audioPath);
      console.log('Words:', JSON.stringify(result.words, null, 2));
      // Save words + equipment for Remotion props
      fs.writeFileSync(
        path.join(__dirname, '../out/bytefall_tts/words.json'),
        JSON.stringify(result.words, null, 2),
      );
      fs.writeFileSync(
        path.join(__dirname, '../out/bytefall_tts/equipment.json'),
        JSON.stringify(equipment, null, 2),
      );
    })
    .catch(err => { console.error(err); process.exit(1); });
}
