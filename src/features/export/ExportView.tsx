import { useEffect, useState } from 'react'
import { AlertTriangle, Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { m } from 'motion/react'
import { evidenceCsvUrl, fetchEvidenceBundle, AnalysisApiError } from '../../domain/api'
import type { EvidenceBundle, ExportScope } from '../../domain/api'
import { fadeInUp, pressable, staggerContainer } from '../../motion/presets'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function ExportView() {
  const [scope, setScope] = useState<ExportScope>('published')
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null)
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [downloading, setDownloading] = useState<'json' | 'csv' | null>(null)

  useEffect(() => {
    let cancelled = false
    setBundle(null)
    setError('')
    fetchEvidenceBundle(scope)
      .then((data) => { if (!cancelled) setBundle(data) })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof AnalysisApiError ? err.message : 'Could not load the export.')
        }
      })
    return () => { cancelled = true }
  }, [scope])

  async function downloadJson() {
    setDownloading('json')
    setDownloadError('')
    try {
      const data = bundle ?? (await fetchEvidenceBundle(scope))
      const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' })
      triggerDownload(blob, `francanglais-evidence-${scope}.json`)
    } catch (err) {
      setDownloadError(err instanceof AnalysisApiError ? err.message : 'Could not download the export.')
    } finally {
      setDownloading(null)
    }
  }

  async function downloadCsv() {
    setDownloading('csv')
    setDownloadError('')
    try {
      const response = await fetch(evidenceCsvUrl(scope), { credentials: 'include' })
      if (!response.ok) throw new AnalysisApiError(`Export failed (${response.status}).`, response.status)
      triggerDownload(await response.blob(), `francanglais-evidence-${scope}.csv`)
    } catch (err) {
      setDownloadError(err instanceof AnalysisApiError ? err.message : 'Could not download the export.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <m.section
      className="panel flex flex-col gap-5 p-6 lg:p-8"
      aria-labelledby="export-heading"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <m.div variants={fadeInUp}>
        <span className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-faint">
          EVIDENCE EXPORT
        </span>
        <h2 id="export-heading" className="text-h2 text-ink">Reproducible bundle</h2>
      </m.div>

      <m.p variants={fadeInUp} className="max-w-2xl text-small text-muted">
        This bundle is raw evidence (grammar, lexicon, statements, and analysis results) for
        the reviewed academic report and submission — it is not the report itself.
      </m.p>

      <m.div
        variants={fadeInUp}
        className="flex flex-wrap gap-x-6 gap-y-3 border-y border-hairline py-4"
      >
        {([
          { value: 'published', label: 'Published only', hint: '(privacy-redacted, safe to share)' },
          { value: 'all', label: 'All statements', hint: '(includes drafts and collector identity)' },
        ] as const).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 text-small font-semibold text-ink"
          >
            <input
              type="radio"
              name="scope"
              value={option.value}
              checked={scope === option.value}
              onChange={() => setScope(option.value)}
              className="size-4 accent-[var(--app-accent)]"
            />
            {option.label}
            <span className="font-normal text-caption text-faint">{option.hint}</span>
          </label>
        ))}
      </m.div>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle size={34} strokeWidth={1.4} aria-hidden="true" className="text-danger" />
          <h3 className="text-h3 text-ink">Could not load the export</h3>
          <p role="alert" className="text-small text-danger">{error}</p>
        </div>
      )}

      {!bundle && !error && <p className="text-small text-muted">Loading export preview…</p>}

      {bundle && (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { term: 'Scope', value: bundle.scope, testId: 'export-scope', mono: false },
              { term: 'Analyzer version', value: bundle.analyzer_version, mono: true },
              { term: 'Spec hash', value: bundle.spec_hash, mono: true },
              { term: 'Generated', value: new Date(bundle.generated_at).toLocaleString(), mono: false },
              { term: 'Statements', value: String(bundle.statements.length), mono: false },
            ].map((item) => (
              <div key={item.term} className="flex min-w-0 flex-col gap-1">
                <dt className="text-[10px] tracking-[0.06em] text-faint uppercase">{item.term}</dt>
                <dd
                  className={`m-0 wrap-anywhere text-small text-ink ${item.mono ? 'font-mono' : ''}`}
                  data-testid={item.testId}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2.5">
            <m.button
              className="flex h-11 items-center gap-2 rounded-control bg-accent px-4 text-small font-semibold text-accent-contrast shadow-e1 transition-colors hover:bg-accent-hover disabled:opacity-60"
              type="button"
              disabled={downloading !== null}
              onClick={downloadJson}
              {...(downloading ? {} : pressable)}
            >
              <FileJson size={16} aria-hidden="true" />
              {downloading === 'json' ? 'Preparing…' : 'Download JSON'}
              <Download size={14} aria-hidden="true" />
            </m.button>
            <m.button
              className="flex h-11 items-center gap-2 rounded-control border border-hairline bg-surface px-4 text-small font-semibold text-ink transition-colors hover:border-strong disabled:opacity-60"
              type="button"
              disabled={downloading !== null}
              onClick={downloadCsv}
              {...(downloading ? {} : pressable)}
            >
              <FileSpreadsheet size={16} aria-hidden="true" />
              {downloading === 'csv' ? 'Preparing…' : 'Download CSV'}
              <Download size={14} aria-hidden="true" />
            </m.button>
          </div>

          {downloadError && (
            <p
              className="rounded-control border-l-2 border-danger bg-danger-subtle px-4 py-3 text-small text-danger"
              role="alert"
            >
              {downloadError}
            </p>
          )}

          {bundle.statements.length === 0 ? (
            <p className="py-4 text-small text-muted">No statements in this scope yet.</p>
          ) : (
            <div
              className="overflow-x-auto rounded-panel border border-hairline"
              role="region"
              aria-label="Exported statements"
              tabIndex={0}
            >
              <table className="w-full min-w-[42rem] border-collapse text-small">
                <thead>
                  <tr className="bg-surface-sunken text-left">
                    {['ID', 'Text', 'Source', 'Published', 'Collector', 'Accepted'].map((head) => (
                      <th
                        key={head}
                        className="border-b border-hairline px-3 py-2.5 font-semibold whitespace-nowrap text-muted"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bundle.statements.map((statement) => {
                    const result = bundle.results.find(
                      (r) => r.statement_revision_id === `${statement.statement_id}@${statement.revision}`,
                    )
                    return (
                      <tr
                        key={statement.statement_id}
                        className="border-b border-hairline align-top transition-colors last:border-0 hover:bg-surface-inset"
                      >
                        <td className="px-3 py-2.5 font-mono text-caption whitespace-nowrap text-ink">
                          {statement.statement_id}
                        </td>
                        <td className="max-w-80 px-3 py-2.5 wrap-anywhere text-ink">{statement.raw_text}</td>
                        <td className="px-3 py-2.5 text-muted">{statement.source_kind}</td>
                        <td className="px-3 py-2.5 text-muted">{statement.published ? 'yes' : 'no'}</td>
                        <td className="px-3 py-2.5 text-muted">
                          {statement.collector_id ?? <em className="text-faint">redacted</em>}
                        </td>
                        <td className="px-3 py-2.5 text-muted">{result?.parse.accepted ? 'yes' : 'no'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </m.section>
  )
}
