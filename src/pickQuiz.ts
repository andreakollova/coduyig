import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export interface QuizData {
  id: number;
  question_text: string;
  question_text_sk: string;
  question_type: string;
  correct_answer: string;
  code_snippet: string | null;
  options: { option_label: string; option_text: string; option_text_sk: string; is_correct: boolean }[];
  explanation: { en: string; sk: string };
  postNumber: number;
  equipment: Record<string, string>;
}

// Outfit based on module difficulty
const beginnerOutfits: Record<string, string>[] = [
  { hat: 'hat-beanie' }, { glasses: 'glasses-round' }, { hat: 'hat-headband' },
  { accessory: 'acc-bowtie' }, { antenna: 'ant-heart' }, {},
];
const advancedOutfits: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool' },
  { hat: 'hat-cowboy', glasses: 'glasses-aviator' },
  { hat: 'hat-samurai', glasses: 'glasses-frost' },
  { hat: 'hat-fire-crown', glasses: 'glasses-flame' },
];
const professionalOutfits: Record<string, string>[] = [
  { hat: 'hat-golden-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold' },
  { hat: 'hat-galaxy', glasses: 'glasses-laser', accessory: 'acc-diamond' },
  { hat: 'hat-void-crown', glasses: 'glasses-void', accessory: 'acc-cosmic-cape' },
];

export async function pickQuiz(): Promise<QuizData | null> {
  // Get a random MCQ question that hasn't been posted as quiz yet
  const { data: questions, error } = await sb
    .from('cb_quiz_questions')
    .select('id, lesson_id, question_text, question_text_sk, question_type, correct_answer, code_snippet, quiz_posted_at, options:cb_quiz_options(option_label, option_text, option_text_sk, is_correct)')
    .eq('question_type', 'mcq')
    .is('quiz_posted_at', null)
    .order('id');

  if (error || !questions || questions.length === 0) {
    console.log('No unposted quiz questions');
    return null;
  }

  // Filter: must have SK translations + options not too long (max 6 words)
  const valid = questions.filter((q: any) => {
    // Must have SK question text
    if (!q.question_text_sk) return false;
    // All options must have SK text
    if (!q.options?.every((o: any) => o.option_text_sk)) return false;
    // Options max 6 words (EN or SK)
    if (q.options?.some((o: any) => (o.option_text || '').split(/\s+/).length > 6)) return false;
    if (q.options?.some((o: any) => (o.option_text_sk || '').split(/\s+/).length > 6)) return false;
    return true;
  });

  if (valid.length === 0) {
    console.log('No valid quiz questions (missing SK translations or options too long)');
    return null;
  }

  // Prefer easier questions — from lower modules (beginner/intermediate)
  // Get lesson → module mapping to determine difficulty
  const lessonIds = valid.map((q: any) => q.lesson_id);
  const { data: lessons } = await sb.from('cb_lessons').select('id, module_id').in('id', lessonIds);
  const { data: modules } = await sb.from('cb_modules').select('id, module_number');
  const modMap = new Map(modules?.map((m: any) => [m.id, m.module_number]) || []);
  const lessonModMap = new Map(lessons?.map((l: any) => [l.id, modMap.get(l.module_id) || 99]) || []);

  // Sort by module number — lower modules = easier questions
  // Pick from bottom 60% (easy + medium)
  const sorted = valid.sort((a: any, b: any) => {
    const modA = lessonModMap.get(a.lesson_id) || 99;
    const modB = lessonModMap.get(b.lesson_id) || 99;
    return modA - modB;
  });
  const easyMedium = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.6)));
  const q = easyMedium[Math.floor(Math.random() * easyMedium.length)];

  // Get module number for outfit — question → lesson → module
  const { data: lessonData } = await sb.from('cb_lessons').select('module_id').eq('id', q.lesson_id).maybeSingle();
  let moduleNumber = 1;
  if (lessonData) {
    const { data: modData } = await sb.from('cb_modules').select('module_number').eq('id', lessonData.module_id).maybeSingle();
    moduleNumber = modData?.module_number || 1;
  }

  // Pick outfit based on difficulty
  let equipment: Record<string, string>;
  if (moduleNumber >= 18) {
    equipment = professionalOutfits[q.id % professionalOutfits.length];
  } else if (moduleNumber >= 9) {
    equipment = advancedOutfits[q.id % advancedOutfits.length];
  } else {
    equipment = beginnerOutfits[q.id % beginnerOutfits.length];
  }

  // Count posted for numbering
  const { count } = await sb.from('cb_quiz_questions').select('id', { count: 'exact', head: true }).not('quiz_posted_at', 'is', null);
  const postNumber = (count || 0) + 1;

  // Generate explanation with GPT
  const explanation = await generateExplanation(q, postNumber);

  console.log(`🧠 Picked quiz #${postNumber}: ${q.question_text.slice(0, 60)}... (module=${moduleNumber})`);

  return {
    ...q,
    options: q.options.sort((a: any, b: any) => a.option_label.localeCompare(b.option_label)),
    explanation,
    postNumber,
    equipment,
  };
}

async function generateExplanation(q: any, num: number): Promise<{ en: string; sk: string }> {
  if (!OPENAI_KEY) return { en: 'The correct answer helps you understand this concept better.', sk: 'Správna odpoveď ti pomôže lepšie pochopiť tento koncept.' };

  const correctOpt = q.options.find((o: any) => o.is_correct);
  const prompt = `Question: ${q.question_text}\nCorrect answer: ${correctOpt?.option_text || q.correct_answer}\n\nWrite a SHORT explanation (2-3 sentences, max 150 chars) of WHY this is the correct answer. Educational tone.`;

  try {
    const [enRes, skRes] = await Promise.all([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 200 }),
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt + '\n\nWrite in SLOVAK (slovenčina). Never Czech.' }], temperature: 0.3, max_tokens: 200 }),
      }),
    ]);
    const en = (await enRes.json()).choices?.[0]?.message?.content?.trim() || '';
    const sk = (await skRes.json()).choices?.[0]?.message?.content?.trim() || '';
    return { en, sk };
  } catch {
    return { en: 'This is a fundamental concept in programming.', sk: 'Toto je základný koncept v programovaní.' };
  }
}

export async function markQuizPosted(questionId: number) {
  await sb.from('cb_quiz_questions').update({ quiz_posted_at: new Date().toISOString() }).eq('id', questionId);
}
