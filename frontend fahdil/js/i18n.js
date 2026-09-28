/* ---------------------------------------------------------------------------
 * i18n.js — bilingual (French / English) strings + the small engine that
 * applies them. No framework: every translatable element in index.html
 * carries a data-i18n / data-i18n-html / data-i18n-placeholder attribute
 * naming a key below; setLanguage() walks the DOM once and fills them in.
 *
 * Dynamic content built by app.js (parser trace rows, translator results,
 * etc.) calls t(key, params) directly instead of reading textContent, so it
 * can be re-rendered in the new language without another network request —
 * app.js keeps the last server response around for exactly this reason.
 * ------------------------------------------------------------------------- */

const STRINGS = {
  fr: {
    "app.title": "Yo-B — Analyse lexicale et syntaxique du parler de Yaoundé",
    "boot.loading": "Chargement de Yo-B…",
    "brand.tagline": "labo de grammaire de rue",

    "nav.overview": "Aperçu",
    "nav.collection": "Collecte de données",
    "nav.lexical": "Analyse lexicale",
    "nav.syntax": "Analyse syntaxique",
    "nav.parser": "Testeur / Parseur",
    "nav.translator": "Traducteur",
    "nav.help": "Aide",

    "rail.footer.line1": "CS4110 — Compiler Construction",
    "rail.footer.line2": "Analyse lexicale et syntaxique du parler urbain informel de Yaoundé",

    "overview.eyebrow": "Yaoundé parle en couches — anglais, français, pidgin, ewondo et franc-anglais, souvent dans la même phrase.",
    "overview.heroTitle": "Yo-B lit la <span class=\"hero-underline\">grammaire de la rue</span>.",
    "overview.lede": "Un petit pipeline de construction de compilateur — lexeur, transformateur de grammaire et analyseur LL(1) — construit à partir de vrais échanges de taxi, de marché et de campus à Yaoundé.",
    "overview.stat.statements": "énoncés collectés",
    "overview.stat.tokens": "tokens distincts observés",
    "overview.stat.accept": "phrases acceptées par la grammaire",
    "overview.stat.topics": "sujets couverts",
    "overview.card1.title": "1 · Collecte",
    "overview.card1.body": "Énoncés transcrits dans les taxis, les chop houses, les bendskins, le marché et le campus — gardés tels quels, argot et fautes compris.",
    "overview.card2.title": "2 · Lexique",
    "overview.card2.body": "Un lexeur écrit à la main découpe chaque phrase en noms, verbes, argot et expressions mélangées, à l'aide d'expressions régulières et de tables de correspondance.",
    "overview.card3.title": "3 · Syntaxe",
    "overview.card3.body": "Une grammaire hors contexte est construite, puis transformée — récursivité gauche supprimée, préfixes communs factorisés — avant de calculer FIRST/FOLLOW et une table LL(1).",
    "overview.card4.title": "4 · Parseur",
    "overview.card4.body": "Un analyseur prédictif LL(1) lit le flux de tokens étiquetés et décide, étape par étape, si une phrase respecte la grammaire.",

    "collection.title": "Collecte de données",
    "collection.lede": "Énoncés réels entendus à Yaoundé, classés par sujet. Remplacez les lignes d'exemple par les transcriptions de votre propre groupe avant de rendre le devoir.",
    "collection.placeholder": "Tapez ou collez un énoncé transcrit…",
    "collection.addButton": "Ajouter l'énoncé",
    "collection.table.id": "#",
    "collection.table.topic": "Sujet",
    "collection.table.statement": "Énoncé transcrit",
    "collection.topic.taxi": "Taxi et problèmes de circulation",
    "collection.topic.internet": "Mauvaise connexion internet",
    "collection.topic.electricity": "Coupures d'électricité",
    "collection.topic.market": "Marchandage au marché",
    "collection.topic.rain": "Difficultés liées à la saison des pluies",
    "collection.topic.fuel": "Pénurie de carburant",
    "collection.topic.roadside": "Commerce en bord de route",
    "collection.topic.bendskin": "Communication en bendskin",
    "collection.topic.security": "Annonces de sécurité ou contrôles",
    "collection.topic.university": "Vie à l'université ICT",

    "lexical.title": "Analyse lexicale",
    "lexical.lede": "Tapez n'importe quelle phrase — anglais, français, pidgin ou un mélange — et voyez comment le lexeur l'étiquette token par token.",
    "lexical.placeholder": "ex. Bendskin hala me small money for quartier",
    "lexical.analyzeButton": "Analyser",
    "lexical.freqHeading": "Fréquence des tokens dans le corpus collecté",
    "lexical.freqTable.token": "Token",
    "lexical.freqTable.count": "Occurrences",
    "lexical.catTable.category": "Catégorie",
    "lexical.catTable.occurrences": "Occurrences",

    "syntax.title": "Analyse syntaxique",
    "syntax.lede": "D'une grammaire récursive à gauche à une grammaire prête pour LL(1) — chaque transformation est montrée explicitement.",
    "syntax.stage1Label": "1 · Grammaire d'origine (récursive à gauche)",
    "syntax.stage2Label": "2 · Après suppression de la récursivité gauche",
    "syntax.stage3Label": "3 · Après factorisation gauche (finale — utilisée ci-dessous)",
    "syntax.firstFollowHeading": "Ensembles FIRST et FOLLOW",
    "syntax.table.nonterminal": "Non-terminal",
    "syntax.table.first": "FIRST",
    "syntax.table.follow": "FOLLOW",
    "syntax.ll1Heading": "Table d'analyse LL(1)",
    "syntax.ll1.ok": "Aucun conflit — cette grammaire est LL(1).",
    "syntax.ll1.conflicts": "conflit(s) trouvé(s) — voir la table.",

    "parser.title": "Testeur / Parseur LL(1)",
    "parser.lede": "Lancez le parseur sur une phrase, ou sur tout le corpus collecté d'un coup.",
    "parser.placeholder": "ex. Taxi drop me for quartier",
    "parser.parseButton": "Analyser",
    "parser.result.accepted": "Accepté par la grammaire",
    "parser.result.rejected": "Rejeté",
    "parser.terminalsLabel": "Terminaux transmis au parseur :",
    "parser.skippedLabel": "Tokens ignorés (aucune correspondance de terminal — SLANG/CODEMIX/PUNCT/etc.) :",
    "parser.table.stack": "Pile",
    "parser.table.remaining": "Entrée restante",
    "parser.table.action": "Action",
    "parser.suiteHeading": "Suite de tests complète (tous les énoncés collectés)",
    "parser.suiteButton": "Lancer sur tous les énoncés",
    "parser.suiteTable.statement": "Énoncé",
    "parser.suiteTable.terminals": "Terminaux transmis au parseur",
    "parser.suiteTable.result": "Résultat",
    "parser.badge.accepted": "Accepté",
    "parser.badge.rejected": "Rejeté",
    "parser.action.match": "Correspondance : {terminal}",
    "parser.action.expand": "{nt} → {production}",
    "parser.action.accept": "ACCEPTÉ",
    "parser.action.errorExpected": "ERREUR : attendu « {expected} » mais trouvé « {found} »",
    "parser.action.errorNoRule": "ERREUR : aucune règle pour {nt} sur l'entrée « {terminal} » (la phrase ne correspond pas à la grammaire)",

    "translator.title": "Traducteur",
    "translator.lede": "Traduction mot-à-mot, à partir d'un petit dictionnaire vérifié — jamais inventée. Un mot absent du dictionnaire est signalé comme tel, ou automatiquement soumis à une recherche en ligne d'appoint.",
    "translator.fromLabel": "Traduire de",
    "translator.toLabel": "vers",
    "translator.lang.pidgin": "Pidgin / Franc-anglais",
    "translator.lang.french": "Français",
    "translator.lang.english": "English",
    "translator.sameLanguage": "Choisissez deux langues différentes.",
    "translator.onlineOnlyDirection": "Le français ↔ anglais direct utilise uniquement la recherche en ligne (pas de dictionnaire pidgin ici) — désactivez-le sur le serveur pour l'interdire.",
    "translator.placeholder": "ex. Bendskin hala me small money for quartier",
    "translator.translateButton": "Traduire",
    "translator.loadingText": "Traduction en cours…",
    "translator.onlineNote": "Au moins un mot a été traduit via une recherche en ligne d'appoint — à prendre avec prudence (moins fiable que le dictionnaire vérifié).",
    "translator.unresolvedLabel": "Non couverts par le dictionnaire :",
    "translator.status.dictionary": "dictionnaire",
    "translator.status.online": "recherche en ligne",
    "translator.status.unresolved": "non trouvé",
    "translator.resultLabel.french": "Français",
    "translator.resultLabel.english": "English",
    "translator.resultLabel.pidgin": "Pidgin / Franc-anglais",
    "translator.errorFallback": "La traduction a échoué.",
    "translator.errorNetwork": "Impossible de contacter le serveur de traduction.",

    "onboarding.step1.title": "Bienvenue sur Yo-B",
    "onboarding.step1.body": "Yo-B est un petit compilateur qui lit le pidgin et le franc-anglais parlés à Yaoundé — un mélange d'anglais, de français, de pidgin et d'argot local, souvent dans la même phrase.",
    "onboarding.step2.title": "Lexeur → Grammaire → Parseur",
    "onboarding.step2.body": "Les onglets « Analyse lexicale » et « Analyse syntaxique » montrent, étape par étape, comment une phrase est découpée en mots-catégories, puis comment la grammaire est transformée pour devenir utilisable par un analyseur LL(1).",
    "onboarding.step3.title": "Testez et traduisez",
    "onboarding.step3.body": "Dans « Testeur / Parseur », voyez si une phrase est acceptée ou rejetée par la grammaire. Dans « Traducteur », obtenez le sens de chaque mot en français ou en anglais — et vous pouvez changer la langue de toute l'application en haut du menu.",
    "onboarding.skip": "Passer",
    "onboarding.back": "Précédent",
    "onboarding.next": "Suivant",
    "onboarding.finish": "Commencer",
    "onboarding.progress": "Étape {current} sur {total}",
  },

  en: {
    "app.title": "Yo-B — Lexical & Syntactic Analysis of Yaoundé Speech",
    "boot.loading": "Loading Yo-B…",
    "brand.tagline": "street grammar lab",

    "nav.overview": "Overview",
    "nav.collection": "Data Collection",
    "nav.lexical": "Lexical Analysis",
    "nav.syntax": "Syntactic Analysis",
    "nav.parser": "Parser Tester",
    "nav.translator": "Translator",
    "nav.help": "Help",

    "rail.footer.line1": "CS4110 — Compiler Construction",
    "rail.footer.line2": "Lexical & Syntactic Analysis of Informal Urban Communication in Yaoundé",

    "overview.eyebrow": "Yaoundé speaks in layers — English, French, Pidgin, Ewondo, and franc-anglais, all in one sentence.",
    "overview.heroTitle": "Yo-B reads the <span class=\"hero-underline\">grammar of the street</span>.",
    "overview.lede": "A small compiler-construction pipeline — lexer, grammar transformer, and LL(1) parser — built on real taxi, market, and campus talk from Yaoundé.",
    "overview.stat.statements": "collected statements",
    "overview.stat.tokens": "distinct tokens seen",
    "overview.stat.accept": "sentences accepted by the grammar",
    "overview.stat.topics": "topics covered",
    "overview.card1.title": "1 · Collection",
    "overview.card1.body": "Transcribed statements from taxis, chop houses, bendskins, the market, and campus — kept exactly as spoken, slang and mistakes included.",
    "overview.card2.title": "2 · Lexicon",
    "overview.card2.body": "A hand-written lexer splits each sentence into nouns, verbs, slang, and code-mixed expressions using regular expressions and lookup tables.",
    "overview.card3.title": "3 · Syntax",
    "overview.card3.body": "A context-free grammar is built, then transformed — left recursion removed, common prefixes factored — before FIRST/FOLLOW and an LL(1) table are computed.",
    "overview.card4.title": "4 · Parser",
    "overview.card4.body": "A predictive LL(1) parser reads the tagged token stream and decides, step by step, whether a sentence fits the grammar.",

    "collection.title": "Data Collection",
    "collection.lede": "Real-life statements heard around Yaoundé, organised by topic. Replace the sample rows with your group's own transcriptions before submission.",
    "collection.placeholder": "Type or paste a transcribed statement…",
    "collection.addButton": "Add statement",
    "collection.table.id": "#",
    "collection.table.topic": "Topic",
    "collection.table.statement": "Transcribed statement",
    "collection.topic.taxi": "Taxi and commuting issues",
    "collection.topic.internet": "Poor internet connectivity",
    "collection.topic.electricity": "Limited Electricity supply",
    "collection.topic.market": "Market bargaining",
    "collection.topic.rain": "Rainy season struggles",
    "collection.topic.fuel": "Fuel scarcity",
    "collection.topic.roadside": "Roadside business interactions",
    "collection.topic.bendskin": "Bendskin communication",
    "collection.topic.security": "Security announcements or checkpoints",
    "collection.topic.university": "Life at the ICT University",

    "lexical.title": "Lexical Analysis",
    "lexical.lede": "Type any sentence — English, French, Pidgin, or a mix — and see how the lexer tags it token by token.",
    "lexical.placeholder": "e.g. Bendskin hala me small money for quartier",
    "lexical.analyzeButton": "Analyze",
    "lexical.freqHeading": "Token frequency across the collected corpus",
    "lexical.freqTable.token": "Token",
    "lexical.freqTable.count": "Count",
    "lexical.catTable.category": "Category",
    "lexical.catTable.occurrences": "Occurrences",

    "syntax.title": "Syntactic Analysis",
    "syntax.lede": "From a left-recursive grammar to an LL(1)-ready one — every transformation shown explicitly.",
    "syntax.stage1Label": "1 · Original grammar (left-recursive)",
    "syntax.stage2Label": "2 · After removing left recursion",
    "syntax.stage3Label": "3 · After left factoring (final — used below)",
    "syntax.firstFollowHeading": "FIRST & FOLLOW sets",
    "syntax.table.nonterminal": "Non-terminal",
    "syntax.table.first": "FIRST",
    "syntax.table.follow": "FOLLOW",
    "syntax.ll1Heading": "LL(1) parsing table",
    "syntax.ll1.ok": "No conflicts — this grammar is LL(1).",
    "syntax.ll1.conflicts": "conflict(s) found — see table.",

    "parser.title": "Parser Tester LL(1)",
    "parser.lede": "Run the parser on one sentence, or on the whole collected corpus at once.",
    "parser.placeholder": "e.g. Taxi drop me for quartier",
    "parser.parseButton": "Parse",
    "parser.result.accepted": "Accepted by the grammar",
    "parser.result.rejected": "Rejected",
    "parser.terminalsLabel": "Terminals fed to parser:",
    "parser.skippedLabel": "Skipped tokens (no terminal mapping — SLANG/CODEMIX/PUNCT/etc.):",
    "parser.table.stack": "Stack",
    "parser.table.remaining": "Remaining input",
    "parser.table.action": "Action",
    "parser.suiteHeading": "Full test suite (all collected statements)",
    "parser.suiteButton": "Run on all statements",
    "parser.suiteTable.statement": "Statement",
    "parser.suiteTable.terminals": "Terminals fed to parser",
    "parser.suiteTable.result": "Result",
    "parser.badge.accepted": "Accepted",
    "parser.badge.rejected": "Rejected",
    "parser.action.match": "Match: {terminal}",
    "parser.action.expand": "{nt} → {production}",
    "parser.action.accept": "ACCEPT",
    "parser.action.errorExpected": "ERROR: expected '{expected}' but found '{found}'",
    "parser.action.errorNoRule": "ERROR: no rule for {nt} on input '{terminal}' (sentence does not fit the grammar)",

    "translator.title": "Translator",
    "translator.lede": "Word-for-word translation from a small, reviewed dictionary — never invented. A word not in the dictionary is flagged as such, or automatically sent to a free online lookup as a fallback.",
    "translator.fromLabel": "Translate from",
    "translator.toLabel": "to",
    "translator.lang.pidgin": "Pidgin / Franc-anglais",
    "translator.lang.french": "Français",
    "translator.lang.english": "English",
    "translator.sameLanguage": "Choose two different languages.",
    "translator.onlineOnlyDirection": "Direct French ↔ English uses only the online lookup (no Pidgin dictionary involved here) — disable it on the server to forbid this.",
    "translator.placeholder": "e.g. Bendskin hala me small money for quartier",
    "translator.translateButton": "Translate",
    "translator.loadingText": "Translating…",
    "translator.onlineNote": "At least one word was translated via an online fallback lookup — treat it with caution (less reliable than the reviewed dictionary).",
    "translator.unresolvedLabel": "Not covered by the dictionary:",
    "translator.status.dictionary": "dictionary",
    "translator.status.online": "online lookup",
    "translator.status.unresolved": "not found",
    "translator.resultLabel.french": "Français",
    "translator.resultLabel.english": "English",
    "translator.resultLabel.pidgin": "Pidgin / Franc-anglais",
    "translator.errorFallback": "The translation failed.",
    "translator.errorNetwork": "Could not reach the translation server.",

    "onboarding.step1.title": "Welcome to Yo-B",
    "onboarding.step1.body": "Yo-B is a small compiler that reads Pidgin and Franc-anglais as spoken in Yaoundé — a mix of English, French, Pidgin, and local slang, often in the same sentence.",
    "onboarding.step2.title": "Lexer → Grammar → Parser",
    "onboarding.step2.body": "The \"Lexical Analysis\" and \"Syntactic Analysis\" tabs show, step by step, how a sentence is split into word categories, and how the grammar is transformed to become usable by an LL(1) parser.",
    "onboarding.step3.title": "Test it and translate",
    "onboarding.step3.body": "In \"Parser Tester\", see whether a sentence is accepted or rejected by the grammar. In \"Translator\", get the meaning of each word in French or English — and you can switch the whole app's language at the top of the menu.",
    "onboarding.skip": "Skip",
    "onboarding.back": "Back",
    "onboarding.next": "Next",
    "onboarding.finish": "Get started",
    "onboarding.progress": "Step {current} of {total}",
  },
};

/** English canonical topic string (as stored in statements.json) -> i18n key,
 * so the Data Collection table can show topics in the current UI language
 * even though the underlying data is stored once, in English. */
const TOPIC_KEY_BY_ENGLISH = {
  "Taxi and commuting issues": "collection.topic.taxi",
  "Poor internet connectivity": "collection.topic.internet",
  "Limited Electricity supply": "collection.topic.electricity",
  "Market bargaining": "collection.topic.market",
  "Rainy season struggles": "collection.topic.rain",
  "Fuel scarcity": "collection.topic.fuel",
  "Roadside business interactions": "collection.topic.roadside",
  "Bendskin communication": "collection.topic.bendskin",
  "Security announcements or checkpoints": "collection.topic.security",
  "Life at the ICT University": "collection.topic.university",
};

let currentLang = localStorage.getItem("yobLang") || "fr";

/** Look up one string and interpolate {placeholders}. Falls back to the key
 * itself (never throws) so a missing translation is visible, not silently
 * blank. */
function t(key, params){
  const dict = STRINGS[currentLang] || STRINGS.fr;
  let text = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
  if (params){
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp("\\{" + p + "\\}", "g"), params[p]);
    });
  }
  return text;
}

/** Display label for a topic, translated if it's one of the known ones,
 * shown as-is otherwise (e.g. a topic the user typed in free text). */
function translateTopic(englishTopic){
  const key = TOPIC_KEY_BY_ENGLISH[englishTopic];
  return key ? t(key) : englishTopic;
}

function applyStaticI18n(){
  document.documentElement.lang = currentLang;
  document.title = t("app.title");

  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.lang === currentLang);
  });
}

/** Change the UI language, persist the choice, re-apply all static text, and
 * let the rest of the app (app.js) re-render any dynamic content it has
 * cached — see window.onLanguageChanged. */
function setLanguage(lang){
  if (lang !== "fr" && lang !== "en") return;
  currentLang = lang;
  localStorage.setItem("yobLang", lang);
  applyStaticI18n();
  if (typeof window.onLanguageChanged === "function") window.onLanguageChanged();
}

document.addEventListener("DOMContentLoaded", () => {
  applyStaticI18n();
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
});
