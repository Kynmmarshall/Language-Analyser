import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { History, Plus, RefreshCw, Upload, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import {
  AnalysisApiError, createCorpusStatement, getCorpusStatement, listCorpus,
  publishCorpusStatement, unpublishCorpusStatement, updateCorpusStatement,
} from '../../domain/api'
import type { StatementCreateRequest, StatementPrivate, StatementUpdateRequest } from '../../domain/api'
import { pressable, springSmooth } from '../../motion/presets'
import { useMagnetic } from '../../motion/useMagnetic'
import { CorpusDrawer } from './CorpusDrawer'
import { CorpusHistoryPanel } from './CorpusHistoryPanel'

const selectClass =
  'h-11 rounded-control border border-hairline bg-surface-inset px-3 text-small text-ink transition-colors hover:border-strong focus:border-accent focus:outline-none'

const rowActionClass =
  'flex h-8 items-center gap-1.5 rounded-control px-2 text-caption font-semibold text-muted transition-colors hover:bg-accent-subtle hover:text-accent disabled:pointer-events-none disabled:opacity-40'

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <m.p
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={springSmooth}
      className="mb-4 rounded-control border-l-2 border-danger bg-danger-subtle px-4 py-3 text-small text-danger"
    >
      {children}
    </m.p>
  )
}

type SourceFilter = 'all' | 'demo' | 'field'
type PublishFilter = 'all' | 'published' | 'unpublished'

export function CorpusView() {
  const magnetic = useMagnetic()
  const [statements, setStatements] = useState<StatementPrivate[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all')

  const [drawerMode, setDrawerMode] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingStatement, setEditingStatement] = useState<StatementPrivate | null>(null)
  const [conflictStatement, setConflictStatement] = useState<StatementPrivate | null>(null)
  const [drawerSubmitting, setDrawerSubmitting] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const [historyStatementId, setHistoryStatementId] = useState<string | null>(null)
  const [rowActionId, setRowActionId] = useState<string | null>(null)
  const [rowActionError, setRowActionError] = useState('')

  async function refresh() {
    try {
      setStatements(await listCorpus())
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof AnalysisApiError ? error.message : 'Could not load the corpus.')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    if (!statements) return []
    const query = search.trim().toLowerCase()
    return statements.filter((statement) => {
      if (sourceFilter !== 'all' && statement.source_kind !== sourceFilter) return false
      if (publishFilter === 'published' && statement.published_revision === null) return false
      if (publishFilter === 'unpublished' && statement.published_revision !== null) return false
      if (!query) return true
      return (
        statement.statement_id.toLowerCase().includes(query) ||
        statement.raw_text.toLowerCase().includes(query) ||
        statement.topics.some((topic) => topic.toLowerCase().includes(query))
      )
    })
  }, [statements, search, sourceFilter, publishFilter])

  function openCreate() {
    setEditingStatement(null)
    setConflictStatement(null)
    setDrawerError(null)
    setDrawerMode('create')
  }

  function openEdit(statement: StatementPrivate) {
    setEditingStatement(statement)
    setConflictStatement(null)
    setDrawerError(null)
    setDrawerMode('edit')
  }

  function closeDrawer() {
    setDrawerMode('closed')
    setEditingStatement(null)
    setConflictStatement(null)
    setDrawerError(null)
  }

  async function handleCreate(payload: StatementCreateRequest) {
    setDrawerSubmitting(true)
    setDrawerError(null)
    try {
      await createCorpusStatement(payload)
      closeDrawer()
      await refresh()
    } catch (error) {
      setDrawerError(
        error instanceof AnalysisApiError && error.status === 409
          ? `Statement ID "${payload.statement_id}" already exists.`
          : error instanceof AnalysisApiError ? error.message : 'Could not create the statement.',
      )
    } finally {
      setDrawerSubmitting(false)
    }
  }

  async function handleUpdate(payload: StatementUpdateRequest) {
    if (!editingStatement) return
    setDrawerSubmitting(true)
    setDrawerError(null)
    try {
      await updateCorpusStatement(editingStatement.statement_id, payload)
      closeDrawer()
      await refresh()
    } catch (error) {
      if (error instanceof AnalysisApiError && error.status === 409) {
        try {
          const latest = await getCorpusStatement(editingStatement.statement_id)
          setConflictStatement(latest)
          setDrawerError(null)
        } catch {
          setDrawerError('This statement changed, and the latest version could not be loaded.')
        }
      } else {
        setDrawerError(error instanceof AnalysisApiError ? error.message : 'Could not save the revision.')
      }
    } finally {
      setDrawerSubmitting(false)
    }
  }

  async function handlePublish(statement: StatementPrivate) {
    setRowActionId(statement.statement_id)
    setRowActionError('')
    try {
      await publishCorpusStatement(statement.statement_id, statement.revision)
      await refresh()
    } catch (error) {
      setRowActionError(error instanceof AnalysisApiError ? error.message : 'Could not publish.')
    } finally {
      setRowActionId(null)
    }
  }

  async function handleUnpublish(statement: StatementPrivate) {
    setRowActionId(statement.statement_id)
    setRowActionError('')
    try {
      await unpublishCorpusStatement(statement.statement_id)
      await refresh()
    } catch (error) {
      setRowActionError(error instanceof AnalysisApiError ? error.message : 'Could not unpublish.')
    } finally {
      setRowActionId(null)
    }
  }

  const drawerKey = conflictStatement
    ? `conflict-${editingStatement?.statement_id}-${conflictStatement.revision}`
    : (editingStatement?.statement_id ?? 'create')

  return (
    <section className="panel p-6 lg:p-8" aria-labelledby="corpus-heading">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-faint">CORPUS</span>
          <h2 id="corpus-heading" className="text-h2 text-ink">Statements</h2>
        </div>
        <div className="flex items-center gap-2">
          <m.button
            className="grid size-11 place-items-center rounded-control border border-hairline bg-surface text-muted transition-colors hover:border-strong hover:text-ink"
            type="button"
            aria-label="Refresh"
            onClick={refresh}
            {...pressable}
          >
            <RefreshCw size={16} aria-hidden="true" />
          </m.button>
          <m.button
            className="flex h-11 items-center gap-2 rounded-control bg-accent px-4 text-small font-semibold text-accent-contrast shadow-e1 transition-colors hover:bg-accent-hover"
            type="button"
            onClick={openCreate}
            {...pressable}
            {...magnetic}
          >
            <Plus size={16} aria-hidden="true" /> New statement
          </m.button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <input
          type="search"
          aria-label="Search statements"
          placeholder="Search text, id, or topic"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 min-w-56 flex-1 rounded-control border border-hairline bg-surface-inset px-3.5 text-small text-ink transition-colors placeholder:text-faint hover:border-strong focus:border-accent focus:outline-none"
        />
        <select
          aria-label="Filter by source"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
          className={selectClass}
        >
          <option value="all">All sources</option>
          <option value="field">Field</option>
          <option value="demo">Demo</option>
        </select>
        <select
          aria-label="Filter by publication status"
          value={publishFilter}
          onChange={(event) => setPublishFilter(event.target.value as PublishFilter)}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </div>

      <AnimatePresence>
        {loadError && <ErrorBanner key="load-error">{loadError}</ErrorBanner>}
        {rowActionError && <ErrorBanner key="row-error">{rowActionError}</ErrorBanner>}
      </AnimatePresence>

      {!statements && !loadError && <p className="py-4 text-small text-muted">Loading corpus…</p>}
      {statements && filtered.length === 0 && (
        <p className="py-6 text-small text-muted" data-testid="corpus-empty">No statements match.</p>
      )}

      {filtered.length > 0 && (
        <div
          className="overflow-x-auto rounded-panel border border-hairline"
          role="region"
          aria-label="Corpus statements"
          tabIndex={0}
        >
          <table className="w-full min-w-[48rem] border-collapse text-small">
            <thead>
              <tr className="bg-surface-sunken text-left">
                {['ID', 'Text', 'Source', 'Rev.', 'Published', 'Topics', 'Actions'].map((head) => (
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
              <AnimatePresence initial={false}>
                {filtered.map((statement) => (
                  <m.tr
                    key={statement.statement_id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={springSmooth}
                    data-testid="corpus-row"
                    className="border-b border-hairline align-top transition-colors last:border-0 hover:bg-surface-inset"
                  >
                    <td className="px-3 py-2.5 font-mono text-caption whitespace-nowrap text-ink" data-testid="corpus-id">
                      {statement.statement_id}
                    </td>
                    <td className="max-w-80 px-3 py-2.5 wrap-anywhere text-ink" data-testid="corpus-text">
                      {statement.raw_text}
                    </td>
                    <td className="px-3 py-2.5 text-muted" data-testid="corpus-source">{statement.source_kind}</td>
                    <td className="tabular px-3 py-2.5 text-muted" data-testid="corpus-revision">{statement.revision}</td>
                    <td className="px-3 py-2.5" data-testid="corpus-status">
                      {statement.published_revision === statement.revision ? (
                        <span className="inline-block rounded-full bg-success-subtle px-2.5 py-0.5 text-caption font-semibold text-success">
                          Published
                        </span>
                      ) : statement.published_revision !== null ? (
                        <span className="inline-block rounded-full bg-warning-subtle px-2.5 py-0.5 text-caption font-semibold text-warning">
                          Stale publish
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-surface-inset px-2.5 py-0.5 text-caption text-muted">
                          Unpublished
                        </span>
                      )}
                    </td>
                    <td className="max-w-48 px-3 py-2.5 text-muted">{statement.topics.join(', ') || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1 whitespace-nowrap">
                        <button className={rowActionClass} type="button" onClick={() => openEdit(statement)}>
                          Edit
                        </button>
                        <button
                          className={rowActionClass}
                          type="button"
                          onClick={() => setHistoryStatementId(statement.statement_id)}
                        >
                          <History size={13} aria-hidden="true" /> History
                        </button>
                        {statement.published_revision === statement.revision ? (
                          <button
                            className={rowActionClass}
                            type="button"
                            disabled={rowActionId === statement.statement_id}
                            onClick={() => handleUnpublish(statement)}
                          >
                            <X size={13} aria-hidden="true" /> Unpublish
                          </button>
                        ) : (
                          <button
                            className={rowActionClass}
                            type="button"
                            disabled={rowActionId === statement.statement_id}
                            onClick={() => handlePublish(statement)}
                          >
                            <Upload size={13} aria-hidden="true" /> Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </m.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {drawerMode !== 'closed' && (
          <CorpusDrawer
            key={drawerKey}
            editing={editingStatement}
            conflict={conflictStatement}
            submitting={drawerSubmitting}
            error={drawerError}
            onCancel={closeDrawer}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyStatementId && (
          <CorpusHistoryPanel statementId={historyStatementId} onClose={() => setHistoryStatementId(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
