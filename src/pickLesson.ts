import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface LessonData {
  id: number;
  title: string;
  title_sk: string;
  module_title: string;
  module_title_sk: string;
  introduction: string;
  introduction_sk: string;
  learning_content: string;
  learning_content_sk: string;
  real_world: string;
  real_world_sk: string;
  module_number: number;
  lesson_number: number;
}

export interface SlideModel {
  lesson: LessonData;
  lessonSk: LessonData;
  equipment: Record<string, string>;
  levelBadge: { en: string; sk: string };
  learningChunks: string[];      // EN — split for slides 2-4
  learningChunksSk: string[];    // SK
  caption: string;               // EN
  captionSk: string;             // SK
}

/** Difficulty levels */
type DiffLevel = 'beginner' | 'advanced' | 'professional';

function getLevel(moduleNumber: number): DiffLevel {
  if (moduleNumber >= 18) return 'professional'; // M18-M30: Databases, AI, Python
  if (moduleNumber >= 9) return 'advanced';       // M9-M17: Code, algorithms, languages, networking, APIs
  return 'beginner';                               // M1-M8: Basics, HW/SW, OS, CPU, Memory, Storage
}

const levelLabel = {
  beginner:     { en: 'Beginner',      sk: 'Začiatočník',  emoji: '🟢' },
  advanced:     { en: 'Advanced',      sk: 'Pokročilý',    emoji: '🟡' },
  professional: { en: 'Professional',  sk: 'Profesionál',  emoji: '🔴' },
};

/** Beginner outfits — basic, clean, occasionally one nice piece */
const beginnerOutfits: Record<string, string>[] = [
  { hat: 'hat-beanie' },
  { glasses: 'glasses-round' },
  { hat: 'hat-headband', accessory: 'acc-bowtie' },
  { hat: 'hat-party' },
  { glasses: 'glasses-reading', accessory: 'acc-scarf' },
  { hat: 'hat-beanie', glasses: 'glasses-round' },
  { hat: 'hat-headband' },
  { accessory: 'acc-bowtie', antenna: 'ant-heart' },
];

/** Advanced outfits — rare + epic items, looks cool */
const advancedOutfits: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool', accessory: 'acc-medal' },
  { hat: 'hat-cowboy', glasses: 'glasses-aviator', antenna: 'ant-lightning' },
  { hat: 'hat-pilot', glasses: 'glasses-cool', accessory: 'acc-chain' },
  { hat: 'hat-samurai', glasses: 'glasses-frost', antenna: 'ant-diamond' },
  { hat: 'hat-fire-crown', glasses: 'glasses-flame', accessory: 'acc-fire-cape' },
  { hat: 'hat-ice-crown', glasses: 'glasses-frost', antenna: 'ant-frost-crystal' },
  { hat: 'hat-graduation', glasses: 'glasses-aviator', accessory: 'acc-crystal', aura: 'aura-blue' },
  { hat: 'hat-cowboy', glasses: 'glasses-cool', accessory: 'acc-medal', aura: 'aura-green' },
  { hat: 'hat-samurai', accessory: 'acc-fire-cape', aura: 'aura-fire' },
];

/** Professional outfits — legendary + mythic, fully loaded, glowing */
const professionalOutfits: Record<string, string>[] = [
  { hat: 'hat-golden-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold', aura: 'aura-golden', antenna: 'ant-golden-star' },
  { hat: 'hat-galaxy', glasses: 'glasses-laser', accessory: 'acc-diamond', aura: 'aura-galaxy', antenna: 'ant-sun' },
  { hat: 'hat-void-crown', glasses: 'glasses-void', accessory: 'acc-cosmic-cape', aura: 'aura-void', antenna: 'ant-blackhole' },
  { hat: 'hat-golden-crown', glasses: 'glasses-laser', accessory: 'acc-cosmic-cape', aura: 'aura-cosmic', antenna: 'ant-golden-star' },
  { hat: 'hat-void-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold', aura: 'aura-golden', antenna: 'ant-sun' },
  { hat: 'hat-galaxy', glasses: 'glasses-void', accessory: 'acc-diamond', aura: 'aura-cosmic', antenna: 'ant-blackhole' },
];

/** Pick outfit based on module difficulty + lesson position within module.
 * Early lessons in a module get simpler outfits, later lessons get better ones.
 * This means even in a professional module, lesson 1 starts lighter and builds up. */
function pickEquipment(moduleNumber: number, lessonNumber: number, lessonId: number): Record<string, string> {
  const level = getLevel(moduleNumber);

  if (level === 'professional') {
    // Lesson 1-2: advanced outfit, 3+: full professional
    if (lessonNumber <= 2) {
      return advancedOutfits[(lessonId + 3) % advancedOutfits.length]; // pick different advanced ones
    }
    return professionalOutfits[lessonId % professionalOutfits.length];
  }

  if (level === 'advanced') {
    // Lesson 1-2: beginner with one nice piece, 3-4: advanced, 5+: advanced with aura
    if (lessonNumber <= 2) {
      // Beginner base + one rare item
      const base = beginnerOutfits[lessonId % beginnerOutfits.length];
      return { ...base, antenna: 'ant-lightning' };
    }
    return advancedOutfits[lessonId % advancedOutfits.length];
  }

  // Beginner level
  // Lesson 1-3: very basic, 4+: beginner with occasional extra
  if (lessonNumber <= 3) {
    // Very minimal — just one item
    const minimal: Record<string, string>[] = [
      { hat: 'hat-beanie' },
      { glasses: 'glasses-round' },
      { hat: 'hat-headband' },
      {},
      { accessory: 'acc-bowtie' },
      { antenna: 'ant-heart' },
    ];
    return minimal[lessonId % minimal.length];
  }
  return beginnerOutfits[lessonId % beginnerOutfits.length];
}

/** Replace em dashes (—) with regular dashes (-) and clean up text */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-');
}

// Max characters per slide (1080x1440 at 26px font fits ~600 chars comfortably)
const MAX_CHARS_PER_SLIDE = 500;
const MAX_LINES_PER_SLIDE = 12;
const MAX_TITLE_CHARS = 80;
const MAX_REAL_WORLD_CHARS = 550;

/** Truncate text to max length, keeping only complete sentences */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  // Find all sentence endings (. ! ?) within the limit
  const sentenceEnds = ['.', '!', '?'];
  let lastEnd = -1;
  for (let i = 0; i < max; i++) {
    if (sentenceEnds.includes(text[i]) && (i + 1 >= text.length || text[i + 1] === ' ' || text[i + 1] === '\n')) {
      lastEnd = i + 1;
    }
  }
  // If we found a sentence end, cut there (no "…" needed — it's a clean sentence)
  if (lastEnd > max * 0.3) return text.slice(0, lastEnd).trim();
  // Fallback: cut at word boundary with "…"
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

/** Limit lines in a chunk */
function limitLines(text: string, maxLines: number): string {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join('\n') + '\n…';
}

/** A slide has a heading and body text */
interface SlideContent {
  heading: string;
  body: string;
}

/** Detect if a line looks like a section heading */
function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length > 60 || t.length < 3) return false;
  if (t.endsWith('.') || t.endsWith(';') || t.endsWith(')')) return false;
  if (t.startsWith('-') || t.startsWith('•') || t.startsWith('|')) return false;
  if (/[=(){}\[\]<>;]/.test(t)) return false; // code
  if (/^\d+\./.test(t)) return false; // numbered list
  // Headings are typically short, no punctuation at end, often Title Case
  return true;
}

/** Parse learning content into structured sections (heading + body) */
function parseIntoSections(content: string): SlideContent[] {
  if (!content) return [];

  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const sections: SlideContent[] = [];
  let currentHeading = '';
  let currentBody: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();

    if (isHeadingLine(trimmed) && currentBody.length > 0) {
      // Save current section, start new one
      sections.push({
        heading: currentHeading,
        body: currentBody.join('\n\n'),
      });
      currentHeading = trimmed;
      currentBody = [];
    } else if (isHeadingLine(trimmed) && currentBody.length === 0 && !currentHeading) {
      // First heading
      currentHeading = trimmed;
    } else {
      currentBody.push(trimmed);
    }
  }

  // Push last section
  if (currentBody.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join('\n\n'),
    });
  }

  return sections;
}

/** Build 3 slide contents from learning content.
 * Each slide has a heading + body. Body truncated at sentence boundary. */
function buildSlideContents(content: string, maxSlides = 3): SlideContent[] {
  const sections = parseIntoSections(content);
  if (sections.length === 0) return [{ heading: '', body: truncate(content || '', MAX_CHARS_PER_SLIDE) }];

  // If we have <= maxSlides sections, use them directly
  if (sections.length <= maxSlides) {
    return sections.map(s => ({
      heading: s.heading,
      body: truncate(s.body, MAX_CHARS_PER_SLIDE),
    }));
  }

  // Too many sections — pick evenly spaced ones
  const slides: SlideContent[] = [];
  const step = sections.length / maxSlides;
  for (let i = 0; i < maxSlides; i++) {
    const idx = Math.floor(i * step);
    const section = sections[idx];
    slides.push({
      heading: section.heading,
      body: truncate(section.body, MAX_CHARS_PER_SLIDE),
    });
  }

  return slides;
}

/** Convert SlideContent[] to string[] for backward compat with render */
function slideContentsToChunks(slides: SlideContent[]): string[] {
  return slides.map(s => {
    if (s.heading) return s.heading + '\n' + s.body;
    return s.body;
  });
}

/** Truncate title for slide 1 */
function safeTitle(title: string): string {
  return truncate(title, MAX_TITLE_CHARS);
}

/** Truncate real-world content for slide 5 */
function safeRealWorld(content: string): string {
  if (!content) return '';
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  let result = '';
  for (const p of paragraphs) {
    const trimmed = truncate(p.trim(), 200);
    if (result.length + trimmed.length > MAX_REAL_WORLD_CHARS) break;
    result += (result ? '\n' : '') + trimmed;
  }
  return limitLines(result, MAX_LINES_PER_SLIDE);
}

/** Topic emoji by module number */
const moduleEmoji: Record<number, string> = {
  1: '💻',  // What is Programming?
  2: '🖥️',  // How Computers Work
  3: '🔧',  // Hardware vs Software
  4: '🏗️',  // Computer Architecture
  5: '⚡',  // CPU Explained
  6: '🧠',  // Memory Explained
  7: '💾',  // Storage Explained
  8: '🖱️',  // Operating Systems
  9: '🔤',  // How Computers Understand Code
  10: '📊', // Data Structures & Algorithms
  12: '🌐', // Programming Languages
  13: '⚙️',  // Compilers & Interpreters
  15: '🌍', // Networking
  16: '🔗', // The Internet
  17: '📡', // Clients & Servers
  18: '🔌', // APIs
  19: '🗄️',  // Databases
  22: '🤖', // AI
  30: '🐍', // Python Basics
};

function buildCaption(lesson: LessonData, lang: 'en' | 'sk'): string {
  const title = lang === 'sk' ? (lesson.title_sk || lesson.title) : lesson.title;
  const intro = lang === 'sk' ? (lesson.introduction_sk || lesson.introduction) : lesson.introduction;
  const learning = lang === 'sk' ? (lesson.learning_content_sk || lesson.learning_content) : lesson.learning_content;
  const emoji = moduleEmoji[lesson.module_number] || '📚';
  const level = getLevel(lesson.module_number);
  const lvl = levelLabel[level];

  // Get first definition paragraph from learning
  const firstPara = learning?.split('\n\n').filter(p => p.trim()).slice(0, 2).join('\n\n') || '';

  let caption = '';

  caption += `CODUY #${lesson.id} (${lvl.emoji} ${lang === 'sk' ? lvl.sk : lvl.en}) | ${title}\n\n`;

  // Intro
  if (intro) {
    const introTruncated = truncate(intro, 500);
    caption += introTruncated + '\n\n';
  }

  // First definition from learning
  if (firstPara) {
    const learnTruncated = truncate(firstPara, 600);
    caption += learnTruncated + '\n\n';
  }

  // If caption is still short (< 400 chars), add real_world content
  const realWorld = lang === 'sk' ? (lesson.real_world_sk || lesson.real_world) : lesson.real_world;
  if (caption.length < 400 && realWorld) {
    const rwFirst = realWorld.split('\n\n').filter(p => p.trim()).slice(0, 2).join('\n\n');
    caption += truncate(rwFirst, 400) + '\n\n';
  }

  // CTA
  if (lang === 'sk') {
    caption += '📲 Celá lekcia na Coduy app. Navštív coduy.sk alebo sťahuj free na App Store a Google Play.\n\n';
  } else {
    caption += '📲 Full lesson on Coduy app. Visit coduy.com or download free on the App Store and Google Play.\n\n';
  }

  caption += '#coding #programming #learntocode #coduy #tech #computerscience #developer #software';

  // IG caption limit is 2200 chars
  if (caption.length > 2200) {
    caption = caption.slice(0, 2100) + '\n\n📲 Coduy app - free on App Store\n\n#coding #programming #learntocode #coduy';
  }

  return caption;
}

export async function pickLesson(lessonId?: number): Promise<SlideModel | null> {
  let lesson: LessonData;

  if (lessonId) {
    const { data, error } = await sb
      .from('cb_lessons')
      .select('id, title, title_sk, introduction, introduction_sk, learning_content, learning_content_sk, real_world, real_world_sk, lesson_number, module_id, posted_at')
      .eq('id', lessonId)
      .maybeSingle();
    if (error || !data) { console.error('Lesson not found:', lessonId); return null; }
    // Get module info
    const { data: mod } = await sb.from('cb_modules').select('title, title_sk, module_number').eq('id', data.module_id).single();
    lesson = { ...data, module_title: mod?.title || '', module_title_sk: mod?.title_sk || '', module_number: mod?.module_number || 1 };
  } else {
    // Pick random unposted lesson, rotating between levels
    // Get all unposted lessons grouped by level
    const { data: allUnposted, error } = await sb
      .from('cb_lessons')
      .select('id, title, title_sk, introduction, introduction_sk, learning_content, learning_content_sk, real_world, real_world_sk, lesson_number, module_id, posted_at')
      .is('posted_at', null);
    if (error || !allUnposted || allUnposted.length === 0) { console.log('No unposted lessons remaining'); return null; }

    // Get all modules for level mapping
    const { data: allMods } = await sb.from('cb_modules').select('id, title, title_sk, module_number');
    const modMap = new Map((allMods || []).map(m => [m.id, m]));

    // Group by level
    const byLevel: Record<DiffLevel, typeof allUnposted> = { beginner: [], advanced: [], professional: [] };
    for (const l of allUnposted) {
      const mod = modMap.get(l.module_id);
      const level = getLevel(mod?.module_number || 1);
      byLevel[level].push(l);
    }

    // Count how many of each level have been posted (to rotate)
    const { data: posted } = await sb.from('cb_lessons').select('id, module_id').not('posted_at', 'is', null);
    const postedCounts = { beginner: 0, advanced: 0, professional: 0 };
    for (const p of (posted || [])) {
      const mod = modMap.get(p.module_id);
      const level = getLevel(mod?.module_number || 1);
      postedCounts[level]++;
    }

    // Pick the level with fewest posts (that still has unposted lessons)
    const levelOrder: DiffLevel[] = ['beginner', 'advanced', 'professional'];
    const availableLevels = levelOrder.filter(l => byLevel[l].length > 0);
    if (availableLevels.length === 0) { console.log('No unposted lessons remaining'); return null; }

    // Sort by least posted → pick that level, then random within it
    availableLevels.sort((a, b) => postedCounts[a] - postedCounts[b]);
    const targetLevel = availableLevels[0];
    const pool = byLevel[targetLevel];

    // Random pick from that level
    const data = pool[Math.floor(Math.random() * pool.length)];
    const mod = modMap.get(data.module_id);
    lesson = { ...data, module_title: mod?.title || '', module_title_sk: mod?.title_sk || '', module_number: mod?.module_number || 1 };

    console.log(`🎯 Level rotation: beginner=${postedCounts.beginner} advanced=${postedCounts.advanced} professional=${postedCounts.professional} → picked ${targetLevel}`);
  }

  console.log(`📖 Picked lesson: ${lesson.title} (id=${lesson.id}, module=${lesson.module_number})`);

  const equipment = pickEquipment(lesson.module_number, lesson.lesson_number, lesson.id);

  // Clean all text (em dashes → regular dashes) and apply safe limits
  const safeLessonEn = {
    ...lesson,
    title: safeTitle(cleanText(lesson.title)),
    real_world: safeRealWorld(cleanText(lesson.real_world)),
  };
  const safeLessonSk = {
    ...lesson,
    title: safeTitle(cleanText(lesson.title_sk || lesson.title)),
    title_sk: safeTitle(cleanText(lesson.title_sk || lesson.title)),
    real_world: safeRealWorld(cleanText(lesson.real_world)),
    real_world_sk: safeRealWorld(cleanText(lesson.real_world_sk || lesson.real_world)),
  };

  const level = getLevel(lesson.module_number);
  const lvl = levelLabel[level];

  return {
    lesson: safeLessonEn,
    lessonSk: safeLessonSk,
    equipment,
    levelBadge: {
      en: `${lvl.emoji} ${lvl.en}`,
      sk: `${lvl.emoji} ${lvl.sk}`,
    },
    learningChunks: slideContentsToChunks(buildSlideContents(cleanText(lesson.learning_content || ''))),
    learningChunksSk: slideContentsToChunks(buildSlideContents(cleanText(lesson.learning_content_sk || lesson.learning_content || ''))),
    caption: cleanText(buildCaption(lesson, 'en')),
    captionSk: cleanText(buildCaption(lesson, 'sk')),
  };
}

export async function markPosted(lessonId: number, mediaIdEn: string, mediaIdSk: string) {
  await sb.from('cb_lessons').update({ posted_at: new Date().toISOString() }).eq('id', lessonId);
  console.log(`✅ Marked lesson ${lessonId} as posted (EN: ${mediaIdEn}, SK: ${mediaIdSk})`);
}
