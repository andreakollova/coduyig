/**
 * Uses GPT-4o to transform raw lesson content into perfectly formatted slide content.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

interface SlideData {
  heading: string;
  body: string;
}

interface SlideSet {
  slides: SlideData[];
  examples: SlideData;
  whyCare: string; // short text for CTA slide
}

const SYSTEM_PROMPT = `You create Instagram carousel slide content for a coding education app called Coduy.

You receive a lesson's FULL learning content and real-world examples. Transform them into carousel slides.

CREATE EXACTLY THIS:

"slides" — 4 to 5 learning slides. Each slide covers ONE topic from the lesson:
- "heading": catchy title, max 30 characters
- "body": 3-5 sentences explaining this topic clearly. Max 250 characters. Write like you're explaining to a smart friend, not a textbook.
- Cover ALL the important concepts from the learning content
- NO code snippets, NO bullet points, NO markdown
- Use plain, engaging language

"examples" — 1 slide with real-world examples:
- "heading": max 30 characters (e.g. "Real-World Examples")
- "body": 2-3 concrete examples of where this topic is used in real life. Max 250 characters.

"whyCare" — ONE sentence (max 100 characters) explaining why a programmer should care about this topic. This goes on the final CTA slide.

RESPOND IN VALID JSON ONLY:
{
  "slides": [
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."}
  ],
  "examples": {"heading": "...", "body": "..."},
  "whyCare": "..."
}`;

export async function generateSlideContent(
  learningContent: string,
  realWorldContent: string,
  lang: 'en' | 'sk'
): Promise<SlideSet> {
  if (!OPENAI_KEY) {
    console.log('⚠️  No OPENAI_API_KEY — using raw content fallback');
    return fallback(learningContent, realWorldContent);
  }

  const langInstruction = lang === 'sk'
    ? '\n\nIMPORTANT: Write ALL content in SLOVAK (slovenčina). Proper Slovak grammar. Never Czech. Remove "vysvetlené/vysvetlenie" from headings — just the core topic.'
    : '';

  const userPrompt = `LEARNING CONTENT:\n${learningContent.slice(0, 4000)}\n\nREAL WORLD EXAMPLES:\n${(realWorldContent || '').slice(0, 2000)}${langInstruction}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty GPT response');

    const parsed: SlideSet = JSON.parse(content);

    if (!parsed.slides || parsed.slides.length < 3 || !parsed.examples || !parsed.whyCare) {
      throw new Error('Invalid slide structure from GPT');
    }

    console.log(`✨ GPT generated ${parsed.slides.length} learning slides + examples + whyCare`);
    return parsed;
  } catch (err) {
    console.error('⚠️  GPT slide generation failed, using fallback:', err);
    return fallback(learningContent, realWorldContent);
  }
}

function fallback(learning: string, realWorld: string): SlideSet {
  const paragraphs = (learning || '').split('\n\n').filter(p => p.trim());
  const chunkSize = Math.ceil(paragraphs.length / 4);
  const slides: SlideData[] = [];
  for (let i = 0; i < 4; i++) {
    const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
    slides.push({ heading: '', body: chunk.join(' ').slice(0, 250) });
  }
  const rwParas = (realWorld || '').split('\n\n').filter(p => p.trim());
  return {
    slides,
    examples: { heading: 'Examples', body: rwParas.slice(0, 3).join(' ').slice(0, 250) },
    whyCare: rwParas[0]?.slice(0, 100) || 'Understanding this makes you a better developer.',
  };
}
