// Salon 323 — static data & helpers, transcribed 1:1 from the design prototype
// (design_handoff_salon323/design/source). Server state (Supabase) comes later;
// this is the demo content the interactive prototype runs on.

export const EZ = "cubic-bezier(.22,1,.36,1)";
export const EZ_SCENE = "cubic-bezier(.65,0,.35,1)";
export const NOWMIN = 13 * 60 + 42; // 13:42, the prototype's "now"

export type ServiceKey = "haare" | "bart" | "brauen" | "waschen";

export const svc: { k: ServiceKey; name: string; sub: string }[] = [
  { k: "haare", name: "Haare", sub: "Schnitt nach Wahl" },
  { k: "bart", name: "Bart", sub: "Kontur & Pflege" },
  { k: "brauen", name: "Augenbrauen", sub: "In Form" },
  { k: "waschen", name: "Waschen", sub: "Vor oder nach" },
];

export const cuts = ["Burst", "Mid", "Low", "Skin", "Taper", "Buzz", "Schere"];

export const tiers = [
  { r: "I", n: "Guest", min: 0 },
  { r: "II", n: "Member", min: 10 },
  { r: "III", n: "Patron", min: 25 },
  { r: "IV", n: "Inner Circle", min: 50 },
];

export const wdS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const wdL = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
export const mon = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
export const monS = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

// A pool of short, broadly resonant verses — hope, strength, rest, courage,
// new beginnings. Picked to land even for someone who isn't religious; one is
// shown at random on each welcome (see goWelcome / store mount).
export const verses = [
  {
    t: "Die auf den Herrn harren, kriegen neue Kraft, dass sie auffahren mit Flügeln wie Adler.",
    r: "Jesaja 40,31",
  },
  { t: "Der Herr ist mein Hirte, mir wird nichts mangeln.", r: "Psalm 23,1" },
  {
    t: "Seine Barmherzigkeit hat noch kein Ende, sondern sie ist alle Morgen neu.",
    r: "Klagelieder 3,22–23",
  },
  {
    t: "Der Herr, dein Gott, ist bei dir; er wird sich über dich freuen mit Wonne.",
    r: "Zefanja 3,17",
  },
  {
    t: "Kommt her zu mir alle, die ihr mühselig und beladen seid; ich will euch erquicken.",
    r: "Matthäus 11,28",
  },
  {
    t: "Den Frieden lasse ich euch, meinen Frieden gebe ich euch.",
    r: "Johannes 14,27",
  },
  {
    t: "Ich danke dir dafür, dass ich wunderbar gemacht bin.",
    r: "Psalm 139,14",
  },
  {
    t: "Sei getrost und unverzagt; lass dir nicht grauen und entsetze dich nicht.",
    r: "Josua 1,9",
  },
  {
    t: "Fürchte dich nicht, denn ich bin bei dir; weiche nicht, denn ich bin dein Gott.",
    r: "Jesaja 41,10",
  },
  {
    t: "Alles hat seine Zeit, und jedes Vorhaben unter dem Himmel hat seine Stunde.",
    r: "Prediger 3,1",
  },
  {
    t: "Wirf dein Anliegen auf den Herrn, der wird dich versorgen.",
    r: "Psalm 55,23",
  },
  {
    t: "Der Herr ist mein Licht und mein Heil; vor wem sollte ich mich fürchten?",
    r: "Psalm 27,1",
  },
  {
    t: "Gott ist unsere Zuversicht und Stärke, eine Hilfe in den Nöten.",
    r: "Psalm 46,2",
  },
  {
    t: "Befiehl dem Herrn deine Wege und hoffe auf ihn, er wird's wohl machen.",
    r: "Psalm 37,5",
  },
  {
    t: "Alle eure Sorge werft auf ihn; denn er sorgt für euch.",
    r: "1. Petrus 5,7",
  },
  {
    t: "Dein Wort ist meines Fusses Leuchte und ein Licht auf meinem Weg.",
    r: "Psalm 119,105",
  },
  {
    t: "Siehe, ich mache alles neu.",
    r: "Offenbarung 21,5",
  },
  {
    t: "Der Herr wird für euch streiten, und ihr werdet stille sein.",
    r: "2. Mose 14,14",
  },
  {
    t: "Ich vermag alles durch den, der mich mächtig macht.",
    r: "Philipper 4,13",
  },
  {
    t: "Seid fröhlich in Hoffnung, geduldig in Trübsal, beharrlich im Gebet.",
    r: "Römer 12,12",
  },
  {
    t: "Der Herr ist nahe denen, die zerbrochenen Herzens sind.",
    r: "Psalm 34,19",
  },
  {
    t: "Vertraue auf den Herrn von ganzem Herzen und verlass dich nicht auf deinen Verstand.",
    r: "Sprüche 3,5",
  },
  {
    t: "Diese Dinge habe ich zu euch geredet, damit ihr in mir Frieden habt.",
    r: "Johannes 16,33",
  },
  {
    t: "Der Herr ist gut, eine Feste am Tag der Not, und kennt die, die auf ihn trauen.",
    r: "Nahum 1,7",
  },
  {
    t: "Das Volk, das im Finstern wandelt, sieht ein grosses Licht.",
    r: "Jesaja 9,1",
  },
  {
    t: "Harre des Herrn! Sei getrost und unverzagt, und harre des Herrn!",
    r: "Psalm 27,14",
  },
  {
    t: "Den Mühseligen gibt er Kraft und Stärke genug den Unvermögenden.",
    r: "Jesaja 40,29",
  },
  {
    t: "Du stellst meine Füsse auf weiten Raum.",
    r: "Psalm 31,9",
  },
  {
    t: "Ein fröhliches Herz tut dem Leibe wohl.",
    r: "Sprüche 17,22",
  },
  {
    t: "Freut euch im Herrn allewege, und abermals sage ich: Freut euch!",
    r: "Philipper 4,4",
  },
  {
    t: "Der Herr segne dich und behüte dich; der Herr lasse sein Angesicht leuchten über dir.",
    r: "4. Mose 6,24–25",
  },
  {
    t: "Du bist mein Gott, und meine Zeit steht in deinen Händen.",
    r: "Psalm 31,15–16",
  },
  {
    t: "Wer unter dem Schirm des Höchsten sitzt, der bleibt unter dem Schatten des Allmächtigen.",
    r: "Psalm 91,1",
  },
  {
    t: "So spricht der Herr: Ich habe dich bei deinem Namen gerufen; du bist mein.",
    r: "Jesaja 43,1",
  },
  {
    t: "Dein Reden erfreut und tröstet meine Seele.",
    r: "Psalm 94,19",
  },
  {
    t: "Weinen währt einen Abend lang, aber am Morgen ist Freude.",
    r: "Psalm 30,6",
  },
  {
    t: "Der Herr ist dein Schatten über deiner rechten Hand.",
    r: "Psalm 121,5",
  },
  {
    t: "Ich hebe meine Augen auf zu den Bergen: Woher kommt mir Hilfe?",
    r: "Psalm 121,1",
  },
  {
    t: "Schmecket und sehet, wie freundlich der Herr ist.",
    r: "Psalm 34,9",
  },
  {
    t: "Er heilt, die zerbrochenen Herzens sind, und verbindet ihre Wunden.",
    r: "Psalm 147,3",
  },
  {
    t: "Lass dich nicht vom Bösen überwinden, sondern überwinde das Böse mit Gutem.",
    r: "Römer 12,21",
  },
  {
    t: "Besser ein Wenig mit Ruhe als beide Hände voll mit Mühe.",
    r: "Prediger 4,6",
  },
  {
    t: "Die Liebe ist langmütig und freundlich, sie erträgt alles, sie hofft alles.",
    r: "1. Korinther 13,4.7",
  },
  {
    t: "Er gibt dem Müden Kraft und Stärke dem, der keine Kraft hat.",
    r: "Jesaja 40,29",
  },
  {
    t: "Ein jeglicher, wie er's im Herzen sich vornimmt – Gott liebt einen fröhlichen Geber.",
    r: "2. Korinther 9,7",
  },
  {
    t: "Dein Glaube hat dir geholfen; geh hin in Frieden.",
    r: "Lukas 7,50",
  },
  {
    t: "Gras verdorrt, Blumen verwelken – aber das Wort unseres Gottes bleibt ewig.",
    r: "Jesaja 40,8",
  },
  {
    t: "Der Herr behüte deinen Ausgang und Eingang von nun an bis in Ewigkeit.",
    r: "Psalm 121,8",
  },
  {
    t: "Hoffnung, die sich verzieht, ängstet das Herz; aber ein erfüllter Wunsch ist ein Baum des Lebens.",
    r: "Sprüche 13,12",
  },
  {
    t: "Ich will dich unterweisen und dir den Weg zeigen, den du gehen sollst.",
    r: "Psalm 32,8",
  },
  {
    t: "Still zu sein und zu hoffen – das ist gut für den, der auf den Herrn harrt.",
    r: "Klagelieder 3,26",
  },
  {
    t: "Die Frucht des Geistes aber ist Liebe, Freude, Friede, Geduld, Freundlichkeit.",
    r: "Galater 5,22",
  },
];

export const gallery = [
  {
    name: "Low Taper",
    sub: "Textur oben",
    hue: 250,
    specs: [
      ["Technik", "Maschine · Schere"],
      ["Übergang", "0,5 → 9 mm"],
      ["Dauer", "30 min"],
      ["Styling", "Matte Paste"],
    ],
    note: "Seiten weich auslaufen lassen, oben Bewegung statt Linie.",
  },
  {
    name: "Skin Fade",
    sub: "French Crop",
    hue: 205,
    specs: [
      ["Technik", "Foil · Maschine"],
      ["Übergang", "0 → 6 mm"],
      ["Dauer", "30 min"],
      ["Styling", "Clay, wenig"],
    ],
    note: "Fade hoch angesetzt, Pony kurz und gerade.",
  },
  {
    name: "Klassisch",
    sub: "Seitenscheitel",
    hue: 35,
    specs: [
      ["Technik", "Schere über Kamm"],
      ["Übergang", "Weich"],
      ["Dauer", "30 min"],
      ["Styling", "Pomade, leicht"],
    ],
    note: "Scheitel dort, wo er von selbst fällt. Nacken gerade.",
  },
  {
    name: "Buzz Cut",
    sub: "Scharfe Kontur",
    hue: 285,
    specs: [
      ["Technik", "Maschine · Trimmer"],
      ["Länge", "3 mm"],
      ["Dauer", "30 min"],
      ["Styling", "Keins"],
    ],
    note: "Alles auf eine Länge. Die Kontur macht den Unterschied.",
  },
  {
    name: "Mid Fade",
    sub: "Bart 3 mm",
    hue: 160,
    specs: [
      ["Technik", "Maschine · Trimmer"],
      ["Bart", "3 mm, Linie"],
      ["Dauer", "30 min"],
      ["Styling", "Bartöl"],
    ],
    note: "Der Fade läuft nahtlos in den Bart über.",
  },
  {
    name: "Schere",
    sub: "Länge behalten",
    hue: 70,
    specs: [
      ["Technik", "Nur Schere"],
      ["Länge", "−2 cm"],
      ["Dauer", "30 min"],
      ["Styling", "Salzspray"],
    ],
    note: "Gewicht raus, Länge bleibt. Fällt auch ungestylt.",
  },
];

export const milestones = [
  // Years are PLACEHOLDERS - replace with the real ones. The last step is the
  // future goal and reads as "bald" rather than a fixed date.
  {
    year: 2021,
    tag: "Der Anfang",
    title: "Angefangen auf dem WC.",
    text: "Die ersten Schnitte, ganz ohne Setup – nur eine Maschine und der Wille, es richtig zu machen.",
    frm: [0.12, 0.34, 0.7, 0.42],
    fr: [0.28, 0.2, 0.42, 0.62],
  },
  {
    year: 2022,
    tag: "Der erste Platz",
    title: "Ein Stuhl, ein Karton.",
    text: "Der erste selbstgebaute Barberplatz: ein einfacher Stuhl, ein improvisierter Tisch aus Karton.",
    frm: [0.36, 0.4, 0.22, 0.14],
    fr: [0.38, 0.24, 0.18, 0.28],
  },
  {
    year: 2022,
    tag: "Der Funke",
    title: "Die Leidenschaft entdeckt.",
    text: "Gemerkt, wie viel Freude das Haareschneiden wirklich macht – und drangeblieben.",
    frm: [0.5, 0.3, 0.18, 0.12],
    fr: [0.5, 0.3, 0.15, 0.24],
  },
  {
    year: 2023,
    tag: "Der Ausbau",
    title: "Aus Projekt wird Plan.",
    text: "Den Platz ausgebaut und sich damit beschäftigt, wie man das Ganze ernsthaft betreibt.",
    frm: [0.3, 0.5, 0.2, 0.12],
    fr: [0.34, 0.42, 0.16, 0.24],
  },
  {
    year: 2024,
    tag: "Vater & Sohn",
    title: "Richtig umgebaut.",
    text: "Mit dem Vater nochmals verbessert und echte Barberausrüstung angeschafft.",
    frm: [0.56, 0.46, 0.2, 0.12],
    fr: [0.54, 0.42, 0.18, 0.26],
  },
  {
    year: 2025,
    tag: "Der Kreis wächst",
    title: "Immer mehr Kunden.",
    text: "Aus den ersten Schnitten ist ein wachsender Stammkreis entstanden.",
    frm: [0.42, 0.3, 0.24, 0.16],
    fr: [0.44, 0.26, 0.2, 0.3],
  },
  {
    year: 2026,
    tag: "Heute",
    title: "Fast täglich am Stuhl.",
    text: "Maximal ausgelastet, professionelles Equipment, stetige Weiterentwicklung.",
    frm: [0.7, 0.34, 0.26, 0.4],
    fr: [0.72, 0.3, 0.22, 0.54],
  },
  {
    year: "Bald",
    tag: "Bald",
    title: "Der eigene Salon.",
    text: "Das nächste Ziel: ein eigener Salon in der Stadt – das Handwerk zum Hauptberuf. Bald.",
    frm: [0, 0, 1, 1],
    fr: [0, 0, 1, 1],
  },
];

export const salon = {
  a1: "Steineggasse 4",
  a2: "9113 Degersheim",
  phone: "+41 79 912 91 24",
  tel: "tel:+41799129124",
  wa: "https://wa.me/41799129124",
};

export const impRows = [
  { k: "Betrieb", v: "Salon 323" },
  { k: "Inhaber", v: "[Vorname Nachname]" },
  { k: "Adresse", v: "Steineggasse 4, 9113 Degersheim" },
  { k: "Telefon", v: "+41 79 912 91 24" },
  { k: "E-Mail", v: "hallo@salon323.ch", copy: true },
  { k: "UID", v: "CHE-[000.000.000]" },
];
export const agbFacts: [string, string][] = [
  ["24 h", "Gratis absagen bis"],
  ["CHF 20", "Pro Besuch"],
  ["3", "Einladungen pro Mitglied"],
];
export const dsKeep = [
  "Vor- & Nachname",
  "Telefonnummer",
  "Termine & Verlauf",
  "Deine Vorlage",
  "Wer dich eingeladen hat",
  "Notizen zum Schnitt",
];
export const dsNever = [
  "Passwörter",
  "Zahlungsdaten",
  "Standort",
  "Tracking",
  "Fotos ohne dein Ja",
];

export type LegalSec = { t: string; plain: string; full: string };
export type LegalDoc = {
  n: string;
  title: string;
  sub: string;
  lead: string;
  secs: LegalSec[];
};
export const legalDocs: Record<string, LegalDoc> = {
  impressum: {
    n: "01",
    title: "Impressum",
    sub: "Wer hinter Salon 323 steht.",
    lead: "Ein Raum, ein Stuhl, ein Barber. Hier steht, wer dafür geradesteht.",
    secs: [
      {
        t: "Inhalte",
        plain:
          "Wir geben uns Mühe, dass hier alles stimmt – garantieren können wir es nicht.",
        full: "Die Inhalte dieser Seite wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernimmt Salon 323 jedoch keine Gewähr. Haftungsansprüche wegen Schäden materieller oder immaterieller Art, die aus dem Zugriff auf oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstanden sind, werden ausgeschlossen, soweit gesetzlich zulässig.",
      },
      {
        t: "Links",
        plain:
          "Verweisen wir auf andere Seiten, sind diese für ihren Inhalt selbst verantwortlich.",
        full: "Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene Gefahr des Nutzers. Salon 323 hat keinerlei Einfluss auf die Gestaltung, die Inhalte und die Angebote der verknüpften Seiten.",
      },
      {
        t: "Bilder & Urheberrecht",
        plain:
          "Jedes Foto eines Cuts zeigt ein Mitglied, das ja gesagt hat. Bitte nicht kopieren.",
        full: "Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos und Dateien auf dieser Website gehören ausschliesslich Salon 323 oder den speziell genannten Rechteinhabern. Fotografien von Mitgliedern werden nur mit deren ausdrücklicher Einwilligung veröffentlicht und auf Wunsch jederzeit entfernt. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung im Voraus einzuholen.",
      },
    ],
  },
  agb: {
    n: "02",
    title: "AGB",
    sub: "Hausregeln für den Stuhl.",
    lead: "Wenige Regeln. Damit der Stuhl für alle ruhig bleibt.",
    secs: [
      {
        t: "Geltung",
        plain: "Diese Regeln gelten für jeden Termin bei Salon 323.",
        full: "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche Dienstleistungen von Salon 323, [Inhaber], [Adresse] (nachfolgend «Salon»), gegenüber Mitgliedern und eingeladenen Gästen. Abweichende Vereinbarungen bedürfen der Schriftform.",
      },
      {
        t: "Mitgliedschaft",
        plain:
          "Rein kommt nur, wer eingeladen wird. Jedes Mitglied hat drei Einladungen – und bürgt dafür.",
        full: "Die Mitgliedschaft ist persönlich und nicht übertragbar. Ein Zugang entsteht ausschliesslich über einen persönlichen Einladungscode eines bestehenden Mitglieds. Jedes Mitglied verfügt über höchstens drei Einladungen. Der Salon kann Einladungen ohne Angabe von Gründen ablehnen und Mitgliedschaften bei wiederholten Verstössen gegen diese AGB beenden.",
      },
      {
        t: "Termine",
        plain: "Ein gebuchter Termin ist verbindlich – für dich und für uns.",
        full: "Termine werden über das Mitgliederportal gebucht und gelten mit der Bestätigung als verbindlich vereinbart. Der Salon bemüht sich, Termine pünktlich zu beginnen. Bei unvorhergesehener Verhinderung des Salons wird das Mitglied so früh wie möglich informiert und ein Ersatztermin angeboten.",
      },
      {
        t: "Absagen & Verspätung",
        plain:
          "Bis 24 Stunden vorher gratis absagen. Ab 15 Minuten Verspätung verfällt der Termin.",
        full: "Termine können bis 24 Stunden vor Beginn kostenlos im Portal abgesagt oder verschoben werden. Bei späterer Absage oder Nichterscheinen kann der volle Preis der gebuchten Leistung in Rechnung gestellt werden. Ab einer Verspätung von 15 Minuten kann der Termin verfallen, damit nachfolgende Termine nicht beeinträchtigt werden.",
      },
      {
        t: "Preise & Zahlung",
        plain: "CHF 20 pro Besuch. Bezahlt wird vor Ort – bar oder mit TWINT.",
        full: "Es gelten die im Portal zum Zeitpunkt der Buchung angezeigten Preise in Schweizer Franken (CHF), inklusive allfälliger Mehrwertsteuer. Die Zahlung erfolgt direkt nach der Dienstleistung vor Ort in bar oder per TWINT. Preisänderungen werden den Mitgliedern rechtzeitig mitgeteilt.",
      },
      {
        t: "Zufriedenheit",
        plain:
          "Passt etwas nicht, sag es innert 7 Tagen. Wir korrigieren kostenlos.",
        full: "Beanstandungen sind innert 7 Tagen nach der Dienstleistung mitzuteilen. Der Salon bietet in diesem Fall eine kostenlose Nachbesserung an. Ein Anspruch auf Rückerstattung besteht nicht.",
      },
      {
        t: "Haftung",
        plain: "Sag uns vorher, wenn du Allergien oder empfindliche Haut hast.",
        full: "Mitglieder informieren den Salon vor der Behandlung über Allergien, Hautempfindlichkeiten oder gesundheitliche Einschränkungen. Der Salon haftet nur für Schäden, die vorsätzlich oder grobfahrlässig verursacht wurden. Für mitgebrachte Gegenstände wird keine Haftung übernommen.",
      },
      {
        t: "Fotos",
        plain:
          "Wir fotografieren deinen Cut nur, wenn du ja sagst. Ein Nein reicht – und das Bild ist weg.",
        full: "Fotografien von Frisuren werden nur mit vorgängiger Einwilligung des Mitglieds erstellt und veröffentlicht. Die Einwilligung kann jederzeit ohne Begründung widerrufen werden; das betreffende Bild wird darauf innert angemessener Frist entfernt.",
      },
      {
        t: "Recht",
        plain: "Es gilt Schweizer Recht.",
        full: "Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand ist [Ort], soweit gesetzlich zulässig. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Gültigkeit der übrigen Bestimmungen unberührt.",
      },
    ],
  },
  datenschutz: {
    n: "03",
    title: "Datenschutz",
    sub: "Was wir wissen – und was nicht.",
    lead: "Wir wissen so wenig wie möglich über dich. Und das hier ist alles.",
    secs: [
      {
        t: "Verantwortlich",
        plain:
          "Für deine Daten verantwortlich ist Salon 323 – ein Mensch, kein Konzern.",
        full: "Verantwortlich für die Bearbeitung von Personendaten im Sinne des Bundesgesetzes über den Datenschutz (DSG) ist Salon 323, [Inhaber], [Adresse], hallo@salon323.ch.",
      },
      {
        t: "Welche Daten",
        plain:
          "Name, Nummer, Termine, deine Vorlage und wer dich eingeladen hat. Mehr nicht.",
        full: "Wir bearbeiten Vor- und Nachname, Mobilnummer, gebuchte und vergangene Termine, gewählte Leistungen und Vorlagen, Notizen des Barbers zu Schnittwünschen sowie die Einladungsbeziehung (wer wen eingeladen hat). Besonders schützenswerte Personendaten werden nicht bearbeitet.",
      },
      {
        t: "Zweck",
        plain: "Wir brauchen diese Daten nur, damit dein Termin funktioniert.",
        full: "Die Daten werden ausschliesslich zur Verwaltung der Mitgliedschaft, zur Terminbuchung und -erinnerung, zur Abwicklung von Einladungen sowie zur Erbringung der Dienstleistung verwendet. Eine Nutzung zu Werbe- oder Analysezwecken findet nicht statt.",
      },
      {
        t: "Login per SMS",
        plain:
          "Kein Passwort. Ein vierstelliger Code per SMS ist dein Schlüssel.",
        full: "Die Anmeldung erfolgt über einen einmaligen Code, der per SMS an die hinterlegte Mobilnummer gesendet wird. Für den Versand wird ein SMS-Dienstleister eingesetzt, der die Nummer ausschliesslich zu diesem Zweck erhält. Es werden keine Passwörter gespeichert.",
      },
      {
        t: "Cookies",
        plain: "Nur das Nötigste, damit du eingeloggt bleibst. Kein Tracking.",
        full: "Diese Anwendung verwendet ausschliesslich technisch notwendige Speichermechanismen, um die Sitzung aufrechtzuerhalten. Es werden keine Analyse-, Tracking- oder Werbe-Cookies eingesetzt.",
      },
      {
        t: "Speicherdauer",
        plain:
          "Solange du Mitglied bist. Danach löschen wir alles, was das Gesetz nicht verlangt.",
        full: "Personendaten werden für die Dauer der Mitgliedschaft gespeichert. Nach deren Beendigung werden sie innert 30 Tagen gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten (z. B. für Buchhaltungsbelege) entgegenstehen.",
      },
      {
        t: "Weitergabe",
        plain: "Wir verkaufen nichts. Nie.",
        full: "Eine Weitergabe an Dritte erfolgt nur, soweit dies für die Erbringung der Dienstleistung erforderlich ist (Hosting, SMS-Versand) oder gesetzlich vorgeschrieben ist. Die Daten werden in der Schweiz oder in Ländern mit angemessenem Datenschutzniveau bearbeitet.",
      },
      {
        t: "Deine Rechte",
        plain:
          "Du kannst jederzeit fragen, was wir wissen – und alles löschen lassen.",
        full: "Du hast das Recht auf Auskunft, Berichtigung, Löschung und Herausgabe deiner Daten sowie das Recht, der Bearbeitung zu widersprechen. Anfragen richtest du an hallo@salon323.ch. Zudem steht dir eine Anzeige beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) offen.",
      },
    ],
  },
};

// Barber portal demo data
export const members: [
  string,
  string,
  number,
  string,
  string,
  [number, number],
  string,
  string,
][] = [
  [
    "Ari Wyss",
    "IV",
    61,
    "Gründer",
    "vor 2 Wo.",
    [5, 2024],
    "Haare · Bart · Augenbrauen",
    "Klassisch, Nacken gerade.",
  ],
  [
    "Marco Rossi",
    "IV",
    58,
    "Gründer",
    "heute",
    [5, 2024],
    "Haare · Bart",
    "Bart 3 mm, Konturen scharf.",
  ],
  [
    "David Frei",
    "III",
    34,
    "Marco R.",
    "heute",
    [9, 2024],
    "Haare · Waschen",
    "Fade auf 1, oben Schere.",
  ],
  [
    "Luca Meier",
    "III",
    41,
    "Marco R.",
    "vor 3 Wo.",
    [2, 2024],
    "Haare · Bart",
    "Seiten kurz, Bart auf 3 mm.",
  ],
  [
    "Noel Baumann",
    "III",
    26,
    "Ari W.",
    "vor 4 Wo.",
    [11, 2024],
    "Haare",
    "Schere oben, kein Gel.",
  ],
  [
    "Samuel Huber",
    "II",
    18,
    "David F.",
    "heute",
    [1, 2025],
    "Bart · Augenbrauen",
    "Brauen nur leicht.",
  ],
  [
    "Lino Graf",
    "II",
    12,
    "Ari W.",
    "heute",
    [3, 2025],
    "Haare · Bart",
    "Mag es ruhig.",
  ],
  [
    "Jonas Keller",
    "II",
    9,
    "Luca M.",
    "vor 3 Wo.",
    [4, 2025],
    "Haare · Bart",
    "Kurz an den Seiten.",
  ],
  [
    "Elia Steiner",
    "I",
    4,
    "Jonas K.",
    "heute",
    [8, 2025],
    "Haare",
    "Noch am Ausprobieren.",
  ],
  [
    "Tim Brunner",
    "I",
    0,
    "David F.",
    "—",
    [9, 2026],
    "Haare · Waschen",
    "Erster Besuch.",
  ],
];

export const schedule: [string, number, ServiceKey[]][] = [
  ["Marco Rossi", 540, ["haare", "bart"]],
  ["Elia Steiner", 600, ["haare"]],
  ["David Frei", 645, ["haare", "waschen"]],
  ["Samuel Huber", 690, ["bart", "brauen"]],
  ["Lino Graf", 795, ["haare", "bart"]],
  ["Jonas Keller", 855, ["haare", "bart"]],
  ["Noel Baumann", 915, ["haare"]],
  ["Ari Wyss", 960, ["haare", "bart", "brauen"]],
  ["Tim Brunner", 1050, ["haare", "waschen"]],
];

// Logged-in demo member (Luca Meier)
export type Appt = {
  off: number;
  time: string;
  services: ServiceKey[];
  price?: number;
  pay?: string;
  eventId?: string; // Google-Kalender-Event, um die Buchung später zu löschen
};
export type Invite = {
  name: string;
  meta: string;
  tag: string;
  pending?: boolean;
  code?: string;
  kids?: { name: string; meta: string; tag: string }[];
};
export type SalonUser = {
  first: string;
  last: string;
  username: string;
  cuts: number;
  since: [number, number];
  no: string;
  phone: string;
  email: string;
  card: number; // chosen card design 0..2
  isNew: boolean;
};

// The three member-card designs. 0 = the original photo card; 1 & 2 are
// gradient cards (real photos come later). name shows in the card picker.
export const cardStyles: {
  name: string;
  sub: string;
  front: string;
  overlay: string;
  text: string;
}[] = [
  {
    name: "Mist",
    sub: "Das Original",
    front: "url(/mist.jpg)",
    overlay:
      "linear-gradient(115deg,rgba(8,12,20,.8),rgba(8,12,20,.25) 55%,rgba(255,255,255,.14))",
    text: "#F4F7FA",
  },
  {
    name: "Ember",
    sub: "Warm",
    front:
      "radial-gradient(130% 120% at 22% 18%, #f4a69e 0%, #c76a63 34%, #4b2c2f 78%, #1d1012 100%)",
    overlay:
      "linear-gradient(120deg,rgba(14,8,10,.55),rgba(14,8,10,0) 48%,rgba(255,220,214,.18))",
    text: "#FBEEEC",
  },
  {
    name: "Slate",
    sub: "Kühl",
    front:
      "radial-gradient(130% 120% at 78% 22%, #7f93ad 0%, #41526a 38%, #1c2634 78%, #0d131c 100%)",
    overlay:
      "linear-gradient(120deg,rgba(8,12,20,.55),rgba(8,12,20,0) 48%,rgba(214,228,244,.16))",
    text: "#EAF0F7",
  },
];

export function lucaState() {
  return {
    user: {
      first: "Luca",
      last: "Meier",
      username: "luca",
      cuts: 41,
      since: [2, 2024] as [number, number],
      no: "0047",
      phone: "+41 79 323 04 47",
      email: "",
      card: 0,
      isNew: false,
    } as SalonUser,
    invites: [
      {
        name: "Jonas Keller",
        meta: "Seit Mai 2025 · 9 Cuts",
        tag: "II",
        kids: [
          {
            name: "Elia Steiner",
            meta: "Von Jonas · seit Sept. 2025",
            tag: "I",
          },
        ],
      },
      {
        name: "Noah",
        meta: "Einladung offen · noch 5 Tage",
        tag: "OFFEN",
        pending: true,
        code: "NH4K2P",
      },
    ] as Invite[],
    appt: {
      off: 2,
      time: "14:30",
      services: ["haare", "bart"] as ServiceKey[],
    } as Appt,
    history: [
      { off: -21, s: ["haare", "bart"] as ServiceKey[] },
      { off: -42, s: ["haare", "bart"] as ServiceKey[] },
      { off: -64, s: ["haare"] as ServiceKey[] },
      { off: -85, s: ["haare", "bart", "brauen"] as ServiceKey[] },
      { off: -105, s: ["haare", "bart"] as ServiceKey[] },
    ],
    template: ["haare", "bart"] as ServiceKey[],
  };
}

// ── helpers ──
export function dateOf(off: number) {
  // Basis: heute (lokale Mitternacht). off 0 = heute, 1 = morgen, ...
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() + off);
}
export function svcName(k: ServiceKey) {
  return (svc.find((s) => s.k === k) || ({} as (typeof svc)[number])).name;
}
export function labelOf(list: ServiceKey[], cut?: string) {
  return list.length
    ? list
        .map((k) => (k === "haare" && cut ? "Haare (" + cut + ")" : svcName(k)))
        .join(" · ")
    : "—";
}
export function durOf(list: ServiceKey[]) {
  return list.length ? 30 : 0;
}
// Preis pro Termin: Haarschnitt CHF 15, mit Bart CHF 20.
export function priceOf(list: ServiceKey[]) {
  if (!list.length) return 0;
  return list.includes("bart") ? 20 : 15;
}
export function fmtTime(v: number) {
  const h = Math.floor(v / 60),
    m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
