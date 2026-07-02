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
