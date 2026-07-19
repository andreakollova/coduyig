/**
 * Add fill_code + write_code questions to ALL lessons that have code content but lack them.
 * Fixes question_number to be max+1 per lesson to avoid unique constraint errors.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function generateFillAndWrite(title: string, content: string): Promise<any[]> {
  const prompt = `You are creating quiz questions for a Python programming lesson.

LESSON: ${title}

CONTENT (first 2500 chars):
${content.slice(0, 2500)}

Create exactly 3 questions:

1. A "fill_code" question where the student picks the correct option to fill a blank (___) in code.
   Return: { type: "fill_code", question_text: "...", question_text_sk: "...", code_snippet: "code with ___ blank", correct_answer: "the correct fill", options: ["correct", "wrong1", "wrong2", "wrong3"] }

2. Another "fill_code" question (different from #1).
   Same format.

3. A "write_code" question where the student must TYPE the missing code (1 line).
   Return: { type: "write_code", question_text: "...", question_text_sk: "...", code_snippet: "code with # TODO comment", correct_answer: "the line to write" }

RULES:
- Code MUST come from the lesson content, not invented
- Questions must NOT reveal the answer in the prompt text
- question_text is in English, question_text_sk in Slovak (proper Slovak, never Czech)
- code_snippet uses real Python from the lesson
- For fill_code: exactly 4 options, only 1 correct
- For write_code: correct_answer is exactly 1 line, unambiguous

Return a JSON array of 3 objects. Nothing else.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    // Handle both array and {questions: [...]} formats
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch { return []; }
}

async function main() {
  console.log('Adding fill_code + write_code to lessons missing them...\n');

  // Get max question_number per lesson — paginate to get ALL rows
  const maxNum: Record<number, number> = {};
  const hasFillOrWrite = new Set<number>();
  let offset = 0;
  while (true) {
    const { data: batch } = await sb.from('cb_quiz_questions')
      .select('lesson_id, question_number, question_type')
      .range(offset, offset + 999);
    if (!batch || batch.length === 0) break;
    for (const q of batch) {
      maxNum[q.lesson_id] = Math.max(maxNum[q.lesson_id] || 0, q.question_number);
      if (q.question_type === 'fill_code' || q.question_type === 'write_code') {
        hasFillOrWrite.add(q.lesson_id);
      }
    }
    offset += 1000;
    if (batch.length < 1000) break;
  }
  console.log(`Scanned ${offset > 0 ? offset : 'all'} questions, ${Object.keys(maxNum).length} lessons with quizzes`);

  // Get lessons with code content that need fill/write
  const { data: lessons } = await sb.from('cb_lessons')
    .select('id, title, learning_content')
    .order('id');

  const toProcess = lessons!.filter(l =>
    l.learning_content && l.learning_content.length > 200 &&
    (l.learning_content.includes('def ') || l.learning_content.includes('= ') ||
     l.learning_content.includes('print(') || l.learning_content.includes('import ')) &&
    !hasFillOrWrite.has(l.id)
  );

  console.log(`Found ${toProcess.length} lessons needing fill/write_code\n`);

  let added = 0, errors = 0;

  for (const lesson of toProcess) {
    process.stdout.write(`Processing: ${lesson.id} - ${lesson.title}...`);

    const questions = await generateFillAndWrite(lesson.title, lesson.learning_content);
    if (questions.length === 0) { console.log(' SKIP (no questions)'); errors++; continue; }

    // Start at max+10 to avoid any conflicts with concurrent inserts
    let nextNum = Math.max((maxNum[lesson.id] || 0) + 10, 100);
    let ok = 0;

    for (const q of questions) {
      try {
        if (q.type === 'fill_code') {
          // Insert question
          const { data: inserted, error } = await sb.from('cb_quiz_questions').insert({
            lesson_id: lesson.id,
            question_number: nextNum,
            question_type: 'fill_code',
            question_text: q.question_text,
            question_text_sk: q.question_text_sk,
            code_snippet: q.code_snippet,
            correct_answer: q.correct_answer,
          }).select('id').single();

          if (error) { console.log(`\n  ERROR: ${error.message}`); continue; }

          // Insert options
          if (inserted && q.options) {
            const labels = ['A', 'B', 'C', 'D'];
            const shuffled = q.options.sort(() => Math.random() - 0.5);
            const optRows = shuffled.map((opt: string, i: number) => ({
              question_id: inserted.id,
              option_label: labels[i],
              option_text: opt,
              option_text_sk: opt, // code tokens don't need translation
              is_correct: opt === q.correct_answer,
            }));
            await sb.from('cb_quiz_options').insert(optRows);
          }
          nextNum++;
          ok++;
        } else if (q.type === 'write_code') {
          const { error } = await sb.from('cb_quiz_questions').insert({
            lesson_id: lesson.id,
            question_number: nextNum,
            question_type: 'write_code',
            question_text: q.question_text,
            question_text_sk: q.question_text_sk,
            code_snippet: q.code_snippet,
            correct_answer: q.correct_answer,
          });
          if (error) { console.log(`\n  ERROR: ${error.message}`); continue; }
          nextNum++;
          ok++;
        }
      } catch (e: any) {
        console.log(`\n  ERROR: ${e.message}`);
      }
    }

    added += ok;
    maxNum[lesson.id] = nextNum - 1;
    console.log(` +${ok}`);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone! Added ${added} questions (${errors} lessons skipped).`);
}

main().catch(console.error);
