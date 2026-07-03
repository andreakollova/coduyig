/**
 * Generate a spoken script + code snippet from a lesson for a 15s Reel.
 * Uses GPT-4o to create a max 35-word voiceover script.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export interface ReelScript {
  /** Full spoken text (max 35 words) */
  spokenText: string;
  /** Sections with their spoken parts */
  sections: {
    label: string;
    spoken: string;
    code?: string;
  }[];
}

const SYSTEM = `You create ultra-short voiceover scripts for 15-second Instagram Reels about programming lessons.

Given a lesson title and learning content, create a script with EXACTLY 4 sections:

1. "INTRODUCTION" — MUST start with "Hey guys," followed by a punchy hook (max 10 words total)
2. "LEARNING" — the core concept (max 10 words)
3. "KEY POINTS" — two concrete takeaways combined (max 10 words)
4. "WHY CARE?" — 1 motivating closer (max 7 words)

TOTAL across all sections: MAX 35 words. Count carefully.

RULES:
- The INTRODUCTION MUST begin with "Hey guys," — this is non-negotiable.
- NEVER read code aloud. Code is shown on screen, not spoken.
- Don't say "for i in range" or any syntax — describe what the code DOES naturally.
- Be conversational, energetic, like a friend explaining.
- Each section must flow naturally into the next.

Also pick ONE short code snippet (3-5 lines) from the lesson content that best illustrates the concept. If no code exists in the content, return code as null.

Return VALID JSON:
{
  "sections": [
    {"label": "INTRODUCTION", "spoken": "...", "code": null},
    {"label": "LEARNING", "spoken": "...", "code": "def example():\\n    return 42"},
    {"label": "KEY POINTS", "spoken": "...", "code": null},
    {"label": "WHY CARE?", "spoken": "...", "code": null}
  ]
}

Code appears in at most 2 sections (LEARNING and/or KEY POINTS). Use \\n for newlines in code.`;

export async function generateReelScript(
  title: string,
  learningContent: string,
  keyTakeaways: string[],
): Promise<ReelScript> {
  if (!OPENAI_KEY) {
    console.log('⚠️  No OPENAI_API_KEY — using fallback script');
    return fallbackScript(title);
  }

  const prompt = `LESSON TITLE: ${title}

LEARNING CONTENT:
${learningContent.slice(0, 3000)}

KEY TAKEAWAYS:
${keyTakeaways.join('\n')}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    if (!parsed.sections || parsed.sections.length !== 4) throw new Error('Invalid sections');

    // Count total words
    const totalWords = parsed.sections.reduce((sum: number, s: any) => sum + s.spoken.split(/\s+/).length, 0);
    console.log(`📝 Script: ${totalWords} words (limit: 35)`);
    if (totalWords > 40) console.warn(`⚠️ Script exceeds 35 words (${totalWords})`);

    const spokenText = parsed.sections.map((s: any) => s.spoken).join(' ');

    return {
      spokenText,
      sections: parsed.sections.map((s: any) => ({
        label: s.label,
        spoken: s.spoken,
        code: s.code || undefined,
      })),
    };
  } catch (err) {
    console.error('⚠️ GPT script generation failed:', err);
    return fallbackScript(title);
  }
}

function fallbackScript(title: string): ReelScript {
  const sections = [
    { label: 'INTRODUCTION', spoken: `Hey guys, let's learn about ${title}.` },
    { label: 'LEARNING', spoken: 'This is one of the most important concepts.' },
    { label: 'KEY POINTS', spoken: 'Understanding this will make you a better developer.' },
    { label: 'WHY CARE?', spoken: 'Every professional developer uses this daily.' },
  ];
  return {
    spokenText: sections.map(s => s.spoken).join(' '),
    sections,
  };
}
