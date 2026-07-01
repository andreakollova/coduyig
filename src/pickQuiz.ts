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
}

export async function pickQuiz(): Promise<QuizData | null> {
  // Get a random MCQ question that hasn't been posted as quiz yet
  const { data: questions, error } = await sb
    .from('cb_quiz_questions')
    .select('id, question_text, question_text_sk, question_type, correct_answer, code_snippet, quiz_posted_at, options:cb_quiz_options(option_label, option_text, option_text_sk, is_correct)')
    .eq('question_type', 'mcq')
    .is('quiz_posted_at', null)
    .order('id');

  if (error || !questions || questions.length === 0) {
    console.log('No unposted quiz questions');
    return null;
  }

  // Random pick
  const q = questions[Math.floor(Math.random() * questions.length)];

  // Count posted for numbering
  const { count } = await sb.from('cb_quiz_questions').select('id', { count: 'exact', head: true }).not('quiz_posted_at', 'is', null);
  const postNumber = (count || 0) + 1;

  // Generate explanation with GPT
  const explanation = await generateExplanation(q, postNumber);

  console.log(`🧠 Picked quiz #${postNumber}: ${q.question_text.slice(0, 60)}...`);

  return {
    ...q,
    options: q.options.sort((a: any, b: any) => a.option_label.localeCompare(b.option_label)),
    explanation,
    postNumber,
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
