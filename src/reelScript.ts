/**
 * Generate a spoken script + code snippet from a lesson for an IG Reel.
 * Uses GPT-4o to create a conversational voiceover from the lesson content.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export interface ReelScript {
  spokenText: string;
  sections: {
    label: string;
    spoken: string;
    code?: string;
  }[];
}

const SYSTEM = `You create voiceover scripts for Instagram Reels about programming lessons.

Given a lesson title, introduction, learning content, and key takeaways, create a script with EXACTLY 4 sections:

1. "INTRODUCTION" — Start with "Hey guys," then rephrase the lesson introduction conversationally. Keep the full meaning. 3-5 sentences.
2. "LEARNING" — Explain the core concept from the learning content. 2-3 clear sentences.
3. "KEY POINTS" — Two concrete takeaways from the lesson. 1-2 sentences.
4. "CTA" — EXACTLY this text: "Check out the full lesson on the app."

RULES:
- The INTRODUCTION MUST begin with "Hey guys," — non-negotiable.
- NEVER read code aloud. Code is shown on screen, not spoken.
- Don't say "for i in range" or any syntax — describe what code DOES naturally.
- Be conversational, energetic, like a friend explaining.
- Total script should be 60-90 words (video will be 30-60 seconds).

Also pick ONE short code snippet (3-5 lines) from the lesson content that best illustrates the concept. If no code exists, return code as null.

Return VALID JSON:
{
  "sections": [
    {"label": "INTRODUCTION", "spoken": "...", "code": null},
    {"label": "LEARNING", "spoken": "...", "code": "def example():\\n    return 42"},
    {"label": "KEY POINTS", "spoken": "...", "code": null},
    {"label": "CTA", "spoken": "Check out the full lesson on the app.", "code": null}
  ]
}

Code appears in at most 2 sections (LEARNING and/or KEY POINTS). Use \\n for newlines in code.`;

export async function generateReelScript(
  title: string,
  introduction: string,
  learningContent: string,
  keyTakeaways: string[],
): Promise<ReelScript> {
  if (!OPENAI_KEY) {
    console.log('⚠️  No OPENAI_API_KEY — using fallback script');
    return fallbackScript(title, introduction);
  }

  const prompt = `LESSON TITLE: ${title}

INTRODUCTION:
${introduction.slice(0, 2000)}

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
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    if (!parsed.sections || parsed.sections.length !== 4) throw new Error('Invalid sections');

    const totalWords = parsed.sections.reduce((sum: number, s: any) => sum + s.spoken.split(/\s+/).length, 0);
    console.log(`📝 Script: ${totalWords} words (target: 60-90)`);

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
    return fallbackScript(title, introduction);
  }
}

function fallbackScript(title: string, introduction?: string): ReelScript {
  const introText = introduction
    ? `Hey guys, ${introduction.split('.').slice(0, 3).join('. ')}.`
    : `Hey guys, let's learn about ${title}.`;
  const sections = [
    { label: 'INTRODUCTION', spoken: introText },
    { label: 'LEARNING', spoken: 'This is one of the most important concepts in programming.' },
    { label: 'KEY POINTS', spoken: 'Understanding this will make you a better developer.' },
    { label: 'CTA', spoken: 'Check out the full lesson on the app.' },
  ];
  return {
    spokenText: sections.map(s => s.spoken).join(' '),
    sections,
  };
}
