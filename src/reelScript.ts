/**
 * Generate a conversational script for IG Reel from lesson content.
 * Student asks, Teacher explains using ACTUAL lesson content.
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
- TEACHER: friendly expert who explains using the ACTUAL lesson content provided

You will receive the lesson's INTRODUCTION and LEARNING CONTENT. The teacher MUST use this content — don't invent new explanations. Rephrase it conversationally but keep the substance.

Create a conversation with EXACTLY 8 lines:

1. STUDENT: greeting + asks what the topic is (max 10 words)
2. TEACHER: explains the core concept using facts from the LEARNING CONTENT. What is it? How does it work? Give the definition and key details (max 40 words). Do NOT read code — describe what it does.
3. STUDENT: follow-up question about practical usage (max 10 words). Like "Cool! How would I actually use this?"
4. TEACHER: gives a CONCRETE real-world example. NOT just listing functions. Paint a scenario: "Say you have a list of students and you want to sort them by grade — you can use a lambda as the sorting key." or "Imagine you're filtering a list of products to find ones under 20 dollars." ALWAYS a specific, relatable scenario (max 35 words)
5. STUDENT: says they're confused, asks for a simpler explanation (max 12 words). Like "Hmm wait, can you break that down simpler?"
6. TEACHER: NOW use the INTRODUCTION to explain with a simple analogy or everyday comparison. Start with "Think of it like..." or "Imagine..." Use the introduction's analogy if there is one. Make it click (max 40 words)
7. STUDENT: THIS IS THE MOST IMPORTANT LINE. The student now fully understands and explains the ENTIRE concept back in their own simple words. They MUST summarize everything they learned — what it is, how it works, and why it's useful — but in casual, simple language. This should be a LONG line (20-30 words). Example: "Ohh okay I get it now! So basically instead of writing a whole function with def and return, you just write a tiny one-liner that does the same thing, and you don't even need to name it! That's super handy for quick stuff!"
8. TEACHER: empty line (silent — CTA screen shows visually). Return {"speaker": "teacher", "spoken": "", "code": null}

RULES:
- NEVER read code aloud. Say "you can write a one-liner that squares a number" NOT "lambda x: x times x"
- Teacher's explanations MUST come from the provided lesson content, not invented
- Be casual and natural, like two friends chatting
- Line 6 is the "aha moment" — use a real-world analogy from the introduction
- Total spoken text: 150-200 words
- ABSOLUTELY NEVER use colons (:) anywhere in spoken text. This is the #1 rule. No colons EVER. Not even before examples. Replace "For example:" with "For example," or just remove it.
- NEVER use semicolons (;). Use periods and commas ONLY.
- NEVER use bullet points, dashes, or lists. Write in full flowing sentences.
- The text is READ ALOUD — it must sound like natural speech, not written text.
- Write FLOWING sentences, not choppy fragments. BAD: "Lambda is a function. It is small. It has no name." GOOD: "Lambda is a small anonymous function that doesn't need a name and automatically returns its result."
- Connect ideas with "and", "which", "that", "so", "because" instead of starting new sentences.
- Maximum 2-3 sentences per teacher line, but make them LONG and flowing, not short and robotic.

Also pick ONE code snippet (MAX 3 lines) from the LEARNING CONTENT. The most illustrative example. Attach it to line 2 or 4.

Return VALID JSON:
{
  "lines": [
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": "square = lambda x: x ** 2"},
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
  lang: 'en' | 'sk' = 'en',
): Promise<ReelScript> {
  if (!OPENAI_KEY) {
    return fallbackScript(title, introduction);
  }

  const langNote = lang === 'sk'
    ? '\n\nIMPORTANT: Write the ENTIRE script in SLOVAK (slovenčina). Proper Slovak grammar. Never Czech. The conversation must be natural Slovak, not a translation.'
    : '';

  const prompt = `LESSON TITLE: ${title}

INTRODUCTION (use this for line 6 — the simple analogy/explanation):
${introduction.slice(0, 2500)}

LEARNING CONTENT (use this for lines 2 and 4 — the actual teaching):
${learningContent.slice(0, 4000)}

KEY TAKEAWAYS:
${keyTakeaways.join('\n')}${langNote}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
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
    ? introduction.split('.').slice(0, 3).join('.') + '.'
    : `Think of it like a shortcut that makes everything simpler.`;
  return { lines: [
    { speaker: 'student', spoken: `Hey! What's ${title}?` },
    { speaker: 'teacher', spoken: `It's one of the key concepts every developer should know. Let me explain how it works and why it matters.` },
    { speaker: 'student', spoken: `Oh cool! When would I actually use this?` },
    { speaker: 'teacher', spoken: `You'd use it all the time in real projects. It makes your code cleaner and more efficient.` },
    { speaker: 'student', spoken: `Hmm wait, can you break that down simpler?` },
    { speaker: 'teacher', spoken: intro },
    { speaker: 'student', spoken: `Ohh okay, that makes so much sense now!` },
    { speaker: 'teacher', spoken: '' },
  ]};
}
