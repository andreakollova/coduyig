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
2. TEACHER: give a short technical definition — what it is and what it's used for. One or two COMPLETE sentences. NEVER end a sentence with "for example" or "like" without finishing it. Every sentence must be complete. NEVER talk about code. (max 30 words)
3. STUDENT: excited follow-up question, not confused — genuinely curious and engaged (max 12 words). Like "Oh that's cool! So when would I actually use that?" or "Wait really? How does that work in practice?"
4. TEACHER: explain the SAME thing but in SIMPLER WORDS. NO real-life analogies (no shops, cafes, school, pizza). Just say the same concept more simply. For lambda: "Basically, when you need a small function just once, instead of writing the whole thing and giving it a name, you write it quickly in one line and you're done." (max 40 words)
5. STUDENT: gets it, excited, explains it back enthusiastically in their own words (15-20 words). Sound genuinely pumped, not robotic. Like "Ohhh so it's basically a quick throwaway function you write on the fly, that's sick!"
6. TEACHER: real-world examples — WHO uses this. Mention 2 REAL companies. Keep it short and punchy. (max 25 words)
7. STUDENT: short casual reaction, NOT over the top (max 6 words). Keep it chill and natural. "Hmm okay, that's pretty cool." or "Oh nice, makes sense." or "Huh, interesting." NEVER say "insane", "crazy", "no way" — just a calm acknowledgment.
8. TEACHER: one short closing line about why it matters (max 12 words). Punchy, motivating.
9. TEACHER: empty (silent CTA screen). Return {"speaker": "teacher", "spoken": "", "code": null}

RULES:
- ABSOLUTELY NEVER read code, syntax, variable names, function names, or operators aloud. NO "lambda x", NO "def square", NO "print()", NO "map()", NO "filter()". Describe what code DOES in everyday language only. This is the #1 RULE.
- Teacher's explanations MUST come from the provided lesson content, not invented
- ABSOLUTELY NEVER use colons (:) anywhere in spoken text. Periods and commas ONLY.
- EVERY sentence must be COMPLETE. NEVER leave a sentence unfinished. NEVER end with "for example" or "like" or "such as" without finishing the thought.
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
2. UČITEĽ: povie krátku odbornú poučku — čo to je a na čo to slúži. Jedna alebo dve kompletné vety. NIKDY nekončí vetou na "napríklad" alebo "ako" bez dokončenia. Každá veta musí byť úplná a dávať zmysel. NIKDY nehovor o kóde. (max 30 slov). NIKDY nečítaj kód.
3. ŠTUDENT: nadšená zvedavá otázka — NIE zmätený, ale zaujatý a zapálený (max 12 slov). "To je zaujímavé! A kedy sa to reálne používa?" alebo "Počkaj, fakt? A ako to funguje v praxi?"
4. UČITEĽ: vysvetlí to JEDNODUCHO ĽUDSKÝMI SLOVAMI. ŽIADNE analógie zo života (žiadny obchod, kaviareň, škola, pizza). Proste povedz tú istú vec jednoduchšie a zrozumiteľnejšie. Pre lambda: "V podstate, keď potrebuješ malú funkciu len na jedno použitie, namiesto toho aby si ju celú vypisoval a dával jej meno, napíšeš ju rýchlo do jedného riadku a hotovo." (max 40 slov)
5. ŠTUDENT: pochopil, nadšene to vysvetlí vlastnými slovami (15-20 slov). Musí znieť naozaj nadšene. NIKDY nepoužívaj slovo "bomba". Príklady: "Aha takže je to v podstate rýchla jednorazová funkcia, to je super šikovné!" alebo "Jasné, už to chápem, to je fakt cool!"
6. UČITEĽ: príklady z reálneho sveta — KTO to používa. Spomeň 2 REÁLNE firmy. Krátko a výstižne. (max 25 slov)
7. ŠTUDENT: krátka pokojná reakcia, NIE prehnaná (max 6 slov). Normálna ľudská odpoveď. "Hmm okej, to je fajn." alebo "Aha, zaujímavé." alebo "No dobre, dáva to zmysel." NIKDY nehovor "šialené", "crazy", "no way" — len pokojné uznanie.
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

    let lines = parsed.lines.map((l: any) => ({ speaker: l.speaker, spoken: l.spoken, code: l.code || undefined }));

    // Slovak grammar verification pass
    if (lang === 'sk') {
      lines = await verifySlovakGrammar(lines);
    }

    return { lines };
  } catch (err) {
    console.error('⚠️ GPT failed:', err);
    return fallbackScript(title, introduction, lang);
  }
}

async function verifySlovakGrammar(lines: ReelLine[]): Promise<ReelLine[]> {
  const allSpoken = lines.filter(l => l.spoken).map((l, i) => `${i}: ${l.spoken}`).join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Skontroluj a oprav tieto slovenské vety. Oprav:
- gramatiku (skloňovanie, pády, rod, zhoda)
- čiarky pred "ktorý/ktorá/kde/keď/pretože/lebo"
- nesprávne frázy ("bez potreby menovania" → "bez pomenovania")
- čechizmy
- vety ktoré nedávajú zmysel

Vráť JSON objekt kde kľúč je číslo riadku a hodnota je opravená veta.
Ak je veta správna, NEVRACEJ ju. Vráť len opravené.

{"2": "opravená veta", "5": "opravená veta"}

Ak je všetko správne, vráť {}

VETY:
${allSpoken}`
        }],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const fixes = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    const fixCount = Object.keys(fixes).length;
    if (fixCount > 0) {
      console.log(`🔍 SK grammar: ${fixCount} fixes`);
      for (const [idx, fixed] of Object.entries(fixes)) {
        const i = parseInt(idx);
        const spokenLines = lines.filter(l => l.spoken);
        if (spokenLines[i]) {
          console.log(`   ${i}: "${spokenLines[i].spoken.slice(0, 40)}..." → "${(fixed as string).slice(0, 40)}..."`);
          spokenLines[i].spoken = fixed as string;
        }
      }
    } else {
      console.log(`🔍 SK grammar: all correct`);
    }
  } catch (err) {
    console.error('⚠️ Grammar check failed:', err);
  }

  return lines;
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
