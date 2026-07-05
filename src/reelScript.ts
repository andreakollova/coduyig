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

const SYSTEM_EN = `You write conversational scripts for Instagram Reels about programming.

Two characters:
- STUDENT: curious beginner, asks questions, sometimes confused
- TEACHER: friendly expert who explains using the ACTUAL lesson content provided

Create a conversation with EXACTLY 8 lines:

1. STUDENT: casual greeting + asks about today's topic (max 12 words)
2. TEACHER: explains the core concept from LEARNING CONTENT. Definition, how it works, key details. Flowing sentences (max 40 words). Do NOT read code.
3. STUDENT: enthusiastic follow-up about practical usage (max 12 words). Like "Cool! How would I actually use this in a real project?"
4. TEACHER: gives a CONCRETE real-world scenario. Like "Say you have a list of students and you want to sort them by grade" (max 35 words)
5. STUDENT: not fully getting it, asks for simpler explanation (max 15 words). Like "Hmm wait, I'm not sure I fully get it, can you break it down?"
6. TEACHER: uses the INTRODUCTION to explain with a vivid analogy or "Imagine..." scenario. Make the concept click (max 45 words)
7. STUDENT: fully understands now, explains the ENTIRE concept back in their own casual words. Summarize what it is, how it works, why it's useful. Excited. (20-30 words)
8. TEACHER: empty (silent CTA screen). Return {"speaker": "teacher", "spoken": "", "code": null}

RULES:
- ABSOLUTELY NEVER use colons (:) or semicolons (;). Periods and commas ONLY.
- Write FLOWING sentences. Connect with "and", "which", "so", "because". NOT choppy fragments.
- Maximum 2-3 sentences per teacher line, but LONG and flowing.
- NEVER read code aloud. Describe what code does naturally.
- Teacher MUST use provided lesson content, not invent.
- Total: 150-200 words.

Also pick ONE code snippet (MAX 3 lines) from the LEARNING CONTENT. Attach to line 2 or 4.

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

const SYSTEM_SK = `Píšeš konverzačné skripty pre Instagram Reels o programovaní. Celý skript MUSÍ byť v SLOVENČINE.

Dve postavy:
- ŠTUDENT: zvedavý začiatočník, pýta sa otázky, niekedy nechapá. Hovorí mladícky a prirodzene.
- UČITEĽ: priateľský expert, vysvetľuje pomocou SKUTOČNÉHO obsahu lekcie.

Vytvor konverzáciu s PRESNE 8 riadkami:

1. ŠTUDENT: neformálny pozdrav + pýta sa na tému. Príklady: "Čauko, aká je téma dnešnej hodiny?" alebo "Hej, o čom sa dnes učíme?" alebo "No tak, čo máme dnes nové?" (max 12 slov)
2. UČITEĽ: vysvetlí koncept z LEARNING CONTENT. Čo to je, ako to funguje, kľúčové detaily. Plynulé dlhé vety (max 40 slov). NEČÍTAJ kód.
3. ŠTUDENT: nadšene sa pýta na praktické využitie. Príklady: "Super, a ako to môžem v praxi využiť?" alebo "To znie fajn, a na čo sa to reálne používa?" (max 12 slov)
4. UČITEĽ: dá KONKRÉTNY príklad zo života. Napríklad "Povedzme že máš zoznam študentov a chceš ich zoradiť podľa známok" (max 35 slov)
5. ŠTUDENT: ešte úplne nechápe, pýta sa jednoduchšie. Príklady: "Hm, ešte to úplne nechápem, vieš to vysvetliť jednoduchšie?" alebo "Počkaj, to mi ešte celkom nedošlo" (max 15 slov)
6. UČITEĽ: teraz použije INTRODUCTION na vysvetlenie s analógiou alebo "Predstav si..." scenárom. Nech to cvakne (max 45 slov)
7. ŠTUDENT: NAJDÔLEŽITEJŠÍ RIADOK. Teraz UŽ CHÁPE a vysvetlí celý koncept vlastnými jednoduchými slovami. Musí zhrnúť čo to je, ako to funguje a prečo je to užitočné. Na konci nech povie niečo autentické a nadšené ako "to je fakt paráda!" alebo "no to je geniálne!" alebo "pecka!" (20-30 slov). Príklad: "Aha, takže namiesto toho aby som písal celú funkciu, proste napíšem jeden riadok ktorý spraví to isté a nemusím mu ani dávať meno, to je fakt paráda!"
8. UČITEĽ: prázdny riadok (tichý CTA screen). Vráť {"speaker": "teacher", "spoken": "", "code": null}

PRAVIDLÁ:
- NIKDY nepoužívaj dvojbodky (:) alebo bodkočiarky (;). Iba bodky a čiarky.
- Píš PLYNULÉ vety. Spájaj cez "a", "ktorý", "takže", "pretože". NIE krátke fragmenty.
- Maximum 2-3 vety na učiteľov riadok, ale DLHÉ a plynulé.
- NEČÍTAJ kód nahlas. Opisuj čo kód robí prirodzene.
- Učiteľ MUSÍ používať poskytnutý obsah lekcie.
- Použi neformálnu slovenčinu. "Čauko" nie "Ahoj", "super" nie "výborne", "fajn" nie "dobre", "hm", "no", "aha", "jasné".
- NIKDY čeština. Vždy slovenčina.
- Celkovo: 150-200 slov.

Tiež vyber JEDEN kód snippet (MAX 3 riadky) z LEARNING CONTENT. Pridaj ho k riadku 2 alebo 4.

Vráť VALID JSON:
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
    return fallbackScript(title, introduction, lang);
  }

  const system = lang === 'sk' ? SYSTEM_SK : SYSTEM_EN;

  const prompt = `LESSON TITLE: ${title}

INTRODUCTION (use this for line 6):
${introduction.slice(0, 2500)}

LEARNING CONTENT (use this for lines 2 and 4):
${learningContent.slice(0, 4000)}

KEY TAKEAWAYS:
${keyTakeaways.join('\n')}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        temperature: 0.5,
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
    return fallbackScript(title, introduction, lang);
  }
}

function fallbackScript(title: string, introduction?: string, lang: 'en' | 'sk' = 'en'): ReelScript {
  const intro = introduction
    ? introduction.split('.').slice(0, 3).join('.') + '.'
    : lang === 'sk' ? 'Predstav si to ako skratku, ktorá zjednodušuje všetko.' : 'Think of it like a shortcut that makes everything simpler.';

  if (lang === 'sk') {
    return { lines: [
      { speaker: 'student', spoken: `Čauko, o čom sa dnes učíme?` },
      { speaker: 'teacher', spoken: `Dnes si povieme niečo o ${title}, je to jeden z kľúčových konceptov, ktorý by mal poznať každý vývojár.` },
      { speaker: 'student', spoken: `Super, a ako to môžem v praxi využiť?` },
      { speaker: 'teacher', spoken: `Používa sa to v reálnych projektoch neustále, robí to tvoj kód čistejší a efektívnejší.` },
      { speaker: 'student', spoken: `Hm, ešte to úplne nechápem, vieš to vysvetliť jednoduchšie?` },
      { speaker: 'teacher', spoken: intro },
      { speaker: 'student', spoken: `Aha, už to chápem, to dáva zmysel!` },
      { speaker: 'teacher', spoken: '' },
    ]};
  }

  return { lines: [
    { speaker: 'student', spoken: `Hey! What's ${title}?` },
    { speaker: 'teacher', spoken: `It's one of the key concepts every developer should know, let me explain how it works and why it matters.` },
    { speaker: 'student', spoken: `Cool! How would I actually use this?` },
    { speaker: 'teacher', spoken: `You'd use it all the time in real projects, it makes your code cleaner and more efficient.` },
    { speaker: 'student', spoken: `Hmm wait, can you break that down simpler?` },
    { speaker: 'teacher', spoken: intro },
    { speaker: 'student', spoken: `Ohh okay, that makes so much sense now!` },
    { speaker: 'teacher', spoken: '' },
  ]};
}
