import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

// Glossary entries hardcoded (from app)
const glossary = [
  { id: 'api', term: 'API', category: 'skratka', short: 'Application Programming Interface', explanation: 'Rozhranie, cez ktoré spolu komunikujú aplikácie. Keď tvoja app pošle požiadavku na server a dostane dáta späť — to je API.', example: 'fetch("https://api.woeva.sk/events")' },
  { id: 'json', term: 'JSON', category: 'skratka', short: 'JavaScript Object Notation', explanation: 'Formát na ukladanie a prenos dát. Vyzerá ako JS objekt — kľúče v úvodzovkách, hodnoty môžu byť string, number, boolean, pole, alebo ďalší objekt.', example: '{ "name": "Zuzka", "age": 20 }' },
  { id: 'jwt', term: 'JWT', category: 'skratka', short: 'JSON Web Token', explanation: 'Šifrovaný token, ktorý dokazuje identitu používateľa. Po prihlásení server vytvorí JWT a pošle ho klientovi.', example: 'Authorization: Bearer eyJhbG...' },
  { id: 'rls', term: 'RLS', category: 'skratka', short: 'Row Level Security', explanation: 'Bezpečnostná funkcia PostgreSQL. Definuješ politiky kto môže čítať/písať každý riadok tabuľky.', example: 'CREATE POLICY "own rows" ON events...' },
  { id: 'oauth', term: 'OAuth', category: 'skratka', short: 'Open Authorization', explanation: 'Protokol pre delegovanú autorizáciu. Umožňuje prihlásiť sa cez Google, GitHub bez zdieľania hesla.', example: 'Login with Google → redirect → callback' },
  { id: 'crud', term: 'CRUD', category: 'skratka', short: 'Create, Read, Update, Delete', explanation: 'Štyri základné operácie s dátami. Každá aplikácia ich používa.', example: 'POST (create), GET (read), PUT (update), DELETE' },
  { id: 'sql', term: 'SQL', category: 'skratka', short: 'Structured Query Language', explanation: 'Jazyk na prácu s relačnými databázami. Používa sa na dotazovanie, vkladanie, aktualizáciu a mazanie dát.', example: 'SELECT * FROM users WHERE age > 18' },
  { id: 'http', term: 'HTTP', category: 'skratka', short: 'HyperText Transfer Protocol', explanation: 'Protokol na prenos webových stránok a dát cez internet. Každá webová stránka používa HTTP alebo HTTPS.', example: 'GET /api/users HTTP/1.1' },
  { id: 'css', term: 'CSS', category: 'skratka', short: 'Cascading Style Sheets', explanation: 'Jazyk na štýlovanie webových stránok. Určuje farby, fonty, rozloženie a animácie.', example: 'color: white; font-size: 16px;' },
  { id: 'html', term: 'HTML', category: 'skratka', short: 'HyperText Markup Language', explanation: 'Jazyk na štruktúru webových stránok. Definuje nadpisy, odseky, obrázky, odkazy.', example: '<h1>Ahoj svet</h1>' },
  { id: 'dom', term: 'DOM', category: 'koncept', short: 'Document Object Model', explanation: 'Stromová reprezentácia HTML stránky v pamäti prehliadača. JavaScript manipuluje DOM na zmenu toho, čo vidíš.', example: 'document.getElementById("title").innerText = "Nový"' },
  { id: 'git', term: 'Git', category: 'nastroj', short: 'Version Control System', explanation: 'Systém na sledovanie zmien v kóde. Umožňuje vrátiť sa k predchádzajúcim verziám, spolupracovať s tímom.', example: 'git commit -m "pridaná nová funkcia"' },
  { id: 'npm', term: 'npm', category: 'nastroj', short: 'Node Package Manager', explanation: 'Správca balíkov pre JavaScript. Umožňuje inštalovať a zdieľať kód s miliónmi vývojárov.', example: 'npm install react' },
  { id: 'ssh', term: 'SSH', category: 'skratka', short: 'Secure Shell', explanation: 'Šifrovaný protokol na vzdialený prístup k serverom. Bezpečne sa pripojiť a spravovať server.', example: 'ssh user@server.com' },
  { id: 'dns', term: 'DNS', category: 'skratka', short: 'Domain Name System', explanation: 'Prekladá doménové mená na IP adresy. Ako telefónny zoznam internetu.', example: 'google.com → 142.250.80.46' },
  { id: 'tcp', term: 'TCP', category: 'skratka', short: 'Transmission Control Protocol', explanation: 'Protokol zaručujúci spoľahlivé doručenie dát. Každý paket je potvrdený.', example: 'TCP three-way handshake: SYN → SYN-ACK → ACK' },
  { id: 'ram', term: 'RAM', category: 'skratka', short: 'Random Access Memory', explanation: 'Rýchla dočasná pamäť počítača. Stráca dáta po vypnutí.', example: '16 GB DDR5 RAM' },
  { id: 'cpu', term: 'CPU', category: 'skratka', short: 'Central Processing Unit', explanation: 'Mozog počítača. Vykonáva inštrukcie — počíta, porovnáva, presúva dáta.', example: 'Apple M3, Intel Core i9, AMD Ryzen 9' },
  { id: 'ssd', term: 'SSD', category: 'skratka', short: 'Solid State Drive', explanation: 'Úložisko bez pohyblivých častí. Oveľa rýchlejšie ako HDD.', example: 'NVMe SSD: 7000 MB/s čítanie' },
];

export interface GlossaryData {
  id: string;
  term: string;
  category: string;
  short: string;
  explanation_sk: string;
  explanation_en: string;
  example: string;
  simpleExplanation: { en: string; sk: string };
  postNumber: number;
  antenna: string;
}

const antennas = ['ant-heart', 'ant-star', 'ant-lightning', 'ant-diamond', 'ant-flame-orb', 'ant-frost-crystal', 'ant-golden-star'];

export async function pickGlossary(): Promise<GlossaryData | null> {
  // Check which ones have been posted (track in a simple way via Supabase)
  // For simplicity, use a counter based on existing posts
  const { count } = await sb.from('cb_lessons').select('id', { count: 'exact', head: true }); // just for numbering
  const postNumber = Math.floor(Math.random() * 1000) + 1;

  // Pick random entry
  const entry = glossary[Math.floor(Math.random() * glossary.length)];
  const antenna = antennas[Math.floor(Math.random() * antennas.length)];

  // Generate simple explanation + EN translation with GPT
  const simpleExplanation = await generateSimpleExplanation(entry);

  console.log(`📖 Picked glossary: ${entry.term}`);

  return {
    ...entry,
    explanation_sk: entry.explanation,
    explanation_en: simpleExplanation.definition_en,
    simpleExplanation: { en: simpleExplanation.simple_en, sk: simpleExplanation.simple_sk },
    postNumber,
    antenna,
  };
}

async function generateSimpleExplanation(entry: any): Promise<{ definition_en: string; simple_en: string; simple_sk: string }> {
  if (!OPENAI_KEY) return { definition_en: entry.explanation, simple_en: 'A key concept in programming.', simple_sk: 'Dôležitý koncept v programovaní.' };

  const prompt = `Term: ${entry.term} (${entry.short})
Slovak definition: ${entry.explanation}
Code example: ${entry.example}

Return JSON with:
1. "definition_en" — translate the Slovak definition to English (max 200 chars)
2. "simple_en" — explain this term in SUPER simple English, like to a 12-year-old. Use an analogy. 3-5 sentences, max 300 chars.
3. "simple_sk" — same but in SLOVAK. Simple, fun, with analogy. 3-5 sentences, max 300 chars. Never Czech.

JSON only:`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: 600, response_format: { type: 'json_object' } }),
    });
    return JSON.parse((await res.json()).choices?.[0]?.message?.content || '{}');
  } catch {
    return { definition_en: entry.explanation, simple_en: 'A fundamental concept.', simple_sk: 'Základný koncept.' };
  }
}
