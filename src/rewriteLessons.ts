/**
 * Rewrite all lessons: fix grammar, improve explanations, proper formatting
 * Runs GPT-4o-mini on each lesson's learning_content and learning_content_sk
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

const FIELDS = [
  { field: 'learning_content', lang: 'en' },
  { field: 'learning_content_sk', lang: 'sk' },
];

async function rewriteContent(content: string, lang: 'en' | 'sk', title: string): Promise<string> {
  const prompt = lang === 'sk'
    ? `Si editor slovenského textu pre vzdelávaciu appku o programovaní. Uprav nasledujúci text lekcie "${title}":

PRAVIDLÁ:
1. OPRAŤ GRAMATIKU - správna slovenčina, žiadne preklepy, správne skloňovanie. Python, JavaScript a iné technické termíny sa NESKLOŇUJÚ (nie Pythonomu, Pythonom, ale Python)
2. Nadpisy musia začínať # (napr. # Čo je to dátový typ?)
3. Rozdeľ dlhé odseky na kratšie (max 3 vety na odsek)
4. Zachovaj presne rovnaký obsah a technické informácie - NIČ nevymýšľaj
5. Zachovaj code blocky presne ako sú (\`\`\`python ... \`\`\`)
6. Zachovaj bullet listy (- item)
7. Vysvetlenia nech sú priateľské, jednoduché, ako keby si to vysvetľoval 14-ročnému
8. Dvojité newlines medzi odsekmi
9. Žiadne emoji
10. Rodovo neutrálne (prvý výskyt si mohol/a, zvyšok mohol)

VRÁŤ IBA UPRAVENÝ TEXT, žiadne komentáre ani vysvetlenia.`
    : `You are an English text editor for a programming education app. Edit the following lesson "${title}":

RULES:
1. FIX GRAMMAR - correct English, no typos
2. Headings must start with # (e.g. # What is a data type?)
3. Split long paragraphs into shorter ones (max 3 sentences per paragraph)
4. Keep EXACTLY the same content and technical information - do NOT invent anything
5. Keep code blocks exactly as they are (\`\`\`python ... \`\`\`)
6. Keep bullet lists (- item)
7. Make explanations friendly, simple, as if explaining to a 14-year-old
8. Double newlines between paragraphs
9. No emojis
10. RETURN ONLY the edited text, no comments or explanations.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: content },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });
    const data = await res.json();
    const result = data.choices?.[0]?.message?.content?.trim();
    if (!result || result.length < content.length * 0.5) {
      console.log('    ⚠️ Result too short, skipping');
      return content;
    }
    return result;
  } catch (e) {
    console.log('    ❌ API error:', e);
    return content;
  }
}

async function main() {
  const startId = parseInt(process.argv[2] || '0');
  const { data: lessons } = await sb.from('cb_lessons')
    .select('id, title, title_sk, learning_content, learning_content_sk')
    .gte('id', startId)
    .order('id');

  if (!lessons) return;
  console.log(`Processing ${lessons.length} lessons starting from ID ${startId}...\n`);

  let processed = 0;
  for (const lesson of lessons) {
    console.log(`L${lesson.id}: ${lesson.title_sk || lesson.title}`);

    const updates: Record<string, string> = {};

    for (const { field, lang } of FIELDS) {
      const content = lesson[field as keyof typeof lesson] as string;
      if (!content || content.length < 50) continue;

      console.log(`  ${lang.toUpperCase()}: ${content.length} chars`);
      const rewritten = await rewriteContent(content, lang as 'en' | 'sk', lesson.title);

      if (rewritten !== content) {
        updates[field] = rewritten;
        console.log(`  ✅ ${lang.toUpperCase()}: ${content.length} → ${rewritten.length} chars`);
      } else {
        console.log(`  ⏭️ ${lang.toUpperCase()}: no changes`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await sb.from('cb_lessons').update(updates).eq('id', lesson.id);
      processed++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Done. Processed ${processed} / ${lessons.length} lessons.`);
}

main().catch(console.error);
