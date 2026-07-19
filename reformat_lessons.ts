import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://zjyolgkakxuaegpvhimy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_KEY = process.env.OPENAI_API_KEY!;

async function reformatContent(content: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `Reformat this programming lesson content. Rules:
- Separate code from explanatory text clearly
- Each code example should be its own paragraph (separated by double newlines)
- Text explanations should be their own paragraphs
- Short section titles should be on their own line (no colon at end)
- Do NOT change any actual content, words, or code - only adjust line breaks and paragraph spacing
- Code lines should be grouped together in one block
- Text lines should be grouped together in one block
- Remove any trailing colons from section headers
- Keep it plain text (no markdown backticks or formatting symbols)

Content to reformat:
${content}`
      }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || content;
}

async function main() {
  const { data: lessons } = await sb.from('cb_lessons')
    .select('id, title, learning_content, learning_content_sk')
    .not('learning_content', 'is', null)
    .order('id');

  if (!lessons) { console.log('No lessons'); return; }
  console.log(`Found ${lessons.length} lessons to process\n`);

  let updated = 0;
  for (const lesson of lessons) {
    if (!lesson.learning_content || lesson.learning_content.length < 50) continue;
    
    console.log(`Processing: ${lesson.id} - ${lesson.title}...`);
    
    try {
      const reformatted = await reformatContent(lesson.learning_content);
      
      const updates: any = { learning_content: reformatted };
      
      // Also reformat SK if exists
      if (lesson.learning_content_sk && lesson.learning_content_sk.length > 50) {
        const reformattedSk = await reformatContent(lesson.learning_content_sk);
        updates.learning_content_sk = reformattedSk;
      }
      
      await sb.from('cb_lessons').update(updates).eq('id', lesson.id);
      updated++;
      console.log(`  OK (${reformatted.length} chars)`);
      
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  FAILED:`, err);
    }
  }
  
  console.log(`\nDone! Updated ${updated} lessons.`);
}

main().catch(console.error);
