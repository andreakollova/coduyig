import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

const glossary = [
  { id: 'api', term: 'API', category: 'skratka', short: 'Application Programming Interface',
    explanation_sk: 'Rozhranie na programovanie aplikácií, ktoré definuje pravidlá a protokoly pre komunikáciu medzi softvérovými komponentmi. Umožňuje aplikáciám posielať požiadavky a prijímať štruktúrované odpovede bez znalosti vnútornej implementácie druhej strany.',
    explanation_en: 'An application programming interface that defines rules and protocols for communication between software components. It allows applications to send requests and receive structured responses without knowledge of the other side\'s internal implementation.',
    example: 'fetch("https://api.weather.com/today")\n→ { "temp": 22, "city": "Bratislava" }' },
  { id: 'json', term: 'JSON', category: 'skratka', short: 'JavaScript Object Notation',
    explanation_sk: 'Ľahký dátový formát na výmenu informácií medzi systémami. Používa čitateľnú textovú syntax s pármi kľúč-hodnota. Podporuje reťazce, čísla, booleany, polia a vnorené objekty. Štandardný formát pre väčšinu webových API.',
    explanation_en: 'A lightweight data interchange format for exchanging information between systems. It uses human-readable text syntax with key-value pairs. It supports strings, numbers, booleans, arrays and nested objects. The standard format for most web APIs.',
    example: '{\n  "name": "Zuzka",\n  "age": 20,\n  "skills": ["Python", "React"]\n}' },
  { id: 'html', term: 'HTML', category: 'skratka', short: 'HyperText Markup Language',
    explanation_sk: 'Značkovací jazyk na definovanie štruktúry a obsahu webových stránok. Používa sémantické elementy (nadpisy, odseky, zoznamy, formuláre) na organizáciu dokumentu do hierarchického stromu, ktorý prehliadač interpretuje a vykreslí.',
    explanation_en: 'A markup language for defining the structure and content of web pages. It uses semantic elements (headings, paragraphs, lists, forms) to organize a document into a hierarchical tree that the browser interprets and renders.',
    example: '<h1>Welcome</h1>\n<p>This is a paragraph.</p>\n<a href="/about">About us</a>' },
  { id: 'css', term: 'CSS', category: 'skratka', short: 'Cascading Style Sheets',
    explanation_sk: 'Štýlovací jazyk na definovanie vizuálnej prezentácie HTML dokumentov. Riadi typografiu, farby, rozloženie, animácie a responzívny dizajn prostredníctvom selektorov a deklarácií vlastností s kaskádovým mechanizmom dedenia.',
    explanation_en: 'A styling language for defining the visual presentation of HTML documents. It controls typography, colors, layout, animations and responsive design through selectors and property declarations with a cascading inheritance mechanism.',
    example: 'body {\n  background: #0A0A0A;\n  color: white;\n  font-size: 16px;\n}' },
  { id: 'sql', term: 'SQL', category: 'skratka', short: 'Structured Query Language',
    explanation_sk: 'Štandardizovaný jazyk na správu a manipuláciu s relačnými databázami. Umožňuje definovať schémy, vkladať záznamy, vykonávať dotazy s podmienkami, agregovať dáta a spravovať prístupové práva.',
    explanation_en: 'A standardized language for managing and manipulating relational databases. It allows defining schemas, inserting records, executing conditional queries, aggregating data and managing access permissions.',
    example: 'SELECT name, email\nFROM users\nWHERE age > 18\nORDER BY name;' },
  { id: 'git', term: 'Git', category: 'nastroj', short: 'Version Control System',
    explanation_sk: 'Distribuovaný systém na správu verzií zdrojového kódu. Sleduje každú zmenu v projekte, umožňuje pracovať vo vetvách, zlučovať kód od viacerých vývojárov a vrátiť sa k akejkoľvek predchádzajúcej verzii.',
    explanation_en: 'A distributed version control system for source code. It tracks every change in a project, enables working in branches, merging code from multiple developers and reverting to any previous version.',
    example: 'git add .\ngit commit -m "new feature"\ngit push origin main' },
  { id: 'npm', term: 'npm', category: 'nastroj', short: 'Node Package Manager',
    explanation_sk: 'Správca balíkov pre ekosystém Node.js. Umožňuje inštaláciu, správu verzií a zdieľanie znovupoužiteľných JavaScript modulov. Obsahuje verejný register s viac ako 2 miliónmi balíkov a nástroje na správu závislostí projektu.',
    explanation_en: 'A package manager for the Node.js ecosystem. It enables installation, version management and sharing of reusable JavaScript modules. It contains a public registry with over 2 million packages and tools for managing project dependencies.',
    example: 'npm install react\nnpm install express\nnpm install supabase' },
  { id: 'http', term: 'HTTP', category: 'skratka', short: 'HyperText Transfer Protocol',
    explanation_sk: 'Aplikačný protokol na prenos hypertextových dokumentov cez internet. Funguje na princípe požiadavka-odpoveď medzi klientom a serverom. Definuje metódy (GET, POST, PUT, DELETE), stavové kódy a hlavičky. HTTPS pridáva šifrovanie cez TLS.',
    explanation_en: 'An application protocol for transferring hypertext documents over the internet. It operates on a request-response model between client and server. It defines methods (GET, POST, PUT, DELETE), status codes and headers. HTTPS adds encryption via TLS.',
    example: 'GET /api/users HTTP/1.1\nHost: coduy.com\n→ 200 OK { "users": [...] }' },
  { id: 'dns', term: 'DNS', category: 'skratka', short: 'Domain Name System',
    explanation_sk: 'Hierarchický decentralizovaný systém na preklad doménových mien na IP adresy. Používa distribuovanú databázu s koreňovými, TLD a autoritatívnymi servermi. Každá návšteva webovej stránky začína DNS rezolúciou, ktorá prebehne v priebehu milisekúnd.',
    explanation_en: 'A hierarchical decentralized system for translating domain names into IP addresses. It uses a distributed database with root, TLD and authoritative servers. Every website visit begins with a DNS resolution that happens within milliseconds.',
    example: 'google.com → 142.250.80.46\ncoduy.com → 76.76.21.21' },
  { id: 'ram', term: 'RAM', category: 'skratka', short: 'Random Access Memory',
    explanation_sk: 'Volatilná pamäť s priamym prístupom, ktorá umožňuje procesoru čítať a zapisovať dáta v konštantnom čase. Slúži na dočasné uchovávanie bežiacich procesov, cache a dátových štruktúr. Po odpojení napájania sa obsah vymaže.',
    explanation_en: 'Volatile random-access memory that allows the processor to read and write data in constant time. It serves for temporary storage of running processes, cache and data structures. Contents are erased when power is disconnected.',
    example: '8 GB RAM → 30 Chrome tabs\n16 GB RAM → coding + design\n32 GB RAM → video editing + VMs' },
  { id: 'cpu', term: 'CPU', category: 'skratka', short: 'Central Processing Unit',
    explanation_sk: 'Centrálna výpočtová jednotka, ktorá vykonáva inštrukcie strojového kódu. Obsahuje aritmeticko-logickú jednotku, riadiacu jednotku a registre. Moderné procesory majú viacero jadier s frekvenciami presahujúcimi 5 GHz a podporujú paralelné spracovanie.',
    explanation_en: 'The central processing unit that executes machine code instructions. It contains an arithmetic-logic unit, control unit and registers. Modern processors have multiple cores with frequencies exceeding 5 GHz and support parallel processing.',
    example: 'Apple M3 → 8 cores, 4.1 GHz\nIntel i9 → 24 cores, 5.8 GHz\nAMD Ryzen 9 → 16 cores, 5.7 GHz' },
  { id: 'ssd', term: 'SSD', category: 'skratka', short: 'Solid State Drive',
    explanation_sk: 'Pevný disk využívajúci flash pamäť NAND bez mechanických pohyblivých častí. Poskytuje výrazne vyššie rýchlosti čítania a zápisu oproti HDD, nižšiu latenciu a vyššiu odolnosť voči nárazom. NVMe rozhranie dosahuje rýchlosti nad 7 000 MB/s.',
    explanation_en: 'A solid-state drive using NAND flash memory with no mechanical moving parts. It provides significantly higher read and write speeds compared to HDD, lower latency and higher shock resistance. NVMe interface achieves speeds above 7,000 MB/s.',
    example: 'HDD: 150 MB/s read\nSATA SSD: 550 MB/s read\nNVMe SSD: 7,000 MB/s read' },
  { id: 'crud', term: 'CRUD', category: 'skratka', short: 'Create, Read, Update, Delete',
    explanation_sk: 'Akronym pre štyri základné operácie persistentného úložiska — vytvoriť, prečítať, aktualizovať a vymazať záznam. Mapuje sa na SQL príkazy INSERT, SELECT, UPDATE, DELETE a na HTTP metódy POST, GET, PUT, DELETE.',
    explanation_en: 'An acronym for the four basic operations of persistent storage — create, read, update and delete a record. It maps to SQL commands INSERT, SELECT, UPDATE, DELETE and to HTTP methods POST, GET, PUT, DELETE.',
    example: 'POST /users → Create\nGET /users → Read\nPUT /users/1 → Update\nDELETE /users/1 → Delete' },
  { id: 'jwt', term: 'JWT', category: 'skratka', short: 'JSON Web Token',
    explanation_sk: 'JWT (JSON Web Token) je kompaktný, URL-bezpečný token na prenos overovacích informácií medzi klientom a serverom. Po prihlásení server vygeneruje podpísaný token, ktorý klient posiela pri každej požiadavke na overenie identity bez potreby opakovane pristupovať k databáze.',
    explanation_en: 'JWT (JSON Web Token) is a compact, URL-safe token for transmitting authentication information between a client and server. After login, the server generates a signed token that the client sends with every request to verify identity without repeatedly accessing the database.',
    example: 'Login → server creates JWT\nJWT = header.payload.signature\nAuthorization: Bearer eyJhbG...' },
  { id: 'dom', term: 'DOM', category: 'koncept', short: 'Document Object Model',
    explanation_sk: 'DOM (Document Object Model) je stromová reprezentácia HTML dokumentu v pamäti prehliadača. Umožňuje JavaScriptu pristupovať k jednotlivým elementom stránky, meniť ich obsah, štýly a štruktúru. Frameworky ako React a Vue optimalizujú prácu s DOM automaticky.',
    explanation_en: 'DOM (Document Object Model) is a tree representation of an HTML document in browser memory. It allows JavaScript to access individual page elements, modify their content, styles and structure. Frameworks like React and Vue optimize DOM manipulation automatically.',
    example: 'document.getElementById("title")\n  .innerText = "New Title";\n// → page updates instantly' },
  { id: 'ssh', term: 'SSH', category: 'skratka', short: 'Secure Shell',
    explanation_sk: 'SSH (Secure Shell) je bezpečný komunikačný protokol, ktorý umožňuje pripojiť sa k inému počítaču cez sieť a ovládať ho na diaľku. Zároveň sa používa na bezpečný prenos súborov a overovanie identity pomocou kryptografických kľúčov.',
    explanation_en: 'SSH (Secure Shell) is a secure communication protocol that allows you to connect to another computer over a network and control it remotely. It is also used for secure file transfer and identity verification using cryptographic keys.',
    example: 'ssh user@server.com\nscp file.txt user@server:/path\nssh-keygen -t ed25519' },
  { id: 'tcp', term: 'TCP', category: 'skratka', short: 'Transmission Control Protocol',
    explanation_sk: 'TCP (Transmission Control Protocol) je transportný protokol, ktorý zaručuje spoľahlivé doručenie dát v správnom poradí. Používa trojcestný handshake na nadviazanie spojenia a kontrolné mechanizmy na detekciu a opätovné zaslanie stratených paketov.',
    explanation_en: 'TCP (Transmission Control Protocol) is a transport protocol that guarantees reliable delivery of data in the correct order. It uses a three-way handshake to establish connections and control mechanisms to detect and retransmit lost packets.',
    example: 'TCP three-way handshake:\n1. SYN → (I want to connect)\n2. SYN-ACK ← (OK)\n3. ACK → (Connected!)' },
  { id: 'oauth', term: 'OAuth', category: 'skratka', short: 'Open Authorization',
    explanation_sk: 'OAuth (Open Authorization) je autorizačný protokol, ktorý umožňuje aplikáciám pristupovať k zdrojom používateľa bez toho, aby poznali jeho heslo. Deleguje overovanie na dôveryhodného poskytovateľa identity ako Google, GitHub alebo Facebook.',
    explanation_en: 'OAuth (Open Authorization) is an authorization protocol that allows applications to access user resources without knowing their password. It delegates authentication to a trusted identity provider like Google, GitHub or Facebook.',
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

  const prompt = `You are explaining a programming term in a casual but smart way — like a cool older friend who knows tech, not like a children's book.

Term: ${entry.term} (${entry.short})
Technical explanation: ${entry.explanation_en}
Code example: ${entry.example}

Write TWO explanations:

1. "en" — English. Use a relatable analogy that actually matches the process of what this term does. Keep it smart but accessible — like explaining to a friend who's interested but new to coding. 3-4 sentences. Max 350 chars. End with why it matters.

2. "sk" — Slovak (NEVER Czech). Same style. Use natural casual Slovak — "predstav si", "v podstate", "funguje to tak že". NOT childish ("kamoš", "tajný tunel"). 3-4 sentences. Max 350 chars.

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
