import { AlertTriangle, ArrowRight, Braces, CheckCircle2, Loader2, Workflow, XCircle } from 'lucide-react'
import type { AnalysisRequest } from '../../domain/francanglais'
import { TARGET_LABEL } from '../../domain/francanglais'
import type { AnalyzeResponse } from '../../domain/api'

type Props = Readonly<{
  request: AnalysisRequest | null
  result: AnalyzeResponse | null
  loading: boolean
  error: string | null
  stale: boolean
  onAnalyze: () => void
}>

export function AnalysisPanel({ request, result, loading, error, stale, onAnalyze }: Props) {
  const showResult = result && !loading
  return (
    <section className="analysis-section" aria-labelledby="analysis-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">02 / ANALYSIS</span>
          <h2 id="analysis-heading">Result</h2>
        </div>
        {showResult && stale && <span className="unavailable-label" data-testid="analysis-stale">Stale</span>}
      </div>

      {!result && !loading && !error && (
        <div className="analysis-placeholder">
          <Workflow size={38} strokeWidth={1.4} aria-hidden="true" />
          <h3>Awaiting analyzer</h3>
          <p>Run the lexer and parser against your statement.</p>
          <button className="secondary-button" type="button" disabled={!request} onClick={onAnalyze}>
            Analyze statement <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {loading && (
        <div className="analysis-placeholder">
          <Loader2 size={38} strokeWidth={1.4} className="spin" aria-hidden="true" />
          <h3>Analyzing&hellip;</h3>
          <p>Contacting the Francanglais analyzer service.</p>
        </div>
      )}

      {error && !loading && (
        <div className="analysis-placeholder analysis-error" data-testid="analysis-error">
          <AlertTriangle size={38} strokeWidth={1.4} aria-hidden="true" />
          <h3>Analysis failed</h3>
          <p role="alert">{error}</p>
          <button className="secondary-button" type="button" disabled={!request} onClick={onAnalyze}>
            Retry <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {showResult && (
        <div className={`analysis-result${stale ? ' analysis-result-stale' : ''}`} data-testid="analysis-result">
          <div className="analysis-verdict" data-testid="analysis-verdict">
            {result.parse.accepted ? (
              <CheckCircle2 size={22} aria-hidden="true" />
            ) : (
              <XCircle size={22} aria-hidden="true" />
            )}
            <span>{result.parse.accepted ? 'Grammatically accepted' : 'Rejected by the grammar'}</span>
          </div>
          {!result.parse.accepted && result.parse.rejection_reason && (
            <p className="analysis-reason">Reason: {result.parse.rejection_reason.replaceAll('_', ' ')}</p>
          )}

          <h3 className="analysis-subheading">Tokens</h3>
          <ol className="token-list" data-testid="token-list">
            {result.tokens.map((token, index) => (
              <li key={`${token.rule_id}-${index}`} data-testid="token-item">
                <span className="token-raw">{token.raw}</span>
                <span className="token-terminal">{token.terminal}</span>
                <span className="token-pos">{token.part_of_speech}</span>
                {token.is_slang && <span className="token-slang">slang</span>}
              </li>
            ))}
          </ol>

          {result.topics.length > 0 && (
            <>
              <h3 className="analysis-subheading">Topics</h3>
              <ul className="topic-list">
                {result.topics.map((topic) => (
                  <li key={topic.topic}>
                    <span className="topic-name">{topic.topic.replaceAll('_', ' ')}</span>
                    <span className="topic-terms">{topic.matched_terms.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <button className="secondary-button" type="button" disabled={!request} onClick={onAnalyze}>
            Re-analyze <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <dl className="analysis-meta">
        <div><dt>Target variety</dt><dd>{TARGET_LABEL}</dd></div>
        <div><dt>Grammar</dt><dd>{result ? 'Loaded' : 'Not loaded'}</dd></div>
      </dl>
      <details className="request-details">
        <summary><Braces size={17} aria-hidden="true" /> Input contract <span>JSON</span></summary>
        <pre aria-label="Input request JSON">{request
          ? JSON.stringify(request, null, 2)
          : 'No valid input.'}</pre>
      </details>
    </section>
  )
}