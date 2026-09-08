import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { StatementCreateRequest, StatementPrivate, StatementUpdateRequest } from '../../domain/api'

const TOPIC_OPTIONS = [
  'commuting', 'internet', 'electricity', 'market_bargaining', 'rain', 'fuel',
  'roadside_business', 'bendskin', 'security', 'university',
]

type Props = Readonly<{
  editing: StatementPrivate | null
  conflict: StatementPrivate | null
  submitting: boolean
  error: string | null
  onCancel: () => void
  onCreate: (payload: StatementCreateRequest) => void
  onUpdate: (payload: StatementUpdateRequest) => void
}>

export function CorpusDrawer({ editing, conflict, submitting, error, onCancel, onCreate, onUpdate }: Props) {
  const source = conflict ?? editing
  const [statementId, setStatementId] = useState(source?.statement_id ?? '')
  const [rawText, setRawText] = useState(source?.raw_text ?? '')
  const [sourceKind, setSourceKind] = useState<'demo' | 'field'>(source?.source_kind ?? 'field')
  const [attested, setAttested] = useState(source?.manual_transcription_attested ?? true)
  const [collectorId, setCollectorId] = useState(source?.collector_id ?? '')
  const [topics, setTopics] = useState<readonly string[]>(source?.topics ?? [])

  function toggleTopic(topic: string) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic],
    )
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (editing) {
      onUpdate({
        expected_revision: (conflict ?? editing).revision,
        raw_text: rawText,
        source_kind: sourceKind,
        manual_transcription_attested: attested,
        collector_id: collectorId,
        topics,
      })
    } else {
      onCreate({
        statement_id: statementId,
        raw_text: rawText,
        source_kind: sourceKind,
        manual_transcription_attested: attested,
        collector_id: collectorId,
        topics,
      })
    }
  }

  return (
    <div className="drawer-overlay" role="presentation" onClick={onCancel}>
      <form
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-heading"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="drawer-header">
          <h2 id="drawer-heading">{editing ? `Edit ${editing.statement_id}` : 'New statement'}</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onCancel}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {conflict && (
          <p className="drawer-conflict" role="alert">
            This statement changed since you opened it (now at revision {conflict.revision}).
            Review the latest wording below before resubmitting.
          </p>
        )}
        {error && <p className="drawer-conflict" role="alert">{error}</p>}

        <label htmlFor="drawer-statement-id">Statement ID</label>
        <input id="drawer-statement-id" required disabled={Boolean(editing)}
          value={statementId} onChange={(event) => setStatementId(event.target.value)} />

        <label htmlFor="drawer-raw-text">Raw text</label>
        <textarea id="drawer-raw-text" required rows={4}
          value={rawText} onChange={(event) => setRawText(event.target.value)} />

        <label htmlFor="drawer-source-kind">Source kind</label>
        <select id="drawer-source-kind" value={sourceKind}
          onChange={(event) => setSourceKind(event.target.value as 'demo' | 'field')}>
          <option value="field">Field</option>
          <option value="demo">Demo</option>
        </select>

        <label htmlFor="drawer-collector-id">Collector ID</label>
        <input id="drawer-collector-id" required
          value={collectorId} onChange={(event) => setCollectorId(event.target.value)} />

        <label className="drawer-checkbox">
          <input type="checkbox" checked={attested}
            onChange={(event) => setAttested(event.target.checked)} />
          Manually transcribed and attested
        </label>

        <span>Topics</span>
        <div className="topic-chooser">
          {TOPIC_OPTIONS.map((topic) => (
            <label key={topic} className="topic-chip">
              <input type="checkbox" checked={topics.includes(topic)}
                onChange={() => toggleTopic(topic)} />
              {topic.replaceAll('_', ' ')}
            </label>
          ))}
        </div>

        <div className="drawer-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Saving…' : editing ? 'Save revision' : 'Create statement'}
          </button>
        </div>
      </form>
    </div>
  )
}
