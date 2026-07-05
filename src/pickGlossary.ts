import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const glossary = [
  { id: 'api', term: 'API', category: 'skratka', short: 'Application Programming Interface',
    explanation_sk: 'Rozhranie, cez ktoré spolu komunikujú aplikácie. Keď tvoja app pošle požiadavku na server a dostane dáta späť — to je API. Je to ako čašník v reštaurácii — ty nepíšeš priamo do kuchyne, zadáš objednávku čašníkovi (API) a on ti prinesie výsledok.',
    explanation_en: 'An interface that allows applications to communicate with each other. When your app sends a request to a server and gets data back — that is an API. Think of it like a waiter in a restaurant — you do not go into the kitchen yourself, you tell the waiter (API) what you want and they bring it to you.',
    example: 'fetch("https://api.weather.com/today")\n→ { "temp": 22, "city": "Bratislava" }' },
  { id: 'json', term: 'JSON', category: 'skratka', short: 'JavaScript Object Notation',
    explanation_sk: 'Univerzálny formát na ukladanie a prenos dát. Vyzerá ako JavaScript objekt — kľúče v úvodzovkách, hodnoty môžu byť text, čísla, pravda/nepravda, polia alebo ďalšie objekty. Takmer každé API na svete komunikuje cez JSON.',
    explanation_en: 'A universal format for storing and transferring data. It looks like a JavaScript object — keys in quotes, values can be text, numbers, true/false, arrays or other objects. Almost every API in the world communicates via JSON.',
    example: '{\n  "name": "Zuzka",\n  "age": 20,\n  "skills": ["Python", "React"]\n}' },
  { id: 'html', term: 'HTML', category: 'skratka', short: 'HyperText Markup Language',
    explanation_sk: 'Jazyk na štruktúru webových stránok. Každá webová stránka na svete je postavená z HTML. Definuje nadpisy, odseky, obrázky, odkazy a formuláre. Prehliadač číta HTML a zobrazuje ho ako stránku.',
    explanation_en: 'The language that structures web pages. Every website in the world is built with HTML. It defines headings, paragraphs, images, links and forms. The browser reads HTML and displays it as a page.',
    example: '<h1>Welcome</h1>\n<p>This is a paragraph.</p>\n<a href="/about">About us</a>' },
  { id: 'css', term: 'CSS', category: 'skratka', short: 'Cascading Style Sheets',
    explanation_sk: 'Jazyk na štýlovanie webových stránok. Ak HTML je kostra domu, CSS je farba stien, nábytok a dekorácie. Určuje farby, fonty, rozloženie, animácie a responzívny dizajn.',
    explanation_en: 'The language that styles web pages. If HTML is the skeleton of a house, CSS is the paint, furniture and decorations. It controls colors, fonts, layout, animations and responsive design.',
    example: 'body {\n  background: #0A0A0A;\n  color: white;\n  font-size: 16px;\n}' },
  { id: 'sql', term: 'SQL', category: 'skratka', short: 'Structured Query Language',
    explanation_sk: 'Jazyk na prácu s databázami. Pomocou SQL vieš vyhľadať, vložiť, upraviť alebo vymazať dáta. Používa ho každá webová aplikácia, e-shop, banka aj sociálna sieť.',
    explanation_en: 'A language for working with databases. With SQL you can search, insert, update or delete data. Every web app, e-shop, bank and social network uses it.',
    example: 'SELECT name, email\nFROM users\nWHERE age > 18\nORDER BY name;' },
  { id: 'git', term: 'Git', category: 'nastroj', short: 'Version Control System',
    explanation_sk: 'Distribuovaný systém na správu verzií zdrojového kódu. Sleduje každú zmenu v projekte, umožňuje pracovať vo vetvách, zlučovať kód od viacerých vývojárov a vrátiť sa k akejkoľvek predchádzajúcej verzii.',
    explanation_en: 'A distributed version control system for source code. It tracks every change in a project, enables working in branches, merging code from multiple developers and reverting to any previous version.',
    example: 'git add .\ngit commit -m "new feature"\ngit push origin main' },
  { id: 'npm', term: 'npm', category: 'nastroj', short: 'Node Package Manager',
    explanation_sk: 'Správca balíkov pre JavaScript. Obrovská knižnica hotového kódu — namiesto toho aby si všetko písal od nuly, nainštaluješ balík jedným príkazom. Má viac ako 2 milióny balíkov.',
    explanation_en: 'Package manager for JavaScript. A huge library of ready-made code — instead of writing everything from scratch, you install a package with one command. It has over 2 million packages.',
    example: 'npm install react\nnpm install express\nnpm install supabase' },
  { id: 'http', term: 'HTTP', category: 'skratka', short: 'HyperText Transfer Protocol',
    explanation_sk: 'Protokol na prenos dát cez internet. Keď otvoríš webovú stránku, tvoj prehliadač pošle HTTP požiadavku na server a server odpovie s HTML stránkou. HTTPS je šifrovaná verzia.',
    explanation_en: 'Protocol for transferring data over the internet. When you open a website, your browser sends an HTTP request to the server and the server responds with an HTML page. HTTPS is the encrypted version.',
    example: 'GET /api/users HTTP/1.1\nHost: coduy.com\n→ 200 OK { "users": [...] }' },
  { id: 'dns', term: 'DNS', category: 'skratka', short: 'Domain Name System',
    explanation_sk: 'Systém, ktorý prekladá doménové mená ako google.com na IP adresy (142.250.80.46), aby počítače vedeli kam posielať požiadavky. Každá návšteva webovej stránky začína DNS dotazom, ktorý prebehne v priebehu milisekúnd.',
    explanation_en: 'A system that translates domain names like google.com into IP addresses (142.250.80.46) so computers know where to send requests. Every website visit begins with a DNS lookup that happens within milliseconds.',
    example: 'google.com → 142.250.80.46\ncoduy.com → 76.76.21.21' },
  { id: 'ram', term: 'RAM', category: 'skratka', short: 'Random Access Memory',
    explanation_sk: 'Rýchla dočasná pamäť počítača. Všetko čo máš otvorené — každý tab, aplikácia, hra — beží v RAM. Keď vypneš počítač, RAM sa vymaže. Preto je dôležité ukladať prácu.',
    explanation_en: 'Fast temporary memory of a computer. Everything you have open — every tab, app, game — runs in RAM. When you turn off your computer, RAM is erased. That is why saving your work matters.',
    example: '8 GB RAM → 30 Chrome tabs\n16 GB RAM → coding + design\n32 GB RAM → video editing + VMs' },
  { id: 'cpu', term: 'CPU', category: 'skratka', short: 'Central Processing Unit',
    explanation_sk: 'Mozog počítača. Vykonáva miliardy inštrukcií za sekundu — počíta, porovnáva, presúva dáta. Čím rýchlejší CPU, tým rýchlejšie beží všetko. Moderné CPU majú 8-24 jadier.',
    explanation_en: 'The brain of the computer. It executes billions of instructions per second — calculating, comparing, moving data. The faster the CPU, the faster everything runs. Modern CPUs have 8-24 cores.',
    example: 'Apple M3 → 8 cores, 4.1 GHz\nIntel i9 → 24 cores, 5.8 GHz\nAMD Ryzen 9 → 16 cores, 5.7 GHz' },
  { id: 'ssd', term: 'SSD', category: 'skratka', short: 'Solid State Drive',
    explanation_sk: 'Úložisko bez pohyblivých častí. Oveľa rýchlejšie ako starý HDD — počítač sa zapne za 5 sekúnd namiesto minúty. Dáta sa ukladajú do flash pamäte, rovnako ako v telefóne.',
    explanation_en: 'Storage with no moving parts. Much faster than old HDD — computer boots in 5 seconds instead of a minute. Data is stored in flash memory, same as in your phone.',
    example: 'HDD: 150 MB/s read\nSATA SSD: 550 MB/s read\nNVMe SSD: 7,000 MB/s read' },
  { id: 'crud', term: 'CRUD', category: 'skratka', short: 'Create, Read, Update, Delete',
    explanation_sk: 'Štyri základné operácie s dátami. Každá aplikácia na svete robí CRUD — vytvorí záznam, prečíta ho, upraví a vymaže. E-shop, sociálna sieť, poznámky — všetko je CRUD.',
    explanation_en: 'Four basic data operations. Every app in the world does CRUD — creates a record, reads it, updates it and deletes it. E-shop, social network, notes — everything is CRUD.',
    example: 'POST /users → Create\nGET /users → Read\nPUT /users/1 → Update\nDELETE /users/1 → Delete' },
  { id: 'jwt', term: 'JWT', category: 'skratka', short: 'JSON Web Token',
    explanation_sk: 'Digitálny preukaz totožnosti. Po prihlásení server vytvorí JWT token a pošle ho tebe. Pri každej ďalšej požiadavke ho pošleš späť — server overí tvoju identitu bez hľadania v databáze.',
    explanation_en: 'A digital ID card. After login, the server creates a JWT token and sends it to you. With every next request you send it back — the server verifies your identity without looking in the database.',
    example: 'Login → server creates JWT\nJWT = header.payload.signature\nAuthorization: Bearer eyJhbG...' },
  { id: 'dom', term: 'DOM', category: 'koncept', short: 'Document Object Model',
    explanation_sk: 'Stromová mapa webovej stránky v pamäti prehliadača. Keď JavaScript mení text, farbu alebo pridáva elementy — manipuluje DOM. React a Vue robia toto automaticky a efektívne.',
    explanation_en: 'A tree-map of a web page in browser memory. When JavaScript changes text, color or adds elements — it manipulates the DOM. React and Vue do this automatically and efficiently.',
    example: 'document.getElementById("title")\n  .innerText = "New Title";\n// → page updates instantly' },
  { id: 'ssh', term: 'SSH', category: 'skratka', short: 'Secure Shell',
    explanation_sk: 'Šifrovaný tunel na vzdialený prístup k serverom. Vývojári ho používajú na správu serverov, deploy kódu a prenos súborov. Bezpečnejšie ako heslo — používa kryptografické kľúče.',
    explanation_en: 'An encrypted tunnel for remote server access. Developers use it to manage servers, deploy code and transfer files. More secure than passwords — uses cryptographic keys.',
    example: 'ssh user@server.com\nscp file.txt user@server:/path\nssh-keygen -t ed25519' },
  { id: 'tcp', term: 'TCP', category: 'skratka', short: 'Transmission Control Protocol',
    explanation_sk: 'Spoľahlivý protokol na prenos dát. Garantuje že každý paket dorazí v správnom poradí. Používa sa pre web, email, súbory — všade kde nemôžeš stratiť ani bajt.',
    explanation_en: 'A reliable protocol for data transfer. Guarantees every packet arrives in the correct order. Used for web, email, files — everywhere you cannot lose a single byte.',
    example: 'TCP three-way handshake:\n1. SYN → (I want to connect)\n2. SYN-ACK ← (OK)\n3. ACK → (Connected!)' },
  { id: 'oauth', term: 'OAuth', category: 'skratka', short: 'Open Authorization',
    explanation_sk: 'Protokol pre prihlásenie cez tretiu stranu. Keď klikneš "Prihlásiť sa cez Google" — to je OAuth. Tvoje heslo Google nikdy neprejde cez aplikáciu. Bezpečné a pohodlné.',
    explanation_en: 'A protocol for third-party login. When you click "Login with Google" — that is OAuth. Your Google password never passes through the app. Secure and convenient.',
    example: 'Click "Login with Google"\n→ Redirect to Google\n→ User approves\n→ Redirect back with token' },
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
  equipment: Record<string, string>;
}

// Difficulty mapping for glossary terms
const termDifficulty: Record<string, 'beginner' | 'advanced' | 'professional'> = {
  html: 'beginner', css: 'beginner', ram: 'beginner', cpu: 'beginner', ssd: 'beginner',
  http: 'beginner', git: 'beginner', npm: 'beginner',
  api: 'advanced', json: 'advanced', sql: 'advanced', crud: 'advanced', dns: 'advanced',
  ssh: 'advanced', dom: 'advanced',
  jwt: 'professional', oauth: 'professional', tcp: 'professional',
};

const beginnerEquip: Record<string, string>[] = [
  { hat: 'hat-beanie' }, { glasses: 'glasses-round' }, { hat: 'hat-headband' }, {},
];
const advancedEquip: Record<string, string>[] = [
  { hat: 'hat-graduation', glasses: 'glasses-cool' },
  { hat: 'hat-cowboy', glasses: 'glasses-aviator' },
  { hat: 'hat-pilot', glasses: 'glasses-cool' },
];
const professionalEquip: Record<string, string>[] = [
  { hat: 'hat-golden-crown', glasses: 'glasses-golden', accessory: 'acc-wings-gold' },
  { hat: 'hat-void-crown', glasses: 'glasses-void', accessory: 'acc-cosmic-cape' },
  { hat: 'hat-galaxy', glasses: 'glasses-laser' },
];

const antennas = ['ant-heart', 'ant-star', 'ant-lightning', 'ant-diamond', 'ant-flame-orb', 'ant-frost-crystal', 'ant-golden-star'];

// Track posted glossary terms to avoid repeats
async function getPostedGlossaryIds(): Promise<string[]> {
  try {
    const { data } = await sb.storage.from('ig-media').download('tracking/glossary_posted.json');
    if (data) {
      const text = await data.text();
      return JSON.parse(text);
    }
  } catch {}
  return [];
}

async function markGlossaryPosted(id: string) {
  const posted = await getPostedGlossaryIds();
  posted.push(id);
  const buf = Buffer.from(JSON.stringify(posted));
  await sb.storage.from('ig-media').upload('tracking/glossary_posted.json', buf, { contentType: 'application/json', upsert: true });
}

export async function pickGlossary(): Promise<GlossaryData | null> {
  // Get already posted IDs
  let postedIds = await getPostedGlossaryIds();

  // Filter out posted ones
  let available = glossary.filter(e => !postedIds.includes(e.id));

  // If all posted, reset cycle
  if (available.length === 0) {
    console.log('🔄 All glossary terms posted — resetting cycle');
    await sb.storage.from('ig-media').remove(['tracking/glossary_posted.json']);
    postedIds = [];
    available = glossary;
  }

  const entry = available[Math.floor(Math.random() * available.length)];
  const antenna = antennas[Math.floor(Math.random() * antennas.length)];
  const postNumber = postedIds.length + 1;

  // Pick outfit based on term difficulty
  const diff = termDifficulty[entry.id] || 'beginner';
  const pool = diff === 'professional' ? professionalEquip : diff === 'advanced' ? advancedEquip : beginnerEquip;
  const equipment = pool[Math.floor(Math.random() * pool.length)];

  const simpleExplanation = await generateSimple(entry);
  console.log(`📖 Picked glossary: ${entry.term} (${diff}) [${available.length} remaining]`);

  // Mark as posted
  await markGlossaryPosted(entry.id);

  return { ...entry, simpleExplanation, postNumber, antenna, equipment };
}

async function generateSimple(entry: any): Promise<{ en: string; sk: string }> {
  if (!OPENAI_KEY) return { en: 'A key programming concept.', sk: 'Dôležitý programátorský koncept.' };

  const prompt = `You are explaining programming terms to a 14-year-old who has never coded.

Term: ${entry.term} (${entry.short})
Technical explanation: ${entry.explanation_en}
Code example: ${entry.example}

Write TWO explanations:

1. "en" — English. Use a fun, relatable analogy from everyday life (like ordering food, using a phone, school, etc). 4-5 sentences. Max 350 chars. End with why it matters.

2. "sk" — Slovak (NEVER Czech). Same style, same analogy. 4-5 sentences. Max 350 chars.

JSON only:
{"en": "...", "sk": "..."}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: 500, response_format: { type: 'json_object' } }),
    });
    return JSON.parse((await res.json()).choices?.[0]?.message?.content || '{}');
  } catch {
    return { en: 'A fundamental concept in programming.', sk: 'Základný koncept v programovaní.' };
  }
}
