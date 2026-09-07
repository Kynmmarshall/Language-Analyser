import { ArrowRight, Braces, Workflow } from 'lucide-react'
import type { AnalysisRequest } from '../../domain/francanglais'
import { TARGET_LABEL } from '../../domain/francanglais'

export function AnalysisPanel({ request }: { request: AnalysisRequest | null }) {
  return (
    <section className="analysis-section" aria-labelledby="analysis-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">02 / ANALYSIS</span>
          <h2 id="analysis-heading">Result</h2>
        </div>
        <span className="unavailable-label">Unavailable</span>
      </div>
      <div className="analysis-placeholder">
        <Workflow size={38} strokeWidth={1.4} aria-hidden="true" />
        <h3>Awaiting analyzer</h3>
        <p>The lexer and parser are not connected.</p>
        <button className="secondary-button" type="button" disabled
          aria-describedby="analyzer-status">
          Analyze statement <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <dl className="analysis-meta">
        <div><dt>Target variety</dt><dd>{TARGET_LABEL}</dd></div>
        <div><dt>Grammar</dt><dd>Not loaded</dd></div>
      </dl>
      <details className="request-details" open>
        <summary><Braces size={17} aria-hidden="true" /> Input contract <span>JSON</span></summary>
        <pre aria-label="Input request JSON">{request
          ? JSON.stringify(request, null, 2)
          : 'No valid input.'}</pre>
      </details>
    </section>
  )
}