/**
 * ElevenLabs TTS — supports two voices for conversational reels.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const API = 'https://api.elevenlabs.io/v1';

// Voices per language
const VOICES = {
  en: {
    teacher: 'Ewvy14akxdhONg4fmNry', // was 3TStB8f3X3To0Uj5R7RK
    student: 's3TPKV1kjDlVtZbl4Ksh',
  },
  sk: {
    teacher: 'Ewvy14akxdhONg4fmNry', // was DXwrzy2wtKORwDTbsMwk
    student: '5TUD5nYN251MvBggIfLu',
  },
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

/** Map English programming terms to phonetic Slovak pronunciation for TTS */
const SK_PHONETICS: Record<string, string> = {
  'dnes': 'dnes',
  'Dnes': 'Dnes',
  'try': 'traj',
  'Try': 'Traj',
  'except': 'eksept',
  'Except': 'Eksept',
  'print': 'print',
  'import': 'import',
  'lambda': 'lambda',
  'while': 'vajl',
  'While': 'Vajl',
  'break': 'brejk',
  'Break': 'Brejk',
  'continue': 'kontinju',
  'Continue': 'Kontinju',
  'raise': 'rejz',
  'Raise': 'Rejz',
  'yield': 'jíld',
  'Yield': 'Jíld',
  'async': 'ejsink',
  'Async': 'Ejsink',
  'await': 'evejt',
  'Await': 'Evejt',
  'None': 'nan',
  'True': 'trú',
  'False': 'fóls',
  'tuple': 'tapl',
  'Tuple': 'Tapl',
  'cache': 'keš',
  'Cache': 'Keš',
  'thread': 'tred',
  'Thread': 'Tred',
  'scope': 'skóup',
  'Scope': 'Skóup',
  'debug': 'dybag',
  'Debug': 'Dybag',
  'debugger': 'dybager',
  'Debugger': 'Dybager',
  'loop': 'lúp',
  'Loop': 'Lúp',
  'boolean': 'búlián',
  'Boolean': 'Búlián',
  'byte': 'bajt',
  'Byte': 'Bajt',
  'float': 'flóut',
  'Float': 'Flóut',
  'string': 'string',
  'queue': 'kjú',
  'Queue': 'Kjú',
  'stack': 'stek',
  'Stack': 'Stek',
  'slice': 'slajs',
  'Slice': 'Slajs',
  'range': 'rejndž',
  'Range': 'Rejndž',
  'finally': 'fajneli',
  'Finally': 'Fajneli',
  'TypeError': 'tajp eror',
  'ValueError': 'velju eror',
  'KeyError': 'kí eror',
  'IndexError': 'index eror',
  'NameError': 'nejm eror',
  'FileNotFoundError': 'fajl not faund eror',
  'ZeroDivisionError': 'zíro divížn eror',
  'AttributeError': 'etribjút eror',
  // Abbreviations from lessons
  'LEGB': 'el í džé bí',
  'OWASP': 'ou vasp',
  'TDD': 'tí dí dí',
  'GIL': 'džé aj el',
  'PEP': 'pep',
  'CISC': 'sisk',
  'RISC': 'risk',
  'JIT': 'džit',
  'CSV': 'sí es ví',
  'API': 'ej pí aj',
  'REST': 'rest',
  'DNS': 'dí en es',
  'SQL': 'es kjú el',
  'JSON': 'džejson',
  'OS': 'ou es',
  'CPU': 'sí pí jú',
  'RAM': 'rem',
  'SSD': 'es es dí',
  'HDD': 'ejč dí dí',
  'AI': 'ej aj',
  'ID': 'aj dí',
  'VS': 'ví es',
  'README': 'ríd mí',
  // Python tools & modules
  'asyncio': 'ejsink aj ou',
  'pytest': 'paj test',
  'pdb': 'pí dí bí',
  'pip': 'pip',
  'venv': 'ví env',
  'deque': 'dek',
  'defaultdict': 'dífólt dikt',
  'contextlib': 'kontekst lib',
  'enumerate': 'enumerejt',
  'filter': 'filter',
  'reduce': 'ridjús',
  'map': 'mep',
  'zip': 'zip',
  'elif': 'el if',
  'match': 'meč',
  'global': 'glóbl',
  'nonlocal': 'non lóukl',
  // Common English terms in lessons
  'append': 'epend',
  'extend': 'exténd',
  'insert': 'inzert',
  'remove': 'rimúv',
  'pop': 'pop',
  'sort': 'sort',
  'reverse': 'rivérs',
  'split': 'split',
  'join': 'džojn',
  'strip': 'strip',
  'replace': 'ripléjs',
  'format': 'formát',
  'upper': 'aper',
  'lower': 'lóuer',
  'encode': 'enkóud',
  'decode': 'dekóud',
  'class': 'klas',
  'self': 'self',
  'init': 'init',
  'super': 'super',
  'property': 'property',
  'setter': 'seter',
  'getter': 'geter',
  'decorator': 'dekorejtor',
  'Decorator': 'Dekorejtor',
  'wrapper': 'vraper',
  'closure': 'klóužr',
  'Closure': 'Klóužr',
  'iterator': 'iterejtor',
  'Iterator': 'Iterejtor',
  'generator': 'dženerejtor',
  'Generator': 'Dženerejtor',
  'dataclass': 'dejta klas',
  'Dataclass': 'Dejta klas',
  'frozen': 'fróuzn',
  'Frozen': 'Fróuzn',
  'enum': 'ínam',
  'Enum': 'Ínam',
  'regex': 'redžeks',
  'Regex': 'Redžeks',
  'logging': 'loging',
  'Logging': 'Loging',
  'fixture': 'fikstúr',
  'Fixture': 'Fikstúr',
  'mock': 'mok',
  'Mock': 'Mok',
  'mocking': 'moking',
  'Mocking': 'Moking',
  'coverage': 'kaveridž',
  'Coverage': 'Kaveridž',
  'profiling': 'profajling',
  'Profiling': 'Profajling',
  'benchmark': 'benčmárk',
  'Benchmark': 'Benčmárk',
  'multiprocessing': 'malti prosesing',
  'Multiprocessing': 'Malti prosesing',
  'threading': 'treding',
  'Threading': 'Treding',
  'synchronization': 'sinkronizejšn',
  'bytecode': 'bajtkóud',
  'Bytecode': 'Bajtkóud',
  'garbage': 'gárbidž',
  'refactoring': 'refektoring',
  'Refactoring': 'Refektoring',
  // Company names
  'Airbnb': 'ér bí en bí',
  'Spotify': 'spotifaj',
  'Netflix': 'netfliks',
  'Shopify': 'šopifaj',
  'Stripe': 'strajp',
  'Discord': 'diskord',
  'Slack': 'slek',
  'GitHub': 'githab',
  'Uber': 'úber',
  'Tesla': 'tesla',
  'Cloudflare': 'klaudflér',
  'Figma': 'figma',
  'Notion': 'nóušn',
  'Vercel': 'versél',
  'Twitch': 'tvič',
  'Reddit': 'redit',
  'Pinterest': 'pinterest',
  'Dropbox': 'dropboks',
  'Adobe': 'adobi',
  'OpenAI': 'óupen ej aj',
  'Google': 'gúgl',
  'Facebook': 'fejsbúk',
  'Instagram': 'instagram',
  'WhatsApp': 'votsep',
  'YouTube': 'jútjúb',
  'Amazon': 'amazon',
  'Microsoft': 'majkrosoft',
  'Apple': 'epl',
  'PyPI': 'paj pí aj',
  'QR': 'kjú ár',
  // Common programming terms
  'library': 'lajbreri',
  'Library': 'Lajbreri',
  'function': 'fankšn',
  'Function': 'Fankšn',
  'method': 'metód',
  'Method': 'Metód',
  'parameter': 'parameter',
  'Parameter': 'Parameter',
  'exception': 'eksepšn',
  'Exception': 'Eksepšn',
  'module': 'modjúl',
  'Module': 'Modjúl',
  'export': 'eksport',
  'Export': 'Eksport',
  'instance': 'instens',
  'Instance': 'Instens',
  'constructor': 'konštráktor',
  'Constructor': 'Konštráktor',
  'attribute': 'etribjút',
  'Attribute': 'Etribjút',
  'testing': 'testing',
  'Testing': 'Testing',
  'debugging': 'dybaging',
  'optimization': 'optimizejšn',
  'Optimization': 'Optimizejšn',
  'caching': 'kešing',
  'Caching': 'Kešing',
  'process': 'proses',
  'Process': 'Proses',
  'hosting': 'hosting',
  'Hosting': 'Hosting',
  'authentication': 'otentifikejšn',
  'Authentication': 'Otentifikejšn',
  'versioning': 'veržning',
  'Versioning': 'Veržning',
  'documentation': 'dokjumentejšn',
  'Documentation': 'Dokjumentejšn',
  'production': 'prodakšn',
  'Production': 'Prodakšn',
  'collection': 'kolekšn',
  'Collection': 'Kolekšn',
  // Surf topic terms
  'clipboard': 'klipbórd',
  'Clipboard': 'Klipbórd',
  'AirDrop': 'érdrop',
  'Bluetooth': 'blútúf',
  'NFC': 'en ef sí',
  'GPS': 'džé pí es',
  'USB': 'jú es bí',
  'ZIP': 'zip',
  'cookies': 'kúkís',
  'Cookies': 'Kúkís',
  'hallucinate': 'halusinéjt',
  'multicore': 'malti kór',
  'certificate': 'sertifikát',
  'Certificate': 'Sertifikát',
  'compression': 'kompréšn',
  'Compression': 'Kompréšn',
  'surfujem': 'surfujem',
  'surfuje': 'surfuje',
  // Common lesson terms that get mispronounced by multilingual voice
  'hash': 'heš',
  'Hash': 'Heš',
  'hashing': 'hešing',
  'Hashing': 'Hešing',
  'nested': 'nested',
  'Nested': 'Nested',
  'syntax': 'sinteks',
  'Syntax': 'Sinteks',
  'runtime': 'rantajm',
  'Runtime': 'Rantajm',
  'overhead': 'óuverhéd',
  'callback': 'kolbek',
  'Callback': 'Kolbek',
  'middleware': 'midlvér',
  'Middleware': 'Midlvér',
  'webhook': 'vebhúk',
  'Webhook': 'Vebhúk',
  'deploy': 'diploj',
  'Deploy': 'Diploj',
  'deployment': 'diplojment',
  'Deployment': 'Diplojment',
  'framework': 'frejmvork',
  'Framework': 'Frejmvork',
  'frontend': 'frontend',
  'Frontend': 'Frontend',
  'backend': 'bekend',
  'Backend': 'Bekend',
  'database': 'dejtabejs',
  'Database': 'Dejtabejs',
  'socket': 'soket',
  'Socket': 'Soket',
  'websocket': 'vebsoket',
  'WebSocket': 'Vebsoket',
  'endpoint': 'endpoint',
  'Endpoint': 'Endpoint',
  'payload': 'pejlóud',
  'Payload': 'Pejlóud',
  'header': 'heder',
  'Header': 'Heder',
  'token': 'tóukn',
  'Token': 'Tóukn',
  'parsing': 'parsing',
  'Parsing': 'Parsing',
  'compiler': 'kompajler',
  'Compiler': 'Kompajler',
  'interpreter': 'interpreter',
  'Interpreter': 'Interpreter',
  'variable': 'veriábl',
  'Variable': 'Veriábl',
  'immutable': 'imjútabl',
  'Immutable': 'Imjútabl',
  'mutable': 'mjútabl',
  'Mutable': 'Mjútabl',
  'iterable': 'iterábl',
  'Iterable': 'Iterábl',
  'callable': 'kolábl',
  'Callable': 'Kolábl',
  'hashable': 'hešábl',
  'Hashable': 'Hešábl',
  'inheritance': 'inheritens',
  'Inheritance': 'Inheritens',
  'polymorphism': 'polimorfizm',
  'Polymorphism': 'Polimorfizm',
  'encapsulation': 'enkapsulejšn',
  'Encapsulation': 'Enkapsulejšn',
  'abstraction': 'ebstrekšn',
  'Abstraction': 'Ebstrekšn',
  'composition': 'kompozíšn',
  'Composition': 'Kompozíšn',
  'concurrency': 'konkurensi',
  'Concurrency': 'Konkurensi',
  'deadlock': 'dedlok',
  'Deadlock': 'Dedlok',
  'breakpoint': 'brejkpojnt',
  'Breakpoint': 'Brejkpojnt',
  'traceback': 'trejsbek',
  'Traceback': 'Trejsbek',
  'stacktrace': 'stektréjs',
  'assertion': 'aséršn',
  'Assertion': 'Asréšn',
  'singleton': 'singltón',
  'Singleton': 'Singltón',
  'pattern': 'petérn',
  'Pattern': 'Petérn',
  'design': 'dizajn',
  'Design': 'Dizajn',
  'package': 'pekidž',
  'Package': 'Pekidž',
  'packaging': 'pekidžing',
  'Packaging': 'Pekidžing',
  'dependency': 'dipendensi',
  'Dependency': 'Dipendensi',
  'dependencies': 'dipendensi',
  'virtual': 'vírčuál',
  'Virtual': 'Vírčuál',
  'environment': 'envajronment',
  'Environment': 'Envajronment',
  'requirements': 'rikvajerments',
  'Requirements': 'Rikvajerments',
  'scheduling': 'šedjúling',
  'Scheduling': 'Šedjúling',
  'serialization': 'sirializejšn',
  'deserialization': 'dísirializejšn',
};

// EN: only apply phonetics to abbreviations (uppercase terms), not regular English words
const EN_ABBREV_ONLY = new Set(
  Object.keys(SK_PHONETICS).filter(k => {
    const isAbbrev = k === k.toUpperCase() || ['IoT', 'OAuth', 'GraphQL'].includes(k);
    const isRegularWord = /^[a-z]/.test(k) || ['Secure', 'Shell', 'True', 'False', 'None'].includes(k)
      || k.endsWith('Error') || ['Try', 'Except', 'While', 'Break', 'Continue', 'Raise', 'Yield',
        'Async', 'Await', 'Tuple', 'Cache', 'Thread', 'Scope', 'Debug', 'Debugger', 'Loop',
        'Boolean', 'Byte', 'Float', 'Queue', 'Stack', 'Slice', 'Range', 'Finally'].includes(k);
    return isAbbrev && !isRegularWord;
  })
);

function applyPhonetics(text: string, lang: 'en' | 'sk'): string {
  let result = text;
  const sorted = Object.entries(SK_PHONETICS).sort((a, b) => b[0].length - a[0].length);
  for (const [en, sk] of sorted) {
    // For EN: only replace abbreviations, skip regular English words
    if (lang === 'en' && !EN_ABBREV_ONLY.has(en)) continue;
    result = result.replace(new RegExp(`\\b${en}\\b`, 'g'), sk);
  }
  return result;
}

/**
 * Auto-generate phonetics for any English words not in the static map.
 * Uses GPT to convert remaining English words to Slovak phonetic spelling.
 */
const OPENAI_KEY_EL = process.env.OPENAI_API_KEY || '';
async function autoPhonetics(text: string, lang: 'en' | 'sk'): Promise<string> {
  if (lang !== 'sk' || !OPENAI_KEY_EL) return applyPhonetics(text, lang);

  // First apply static phonetics
  let result = applyPhonetics(text, lang);

  // Check if there are remaining English words (not Slovak)
  const remaining = result.match(/\b[A-Za-z][a-z]{2,}\b/g)?.filter(w => {
    // Skip Slovak words (have diacritics context), Python keywords, common words
    if (/[áéíóúýžščťďľňŕĺô]/.test(w)) return false;
    if (['def', 'return', 'class', 'self', 'for', 'while', 'with', 'from', 'import',
      'print', 'and', 'not', 'are', 'the', 'that', 'this', 'you', 'can', 'will',
      'just', 'like', 'have', 'has', 'had', 'was', 'were', 'been', 'into', 'when',
      'also', 'more', 'than', 'each', 'very', 'them', 'then', 'only', 'its',
      'ako', 'ale', 'pre', 'pri', 'kde', 'tak', 'sem', 'len', 'pod', 'nad',
      'surfujem', 'funguje', 'takto', 'vlastne', 'okej', 'odpoviem', 'nechaj'].includes(w.toLowerCase())) return false;
    return true;
  }) || [];

  if (remaining.length === 0) return result;

  // Use GPT to generate phonetics for remaining English words
  try {
    const unique = [...new Set(remaining)];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY_EL}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `Convert these English words to Slovak phonetic spelling (how a Slovak person would write their pronunciation). Return JSON: {"phonetics": {"word": "phonetic"}}

Words: ${unique.join(', ')}

Examples: style→stajl, type→tajp, scope→skóup, cache→keš, thread→tred, queue→kjú, slice→slajs, range→rejndž, yield→jíld, raise→rejz, while→vajl, break→brejk` }],
        temperature: 0, max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const phonetics = JSON.parse(data.choices?.[0]?.message?.content || '{}').phonetics || {};

    for (const [en, sk] of Object.entries(phonetics) as [string, string][]) {
      result = result.replace(new RegExp(`\\b${en}\\b`, 'g'), sk);
    }
  } catch {}

  return result;
}

async function ttsLine(text: string, voiceId: string, lang: 'en' | 'sk' = 'en', speed = 1.3, speaker: 'student' | 'teacher' = 'teacher', enthusiastic = false): Promise<{ audioBuffer: Buffer; wordTimings: WordTiming[]; duration: number }> {
  // Apply static phonetics only — no GPT auto-phonetics (was causing Slovak word mispronunciation)
  const ttsText = applyPhonetics(text, lang);
  const originalWords = text.split(/\s+/);
  // Multilingual v2 for both — same voice used for EN and SK
  const model = 'eleven_multilingual_v2';
  const isSkStudent = lang === 'sk' && speaker === 'student';
  const isSkTeacher = lang === 'sk' && speaker === 'teacher';

  // Higher stability = more consistent volume across lines (crucial for student)
  const isEnStudent = lang === 'en' && speaker === 'student';
  const isEnTeacher = lang === 'en' && speaker === 'teacher';
  let stability = isSkStudent ? 0.65 : isSkTeacher ? 0.3 : isEnStudent ? 0.65 : 0.5;
  let style = isSkStudent ? 0.3 : isSkTeacher ? 0.8 : isEnStudent ? 0.35 : 0.55;
  if (enthusiastic) {
    stability = 0.35;
    style = 0.85;
  }

  const res = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: ttsText,
      model_id: model,
      voice_settings: {
        stability,
        similarity_boost: 0.75,
        style,
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
  const wordTimings = charsToWords(data.alignment);

  // Replace phonetic words with original text for captions
  if (lang === 'sk') {
    for (let i = 0; i < wordTimings.length && i < originalWords.length; i++) {
      wordTimings[i].word = originalWords[i];
    }
  }

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
  lang: 'en' | 'sk' = 'en',
): Promise<ConversationTTS> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  const voices = VOICES[lang];
  console.log(`🎙️ Generating conversation TTS (${lines.length} lines, ${lang.toUpperCase()})...`);

  const result: LineTTS[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const voiceId = voices[line.speaker];

    // Skip empty lines (e.g. silent CTA)
    if (!line.spoken || line.spoken.trim() === '') {
      console.log(`  Line ${i + 1} [${line.speaker}]: (silent)`);
      result.push({ speaker: line.speaker, audioPath: '', wordTimings: [], durationSeconds: 0 });
      continue;
    }

    console.log(`  Line ${i + 1} [${line.speaker}]: "${line.spoken.slice(0, 50)}..."`);

    // Last student line (summary) speaks slower for clarity
    const isLastStudentLine = line.speaker === 'student' && i === lines.length - 2;
    let baseSpeed = 1.3;
    if (line.speaker === 'student') baseSpeed = 1.1;
    const lineSpeed = isLastStudentLine ? 0.95 : baseSpeed;

    // Never use enthusiastic mode - it causes volume inconsistency
    const { audioBuffer, wordTimings, duration } = await ttsLine(line.spoken, voiceId, lang, lineSpeed, line.speaker, false);

    // Save raw audio then normalize volume
    const rawPath = path.join(outputDir, `line_${i}_raw.mp3`);
    const audioPath = path.join(outputDir, `line_${i}.mp3`);
    fs.writeFileSync(rawPath, audioBuffer);

    // Normalize audio: compressor evens out dynamics, then loudnorm sets consistent level
    // Two-step is crucial for short clips (greetings etc.) where loudnorm alone fails
    try {
      execSync(`ffmpeg -y -i "${rawPath}" -af "acompressor=threshold=-25dB:ratio=4:attack=5:release=50:makeup=3,loudnorm=I=-14:TP=-1:LRA=7" "${audioPath}" 2>/dev/null`);
      fs.unlinkSync(rawPath);
    } catch {
      // If ffmpeg fails, use raw audio
      fs.renameSync(rawPath, audioPath);
    }

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
