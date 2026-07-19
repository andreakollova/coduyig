/**
 * Generate explanations for all quiz questions.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function generateExplanation(questionText: string, correctAnswer: string, options: string[], codeSnippet?: string): Promise<{ en: string; sk: string }> {
  const prompt = `Quiz question: "${questionText}"
${codeSnippet ? `Code: ${codeSnippet}` : ''}
Options: ${options.join(', ')}
Correct answer: ${correctAnswer}

Write a 1-sentence explanation of WHY this is the correct answer. Be specific and educational. Return JSON: {"en": "...", "sk": "..."}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  try {
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch { return { en: '', sk: '' }; }
}

async function main() {
  console.log('📝 Generating explanations...\n');

  const { data: questions } = await sb.from('cb_quiz_questions')
    .select('id, question_text, correct_answer, code_snippet, question_type, explanation')
    .is('explanation', null)
    .order('id')
    .limit(500);

  if (!questions?.length) { console.log('No questions need explanations'); return; }
  console.log(`Found ${questions.length} questions without explanations\n`);

  let done = 0;
  for (const q of questions) {
    const { data: opts } = await sb.from('cb_quiz_options').select('option_text, is_correct').eq('question_id', q.id);
    const optTexts = opts?.map(o => o.option_text) || [];
    const correctText = opts?.find(o => o.is_correct)?.option_text || q.correct_answer;

    try {
      const expl = await generateExplanation(q.question_text, correctText, optTexts, q.code_snippet);
      if (expl.en) {
        await sb.from('cb_quiz_questions').update({ explanation: expl.en, explanation_sk: expl.sk }).eq('id', q.id);
        done++;
        if (done % 20 === 0) console.log(`  ${done}/${questions.length}...`);
      }
      await new Promise(r => setTimeout(r, 200));
    } catch {}
  }

  console.log(`\nDone! Generated ${done} explanations.`);
}

main().catch(console.error);
