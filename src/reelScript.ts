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

1. STUDENT: starts with a random casual greeting like "Hey dude,", "Hey bro,", or "Hey little bro," then asks about today's topic (max 12 words). Examples: "Hey dude, what are we learning today?" or "Hey bro, what's today's topic?" or "Hey little bro, what do you have for me today?"
2. TEACHER: answer and explain the topic using SIMPLE everyday words. Imagine explaining to a 14-year-old friend. NO technical jargon without immediately explaining it. Example: "Today we are looking at lambda functions, which are basically tiny shortcuts, instead of writing a whole function with a name, you just write it in one quick line." (max 35 words). NEVER read code. NEVER use complicated words back to back.
3. STUDENT: excited follow-up question, not confused — genuinely curious and engaged (max 12 words). Like "Oh that's cool! So when would I actually use that?" or "Wait really? How does that work in practice?"
4. TEACHER: explain it even simpler, like you are talking to your younger sibling. Use "basically", "so imagine", "it is like when you". Short simple words, no jargon. Example: "So basically when you need something just once, instead of building a whole big thing, you just write one quick line and you are done." NO complicated vocabulary. (max 45 words)
5. STUDENT: gets it, excited, explains it back enthusiastically in their own words (15-20 words). Sound genuinely pumped, not robotic. VARY the reactions — never repeat the same phrase across videos. Examples: "Ohhh so it's basically a quick throwaway function you write on the fly, that's sick!" or "Wait that makes so much sense now, I love how simple that is!" or "No way, that's actually genius, so you just skip the whole setup!"
6. TEACHER: explain a real-world use case. ONLY mention a specific company if it genuinely makes sense and is interesting (like "Spotify uses this to handle millions of songs"). Do NOT force "companies like X" when the topic is too generic (like documentation, variables, loops). In those cases, give a practical real-world scenario instead, like "imagine you come back to your code after 3 months and you have no idea what it does, that is why this matters." Must feel natural, not forced. (max 30 words)
7. TEACHER: closing thought — just say why it matters plainly. Example: "Without this you'd be writing way more code for simple stuff, so it really saves you time and keeps things clean." (max 25 words)
8. STUDENT: final line of the whole video. Positive, grateful, enthusiastic. VARY every time — never the same closing. Examples: "That's awesome, thanks, this really helped!" or "Yo that was super clear, appreciate it!" or "Love it, I'm definitely using this, thanks!" or "That's so cool, can't wait to try it!" or "Nice, I feel way more confident now, cheers!" (max 12 words)
9. TEACHER: empty (silent CTA screen). Return {"speaker": "teacher", "spoken": "", "code": null}

RULES:
- ABSOLUTELY NEVER read code, syntax, variable names, function names, or operators aloud. NO "lambda x", NO "def square", NO "print()", NO "map()", NO "filter()". Describe what code DOES in everyday language only. This is the #1 RULE.
- NEVER use abbreviations or acronyms EXCEPT these allowed ones: AI, API, CPU, CSV, DNS, GPS, HDD, ID, JSON, OS, QR, RAM, README, REST, SQL, SSD, USB. If you need to mention any other abbreviation, spell out the full name instead.
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

1. ŠTUDENT: začne náhodným oslovením ako "Kámo,", "Bráško,", alebo "Kamoško," a potom sa pýta na tému (max 12 slov). Príklady: "Kámo, čo sa dnes budeme učiť?" alebo "Bráško, aká je dnešná téma?" alebo "Kamoško, čo pre mňa máš dnes?"
2. UČITEĽ: odpovie a vysvetlí tému JEDNODUCHO, ako keby to vysvetľoval 14-ročnému kamarátovi. ŽIADNE zložité slová za sebou. Ak použiješ odborný výraz, hneď ho vysvetli. Napríklad: "Dnes sa pozrieme na lambda funkcie, čo sú vlastne také malé skratky, namiesto toho aby si písal celú funkciu s menom, napíšeš ju rýchlo do jedného riadku." (max 35 slov). NIKDY nečítaj kód.
3. ŠTUDENT: nadšená zvedavá otázka — NIE zmätený, ale zaujatý a zapálený (max 12 slov). "To je zaujímavé! A kedy sa to reálne používa?" alebo "Počkaj, fakt? A ako to funguje v praxi?"
4. UČITEĽ: vysvetlí to ešte jednoduchšie, ako keby rozprával mladšiemu súrodencovi. Použi "vlastne", "proste", "predstav si". Krátke jednoduché slová, žiadny žargón. Napríklad: "Vlastne keď niečo potrebuješ iba raz, tak namiesto toho aby si staval celú veľkú vec, proste napíšeš jeden rýchly riadok a hotovo." ŽIADNE komplikované slovíčka. (max 45 slov)
5. ŠTUDENT: pochopil, nadšene to vysvetlí vlastnými slovami (15-20 slov). Musí znieť naozaj nadšene. NIKDY nepoužívaj slovo "bomba". VŽDY iná reakcia — nikdy neopakuj rovnakú frázu. Príklady: "Aha takže je to v podstate rýchla jednorazová funkcia, to je super šikovné!" alebo "Počkaj, to dáva totálny zmysel, mám to!" alebo "No to je geniálne, takže proste preskočíš celý ten setup!" alebo "Ty jo, to je fakt elegantné riešenie, páči sa mi to!"
6. UČITEĽ: vysvetli reálne použitie v praxi. Spomeň konkrétnu firmu IBA ak to naozaj dáva zmysel a je to zaujímavé (napr. "Spotify to používa na spracovanie miliónov skladieb"). NENÚŤ "firmy ako X" keď je téma príliš všeobecná (napr. dokumentácia, premenné, cykly). V tých prípadoch daj praktický scenár, napríklad "predstav si že sa vrátiš k svojmu kódu po 3 mesiacoch a netušíš čo to robí, preto je toto dôležité." Musí znieť prirodzene, nie nútene. (max 30 slov)
7. UČITEĽ: záverečná myšlienka plynulo — prečo je to dôležité. Jednoducho povedz prečo. Napríklad: "Bez tohto by si musel písať oveľa viac kódu, takže ti to reálne šetrí čas a robí kód prehľadnejší." (max 25 slov)
8. ŠTUDENT: posledná veta celého videa. Pozitívna, vďačná, entuziastická. VŽDY iná — nikdy rovnaký záver. Príklady: "Super, ďakujem, toto mi fakt pomohlo!" alebo "Ty jo, to bolo super jasné, vďaka!" alebo "Páči sa mi to, určite to vyskúšam, dík!" alebo "To je pecka, teraz sa na to už teším!" alebo "Jasné, cítim sa oveľa istejšie, ďakujem!" (max 12 slov)
9. UČITEĽ: prázdny riadok (tichý CTA screen). Vráť {"speaker": "teacher", "spoken": "", "code": null}

PRAVIDLÁ:
- ABSOLÚTNE NIKDY nečítaj kód, syntax, názvy premenných, funkcií ani operátorov nahlas. ŽIADNE "lambda x", ŽIADNE "def square", ŽIADNE "print()", ŽIADNE "map()", ŽIADNE "filter()". Opisuj čo kód ROBÍ bežným jazykom. Toto je pravidlo číslo 1.
- NIKDY nepoužívaj skratky ani akronymy OKREM týchto povolených: AI, API, CPU, CSV, DNS, GPS, HDD, ID, JSON, OS, QR, RAM, README, REST, SQL, SSD, USB. Ak potrebuješ spomenúť inú skratku, použi celý názov namiesto skratky.
- NIKDY nepoužívaj dvojbodky (:) alebo bodkočiarky (;). Iba bodky a čiarky.
- Píš PLYNULÉ vety. Spájaj cez "a", "ktorý", "takže", "pretože". NIE krátke fragmenty.
- Použi neformálnu slovenčinu. "Čauko", "super", "fajn", "hm", "aha", "jasné", "pecka", "paráda", "crazy".
- NIKDY čeština.
- Správna slovenská gramatika. Pred "ktorý", "ktorá", "ktoré", "kde", "keď", "pretože", "lebo" VŽDY daj čiarku.
- Dávaj pozor na správne tvary — "efektívne programovať" (príslovka) vs "efektívne riešenie" (prídavné meno). Zmäkčenie na konci závisí od kontextu.
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
      { speaker: 'teacher', spoken: 'Firmy ako Stripe, Discord alebo Shopify toto používajú každý deň vo svojich aplikáciách.' },
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
    { speaker: 'teacher', spoken: 'Companies like Stripe, Discord and Shopify use this every day in their applications.' },
    { speaker: 'student', spoken: 'Wow, I had no idea!' },
    { speaker: 'teacher', spoken: 'Once you master this, you will write much better code.' },
    { speaker: 'teacher', spoken: '' },
  ]};
}
