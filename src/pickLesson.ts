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
  learningChunks: string[];      // EN — split for slides 2-4
  learningChunksSk: string[];    // SK
  caption: string;               // EN
  captionSk: string;             // SK
}

/** Pick outfit based on module difficulty */
function pickEquipment(moduleNumber: number): Record<string, string> {
  if (moduleNumber >= 19) {
    // Mythic tier
    return { hat: 'hat-void-crown', glasses: 'glasses-void', accessory: 'acc-cosmic-cape', aura: 'aura-cosmic' };
  }
  if (moduleNumber >= 15) {
    // Legendary tier
    return { hat: 'hat-golden-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold', aura: 'aura-golden' };
  }
  if (moduleNumber >= 10) {
    // Epic tier
    return { hat: 'hat-fire-crown', glasses: 'glasses-flame', accessory: 'acc-fire-cape', aura: 'aura-fire' };
  }
  if (moduleNumber >= 5) {
    // Rare tier
    return { hat: 'hat-graduation', glasses: 'glasses-cool', accessory: 'acc-medal' };
  }
  // Common tier
  return { hat: 'hat-beanie', glasses: 'glasses-round' };
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

/** Split learning content into 3 chunks for slides 2-4, each within char limit */
function chunkContent(content: string, maxChunks = 3): string[] {
  if (!content) return [''];

  const paragraphs = content.split('\n\n').filter(p => p.trim());
  if (paragraphs.length === 0) return [''];

  // Build chunks that fit within char limit
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = truncate(para.trim(), 200); // single paragraph max 200 chars
    if (currentChunk.length + trimmed.length > MAX_CHARS_PER_SLIDE && currentChunk.length > 0) {
      chunks.push(limitLines(currentChunk.trim(), MAX_LINES_PER_SLIDE));
      currentChunk = trimmed;
      if (chunks.length >= maxChunks) break;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + trimmed;
    }
  }
  if (currentChunk && chunks.length < maxChunks) {
    chunks.push(limitLines(currentChunk.trim(), MAX_LINES_PER_SLIDE));
  }

  // Ensure we have at least 1 chunk
  return chunks.length > 0 ? chunks : [''];
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

/** Extract first definition/paragraph for caption (max ~1500 chars for safety) */
function buildCaption(lesson: LessonData, lang: 'en' | 'sk'): string {
  const title = lang === 'sk' ? lesson.title_sk : lesson.title;
  const intro = lang === 'sk' ? lesson.introduction_sk : lesson.introduction;
  const learning = lang === 'sk' ? lesson.learning_content_sk : lesson.learning_content;

  // Get first meaningful paragraph from learning
  const firstParagraphs = learning?.split('\n\n').slice(0, 3).join('\n\n') || '';

  let caption = `📚 ${title}\n\n`;
  caption += intro ? intro.slice(0, 500) + '\n\n' : '';
  caption += firstParagraphs.slice(0, 800) + '\n\n';

  if (lang === 'sk') {
    caption += '👉 Viac na Coduy app\n\n';
  } else {
    caption += '👉 Learn more on Coduy app\n\n';
  }

  caption += '#coding #programming #learntocode #coduy #tech #computerscience #developer #software';

  // IG caption limit is 2200 chars
  if (caption.length > 2200) {
    caption = caption.slice(0, 2150) + '...\n\n#coding #programming #learntocode #coduy';
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
    // Pick next unposted lesson
    const { data, error } = await sb
      .from('cb_lessons')
      .select('id, title, title_sk, introduction, introduction_sk, learning_content, learning_content_sk, real_world, real_world_sk, lesson_number, module_id, posted_at')
      .is('posted_at', null)
      .order('id')
      .limit(1)
      .maybeSingle();
    if (error || !data) { console.log('No unposted lessons remaining'); return null; }
    const { data: mod } = await sb.from('cb_modules').select('title, title_sk, module_number').eq('id', data.module_id).single();
    lesson = { ...data, module_title: mod?.title || '', module_title_sk: mod?.title_sk || '', module_number: mod?.module_number || 1 };
  }

  console.log(`📖 Picked lesson: ${lesson.title} (id=${lesson.id}, module=${lesson.module_number})`);

  const equipment = pickEquipment(lesson.module_number);

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

  return {
    lesson: safeLessonEn,
    lessonSk: safeLessonSk,
    equipment,
    learningChunks: chunkContent(cleanText(lesson.learning_content || '')),
    learningChunksSk: chunkContent(cleanText(lesson.learning_content_sk || lesson.learning_content || '')),
    caption: cleanText(buildCaption(lesson, 'en')),
    captionSk: cleanText(buildCaption(lesson, 'sk')),
  };
}

export async function markPosted(lessonId: number, mediaIdEn: string, mediaIdSk: string) {
  await sb.from('cb_lessons').update({ posted_at: new Date().toISOString() }).eq('id', lessonId);
  console.log(`✅ Marked lesson ${lessonId} as posted (EN: ${mediaIdEn}, SK: ${mediaIdSk})`);
}
