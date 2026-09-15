import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { m } from 'motion/react'
import { fetchGrammar, AnalysisApiError } from '../../domain/api'
import type { GrammarSpec, GrammarView as GrammarViewData, Production } from '../../domain/api'
import { fadeInUp, staggerContainer } from '../../motion/presets'

const EOF_SYMBOL = '$'

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const subheadingClass = 'text-caption font-semibold tracking-[0.08em] text-faint uppercase'
const sectionNoteClass = 'max-w-prose text-small text-muted'
const inlineCodeClass = 'rounded bg-surface-inset px-1 py-0.5 font-mono text-[0.9em] text-ink'
const tableWrapClass = 'overflow-x-auto rounded-panel border border-hairline'
const thClass = 'border-b border-hairline px-3 py-2.5 font-semibold whitespace-nowrap text-muted'
const tdClass = 'px-3 py-2.5 align-top text-muted'
const trClass = 'border-b border-hairline transition-colors last:border-0 hover:bg-surface-inset'

function groupByLhs(grammar: GrammarSpec): readonly (readonly [string, readonly Production[]])[] {
  const groups = new Map<string, Production[]>()
  for (const production of grammar.productions) {
    const bucket = groups.get(production.lhs)
    if (bucket) bucket.push(production)
    else groups.set(production.lhs, [production])
  }
  return grammar.nonterminals
    .filter((nonterminal) => groups.has(nonterminal))
    .map((nonterminal) => [nonterminal, groups.get(nonterminal) ?? []] as const)
}

function formatRhs(rhs: readonly string[]): string {
  return rhs.length > 0 ? rhs.join(' ') : 'ε'
}

function RuleList({ grammar }: Readonly<{ grammar: GrammarSpec }>) {
  return (
    <div className="flex flex-col gap-2.5">
      {groupByLhs(grammar).map(([lhs, productions]) => (
        <div
          className="flex gap-3 rounded-panel border border-hairline bg-surface px-3.5 py-3"
          key={lhs}
        >
          <span className="min-w-16 font-mono text-small font-semibold text-ink">{lhs}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {productions.map((production, index) => (
              <p className="flex items-baseline gap-2 font-mono text-small" key={production.id}>
                <span className="text-info">{index === 0 ? '→' : '|'}</span>
                <span className="flex-1 wrap-anywhere text-ink">{formatRhs(production.rhs)}</span>
                <span className="text-[10px] text-faint">{production.id}</span>
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function GrammarView() {
  const [data, setData] = useState<GrammarViewData | null>(null)
  const [error, setError] = useState('')
  const [lexiconSearch, setLexiconSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchGrammar()
      .then((view) => { if (!cancelled) setData(view) })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof AnalysisApiError ? err.message : 'Could not load the grammar.')
        }
      })
    return () => { cancelled = true }
  }, [])

  const columns = useMemo(() => {
    if (!data) return []
    return [...data.grammar.terminals, EOF_SYMBOL]
  }, [data])

  const productionById = useMemo(() => {
    const map = new Map<string, Production>()
    if (data) for (const production of data.grammar.productions) map.set(production.id, production)
    return map
  }, [data])

  const tableCell = useMemo(() => {
    const map = new Map<string, string>()
    if (data) {
      for (const entry of data.table_entries) map.set(`${entry.nonterminal}\u0000${entry.terminal}`, entry.production_id)
    }
    return map
  }, [data])

  const visibleLexicon = useMemo(() => {
    if (!data) return []
    // Match the accent-insensitive lookup the lexer uses, so searching 'reseau' finds 'réseau'.
    const needle = fold(lexiconSearch.trim())
    if (!needle) return data.lexicon
    return data.lexicon.filter((entry) =>
      fold(
        [
          entry.canonical,
          entry.terminal,
          entry.part_of_speech,
          entry.description,
          entry.language_candidates.join(' '),
        ].join(' '),
      ).includes(needle),
    )
  }, [data, lexiconSearch])

  if (error) {
    return (
      <section className="panel p-6 lg:p-8" aria-labelledby="grammar-heading">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle size={34} strokeWidth={1.4} aria-hidden="true" className="text-danger" />
          <h3 id="grammar-heading" className="text-h3 text-ink">Could not load the grammar</h3>
          <p role="alert" className="text-small text-danger">{error}</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="panel p-6 lg:p-8" aria-labelledby="grammar-heading">
        <h2 id="grammar-heading" className="sr-only">Specification</h2>
        <p className="text-small text-muted">Loading grammar…</p>
      </section>
    )
  }

  return (
    <m.section
      className="panel flex flex-col gap-8 p-6 lg:p-8"
      aria-labelledby="grammar-heading"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <m.div variants={fadeInUp} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-faint">GRAMMAR</span>
          <h2 id="grammar-heading" className="text-h2 text-ink">Specification</h2>
          <p className="mt-2 max-w-2xl text-small text-muted">
            The rules the analyzer actually runs: the word list it recognises, the grammar
            before and after transformation, and the parsing table derived from them.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-caption font-semibold ${
            data.table_conflicts.length === 0
              ? 'bg-success-subtle text-success'
              : 'bg-danger-subtle text-danger'
          }`}
        >
          {data.table_conflicts.length === 0 ? 'LL(1): conflict-free' : `${data.table_conflicts.length} conflicts`}
        </span>
      </m.div>

      <m.div variants={fadeInUp} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h3 className={subheadingClass}>Lexical specification</h3>
          <span className="tabular text-caption text-faint" data-testid="lexicon-count">
            {visibleLexicon.length} of {data.lexicon.length} entries
          </span>
        </div>
        <input
          type="search"
          aria-label="Search the lexicon"
          placeholder="Search word, terminal, origin, or meaning"
          value={lexiconSearch}
          data-testid="lexicon-search"
          onChange={(event) => setLexiconSearch(event.target.value)}
          className="h-11 w-full rounded-control border border-hairline bg-surface-inset px-3.5 text-small text-ink transition-colors placeholder:text-faint hover:border-strong focus:border-accent focus:outline-none"
        />
        <div className={tableWrapClass} role="region" aria-label="Lexical specification" tabIndex={0}>
          <table className="w-full min-w-[46rem] border-collapse text-small">
            <thead>
              <tr className="bg-surface-sunken text-left">
                {['Canonical', 'Terminal', 'POS', 'Slang', 'Origin', 'Description'].map((head) => (
                  <th key={head} className={thClass}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLexicon.map((entry) => (
                <tr key={entry.rule_id} className={trClass}>
                  <td className={`${tdClass} font-mono whitespace-nowrap text-ink`}>{entry.canonical}</td>
                  <td className={`${tdClass} font-mono whitespace-nowrap text-accent`}>{entry.terminal}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{entry.part_of_speech}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {entry.is_slang && (
                      <span className="rounded-full bg-highlight/15 px-2 py-0.5 text-[10px] font-semibold text-highlight uppercase">
                        yes
                      </span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{entry.language_candidates.join(', ')}</td>
                  <td className={tdClass}>{entry.description}</td>
                </tr>
              ))}
              {visibleLexicon.length === 0 && (
                <tr>
                  <td className={`${tdClass} text-center`} colSpan={6} data-testid="lexicon-empty">
                    No lexicon entries match “{lexiconSearch}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </m.div>

      <m.div variants={fadeInUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className={subheadingClass}>Original rules</h3>
          <p className={sectionNoteClass}>
            The grammar as written by hand, describing the sentence shapes Francanglais
            actually uses. Readable, but not directly usable: rules like{' '}
            <code className={inlineCodeClass}>Seq → Seq CONJ Unit</code> refer to themselves
            on the left, which would send a top-down parser into infinite recursion.
          </p>
          <RuleList grammar={data.descriptive_grammar} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className={subheadingClass}>Transformed (executable) rules</h3>
          <p className={sectionNoteClass}>
            The same language, rewritten mechanically so it can be parsed reading left to
            right with one word of lookahead. Names ending in{' '}
            <code className={inlineCodeClass}>'</code> are generated helpers, and{' '}
            <code className={inlineCodeClass}>ε</code> means “match nothing here”.
          </p>
          <RuleList grammar={data.grammar} />
        </div>
      </m.div>

      <m.div variants={fadeInUp} className="flex flex-col gap-3">
        <h3 className={subheadingClass}>Transformation ledger</h3>
        <p className={sectionNoteClass}>
          Every rewrite applied to get from the original rules to the executable ones, and
          the rule ids it produced. It is the audit trail showing the transformed grammar
          accepts the same language rather than a different one.
        </p>
        {data.transformation_steps.length === 0 ? (
          <p className="text-small text-muted">No transformation was necessary.</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {data.transformation_steps.map((step, index) => (
              <li key={index} className="rounded-panel border border-hairline bg-surface p-3.5">
                <span className="text-[10px] font-semibold tracking-[0.06em] text-info uppercase">
                  {step.kind.replaceAll('_', ' ')}
                </span>
                <p className="mt-1.5 text-small text-ink">{step.description}</p>
                <p className="mt-1.5 font-mono text-caption text-faint">
                  {step.source_production_ids.join(', ')}
                  {' → '}
                  {step.result_production_ids.join(', ')}
                </p>
              </li>
            ))}
          </ol>
        )}
      </m.div>

      <m.div variants={fadeInUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className={subheadingClass}>Nullable</h3>
          <p className={sectionNoteClass}>
            Rule names that are allowed to match nothing at all. Needed because if a symbol
            can vanish, the parser has to look past it to decide what comes next.
          </p>
          <p className="rounded-panel border border-hairline bg-surface-inset p-3.5 font-mono text-small text-ink">
            {data.nullable.length > 0 ? data.nullable.join(', ') : 'none'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className={subheadingClass}>FIRST / FOLLOW</h3>
          <p className={sectionNoteClass}>
            FIRST is every word type that can <em>start</em> a symbol; FOLLOW is every word
            type that can come <em>directly after</em> it. Together they are what let the
            parser pick the right rule from a single word of lookahead.
          </p>
          <div className={tableWrapClass} role="region" aria-label="FIRST and FOLLOW sets" tabIndex={0}>
            <table className="w-full border-collapse text-small">
              <thead>
                <tr className="bg-surface-sunken text-left">
                  {['Symbol', 'FIRST', 'FOLLOW'].map((head) => (
                    <th key={head} className={thClass}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.grammar.nonterminals.map((symbol) => {
                  const first = data.first.find((s) => s.symbol === symbol)
                  const follow = data.follow.find((s) => s.symbol === symbol)
                  return (
                    <tr key={symbol} className={trClass}>
                      <td className={`${tdClass} font-mono text-ink`}>{symbol}</td>
                      <td className={`${tdClass} font-mono`}>{first?.terminals.join(', ') ?? ''}</td>
                      <td className={`${tdClass} font-mono`}>{follow?.terminals.join(', ') ?? ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </m.div>

      <m.div variants={fadeInUp} className="flex flex-col gap-3">
        <h3 className={subheadingClass}>LL(1) table</h3>
        <p className={sectionNoteClass}>
          The parser's decision table. Find the row for the rule it is currently expanding
          and the column for the next word, and the cell names the rule to apply. A blank
          cell means that word cannot appear there, which is exactly how a syntax error is
          detected. “Conflict-free” means no cell holds two rules, so one word of lookahead
          is always enough and no guessing or backtracking is ever needed.
        </p>
        <div
          className="max-h-[30rem] overflow-auto rounded-panel border border-hairline"
          role="region"
          aria-label="LL(1) parsing table"
          tabIndex={0}
        >
          <table className="w-full border-collapse text-center text-small">
            <thead>
              <tr className="bg-surface-sunken">
                <th className="sticky top-0 left-0 z-30 border-b border-hairline bg-surface-sunken px-3 py-2.5 text-left font-mono text-caption whitespace-nowrap text-muted">
                  NT \ T
                </th>
                {columns.map((terminal) => (
                  <th
                    key={terminal}
                    className="sticky top-0 z-20 border-b border-hairline bg-surface-sunken px-3 py-2.5 font-mono text-caption whitespace-nowrap text-muted"
                  >
                    {terminal}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.grammar.nonterminals.map((nonterminal) => (
                <tr key={nonterminal} className={trClass}>
                  <th className="sticky left-0 z-10 border-b border-hairline bg-surface-sunken px-3 py-2.5 text-left font-mono text-caption whitespace-nowrap text-ink">
                    {nonterminal}
                  </th>
                  {columns.map((terminal) => {
                    const productionId = tableCell.get(`${nonterminal}\u0000${terminal}`)
                    const production = productionId ? productionById.get(productionId) : undefined
                    return (
                      <td
                        key={terminal}
                        className="min-w-16 border-b border-hairline px-3 py-2.5 font-mono text-caption whitespace-nowrap text-accent"
                      >
                        {production ? (
                          <span title={`${production.lhs} → ${formatRhs(production.rhs)}`}>
                            {productionId}
                          </span>
                        ) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.table_conflicts.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {data.table_conflicts.map((conflict) => (
              <li
                key={`${conflict.nonterminal}-${conflict.terminal}`}
                className="rounded-panel border border-danger/30 bg-danger-subtle p-3.5"
              >
                <span className="text-[10px] font-semibold tracking-[0.06em] text-danger uppercase">
                  conflict
                </span>
                <p className="mt-1.5 font-mono text-small text-danger">
                  {conflict.nonterminal} / {conflict.terminal}: {conflict.production_ids.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </m.div>
    </m.section>
  )
}
