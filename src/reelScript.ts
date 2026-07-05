/**
 * Generate a conversational script for IG Reel — two characters talking.
 * Student asks, Teacher explains, Student asks for simpler explanation,
 * Teacher uses the lesson introduction ("Imagine..."), Student gets it.
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

const SYSTEM = `You write conversational scripts for Instagram Reels about programming.

Two characters:
- STUDENT: curious beginner, asks questions, sometimes confused
- TEACHER: friendly expert, explains clearly

Given a lesson title, introduction, and learning content, create a conversation with EXACTLY 8 lines:

1. STUDENT: greeting + asks what the topic is (max 10 words). Like "Hey! What are lambda functions?"
2. TEACHER: gives a clear, detailed technical explanation. Define the concept, explain how it works, give a concrete example described in words (max 40 words)
3. STUDENT: asks a follow-up about practical usage (max 10 words). Like "Oh nice! When would I actually use this?"
4. TEACHER: answers with real-world examples and practical details. Mention specific use cases (max 35 words)
5. STUDENT: says they're a bit confused, asks for a simpler explanation (max 12 words). Like "Hmm wait, I'm not sure I fully get it. Can you break it down?"
6. TEACHER: uses the INTRODUCTION content to explain with a vivid analogy or "Imagine..." scenario. Paint a picture. Make the concept click (max 45 words). This MUST be based on the lesson's introduction.
7. STUDENT: now understands, reacts positively (max 8 words). Like "Ohh okay, that makes so much sense now!"
8. TEACHER: This line is EMPTY — no spoken text. Just return {"speaker": "teacher", "spoken": "", "code": null}. The CTA screen with logo will show visually without voiceover.

RULES:
- NEVER read code aloud. Code is shown on screen, not spoken.
- Be casual, like two friends chatting.
- Line 6 MUST use the lesson's introduction/analogy — this is the key moment.
- Total: 170-220 words MINIMUM. The teacher MUST explain thoroughly — give definitions, examples, and analogies. Don't be vague. The viewer should LEARN something real. The video needs to be 45-60 seconds.

Also pick ONE code snippet (MAX 3 lines) from the lesson. Attach it to line 2 or 4. If no code exists, return code as null.

Return VALID JSON:
{
  "lines": [
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": "x = lambda a: a + 1"},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "", "code": null}
  ]
}`;

export async function generateReelScript(
  title: string,
  introduction: string,
  learningContent: string,
  keyTakeaways: string[],
): Promise<ReelScript> {
  if (!OPENAI_KEY) {
    return fallbackScript(title, introduction);
  }

  const prompt = `LESSON: ${title}

INTRODUCTION (use this for line 6 — the "explain it simpler" moment):
${introduction.slice(0, 2000)}

LEARNING CONTENT:
${learningContent.slice(0, 2500)}

KEY TAKEAWAYS:
${keyTakeaways.join('\n')}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    if (!parsed.lines || parsed.lines.length < 7) throw new Error('Invalid');

    const totalWords = parsed.lines.reduce((s: number, l: any) => s + l.spoken.split(/\s+/).length, 0);
    console.log(`📝 Script: ${totalWords} words, ${parsed.lines.length} lines`);

    return { lines: parsed.lines.map((l: any) => ({ speaker: l.speaker, spoken: l.spoken, code: l.code || undefined })) };
  } catch (err) {
    console.error('⚠️ GPT failed:', err);
    return fallbackScript(title, introduction);
  }
}

function fallbackScript(title: string, introduction?: string): ReelScript {
  const intro = introduction
    ? introduction.split('.').slice(0, 2).join('.') + '.'
    : `Think of it like a shortcut that makes your code simpler.`;
  return { lines: [
    { speaker: 'student', spoken: `Hey! What's ${title}?` },
    { speaker: 'teacher', spoken: `It's one of the key concepts every developer should know.` },
    { speaker: 'student', spoken: `Oh cool! Why does it matter?` },
    { speaker: 'teacher', spoken: `It makes your code cleaner and more efficient.` },
    { speaker: 'student', spoken: `Hmm, I'm not sure I get it. Can you explain it simpler?` },
    { speaker: 'teacher', spoken: intro },
    { speaker: 'student', spoken: `Ohh okay, that makes sense now!` },
    { speaker: 'teacher', spoken: '' },
  ]};
}
