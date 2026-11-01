// Salon 15 — static data & helpers, transcribed 1:1 from the design prototype
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

/** Points: every cut counts, and so does bringing people in — but an invite
 *  only once that person has actually sat in the chair (first cut), so empty
 *  sign-ups earn nothing. Their invites count for the circle too. */
export const PTS = { cut: 10, invite: 25, circle: 5 };

/** Ten tiers by points — Guest until the first cut, then step by step inward.
 *  The last one is earned by loyalty, not shortcuts: on top of the points it
 *  needs INNER_CUTS cuts, i.e. two years at about 1–2 visits a month. */
export const INNER_CUTS = 36;
export const tiers = [
  { r: "I", n: "Guest", min: 0 },
  { r: "II", n: "Member", min: 10 },
  { r: "III", n: "Regular", min: 30 },
  { r: "IV", n: "Familiar", min: 60 },
  { r: "V", n: "Insider", min: 100 },
  { r: "VI", n: "Confidant", min: 150 },
  { r: "VII", n: "Patron", min: 200 },
  { r: "VIII", n: "Ambassador", min: 250 },
  { r: "IX", n: "Pillar", min: 300 },
  { r: "X", n: "Inner Circle", min: 360 },
];

/** Current tier index, the tier, the next one (or null at the top) and how
 *  far into the current step (0..1). The top tier also needs INNER_CUTS. */
export function tierAt(points: number, cuts: number) {
  const top = tiers.length - 1;
  let i = tiers.reduce((acc, t, k) => (points >= t.min ? k : acc), 0);
  if (i === top && cuts < INNER_CUTS) i = top - 1;
  const T = tiers[i];
  const TN = tiers[i + 1] ?? null;
  const progress = TN ? Math.min(1, (points - T.min) / (TN.min - T.min)) : 1;
  return { i, T, TN, progress };
}

/** "Top 5 %", "Top 0.4 %" — one decimal below 1 %. */
export const fmtTop = (top: number) =>
  `Top ${top < 1 ? top.toFixed(1) : Math.round(top)} %`;

/** A member's standing: points by source and place among all members. */
export type Standing = {
  points: number;
  cutPts: number;
  invitePts: number;
  circlePts: number;
  rank: number; // 1 = most points
  of: number; // members ranked
  top: number; // share of members at or above (0.1..100), see fmtTop
};

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

// Short, encouraging verses in plain modern German — the kind of verse of the
// day people share, readable without any church background. One is shown at
// random on each welcome (see goWelcome / store mount).
export const verses = [
  {
    t: "Sei mutig und stark. Hab keine Angst – Gott ist mit dir, wohin du auch gehst.",
    r: "Josua 1,9",
  },
  {
    t: "Fürchte dich nicht, ich bin bei dir. Ich mache dich stark und helfe dir.",
    r: "Jesaja 41,10",
  },
  { t: "Alles kann ich durch den, der mir Kraft gibt.", r: "Philipper 4,13" },
  {
    t: "Ich habe Gutes mit dir vor: eine Zukunft und Hoffnung.",
    r: "Jeremia 29,11",
  },
  { t: "Der Herr ist mein Hirte, mir wird nichts fehlen.", r: "Psalm 23,1" },
  {
    t: "Kommt zu mir, alle, die ihr müde und belastet seid – ich gebe euch Ruhe.",
    r: "Matthäus 11,28",
  },
  {
    t: "Alle eure Sorgen werft auf ihn, denn er sorgt für euch.",
    r: "1. Petrus 5,7",
  },
  { t: "Die auf Gott vertrauen, bekommen neue Kraft.", r: "Jesaja 40,31" },
  { t: "Seine Güte ist jeden Morgen neu.", r: "Klagelieder 3,23" },
  {
    t: "Vertrau Gott von ganzem Herzen – er zeigt dir den richtigen Weg.",
    r: "Sprüche 3,5–6",
  },
  { t: "Vertrau Gott deinen Weg an. Er wird es gut machen.", r: "Psalm 37,5" },
  {
    t: "Für die, die Gott lieben, wird alles zum Guten führen.",
    r: "Römer 8,28",
  },
  {
    t: "Dies ist der Tag, den Gott gemacht hat. Freut euch und seid fröhlich.",
    r: "Psalm 118,24",
  },
  {
    t: "Sorgt euch um nichts – bringt alles im Gebet vor Gott.",
    r: "Philipper 4,6",
  },
  {
    t: "Frieden lasse ich euch. Euer Herz soll sich nicht fürchten.",
    r: "Johannes 14,27",
  },
  {
    t: "Gott hat uns nicht Angst gegeben, sondern Kraft, Liebe und Besonnenheit.",
    r: "2. Timotheus 1,7",
  },
  { t: "Ich danke dir, dass ich so wunderbar gemacht bin.", r: "Psalm 139,14" },
  {
    t: "Fürchte dich nicht. Ich habe dich bei deinem Namen gerufen – du gehörst zu mir.",
    r: "Jesaja 43,1",
  },
  {
    t: "Meine Hilfe kommt von Gott, der Himmel und Erde gemacht hat.",
    r: "Psalm 121,2",
  },
  {
    t: "Sorgt euch nicht um morgen. Jeder Tag hat genug eigene Sorgen.",
    r: "Matthäus 6,34",
  },
  { t: "Lasst uns nicht müde werden, Gutes zu tun.", r: "Galater 6,9" },
  { t: "Alles, was ihr tut, geschehe in Liebe.", r: "1. Korinther 16,14" },
  {
    t: "Gott ist nahe bei denen, die ein gebrochenes Herz haben.",
    r: "Psalm 34,19",
  },
  {
    t: "Ich lasse dich nicht im Stich und verlasse dich nicht.",
    r: "Hebräer 13,5",
  },
  { t: "Gott selbst geht vor dir her und ist bei dir.", r: "5. Mose 31,8" },
  {
    t: "Der Gott der Hoffnung erfülle euch mit Freude und Frieden.",
    r: "Römer 15,13",
  },
  { t: "Du zeigst mir den Weg zum Leben.", r: "Psalm 16,11" },
  { t: "Seid mutig: Ich habe die Welt überwunden.", r: "Johannes 16,33" },
  { t: "Gott segne dich und behüte dich.", r: "4. Mose 6,24" },
  {
    t: "Gott ist mein Licht – vor wem sollte ich mich fürchten?",
    r: "Psalm 27,1",
  },
  {
    t: "Vertrau Gott, was du vorhast – dann wird es gelingen.",
    r: "Sprüche 16,3",
  },
  {
    t: "Gott ist unsere Zuversicht und Stärke, eine Hilfe in allen Nöten.",
    r: "Psalm 46,2",
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
  { k: "Betrieb", v: "Salon 15" },
  { k: "Inhaber", v: "Laurin Girardet" },
  { k: "Adresse", v: "Steineggasse 4, 9113 Degersheim" },
  { k: "Telefon", v: "+41 79 912 91 24" },
  { k: "E-Mail", v: "cuts@salon15.ch", copy: true },
];
export const agbFacts: [string, string][] = [
  ["24 h", "Gratis absagen bis"],
  ["CHF 20", "Pro Besuch"],
  ["5", "Einladungen pro Mitglied"],
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
    sub: "Wer hinter Salon 15 steht.",
    lead: "Ein Raum, ein Stuhl, ein Barber. Hier steht, wer dafür geradesteht.",
    secs: [
      {
        t: "Inhalte",
        plain:
          "Wir geben uns Mühe, dass hier alles stimmt – garantieren können wir es nicht.",
        full: "Die Inhalte dieser Seite wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernimmt Salon 15 jedoch keine Gewähr. Haftungsansprüche wegen Schäden materieller oder immaterieller Art, die aus dem Zugriff auf oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstanden sind, werden ausgeschlossen, soweit gesetzlich zulässig.",
      },
      {
        t: "Links",
        plain:
          "Verweisen wir auf andere Seiten, sind diese für ihren Inhalt selbst verantwortlich.",
        full: "Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene Gefahr des Nutzers. Salon 15 hat keinerlei Einfluss auf die Gestaltung, die Inhalte und die Angebote der verknüpften Seiten.",
      },
      {
        t: "Bilder & Urheberrecht",
        plain:
          "Jedes Foto eines Cuts zeigt ein Mitglied, das ja gesagt hat. Bitte nicht kopieren.",
        full: "Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos und Dateien auf dieser Website gehören ausschliesslich Salon 15 oder den speziell genannten Rechteinhabern. Fotografien von Mitgliedern werden nur mit deren ausdrücklicher Einwilligung veröffentlicht und auf Wunsch jederzeit entfernt. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung im Voraus einzuholen.",
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
        plain: "Diese Regeln gelten für jeden Termin bei Salon 15.",
        full: "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche Dienstleistungen von Salon 15, Laurin Girardet, Steineggasse 4, 9113 Degersheim (nachfolgend «Salon»), gegenüber Mitgliedern und eingeladenen Gästen. Abweichende Vereinbarungen bedürfen der Schriftform.",
      },
      {
        t: "Mitgliedschaft",
        plain:
          "Rein kommt nur, wer eingeladen wird. Jedes Mitglied hat einen persönlichen Code – und bürgt für alle, die damit kommen.",
        full: "Die Mitgliedschaft ist persönlich und nicht übertragbar. Ein Zugang entsteht ausschliesslich über einen persönlichen Einladungscode eines bestehenden Mitglieds. Jedes Mitglied verfügt über einen persönlichen Einladungscode. Der Salon kann Einladungen ohne Angabe von Gründen ablehnen und Mitgliedschaften bei wiederholten Verstössen gegen diese AGB pausieren oder beenden.",
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
        full: "Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand ist Degersheim, soweit gesetzlich zulässig. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Gültigkeit der übrigen Bestimmungen unberührt.",
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
          "Für deine Daten verantwortlich ist Salon 15 – ein Mensch, kein Konzern.",
        full: "Verantwortlich für die Bearbeitung von Personendaten im Sinne des Bundesgesetzes über den Datenschutz (DSG) ist Salon 15, Laurin Girardet, Steineggasse 4, 9113 Degersheim, cuts@salon15.ch.",
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
        full: "Du hast das Recht auf Auskunft, Berichtigung, Löschung und Herausgabe deiner Daten sowie das Recht, der Bearbeitung zu widersprechen. Anfragen richtest du an cuts@salon15.ch. Zudem steht dir eine Anzeige beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) offen.",
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
/** One person in a member's circle, with the people they brought in. */
export type Invite = {
  id: string;
  name: string;
  meta: string;
  tag: string;
  cuts: number;
  points: number;
  since: string; // "Nov 2026"
  kids: Invite[];
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
  inactive?: boolean; // deactivated by the barber: booking is closed
};

// The three member-card designs (photos in /public, index = members.card_index).
// The chosen design is the card's face — also while it shows an appointment.
// base is the photo's dominant dark tone (shown until the image has loaded).
export const cardStyles: {
  name: string;
  sub: string;
  img: string;
  front: string;
  base: string;
  overlay: string;
  text: string;
}[] = [
  {
    name: "Mist",
    sub: "Das Original",
    img: "/mist.jpg",
    front: "url(/mist.jpg)",
    base: "#1a2230",
    overlay:
      "linear-gradient(115deg,rgba(8,12,20,.8),rgba(8,12,20,.25) 55%,rgba(255,255,255,.14))",
    text: "#F4F7FA",
  },
  {
    name: "Ember",
    sub: "Warm",
    img: "/cards/ember.webp",
    front: "url(/cards/ember.webp)",
    base: "#3a1218",
    overlay:
      "linear-gradient(115deg,rgba(26,6,10,.72),rgba(26,6,10,.18) 55%,rgba(255,220,214,.1))",
    text: "#FBEEEC",
  },
  {
    name: "Moos",
    sub: "Tief",
    img: "/cards/moos.webp",
    front: "url(/cards/moos.webp)",
    base: "#18221a",
    overlay:
      "linear-gradient(115deg,rgba(8,16,10,.74),rgba(8,16,10,.2) 55%,rgba(236,240,214,.1))",
    text: "#F1F4EC",
  },
];

// ── helpers ──
export function dateOf(off: number) {
  // Basis: heute (lokale Mitternacht). off 0 = heute, 1 = morgen, ...
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() + off);
}
/** Walk-ins ("Sponti") get their own warm colour in the admin agenda and
 *  calendar; Google colorId 6 = Tangerine in Laurin's own calendar. */
export const SPONTI = {
  ink: "#B8622D",
  bg: "#F6E4D3",
  fg: "#5A2F12",
  gcal: "6",
};

/** How far ahead members can book, always counted from today (3 weeks). */
export const BOOK_DAYS = 21;

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
