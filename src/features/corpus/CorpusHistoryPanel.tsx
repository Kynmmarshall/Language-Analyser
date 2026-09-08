import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getCorpusHistory } from '../../domain/api'
import type { StatementRevisionHistoryItem } from '../../domain/api'

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
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="history-heading"
        onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h2 id="history-heading">History: {statementId}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {error && <p className="drawer-conflict" role="alert">{error}</p>}
        {!items && !error && <p>Loading…</p>}
        {items && (
          <ol className="history-list">
            {[...items].reverse().map((item) => (
              <li key={item.revision}>
                <div className="history-meta">
                  <span>Revision {item.revision}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <p className="history-text">{item.raw_text}</p>
                <div className="history-meta">
                  <span>{item.created_by ?? 'unknown collector'}</span>
                  <span>{item.source_kind}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
