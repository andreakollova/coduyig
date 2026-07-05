/**
 * Generate a conversational script for IG Reel from lesson content.
 * Structure: technical explanation → student confused → simple analogy → real-world examples
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

Create a conversation with EXACTLY 9 lines:

1. STUDENT: casual greeting + asks about today's topic (max 12 words)
2. TEACHER: clear explanation of the concept from LEARNING CONTENT. Start with a short definition, then add one technical detail about HOW it works. Punchy but informative — not a lecture, but enough to actually learn something. (max 35 words)
3. STUDENT: excited follow-up question, not confused — genuinely curious and engaged (max 12 words). Like "Oh that's cool! So when would I actually use that?" or "Wait really? How does that work in practice?"
4. TEACHER: explains with a TANGIBLE real-life analogy that captures what makes THIS concept UNIQUE. Not generic — the analogy must nail the specific thing that makes this different. (max 35 words)
5. STUDENT: gets it, excited, explains it back enthusiastically in their own words (15-20 words). Sound genuinely pumped, not robotic. Like "Ohhh so it's basically a quick throwaway function you write on the fly, that's sick!"
6. TEACHER: real-world examples — WHO uses this. Mention 2 REAL companies. Keep it short and punchy. (max 25 words)
7. STUDENT: short excited reaction (max 8 words). Genuinely impressed. "No way, that's actually insane!" or "Okay that's way cooler than I thought!"
8. TEACHER: one short closing line about why it matters (max 12 words). Punchy, motivating.
9. TEACHER: empty (silent CTA screen). Return {"speaker": "teacher", "spoken": "", "code": null}

RULES:
- ABSOLUTELY NEVER read code, syntax, variable names, function names, or operators aloud. NO "lambda x", NO "def square", NO "print()", NO "map()", NO "filter()". Describe what code DOES in everyday language only. This is the #1 RULE.
- Teacher's explanations MUST come from the provided lesson content, not invented
- ABSOLUTELY NEVER use colons (:) anywhere in spoken text. Periods and commas ONLY.
- Write FLOWING sentences. Connect with "and", "which", "so", "because". NOT choppy fragments.
- Maximum 2-3 sentences per teacher line, but LONG and flowing.
- Total spoken text: 120-160 words. Keep it PUNCHY and fast-paced, not a lecture.

Also pick ONE code snippet (MAX 3 lines) from the LEARNING CONTENT. Attach to line 2.

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
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "", "code": null}
  ]
}`;

const SYSTEM_SK = `Píšeš konverzačné skripty pre Instagram Reels o programovaní. Celý skript MUSÍ byť v SLOVENČINE.

Dve postavy:
- ŠTUDENT: zvedavý začiatočník, pýta sa, niekedy nechápe. Hovorí mladícky a prirodzene.
- UČITEĽ: priateľský expert, vysvetľuje pomocou SKUTOČNÉHO obsahu lekcie.

Vytvor konverzáciu s PRESNE 9 riadkami:

1. ŠTUDENT: neformálny pozdrav + pýta sa na tému. "Čauko, aká je téma dnešnej hodiny?" alebo "Hej, o čom sa dnes učíme?" (max 12 slov)
2. UČITEĽ: jasné vysvetlenie konceptu z LEARNING CONTENT. Začni definíciou, potom pridaj jeden technický detail o tom AKO to funguje. Výstižne ale informatívne — nie prednáška, ale dosť na to aby sa niečo naučil. (max 35 slov). NIKDY nečítaj kód.
3. ŠTUDENT: nadšená zvedavá otázka — NIE zmätený, ale zaujatý a zapálený (max 12 slov). "To je zaujímavé! A kedy sa to reálne používa?" alebo "Počkaj, fakt? A ako to funguje v praxi?"
4. UČITEĽ: vysvetlí to HMATATEĽNOU analógiou zo života, ktorá zachytí to čo robí TENTO koncept UNIKÁTNYM. Nie generická — musí presne vystihovať tú špecifickú vec. (max 35 slov)
5. ŠTUDENT: pochopil, nadšene to vysvetlí vlastnými slovami (15-20 slov). Musí znieť naozaj nadšene. NIKDY nepoužívaj slovo "bomba". Príklady: "Aha takže je to v podstate rýchla jednorazová funkcia, to je super šikovné!" alebo "Jasné, už to chápem, to je fakt cool!"
6. UČITEĽ: príklady z reálneho sveta — KTO to používa. Spomeň 2 REÁLNE firmy. Krátko a výstižne. (max 25 slov)
7. ŠTUDENT: krátka nadšená reakcia (max 8 slov). "Nie, to je fakt šialené!" alebo "No tak to je oveľa zaujímavejšie ako som čakal!"
8. UČITEĽ: jedna krátka záverečná veta prečo na tom záleží (max 12 slov). Výstižne, motivujúco.
9. UČITEĽ: prázdny riadok (tichý CTA screen). Vráť {"speaker": "teacher", "spoken": "", "code": null}

PRAVIDLÁ:
- ABSOLÚTNE NIKDY nečítaj kód, syntax, názvy premenných, funkcií ani operátorov nahlas. ŽIADNE "lambda x", ŽIADNE "def square", ŽIADNE "print()", ŽIADNE "map()", ŽIADNE "filter()". Opisuj čo kód ROBÍ bežným jazykom. Toto je pravidlo číslo 1.
- NIKDY nepoužívaj dvojbodky (:) alebo bodkočiarky (;). Iba bodky a čiarky.
- Píš PLYNULÉ vety. Spájaj cez "a", "ktorý", "takže", "pretože". NIE krátke fragmenty.
- Použi neformálnu slovenčinu. "Čauko", "super", "fajn", "hm", "aha", "jasné", "pecka", "paráda", "crazy".
- NIKDY čeština.
- Správna slovenská gramatika. Pred "ktorý", "ktorá", "ktoré", "kde", "keď", "pretože", "lebo" VŽDY daj čiarku.
- Celkovo: 170-220 slov.

Vyber JEDEN kód snippet (MAX 3 riadky) z LEARNING CONTENT. Pridaj ho k riadku 2.

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
    {"speaker": "teacher", "spoken": "...", "code": null},
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

INTRODUCTION (use for the simple analogy in line 4):
${introduction.slice(0, 2500)}

LEARNING CONTENT (use for technical explanation in line 2):
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
        max_tokens: 1800,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    if (!parsed.lines || parsed.lines.length < 8) throw new Error('Invalid');

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
      { speaker: 'student', spoken: 'Čauko, o čom sa dnes učíme?' },
      { speaker: 'teacher', spoken: `Dnes si povieme niečo o ${title}, je to jeden z kľúčových konceptov, ktorý by mal poznať každý vývojár.` },
      { speaker: 'student', spoken: 'Hm, to znie dosť zložito, vieš to vysvetliť jednoduchšie?' },
      { speaker: 'teacher', spoken: intro },
      { speaker: 'student', spoken: 'Aha, už to chápem, to je fakt paráda!' },
      { speaker: 'teacher', spoken: 'Toto používajú firmy ako Netflix, Google aj Spotify každý deň vo svojich aplikáciách.' },
      { speaker: 'student', spoken: 'Vau, to je crazy!' },
      { speaker: 'teacher', spoken: 'Keď toto zvládneš, budeš písať oveľa lepší kód.' },
      { speaker: 'teacher', spoken: '' },
    ]};
  }

  return { lines: [
    { speaker: 'student', spoken: `Hey! What's today's topic?` },
    { speaker: 'teacher', spoken: `Today we're looking at ${title}, one of the key concepts every developer should know.` },
    { speaker: 'student', spoken: 'Hmm, that sounds complicated, can you explain it simpler?' },
    { speaker: 'teacher', spoken: intro },
    { speaker: 'student', spoken: 'Ohh okay, that makes sense now, that is really cool!' },
    { speaker: 'teacher', spoken: 'Companies like Netflix, Google and Spotify use this every day in their applications.' },
    { speaker: 'student', spoken: 'Wow, I had no idea!' },
    { speaker: 'teacher', spoken: 'Once you master this, you will write much better code.' },
    { speaker: 'teacher', spoken: '' },
  ]};
}
