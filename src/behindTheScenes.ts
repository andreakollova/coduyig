/**
 * Behind the Scenes — "What happens when..." 20-30s explainer videos
 * Byte surfs and explains technology behind everyday actions.
 */

export interface BTSEntry {
  id: string;
  titleEn: string;
  titleSk: string;
  scriptEn: string;  // ~50-70 words, 20-30s spoken
  scriptSk: string;
}

export const btsEntries: BTSEntry[] = [
  {
    id: 'google-com',
    titleEn: 'What happens when you type google.com?',
    titleSk: 'Čo sa stane keď napíšeš google.com?',
    scriptEn: 'Your browser asks DNS to translate google.com into an IP address. Then it opens a TCP connection and encrypts it with TLS. It sends an HTTP request to Google\'s server. The server responds with HTML, CSS and JavaScript. Your browser renders it all into the page you see. All of this happens in under 200 milliseconds.',
    scriptSk: 'Tvoj prehliadač sa opýta DNS na IP adresu pre google.com. Potom otvorí TCP spojenie a zašifruje ho cez TLS. Pošle HTTP požiadavku na server Googlu. Server odpovie HTML, CSS a JavaScriptom. Prehliadač to všetko vykreslí do stránky, ktorú vidíš. Celé sa to udeje za menej ako 200 milisekúnd.',
  },
  {
    id: 'sign-in-google',
    titleEn: 'What happens when you click "Sign in with Google"?',
    titleSk: 'Čo sa stane keď klikneš "Prihlásiť sa cez Google"?',
    scriptEn: 'The app redirects you to Google\'s login page. You enter your password there, not in the app. Google creates a special token and sends you back to the app with it. The app uses this token to verify who you are. Your password never touches the app. That\'s OAuth.',
    scriptSk: 'Aplikácia ťa presmeruje na prihlasovaciu stránku Googlu. Heslo zadávaš tam, nie v appke. Google vytvorí špeciálny token a pošle ťa späť do appky s ním. Appka pomocou tohto tokenu overí kto si. Tvoje heslo sa nikdy nedostane do appky. Toto je OAuth.',
  },
  {
    id: 'not-a-robot',
    titleEn: 'What happens when you click "I\'m not a robot"?',
    titleSk: 'Čo sa stane keď klikneš "Nie som robot"?',
    scriptEn: 'Google analyzes how you moved your mouse, how fast you clicked, and your browsing history. A real person moves the mouse in curves, a bot in straight lines. If Google is confident you\'re human, you pass. If not, you get an image puzzle. All decided by a risk score in milliseconds.',
    scriptSk: 'Google analyzuje ako si pohyboval myšou, ako rýchlo si klikol a tvoju históriu prehliadania. Človek hýbe myšou v krivkách, robot v rovných čiarach. Ak je Google presvedčený že si človek, prejdeš. Ak nie, dostaneš obrázkové puzzle. Všetko rozhodne skóre rizika za milisekundy.',
  },
  {
    id: 'credit-card-tap',
    titleEn: 'What happens when you tap your credit card?',
    titleSk: 'Čo sa stane keď priložíš kartu?',
    scriptEn: 'Your card communicates with the terminal via NFC radio waves. It doesn\'t send your real card number. Instead, it creates a one-time token. The terminal sends this token to the bank. The bank checks your balance and approves the payment. The real card number never leaves your card.',
    scriptSk: 'Tvoja karta komunikuje s terminálom cez NFC rádiové vlny. Neposiela tvoje skutočné číslo karty. Namiesto toho vytvorí jednorazový token. Terminál pošle tento token do banky. Banka skontroluje zostatok a schváli platbu. Skutočné číslo karty nikdy neopustí tvoju kartu.',
  },
  {
    id: 'face-id',
    titleEn: 'What happens when Face ID recognizes you?',
    titleSk: 'Čo sa stane keď ťa Face ID rozpozná?',
    scriptEn: 'Your phone projects 30,000 invisible infrared dots onto your face. It creates a 3D depth map. This map is compared with the one stored in the Secure Enclave, a special chip that nobody can access. Not even Apple. The comparison happens locally on your phone. Your face data never goes to any server.',
    scriptSk: 'Telefón premietne 30 000 neviditeľných infračervených bodov na tvoju tvár. Vytvorí 3D hĺbkovú mapu. Táto mapa sa porovná s tou uloženou v Secure Enclave, špeciálnom čipe ku ktorému nikto nemá prístup. Ani Apple. Porovnanie prebieha lokálne na tvojom telefóne. Dáta o tvojej tvári sa nikdy nedostanú na server.',
  },
  {
    id: 'qr-code',
    titleEn: 'What happens when you scan a QR code?',
    titleSk: 'Čo sa stane keď naskenuješ QR kód?',
    scriptEn: 'Your camera captures the image. Software finds the three corner squares to determine the orientation. Then it reads the black and white pattern as binary data. This binary data is decoded into text, usually a URL. Your phone then opens that URL in the browser. The entire process takes about 100 milliseconds.',
    scriptSk: 'Kamera zachytí obrázok. Softvér nájde tri rohové štvorce aby určil orientáciu. Potom prečíta čierny a biely vzor ako binárne dáta. Tieto dáta sa dekódujú na text, zvyčajne URL adresu. Telefón potom otvorí túto adresu v prehliadači. Celý proces trvá asi 100 milisekúnd.',
  },
  {
    id: 'whatsapp-message',
    titleEn: 'What happens when you send a WhatsApp message?',
    titleSk: 'Čo sa stane keď pošleš správu cez WhatsApp?',
    scriptEn: 'Your phone encrypts the message with a unique key that only the recipient has. Even WhatsApp can\'t read it. The encrypted message travels to WhatsApp\'s server, which stores it until the other phone is online. Once delivered, the server deletes it. That\'s end-to-end encryption.',
    scriptSk: 'Tvoj telefón zašifruje správu unikátnym kľúčom, ktorý má iba príjemca. Ani WhatsApp ju nevie prečítať. Šifrovaná správa putuje na server WhatsAppu, ktorý ju uloží kým druhý telefón nepríde online. Po doručení ju server vymaže. Toto je end-to-end šifrovanie.',
  },
  {
    id: 'chatgpt-prompt',
    titleEn: 'What happens when you send a prompt to ChatGPT?',
    titleSk: 'Čo sa stane keď pošleš prompt do ChatGPT?',
    scriptEn: 'Your text is split into tokens. These tokens pass through a neural network with billions of parameters. The model predicts the most likely next token, one at a time. Each prediction takes into account all previous tokens. The result streams back to you word by word. One response can require billions of calculations.',
    scriptSk: 'Tvoj text sa rozdelí na tokeny. Tieto tokeny prejdú cez neurónovú sieť s miliardami parametrov. Model predpovedá najpravdepodobnejší ďalší token, jeden po druhom. Každá predpoveď zohľadňuje všetky predchádzajúce tokeny. Výsledok sa streamuje späť k tebe slovo po slove. Jedna odpoveď môže vyžadovať miliardy výpočtov.',
  },
  {
    id: 'install-app',
    titleEn: 'What happens when you install an app?',
    titleSk: 'Čo sa stane keď si nainštaluješ aplikáciu?',
    scriptEn: 'Your phone downloads a compressed package from Apple or Google\'s servers. It verifies the developer\'s digital signature to make sure nobody tampered with it. Then it unpacks the files, sets up the sandbox, and asks you for permissions. The app can only access what you explicitly allow.',
    scriptSk: 'Telefón stiahne komprimovaný balík zo serverov Apple alebo Googlu. Overí digitálny podpis vývojára aby sa uistil že nikto s ním nemanipuloval. Potom rozbalí súbory, nastaví sandbox a požiada ťa o povolenia. Aplikácia má prístup iba k tomu čo explicitne povolíš.',
  },
  {
    id: 'wifi-connect',
    titleEn: 'What happens when you connect to Wi-Fi?',
    titleSk: 'Čo sa stane keď sa pripojíš na Wi-Fi?',
    scriptEn: 'Your phone scans for nearby access points. When you select one, it authenticates using the password. Then DHCP assigns your device a unique IP address on the network. Now your phone can communicate with the router, and through it, with the entire internet. All in about 2 seconds.',
    scriptSk: 'Telefón vyhľadá blízke prístupové body. Keď si vybereš, overí sa pomocou hesla. Potom DHCP pridelí tvojmu zariadeniu unikátnu IP adresu v sieti. Teraz tvoj telefón komunikuje s routerom a cez neho s celým internetom. Všetko za asi 2 sekundy.',
  },
  {
    id: 'usb-drive',
    titleEn: 'What happens when you plug in a USB drive?',
    titleSk: 'Čo sa stane keď zapojíš USB kľúč?',
    scriptEn: 'The operating system detects a new device on the USB bus. It loads the correct driver. Then it reads the file system on the drive, whether it\'s FAT32, NTFS or exFAT. Finally it mounts the drive so you can see your files. If the file system is corrupted, that\'s when you see the "repair" dialog.',
    scriptSk: 'Operačný systém detekuje nové zariadenie na USB zbernici. Načíta správny ovládač. Potom prečíta súborový systém na disku, či už je to FAT32, NTFS alebo exFAT. Nakoniec pripojí disk aby si mohol vidieť súbory. Ak je súborový systém poškodený, vtedy sa zobrazí dialóg na opravu.',
  },
  {
    id: 'press-save',
    titleEn: 'What happens when you press "Save"?',
    titleSk: 'Čo sa stane keď stlačíš "Uložiť"?',
    scriptEn: 'Your data moves from RAM to the SSD. The file system finds free space on the disk. It writes the data there and updates the file table with the new location. On an SSD this takes microseconds because there are no moving parts. If power fails during write, journaling protects your data.',
    scriptSk: 'Dáta sa presunú z RAM na SSD. Súborový systém nájde voľné miesto na disku. Zapíše tam dáta a aktualizuje tabuľku súborov s novou pozíciou. Na SSD to trvá mikrosekundy pretože nemá pohyblivé časti. Ak vypadne elektrina počas zápisu, žurnálovanie ochráni tvoje dáta.',
  },
  {
    id: 'download-click',
    titleEn: 'What happens when you click "Download"?',
    titleSk: 'Čo sa stane keď klikneš "Stiahnuť"?',
    scriptEn: 'Your browser sends an HTTP request for the file. The server splits the file into small packets. These packets travel through multiple routers across the internet. Your computer reassembles them in the correct order using TCP. If any packet gets lost, TCP requests it again. The file appears in your downloads folder.',
    scriptSk: 'Prehliadač pošle HTTP požiadavku na súbor. Server rozdelí súbor na malé pakety. Tieto pakety putujú cez viaceré routery naprieč internetom. Tvoj počítač ich poskladá v správnom poradí pomocou TCP. Ak sa nejaký paket stratí, TCP ho vyžiada znova. Súbor sa objaví v priečinku stiahnuté.',
  },
  {
    id: 'pay-now',
    titleEn: 'What happens when you click "Pay Now"?',
    titleSk: 'Čo sa stane keď klikneš "Zaplatiť"?',
    scriptEn: 'Your payment details go to a payment gateway like Stripe. Stripe sends them to your bank for authorization. The bank checks your balance, fraud score, and limits. If approved, the money is reserved. The merchant gets a confirmation. The actual money transfer happens later through the banking system.',
    scriptSk: 'Tvoje platobné údaje idú do platobnej brány ako Stripe. Stripe ich pošle tvojej banke na autorizáciu. Banka skontroluje zostatok, skóre podvodov a limity. Ak schváli, peniaze sa zablokujú. Obchodník dostane potvrdenie. Skutočný prevod peňazí prebehne neskôr cez bankový systém.',
  },
  {
    id: 'git-push',
    titleEn: 'What happens when you push code to GitHub?',
    titleSk: 'Čo sa stane keď pushneš kód na GitHub?',
    scriptEn: 'Git compresses your changes into objects. It calculates a hash for each one to ensure integrity. Then it sends only the new objects to GitHub\'s server over an encrypted connection. GitHub stores them and updates the branch pointer. Your collaborators can now pull your changes.',
    scriptSk: 'Git skomprimuje tvoje zmeny do objektov. Pre každý vypočíta hash aby zabezpečil integritu. Potom pošle iba nové objekty na server GitHubu cez šifrované spojenie. GitHub ich uloží a aktualizuje ukazovateľ vetvy. Tvoji spolupracovníci si teraz môžu stiahnuť tvoje zmeny.',
  },
  {
    id: 'youtube-video',
    titleEn: 'What happens when you open a YouTube video?',
    titleSk: 'Čo sa stane keď otvoríš YouTube video?',
    scriptEn: 'YouTube picks the nearest CDN server to you. It starts streaming the video in small chunks using adaptive bitrate. If your connection slows down, it automatically switches to lower quality. The video buffers ahead so you don\'t notice. All while tracking your watch time for recommendations.',
    scriptSk: 'YouTube vyberie najbližší CDN server k tebe. Začne streamovať video v malých kúskoch pomocou adaptívneho bitrate. Ak sa tvoje pripojenie spomalí, automaticky prepne na nižšiu kvalitu. Video sa načítava dopredu aby si to nezbadal. A pritom sleduje tvoj čas pozerania pre odporúčania.',
  },
  {
    id: 'push-notification',
    titleEn: 'What happens when your phone receives a notification?',
    titleSk: 'Čo sa stane keď telefón dostane notifikáciu?',
    scriptEn: 'The app\'s server sends a message to Apple\'s or Google\'s push service. This service maintains a persistent connection to your phone. It delivers the notification even when the app is closed. Your phone wakes up, shows the notification, and optionally plays a sound. One server, billions of phones.',
    scriptSk: 'Server aplikácie pošle správu do push služby Apple alebo Googlu. Táto služba udržiava trvalé spojenie s tvojím telefónom. Doručí notifikáciu aj keď je appka zavretá. Telefón sa zobudí, zobrazí notifikáciu a voliteľne prehrá zvuk. Jeden server, miliardy telefónov.',
  },
  {
    id: 'phone-location',
    titleEn: 'What happens when your phone knows your location?',
    titleSk: 'Čo sa stane keď telefón vie tvoju polohu?',
    scriptEn: 'Your phone listens to signals from at least 4 GPS satellites. Using the time each signal takes to arrive, it calculates your position. Indoors, it uses Wi-Fi access points and cell towers instead. Modern phones combine all three for accuracy within 3 meters.',
    scriptSk: 'Tvoj telefón počúva signály z minimálne 4 GPS satelitov. Podľa času, ktorý každý signál potrebuje na príchod, vypočíta tvoju pozíciu. V interiéri namiesto toho použije Wi-Fi prístupové body a mobilné vysielače. Moderné telefóny kombinujú všetky tri pre presnosť do 3 metrov.',
  },
  {
    id: 'ai-image',
    titleEn: 'What happens when you ask AI to generate an image?',
    titleSk: 'Čo sa stane keď požiadaš AI o vygenerovanie obrázka?',
    scriptEn: 'Your prompt is converted into a mathematical embedding. The AI starts with random noise and gradually removes it, guided by your prompt. Each step makes the image clearer. After about 50 steps, the noise becomes a coherent image matching your description. This process is called diffusion.',
    scriptSk: 'Tvoj prompt sa prevedie na matematický embedding. AI začne s náhodným šumom a postupne ho odstraňuje, riadená tvojím promptom. Každý krok robí obrázok jasnejším. Po asi 50 krokoch sa šum zmení na koherentný obrázok zodpovedajúci tvojmu popisu. Tento proces sa volá difúzia.',
  },
  {
    id: 'forgot-password',
    titleEn: 'What happens when you click "Forgot Password"?',
    titleSk: 'Čo sa stane keď klikneš "Zabudnuté heslo"?',
    scriptEn: 'The server generates a unique token with an expiration time. It sends this token to your email as a link. When you click the link, the server verifies the token hasn\'t expired. Then it lets you set a new password. The old password hash is replaced. The token becomes invalid immediately.',
    scriptSk: 'Server vygeneruje unikátny token s časom expirácie. Pošle tento token na tvoj email ako odkaz. Keď klikneš na odkaz, server overí že token nevypršal. Potom ti umožní nastaviť nové heslo. Starý hash hesla sa nahradí. Token sa okamžite stane neplatným.',
  },
];
