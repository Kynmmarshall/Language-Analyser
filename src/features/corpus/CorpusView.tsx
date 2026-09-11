import { useEffect, useMemo, useState } from 'react'
import { History, Plus, RefreshCw, Upload, X } from 'lucide-react'
import {
  AnalysisApiError, createCorpusStatement, getCorpusStatement, listCorpus,
  publishCorpusStatement, unpublishCorpusStatement, updateCorpusStatement,
} from '../../domain/api'
import type { StatementCreateRequest, StatementPrivate, StatementUpdateRequest } from '../../domain/api'
import { CorpusDrawer } from './CorpusDrawer'
import { CorpusHistoryPanel } from './CorpusHistoryPanel'
import './corpus.css'

type SourceFilter = 'all' | 'demo' | 'field'
type PublishFilter = 'all' | 'published' | 'unpublished'

export function CorpusView() {
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
    <section className="corpus-view" aria-labelledby="corpus-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">CORPUS</span>
          <h2 id="corpus-heading">Statements</h2>
        </div>
        <div className="corpus-toolbar-actions">
          <button className="icon-button" type="button" aria-label="Refresh" onClick={refresh}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
          <button className="primary-button" type="button" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" /> New statement
          </button>
        </div>
      </div>

      <div className="corpus-filters">
        <input type="search" aria-label="Search statements" placeholder="Search text, id, or topic"
          value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Filter by source" value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}>
          <option value="all">All sources</option>
          <option value="field">Field</option>
          <option value="demo">Demo</option>
        </select>
        <select aria-label="Filter by publication status" value={publishFilter}
          onChange={(event) => setPublishFilter(event.target.value as PublishFilter)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </div>

      {loadError && <p className="operation-error" role="alert">{loadError}</p>}
      {rowActionError && <p className="operation-error" role="alert">{rowActionError}</p>}

      {!statements && !loadError && <p>Loading corpus…</p>}
      {statements && filtered.length === 0 && <p className="corpus-empty" data-testid="corpus-empty">No statements match.</p>}

      {filtered.length > 0 && (
        <div className="corpus-table-wrap">
          <table className="corpus-table">
            <thead>
              <tr>
                <th>ID</th><th>Text</th><th>Source</th><th>Rev.</th>
                <th>Published</th><th>Topics</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((statement) => (
                <tr key={statement.statement_id} data-testid="corpus-row">
                  <td className="corpus-id" data-testid="corpus-id">{statement.statement_id}</td>
                  <td className="corpus-text" data-testid="corpus-text">{statement.raw_text}</td>
                  <td data-testid="corpus-source">{statement.source_kind}</td>
                  <td data-testid="corpus-revision">{statement.revision}</td>
                  <td data-testid="corpus-status">
                    {statement.published_revision === statement.revision ? (
                      <span className="status-pill status-published">Published</span>
                    ) : statement.published_revision !== null ? (
                      <span className="status-pill status-stale">Stale publish</span>
                    ) : (
                      <span className="status-pill">Unpublished</span>
                    )}
                  </td>
                  <td className="corpus-topics">{statement.topics.join(', ') || '—'}</td>
                  <td className="corpus-actions">
                    <button className="text-button" type="button" onClick={() => openEdit(statement)}>
                      Edit
                    </button>
                    <button className="text-button" type="button"
                      onClick={() => setHistoryStatementId(statement.statement_id)}>
                      <History size={14} aria-hidden="true" /> History
                    </button>
                    {statement.published_revision === statement.revision ? (
                      <button className="text-button" type="button" disabled={rowActionId === statement.statement_id}
                        onClick={() => handleUnpublish(statement)}>
                        <X size={14} aria-hidden="true" /> Unpublish
                      </button>
                    ) : (
                      <button className="text-button" type="button" disabled={rowActionId === statement.statement_id}
                        onClick={() => handlePublish(statement)}>
                        <Upload size={14} aria-hidden="true" /> Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {historyStatementId && (
        <CorpusHistoryPanel statementId={historyStatementId} onClose={() => setHistoryStatementId(null)} />
      )}
    </section>
  )
}
