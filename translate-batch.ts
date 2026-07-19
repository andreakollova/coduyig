import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

const BATCH_SIZE = 20; // questions per GPT call
const DELAY = 500; // ms between API calls

async function translate(texts: string[]): Promise<string[]> {
  const prompt = `Translate these English texts to Slovak (slovenčina). NEVER use Czech. Return a JSON array of translated strings in the same order.

Texts:
${JSON.stringify(texts)}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  // Handle both array and object with array property
  if (Array.isArray(parsed)) return parsed;
  const vals = Object.values(parsed);
  if (vals.length === 1 && Array.isArray(vals[0])) return vals[0] as string[];
  return vals as string[];
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateQuestions() {
  console.log('=== Translating Questions ===\n');

  let offset = 0;
  let totalDone = 0;

  while (true) {
    const { data: questions, error } = await sb
      .from('cb_quiz_questions')
      .select('id, question_text')
      .is('question_text_sk', null)
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) { console.error('Fetch error:', error); break; }
    if (!questions || questions.length === 0) break;

    const texts = questions.map(q => q.question_text);

    try {
      const translations = await translate(texts);

      for (let i = 0; i < questions.length; i++) {
        const sk = translations[i];
        if (!sk) { console.warn(`  Skip q=${questions[i].id} — no translation`); continue; }

        const { error: upErr } = await sb
          .from('cb_quiz_questions')
          .update({ question_text_sk: sk })
          .eq('id', questions[i].id);

        if (upErr) console.error(`  Error updating q=${questions[i].id}:`, upErr);
      }

      totalDone += questions.length;
      console.log(`  Translated ${totalDone} questions (batch of ${questions.length})`);
    } catch (err) {
      console.error('  Translation error:', err);
      offset += BATCH_SIZE; // skip batch on error
    }

    await sleep(DELAY);
    // Don't increment offset — we query for null, so translated ones won't appear again
  }

  console.log(`\nDone: ${totalDone} questions translated.\n`);
}

async function translateOptions() {
  console.log('=== Translating Options ===\n');

  let totalDone = 0;

  while (true) {
    const { data: options, error } = await sb
      .from('cb_quiz_options')
      .select('id, option_text')
      .is('option_text_sk', null)
      .order('id')
      .range(0, BATCH_SIZE * 2 - 1); // larger batches for short texts

    if (error) { console.error('Fetch error:', error); break; }
    if (!options || options.length === 0) break;

    const texts = options.map(o => o.option_text);

    try {
      const translations = await translate(texts);

      for (let i = 0; i < options.length; i++) {
        const sk = translations[i];
        if (!sk) { console.warn(`  Skip opt=${options[i].id} — no translation`); continue; }

        const { error: upErr } = await sb
          .from('cb_quiz_options')
          .update({ option_text_sk: sk })
          .eq('id', options[i].id);

        if (upErr) console.error(`  Error updating opt=${options[i].id}:`, upErr);
      }

      totalDone += options.length;
      console.log(`  Translated ${totalDone} options (batch of ${options.length})`);
    } catch (err) {
      console.error('  Translation error:', err);
      // fetch fresh batch next iteration
    }

    await sleep(DELAY);
  }

  console.log(`\nDone: ${totalDone} options translated.\n`);
}

async function main() {
  console.log('🌍 Batch SK Translation\n');
  await translateQuestions();
  await translateOptions();
  console.log('✅ All translations complete!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
