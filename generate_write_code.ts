/**
 * Generate "write code" quiz questions for lessons with code content.
 * User must type the actual code, not just pick from options.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function generateWriteCode(lessonTitle: string, learningContent: string): Promise<any[]> {
  const prompt = `You create "write the code" quiz questions for a Python lesson. The student must TYPE the missing code.

LESSON: ${lessonTitle}

CONTENT:
${learningContent.slice(0, 3000)}

Create exactly 1 "write code" question. Rules:

1. question_text: Clearly describe WHAT the code should do. Be specific.
   Example: "Complete the function so it returns the square of a number"
   Example: "Write the line that prints 'Hello' followed by the user's name"

2. code_snippet: Starter code with a # TODO comment where the student writes.
   Keep it SHORT (3-8 lines). The TODO line should be simple (1 line answer).
   Example:
   def square(n):
       # TODO: return the square of n

3. correct_answer: The EXACT code the student should type (just the missing line, no indent).
   Example: "return n ** 2"
   Keep it simple - ONE line, no complex logic.

4. Make sure the answer is UNAMBIGUOUS - only one correct way to write it.
5. Use code from the lesson content, not invented.

Return valid JSON:
{"questions": [
  {
    "question_text": "Complete the function so it returns the square of a number:",
    "question_text_sk": "Doplň funkciu tak, aby vrátila druhú mocninu čísla:",
    "code_snippet": "def square(n):\\n    # TODO: return the square of n",
    "correct_answer": "return n ** 2"
  }
]}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const arr = parsed.questions || (Array.isArray(parsed) ? parsed : []);
    return arr.filter((q: any) => q.code_snippet && q.correct_answer && q.question_text?.length > 15);
  } catch {
    return [];
  }
}

async function main() {
  console.log('📝 Write-code Generator\n');

  const { data: lessons } = await sb.from('cb_lessons')
    .select('id, title, learning_content')
    .not('learning_content', 'is', null)
    .order('id');

  if (!lessons) { console.log('No lessons'); return; }

  // Get existing question numbers and check for existing write_code
  const { data: existingQs } = await sb.from('cb_quiz_questions')
    .select('lesson_id, question_number, question_type');

  const lessonInfo: Record<number, { maxNum: number; hasWriteCode: boolean }> = {};
  existingQs?.forEach(q => {
    if (!lessonInfo[q.lesson_id]) lessonInfo[q.lesson_id] = { maxNum: 0, hasWriteCode: false };
    lessonInfo[q.lesson_id].maxNum = Math.max(lessonInfo[q.lesson_id].maxNum, q.question_number);
    if (q.question_type === 'write_code') lessonInfo[q.lesson_id].hasWriteCode = true;
  });

  const toProcess = lessons.filter(l =>
    l.learning_content && l.learning_content.length > 200 &&
    (l.learning_content.includes('def ') || l.learning_content.includes('= ') || l.learning_content.includes('print(') || l.learning_content.includes('import ')) &&
    !lessonInfo[l.id]?.hasWriteCode
  );

  console.log(`Found ${toProcess.length} lessons to add write_code questions\n`);

  let added = 0;
  for (const lesson of toProcess) {
    const info = lessonInfo[lesson.id] || { maxNum: 0 };
    console.log(`Processing: ${lesson.id} - ${lesson.title}...`);

    try {
      const questions = await generateWriteCode(lesson.title, lesson.learning_content);
      if (questions.length === 0) { console.log('  SKIP'); continue; }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qNum = info.maxNum + i + 1;

        const { error: qErr } = await sb.from('cb_quiz_questions').insert({
          lesson_id: lesson.id,
          question_number: qNum,
          question_text: q.question_text,
          question_text_sk: q.question_text_sk,
          question_type: 'write_code',
          correct_answer: q.correct_answer,
          code_snippet: q.code_snippet,
        });

        if (qErr) { console.log(`  ERROR: ${qErr.message}`); continue; }
      }

      added += questions.length;
      console.log(`  OK (+${questions.length})`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  FAILED:`, err);
    }
  }

  console.log(`\nDone! Added ${added} write_code questions.`);
}

main().catch(console.error);
