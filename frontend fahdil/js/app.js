const API = ""; // same-origin: Flask serves this page too

// Cache of the last server response per feature, so switching language can
// re-render instantly without another round trip to the backend.
const lastResult = {
  statements: null,
  frequency: null,
  grammarStages: null,
  grammarAnalysis: null,
  singleParse: null,
  suiteParse: null,
  translate: null,
};

// ---------------------------------------------------------------- tabs ----
const railLinks = document.querySelectorAll(".rail-link");
railLinks.forEach(btn => {
  btn.addEventListener("click", () => {
    railLinks.forEach(b => b.classList.remove("is-active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("is-active"));
    btn.classList.add("is-active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("is-active");

    if (btn.dataset.tab === "lexical") loadFrequency();
    if (btn.dataset.tab === "syntax") loadGrammar();
  });
});

// ------------------------------------------------------------ helpers ----
function esc(s){
  return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function renderTokens(tokens){
  return tokens.map(t =>
    `<span class="tok tok-${t.category}">${esc(t.token)}<span class="cat">${t.category}</span></span>`
  ).join("");
}

// --------------------------------------------------------- collection ----
function renderStatements(){
  const data = lastResult.statements;
  if (!data) return;
  const tbody = document.querySelector("#statements-table tbody");
  tbody.innerHTML = data.statements.map(s => `
    <tr><td>${s.id}</td><td>${esc(translateTopic(s.topic))}</td><td class="wrap">${esc(s.text)}</td></tr>
  `).join("");
  document.getElementById("stat-statements").textContent = data.statements.length;
}

async function loadStatements(){
  const res = await fetch(`${API}/api/statements`);
  lastResult.statements = await res.json();
  renderStatements();
  return lastResult.statements;
}

document.getElementById("add-statement-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("new-statement-text").value.trim();
  const topic = document.getElementById("new-statement-topic").value;
  if (!text) return;
  await fetch(`${API}/api/statements`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({text, topic})
  });
  document.getElementById("new-statement-text").value = "";
  loadStatements();
});

// ------------------------------------------------------------- lexical ---
document.getElementById("lexer-run-btn").addEventListener("click", runLexer);
document.getElementById("lexer-input").addEventListener("keydown", e => { if (e.key === "Enter") runLexer(); });

async function runLexer(){
  const text = document.getElementById("lexer-input").value.trim();
  if (!text) return;
  const res = await fetch(`${API}/api/lexer/tokenize`, {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text})
  });
  const data = await res.json();
  document.getElementById("lexer-output").innerHTML = renderTokens(data.tokens);
}

function renderFrequency(){
  const data = lastResult.frequency;
  if (!data) return;
  document.querySelector("#freq-table tbody").innerHTML = data.token_frequency
    .slice(0, 25)
    .map(r => `<tr><td>${esc(r.token)}</td><td>${r.count}</td></tr>`).join("");
  document.querySelector("#cat-table tbody").innerHTML = Object.entries(data.category_counts)
    .sort((a,b) => b[1]-a[1])
    .map(([cat,count]) => `<tr><td>${cat}</td><td>${count}</td></tr>`).join("");
  document.getElementById("stat-tokens").textContent = data.token_frequency.length;
}

async function loadFrequency(){
  if (lastResult.frequency){ renderFrequency(); return; } // already fetched once
  const res = await fetch(`${API}/api/lexer/frequency`);
  lastResult.frequency = await res.json();
  renderFrequency();
}

// -------------------------------------------------------------- syntax ---
function grammarNote(stage){
  // French translations of the grammar's own explanatory notes live in
  // grammar.json as note_fr; fall back to the English note if absent.
  return currentLang === "fr" && stage.note_fr ? stage.note_fr : stage.note;
}

function renderGrammar(){
  const stages = lastResult.grammarStages;
  const analysis = lastResult.grammarAnalysis;
  if (!stages || !analysis) return;

  const order = [
    ["original", t("syntax.stage1Label")],
    ["after_left_recursion_removal", t("syntax.stage2Label")],
    ["after_left_factoring", t("syntax.stage3Label")],
  ];
  document.getElementById("grammar-stages").innerHTML = order.map(([key, label]) => {
    const g = stages[key];
    const lines = Object.entries(g.productions).map(([nt, alts]) =>
      `${nt.padEnd(4)} -> ${alts.map(a => a.join(" ")).join(" | ")}`
    ).join("\n");
    return `<div class="stage-card">
      <h4>${esc(label)}</h4>
      <p class="note">${esc(grammarNote(g) || "")}</p>
      <pre>${esc(lines)}</pre>
    </div>`;
  }).join("");

  document.querySelector("#first-table tbody").innerHTML = Object.entries(analysis.first)
    .map(([nt, set]) => `<tr><td>${nt}</td><td class="mono">{ ${set.join(", ")} }</td></tr>`).join("");
  document.querySelector("#follow-table tbody").innerHTML = Object.entries(analysis.follow)
    .map(([nt, set]) => `<tr><td>${nt}</td><td class="mono">{ ${set.join(", ")} }</td></tr>`).join("");

  const nts = Object.keys(analysis.table);
  const terms = new Set();
  nts.forEach(nt => Object.keys(analysis.table[nt]).forEach(t => terms.add(t)));
  const termList = Array.from(terms).sort();

  const table = document.getElementById("ll1-table");
  table.innerHTML = `
    <thead><tr><th></th>${termList.map(t => `<th>${t}</th>`).join("")}</tr></thead>
    <tbody>${nts.map(nt => `
      <tr><th>${nt}</th>${termList.map(term => {
        const prod = analysis.table[nt][term];
        return `<td class="mono">${prod ? esc(prod.join(" ")) : ""}</td>`;
      }).join("")}</tr>
    `).join("")}</tbody>`;

  const verdict = document.getElementById("ll1-verdict");
  if (analysis.is_ll1){
    verdict.textContent = t("syntax.ll1.ok");
    verdict.className = "ll1-verdict ok";
  } else {
    verdict.textContent = `${analysis.conflicts.length} ${t("syntax.ll1.conflicts")}`;
    verdict.className = "ll1-verdict bad";
  }
}

async function loadGrammar(){
  if (lastResult.grammarStages && lastResult.grammarAnalysis){ renderGrammar(); return; }
  const [stagesRes, analysisRes] = await Promise.all([
    fetch(`${API}/api/grammar`), fetch(`${API}/api/grammar/analysis`)
  ]);
  lastResult.grammarStages = await stagesRes.json();
  lastResult.grammarAnalysis = await analysisRes.json();
  renderGrammar();
}

// -------------------------------------------------------------- parser ---
document.getElementById("parser-run-btn").addEventListener("click", runParser);
document.getElementById("parser-input").addEventListener("keydown", e => { if (e.key === "Enter") runParser(); });

/** Turns one parser trace row's language-neutral action_type/action_params
 * (see backend/parser_ll1.py) into localized display text. */
function renderAction(row){
  const p = row.action_params || {};
  switch (row.action_type){
    case "match":   return t("parser.action.match", {terminal: p.terminal});
    case "expand":  return t("parser.action.expand", {nt: p.nonterminal, production: p.production.join(" ")});
    case "accept":  return t("parser.action.accept");
    case "error_expected": return t("parser.action.errorExpected", {expected: p.expected, found: p.found});
    case "error_no_rule":  return t("parser.action.errorNoRule", {nt: p.nonterminal, terminal: p.terminal});
    default: return row.action || "";
  }
}

function renderParseResult(data){
  const banner = data.accepted
    ? `<span class="result-banner accept">✓ ${esc(t("parser.result.accepted"))}</span>`
    : `<span class="result-banner reject">✗ ${esc(t("parser.result.rejected"))}</span>`;

  const skipped = data.skipped_tokens.length
    ? `<p><strong>${esc(t("parser.skippedLabel"))}</strong> ${
        data.skipped_tokens.map(tok => `<code>${esc(tok.token)} [${tok.category}]</code>`).join(", ")
      }</p>` : "";

  const traceRows = data.trace.map(row => `
    <tr><td class="mono">${esc(row.stack)}</td><td class="mono">${esc(row.remaining_input)}</td><td>${esc(renderAction(row))}</td></tr>
  `).join("");

  return `
    ${banner}
    <div class="token-output">${renderTokens(data.tokens)}</div>
    <p><strong>${esc(t("parser.terminalsLabel"))}</strong> <span class="mono">${data.terminals.join(" ")}</span></p>
    ${skipped}
    <div class="table-wrap">
      <table><thead><tr>
        <th>${esc(t("parser.table.stack"))}</th>
        <th>${esc(t("parser.table.remaining"))}</th>
        <th>${esc(t("parser.table.action"))}</th>
      </tr></thead>
      <tbody>${traceRows}</tbody></table>
    </div>
  `;
}

async function runParser(){
  const text = document.getElementById("parser-input").value.trim();
  if (!text) return;
  const res = await fetch(`${API}/api/parser/parse`, {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text})
  });
  lastResult.singleParse = await res.json();
  document.getElementById("parser-single-result").innerHTML = renderParseResult(lastResult.singleParse);
}

function renderSuite(){
  const data = lastResult.suiteParse;
  if (!data) return;
  document.querySelector("#suite-table tbody").innerHTML = data.results.map(r => `
    <tr>
      <td class="wrap">${esc(r.text)}</td>
      <td class="mono">${r.terminals.join(" ")}</td>
      <td><span class="badge ${r.accepted ? "accept" : "reject"}">${
        r.accepted ? esc(t("parser.badge.accepted")) : esc(t("parser.badge.rejected"))
      }</span></td>
    </tr>
  `).join("");
  document.getElementById("stat-accept").textContent = `${data.accepted}/${data.total}`;
}

document.getElementById("run-suite-btn").addEventListener("click", async () => {
  const res = await fetch(`${API}/api/parser/test-suite`);
  lastResult.suiteParse = await res.json();
  renderSuite();
});

// ---------------------------------------------------------- translator ---
document.getElementById("translate-run-btn").addEventListener("click", runTranslate);
document.getElementById("translate-input").addEventListener("keydown", e => { if (e.key === "Enter") runTranslate(); });

// Maps a (from, to) language pair to the backend's direction string. "pidgin" is
// Yo-B's own glossary-backed language; french/english can go direct to each other
// via the online translator only (no Pidgin dictionary path exists for that pair).
const DIRECTION_BY_PAIR = {
  "pidgin>french": "to_french",
  "pidgin>english": "to_english",
  "french>pidgin": "from_french",
  "english>pidgin": "from_english",
  "french>english": "french_to_english",
  "english>french": "english_to_french",
};
const ONLINE_ONLY_DIRECTIONS = new Set(["french_to_english", "english_to_french"]);

const DIRECTION_RESULT_KEY = {
  to_french: "translator.resultLabel.french",
  to_english: "translator.resultLabel.english",
  from_french: "translator.resultLabel.pidgin",
  from_english: "translator.resultLabel.pidgin",
  french_to_english: "translator.resultLabel.english",
  english_to_french: "translator.resultLabel.french",
};

function currentTranslateDirection(){
  const from = document.getElementById("translate-from").value;
  const to = document.getElementById("translate-to").value;
  if (from === to) return null;
  return DIRECTION_BY_PAIR[`${from}>${to}`] || null;
}

function updateTranslateControlState(){
  const from = document.getElementById("translate-from").value;
  const to = document.getElementById("translate-to").value;
  const sameLang = from === to;
  const direction = sameLang ? null : DIRECTION_BY_PAIR[`${from}>${to}`];
  document.getElementById("translate-same-lang-warning").hidden = !sameLang;
  document.getElementById("translate-online-only-warning").hidden = !(direction && ONLINE_ONLY_DIRECTIONS.has(direction));
  document.getElementById("translate-run-btn").disabled = sameLang;
}
document.getElementById("translate-from").addEventListener("change", updateTranslateControlState);
document.getElementById("translate-to").addEventListener("change", updateTranslateControlState);
updateTranslateControlState();

function renderTranslateResult(){
  const data = lastResult.translate;
  if (!data) return "";

  const statusLabelKey = {dictionary: "translator.status.dictionary", online: "translator.status.online", unresolved: "translator.status.unresolved"};

  const words = data.words.map(w => {
    const statusClass = "status-" + w.status;
    const showMeaning = w.meaning && w.meaning !== w.translation;
    return `
      <div class="translate-word ${statusClass}">
        <span class="src">${esc(w.source)}</span>
        <span class="arrow">&#8595;</span>
        <span class="tgt">${esc(w.translation)}</span>
        ${showMeaning ? `<span class="meaning">${esc(w.meaning)}</span>` : ""}
        <span class="translate-word-status ${w.status}">${esc(t(statusLabelKey[w.status]))}</span>
      </div>`;
  }).join("");

  const onlineNote = data.used_online_fallback
    ? `<p class="translate-note info">${esc(t("translator.onlineNote"))}</p>` : "";

  const unresolvedNote = data.unresolved_words.length
    ? `<p class="translate-note warn">${esc(t("translator.unresolvedLabel"))} ${data.unresolved_words.map(esc).join(", ")}</p>` : "";

  return `
    <div class="translate-sentence">
      <span class="label">${esc(t(DIRECTION_RESULT_KEY[data.direction]))}</span>
      ${esc(data.translated_text)}
    </div>
    ${onlineNote}
    ${unresolvedNote}
    <div class="translate-words">${words}</div>
  `;
}

let lastTranslateError = null; // {kind: "server"|"network", message?}

function renderTranslatePanel(){
  const resultBox = document.getElementById("translate-result");
  if (lastTranslateError){
    const msg = lastTranslateError.kind === "network"
      ? t("translator.errorNetwork")
      : (lastTranslateError.message || t("translator.errorFallback"));
    resultBox.innerHTML = `<p class="translate-note warn">${esc(msg)}</p>`;
  } else if (lastResult.translate){
    resultBox.innerHTML = renderTranslateResult();
  }
}

async function runTranslate(){
  const text = document.getElementById("translate-input").value.trim();
  const direction = currentTranslateDirection();
  if (!text || !direction) return;

  const loading = document.getElementById("translate-loading");
  const resultBox = document.getElementById("translate-result");
  loading.hidden = false;
  resultBox.innerHTML = "";
  lastTranslateError = null;

  try {
    const res = await fetch(`${API}/api/translate`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text, direction}),
    });
    const data = await res.json();
    if (!res.ok) {
      lastResult.translate = null;
      lastTranslateError = {kind: "server", message: data.error};
    } else {
      lastResult.translate = data;
    }
  } catch (e) {
    lastResult.translate = null;
    lastTranslateError = {kind: "network"};
  } finally {
    loading.hidden = true;
    renderTranslatePanel();
  }
}

// -------------------------------------------------------------- onboarding
const ONBOARDING_STEPS = 3;
let onboardingStep = 1;

function showOnboardingStep(n){
  onboardingStep = n;
  document.querySelectorAll(".onboarding-step").forEach(el => {
    el.hidden = Number(el.dataset.step) !== n;
  });
  document.querySelectorAll(".onboarding-dots .dot").forEach(el => {
    el.classList.toggle("is-active", Number(el.dataset.dot) === n);
  });
  document.getElementById("onboarding-progress").textContent =
    t("onboarding.progress", {current: n, total: ONBOARDING_STEPS});
  document.getElementById("onboarding-back").classList.toggle("is-invisible", n === 1);
  document.getElementById("onboarding-next").textContent =
    n === ONBOARDING_STEPS ? t("onboarding.finish") : t("onboarding.next");
}

function openOnboarding(){
  document.getElementById("onboarding").hidden = false;
  showOnboardingStep(1);
}

function closeOnboarding(){
  document.getElementById("onboarding").hidden = true;
  localStorage.setItem("yobOnboardingSeen", "true");
}

document.getElementById("onboarding-next").addEventListener("click", () => {
  if (onboardingStep >= ONBOARDING_STEPS) closeOnboarding();
  else showOnboardingStep(onboardingStep + 1);
});
document.getElementById("onboarding-back").addEventListener("click", () => {
  if (onboardingStep > 1) showOnboardingStep(onboardingStep - 1);
});
document.getElementById("onboarding-skip").addEventListener("click", closeOnboarding);
document.getElementById("reopen-onboarding").addEventListener("click", openOnboarding);

// ------------------------------------------------- re-render on language --
// i18n.js calls this after switching language, so every already-visible
// dynamic panel updates immediately without a new network request.
window.onLanguageChanged = function(){
  renderStatements();
  renderFrequency();
  renderGrammar();
  if (lastResult.singleParse){
    document.getElementById("parser-single-result").innerHTML = renderParseResult(lastResult.singleParse);
  }
  renderSuite();
  renderTranslatePanel();
  if (!document.getElementById("onboarding").hidden){
    showOnboardingStep(onboardingStep); // refresh progress text / button labels
  }
};

// ------------------------------------------------------------- boot up ---
(async function init(){
  const bootLoader = document.getElementById("boot-loader");
  try {
    await loadStatements();
    // Pre-warm the accept/reject stat on the overview tab.
    const res = await fetch(`${API}/api/parser/test-suite`);
    lastResult.suiteParse = await res.json();
    document.getElementById("stat-accept").textContent = `${lastResult.suiteParse.accepted}/${lastResult.suiteParse.total}`;
  } catch(e) {
    // Even if the backend isn't reachable yet, don't leave the loading screen up forever.
  } finally {
    bootLoader.classList.add("is-hidden");
    setTimeout(() => bootLoader.remove(), 400);
  }

  if (!localStorage.getItem("yobOnboardingSeen")) openOnboarding();
})();
