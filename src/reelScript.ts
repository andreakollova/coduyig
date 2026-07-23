/**
 * Generate a conversational script for IG Reel from lesson content.
 * Structure: technical explanation → student curious → deeper explanation → real-world examples
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

1. STUDENT: starts with a random casual greeting like "Hey dude,", "Hey bro,", or "Hey little bro," then asks about today's topic (max 12 words). Examples: "Hey dude, what are we learning today?" or "Hey bro, what's today's topic?" or "Hey little bro, what do you have for me today?"
2. TEACHER: Start with "Today we are looking at [topic]." (short sentence, period). Then REPEAT the topic name and define it: "[Topic] is/are..." Example: "Today we are looking at lambda functions. Lambda functions are small anonymous functions that you write in a single line instead of defining a full named function." (max 45 words). NEVER read code. ALWAYS repeat the topic name at the start of the second sentence.
3. STUDENT: short casual follow-up, genuinely curious (max 10 words). Start with "OK", "Cool", "Nice", "Right" then ask. Like "Cool, and how does that work in practice?" or "OK so where would I use that?" or "Nice, can you show me an example?"
4. TEACHER: explain HOW it works — the mechanism, not the definition again. NEVER repeat what you said in line 2. Say something NEW. Example: "When you call it, Python runs that one line, gives you back the result, and frees the memory right after." (max 35 words). NO simplistic analogies.
5. STUDENT: confirms understanding in ONE short sentence (max 15 words). Say it simply in their OWN words — DO NOT repeat the teacher. Examples: "Oh so it just runs once and disappears, got it." or "Right, so I just filter what I need without a loop."
6. TEACHER: ONE practical example where this is used in real life. Be specific and brief. Example: "Spotify uses this to sort millions of playlists on the fly." or "When you scroll Instagram, this runs every time a new post loads." (max 25 words)
7. TEACHER: ONE sentence — what would happen WITHOUT this. Example: "Without it you would copy paste the same code everywhere and bugs would be a nightmare." (max 20 words)
8. STUDENT: final line of the whole video. Positive, grateful. VARY every time — never the same closing. Examples: "That's awesome, thanks, this really helped!" or "That was super clear, appreciate it!" or "Love it, I'm definitely using this, thanks!" or "Nice, I feel way more confident now, cheers!" (max 12 words). This is the LAST line of the video. Nothing comes after this.

RULES:
- ABSOLUTELY NEVER read code syntax or special characters aloud. NO "lambda x", NO "def square", NO "print()", NO "__str__". You CAN say concept names like "args", "kwargs", "tuple" but NEVER with asterisks, underscores, parentheses or any code symbols. Say "args" not "*args". Describe what code DOES, not how it looks. This is the #1 RULE.
- NEVER use abbreviations or acronyms EXCEPT these allowed ones: AI, API, CPU, CSV, DNS, GPS, HDD, ID, JSON, OS, QR, RAM, README, REST, SQL, SSD, USB. If you need to mention any other abbreviation, spell out the full name instead.
- Teacher's explanations MUST come from the provided lesson content, not invented
- ABSOLUTELY NEVER use colons (:) anywhere in spoken text. Periods and commas ONLY.
- EVERY sentence must be COMPLETE. NEVER leave a sentence unfinished. NEVER end with "for example" or "like" or "such as" without finishing the thought.
- NEVER use simplistic analogies like chefs, recipes, boxes, houses, cars, kitchens, drawers, bookshelves. Use real technical examples with actual technologies, apps, or code scenarios instead.
- Write FLOWING sentences. Connect with "and", "which", "so", "because". NOT choppy fragments.
- Maximum 2-3 sentences per teacher line, but LONG and flowing.
- Total spoken text: 120-160 words. Keep it short and punchy. Every sentence must add NEW information — NEVER repeat the same idea in different words.

Also pick ONE code snippet (MAX 3 lines) from the LEARNING CONTENT provided below. The code MUST be relevant to the lesson topic. NEVER use example code from this prompt. Attach to line 2.

Return VALID JSON:
{
  "lines": [
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": "PICK FROM LESSON CONTENT"},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "student", "spoken": "final grateful line", "code": null}
  ]
}`;

const SYSTEM_SK = `Píšeš konverzačné skripty pre Instagram Reels o programovaní. Celý skript MUSÍ byť v SLOVENČINE.

Dve postavy:
- ŠTUDENT: zvedavý začiatočník, pýta sa, niekedy nechápe. Hovorí mladícky a prirodzene.
- UČITEĽ: priateľský expert, vysvetľuje pomocou SKUTOČNÉHO obsahu lekcie.

Vytvor konverzáciu s PRESNE 8 riadkami:

1. ŠTUDENT: začne náhodným oslovením ako "Kámo,", "Bráško,", alebo "Kamoško," a potom sa pýta na tému (max 12 slov). Príklady: "Kámo, čo sa dnes budeme učiť?" alebo "Bráško, aká je dnešná téma?" alebo "Kamoško, čo pre mňa máš dnes?"
2. UČITEĽ: odpovie a vysvetlí tému zrozumiteľne ale profesionálne, ako skúsený programátor. Hovor plynulo v dlhých vetách, nie koktavo. Ak použiješ odborný výraz, hneď ho vysvetli. Napríklad: "Dnes sa pozrieme na lambda funkcie. Sú to anonymné funkcie, ktoré napíšeš do jedného riadku namiesto toho, aby si definoval celú funkciu s menom." (max 45 slov). NIKDY nečítaj kód. NIKDY nepoužívaj výplňové slová ako "vlastne", "proste", "tak nejako".
3. ŠTUDENT: pokojná zvedavá otázka (max 12 slov). "OK a kedy sa to reálne používa?" alebo "A ako to funguje v praxi?"
4. UČITEĽ: vysvetlí to hlbšie a technickejšie, ale stále zrozumiteľne. Hovor plynulo a sebaisto, ako človek čo to naozaj ovláda. Vysvetli AKO to funguje krok za krokom. Napríklad: "Keď niečo potrebuješ iba raz, napíšeš jeden riadok a Python ho vykoná priamo tam, vráti výsledok a pamäť sa uvoľní." ŽIADNE laické prirovnania. ŽIADNE výplňové slová (vlastne, proste, tak nejako). Plynulé dlhé vety. (max 55 slov)
5. ŠTUDENT: pochopil a VLASTNÝMI SLOVAMI vysvetlí čo sa naučil (20-30 slov). Hovorí normálnym pokojným hlasom, rovnako ako v ostatných riadkoch. Zhrnie koncept a trochu to rozvinie — ukáže že pochopil pridaním vlastných myšlienok. NIKDY nepoužívaj prehnané nadšené reakcie ako "to je bomba!", "pecka!", "ty jo!". Proste hovorí prirodzene. VŽDY iná reakcia. Príklady: "Takže vlastne namiesto toho aby som písal celú funkciu s menom, napíšem rýchly jednoriadkový výraz ktorý spraví to isté a potom zmizne, to dáva zmysel." alebo "Jasné, takže to prejde zoznamom a vyberie iba tie položky čo spĺňajú moju podmienku, čím sa vyhnem manuálnemu cyklu."
6. UČITEĽ: vysvetli reálne použitie v praxi. Spomeň konkrétnu firmu IBA ak to naozaj dáva zmysel a je to zaujímavé (napr. "Spotify to používa na spracovanie miliónov skladieb"). NENÚŤ "firmy ako X" keď je téma príliš všeobecná (napr. dokumentácia, premenné, cykly). V tých prípadoch daj praktický scenár, napríklad "predstav si že sa vrátiš k svojmu kódu po 3 mesiacoch a netušíš čo to robí, preto je toto dôležité." Musí znieť prirodzene, nie nútene. (max 35 slov)
7. UČITEĽ: záverečná myšlienka plynulo — prečo je to dôležité. Vysvetli ešte jeden detail alebo dôvod navyše. Napríklad: "Bez tohto by si musel písať oveľa viac kódu, takže ti to reálne šetrí čas a robí kód prehľadnejší." (max 30 slov)
8. ŠTUDENT: posledná veta celého videa. Pozitívna, vďačná. VŽDY iná — nikdy rovnaký záver. Veta MUSÍ končiť slovom "ďakujem", "vďaka" alebo "dík". Príklady: "Super, toto mi fakt pomohlo, ďakujem!" alebo "To bolo jasné, vďaka!" alebo "Páči sa mi to, určite to vyskúšam, dík!" (max 12 slov). Toto je POSLEDNÝ riadok videa. Po ňom už nič nepíš.

PRAVIDLÁ:
- ABSOLÚTNE NIKDY nečítaj kód, syntax, názvy premenných, funkcií ani operátorov nahlas. ŽIADNE "lambda x", ŽIADNE "def square", ŽIADNE "print()", ŽIADNE "map()", ŽIADNE "filter()". Opisuj čo kód ROBÍ bežným jazykom. Toto je pravidlo číslo 1.
- NIKDY nepoužívaj skratky ani akronymy OKREM týchto povolených: AI, API, CPU, CSV, DNS, GPS, HDD, ID, JSON, OS, QR, RAM, README, REST, SQL, SSD, USB. Ak potrebuješ spomenúť inú skratku, použi celý názov namiesto skratky.
- NIKDY nepoužívaj dvojbodky (:) alebo bodkočiarky (;). Iba bodky a čiarky.
- NIKDY nepoužívaj laické prirovnania ako kuchár, recept, škatuľa, dom, auto, kuchyňa, zásuvka, polička. Použi reálne technické príklady so skutočnými technológiami, appkami alebo kódom.
- Píš PLYNULÉ vety. Spájaj cez "a", "ktorý", "takže", "pretože". NIE krátke fragmenty.
- Použi prirodzenú slovenčinu. Učiteľ hovorí profesionálne ale priateľsky. NEPOUŽÍVAJ slangové slová ako "pecka", "crazy", "paráda". Hovor plynulo a sebaisto.
- NIKDY čeština.
- Správna slovenská gramatika. Pred "ktorý", "ktorá", "ktoré", "kde", "keď", "pretože", "lebo" VŽDY daj čiarku.
- Dávaj pozor na správne tvary — "efektívne programovať" (príslovka) vs "efektívne riešenie" (prídavné meno). Zmäkčenie na konci závisí od kontextu.
- Celkovo: 200-260 slov.

Vyber JEDEN kód snippet (MAX 3 riadky) z LEARNING CONTENT nižšie. Kód MUSÍ byť relevantný k téme lekcie. NIKDY nepoužívaj príkladový kód z tohto promptu. Pridaj ho k riadku 2.

Vráť VALID JSON:
{
  "lines": [
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": "VYBER Z LEARNING CONTENT"},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "student", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "teacher", "spoken": "...", "code": null},
    {"speaker": "student", "spoken": "posledna vdacna veta", "code": null}
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

  // Always generate in EN first — SK gets translated after for better quality
  const system = SYSTEM_EN;

  const prompt = `LESSON TITLE: ${title}

INTRODUCTION (use for context in line 4):
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

    // For SK: translate the EN script to natural Slovak
    if (lang === 'sk') {
      lines = await translateToSlovak(lines);
    }

    return { lines };
  } catch (err) {
    console.error('⚠️ GPT failed:', err);
    return fallbackScript(title, introduction, lang);
  }
}

async function translateToSlovak(lines: ReelLine[]): Promise<ReelLine[]> {
  const script = lines.filter(l => l.spoken).map((l, i) => `${i}|${l.speaker}|${l.spoken}`).join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: `Prepíš tento anglický dialóg do slovenčiny. NIE prekladaj — PREPÍŠ tak, aby SK verzia znela rovnako dobre, zaujímavo a užitočne ako EN originál.

Toto je rozhovor medzi študentom a učiteľom o programovaní. Anglická verzia je kvalitná — tvoja úloha je spraviť SK verziu MINIMÁLNE rovnako dobrú.

POSTUP pre každý riadok:
1. Prečítaj EN vetu
2. Pochop čo presne hovorí a prečo je to užitočné
3. Napíš to po slovensky tak, aby to znelo prirodzene A zachovalo rovnakú výpovednú hodnotu
4. Skontroluj: je SK veta rovnako zaujímavá a informatívna ako EN? Ak nie, prepíš ju

PRAVIDLÁ:
- Ak EN spomína firmu (Spotify, Instagram, Netflix) — ZACHOVAJ ju, nepíš "sociálne médiá" alebo "rôzne služby"
- Ak EN dáva konkrétny praktický scenár — ZACHOVAJ presne ten scenár, nenahrádzaj ho všeobecnou frázou
- Ak EN vysvetľuje mechanizmus (ako to funguje pod kapotou) — ZACHOVAJ ten mechanizmus, nezjednodušuj
- Každá veta musí mať VÝPOVEDNÚ HODNOTU. Po každej vete sa opýtaj: naučil sa divák niečo nové? Ak nie, prepíš ju
- Učiteľ hovorí ako skúsený programátor — sebaistvo, jasne, s konkrétnymi príkladmi
- NIKDY neopakuj to isté inými slovami
- NIKDY nepíš kód ani špeciálne znaky. "args" áno, "*args" nie
- NIKDY čeština
- Študent: "Kámo," alebo "Bráško,"
- Posledná veta študenta MUSÍ končiť slovom "ďakujem", "vďaka" alebo "dík"
- Technické termíny (API, CPU, Python, lambda, set) NEPREKLADAJ
- Správna slovenská gramatika, plynulé vety

Formát vstupu: index|speaker|text
Vráť JSON: {"lines": {"0": "preložená veta", "1": "preložená veta", ...}}

DIALÓG:
${script}`
        }],
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const translated = parsed.lines || {};

    let fixes = 0;
    for (const [idx, newText] of Object.entries(translated)) {
      const i = parseInt(idx);
      if (i >= 0 && i < lines.length && typeof newText === 'string' && newText.trim()) {
        if (lines[i].spoken !== newText) fixes++;
        lines[i].spoken = newText as string;
      }
    }
    console.log(`🇸🇰 Translated ${fixes} lines to Slovak`);
  } catch (err) {
    console.error('⚠️ Translation failed, using grammar check fallback');
    lines = await verifySlovakGrammar(lines);
  }

  return lines;
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
