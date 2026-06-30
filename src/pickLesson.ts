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

/** Split learning content into 3 chunks for slides 2-4 */
function chunkContent(content: string, maxChunks = 3): string[] {
  if (!content) return [''];

  const paragraphs = content.split('\n\n').filter(p => p.trim());
  if (paragraphs.length <= maxChunks) return paragraphs;

  // Split into roughly equal groups
  const chunkSize = Math.ceil(paragraphs.length / maxChunks);
  const chunks: string[] = [];
  for (let i = 0; i < maxChunks; i++) {
    const slice = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
    chunks.push(slice.join('\n\n'));
  }
  return chunks;
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

  return {
    lesson,
    equipment,
    learningChunks: chunkContent(lesson.learning_content || ''),
    learningChunksSk: chunkContent(lesson.learning_content_sk || lesson.learning_content || ''),
    caption: buildCaption(lesson, 'en'),
    captionSk: buildCaption(lesson, 'sk'),
  };
}

export async function markPosted(lessonId: number, mediaIdEn: string, mediaIdSk: string) {
  await sb.from('cb_lessons').update({ posted_at: new Date().toISOString() }).eq('id', lessonId);
  console.log(`✅ Marked lesson ${lessonId} as posted (EN: ${mediaIdEn}, SK: ${mediaIdSk})`);
}
