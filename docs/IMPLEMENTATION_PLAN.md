# Francanglais Studio: Implementation Plan

Updated: 2026-09-07. Status: approved scope change; implementation remains phased.
"Francanglais Studio" is a working display name, not a repository or package rename.
This document supersedes the earlier general multilingual-analyzer plan.

## 1. Product Scope

Build an explainable lexical and syntactic analyzer for **Cameroonian Francanglais only**,
using a small corpus of urban speech collected in Yaounde. The target is the Cameroonian
contact variety/argot described by the user, not generic French with English words added.
Recognize the alternate name "frananglais" in the project narrative without rewriting
the spelling of any collected statement.

- Francanglais is the single target variety. French, English, Cameroon Pidgin English,
  and local-language influences are part of its mixed vocabulary, not separate modes.
- No language selector, independent French/English/Pidgin/local-language parsers,
  automatic translation, or general-purpose language detection belongs in this scope.
- Preserve borrowed vocabulary, slang, creative constructions, spelling variation,
  and incomplete speech. Do not normalize the corpus into standard French.
- Learn the project's lexical rules and CFG from the reviewed corpus. Do not claim
  to define a universal grammar or enforce a single standardized Francanglais syntax.
- A successful parse means "fits the supported grammar", not "authentic Francanglais".
  Authenticity and target-variety suitability need human review; grammatical acceptance
  alone cannot distinguish Francanglais from every structurally similar French phrase.
- Keep language-origin candidates as optional, evidence-backed annotations, including
  uncertain/shared origins. Duala, Ewondo, Bassa, or other influences are annotated only
  when supported, without claiming independent language support or guessing ethnicity.
- Keep the interface and report in English initially; French interface localization is
  a separate future product choice, not another analysis language.

The CS4110 brief has a broader multilingual framing. Retain its Yaounde collection
setting, topic coverage, compiler algorithms, and submission requirements, and confirm
with the instructor that this Francanglais-specific interpretation is acceptable.
Douala can appear in sourced background discussion, but does not replace the required
Yaounde field collection. Historical and linguistic claims need genuine references.

## 2. Current State And Boundaries

There are two independent Git repositories in the same VS Code workspace:

| Repository folder | Responsibility |
| --- | --- |
| `C:/Users/kynm/Desktop/Language Analyser` | React/TypeScript/Vite frontend and this shared plan |
| `C:/Users/kynm/Desktop/Language Analyser backend` | Python package, compiler contracts, corpus, tests, future API and deployment |

Do not nest either repository inside the other or change their Git remotes.
Keep the existing `yaounde_analyzer` package name and public contracts unless an
explicitly required migration is introduced and tested.

The foundation already includes Python models, corpus import validation, twelve
synthetic demo statements, tests, and a Vite React scaffold. Twenty backend tests,
backend lint/type checks, and the frontend build/lint passed during the previous task.
Those are historical foundation checks, not validation of this new linguistic scope.
There is no implemented lexer, LL(1) parser, production UI, authentication, or deployment
yet. The current React starter page is not the intended product design.

This revision changes planning and collection guidance only. It does not imply that
the existing fixtures have been linguistically reviewed or that runtime behavior changed.

## 3. Francanglais Corpus Workflow

1. Split collection across the three group members, targeting five statements each
   for a final set of 10-15 genuinely observed Francanglais utterances.
2. Cover naturally occurring taxi/commuting, internet, electricity, bargaining, rain,
   fuel, roadside business, bendskin, security, and university topics. Track gaps;
   do not stage conversations or invent examples to fill a category.
3. Explain the coursework and obtain appropriate permission before recording or
   retaining identifiable conversation. Public use of a quote needs separate approval.
   Prefer ordinary, safe interactions; do not seek sensitive checkpoint encounters.
4. Manually transcribe exactly what was heard, including accents, repetitions, slang,
   pauses/truncations under a consistent convention, and incomplete constructions.
   Mark inaudible material explicitly rather than guessing. Keep any gloss separate.
5. Record the collector, real observation context/date when known, transcription
   attestation, and review notes. Minimize personal information and use anonymous IDs.
   Audio, if consented, stays private and outside the application's first release.
6. Have another Francanglais-familiar group member review both the transcription and
   suitability for the target corpus. Record disagreements and uncertainty. A fixed
   number of borrowed English words is not a sound acceptance criterion.
7. Select the final 10-15 reviewed entries. Keep doubtful/out-of-scope observations
   separately labelled; report exclusions and never rewrite them to fit the grammar.

Audit and revise the twelve existing synthetic fixtures before using them to guide
the Francanglais grammar. They remain `source_kind: "demo"`, visibly separated from
field data in every view, metric, screenshot, and export. A boolean attestation is a
declaration, not proof of authenticity; real observation and peer review remain essential.

In the next implementation phase, add explicit dataset-level
`target_variety: "cameroon_francanglais"`, review status, and provenance metadata.
Keep this target separate from `Token.language_candidates`. Preserve original wording
and append-only revisions; anonymized public text is a separate, approved projection.
The existing import schema remains unchanged until those contracts are implemented.

## 4. Implementation Roadmap

### Phase 1: Scope Alignment And Foundation Completion

- Reuse the implemented scaffolding in both repos; do not restart the project.
- Add and test target-variety/review metadata, stronger provenance/export checks,
  and the reviewed Francanglais demo fixtures. Never automatically relabel demo as field.
- Preserve token source spans, POS, slang/register, and borrowing-origin annotations
  as independent dimensions. Do not replace syntactic categories with a variety label.
- Complete isolated Python environment/dependency locking and frontend test/typecheck
  scripts. The earlier system-Python setup is not a reproducible-environment guarantee.
- Start genuine collection in parallel. Freeze a few independently annotated token
  examples as lexer oracles before deriving expected results from implementation output.

Gate: both repos still build/test independently; raw Unicode round-trips unchanged;
demo records cannot enter a final-study export; vocabulary-origin uncertainty is retained.

### Phase 2: Python Compiler Core

1. Implement Unicode-aware regex scanning and a curated Francanglais lexicon. Use
   anchored, non-empty matches, longest-match precedence, and explicit tie priorities.
   Match documented multiword expressions without treating whole statements as tokens.
2. Preserve original code-point offsets and raw lexemes. Apply NFC/casefold only to
   lookup forms; additional spelling equivalences need reviewed mappings. Preserve
   accents and apostrophes. Keep trivia explicit and never silently drop unknown words.
3. Construct a descriptive CFG from observed structures, with production IDs and
   supporting statement IDs. Avoid a catch-all rule that accepts arbitrary word order.
4. Show original and transformed productions: remove left recursion where applicable,
   then factor common RHS symbol prefixes. Keep a transformation ledger and reject
   unsupported cyclic/nullable cases instead of promising arbitrary CFG-to-LL(1) conversion.
   If a transformation is unnecessary, say so and use a separately labelled teaching fixture.
5. Compute nullable, FIRST of complete sequences, FOLLOW, SELECT sets, and the LL(1)
   table to a fixed point. Epsilon is an empty RHS, not a lookahead; EOF is reserved.
   Report FIRST/FIRST and FIRST/FOLLOW table conflicts without choosing a rule silently.
6. Implement an explicit-stack, table-driven parser consuming the actual lexer tokens.
   Accept only when input and stack finish together. Return the trace, applied rules,
   expected terminals, error span, and a full or explicitly partial parse tree.
7. Expose a usable CLI for analysis, grammar inspection, corpus validation/evaluation,
   and JSON/CSV evidence exports. Keep the compiler independent of FastAPI and the UI.

Unknown vocabulary, unsupported structure, invalid grammar configuration, and resource
limits are distinct outcomes. Do not label every unsuccessful analysis a syntax error.
Regex and grammar parsing are custom coursework logic; use established libraries for
infrastructure and, optionally, an independent test-only parser oracle.

Gate: hand-computed sets/table cells agree; accepted, known-token rejected, unknown-word,
epsilon, ambiguous-table, and trailing-input cases produce correct bounded behavior.

### Phase 3: Shared App And Production UI

- Add FastAPI, SQLite, SQLAlchemy/migrations, private corpus editing, peer review,
  approved public samples, analysis snapshots, and restricted evidence exports.
- Provision three individual group accounts with no public signup. Use established
  authentication, revocable database-backed sessions, secure HttpOnly host-only cookies,
  CSRF/Origin protection, and server-side authorization on every protected operation.
- Prevent overwritten edits with revision checks and a visible conflict-resolution
  state. Editing published wording invalidates its previous public approval.
- Generate typed frontend contracts from the API once available. All analysis, tables,
  and counts come from Python; React must not duplicate or simulate the parser.
- Implement the visual/interaction specification below. Design the Analyzer first,
  then Corpus, Grammar, Statistics, and evidence export flows against real results.
- Scope raw/canonical counts, spelling-variant groups, multiword counts, topic evidence,
  and borrowing-origin annotations to a selected corpus revision. Use transparent
  multi-label topic rules; topics do not decide grammatical acceptance.

Gate: complete analyze/review/export workflows, privacy and stale-edit tests, responsive
browser checks, and the accessibility/performance criteria below. Production standard
is an acceptance requirement, not a claim based solely on attractive screenshots.

### Phase 4: VPS Release

- Preserve the existing Ubuntu-hosted Nginx, domain/TLS setup, and other hosted sites
  on the user's 4 GB VPS. No managed cloud platform or replacement reverse proxy.
- Build the frontend in its own repo. Feed a versioned frontend build artifact into
  the backend's release image; record both repository revisions and lock dependencies.
  This creates one deployment artifact without merging the repositories.
- Serve the compiled SPA and FastAPI behind the same origin. Restrict SPA fallbacks so
  missing API/asset routes remain errors. Run no Vite development server in production.
- Bind the app container only to an unused loopback port, provisionally
  `127.0.0.1:8010`, behind Nginx HTTPS. Use non-root execution, a persistent SQLite
  volume, health checks, trusted proxy headers, log rotation, and measured resource limits.
- Limit anonymous input size, parsing work, trace size, login attempts, and analysis
  request rate. Do not persist or log anonymous text, credentials, or session cookies.
- Back up SQLite through its consistent online backup API, keep a protected off-VPS
  copy, and verify restoration into an isolated volume. Plan schema-aware rollbacks.
- Bundle fonts, media, specs, and a reviewed dataset for a genuine offline local demo.
  Do not silently display precomputed output when a live request fails.

Gate: HTTPS and direct-link navigation work; the app port is not publicly reachable;
data survives container recreation; restored snapshots reproduce results; other sites
remain unaffected; local demonstration works with internet disconnected.

### Phase 5: Academic Evidence

- Freeze a reviewed 10-15-statement Francanglais field corpus and evaluate every entry.
  Keep any constructed negative tests visibly separate from authentic observations.
- Export raw statements, token tables, regex rules, source/transformed CFG, calculations,
  complete LL(1) table, accepted/rejected results, and real application screenshots.
- Produce a 25-30 page report, never exceeding 30 rendered pages, plus an editable
  PowerPoint presentation and reproducible source/test bundle.
- Discuss Francanglais creativity, code mixing/borrowing, orthographic variation,
  context-dependent meaning, incomplete speech, and limits of a small formal grammar.
  Separate sourced background from findings actually supported by this small corpus.
- Rehearse a 10-minute group presentation with roughly 3-minute individual sections;
  clarify the brief's timing ambiguity with the instructor. Use the offline app as fallback.

Suggested milestones before the September 29 examination: compiler by September 15,
integrated app by September 20, real-corpus/deployment freeze September 23, report/slides
September 26, rehearsals September 27-28. These are targets, not completed work.

## 5. Visual Direction

### Identity And Composition

Create a **distinctive editorial research workbench**, combining expressive typography,
controlled color, tactile background detail, and clearly structured compiler evidence.
The interface should feel intentional and finished, without becoming a marketing page.

- Make the working product name, "Francanglais Studio", visible in the first viewport.
  Place the actual analyzer immediately below the compact application header.
- Use an unframed page layout with a constrained content width of approximately
  1440 px, clear navigation, 24-32 px desktop gutters, and 16 px mobile gutters.
- Desktop: source editor on the left and analysis output on the right; full-width
  trace/table detail beneath. Mobile: source, result summary, then tabbed evidence.
- Use flat sections, thin separators, and a consistent 4/8 px spacing scale. Reserve
  framed surfaces for actual editors, dialogs, and repeated items; no nested cards.
- Use 6 px corner radii for controls/panels, never above 8 px for cards. Avoid oversized
  headings, excessive empty space, decorative badge walls, and glass over readable data.

### Color System

Define shared CSS variables and reuse the same semantics in charts, diagrams, and exports.
Use neutral surfaces for most of the canvas, forest green for principal actions, cobalt
for secondary selection/focus, and restrained warm accents. Avoid a single-hue wash,
purple gradients, dark-slate dominance, or an all-beige visual theme.

| Token | Value | Intended use |
| --- | --- | --- |
| `--color-canvas` | `#F4F6F5` | Main neutral canvas beneath subtle texture |
| `--color-surface` | `#FFFFFF` | Editor, menus, tables, and dialogs |
| `--color-ink` | `#1F2924` | Primary text |
| `--color-muted` | `#56645C` | Secondary text, never disabled-only contrast for useful content |
| `--color-primary` | `#17664A` | Primary actions with white text |
| `--color-primary-hover` | `#105039` | Primary hover/pressed emphasis |
| `--color-cobalt` | `#2E5BCC` | Links, focus rings, secondary selection |
| `--color-gold` | `#E2BC58` | Sparse decorative accents; not small text on white |
| `--color-border` | `#D6DFD9` | Decorative separators, not sole interactive boundaries |
| `--color-control-border` | `#78847D` | Necessary input/control boundaries |
| `--color-success` | `#17664A` | Supported/accepted status text |
| `--color-success-bg` | `#E8F3EC` | Success status background |
| `--color-warning` | `#83540C` | Unknown vocabulary or review-needed text |
| `--color-warning-bg` | `#FFF3D6` | Warning background |
| `--color-error` | `#AD3546` | Rejection/operation-error text with a specific reason |
| `--color-error-bg` | `#FBECEF` | Error background |

Always distinguish lexical categories from acceptance/review states. Token highlighting
uses a stable, labelled POS legend; borrowed origin is additional metadata, not an
independent language-mode color scheme. Never rely on color alone for meaning.

### Background And Visual Assets

- Layer the neutral canvas with a very low-opacity, locally bundled grain bitmap and
  a faint structured grid near the page margins. Keep actual text and tables on clean
  surfaces. Detail should add depth without reducing contrast or distracting from results.
- Use one locally stored, permission-cleared Yaounde urban/campus photograph in a
  compact masthead strip, approximately 80-120 px high on desktop. It provides real
  context; it must not displace the analyzer or be presented as field-research evidence.
- Do not use the photo behind form text. Avoid identifiable faces/plates, incorrect
  landmarks, heavy blur, decorative dark overlays, or misleading stock imagery.
  Until an approved asset exists, use the texture/grid treatment without a substitute claim.
- Reduce or omit the photo strip on short/mobile viewports; keep the input and primary
  action visible promptly. Reserve image dimensions to prevent layout shifts.
- Parse trees, highlighted token spans, and corpus charts are the principal data
  visuals. Use established visualization/layout libraries and genuine API results.
- No floating orbs, bokeh blobs, particle backgrounds, full-screen travel hero, or
  constant parallax. Do not imitate cultural identity with arbitrary flag stripes.

### Typography

- Bricolage Grotesque for compact product/page headings; Source Sans 3 for UI/body
  text; IBM Plex Mono for tokens, productions, parsing stacks, and numeric evidence.
- Self-host a small set of WOFF2 weights with French/extended-Latin coverage. Use
  `font-display: swap`, test combining marks, and avoid runtime font-CDN dependencies.
- Target 16 px body, 14 px dense tables, and 24-32 px page headings. Use fixed/rem
  scales and responsive wrapping, never viewport-scaled font sizes.
- Keep letter spacing at zero. Preserve literal transcript whitespace where meaningful;
  long words must wrap or scroll inside the relevant editor, never overlap adjacent UI.

## 6. Screen And Interaction Specification

| View | Required experience |
| --- | --- |
| Analyzer | Original-text editor; labelled demo/approved-field sample selection; explicit Analyze action; token highlighting and sortable token evidence; accepted/unsupported result with reason; Trace/Tree tabs; visible analyzer/spec version |
| Corpus | Searchable table filtered by source/topic/review; add/edit drawer; raw versus public projection; reviewer notes; revision conflict handling; explicit publication approval; batch analysis |
| Grammar | Original/transformed rule views; transformation ledger; lexical specification; nullable/FIRST/FOLLOW; LL(1) table with sticky headers; selected trace step highlights its rule and table cell |
| Statistics | Raw/canonical frequency comparison; observed spellings; reviewed origin annotations and uncertainty; topic evidence; accepted/rejected counts; accessible tabular equivalents to charts |
| Evidence Export | Selected corpus/spec snapshot; included artifacts and privacy scope; draft/demo distinction; valid CSV/JSON/evidence bundle; separate reviewed academic-report workflow |

- Use Lucide icons for tool controls, tooltips for unfamiliar icons, tabs for views,
  segmented controls for trace/tree or comparison modes, and checkboxes/toggles for
  binary choices. Use labelled buttons for real commands such as Analyze or Publish.
- Provide complete empty, loading, success, rejection, validation, permission-denied,
  expired-session, network-error, rate-limit, stale-result, and edit-conflict states.
- Preserve unsaved input through recoverable errors. Warn before discarding edits.
  Editing input marks previous output stale; an older response cannot replace results
  for newer input. Do not invent results, fake progress, or claim changes were saved early.
- Never show instructional marketing copy or decorative explanations of app features.
  The visible content is the user's data, formal analysis, concise labels, and actionable
  diagnostics. Educational grammar explanations are actual project evidence.
- Keep private data out of anonymous views, public statistics, exports, and frontend
  build assets. Public analysis is ephemeral; saving belongs to the protected workflow.

## 7. Motion Specification

Use CSS transitions for simple feedback and the maintained Motion React library only
where coordinated transitions or playback benefit from it. Favor opacity/transform;
do not animate layout dimensions that move the editor or tables during interaction.

| Interaction | Motion budget | Purpose |
| --- | --- | --- |
| Initial app reveal | 280-360 ms; 40 ms stagger over at most four regions | Establish hierarchy once per visit |
| View transition | 160-220 ms fade and optional 4-8 px translation | Preserve navigation continuity |
| Hover, focus, token selection | 120-160 ms color/opacity | Indicate the active control or evidence |
| Result arrival | Up to 220 ms, no artificial wait | Connect the submitted input to actual returned results |
| Parser playback | User-controlled 300-800 ms per step | Synchronize stack, lookahead, production, table cell, and tree |
| Corpus row update | Brief highlight under 500 ms | Confirm which saved revision changed |

Parser playback needs Play/Pause, Previous/Next, Reset, a progress position, and a
speed control. It starts manually and remains separate from the actual computation.
Show final analysis immediately; animation is an optional explanation, not processing.
Avoid infinite ambient motion, spring overshoot on tables, confetti, and bouncing badges.

Honor `prefers-reduced-motion`: remove stagger/translations and automatic playback,
use immediate transitions, and retain full manual trace navigation. Every animation
must be interruptible and must not steal focus or block input.

## 8. Production Acceptance Criteria

### Accessibility And Responsiveness

- Target WCAG 2.2 AA: normal text contrast at least 4.5:1, large text and required
  non-text control indicators at least 3:1. Check every actual state/background pairing.
- Provide keyboard navigation, visible focus, semantic headings/tables, form labels,
  associated errors, accessible tab controls, dialog focus containment/restoration,
  and restrained screen-reader status announcements. Trees also have a text trace.
- Aim for 44 px touch targets, including compact icon buttons. Do not use tooltips
  as the sole accessible label or color as the only result indicator.
- Verify widths 360, 390, 768, 1024, and 1440 px, short laptop heights, and 200% zoom.
  Wide grammar tables/tree diagrams scroll within their own regions; the page should
  not overflow horizontally. Controls/text never overlap, truncate essential results,
  or shift because a label, loading state, or selected sample is longer.
- Test reduced motion, slow network, offline/error handling, long Francanglais forms,
  accents, decomposed Unicode, and non-BMP input. Convert Python code-point spans
  correctly before highlighting JavaScript UTF-16 strings.

### Performance And Reliability

- Goals: LCP <= 2.5 seconds, INP <= 200 ms, CLS < 0.1 under representative usage.
  These are targets, not measured results or guarantees for every connection.
- Set an initial first-route JavaScript budget of 250 KiB gzip; lazy-load charts,
  tree visualization, and protected editing screens. Bundle only necessary icon/font
  weights, compress contextual images, and reserve all media/diagram dimensions.
- Use repeatable Lighthouse runs to investigate loading/layout; measure interaction
  responsiveness in browser traces and field metrics only when valid data exists.
  Do not describe Lighthouse proxy measurements as measured field INP.
- Validate production builds, loading/error/retry behavior, no console exceptions,
  safe rendering of transcript text, request cancellation/stale-response handling,
  and bounded compiler execution. No credentials or private corpora in client bundles.
- Use Playwright screenshots and workflow assertions on desktop/mobile, an accessibility
  checker such as axe plus manual keyboard review, and backend tests for every API
  authorization/publication/export boundary. Screenshot beauty alone is insufficient.
- Test save conflicts, expired sessions, public/private separation, restart persistence,
  backup restoration, and absent/invalid API responses before calling the app production-ready.

## 9. Required Features And Deferrals

Required in the finished project: Francanglais-only corpus/CFG, custom lexer/parser,
transparent transformations/table/trace, vocabulary variations, topic evidence, reviewed
collaboration, reproducible exports, the visual system and interaction states above,
responsive accessible screens, and the academic deliverables.

Prioritize the synchronized parsing visualizer, source-versus-canonical comparisons,
unknown-word review queue, and evidence-quality screenshots after the basic pipeline
works. They directly improve understanding and demonstration quality.

Defer independent language modes, automatic transcription/translation, LLM-generated
analysis, unrestricted online grammar/regex editing, real-time co-editing, a second
parser algorithm, multi-tenant signup, and a decorative landing page. A second theme
is optional later; one fully tested, visually coherent theme comes first.

## 10. Immediate Next Implementation

Start in the backend with the target-variety/review contract and a small validated
Francanglais fixture set, then implement and test the lexer. In parallel, replace
the frontend starter with the specified application shell and design tokens.
Do not present mock analysis as working functionality: connect the Analyzer to the
actual API when available, showing an honest unavailable state until then.