/**
 * Fix missing/weak explanations for all quiz questions.
 * Targets: NULL, empty, or generic "This statement is true/false" explanations.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function generateExplanation(questionText: string, correctAnswer: string, questionType: string, options: string[], codeSnippet?: string): Promise<{ en: string; sk: string }> {
  const prompt = `Quiz question: "${questionText}"
${codeSnippet ? `Code:\n${codeSnippet}` : ''}
Type: ${questionType}
${options.length ? `Options: ${options.join(', ')}` : ''}
Correct answer: ${correctAnswer}

Write a 1-2 sentence explanation of WHY "${correctAnswer}" is the correct answer. Be specific, educational, and explain the concept - don't just restate the answer. For true/false, explain WHY it's true or false.

Return JSON: {"en": "...", "sk": "..."}
SK must be proper Slovak (no Czech).`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  try {
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch { return { en: '', sk: '' }; }
}

function isWeak(explanation: string | null | undefined): boolean {
  if (!explanation || explanation.trim() === '') return true;
  if (explanation.length < 15) return true;
  const weak = [
    'This statement is true',
    'This statement is false',
    'This is true',
    'This is false',
    'The statement is true',
    'The statement is false',
  ];
  return weak.some(w => explanation.trim().toLowerCase().startsWith(w.toLowerCase()));
}

async function main() {
  console.log('Fixing weak/missing explanations...\n');

  // Fetch ALL questions, we'll filter client-side
  let allQuestions: any[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from('cb_quiz_questions')
      .select('id, question_text, correct_answer, code_snippet, question_type, explanation, explanation_sk')
      .order('id')
      .range(offset, offset + 999);
    if (!data?.length) break;
    allQuestions.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  const toFix = allQuestions.filter(q => isWeak(q.explanation));
  console.log(`Total questions: ${allQuestions.length}`);
  console.log(`Need fixing: ${toFix.length}\n`);

  if (!toFix.length) { console.log('All good!'); return; }

  let done = 0, errors = 0;
  for (const q of toFix) {
    const { data: opts } = await sb.from('cb_quiz_options').select('option_text, is_correct').eq('question_id', q.id);
    const optTexts = opts?.map((o: any) => o.option_text) || [];
    const correctText = opts?.find((o: any) => o.is_correct)?.option_text || q.correct_answer || '';

    try {
      const expl = await generateExplanation(q.question_text, correctText, q.question_type, optTexts, q.code_snippet);
      if (expl.en && expl.en.length > 10) {
        await sb.from('cb_quiz_questions').update({ explanation: expl.en, explanation_sk: expl.sk }).eq('id', q.id);
        done++;
      } else {
        errors++;
      }
      if (done % 50 === 0 && done > 0) console.log(`  ${done}/${toFix.length} fixed...`);
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      errors++;
    }
  }

  console.log(`\nDone! Fixed ${done} explanations (${errors} errors).`);
}

main().catch(console.error);
