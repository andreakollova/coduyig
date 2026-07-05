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
2. TEACHER: explains the core concept TECHNICALLY from LEARNING CONTENT. Professional definition, how it works, key details. This should sound like a proper explanation. Flowing sentences (max 45 words)
3. STUDENT: confused, doesn't fully understand the technical explanation (max 15 words). Like "Hmm wait, that sounds complicated, can you explain it in a simpler way?"
4. TEACHER: NOW explains it with a TANGIBLE real-life analogy — pizza, sticky notes, drawers, phone, etc. Start with "Think of it like..." or "Imagine..." The analogy MUST accurately capture the essence of the concept. (max 50 words)
5. STUDENT: now gets it, excited, summarizes in their own simple words (20-30 words). Must be accurate but casual.
6. TEACHER: gives real-world examples of WHO uses this and HOW. Mention REAL companies or products. Like "Netflix uses this to handle millions of streams" or "Google Maps relies on this for route calculations" or "Every time you log into Instagram, this runs behind the scenes." Give 2-3 specific examples. (max 45 words)
7. STUDENT: impressed, reacts naturally (max 10 words). Like "Wow, I had no idea it was everywhere!" or "That's crazy, so basically every app uses this!"
8. TEACHER: closing thought — why this matters for the student's coding journey (max 20 words). Like "Once you master this, you'll write much cleaner and more efficient code."
9. TEACHER: empty (silent CTA screen). Return {"speaker": "teacher", "spoken": "", "code": null}

RULES:
- ABSOLUTELY NEVER read code, syntax, variable names, function names, or operators aloud. NO "lambda x", NO "def square", NO "print()", NO "map()", NO "filter()". Describe what code DOES in everyday language only. This is the #1 RULE.
- Teacher's explanations MUST come from the provided lesson content, not invented
- ABSOLUTELY NEVER use colons (:) anywhere in spoken text. Periods and commas ONLY.
- Write FLOWING sentences. Connect with "and", "which", "so", "because". NOT choppy fragments.
- Maximum 2-3 sentences per teacher line, but LONG and flowing.
- Total spoken text: 170-220 words.

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
2. UČITEĽ: vysvetlí koncept ODBORNE z LEARNING CONTENT. Profesionálna definícia, ako to funguje, kľúčové detaily. Plynulé dlhé vety (max 45 slov). NIKDY nečítaj kód.
3. ŠTUDENT: zmätený, nerozumie odbornému vysvetleniu (max 15 slov). Napríklad "Hm, to znie dosť zložito, vieš mi to vysvetliť nejak jednoduchšie?"
4. UČITEĽ: TERAZ to vysvetlí pomocou HMATATEĽNEJ analógie zo života — pizza, papierik, krabica, šuflík, telefón. Začni s "Predstav si..." Analógia MUSÍ presne vystihovať podstatu konceptu. (max 50 slov)
5. ŠTUDENT: TERAZ UŽ CHÁPE. Nadšene zhŕňa čo pochopil vlastnými jednoduchými slovami (20-30 slov). Musí byť presné ale casual. Koniec nech je autentický a rôzny — NIE vždy "to je fakt paráda". Príklady koncov: "no to dáva zmysel!", "tak to je geniálne!", "jasné, to je easy!", "super, už mi to cvaklo!", "aha, tak toto je fakt šikovné!"
6. UČITEĽ: dá príklady z reálneho sveta — KTO to používa a AKO. Spomeň REÁLNE firmy alebo produkty. Napríklad "Netflix to používa na spracovanie miliónov streamov" alebo "Zakaždým keď sa prihlásiš na Instagram, toto beží na pozadí." Daj 2-3 konkrétne príklady. (max 45 slov)
7. ŠTUDENT: ohromený, reaguje prirodzene (max 10 slov). "Vau, to som nevedel že je to všade!" alebo "To je crazy, takže to fakt používa každá appka!"
8. UČITEĽ: záverečná myšlienka — prečo je to dôležité pre študentovu cestu programovania (max 20 slov). "Keď toto zvládneš, budeš písať oveľa čistejší a efektívnejší kód."
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
