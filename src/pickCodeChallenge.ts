const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

export interface CodeChallengeData {
  id: string;
  prompt_sk: string;
  prompt_en: string;
  codeSnippet: string;    // code with ___ blank
  codeAnswer: string;     // code with correct answer filled in
  options: string[];       // 4 choices
  correct: string;         // the correct one
  explanation: { en: string; sk: string };
  equipment: Record<string, string>;
  postNumber: number;
}

// Fill exercises from the app curriculum
const fillExercises = [
  { id: 'fill-var-1', prompt_sk: 'Doplň chýbajúci kód tak, aby premenná mesto obsahovala hodnotu "Bratislava":', prompt_en: 'Fill in the code so the variable city contains "Bratislava":', code: '___ = "Bratislava"', options: ['var', 'mesto', 'string', 'let'], correct: 'mesto', difficulty: 'beginner' },
  { id: 'fill-types-1', prompt_sk: 'Doplň chýbajúci kód — správny typ pre každú premennú:', prompt_en: 'Fill in the code — the correct type for each variable:', code: 'vek = 25           # ___', options: ['str', 'int', 'float', 'bool'], correct: 'int', difficulty: 'beginner' },
  { id: 'fill-str-1', prompt_sk: 'Doplň chýbajúci kód aby vypísal dĺžku reťazca:', prompt_en: 'Fill in the code to print the string length:', code: 'slovo = "Python"\nprint(___(slovo))', options: ['len', 'size', 'count', 'length'], correct: 'len', difficulty: 'beginner' },
  { id: 'fill-math-1', prompt_sk: 'Doplň chýbajúci kód — operátor na výpočet zvyšku po delení:', prompt_en: 'Fill in the code — the operator for remainder after division:', code: 'zvysok = 10 ___ 3\nprint(zvysok)  # 1', options: ['/', '//', '%', '**'], correct: '%', difficulty: 'beginner' },
  { id: 'fill-cmp-1', prompt_sk: 'Doplň chýbajúci kód — operátor "nerovná sa":', prompt_en: 'Fill in the code — the "not equal" operator:', code: 'print(10 ___ 5)  # True', options: ['!=', '!==', '<>', '=/='], correct: '!=', difficulty: 'beginner' },
  { id: 'fill-if-1', prompt_sk: 'Doplň chýbajúci kód:', prompt_en: 'Fill in the code:', code: '___ teplota > 30:\n    print("Horúco")', options: ['if', 'when', 'check', 'for'], correct: 'if', difficulty: 'beginner' },
  { id: 'fill-elif-1', prompt_sk: 'Doplň chýbajúci kód:', prompt_en: 'Fill in the code:', code: 'if temp > 30:\n    print("Hot")\n___ temp > 20:\n    print("Warm")', options: ['elif', 'else if', 'elseif', 'or if'], correct: 'elif', difficulty: 'beginner' },
  { id: 'fill-for-1', prompt_sk: 'Doplň chýbajúci kód aby vypísal čísla 1 až 5:', prompt_en: 'Fill in the code to print numbers 1 to 5:', code: 'for i in ___(1, 6):\n    print(i)', options: ['range', 'list', 'loop', 'iter'], correct: 'range', difficulty: 'beginner' },
  { id: 'fill-async-1', prompt_sk: 'Doplň chýbajúci kód:', prompt_en: 'Fill in the code:', code: '___ function loadUser() {\n  const data = ___ fetchUser();\n  return data;\n}', options: ['async', 'sync', 'parallel', 'defer'], correct: 'async', difficulty: 'advanced' },
  { id: 'fill-ts-1', prompt_sk: 'Doplň chýbajúci kód — union type, ktorý môže byť string alebo null:', prompt_en: 'Fill in the code — the union type that can be string or null:', code: 'type MaybeString = string ___ null;', options: ['|', '&', '?', '+'], correct: '|', difficulty: 'advanced' },

  // Data Types & Type Conversion
  { id: 'fill-type-conv-1', prompt_sk: 'Doplň chýbajúci kód — konvertuj text na celé číslo:', prompt_en: 'Fill in the code — convert text to an integer:', code: 'vek = "25"\nvek = ___(vek)\nprint(vek + 1)', options: ['int', 'str', 'float', 'bool'], correct: 'int', difficulty: 'beginner' },
  { id: 'fill-type-conv-2', prompt_sk: 'Doplň chýbajúci kód — zisti typ premennej:', prompt_en: 'Fill in the code — check the variable type:', code: 'meno = "Alice"\nprint(___(meno))', options: ['type', 'typeof', 'class', 'kind'], correct: 'type', difficulty: 'beginner' },
  { id: 'fill-type-float-1', prompt_sk: 'Doplň chýbajúci kód — konvertuj na desatinné číslo:', prompt_en: 'Fill in the code — convert to a decimal number:', code: 'cena = "19.99"\ncena = ___(cena)', options: ['float', 'int', 'decimal', 'double'], correct: 'float', difficulty: 'beginner' },

  // User Input
  { id: 'fill-input-1', prompt_sk: 'Doplň chýbajúci kód — získaj vstup od používateľa:', prompt_en: 'Fill in the code — get input from the user:', code: 'meno = ___(\"Ako sa voláš? \")\nprint(meno)', options: ['input', 'read', 'scan', 'get'], correct: 'input', difficulty: 'beginner' },
  { id: 'fill-input-2', prompt_sk: 'Doplň chýbajúci kód — načítaj číslo od používateľa:', prompt_en: 'Fill in the code — read a number from the user:', code: 'vek = ___(input(\"Vek: \"))\nprint(vek + 1)', options: ['int', 'str', 'num', 'val'], correct: 'int', difficulty: 'beginner' },

  // Comparison Operators
  { id: 'fill-cmp-2', prompt_sk: 'Doplň chýbajúci kód — operátor "väčšie alebo rovné":', prompt_en: 'Fill in the code — "greater than or equal to" operator:', code: 'vek = 18\nprint(vek ___ 18)  # True', options: ['>=', '=>', '>==', '!<'], correct: '>=', difficulty: 'beginner' },
  { id: 'fill-cmp-3', prompt_sk: 'Doplň chýbajúci kód — operátor rovnosti:', prompt_en: 'Fill in the code — equality operator:', code: 'heslo = \"python\"\nprint(heslo ___ \"python\")  # True', options: ['==', '=', '===', 'is'], correct: '==', difficulty: 'beginner' },

  // Assignment Operators
  { id: 'fill-assign-1', prompt_sk: 'Doplň chýbajúci kód — pripočítaj 10 k premennej:', prompt_en: 'Fill in the code — add 10 to the variable:', code: 'skore = 50\nskore ___ 10\nprint(skore)  # 60', options: ['+=', '=+', '+', '=='], correct: '+=', difficulty: 'beginner' },
  { id: 'fill-assign-2', prompt_sk: 'Doplň chýbajúci kód — vynásob premennú 3-kou:', prompt_en: 'Fill in the code — multiply the variable by 3:', code: 'mince = 10\nmince ___ 3\nprint(mince)  # 30', options: ['*=', '=*', 'x=', '**='], correct: '*=', difficulty: 'beginner' },

  // Logical Operators
  { id: 'fill-logic-1', prompt_sk: 'Doplň chýbajúci kód — obe podmienky musia platiť:', prompt_en: 'Fill in the code — both conditions must be true:', code: 'vek = 25\nprint(vek >= 18 ___ vek <= 65)', options: ['and', 'or', '&&', 'both'], correct: 'and', difficulty: 'beginner' },
  { id: 'fill-logic-2', prompt_sk: 'Doplň chýbajúci kód — obráť hodnotu:', prompt_en: 'Fill in the code — reverse the value:', code: 'prihlaseny = False\nprint(___ prihlaseny)  # True', options: ['not', '!', 'reverse', 'neg'], correct: 'not', difficulty: 'beginner' },
  { id: 'fill-logic-3', prompt_sk: 'Doplň chýbajúci kód — aspoň jedna podmienka musí platiť:', prompt_en: 'Fill in the code — at least one condition must be true:', code: 'vek = 15\ns_dospelym = True\nprint(vek >= 18 ___ s_dospelym)', options: ['or', 'and', '||', 'any'], correct: 'or', difficulty: 'beginner' },

  // Membership Operators
  { id: 'fill-member-1', prompt_sk: 'Doplň chýbajúci kód — skontroluj či hodnota existuje v zozname:', prompt_en: 'Fill in the code — check if a value exists in a list:', code: 'ovocie = [\"jablko\", \"banán\"]\nprint(\"banán\" ___ ovocie)', options: ['in', 'has', 'contains', 'exists'], correct: 'in', difficulty: 'beginner' },
  { id: 'fill-member-2', prompt_sk: 'Doplň chýbajúci kód — skontroluj či písmeno nie je v slove:', prompt_en: 'Fill in the code — check if a letter is not in a word:', code: 'print(\"z\" ___ \"Python\")  # True', options: ['not in', 'not has', '!in', 'outside'], correct: 'not in', difficulty: 'beginner' },

  // Identity Operators
  { id: 'fill-identity-1', prompt_sk: 'Doplň chýbajúci kód — skontroluj či premenná je None:', prompt_en: 'Fill in the code — check if a variable is None:', code: 'meno = None\nprint(meno ___ None)  # True', options: ['is', '==', '===', 'equals'], correct: 'is', difficulty: 'beginner' },

  // elif & else
  { id: 'fill-else-1', prompt_sk: 'Doplň chýbajúci kód:', prompt_en: 'Fill in the code:', code: 'vek = 16\nif vek >= 18:\n    print(\"Dospelý\")\n___:\n    print(\"Mladistvý\")', options: ['else', 'otherwise', 'default', 'then'], correct: 'else', difficulty: 'beginner' },
  { id: 'fill-elif-2', prompt_sk: 'Doplň chýbajúci kód:', prompt_en: 'Fill in the code:', code: 'skore = 72\nif skore >= 90:\n    print(\"A\")\n___ skore >= 70:\n    print(\"C\")', options: ['elif', 'else if', 'elseif', 'or'], correct: 'elif', difficulty: 'beginner' },

  // for Loops & range
  { id: 'fill-for-2', prompt_sk: 'Doplň chýbajúci kód — prechádzaj písmená v slove:', prompt_en: 'Fill in the code — loop through letters in a word:', code: '___ pismeno in \"Python\":\n    print(pismeno)', options: ['for', 'each', 'loop', 'while'], correct: 'for', difficulty: 'beginner' },
  { id: 'fill-range-1', prompt_sk: 'Doplň chýbajúci kód — odpočítavanie od 10 do 1:', prompt_en: 'Fill in the code — countdown from 10 to 1:', code: 'for i in range(10, 0, ___):\n    print(i)', options: ['-1', '1', '-2', '0'], correct: '-1', difficulty: 'beginner' },
  { id: 'fill-break-1', prompt_sk: 'Doplň chýbajúci kód — zastavenie cyklu:', prompt_en: 'Fill in the code — stop the loop:', code: 'for i in range(10):\n    if i == 5:\n        ___', options: ['break', 'stop', 'exit', 'end'], correct: 'break', difficulty: 'beginner' },
  { id: 'fill-continue-1', prompt_sk: 'Doplň chýbajúci kód — preskočenie iterácie:', prompt_en: 'Fill in the code — skip an iteration:', code: 'for i in range(5):\n    if i == 2:\n        ___\n    print(i)', options: ['continue', 'skip', 'pass', 'next'], correct: 'continue', difficulty: 'beginner' },

  // Functions
  { id: 'fill-def-1', prompt_sk: 'Doplň chýbajúci kód — vytvor funkciu:', prompt_en: 'Fill in the code — create a function:', code: '___ pozdrav(meno):\n    print(f\"Ahoj {meno}!\")', options: ['def', 'func', 'function', 'create'], correct: 'def', difficulty: 'beginner' },
  { id: 'fill-return-1', prompt_sk: 'Doplň chýbajúci kód — vráť hodnotu z funkcie:', prompt_en: 'Fill in the code — return a value from a function:', code: 'def sucet(a, b):\n    ___ a + b', options: ['return', 'print', 'yield', 'give'], correct: 'return', difficulty: 'beginner' },
  { id: 'fill-default-1', prompt_sk: 'Doplň chýbajúci kód — predvolená hodnota parametra:', prompt_en: 'Fill in the code — default parameter value:', code: 'def pozdrav(meno ___ \"svet\"):\n    print(f\"Ahoj {meno}!\")', options: ['=', ':', '==', '->'], correct: '=', difficulty: 'beginner' },

  // Lists
  { id: 'fill-list-1', prompt_sk: 'Doplň chýbajúci kód — pridaj prvok do zoznamu:', prompt_en: 'Fill in the code — add an item to the list:', code: 'ovocie = [\"jablko\"]\novocie.___(\"banán\")', options: ['append', 'add', 'push', 'insert'], correct: 'append', difficulty: 'beginner' },
  { id: 'fill-list-2', prompt_sk: 'Doplň chýbajúci kód — zoraď zoznam:', prompt_en: 'Fill in the code — sort the list:', code: 'cisla = [5, 2, 4, 1]\ncisla.___()', options: ['sort', 'order', 'arrange', 'sorted'], correct: 'sort', difficulty: 'beginner' },
  { id: 'fill-list-3', prompt_sk: 'Doplň chýbajúci kód — zisti dĺžku zoznamu:', prompt_en: 'Fill in the code — get the list length:', code: 'cisla = [1, 2, 3]\nprint(___(cisla))  # 3', options: ['len', 'size', 'count', 'length'], correct: 'len', difficulty: 'beginner' },

  // Scope
  { id: 'fill-global-1', prompt_sk: 'Doplň chýbajúci kód — použi globálnu premennú vo funkcii:', prompt_en: 'Fill in the code — use a global variable inside a function:', code: 'x = 10\ndef zmen():\n    ___ x\n    x = 20', options: ['global', 'outer', 'public', 'shared'], correct: 'global', difficulty: 'advanced' },

  // Error Handling
  { id: 'fill-try-1', prompt_sk: 'Doplň chýbajúci kód — zachyť výnimku:', prompt_en: 'Fill in the code — catch an exception:', code: 'try:\n    x = int(\"abc\")\n___ ValueError:\n    print(\"Chyba!\")', options: ['except', 'catch', 'handle', 'error'], correct: 'except', difficulty: 'beginner' },
  { id: 'fill-raise-1', prompt_sk: 'Doplň chýbajúci kód — vyvolaj výnimku:', prompt_en: 'Fill in the code — raise an exception:', code: 'vek = -5\nif vek < 0:\n    ___ ValueError(\"Vek nemôže byť záporný\")', options: ['raise', 'throw', 'error', 'except'], correct: 'raise', difficulty: 'advanced' },
];

const beginnerEquip: Record<string, string>[] = [
  { hat: 'hat-beanie' }, { glasses: 'glasses-round' }, { hat: 'hat-headband' }, {},
];
const advancedEquip: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool' },
  { hat: 'hat-cowboy', glasses: 'glasses-aviator' },
  { hat: 'hat-fire-crown', glasses: 'glasses-flame' },
];

let postedIds: string[] = [];

export async function pickCodeChallenge(): Promise<CodeChallengeData | null> {
  // Pick random unposted
  const available = fillExercises.filter(e => !postedIds.includes(e.id));
  if (available.length === 0) {
    postedIds = []; // reset cycle
    return pickCodeChallenge();
  }

  const ex = available[Math.floor(Math.random() * available.length)];
  postedIds.push(ex.id);

  const postNumber = postedIds.length;
  const pool = ex.difficulty === 'advanced' ? advancedEquip : beginnerEquip;
  const equipment = pool[Math.floor(Math.random() * pool.length)];

  // Code with answer filled in
  const codeAnswer = ex.code.replace('___', ex.correct);

  // Generate explanation
  const explanation = await generateExplanation(ex);

  console.log(`💻 Picked code challenge #${postNumber}: ${ex.prompt_en.slice(0, 50)}...`);

  return {
    id: ex.id,
    prompt_sk: ex.prompt_sk,
    prompt_en: ex.prompt_en,
    codeSnippet: ex.code.replace('___', '  ?  '),
    codeAnswer,
    options: ex.options,
    correct: ex.correct,
    explanation,
    equipment,
    postNumber,
  };
}

async function generateExplanation(ex: any): Promise<{ en: string; sk: string }> {
  if (!OPENAI_KEY) return { en: `The correct answer is ${ex.correct}.`, sk: `Správna odpoveď je ${ex.correct}.` };

  const prompt = `Code exercise: ${ex.prompt_en}
Code: ${ex.code}
Options: ${ex.options.join(', ')}
Correct: ${ex.correct}

Write a SHORT explanation (2-3 sentences, max 180 chars) of WHY "${ex.correct}" is correct. Educational, clear.

Return JSON: {"en": "...", "sk": "..."}
Slovak must be proper Slovak, never Czech.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 300, response_format: { type: 'json_object' } }),
    });
    return JSON.parse((await res.json()).choices?.[0]?.message?.content || '{}');
  } catch {
    return { en: `${ex.correct} is the correct answer.`, sk: `${ex.correct} je správna odpoveď.` };
  }
}
