import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { m } from 'motion/react'
import { getCorpusHistory } from '../../domain/api'
import type { StatementRevisionHistoryItem } from '../../domain/api'
import { drawerSlide, overlayFade, fadeInUp, staggerContainer } from '../../motion/presets'

export function CorpusHistoryPanel({ statementId, onClose }: Readonly<{
  statementId: string
  onClose: () => void
}>) {
  const [items, setItems] = useState<StatementRevisionHistoryItem[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getCorpusHistory(statementId)
      .then((rows) => { if (!cancelled) setItems(rows) })
      .catch(() => { if (!cancelled) setError('Could not load revision history.') })
    return () => { cancelled = true }
  }, [statementId])

  return (
    <m.div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
      variants={overlayFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <m.div
        className="flex h-full w-full max-w-[30rem] flex-col gap-3 overflow-y-auto bg-surface-raised p-6 shadow-e3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-heading"
        onClick={(event) => event.stopPropagation()}
        variants={drawerSlide}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="history-heading" className="text-h3 text-ink">History: {statementId}</h2>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-control text-faint transition-colors hover:bg-surface-inset hover:text-ink"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p className="rounded-control border-l-2 border-danger bg-danger-subtle px-3 py-2.5 text-small text-danger" role="alert">
            {error}
          </p>
        )}
        {!items && !error && <p className="text-small text-muted">Loading…</p>}

        {items && (
          <m.ol
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {[...items].reverse().map((item) => (
              <m.li
                key={item.revision}
                variants={fadeInUp}
                className="rounded-panel border border-hairline bg-surface p-3.5"
              >
                <div className="flex justify-between gap-3 text-caption text-faint">
                  <span className="font-semibold text-accent">Revision {item.revision}</span>
                  <span className="tabular">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <p className="my-2 text-small wrap-anywhere text-ink">{item.raw_text}</p>
                <div className="flex justify-between gap-3 text-caption text-faint">
                  <span>{item.created_by ?? 'unknown collector'}</span>
                  <span>{item.source_kind}</span>
                </div>
              </m.li>
            ))}
          </m.ol>
        )}
      </m.div>
    </m.div>
  )
}
