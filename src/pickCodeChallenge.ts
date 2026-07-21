const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export interface CodeChallengeData {
  id: string;
  prompt_sk: string;
  prompt_en: string;
  codeSnippet: string;       // SK code with ? blank
  codeSnippetEn: string;     // EN code with ? blank
  codeAnswer: string;        // SK code with correct answer
  codeAnswerEn: string;      // EN code with correct answer
  options: string[];
  correct: string;           // SK correct
  correctEn: string;         // EN correct
  explanation: { en: string; sk: string };
  equipment: Record<string, string>;
  postNumber: number;
}

// Fill exercises — code_en has English variable names for EN posts
const fillExercises = [
  { id: 'fill-var-1', prompt_sk: 'Doplň chýbajúci kód tak, aby premenná mesto obsahovala hodnotu "Bratislava":', prompt_en: 'Fill in the code so the variable city contains "Bratislava":', code: '___ = "Bratislava"', code_en: '___ = "Bratislava"', options: ['var', 'mesto', 'string', 'let'], correct: 'mesto', correct_en: 'city', difficulty: 'beginner' },
  { id: 'fill-types-1', prompt_sk: 'Doplň chýbajúci kód — správny typ pre každú premennú:', prompt_en: 'Fill in the code — the correct type for each variable:', code: 'vek = 25           # ___', code_en: 'age = 25           # ___', options: ['str', 'int', 'float', 'bool'], correct: 'int', difficulty: 'beginner' },
  { id: 'fill-str-1', prompt_sk: 'Doplň chýbajúci kód aby vypísal počet znakov:', prompt_en: 'Fill in the code to print how many characters the word has:', code: 'slovo = "Python"\nprint(___(slovo))', code_en: 'word = "Python"\nprint(___(word))', options: ['len', 'size', 'count', 'length'], correct: 'len', difficulty: 'beginner' },
  { id: 'fill-math-1', prompt_sk: 'Doplň chýbajúci kód — operátor na výpočet zvyšku po delení:', prompt_en: 'Fill in the code — the operator for remainder after division:', code: 'zvysok = 10 ___ 3\nprint(zvysok)  # 1', code_en: 'remainder = 10 ___ 3\nprint(remainder)  # 1', options: ['/', '//', '%', '**'], correct: '%', difficulty: 'beginner' },
  { id: 'fill-cmp-1', prompt_sk: 'Doplň chýbajúci kód — operátor "nerovná sa":', prompt_en: 'Fill in the code — the "not equal" operator:', code: 'print(10 ___ 5)  # True', options: ['!=', '!==', '<>', '=/='], correct: '!=', difficulty: 'beginner' },
  { id: 'fill-if-1', prompt_sk: 'Tento kód kontroluje teplotu a vypíše správu ak je príliš horúco. Aké kľúčové slovo začína podmienku?', prompt_en: 'This code checks the temperature and prints a message if it is too hot. What keyword starts a condition?', code: '___ teplota > 30:\n    print("Horúco")', code_en: '___ temperature > 30:\n    print("Too hot")', options: ['if', 'when', 'check', 'for'], correct: 'if', difficulty: 'beginner' },
  { id: 'fill-elif-1', prompt_sk: 'Tento kód kontroluje teplotu a pridáva ďalšiu podmienku. Aké kľúčové slovo pridáva alternatívnu podmienku?', prompt_en: 'This code checks the temperature and adds another condition. What keyword adds an alternative condition?', code: 'if temp > 30:\n    print("Hot")\n___ temp > 20:\n    print("Warm")', options: ['elif', 'else if', 'elseif', 'or if'], correct: 'elif', difficulty: 'beginner' },
  { id: 'fill-for-1', prompt_sk: 'Doplň chýbajúci kód aby vypísal čísla 1 až 5:', prompt_en: 'Fill in the code to print numbers 1 to 5:', code: 'for i in ___(1, 6):\n    print(i)', options: ['range', 'list', 'loop', 'seq'], correct: 'range', difficulty: 'beginner' },
  { id: 'fill-async-1', prompt_sk: 'Táto funkcia načítava používateľa z databázy a musí počkať na výsledok. Aké kľúčové slovo ju robí asynchrónnou?', prompt_en: 'This function loads a user from a database and needs to wait for the result. What keyword makes it asynchronous?', code: '___ function loadUser() {\n  const data = ___ fetchUser();\n  return data;\n}', options: ['async', 'sync', 'parallel', 'defer'], correct: 'async', difficulty: 'advanced' },
  { id: 'fill-ts-1', prompt_sk: 'Doplň chýbajúci kód — union type, ktorý môže byť string alebo null:', prompt_en: 'Fill in the code — the union type that can be string or null:', code: 'type MaybeString = string ___ null;', options: ['|', '&', '?', '+'], correct: '|', difficulty: 'advanced' },

  // Data Types & Type Conversion
  { id: 'fill-type-conv-1', prompt_sk: 'Doplň chýbajúci kód — konvertuj text na číslo, aby si mohol pripočítať 1:', prompt_en: 'Fill in the code — convert text to a number so you can add 1:', code: 'vek = "25"\nvek = ___(vek)\nprint(vek + 1)', code_en: 'age = "25"\nage = ___(age)\nprint(age + 1)', options: ['int', 'str', 'float', 'bool'], correct: 'int', difficulty: 'beginner' },
  { id: 'fill-type-conv-2', prompt_sk: 'Doplň chýbajúci kód — zisti akého druhu je premenná:', prompt_en: 'Fill in the code — find out what kind of data the variable holds:', code: 'meno = "Alice"\nprint(___(meno))', code_en: 'name = "Alice"\nprint(___(name))', options: ['type', 'typeof', 'class', 'kind'], correct: 'type', difficulty: 'beginner' },
  { id: 'fill-type-float-1', prompt_sk: 'Doplň chýbajúci kód — konvertuj text "19.99" na číslo s desatinnou čiarkou:', prompt_en: 'Fill in the code — convert "19.99" to a number with a decimal point:', code: 'cena = "19.99"\ncena = ___(cena)', code_en: 'price = "19.99"\nprice = ___(price)', options: ['float', 'int', 'decimal', 'double'], correct: 'float', difficulty: 'beginner' },

  // User Input
  { id: 'fill-input-1', prompt_sk: 'Doplň chýbajúci kód — spýtaj sa používateľa na meno:', prompt_en: 'Fill in the code — ask the user for their name:', code: 'meno = ___(\"Ako sa voláš? \")\nprint(meno)', code_en: 'name = ___(\"What is your name? \")\nprint(name)', options: ['input', 'read', 'scan', 'get'], correct: 'input', difficulty: 'beginner' },
  { id: 'fill-input-2', prompt_sk: 'Doplň chýbajúci kód — načítaj číslo od používateľa:', prompt_en: 'Fill in the code — read a number from the user:', code: 'vek = ___(input(\"Vek: \"))\nprint(vek + 1)', code_en: 'age = ___(input(\"Age: \"))\nprint(age + 1)', options: ['int', 'str', 'num', 'val'], correct: 'int', difficulty: 'beginner' },

  // Comparison Operators
  { id: 'fill-cmp-2', prompt_sk: 'Doplň chýbajúci kód — operátor "väčšie alebo rovné":', prompt_en: 'Fill in the code — "greater than or equal to" operator:', code: 'vek = 18\nprint(vek ___ 18)  # True', code_en: 'age = 18\nprint(age ___ 18)  # True', options: ['>=', '=>', '>==', '!<'], correct: '>=', difficulty: 'beginner' },
  { id: 'fill-cmp-3', prompt_sk: 'Doplň chýbajúci kód — operátor rovnosti:', prompt_en: 'Fill in the code — equality operator:', code: 'heslo = \"python\"\nprint(heslo ___ \"python\")  # True', code_en: 'password = \"python\"\nprint(password ___ \"python\")  # True', options: ['==', '=', '===', 'is'], correct: '==', difficulty: 'beginner' },

  // Assignment Operators
  { id: 'fill-assign-1', prompt_sk: 'Doplň chýbajúci kód — pripočítaj 10 k premennej:', prompt_en: 'Fill in the code — add 10 to the variable:', code: 'skore = 50\nskore ___ 10\nprint(skore)  # 60', code_en: 'score = 50\nscore ___ 10\nprint(score)  # 60', options: ['+=', '=+', '+', '=='], correct: '+=', difficulty: 'beginner' },
  { id: 'fill-assign-2', prompt_sk: 'Doplň chýbajúci kód — vynásob premennú 3-kou:', prompt_en: 'Fill in the code — multiply the variable by 3:', code: 'mince = 10\nmince ___ 3\nprint(mince)  # 30', code_en: 'coins = 10\ncoins ___ 3\nprint(coins)  # 30', options: ['*=', '=*', 'x=', '**='], correct: '*=', difficulty: 'beginner' },

  // Logical Operators
  { id: 'fill-logic-1', prompt_sk: 'Doplň chýbajúci kód — obe podmienky musia platiť:', prompt_en: 'Fill in the code — both conditions must be true:', code: 'vek = 25\nprint(vek >= 18 ___ vek <= 65)', code_en: 'age = 25\nprint(age >= 18 ___ age <= 65)', options: ['and', 'or', '&&', 'both'], correct: 'and', difficulty: 'beginner' },
  { id: 'fill-logic-2', prompt_sk: 'Doplň chýbajúci kód — obráť hodnotu:', prompt_en: 'Fill in the code — reverse the value:', code: 'prihlaseny = False\nprint(___ prihlaseny)  # True', code_en: 'logged_in = False\nprint(___ logged_in)  # True', options: ['not', '!', 'reverse', 'neg'], correct: 'not', difficulty: 'beginner' },
  { id: 'fill-logic-3', prompt_sk: 'Doplň chýbajúci kód — aspoň jedna podmienka musí platiť:', prompt_en: 'Fill in the code — at least one condition must be true:', code: 'vek = 15\ns_dospelym = True\nprint(vek >= 18 ___ s_dospelym)', code_en: 'age = 15\nwith_adult = True\nprint(age >= 18 ___ with_adult)', options: ['or', 'and', '||', 'any'], correct: 'or', difficulty: 'beginner' },

  // Membership Operators
  { id: 'fill-member-1', prompt_sk: 'Doplň chýbajúci kód — skontroluj či hodnota existuje v zozname:', prompt_en: 'Fill in the code — check if a value exists in a list:', code: 'ovocie = [\"jablko\", \"banán\"]\nprint(\"banán\" ___ ovocie)', code_en: 'fruits = [\"apple\", \"banana\"]\nprint(\"banana\" ___ fruits)', options: ['in', 'has', 'contains', 'exists'], correct: 'in', difficulty: 'beginner' },
  { id: 'fill-member-2', prompt_sk: 'Doplň chýbajúci kód — skontroluj či písmeno nie je v slove:', prompt_en: 'Fill in the code — check if a letter is not in a word:', code: 'print(\"z\" ___ \"Python\")  # True', options: ['not in', 'not has', '!in', 'outside'], correct: 'not in', difficulty: 'beginner' },

  // Identity Operators
  { id: 'fill-identity-1', prompt_sk: 'Doplň chýbajúci kód — skontroluj či premenná je None:', prompt_en: 'Fill in the code — check if a variable is None:', code: 'meno = None\nprint(meno ___ None)  # True', code_en: 'name = None\nprint(name ___ None)  # True', options: ['is', '==', '===', 'equals'], correct: 'is', difficulty: 'beginner' },

  // elif & else
  { id: 'fill-else-1', prompt_sk: 'Tento kód kontroluje vek a vypíše či je človek dospelý alebo mladistvý. Aké kľúčové slovo zachytí všetky ostatné prípady?', prompt_en: 'This code checks age and prints whether a person is an adult or a minor. What keyword catches all other cases?', code: 'vek = 16\nif vek >= 18:\n    print(\"Dospelý\")\n___:\n    print(\"Mladistvý\")', code_en: 'age = 16\nif age >= 18:\n    print(\"Adult\")\n___:\n    print(\"Minor\")', options: ['else', 'otherwise', 'default', 'then'], correct: 'else', difficulty: 'beginner' },
  { id: 'fill-elif-2', prompt_sk: 'Tento kód prideľuje známku podľa skóre. Aké kľúčové slovo pridáva ďalšiu podmienku po prvom if?', prompt_en: 'This code assigns a grade based on score. What keyword adds another condition after the first if?', code: 'skore = 72\nif skore >= 90:\n    print(\"A\")\n___ skore >= 70:\n    print(\"C\")', code_en: 'score = 72\nif score >= 90:\n    print(\"A\")\n___ score >= 70:\n    print(\"C\")', options: ['elif', 'else if', 'elseif', 'or'], correct: 'elif', difficulty: 'beginner' },

  // for Loops & range
  { id: 'fill-for-2', prompt_sk: 'Doplň chýbajúci kód — prechádzaj písmená v slove:', prompt_en: 'Fill in the code — loop through letters in a word:', code: '___ pismeno in \"Python\":\n    print(pismeno)', code_en: '___ letter in \"Python\":\n    print(letter)', options: ['for', 'each', 'loop', 'while'], correct: 'for', difficulty: 'beginner' },
  { id: 'fill-range-1', prompt_sk: 'Doplň chýbajúci kód — odpočítavanie od 10 do 1:', prompt_en: 'Fill in the code — countdown from 10 to 1:', code: 'for i in range(10, 0, ___):\n    print(i)', options: ['-1', '1', '-2', '0'], correct: '-1', difficulty: 'beginner' },
  { id: 'fill-break-1', prompt_sk: 'Doplň chýbajúci kód — keď i je 5, ukonči celý cyklus:', prompt_en: 'Fill in the code — when i is 5, end the entire loop:', code: 'for i in range(10):\n    if i == 5:\n        ___', options: ['break', 'stop', 'exit', 'end'], correct: 'break', difficulty: 'beginner' },
  { id: 'fill-continue-1', prompt_sk: 'Doplň chýbajúci kód — keď i je 2, preskoč na ďalšiu iteráciu:', prompt_en: 'Fill in the code — when i is 2, jump to the next iteration:', code: 'for i in range(5):\n    if i == 2:\n        ___\n    print(i)', options: ['continue', 'skip', 'pass', 'next'], correct: 'continue', difficulty: 'beginner' },

  // Functions
  { id: 'fill-def-1', prompt_sk: 'Doplň chýbajúci kód — vytvor funkciu:', prompt_en: 'Fill in the code — create a function:', code: '___ pozdrav(meno):\n    print(f\"Ahoj {meno}!\")', code_en: '___ greet(name):\n    print(f\"Hello {name}!\")', options: ['def', 'func', 'function', 'create'], correct: 'def', difficulty: 'beginner' },
  { id: 'fill-return-1', prompt_sk: 'Doplň chýbajúci kód — funkcia má odovzdať výsledok:', prompt_en: 'Fill in the code — the function should give back the result:', code: 'def sucet(a, b):\n    ___ a + b', code_en: 'def add(a, b):\n    ___ a + b', options: ['return', 'print', 'yield', 'give'], correct: 'return', difficulty: 'beginner' },
  { id: 'fill-default-1', prompt_sk: 'Doplň chýbajúci kód — predvolená hodnota parametra:', prompt_en: 'Fill in the code — default parameter value:', code: 'def pozdrav(meno ___ \"svet\"):\n    print(f\"Ahoj {meno}!\")', code_en: 'def greet(name ___ \"world\"):\n    print(f\"Hello {name}!\")', options: ['=', ':', '==', '->'], correct: '=', difficulty: 'beginner' },

  // Lists
  { id: 'fill-list-1', prompt_sk: 'Doplň chýbajúci kód — pridaj "banán" na koniec zoznamu:', prompt_en: 'Fill in the code — put "banana" at the end of the list:', code: 'ovocie = [\"jablko\"]\novocie.___(\"banán\")', code_en: 'fruits = [\"apple\"]\nfruits.___(\"banana\")', options: ['append', 'add', 'push', 'insert'], correct: 'append', difficulty: 'beginner' },
  { id: 'fill-list-2', prompt_sk: 'Doplň chýbajúci kód — usporiadaj prvky od najmenšieho:', prompt_en: 'Fill in the code — arrange items from smallest to largest:', code: 'cisla = [5, 2, 4, 1]\ncisla.___()', code_en: 'numbers = [5, 2, 4, 1]\nnumbers.___()', options: ['sort', 'order', 'arrange', 'sorted'], correct: 'sort', difficulty: 'beginner' },
  { id: 'fill-list-3', prompt_sk: 'Doplň chýbajúci kód — zisti počet prvkov:', prompt_en: 'Fill in the code — find out how many items are in the list:', code: 'cisla = [1, 2, 3]\nprint(___(cisla))  # 3', code_en: 'numbers = [1, 2, 3]\nprint(___(numbers))  # 3', options: ['len', 'size', 'count', 'length'], correct: 'len', difficulty: 'beginner' },

  // Scope
  { id: 'fill-global-1', prompt_sk: 'Doplň chýbajúci kód — pristúp k premennej definovanej mimo funkcie:', prompt_en: 'Fill in the code — access a variable defined outside the function:', code: 'x = 10\ndef zmen():\n    ___ x\n    x = 20', code_en: 'x = 10\ndef change():\n    ___ x\n    x = 20', options: ['global', 'outer', 'public', 'shared'], correct: 'global', difficulty: 'advanced' },

  // Error Handling
  { id: 'fill-try-1', prompt_sk: 'Doplň chýbajúci kód — zachyť výnimku:', prompt_en: 'Fill in the code — catch an exception:', code: 'try:\n    x = int(\"abc\")\n___ ValueError:\n    print(\"Chyba!\")', code_en: 'try:\n    x = int(\"abc\")\n___ ValueError:\n    print(\"Error!\")', options: ['except', 'catch', 'handle', 'error'], correct: 'except', difficulty: 'beginner' },
  { id: 'fill-raise-1', prompt_sk: 'Doplň chýbajúci kód — vyvolaj výnimku:', prompt_en: 'Fill in the code — raise an exception:', code: 'vek = -5\nif vek < 0:\n    ___ ValueError(\"Vek nemôže byť záporný\")', code_en: 'age = -5\nif age < 0:\n    ___ ValueError(\"Age cannot be negative\")', options: ['raise', 'throw', 'error', 'except'], correct: 'raise', difficulty: 'advanced' },
];

const beginnerEquip: Record<string, string>[] = [
  { hat: 'hat-beanie' }, { glasses: 'glasses-round' }, { hat: 'hat-headband' }, {},
];
const advancedEquip: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool' },
  { hat: 'hat-cowboy', glasses: 'glasses-aviator' },
  { hat: 'hat-fire-crown', glasses: 'glasses-flame' },
];

import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function getPostedCodeIds(): Promise<string[]> {
  try {
    const { data } = await sb.storage.from('ig-media').download('tracking/code_posted.json');
    if (data) return JSON.parse(await data.text());
  } catch {}
  return [];
}

async function markCodePosted(id: string) {
  const posted = await getPostedCodeIds();
  posted.push(id);
  await sb.storage.from('ig-media').upload('tracking/code_posted.json', Buffer.from(JSON.stringify(posted)), { contentType: 'application/json', upsert: true });
}

export async function pickCodeChallenge(): Promise<CodeChallengeData | null> {
  let postedIds = await getPostedCodeIds();
  let available = fillExercises.filter(e => !postedIds.includes(e.id));

  if (available.length === 0) {
    console.log('🔄 All code challenges posted — resetting cycle');
    await sb.storage.from('ig-media').remove(['tracking/code_posted.json']);
    postedIds = [];
    available = fillExercises;
  }

  // Prefer beginner + medium difficulty (80% chance easy, 20% advanced)
  const easy = available.filter(e => e.difficulty === 'beginner');
  const hard = available.filter(e => e.difficulty === 'advanced');
  const useEasy = easy.length > 0 && (hard.length === 0 || Math.random() < 0.8);
  const pool2 = useEasy ? easy : (hard.length > 0 ? hard : available);
  const ex = pool2[Math.floor(Math.random() * pool2.length)];
  await markCodePosted(ex.id);

  const postNumber = postedIds.length + 1;
  const pool = ex.difficulty === 'advanced' ? advancedEquip : beginnerEquip;
  const equipment = pool[Math.floor(Math.random() * pool.length)];

  // EN uses code_en if available, SK uses code
  const codeEn = (ex as any).code_en || ex.code;
  const codeSk = ex.code;
  const correctEn = (ex as any).correct_en || ex.correct;

  // Code with answer filled in
  const codeAnswerEn = codeEn.replace('___', correctEn);
  const codeAnswerSk = codeSk.replace('___', ex.correct);

  // Generate explanation
  const explanation = await generateExplanation(ex);

  console.log(`💻 Picked code challenge #${postNumber}: ${ex.prompt_en.slice(0, 50)}...`);

  return {
    id: ex.id,
    prompt_sk: ex.prompt_sk,
    prompt_en: ex.prompt_en,
    codeSnippet: codeSk.replace('___', '  ?  '),
    codeSnippetEn: codeEn.replace('___', '  ?  '),
    codeAnswer: codeAnswerSk,
    codeAnswerEn,
    options: ex.options,
    correct: ex.correct,
    correctEn,
    explanation,
    equipment,
    postNumber,
  };
}

async function generateExplanation(ex: any): Promise<{ en: string; sk: string }> {
  if (!OPENAI_KEY) return { en: `The correct answer is ${ex.correct}.`, sk: `Správna odpoveď je ${ex.correct}.` };

  const codeEn = ex.code_en || ex.code;
  const correctEn = ex.correct_en || ex.correct;

  // Generate EN and SK separately to avoid JSON mixing issues
  async function genOne(lang: 'en' | 'sk'): Promise<string> {
    const isEn = lang === 'en';
    const prompt = isEn
      ? `Code exercise: ${ex.prompt_en}\nCode: ${codeEn}\nCorrect answer: ${correctEn}\n\nWrite a SHORT explanation (2-3 sentences, max 180 chars) of WHY "${correctEn}" is correct. Use English variable names from the code. Educational, clear tone. Reply with ONLY the explanation text, no JSON, no quotes.`
      : `Cvičenie: ${ex.prompt_sk}\nKód: ${ex.code}\nSprávna odpoveď: ${ex.correct}\n\nNapíš KRÁTKE vysvetlenie (2-3 vety, max 180 znakov) PREČO je "${ex.correct}" správna odpoveď. Použi slovenské premenné z kódu. Slovensky. Odpovedz LEN textom vysvetlenia, žiadny JSON.`;
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 200 }),
      });
      const data = await res.json();
      let text = (data.choices?.[0]?.message?.content || '').trim();
      // Strip wrapping quotes
      text = text.replace(/^["']|["']$/g, '');
      // Remove stray quotes around the answer word (e.g. "input" -> input)
      text = text.replace(/["'"„"]/g, '');
      return text;
    } catch { return ''; }
  }

  const [en, sk] = await Promise.all([genOne('en'), genOne('sk')]);
  return {
    en: en || `${correctEn} is the correct answer.`,
    sk: sk || `${ex.correct} je správna odpoveď.`,
  };
}
