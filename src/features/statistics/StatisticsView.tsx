import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { fetchStatistics, AnalysisApiError } from '../../domain/api'
import type { FrequencyItem, StatisticsView as StatisticsData } from '../../domain/api'
import '../corpus/corpus.css'
import '../grammar/grammar.css'
import './statistics.css'

function FrequencyTable({ title, items }: Readonly<{ title: string; items: readonly FrequencyItem[] }>) {
  const max = items.length > 0 ? items[0].count : 1
  return (
    <div className="frequency-block">
      <h3 className="analysis-subheading">{title}</h3>
      {items.length === 0 ? (
        <p className="corpus-empty">No data yet.</p>
      ) : (
        <div className="corpus-table-wrap frequency-table-wrap">
          <table className="corpus-table frequency-table">
            <thead><tr><th>Term</th><th>Count</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.term}>
                  <td className="mono">{item.term}</td>
                  <td className="frequency-cell">
                    <span className="frequency-bar" style={{ width: `${(item.count / max) * 100}%` }} />
                    <span className="frequency-count">{item.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function StatisticsView() {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchStatistics()
      .then((view) => { if (!cancelled) setData(view) })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof AnalysisApiError ? err.message : 'Could not load statistics.')
        }
      })
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <section className="statistics-view" aria-labelledby="statistics-heading">
        <div className="analysis-placeholder analysis-error">
          <AlertTriangle size={38} strokeWidth={1.4} aria-hidden="true" />
          <h3>Could not load statistics</h3>
          <p role="alert">{error}</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="statistics-view" aria-labelledby="statistics-heading">
        <p>Loading statistics…</p>
      </section>
    )
  }

  const acceptanceRate = data.statement_count > 0
    ? Math.round((data.accepted_count / data.statement_count) * 100)
    : 0

  return (
    <section className="statistics-view" aria-labelledby="statistics-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">STATISTICS</span>
          <h2 id="statistics-heading">Corpus evidence</h2>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-value">{data.statement_count}</span>
          <span className="stat-label">Statements</span>
        </div>
        <div className="stat-card">
          <span className="stat-value stat-accepted"><CheckCircle2 size={18} aria-hidden="true" /> {data.accepted_count}</span>
          <span className="stat-label">Accepted</span>
        </div>
        <div className="stat-card">
          <span className="stat-value stat-rejected"><XCircle size={18} aria-hidden="true" /> {data.rejected_count}</span>
          <span className="stat-label">Rejected</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{acceptanceRate}%</span>
          <span className="stat-label">Acceptance rate</span>
        </div>
      </div>

      {data.skipped_invalid_count > 0 && (
        <p className="operation-error" role="alert">
          {data.skipped_invalid_count} statement(s) failed validation and were excluded.
        </p>
      )}

      <div className="grammar-block">
        <h3 className="analysis-subheading">Unknown-word review queue</h3>
        {data.unknown_words.length === 0 ? (
          <p className="corpus-empty">No unknown vocabulary in the current corpus.</p>
        ) : (
          <ul className="unknown-word-list">
            {data.unknown_words.map((word) => <li key={word} className="mono">{word}</li>)}
          </ul>
        )}
      </div>

      <div className="grammar-columns">
        <FrequencyTable title="Raw word frequency" items={data.raw_frequency} />
        <FrequencyTable title="Canonical word frequency" items={data.canonical_frequency} />
      </div>

      <div className="grammar-columns">
        <FrequencyTable title="Topic evidence" items={data.topic_counts} />
        <FrequencyTable title="Borrowing-origin annotations" items={data.language_candidate_counts} />
      </div>

      <FrequencyTable title="Grammatical category (terminal) frequency" items={data.terminal_frequency} />
    </section>
  )
}
