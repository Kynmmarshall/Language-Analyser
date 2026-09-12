import { AlertTriangle, ArrowRight, Braces, CheckCircle2, Loader2, Workflow, XCircle } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import type { AnalysisRequest } from '../../domain/francanglais'
import { TARGET_LABEL } from '../../domain/francanglais'
import type { AnalyzeResponse } from '../../domain/api'
import { fadeInUp, pressable, springSmooth, staggerContainer } from '../../motion/presets'
import { useMagnetic } from '../../motion/useMagnetic'

type Props = Readonly<{
  request: AnalysisRequest | null
  result: AnalyzeResponse | null
  loading: boolean
  error: string | null
  stale: boolean
  onAnalyze: () => void
}>

const actionClass =
  'flex h-11 items-center justify-center gap-2 rounded-control border border-hairline bg-surface px-4 text-small font-semibold text-ink transition-colors hover:border-strong disabled:pointer-events-none disabled:opacity-40'

export function AnalysisPanel({ request, result, loading, error, stale, onAnalyze }: Props) {
  const showResult = result && !loading
  const magnetic = useMagnetic()

  return (
    <section
      className="min-w-0 border-t border-hairline bg-surface-sunken/40 p-6 lg:border-t-0 lg:border-l lg:p-8"
      aria-labelledby="analysis-heading"
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-faint">
            02 / ANALYSIS
          </span>
          <h2 id="analysis-heading" className="text-h2 text-ink">Result</h2>
        </div>
        <AnimatePresence>
          {showResult && stale && (
            <m.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springSmooth}
              data-testid="analysis-stale"
              className="rounded-full bg-warning-subtle px-2.5 py-1 text-caption font-semibold text-warning"
            >
              Stale
            </m.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!result && !loading && !error && (
          <m.div
            key="idle"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 px-2 py-6 text-center"
          >
            <Workflow size={34} strokeWidth={1.4} aria-hidden="true" className="text-accent" />
            <h3 className="text-h3 text-ink">Awaiting analyzer</h3>
            <p className="text-small text-muted">Run the lexer and parser against your statement.</p>
            <m.button
              className={`${actionClass} mt-1`}
              type="button"
              disabled={!request}
              onClick={onAnalyze}
              {...(request ? pressable : {})}
              {...(request ? magnetic : {})}
            >
              Analyze statement <ArrowRight size={15} aria-hidden="true" />
            </m.button>
          </m.div>
        )}

        {loading && (
          <m.div
            key="loading"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 px-2 py-6 text-center"
          >
            <m.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 0.9 }}
              className="text-accent"
            >
              <Loader2 size={34} strokeWidth={1.4} aria-hidden="true" />
            </m.span>
            <h3 className="text-h3 text-ink">Analyzing&hellip;</h3>
            <p className="text-small text-muted">Contacting the Francanglais analyzer service.</p>
          </m.div>
        )}

        {error && !loading && (
          <m.div
            key="error"
            data-testid="analysis-error"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 px-2 py-6 text-center"
          >
            <AlertTriangle size={34} strokeWidth={1.4} aria-hidden="true" className="text-danger" />
            <h3 className="text-h3 text-ink">Analysis failed</h3>
            <p role="alert" className="text-small text-danger">{error}</p>
            <m.button
              className={`${actionClass} mt-1`}
              type="button"
              disabled={!request}
              onClick={onAnalyze}
              {...(request ? pressable : {})}
            >
              Retry <ArrowRight size={15} aria-hidden="true" />
            </m.button>
          </m.div>
        )}

        {showResult && (
          <m.div
            key="result"
            data-testid="analysis-result"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className={`flex flex-col gap-4 pb-5 transition-opacity ${stale ? 'opacity-55' : ''}`}
          >
            <m.div
              variants={fadeInUp}
              data-testid="analysis-verdict"
              className={`flex items-center gap-2.5 rounded-panel border px-4 py-3 text-body font-semibold ${
                result.parse.accepted
                  ? 'border-success/25 bg-success-subtle text-success'
                  : 'border-danger/25 bg-danger-subtle text-danger'
              }`}
            >
              {result.parse.accepted ? (
                <CheckCircle2 size={20} aria-hidden="true" />
              ) : (
                <XCircle size={20} aria-hidden="true" />
              )}
              <span>{result.parse.accepted ? 'Grammatically accepted' : 'Rejected by the grammar'}</span>
            </m.div>

            {!result.parse.accepted && result.parse.rejection_reason && (
              <m.p variants={fadeInUp} className="-mt-2 text-small text-muted">
                Reason: {result.parse.rejection_reason.replaceAll('_', ' ')}
              </m.p>
            )}

            <m.h3
              variants={fadeInUp}
              className="text-caption font-semibold tracking-[0.08em] text-faint uppercase"
            >
              Tokens
            </m.h3>

            <m.ol variants={staggerContainer} data-testid="token-list" className="flex flex-col gap-1.5">
              {result.tokens.map((token, index) => (
                <m.li
                  key={`${token.rule_id}-${index}`}
                  variants={fadeInUp}
                  data-testid="token-item"
                  className="flex flex-wrap items-center gap-2 rounded-control border border-hairline bg-surface px-3 py-2 text-small"
                >
                  <span className="font-semibold text-ink">{token.raw}</span>
                  <span className="font-mono text-caption text-accent">{token.terminal}</span>
                  <span className="font-mono text-caption text-faint">{token.part_of_speech}</span>
                  {token.is_slang && (
                    <span className="ml-auto rounded-full bg-highlight/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-highlight uppercase">
                      slang
                    </span>
                  )}
                </m.li>
              ))}
            </m.ol>

            {result.topics.length > 0 && (
              <>
                <m.h3
                  variants={fadeInUp}
                  className="mt-1 text-caption font-semibold tracking-[0.08em] text-faint uppercase"
                >
                  Topics
                </m.h3>
                <m.ul variants={staggerContainer} className="flex flex-col gap-1">
                  {result.topics.map((topic) => (
                    <m.li
                      key={topic.topic}
                      variants={fadeInUp}
                      className="flex justify-between gap-3 text-small"
                    >
                      <span className="capitalize text-ink">{topic.topic.replaceAll('_', ' ')}</span>
                      <span className="text-right text-muted">{topic.matched_terms.join(', ')}</span>
                    </m.li>
                  ))}
                </m.ul>
              </>
            )}

            <m.button
              variants={fadeInUp}
              className={`${actionClass} mt-1 self-start`}
              type="button"
              disabled={!request}
              onClick={onAnalyze}
              {...(request ? pressable : {})}
            >
              Re-analyze <ArrowRight size={15} aria-hidden="true" />
            </m.button>
          </m.div>
        )}
      </AnimatePresence>

      <dl className="mt-2 text-small">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-t border-hairline py-3">
          <dt className="text-muted">Target variety</dt>
          <dd className="m-0 text-right text-ink">{TARGET_LABEL}</dd>
        </div>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-t border-hairline py-3">
          <dt className="text-muted">Grammar</dt>
          <dd className="m-0 text-right text-ink">{result ? 'Loaded' : 'Not loaded'}</dd>
        </div>
      </dl>

      <details className="border-t border-hairline">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-small text-muted transition-colors hover:text-ink">
          <Braces size={16} aria-hidden="true" />
          Input contract
          <span className="ml-auto font-mono text-[10px] text-info">JSON</span>
        </summary>
        <pre
          aria-label="Input request JSON"
          tabIndex={0}
          className="m-0 max-h-64 overflow-auto rounded-control border-l-2 border-highlight bg-surface-inset p-3.5 font-mono text-caption leading-[1.8] wrap-anywhere whitespace-pre-wrap text-secondary"
        >
          {request ? JSON.stringify(request, null, 2) : 'No valid input.'}
        </pre>
      </details>
    </section>
  )
}
