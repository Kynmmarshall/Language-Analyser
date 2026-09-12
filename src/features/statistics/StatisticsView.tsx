import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { m } from 'motion/react'
import { fetchStatistics, AnalysisApiError } from '../../domain/api'
import type { FrequencyItem, StatisticsView as StatisticsData } from '../../domain/api'
import { fadeInUp, springSmooth, staggerContainer } from '../../motion/presets'

const subheadingClass = 'text-caption font-semibold tracking-[0.08em] text-faint uppercase'

function StatCard({ label, value, tone }: Readonly<{
  label: string
  value: string | number
  tone?: 'success' | 'danger'
}>) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink'
  return (
    <m.div
      variants={fadeInUp}
      className="flex flex-col gap-1 rounded-panel border border-hairline bg-surface p-4"
    >
      <span className={`flex items-center gap-2 font-display text-[1.625rem] leading-none ${toneClass}`}>
        {tone === 'success' && <CheckCircle2 size={18} aria-hidden="true" />}
        {tone === 'danger' && <XCircle size={18} aria-hidden="true" />}
        <span className="tabular">{value}</span>
      </span>
      <span className="text-[11px] tracking-[0.06em] text-faint uppercase">{label}</span>
    </m.div>
  )
}

function FrequencyTable({ title, items }: Readonly<{ title: string; items: readonly FrequencyItem[] }>) {
  const max = items.length > 0 ? items[0].count : 1
  return (
    <m.div variants={fadeInUp} className="flex min-w-0 flex-col gap-3">
      <h3 className={subheadingClass}>{title}</h3>
      {items.length === 0 ? (
        <p className="text-small text-muted">No data yet.</p>
      ) : (
        <div
          className="max-h-80 overflow-y-auto rounded-panel border border-hairline"
          role="region"
          aria-label={title}
          tabIndex={0}
        >
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="bg-surface-sunken text-left">
                <th className="sticky top-0 border-b border-hairline bg-surface-sunken px-3 py-2.5 font-semibold text-muted">
                  Term
                </th>
                <th className="sticky top-0 border-b border-hairline bg-surface-sunken px-3 py-2.5 font-semibold text-muted">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.term}
                  className="border-b border-hairline transition-colors last:border-0 hover:bg-surface-inset"
                >
                  <td className="px-3 py-2 font-mono wrap-anywhere text-ink">{item.term}</td>
                  <td className="relative min-w-36 px-3 py-2">
                    <m.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: item.count / max }}
                      transition={springSmooth}
                      style={{ transformOrigin: 'left' }}
                      className="absolute inset-y-1.5 right-0 left-0 rounded-control bg-accent-subtle"
                    />
                    <span className="tabular relative pl-2 font-mono text-caption text-ink">
                      {item.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </m.div>
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
      <section className="panel p-6 lg:p-8" aria-labelledby="statistics-heading">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle size={34} strokeWidth={1.4} aria-hidden="true" className="text-danger" />
          <h3 id="statistics-heading" className="text-h3 text-ink">Could not load statistics</h3>
          <p role="alert" className="text-small text-danger">{error}</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="panel p-6 lg:p-8" aria-labelledby="statistics-heading">
        <h2 id="statistics-heading" className="sr-only">Corpus evidence</h2>
        <p className="text-small text-muted">Loading statistics…</p>
      </section>
    )
  }

  const acceptanceRate = data.statement_count > 0
    ? Math.round((data.accepted_count / data.statement_count) * 100)
    : 0

  return (
    <m.section
      className="panel flex flex-col gap-8 p-6 lg:p-8"
      aria-labelledby="statistics-heading"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <m.div variants={fadeInUp}>
        <span className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-faint">STATISTICS</span>
        <h2 id="statistics-heading" className="text-h2 text-ink">Corpus evidence</h2>
      </m.div>

      <m.div variants={staggerContainer} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Statements" value={data.statement_count} />
        <StatCard label="Accepted" value={data.accepted_count} tone="success" />
        <StatCard label="Rejected" value={data.rejected_count} tone="danger" />
        <StatCard label="Acceptance rate" value={`${acceptanceRate}%`} />
      </m.div>

      {data.skipped_invalid_count > 0 && (
        <p
          className="rounded-control border-l-2 border-danger bg-danger-subtle px-4 py-3 text-small text-danger"
          role="alert"
        >
          {data.skipped_invalid_count} statement(s) failed validation and were excluded.
        </p>
      )}

      <m.div variants={fadeInUp} className="flex flex-col gap-3">
        <h3 className={subheadingClass}>Unknown-word review queue</h3>
        {data.unknown_words.length === 0 ? (
          <p className="text-small text-muted">No unknown vocabulary in the current corpus.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.unknown_words.map((word) => (
              <li
                key={word}
                className="rounded-full bg-warning-subtle px-3 py-1 font-mono text-caption text-warning"
              >
                {word}
              </li>
            ))}
          </ul>
        )}
      </m.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FrequencyTable title="Raw word frequency" items={data.raw_frequency} />
        <FrequencyTable title="Canonical word frequency" items={data.canonical_frequency} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FrequencyTable title="Topic evidence" items={data.topic_counts} />
        <FrequencyTable title="Borrowing-origin annotations" items={data.language_candidate_counts} />
      </div>

      <FrequencyTable title="Grammatical category (terminal) frequency" items={data.terminal_frequency} />
    </m.section>
  )
}
