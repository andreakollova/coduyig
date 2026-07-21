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
  { id: 'git', term: 'Git', category: 'pojem', short: 'Version Control System',
    explanation_sk: 'Distribuovaný systém na správu verzií zdrojového kódu. Sleduje každú zmenu v projekte, umožňuje pracovať vo vetvách, zlučovať kód od viacerých vývojárov a vrátiť sa k akejkoľvek predchádzajúcej verzii.',
    explanation_en: 'A distributed version control system for source code. It tracks every change in a project, enables working in branches, merging code from multiple developers and reverting to any previous version.',
    example: 'git add .\ngit commit -m "new feature"\ngit push origin main' },
  { id: 'npm', term: 'npm', category: 'pojem', short: 'Node Package Manager',
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
  { id: 'dom', term: 'DOM', category: 'pojem', short: 'Document Object Model',
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
  { id: 'cli', term: 'CLI', category: 'skratka', short: 'Command Line Interface',
    explanation_sk: 'Textové rozhranie na ovládanie programov cez terminál pomocou príkazov. Oproti grafickému rozhraniu umožňuje automatizáciu, skriptovanie a efektívnejšiu prácu so systémom.',
    explanation_en: 'A text-based interface for controlling programs through the terminal using commands. Compared to a graphical interface, it enables automation, scripting and more efficient system management.',
    example: 'git status\nnpm install react\npython main.py\nls -la /home' },
  { id: 'gui', term: 'GUI', category: 'skratka', short: 'Graphical User Interface',
    explanation_sk: 'Grafické rozhranie umožňujúce interakciu s programom pomocou okien, tlačidiel a ikon namiesto textových príkazov. Väčšina desktopových a mobilných aplikácií používa GUI.',
    explanation_en: 'A graphical interface enabling interaction with a program using windows, buttons and icons instead of text commands. Most desktop and mobile applications use a GUI.',
    example: 'VS Code → code editor GUI\nFigma → design GUI\nChrome → browser GUI' },
  { id: 'ide', term: 'IDE', category: 'skratka', short: 'Integrated Development Environment',
    explanation_sk: 'Integrované vývojové prostredie kombinujúce editor kódu, debugger, terminál a správu verzií v jednom programe. Zvyšuje produktivitu vývojára vďaka automatickému doplňaniu, zvýrazňovaniu syntaxe a integrácii nástrojov.',
    explanation_en: 'An integrated development environment combining code editor, debugger, terminal and version control in one program. It increases developer productivity through auto-completion, syntax highlighting and tool integration.',
    example: 'VS Code → most popular IDE\nPyCharm → Python IDE\nWebStorm → JavaScript IDE' },
  { id: 'cdn', term: 'CDN', category: 'skratka', short: 'Content Delivery Network',
    explanation_sk: 'Distribuovaná sieť serverov po celom svete, ktorá doručuje statický obsah z geograficky najbližšieho servera k používateľovi. Znižuje latenciu a zrýchľuje načítanie webových stránok.',
    explanation_en: 'A distributed network of servers worldwide that delivers static content from the geographically closest server to the user. It reduces latency and speeds up web page loading.',
    example: 'Cloudflare CDN\nAWS CloudFront\nVercel Edge Network' },
  { id: 'vpn', term: 'VPN', category: 'skratka', short: 'Virtual Private Network',
    explanation_sk: 'Technológia vytvárajúca šifrovaný tunel medzi zariadením a serverom. Chráni prenos dát na verejných sieťach a umožňuje bezpečný vzdialený prístup k firemným zdrojom.',
    explanation_en: 'A technology that creates an encrypted tunnel between a device and a server. It protects data transfer on public networks and enables secure remote access to corporate resources.',
    example: 'WireGuard → modern VPN\nOpenVPN → open-source VPN\nTailscale → mesh VPN' },
  { id: 'cicd', term: 'CI/CD', category: 'pojem', short: 'Continuous Integration / Continuous Delivery',
    explanation_sk: 'Automatizovaný proces, pri ktorom sa každá zmena v kóde automaticky otestuje a nasadí do produkcie. CI kontroluje kvalitu kódu, CD zabezpečuje plynulé nasadenie nových verzií.',
    explanation_en: 'An automated process where every code change is automatically tested and deployed to production. CI checks code quality, CD ensures smooth deployment of new versions.',
    example: 'GitHub Actions → run tests on push\nVercel → auto-deploy on merge\nDocker → containerized deployment' },
  { id: 'llm', term: 'LLM', category: 'skratka', short: 'Large Language Model',
    explanation_sk: 'Veľký jazykový model trénovaný na obrovskom množstve textu. Dokáže generovať text, odpovedať na otázky, prekladať a písať kód. Príklady sú GPT-4, Claude a LLaMA.',
    explanation_en: 'A large language model trained on enormous amounts of text. It can generate text, answer questions, translate and write code. Examples include GPT-4, Claude and LLaMA.',
    example: 'GPT-4 → OpenAI\nClaude → Anthropic\nLLaMA → Meta\nGemini → Google' },
  { id: 'rag', term: 'RAG', category: 'skratka', short: 'Retrieval-Augmented Generation',
    explanation_sk: 'Technika, pri ktorej AI model pred generovaním odpovede najprv vyhľadá relevantné informácie z externej databázy. Znižuje halucinácie a umožňuje prístup k aktuálnym dátam.',
    explanation_en: 'A technique where an AI model first retrieves relevant information from an external database before generating an answer. It reduces hallucinations and enables access to current data.',
    example: 'User asks question\n→ Search vector DB\n→ Find relevant docs\n→ LLM generates answer with context' },
  { id: 'mcp', term: 'MCP', category: 'skratka', short: 'Model Context Protocol',
    explanation_sk: 'Štandardizovaný protokol umožňujúci AI modelom komunikovať s externými nástrojmi a službami. Definuje ako model pristupuje k súborom, databázam, API a ďalším zdrojom.',
    explanation_en: 'A standardized protocol enabling AI models to communicate with external tools and services. It defines how a model accesses files, databases, APIs and other resources.',
    example: 'AI Agent → MCP → read files\nAI Agent → MCP → query database\nAI Agent → MCP → call API' },
  { id: 'gpt', term: 'GPT', category: 'skratka', short: 'Generative Pre-trained Transformer',
    explanation_sk: 'Architektúra generatívneho AI modelu založená na transformer sieťach. Predtrénovaná na veľkom korpuse textu a následne dolaďovaná na špecifické úlohy ako konverzácia alebo generovanie kódu.',
    explanation_en: 'A generative AI model architecture based on transformer networks. Pre-trained on large text corpora and then fine-tuned for specific tasks like conversation or code generation.',
    example: 'GPT-4 → text + vision\nGPT-4o → multimodal\nChatGPT → conversational interface' },
  // === Frameworks & Tools ===
  { id: 'react', term: 'React', category: 'pojem', short: 'JavaScript UI Library',
    explanation_sk: 'JavaScript knižnica od Mety na tvorbu používateľských rozhraní z komponentov. Používa virtuálny DOM na efektívne aktualizácie a unidirekcionálny tok dát. Základ pre Next.js, React Native a ďalšie frameworky.',
    explanation_en: 'A JavaScript library by Meta for building user interfaces from components. It uses a virtual DOM for efficient updates and unidirectional data flow. The foundation for Next.js, React Native and other frameworks.',
    example: 'function App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}' },
  { id: 'nextjs', term: 'Next.js', category: 'pojem', short: 'React Framework',
    explanation_sk: 'React framework od Vercelu na tvorbu webových aplikácií. Podporuje server-side rendering, statickú generáciu, API routes a automatický routing podľa štruktúry súborov.',
    explanation_en: 'A React framework by Vercel for building web applications. It supports server-side rendering, static generation, API routes and automatic file-based routing.',
    example: 'export default function Home() {\n  return <h1>Welcome</h1>;\n}\n// app/page.tsx → automatically routed to /' },
  { id: 'typescript', term: 'TypeScript', category: 'pojem', short: 'Typed JavaScript',
    explanation_sk: 'Nadstavba JavaScriptu od Microsoftu pridávajúca statické typy. Umožňuje zachytiť chyby ešte pred spustením programu. Kompiluje sa do čistého JavaScriptu.',
    explanation_en: 'A JavaScript superset by Microsoft that adds static types. It catches errors before running the program. It compiles to plain JavaScript.',
    example: 'function greet(name: string): string {\n  return `Hello, ${name}`;\n}\ngreet(42); // TS Error: number is not string' },
  { id: 'nodejs', term: 'Node.js', category: 'pojem', short: 'JavaScript Runtime',
    explanation_sk: 'Prostredie na spúšťanie JavaScriptu mimo prehliadača. Postavené na V8 engine od Googlu. Umožňuje vytvárať servery, CLI nástroje a backendy v JavaScripte.',
    explanation_en: 'A runtime for running JavaScript outside the browser. Built on Google\'s V8 engine. It enables building servers, CLI tools and backends in JavaScript.',
    example: 'const http = require("http");\nhttp.createServer((req, res) => {\n  res.end("Hello World");\n}).listen(3000);' },
  { id: 'python', term: 'Python', category: 'pojem', short: 'Programming Language',
    explanation_sk: 'Vysoko-úrovňový programovací jazyk zameraný na čitateľnosť kódu. Používa sa v AI, data science, web developmente, automatizácii a vzdelávaní. Jeden z najpopulárnejších jazykov na svete.',
    explanation_en: 'A high-level programming language focused on code readability. Used in AI, data science, web development, automation and education. One of the most popular languages in the world.',
    example: 'def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a' },
  { id: 'docker', term: 'Docker', category: 'pojem', short: 'Container Platform',
    explanation_sk: 'Platforma na vytváranie a spúšťanie kontajnerov — izolovaných prostredí obsahujúcich aplikáciu a všetky jej závislosti. Zabezpečuje, že aplikácia beží rovnako na akomkoľvek počítači.',
    explanation_en: 'A platform for creating and running containers — isolated environments containing an application and all its dependencies. It ensures an application runs the same on any machine.',
    example: 'FROM node:20\nCOPY . /app\nRUN npm install\nCMD ["node", "server.js"]' },
  { id: 'supabase', term: 'Supabase', category: 'pojem', short: 'Open-source Backend',
    explanation_sk: 'Open-source alternatíva k Firebase poskytujúca PostgreSQL databázu, autentifikáciu, storage a real-time subscriptions. Ponúka API automaticky generované z databázovej schémy.',
    explanation_en: 'An open-source Firebase alternative providing PostgreSQL database, authentication, storage and real-time subscriptions. It offers APIs automatically generated from the database schema.',
    example: 'const { data } = await supabase\n  .from("users")\n  .select("name, email")\n  .eq("active", true);' },
  { id: 'postgresql', term: 'PostgreSQL', category: 'pojem', short: 'Relational Database',
    explanation_sk: 'Výkonná open-source relačná databáza podporujúca pokročilé funkcie ako JSON dátové typy, full-text vyhľadávanie a rozšírenia. Používaná firmami ako Spotify, Instagram a Reddit.',
    explanation_en: 'A powerful open-source relational database supporting advanced features like JSON data types, full-text search and extensions. Used by companies like Spotify, Instagram and Reddit.',
    example: 'SELECT users.name, COUNT(orders.id)\nFROM users\nJOIN orders ON users.id = orders.user_id\nGROUP BY users.name;' },
  { id: 'tailwind', term: 'Tailwind CSS', category: 'pojem', short: 'Utility-first CSS Framework',
    explanation_sk: 'CSS framework založený na utility triedach, kde štýly píšete priamo do HTML. Namiesto vlastných CSS súborov kombinujete malé, jednoúčelové triedy. Veľmi populárny v modernom web developmente.',
    explanation_en: 'A utility-first CSS framework where you write styles directly in HTML. Instead of custom CSS files, you combine small, single-purpose classes. Very popular in modern web development.',
    example: '<div class="flex items-center gap-4 p-6\n  bg-gray-900 rounded-xl shadow-lg">\n  <img class="w-12 h-12 rounded-full" />\n  <span class="text-white font-bold">User</span>\n</div>' },
  { id: 'prisma', term: 'Prisma', category: 'pojem', short: 'TypeScript ORM',
    explanation_sk: 'Moderné ORM pre TypeScript a Node.js generujúce typovo bezpečné dotazy z databázovej schémy. Podporuje PostgreSQL, MySQL, SQLite a MongoDB. Automaticky generuje migrácie.',
    explanation_en: 'A modern ORM for TypeScript and Node.js generating type-safe queries from a database schema. It supports PostgreSQL, MySQL, SQLite and MongoDB. It automatically generates migrations.',
    example: 'const users = await prisma.user.findMany({\n  where: { age: { gte: 18 } },\n  include: { posts: true },\n});' },
  { id: 'redis', term: 'Redis', category: 'pojem', short: 'In-Memory Database',
    explanation_sk: 'In-memory databáza na ukladanie dát v RAM pre extrémne rýchly prístup. Používa sa na cache, sessions, fronty úloh a real-time funkcie. Dáta dokáže zapísať aj na disk.',
    explanation_en: 'An in-memory database for storing data in RAM for extremely fast access. Used for cache, sessions, task queues and real-time features. It can persist data to disk.',
    example: 'SET user:1 "John"     → OK\nGET user:1             → "John"\nEXPIRE user:1 3600     → auto-delete after 1h' },
  { id: 'graphql', term: 'GraphQL', category: 'pojem', short: 'Query Language for APIs',
    explanation_sk: 'Dopytovací jazyk pre API umožňujúci klientovi presne špecifikovať aké dáta potrebuje. Na rozdiel od REST vracia presne požadované polia, čím eliminuje nadmerné alebo nedostatočné načítavanie dát.',
    explanation_en: 'A query language for APIs allowing clients to specify exactly what data they need. Unlike REST, it returns precisely the requested fields, eliminating over- or under-fetching of data.',
    example: 'query {\n  user(id: 1) {\n    name\n    posts { title }\n  }\n}' },
  { id: 'vercel', term: 'Vercel', category: 'pojem', short: 'Deployment Platform',
    explanation_sk: 'Cloudová platforma na nasadzovanie webových aplikácií. Tvorca Next.js. Automaticky deployuje pri každom pushe do Git repozitára s globálnou edge sieťou pre rýchle načítanie.',
    explanation_en: 'A cloud platform for deploying web applications. The creator of Next.js. It automatically deploys on every push to a Git repository with a global edge network for fast loading.',
    example: 'git push origin main\n→ Vercel auto-deploys\n→ Live at app.vercel.app\n→ Preview for each PR' },
  { id: 'stripe', term: 'Stripe', category: 'pojem', short: 'Payment Processing',
    explanation_sk: 'Platforma na spracovanie online platieb. Poskytuje API na jednorazové platby, predplatné, fakturáciu a správu zákazníkov. Používajú ju firmy ako Shopify, Notion a Amazon.',
    explanation_en: 'A platform for processing online payments. It provides APIs for one-time payments, subscriptions, invoicing and customer management. Used by companies like Shopify, Notion and Amazon.',
    example: 'const session = await stripe.checkout.sessions.create({\n  line_items: [{ price: "price_123", quantity: 1 }],\n  mode: "payment",\n});' },
  { id: 'openai', term: 'OpenAI', category: 'pojem', short: 'AI Research Company',
    explanation_sk: 'Spoločnosť vyvíjajúca pokročilé AI modely vrátane GPT-4, DALL-E a Whisper. Poskytuje API na generovanie textu, obrázkov, prevod reči a vkladanie textu.',
    explanation_en: 'A company developing advanced AI models including GPT-4, DALL-E and Whisper. It provides APIs for text generation, image creation, speech conversion and text embedding.',
    example: 'const response = await openai.chat.completions.create({\n  model: "gpt-4o",\n  messages: [{ role: "user", content: "Hello" }],\n});' },
  { id: 'vue', term: 'Vue', category: 'pojem', short: 'Frontend Framework',
    explanation_sk: 'Progresívny JavaScript framework na tvorbu používateľských rozhraní. Kombinuje reaktívny systém s komponentovou architektúrou. Jednoduchší na naučenie ako React alebo Angular.',
    explanation_en: 'A progressive JavaScript framework for building user interfaces. It combines a reactive system with component architecture. Easier to learn than React or Angular.',
    example: '<template>\n  <button @click="count++">{{ count }}</button>\n</template>\n<script setup>\nconst count = ref(0);\n</script>' },
  { id: 'zustand', term: 'Zustand', category: 'pojem', short: 'React State Management',
    explanation_sk: 'Minimalistická knižnica na správu stavu v React aplikáciách. Oproti Reduxu nepotrebuje boilerplate kód, providery ani reducery. Store sa vytvára jednou funkciou.',
    explanation_en: 'A minimalistic state management library for React applications. Unlike Redux, it requires no boilerplate code, providers or reducers. A store is created with a single function.',
    example: 'const useStore = create((set) => ({\n  count: 0,\n  increment: () => set((s) => ({ count: s.count + 1 })),\n}));' },
  { id: 'remotion', term: 'Remotion', category: 'pojem', short: 'React Video Framework',
    explanation_sk: 'React knižnica na tvorbu videí pomocou kódu. Každý frame videa je React komponent. Umožňuje programaticky generovať videa s animáciami, textom a dátami.',
    explanation_en: 'A React library for creating videos with code. Each video frame is a React component. It enables programmatically generating videos with animations, text and data.',
    example: 'const MyVideo = () => {\n  const frame = useCurrentFrame();\n  const opacity = interpolate(frame, [0, 30], [0, 1]);\n  return <div style={{ opacity }}>Hello</div>;\n};' },
  { id: 'framermotion', term: 'Framer Motion', category: 'pojem', short: 'React Animation Library',
    explanation_sk: 'Knižnica na tvorbu plynulých animácií v React aplikáciách. Poskytuje deklaratívne API pre animácie, gestá, layout animácie a exit animácie komponentov.',
    explanation_en: 'A library for creating smooth animations in React applications. It provides a declarative API for animations, gestures, layout animations and component exit animations.',
    example: '<motion.div\n  initial={{ opacity: 0, y: 20 }}\n  animate={{ opacity: 1, y: 0 }}\n  transition={{ duration: 0.4 }}\n/>' },
  { id: 'aws', term: 'AWS', category: 'pojem', short: 'Amazon Web Services',
    explanation_sk: 'Najväčšia cloudová platforma od Amazonu. Poskytuje viac ako 200 služieb vrátane serverov, databáz, AI, storage a sieťových služieb. Poháňa veľkú časť internetu.',
    explanation_en: 'The largest cloud platform by Amazon. It provides over 200 services including servers, databases, AI, storage and networking. It powers a large portion of the internet.',
    example: 'EC2 → virtual servers\nS3 → file storage\nRDS → managed databases\nLambda → serverless functions' },
  { id: 'langchain', term: 'LangChain', category: 'pojem', short: 'AI Application Framework',
    explanation_sk: 'Framework na vytváranie aplikácií s jazykovými modelmi. Umožňuje reťaziť volania LLM, pristupovať k externým dátam a vytvárať AI agentov s nástrojmi.',
    explanation_en: 'A framework for building applications with language models. It enables chaining LLM calls, accessing external data and creating AI agents with tools.',
    example: 'chain = prompt | llm | output_parser\nresult = chain.invoke({"topic": "Python"})\n# → structured AI response' },
  { id: 'githubactions', term: 'GitHub Actions', category: 'pojem', short: 'CI/CD Platform',
    explanation_sk: 'Platforma na automatizáciu pracovných postupov priamo v GitHub repozitári. Spúšťa testy, buildy a deploymenty na základe udalostí ako push, pull request alebo cron.',
    explanation_en: 'A platform for automating workflows directly in a GitHub repository. It runs tests, builds and deployments based on events like push, pull request or cron.',
    example: 'on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test' },
  // === Concepts ===
  { id: 'component', term: 'Component', category: 'pojem', short: 'Reusable UI Part',
    explanation_sk: 'Znovupoužiteľná časť používateľského rozhrania zapuzdrujúca vlastnú logiku, štýly a šablónu. Komponenty sa skladajú do väčších celkov ako stavebné bloky aplikácie.',
    explanation_en: 'A reusable part of a user interface encapsulating its own logic, styles and template. Components compose into larger structures as building blocks of an application.',
    example: 'function Button({ label, onClick }) {\n  return <button onClick={onClick}>{label}</button>;\n}\n<Button label="Save" onClick={handleSave} />' },
  { id: 'props', term: 'Props', category: 'pojem', short: 'Component Data',
    explanation_sk: 'Dáta odovzdané rodičovským komponentom potomkovi. Sú nemenné — komponent ich môže čítať, ale nie meniť. Umožňujú konfigurovať a prispôsobovať komponenty.',
    explanation_en: 'Data passed from a parent component to a child. They are immutable — a component can read but not modify them. They enable configuring and customizing components.',
    example: 'function Greeting({ name, age }) {\n  return <p>Hi {name}, age {age}</p>;\n}\n<Greeting name="Zuzka" age={20} />' },
  { id: 'state', term: 'State', category: 'pojem', short: 'Component Memory',
    explanation_sk: 'Interné dáta komponentu, ktoré sa môžu meniť počas jeho životnosti. Keď sa state zmení, komponent sa automaticky prekresli. Základ interaktivity v React aplikáciách.',
    explanation_en: 'Internal data of a component that can change during its lifetime. When state changes, the component automatically re-renders. The foundation of interactivity in React applications.',
    example: 'const [count, setCount] = useState(0);\n<button onClick={() => setCount(count + 1)}>\n  Clicked {count} times\n</button>' },
  { id: 'hook', term: 'Hook', category: 'pojem', short: 'React Special Function',
    explanation_sk: 'Špeciálna funkcia v Reacte umožňujúca funkcionálnym komponentom používať state, efekty a ďalšie React funkcie. Názov vždy začína slovom "use".',
    explanation_en: 'A special function in React enabling functional components to use state, effects and other React features. The name always starts with "use".',
    example: 'useState → manage state\nuseEffect → side effects\nuseRef → persist values\nuseMemo → optimize performance' },
  { id: 'middleware', term: 'Middleware', category: 'pojem', short: 'Request Interceptor',
    explanation_sk: 'Kód vykonaný medzi prijatím požiadavky a odoslaním odpovede. Používa sa na autentifikáciu, logovanie, validáciu a transformáciu dát pred spracovaním hlavnou logikou.',
    explanation_en: 'Code executed between receiving a request and sending a response. Used for authentication, logging, validation and data transformation before the main logic processes it.',
    example: 'app.use((req, res, next) => {\n  console.log(req.method, req.url);\n  next(); // pass to next handler\n});' },
  { id: 'webhook', term: 'Webhook', category: 'pojem', short: 'Event Notification',
    explanation_sk: 'Automatické HTTP upozornenie odoslané jednou aplikáciou druhej pri výskyte udalosti. Namiesto neustáleho dopytovanie server pošle dáta hneď keď sa niečo stane.',
    explanation_en: 'An automatic HTTP notification sent by one application to another when an event occurs. Instead of constant polling, the server sends data immediately when something happens.',
    example: 'Stripe payment → POST /webhook\n{ "type": "payment.succeeded",\n  "amount": 2999 }\n→ your server processes it' },
  { id: 'cache', term: 'Cache', category: 'pojem', short: 'Temporary Fast Storage',
    explanation_sk: 'Dočasné úložisko pre rýchlejší prístup k často používaným dátam. Ukladá výsledky výpočtov alebo sieťových požiadaviek, aby sa nemuseli opakovať.',
    explanation_en: 'Temporary storage for faster access to frequently used data. It stores results of computations or network requests so they don\'t need to be repeated.',
    example: 'Browser cache → CSS, JS, images\nRedis cache → API responses\nCDN cache → static assets\nCPU cache → instructions' },
  { id: 'deploy', term: 'Deploy', category: 'pojem', short: 'Ship to Production',
    explanation_sk: 'Proces nasadenia aplikácie na server, kde je dostupná používateľom. Zahŕňa build, upload, konfiguráciu a spustenie aplikácie v produkčnom prostredí.',
    explanation_en: 'The process of shipping an application to a server where it becomes available to users. It involves building, uploading, configuring and running the application in production.',
    example: 'git push origin main\n→ CI runs tests\n→ Build application\n→ Deploy to Vercel/AWS\n→ Live!' },
  { id: 'prompt', term: 'Prompt', category: 'pojem', short: 'AI Input Instruction',
    explanation_sk: 'Textové zadanie pre AI model definujúce čo má vygenerovať. Kvalita promptu priamo ovplyvňuje kvalitu odpovede. Prompt engineering je kľúčová zručnosť pri práci s AI.',
    explanation_en: 'A text instruction for an AI model defining what it should generate. Prompt quality directly affects response quality. Prompt engineering is a key skill when working with AI.',
    example: 'Bad: "Write code"\nGood: "Write a Python function that\n  takes a list of numbers and returns\n  the top 3 largest values, sorted\n  descending."' },
  { id: 'token', term: 'Token', category: 'pojem', short: 'AI Text Unit',
    explanation_sk: 'Základná jednotka textu, ktorú AI model spracúva. Jedno slovo je zvyčajne 1-3 tokeny. Kontext window modelu je limitovaný počtom tokenov.',
    explanation_en: 'A basic unit of text that an AI model processes. One word is typically 1-3 tokens. A model\'s context window is limited by the number of tokens.',
    example: '"Hello world" → 2 tokens\n"programming" → 1 token\n"ChatGPT" → 3 tokens\nGPT-4: 128K token context' },
  { id: 'embedding', term: 'Embedding', category: 'pojem', short: 'Text as Numbers',
    explanation_sk: 'Číselná reprezentácia textu vo forme vektora. Podobné texty majú podobné vektory. Používa sa na sémantické vyhľadávanie, odporúčania a RAG systémy.',
    explanation_en: 'A numerical representation of text as a vector. Similar texts have similar vectors. Used for semantic search, recommendations and RAG systems.',
    example: '"king" → [0.2, 0.8, 0.1, ...]\n"queen" → [0.21, 0.79, 0.12, ...]\n// similar vectors = similar meaning' },
  { id: 'agent', term: 'Agent', category: 'pojem', short: 'AI with Tools',
    explanation_sk: 'AI systém schopný autonómne používať nástroje, pristupovať k dátam a vykonávať úlohy. Kombinuje jazykový model s prístupom k API, súborom a databázam.',
    explanation_en: 'An AI system capable of autonomously using tools, accessing data and executing tasks. It combines a language model with access to APIs, files and databases.',
    example: 'User: "Find cheap flights to Rome"\nAgent:\n  → Search flight API\n  → Compare prices\n  → Book cheapest option\n  → Send confirmation' },
  { id: 'capacitor', term: 'Capacitor', category: 'pojem', short: 'Web to Native App',
    explanation_sk: 'Framework na premenu webových aplikácií na natívne mobilné aplikácie pre iOS a Android. Umožňuje jednu kódovú základňu pre web aj mobil s prístupom k natívnym funkciám telefónu ako kamera, notifikácie a senzory.',
    explanation_en: 'A framework for turning web applications into native mobile apps for iOS and Android. It enables a single codebase for both web and mobile with access to native phone features like camera, notifications and sensors.',
    example: 'npx cap add ios\nnpx cap sync\nnpx cap open ios\n→ Your web app runs as a native iOS app' },
  { id: 'java', term: 'Java', category: 'pojem', short: 'Enterprise Programming Language',
    explanation_sk: 'Jeden z najrozšírenejších programovacích jazykov na svete. Beží na Java Virtual Machine, čo znamená, že rovnaký kód funguje na akomkoľvek zariadení. Používa sa v bankových systémoch, podnikových aplikáciách a Android vývoji.',
    explanation_en: 'One of the most widely used programming languages in the world. It runs on the Java Virtual Machine, meaning the same code works on any device. Used in banking systems, enterprise applications and Android development.',
    example: 'public class Hello {\n  public static void main(String[] args) {\n    System.out.println("Hello!");\n  }\n}' },
  { id: 'csharp', term: 'C#', category: 'pojem', short: 'Microsoft Programming Language',
    explanation_sk: 'Moderný objektovo orientovaný jazyk od Microsoftu. Hlavný jazyk pre vývoj hier v Unity, Windows aplikácií a podnikových systémov. Kombinuje výkon C++ s jednoduchosťou podobnou Jave.',
    explanation_en: 'A modern object-oriented language by Microsoft. The primary language for game development in Unity, Windows applications and enterprise systems. Combines the power of C++ with simplicity similar to Java.',
    example: 'Console.WriteLine("Hello!");\nvar names = new List<string>\n  { "Anna", "Bob" };\nnames.ForEach(n =>\n  Console.WriteLine(n));' },
  { id: 'cpp', term: 'C++', category: 'pojem', short: 'High-Performance Language',
    explanation_sk: 'Výkonný programovací jazyk používaný tam, kde záleží na rýchlosti. Videohry, herné enginy, operačné systémy a robotika. Poskytuje priamu kontrolu nad pamäťou, čo ho robí rýchlym ale náročnejším na naučenie.',
    explanation_en: 'A powerful programming language used where speed matters. Video games, game engines, operating systems and robotics. It provides direct memory control, making it fast but harder to learn.',
    example: '#include <iostream>\nint main() {\n  std::cout << "Hello!" << std::endl;\n  return 0;\n}' },
  { id: 'swift', term: 'Swift', category: 'pojem', short: 'Apple Programming Language',
    explanation_sk: 'Programovací jazyk od Apple na vývoj aplikácií pre iPhone, iPad, Apple Watch a Mac. Moderný, bezpečný a rýchly. Nahradil starší jazyk Objective-C a je navrhnutý tak, aby bol ľahko čitateľný.',
    explanation_en: 'Apple\'s programming language for building iPhone, iPad, Apple Watch and Mac apps. Modern, safe and fast. It replaced the older Objective-C and is designed to be easy to read.',
    example: 'let name = "World"\nprint("Hello, \\(name)!")\n\nlet numbers = [1, 2, 3]\nnumbers.forEach { print($0) }' },
  { id: 'kotlin', term: 'Kotlin', category: 'pojem', short: 'Android Programming Language',
    explanation_sk: 'Moderný programovací jazyk preferovaný Google pre vývoj Android aplikácií. Je stručnejší a bezpečnejší ako Java, s ktorou je plne kompatibilný. Podporuje funkcionálne aj objektové programovanie.',
    explanation_en: 'A modern programming language preferred by Google for Android app development. It is more concise and safer than Java, while being fully compatible with it. Supports both functional and object-oriented programming.',
    example: 'fun greet(name: String) {\n  println("Hello, $name!")\n}\ngreet("Android")' },
  { id: 'rust', term: 'Rust', category: 'pojem', short: 'Safe Systems Language',
    explanation_sk: 'Moderný systémový jazyk zameraný na bezpečnosť pamäte a vysoký výkon. Zabraňuje chybám ako memory leaks a race conditions už pri kompilácii. Používa sa v prehliadačoch, operačných systémoch a cloudových službách.',
    explanation_en: 'A modern systems language focused on memory safety and high performance. It prevents bugs like memory leaks and race conditions at compile time. Used in browsers, operating systems and cloud services.',
    example: 'fn main() {\n  let name = String::from("Rust");\n  println!("Hello, {}!", name);\n}' },
  { id: 'go', term: 'Go', category: 'pojem', short: 'Cloud Programming Language',
    explanation_sk: 'Programovací jazyk od Google navrhnutý pre jednoduchosť a škálovateľnosť. Exceluje v budovaní webových serverov, cloudových služieb a nástrojov príkazového riadku. Kompiluje sa do jedného binárneho súboru.',
    explanation_en: 'A programming language by Google designed for simplicity and scalability. It excels at building web servers, cloud services and command-line tools. Compiles to a single binary file.',
    example: 'package main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, Go!")\n}' },
  { id: 'ruby', term: 'Ruby', category: 'pojem', short: 'Developer-Friendly Language',
    explanation_sk: 'Elegantný programovací jazyk zameraný na produktivitu vývojárov. Známy vďaka frameworku Ruby on Rails, ktorý umožňuje rýchlo vytvárať webové aplikácie. Filozofia: programovanie by malo byť radosť.',
    explanation_en: 'An elegant programming language focused on developer productivity. Known for the Ruby on Rails framework, which enables rapid web application development. Philosophy: programming should be a joy.',
    example: '3.times do\n  puts "Hello!"\nend\n\nnames = ["Anna", "Bob"]\nnames.each { |n| puts n }' },
  { id: 'php', term: 'PHP', category: 'pojem', short: 'Web Server Language',
    explanation_sk: 'Serverový jazyk, ktorý poháňa veľkú časť webu. WordPress, Facebook a Wikipedia boli postavené na PHP. Jednoduchý na naučenie a ideálny na dynamické webové stránky a e-shopy.',
    explanation_en: 'A server-side language that powers a large portion of the web. WordPress, Facebook and Wikipedia were built on PHP. Easy to learn and ideal for dynamic websites and e-commerce stores.',
    example: '<?php\n$name = "World";\necho "Hello, $name!";\n\n$numbers = [1, 2, 3];\nforeach ($numbers as $n) {\n  echo $n;\n}\n?>' },
  { id: 'dart', term: 'Dart', category: 'pojem', short: 'Flutter Language',
    explanation_sk: 'Programovací jazyk od Google, hlavný jazyk pre framework Flutter. Umožňuje z jedného kódu vytvoriť aplikácie pre iOS, Android, web aj desktop. Rýchly, moderný a optimalizovaný pre tvorbu používateľských rozhraní.',
    explanation_en: 'A programming language by Google, the primary language for the Flutter framework. It enables creating iOS, Android, web and desktop apps from a single codebase. Fast, modern and optimized for building user interfaces.',
    example: 'void main() {\n  var name = "Flutter";\n  print("Hello, $name!");\n}' },
  { id: 'scala', term: 'Scala', category: 'pojem', short: 'JVM Functional Language',
    explanation_sk: 'Programovací jazyk kombinujúci objektové a funkcionálne programovanie na Java Virtual Machine. Používa sa na spracovanie veľkých dát v Apache Spark. Populárny v technologických firmách ako Twitter a LinkedIn.',
    explanation_en: 'A programming language combining object-oriented and functional programming on the Java Virtual Machine. Used for big data processing in Apache Spark. Popular at tech companies like Twitter and LinkedIn.',
    example: 'val names = List("Anna", "Bob")\nnames.foreach(println)\n\nval doubled = List(1,2,3).map(_ * 2)' },
  { id: 'flutter', term: 'Flutter', category: 'pojem', short: 'Cross-Platform UI Framework',
    explanation_sk: 'Framework od Google na tvorbu krásnych natívnych aplikácií pre mobil, web a desktop z jedného kódu. Používa jazyk Dart a vlastný renderovací engine pre konzistentný vzhľad na všetkých platformách.',
    explanation_en: 'A framework by Google for building beautiful native apps for mobile, web and desktop from a single codebase. Uses the Dart language and its own rendering engine for consistent appearance across all platforms.',
    example: 'MaterialApp(\n  home: Scaffold(\n    body: Center(\n      child: Text("Hello Flutter!"),\n    ),\n  ),\n)' },
  { id: 'reactnative', term: 'React Native', category: 'pojem', short: 'Mobile App Framework',
    explanation_sk: 'Framework od Meta (Facebook) na tvorbu natívnych mobilných aplikácií pomocou JavaScriptu a Reactu. Jeden kód pre iOS aj Android. Používajú ho aplikácie ako Instagram, Discord a Shopify.',
    explanation_en: 'A framework by Meta (Facebook) for building native mobile apps using JavaScript and React. One codebase for both iOS and Android. Used by apps like Instagram, Discord and Shopify.',
    example: 'export default function App() {\n  return (\n    <View>\n      <Text>Hello React Native!</Text>\n    </View>\n  );\n}' },
  { id: 'gradle', term: 'Gradle', category: 'pojem', short: 'Build Automation Tool',
    explanation_sk: 'Automatizačný nástroj na zostavovanie aplikácií, najmä pre Android a Java projekty. Riadi kompiláciu kódu, sťahovanie knižníc, testovanie a vytváranie finálnych súborov na distribúciu. Používa konfiguračné súbory na definovanie závislostí a krokov zostavenia.',
    explanation_en: 'A build automation tool for compiling applications, especially for Android and Java projects. It manages code compilation, downloading libraries, testing and creating final distribution files. It uses configuration files to define dependencies and build steps.',
    example: 'dependencies {\n  implementation "com.google.firebase:firebase-messaging"\n  implementation "androidx.core:core-ktx:1.12.0"\n}' },
  { id: 'firebase', term: 'Firebase', category: 'pojem', short: 'Google App Platform',
    explanation_sk: 'Platforma od Google na vývoj mobilných a webových aplikácií. Poskytuje databázu v reálnom čase, autentifikáciu používateľov, push notifikácie, analytiku, hosting a mnoho ďalších služieb bez potreby vlastného servera.',
    explanation_en: 'A platform by Google for developing mobile and web applications. It provides a real-time database, user authentication, push notifications, analytics, hosting and many other services without needing your own server.',
    example: 'Firebase.initializeApp()\nFirebaseMessaging.getInstance()\n  .token.addOnCompleteListener { task ->\n    val token = task.result\n  }' },
  { id: 'xcode', term: 'Xcode', category: 'pojem', short: 'Apple Development IDE',
    explanation_sk: 'Vývojové prostredie od Apple na vytváranie aplikácií pre iPhone, iPad, Mac a Apple Watch. Obsahuje editor kódu, debugger, simulátor zariadení a nástroje na publikovanie do App Store.',
    explanation_en: 'Apple development environment for creating iPhone, iPad, Mac and Apple Watch apps. It includes a code editor, debugger, device simulator and tools for publishing to the App Store.',
    example: 'Product → Archive\nDistribute App → App Store Connect\nUpload' },
  { id: 'androidstudio', term: 'Android Studio', category: 'pojem', short: 'Android Development IDE',
    explanation_sk: 'Oficiálne vývojové prostredie od Google na vytváranie Android aplikácií. Obsahuje editor kódu, emulátor zariadení, debugger a nástroje na publikovanie do Google Play Store.',
    explanation_en: 'The official development environment by Google for creating Android applications. It includes a code editor, device emulator, debugger and tools for publishing to the Google Play Store.',
    example: 'Build → Generate Signed APK\nUpload to Google Play Console' },
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
  // Beginner
  html: 'beginner', css: 'beginner', ram: 'beginner', cpu: 'beginner', ssd: 'beginner',
  http: 'beginner', git: 'beginner', npm: 'beginner', cli: 'beginner', gui: 'beginner', ide: 'beginner',
  python: 'beginner', component: 'beginner', props: 'beginner', state: 'beginner', hook: 'beginner',
  cache: 'beginner', deploy: 'beginner', prompt: 'beginner', token: 'beginner',
  // Advanced
  api: 'advanced', json: 'advanced', sql: 'advanced', crud: 'advanced', dns: 'advanced',
  ssh: 'advanced', dom: 'advanced', cdn: 'advanced', vpn: 'advanced', cicd: 'advanced',
  react: 'advanced', nextjs: 'advanced', typescript: 'advanced', nodejs: 'advanced',
  tailwind: 'advanced', vue: 'advanced', zustand: 'advanced', docker: 'advanced',
  supabase: 'advanced', postgresql: 'advanced', vercel: 'advanced', middleware: 'advanced',
  webhook: 'advanced', framermotion: 'advanced', githubactions: 'advanced',
  // Languages
  java: 'beginner', cpp: 'beginner', swift: 'beginner', kotlin: 'beginner',
  csharp: 'beginner', rust: 'advanced', go: 'advanced', ruby: 'advanced',
  php: 'beginner', dart: 'advanced', scala: 'professional',
  // Frameworks
  capacitor: 'advanced', flutter: 'advanced', reactnative: 'advanced',
  gradle: 'advanced', firebase: 'advanced', xcode: 'advanced', androidstudio: 'advanced',
  // Professional
  jwt: 'professional', oauth: 'professional', tcp: 'professional',
  llm: 'professional', rag: 'professional', mcp: 'professional', gpt: 'professional',
  prisma: 'professional', redis: 'professional', graphql: 'professional',
  stripe: 'professional', openai: 'professional', aws: 'professional', langchain: 'professional',
  remotion: 'professional', embedding: 'professional', agent: 'professional',
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

  const prompt = `You are explaining a programming term to someone who is learning to code. Smart but simple — no dumbing down, no weird forced analogies.

Term: ${entry.term} (${entry.short})
Technical explanation: ${entry.explanation_en}

Write TWO explanations:

1. "en" — English. Explain what it DOES in practice, not what it IS. Use a real-world comparison ONLY if it naturally fits and is accurate. If no good analogy exists, just explain it simply without one. 2-3 sentences. Max 300 chars.

2. "sk" — Slovak (NEVER Czech). Same content. Natural Slovak — "v podstate", "funguje to tak, že", "jednoducho povedané". Max 300 chars.

RULES:
- NO forced/weird analogies (no waiters, no keys, no tunnels, no restaurants)
- NO childish language ("kamoš", "super vec")
- Focus on: what problem does it solve? why do developers use it?
- Be specific — mention real use cases (websites, apps, servers)
- If you use an analogy it MUST be 1:1 accurate to how the technology actually works

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
