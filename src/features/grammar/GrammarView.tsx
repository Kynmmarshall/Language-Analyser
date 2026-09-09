import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { fetchGrammar, AnalysisApiError } from '../../domain/api'
import type { GrammarSpec, GrammarView as GrammarViewData, Production } from '../../domain/api'
import './grammar.css'

const EOF_SYMBOL = '$'

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
    <div className="rule-list">
      {groupByLhs(grammar).map(([lhs, productions]) => (
        <div className="rule-group" key={lhs}>
          <span className="rule-lhs">{lhs}</span>
          <div className="rule-alternatives">
            {productions.map((production, index) => (
              <p className="rule-alt" key={production.id}>
                <span className="rule-arrow">{index === 0 ? '→' : '|'}</span>
                <span className="rule-rhs">{formatRhs(production.rhs)}</span>
                <span className="rule-id">{production.id}</span>
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

  if (error) {
    return (
      <section className="grammar-view" aria-labelledby="grammar-heading">
        <div className="analysis-placeholder analysis-error">
          <AlertTriangle size={38} strokeWidth={1.4} aria-hidden="true" />
          <h3>Could not load the grammar</h3>
          <p role="alert">{error}</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="grammar-view" aria-labelledby="grammar-heading">
        <p>Loading grammar…</p>
      </section>
    )
  }

  return (
    <section className="grammar-view" aria-labelledby="grammar-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">GRAMMAR</span>
          <h2 id="grammar-heading">Specification</h2>
        </div>
        <span className="unavailable-label">
          {data.table_conflicts.length === 0 ? 'LL(1): conflict-free' : `${data.table_conflicts.length} conflicts`}
        </span>
      </div>

      <div className="grammar-block">
        <h3 className="analysis-subheading">Lexical specification</h3>
        <div className="corpus-table-wrap">
          <table className="corpus-table lexicon-table">
            <thead>
              <tr>
                <th>Canonical</th><th>Terminal</th><th>POS</th><th>Slang</th><th>Origin</th><th>Description</th>
              </tr>
            </thead>
            <tbody>
              {data.lexicon.map((entry) => (
                <tr key={entry.rule_id}>
                  <td className="mono">{entry.canonical}</td>
                  <td className="mono">{entry.terminal}</td>
                  <td>{entry.part_of_speech}</td>
                  <td>{entry.is_slang ? 'yes' : ''}</td>
                  <td>{entry.language_candidates.join(', ')}</td>
                  <td>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grammar-block grammar-columns">
        <div>
          <h3 className="analysis-subheading">Original rules</h3>
          <RuleList grammar={data.descriptive_grammar} />
        </div>
        <div>
          <h3 className="analysis-subheading">Transformed (executable) rules</h3>
          <RuleList grammar={data.grammar} />
        </div>
      </div>

      <div className="grammar-block">
        <h3 className="analysis-subheading">Transformation ledger</h3>
        {data.transformation_steps.length === 0 ? (
          <p className="corpus-empty">No transformation was necessary.</p>
        ) : (
          <ol className="ledger-list">
            {data.transformation_steps.map((step, index) => (
              <li key={index}>
                <span className="ledger-kind">{step.kind.replaceAll('_', ' ')}</span>
                <p>{step.description}</p>
                <p className="ledger-ids">
                  <span className="mono">{step.source_production_ids.join(', ')}</span>
                  {' → '}
                  <span className="mono">{step.result_production_ids.join(', ')}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="grammar-block grammar-columns">
        <div>
          <h3 className="analysis-subheading">Nullable</h3>
          <p className="mono">{data.nullable.length > 0 ? data.nullable.join(', ') : 'none'}</p>
        </div>
        <div>
          <h3 className="analysis-subheading">FIRST / FOLLOW</h3>
          <div className="corpus-table-wrap">
            <table className="corpus-table">
              <thead><tr><th>Symbol</th><th>FIRST</th><th>FOLLOW</th></tr></thead>
              <tbody>
                {data.grammar.nonterminals.map((symbol) => {
                  const first = data.first.find((s) => s.symbol === symbol)
                  const follow = data.follow.find((s) => s.symbol === symbol)
                  return (
                    <tr key={symbol}>
                      <td className="mono">{symbol}</td>
                      <td className="mono">{first?.terminals.join(', ') ?? ''}</td>
                      <td className="mono">{follow?.terminals.join(', ') ?? ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grammar-block">
        <h3 className="analysis-subheading">LL(1) table</h3>
        <div className="corpus-table-wrap ll1-table-wrap">
          <table className="corpus-table ll1-table">
            <thead>
              <tr>
                <th className="ll1-corner">NT \ T</th>
                {columns.map((terminal) => <th key={terminal}>{terminal}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.grammar.nonterminals.map((nonterminal) => (
                <tr key={nonterminal}>
                  <th className="ll1-row-head">{nonterminal}</th>
                  {columns.map((terminal) => {
                    const productionId = tableCell.get(`${nonterminal}\u0000${terminal}`)
                    const production = productionId ? productionById.get(productionId) : undefined
                    return (
                      <td key={terminal} className="mono ll1-cell">
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
          <ul className="ledger-list">
            {data.table_conflicts.map((conflict) => (
              <li key={`${conflict.nonterminal}-${conflict.terminal}`}>
                <span className="ledger-kind">conflict</span>
                <p className="mono">
                  {conflict.nonterminal} / {conflict.terminal}: {conflict.production_ids.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
