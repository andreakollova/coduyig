/**
 * Uses GPT-4o to transform raw lesson content into perfectly formatted slide content.
 * Each slide gets a clear heading + 2-3 short sentences. Guaranteed consistent layout.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

interface SlideData {
  heading: string;
  body: string;
}

interface SlideSet {
  slides: SlideData[];    // 3 learning slides
  realWorld: SlideData;   // "Why should a programmer care?" slide
}

const SYSTEM_PROMPT = `You create Instagram carousel slide content for a coding education app called Coduy.

You will receive a lesson's learning content and real-world examples. Your job is to extract the 4-6 MOST IMPORTANT concepts and create one slide per concept.

RULES FOR EACH SLIDE:
- heading: SHORT, catchy, max 35 characters. Like a chapter title.
- body: 2-4 clear sentences explaining this concept. Max 180 characters total.
- Simple language. No jargon without explanation.
- NO code, NO bullet points, NO markdown, NO special characters
- Each slide should teach ONE thing clearly

THE LAST SLIDE must always be "Why should a programmer care?" — a practical, real-world angle.

Create between 4 and 6 slides total (including the "why care" slide). Pick the most important topics.

RESPOND IN VALID JSON ONLY:
{
  "slides": [
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."},
    {"heading": "...", "body": "..."}
  ],
  "realWorld": {"heading": "...", "body": "..."}
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
    ? '\n\nIMPORTANT: Write ALL content in SLOVAK (slovenčina). Use proper Slovak grammar. Never use Czech. If a heading contains "Explained" or "vysvetlené/vysvetlenie" — remove that word and keep just the core topic (e.g. "Siete" not "Siete vysvetlené").'
    : '';

  const userPrompt = `LEARNING CONTENT:\n${learningContent.slice(0, 3000)}\n\nREAL WORLD:\n${(realWorldContent || '').slice(0, 1500)}${langInstruction}`;

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
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty GPT response');

    const parsed: SlideSet = JSON.parse(content);

    // Validate
    if (!parsed.slides || parsed.slides.length < 3 || parsed.slides.length > 8 || !parsed.realWorld) {
      throw new Error('Invalid slide structure from GPT');
    }

    console.log(`✨ GPT generated ${parsed.slides.length} slides + realWorld`);
    return parsed;
  } catch (err) {
    console.error('⚠️  GPT slide generation failed, using fallback:', err);
    return fallback(learningContent, realWorldContent);
  }
}

/** Simple fallback if GPT is unavailable */
function fallback(learning: string, realWorld: string): SlideSet {
  const paragraphs = (learning || '').split('\n\n').filter(p => p.trim());

  const chunkSize = Math.ceil(paragraphs.length / 3);
  const slides: SlideData[] = [];

  for (let i = 0; i < 3; i++) {
    const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
    const first = chunk[0] || '';
    const isHeading = first.length < 50 && !first.endsWith('.');
    slides.push({
      heading: isHeading ? first : '',
      body: (isHeading ? chunk.slice(1) : chunk).join(' ').slice(0, 150),
    });
  }

  const rwParas = (realWorld || '').split('\n\n').filter(p => p.trim());
  return {
    slides: slides.length >= 3 ? slides : [
      { heading: '', body: paragraphs.slice(0, 3).join(' ').slice(0, 150) },
      { heading: '', body: paragraphs.slice(3, 6).join(' ').slice(0, 150) },
      { heading: '', body: paragraphs.slice(6, 9).join(' ').slice(0, 150) },
    ],
    realWorld: {
      heading: rwParas[0]?.length < 50 ? rwParas[0] : '',
      body: rwParas.slice(0, 3).join(' ').slice(0, 150),
    },
  };
}
