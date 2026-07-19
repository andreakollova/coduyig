/**
 * Generate "fill in the code" quiz questions for all lessons.
 * Each question includes context explaining WHAT the code should do.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function generateFillCode(lessonTitle: string, learningContent: string): Promise<any[]> {
  const prompt = `You are creating "fill in the code" quiz questions for a Python programming lesson.

LESSON: ${lessonTitle}

LEARNING CONTENT:
${learningContent.slice(0, 3000)}

Create exactly 2 "fill in the code" questions. CRITICAL RULES:

1. The question_text MUST describe WHAT the code is trying to do, so there is ONLY ONE correct answer.
   BAD: "Fill in the blank:" (ambiguous - multiple answers could work)
   GOOD: "Complete the code to check if the user is 18 or older:" (only >= makes sense)
   GOOD: "Complete the code to print the user's name:" (only print makes sense)
   GOOD: "Complete the code to convert the input to an integer:" (only int makes sense)

2. The code_snippet must have exactly ONE blank shown as ___
3. The blank replaces a keyword, function name, or value
4. 4 options (A, B, C, D) where exactly ONE is correct
5. The wrong options must be PLAUSIBLE but clearly wrong given the context
6. Code must come from the lesson content
7. question_text_sk must be proper Slovak with diacritics

Return valid JSON:
{"questions": [
  {
    "question_text": "Complete the code to convert the user's input to a whole number:",
    "question_text_sk": "Doplň kód na prevod vstupu používateľa na celé číslo:",
    "code_snippet": "age = ___(input('Enter your age: '))",
    "correct_answer": "A",
    "options": [
      {"label": "A", "text": "int", "text_sk": "int", "is_correct": true},
      {"label": "B", "text": "str", "text_sk": "str", "is_correct": false},
      {"label": "C", "text": "list", "text_sk": "list", "is_correct": false},
      {"label": "D", "text": "bool", "text_sk": "bool", "is_correct": false}
    ]
  }
]}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const arr = parsed.questions || (Array.isArray(parsed) ? parsed : []);
    return arr.filter((q: any) => q.code_snippet && q.options?.length === 4 && q.question_text?.length > 20);
  } catch {
    return [];
  }
}

async function main() {
  console.log('🧩 Fill-in-the-code Generator v2\n');

  const { data: lessons } = await sb.from('cb_lessons')
    .select('id, title, learning_content')
    .not('learning_content', 'is', null)
    .order('id');

  if (!lessons) { console.log('No lessons'); return; }

  // Get existing question numbers per lesson
  const { data: existingQs } = await sb.from('cb_quiz_questions')
    .select('lesson_id, question_number');

  const maxNums: Record<number, number> = {};
  existingQs?.forEach(q => {
    maxNums[q.lesson_id] = Math.max(maxNums[q.lesson_id] || 0, q.question_number);
  });

  // Only lessons with enough code content
  const toProcess = lessons.filter(l =>
    l.learning_content && l.learning_content.length > 200 &&
    (l.learning_content.includes('=') || l.learning_content.includes('def ') || l.learning_content.includes('import '))
  );

  console.log(`Found ${toProcess.length} lessons with code content\n`);

  let added = 0;
  for (const lesson of toProcess) {
    console.log(`Processing: ${lesson.id} - ${lesson.title}...`);

    try {
      const questions = await generateFillCode(lesson.title, lesson.learning_content);
      if (questions.length === 0) {
        console.log('  SKIP');
        continue;
      }

      const baseNum = maxNums[lesson.id] || 0;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qNum = baseNum + i + 1;

        const { data: inserted, error: qErr } = await sb.from('cb_quiz_questions').insert({
          lesson_id: lesson.id,
          question_number: qNum,
          question_text: q.question_text,
          question_text_sk: q.question_text_sk,
          question_type: 'fill_code',
          correct_answer: q.correct_answer,
          code_snippet: q.code_snippet,
        }).select('id').single();

        if (qErr || !inserted) {
          console.log(`  ERROR: ${qErr?.message}`);
          continue;
        }

        const options = q.options.map((o: any) => ({
          question_id: inserted.id,
          option_label: o.label,
          option_text: o.text,
          option_text_sk: o.text_sk || o.text,
          is_correct: o.is_correct,
        }));

        await sb.from('cb_quiz_options').insert(options);
      }

      added += questions.length;
      console.log(`  OK (+${questions.length})`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  FAILED:`, err);
    }
  }

  console.log(`\nDone! Added ${added} fill_code questions.`);
}

main().catch(console.error);
