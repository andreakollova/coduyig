const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

interface SlideData { heading: string; body: string; }

export interface SlideSet {
  slides: SlideData[];  // 3 learning slides
  funFact: string;      // one fun fact or real example
  whyCare: string;      // why programmer should care (3-5 sentences)
}

const SYSTEM_PROMPT = `You create Instagram carousel content for Coduy, a coding education app.

Given a lesson's learning content, real-world examples, and interesting facts, create:

"slides" — EXACTLY 3 learning slides:
- "heading": catchy topic title, max 28 characters
- "body": 3-5 clear sentences (max 280 chars). Write conversationally, like explaining to a friend.
- Cover the 3 most important concepts from the lesson
- NO code, NO bullet points, NO markdown, NO special chars

"funFact" — ONE interesting/surprising fact from the lesson (1-3 sentences, max 200 chars). Something that makes people go "wow, I didn't know that!"

"whyCare" — Why a programmer should care about this topic. 3-5 sentences (max 300 chars). Practical, real-world perspective. Motivating.

VALID JSON ONLY:
{
  "slides": [
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."}
  ],
  "funFact": "...",
  "whyCare": "..."
}`;

export async function generateSlideContent(
  learningContent: string,
  realWorldContent: string,
  interestingFacts: string,
  lang: 'en' | 'sk'
): Promise<SlideSet> {
  if (!OPENAI_KEY) {
    console.log('⚠️  No OPENAI_API_KEY — using fallback');
    return fallback(learningContent, realWorldContent);
  }

  const langNote = lang === 'sk'
    ? '\n\nWRITE EVERYTHING IN SLOVAK (slovenčina). Proper grammar. Never Czech. Remove "vysvetlené" from headings.'
    : '';

  const prompt = `LEARNING:\n${learningContent.slice(0, 4000)}\n\nREAL WORLD:\n${(realWorldContent || '').slice(0, 1500)}\n\nFUN FACTS:\n${(interestingFacts || '').slice(0, 1000)}${langNote}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed: SlideSet = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    if (!parsed.slides || parsed.slides.length < 3 || !parsed.funFact || !parsed.whyCare) throw new Error('Invalid');
    console.log(`✨ GPT: ${parsed.slides.length} slides + funFact + whyCare`);
    return parsed;
  } catch (err) {
    console.error('⚠️  GPT failed:', err);
    return fallback(learningContent, realWorldContent);
  }
}

function fallback(learning: string, realWorld: string): SlideSet {
  const p = (learning || '').split('\n\n').filter(p => p.trim());
  const c = Math.ceil(p.length / 3);
  return {
    slides: [0, 1, 2].map(i => ({ heading: '', body: p.slice(i * c, (i + 1) * c).join(' ').slice(0, 280) })),
    funFact: 'This is one of the most important concepts in computer science.',
    whyCare: (realWorld || '').split('\n\n')[0]?.slice(0, 300) || 'Understanding this makes you a better developer.',
  };
}
