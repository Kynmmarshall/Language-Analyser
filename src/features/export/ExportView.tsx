import { useEffect, useState } from 'react'
import { AlertTriangle, Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { evidenceCsvUrl, fetchEvidenceBundle, AnalysisApiError } from '../../domain/api'
import type { EvidenceBundle, ExportScope } from '../../domain/api'
import '../corpus/corpus.css'
import './export.css'

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
    <section className="export-view" aria-labelledby="export-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">EVIDENCE EXPORT</span>
          <h2 id="export-heading">Reproducible bundle</h2>
        </div>
      </div>

      <p className="export-note">
        This bundle is raw evidence (grammar, lexicon, statements, and analysis results) for
        the reviewed academic report and submission — it is not the report itself.
      </p>

      <div className="export-scope">
        <label className="export-scope-option">
          <input type="radio" name="scope" value="published" checked={scope === 'published'}
            onChange={() => setScope('published')} />
          Published only <span className="export-scope-hint">(privacy-redacted, safe to share)</span>
        </label>
        <label className="export-scope-option">
          <input type="radio" name="scope" value="all" checked={scope === 'all'}
            onChange={() => setScope('all')} />
          All statements <span className="export-scope-hint">(includes drafts and collector identity)</span>
        </label>
      </div>

      {error && (
        <div className="analysis-placeholder analysis-error">
          <AlertTriangle size={38} strokeWidth={1.4} aria-hidden="true" />
          <h3>Could not load the export</h3>
          <p role="alert">{error}</p>
        </div>
      )}

      {!bundle && !error && <p>Loading export preview…</p>}

      {bundle && (
        <>
          <dl className="analysis-meta export-meta">
            <div><dt>Scope</dt><dd>{bundle.scope}</dd></div>
            <div><dt>Analyzer version</dt><dd className="mono">{bundle.analyzer_version}</dd></div>
            <div><dt>Spec hash</dt><dd className="mono">{bundle.spec_hash}</dd></div>
            <div><dt>Generated</dt><dd>{new Date(bundle.generated_at).toLocaleString()}</dd></div>
            <div><dt>Statements</dt><dd>{bundle.statements.length}</dd></div>
          </dl>

          <div className="export-actions">
            <button className="primary-button" type="button" disabled={downloading !== null}
              onClick={downloadJson}>
              <FileJson size={16} aria-hidden="true" />
              {downloading === 'json' ? 'Preparing…' : 'Download JSON'} <Download size={14} aria-hidden="true" />
            </button>
            <button className="secondary-button" type="button" disabled={downloading !== null}
              onClick={downloadCsv}>
              <FileSpreadsheet size={16} aria-hidden="true" />
              {downloading === 'csv' ? 'Preparing…' : 'Download CSV'} <Download size={14} aria-hidden="true" />
            </button>
          </div>
          {downloadError && <p className="operation-error" role="alert">{downloadError}</p>}

          {bundle.statements.length === 0 ? (
            <p className="corpus-empty">No statements in this scope yet.</p>
          ) : (
            <div className="corpus-table-wrap">
              <table className="corpus-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Text</th><th>Source</th><th>Published</th>
                    <th>Collector</th><th>Accepted</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.statements.map((statement) => {
                    const result = bundle.results.find(
                      (r) => r.statement_revision_id === `${statement.statement_id}@${statement.revision}`,
                    )
                    return (
                      <tr key={statement.statement_id}>
                        <td className="corpus-id">{statement.statement_id}</td>
                        <td className="corpus-text">{statement.raw_text}</td>
                        <td>{statement.source_kind}</td>
                        <td>{statement.published ? 'yes' : 'no'}</td>
                        <td>{statement.collector_id ?? <em>redacted</em>}</td>
                        <td>{result?.parse.accepted ? 'yes' : 'no'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
