/**
 * Fix ALL quiz questions across all lessons:
 * 1. Fix write_code/fill_code: 1-word answers, proper ___ in code, no answer reveal in prompt
 * 2. Add more fill_code questions from lesson 3+
 * 3. Fix grammar EN + SK
 * 4. Case-insensitive answers
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function gpt(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 2000 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function fixWriteCodeQuestions() {
  console.log('=== Fixing existing write_code questions ===\n');

  const { data: questions } = await sb.from('cb_quiz_questions')
    .select('*, lesson:cb_lessons!inner(id, title, title_sk, learning_content)')
    .in('question_type', ['write_code', 'fill_code'])
    .order('id');

  if (!questions) return;
  console.log(`Found ${questions.length} write_code/fill_code questions\n`);

  let fixed = 0;
  for (const q of questions) {
    const lesson = (q as any).lesson;
    const content = lesson?.learning_content?.slice(0, 1500) || '';

    const prompt = `You are fixing a Python fill-in-the-blank quiz question for a coding education app.

CURRENT QUESTION:
- EN: ${q.question_text}
- SK: ${q.question_text_sk || ''}
- Code snippet: ${q.code_snippet || 'none'}
- Current answer: ${q.correct_answer}
- Lesson: ${lesson?.title || ''}

RULES:
1. The answer MUST be exactly 1 word (a Python keyword, function name, or operator)
2. The question text must NOT reveal the answer
3. The code_snippet must show real Python code with ___ where the answer goes
4. The question should describe WHAT needs to be done, not WHAT to type
5. Both EN and SK must be grammatically correct
6. SK: technical terms (Python, print, def, int, str etc.) stay in English
7. No "# TODO" comments in code
8. Answer must be lowercase unless it's a proper name

Return ONLY valid JSON (no markdown):
{
  "question_text": "English question",
  "question_text_sk": "Slovak question",
  "code_snippet": "python code with ___",
  "correct_answer": "answer",
  "explanation": "English explanation (1-2 sentences)",
  "explanation_sk": "Slovak explanation (1-2 sentences)"
}`;

    try {
      const result = await gpt(prompt);
      const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.correct_answer && parsed.question_text && parsed.code_snippet) {
        await sb.from('cb_quiz_questions').update({
          question_text: parsed.question_text,
          question_text_sk: parsed.question_text_sk || parsed.question_text,
          code_snippet: parsed.code_snippet,
          correct_answer: parsed.correct_answer,
          explanation: parsed.explanation || q.explanation,
          explanation_sk: parsed.explanation_sk || q.explanation_sk,
        }).eq('id', q.id);
        fixed++;
        console.log(`  Q${q.id} (L${lesson?.id}): ${parsed.correct_answer} ✅`);
      }
    } catch (e) {
      console.log(`  Q${q.id}: parse error, skipping`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nFixed ${fixed} / ${questions.length} write_code questions\n`);
}

async function addFillCodeQuestions() {
  console.log('=== Adding fill_code questions to lessons 3+ ===\n');

  // Get all lessons that have quiz but few/no fill_code
  const { data: lessons } = await sb.from('cb_lessons')
    .select('id, title, title_sk, learning_content, learning_content_sk')
    .order('id');

  if (!lessons) return;

  for (const lesson of lessons) {
    if (!lesson.learning_content || lesson.learning_content.length < 200) continue;

    // Check existing questions
    const { data: existing } = await sb.from('cb_quiz_questions')
      .select('id, question_type')
      .eq('lesson_id', lesson.id);

    const fillCount = (existing || []).filter(q => q.question_type === 'write_code' || q.question_type === 'fill_code').length;
    const totalCount = (existing || []).length;

    // Skip if already has 2+ fill questions or less than 3 total questions
    if (fillCount >= 2 || totalCount < 3) continue;

    // Need to add fill_code questions
    const needed = Math.min(2 - fillCount, 2);
    if (needed <= 0) continue;

    const content = lesson.learning_content.slice(0, 2000);
    const contentSk = (lesson.learning_content_sk || '').slice(0, 2000);

    const prompt = `You are creating ${needed} fill-in-the-blank Python quiz questions for the lesson "${lesson.title}".

LESSON CONTENT (use this to create relevant questions):
${content.slice(0, 1200)}

RULES:
1. Each answer MUST be exactly 1 word (Python keyword, function, operator, type name)
2. Question describes WHAT to do, NEVER reveals the answer word
3. code_snippet shows real Python code with ___ where the answer goes
4. Questions test understanding of the lesson topic
5. Both EN and SK must be perfect grammar
6. SK: Python/technical terms stay in English (print, def, int, str, list, for, while, if, etc.)
7. Answers must be common Python keywords from the lesson

Return ONLY valid JSON array (no markdown):
[
  {
    "question_text": "English question (what to do, not what to type)",
    "question_text_sk": "Slovak question",
    "code_snippet": "line1\\nline2 with ___\\nline3",
    "correct_answer": "keyword",
    "explanation": "Why this is correct (EN, 1-2 sentences)",
    "explanation_sk": "Why this is correct (SK, 1-2 sentences)"
  }
]`;

    try {
      const result = await gpt(prompt);
      const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) continue;

      const { data: lastQ } = await sb.from('cb_quiz_questions')
        .select('question_number')
        .eq('lesson_id', lesson.id)
        .order('question_number', { ascending: false })
        .limit(1);

      let num = (lastQ?.[0]?.question_number || 0) + 1;

      for (const q of parsed) {
        if (!q.correct_answer || !q.question_text || !q.code_snippet) continue;
        // Validate: answer must be 1 word
        if (q.correct_answer.includes(' ')) continue;

        await sb.from('cb_quiz_questions').insert({
          lesson_id: lesson.id,
          question_number: num++,
          question_text: q.question_text,
          question_text_sk: q.question_text_sk || q.question_text,
          question_type: 'write_code',
          correct_answer: q.correct_answer,
          code_snippet: q.code_snippet,
          explanation: q.explanation || '',
          explanation_sk: q.explanation_sk || '',
        });

        console.log(`  L${lesson.id} (${lesson.title}): +${q.correct_answer}`);
      }
    } catch (e) {
      console.log(`  L${lesson.id}: error, skipping`);
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

async function main() {
  await fixWriteCodeQuestions();
  await addFillCodeQuestions();
  console.log('\n✅ All done!');
}

main().catch(console.error);
