/**
 * Generate a conversational script for IG Reel — two Bytes talking.
 * Student (white) asks, Teacher (orange) explains.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export interface ReelLine {
  speaker: 'student' | 'teacher';
  spoken: string;
  code?: string;
}

export interface ReelScript {
  lines: ReelLine[];
}

const SYSTEM = `You write short conversational scripts for Instagram Reels about programming.

Two characters talk:
- STUDENT: curious beginner, asks short questions
- TEACHER: friendly expert, gives clear short answers

Given a lesson title, introduction and content, create a conversation with EXACTLY 5 lines:

1. STUDENT: greeting + question about the topic (max 10 words). Example: "Yo, what are lambda functions?"
2. TEACHER: short explanation of the concept (max 20 words)
3. STUDENT: follow-up "Oh cool!" + asks about a specific detail (max 10 words)
4. TEACHER: answers with a concrete example or key point (max 15 words)
5. TEACHER: "Check out the full lesson on the app."

TOTAL: max 50 words across all lines. Keep it PUNCHY and SHORT.

RULES:
- NEVER read code aloud. Describe what code does naturally.
- Be casual, like two friends chatting.
- Student sounds curious and excited.
- Teacher sounds confident and friendly.

Also pick ONE code snippet (MAX 3 lines, never more) from the lesson. Show it during teacher's explanation (line 2 or 4). If no code exists, return code as null.

Return VALID JSON:
{
  "lines": [
    {"speaker": "student", "spoken": "Yo, what are lambda functions?", "code": null},
    {"speaker": "teacher", "spoken": "They're tiny anonymous functions you write in one line.", "code": "square = lambda x: x ** 2"},
    {"speaker": "student", "spoken": "Oh nice! When do you use them?", "code": null},
    {"speaker": "teacher", "spoken": "With map, filter, and sorted — super handy for quick operations.", "code": null},
    {"speaker": "teacher", "spoken": "Check out the full lesson on the app.", "code": null}
  ]
}`;

export async function generateReelScript(
  title: string,
  introduction: string,
  learningContent: string,
  keyTakeaways: string[],
): Promise<ReelScript> {
  if (!OPENAI_KEY) {
    return fallbackScript(title);
  }

  const prompt = `LESSON: ${title}\n\nINTRO:\n${introduction.slice(0, 1500)}\n\nCONTENT:\n${learningContent.slice(0, 2000)}\n\nTAKEAWAYS:\n${keyTakeaways.join('\n')}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    if (!parsed.lines || parsed.lines.length < 4) throw new Error('Invalid');

    const totalWords = parsed.lines.reduce((s: number, l: any) => s + l.spoken.split(/\s+/).length, 0);
    console.log(`📝 Script: ${totalWords} words, ${parsed.lines.length} lines`);

    return { lines: parsed.lines.map((l: any) => ({ speaker: l.speaker, spoken: l.spoken, code: l.code || undefined })) };
  } catch (err) {
    console.error('⚠️ GPT failed:', err);
    return fallbackScript(title);
  }
}

function fallbackScript(title: string): ReelScript {
  return { lines: [
    { speaker: 'student', spoken: `Yo, what's ${title}?` },
    { speaker: 'teacher', spoken: `It's one of the key concepts every developer should know.` },
    { speaker: 'student', spoken: `Oh cool! Why does it matter?` },
    { speaker: 'teacher', spoken: `It makes your code cleaner and more efficient.` },
    { speaker: 'teacher', spoken: `Check out the full lesson on the app.` },
  ]};
}
