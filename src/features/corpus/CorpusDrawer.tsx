import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { m } from 'motion/react'
import type { StatementCreateRequest, StatementPrivate, StatementUpdateRequest } from '../../domain/api'
import { drawerSlide, overlayFade, pressable } from '../../motion/presets'

const TOPIC_OPTIONS = [
  'commuting', 'internet', 'electricity', 'market_bargaining', 'rain', 'fuel',
  'roadside_business', 'bendskin', 'security', 'university',
]

const labelClass = 'mt-2 text-caption font-semibold text-muted'

const fieldClass =
  'h-11 w-full rounded-control border border-hairline bg-surface-inset px-3.5 text-small text-ink transition-colors placeholder:text-faint hover:border-strong focus:border-accent focus:outline-none'

const noticeClass =
  'rounded-control border-l-2 border-warning bg-warning-subtle px-3 py-2.5 text-small text-warning'

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
    <m.div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
      variants={overlayFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <m.form
        className="flex h-full w-full max-w-[30rem] flex-col gap-3 overflow-y-auto bg-surface-raised p-6 shadow-e3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-heading"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
        variants={drawerSlide}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="drawer-heading" className="text-h3 text-ink">
            {editing ? `Edit ${editing.statement_id}` : 'New statement'}
          </h2>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-control text-faint transition-colors hover:bg-surface-inset hover:text-ink"
            aria-label="Close"
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {conflict && (
          <p className={noticeClass} role="alert">
            This statement changed since you opened it (now at revision {conflict.revision}).
            Review the latest wording below before resubmitting.
          </p>
        )}
        {error && <p className={noticeClass} role="alert">{error}</p>}

        <label htmlFor="drawer-statement-id" className={labelClass}>Statement ID</label>
        <input id="drawer-statement-id" required disabled={Boolean(editing)}
          value={statementId} onChange={(event) => setStatementId(event.target.value)}
          className={`${fieldClass} disabled:bg-surface-sunken disabled:text-faint`} />

        <label htmlFor="drawer-raw-text" className={labelClass}>Raw text</label>
        <textarea id="drawer-raw-text" required rows={4}
          value={rawText} onChange={(event) => setRawText(event.target.value)}
          className={`${fieldClass} min-h-28 resize-y py-3 text-body leading-relaxed`} />

        <label htmlFor="drawer-source-kind" className={labelClass}>Source kind</label>
        <select id="drawer-source-kind" value={sourceKind}
          onChange={(event) => setSourceKind(event.target.value as 'demo' | 'field')}
          className={fieldClass}>
          <option value="field">Field</option>
          <option value="demo">Demo</option>
        </select>

        <label htmlFor="drawer-collector-id" className={labelClass}>Collector ID</label>
        <input id="drawer-collector-id" required
          value={collectorId} onChange={(event) => setCollectorId(event.target.value)}
          className={fieldClass} />

        <label className="mt-2 flex items-center gap-2.5 text-small text-ink">
          <input type="checkbox" checked={attested}
            onChange={(event) => setAttested(event.target.checked)}
            className="size-4 accent-[var(--app-accent)]" />
          Manually transcribed and attested
        </label>

        <span className={`${labelClass} mt-2`}>Topics</span>
        <div className="flex flex-wrap gap-2">
          {TOPIC_OPTIONS.map((topic) => {
            const selected = topics.includes(topic)
            return (
              <label
                key={topic}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-caption transition-colors ${
                  selected
                    ? 'border-accent/40 bg-accent-subtle text-accent'
                    : 'border-hairline text-muted hover:border-strong'
                }`}
              >
                <input type="checkbox" checked={selected} onChange={() => toggleTopic(topic)}
                  className="size-3.5 accent-[var(--app-accent)]" />
                {topic.replaceAll('_', ' ')}
              </label>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            className="h-11 rounded-control border border-hairline bg-surface px-4 text-small font-semibold text-ink transition-colors hover:border-strong"
            onClick={onCancel}
          >
            Cancel
          </button>
          <m.button
            type="submit"
            className="h-11 rounded-control bg-accent px-4 text-small font-semibold text-accent-contrast shadow-e1 transition-colors hover:bg-accent-hover disabled:opacity-60"
            disabled={submitting}
            {...(submitting ? {} : pressable)}
          >
            {submitting ? 'Saving…' : editing ? 'Save revision' : 'Create statement'}
          </m.button>
        </div>
      </m.form>
    </m.div>
  )
}
