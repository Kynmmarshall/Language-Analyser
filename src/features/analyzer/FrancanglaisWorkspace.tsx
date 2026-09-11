import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { MapPin, Wifi, WifiOff } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { createAnalysisRequest, inputError, parseAnalysisRequest } from '../../domain/francanglais'
import { analyzeStatement, AnalysisApiError } from '../../domain/api'
import type { AnalyzeResponse } from '../../domain/api'
import { fadeInUp, springSmooth, staggerContainer } from '../../motion/presets'
import { AnalysisPanel } from './AnalysisPanel'
import { StatementEditor } from './StatementEditor'

const DEMO_TEXT = 'Combi, on go au kwatt.'

export function FrancanglaisWorkspace() {
  const [text, setText] = useState('')
  const [provenance, setProvenance] = useState('Local draft')
  const [notice, setNotice] = useState('')
  const [importError, setImportError] = useState('')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const draftVersion = useRef(0)
  const abortController = useRef<AbortController | null>(null)
  const validationError = inputError(text)
  const request = validationError ? null : createAnalysisRequest(text)

  useEffect(() => () => abortController.current?.abort(), [])

  function updateDraft(value: string, source = 'Local draft') {
    draftVersion.current += 1
    setText(value)
    setProvenance(source)
    setNotice('')
    setImportError('')
    if (result) setStale(true)
  }

  async function runAnalysis() {
    if (!request) return
    abortController.current?.abort()
    const controller = new AbortController()
    abortController.current = controller
    const version = draftVersion.current
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const response = await analyzeStatement(request, controller.signal)
      if (version !== draftVersion.current) return
      setResult(response)
      setStale(false)
    } catch (error) {
      if (controller.signal.aborted) return
      setAnalysisError(
        error instanceof AnalysisApiError ? error.message : 'The analysis could not be completed.',
      )
    } finally {
      if (version === draftVersion.current) setAnalyzing(false)
    }
  }

  function clearDraft() {
    if (window.confirm('Discard this statement?')) updateDraft('')
  }

  function exportInput() {
    if (!request) return
    const blob = new Blob([`${JSON.stringify(request, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'francanglais-input.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setNotice('Input exported. No analysis results are included.')
  }

  async function importInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const version = draftVersion.current
    setImportError('')
    try {
      if (file.size > 65536) throw new Error('Choose an input file smaller than 64 KiB.')
      const imported = parseAnalysisRequest(JSON.parse(await file.text()))
      if (version !== draftVersion.current) {
        throw new Error('The draft changed while importing. Import the file again.')
      }
      if (text && text !== imported.text && !window.confirm('Replace the current statement?')) return
      updateDraft(imported.text, 'Imported input / unverified')
      setNotice('Input imported. No field-data provenance is implied.')
    } catch (error) {
      setImportError(error instanceof SyntaxError
        ? 'The input file is not valid JSON.'
        : error instanceof Error ? error.message : 'The input could not be imported.')
    }
  }

  return (
    <>
      <m.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-7 flex flex-wrap items-end justify-between gap-4"
      >
        <m.div variants={fadeInUp}>
          <p className="mb-2 flex items-center gap-1.5 text-small text-muted">
            <MapPin size={14} aria-hidden="true" /> Yaound&eacute;, Cameroon
          </p>
          <h1 className="text-display text-ink">
            Francanglais Studio<span className="text-accent">.</span>
          </h1>
        </m.div>
        <m.p
          variants={fadeInUp}
          className="flex items-center gap-2 text-small text-muted"
          id="analyzer-status"
        >
          {analysisError && !analyzing ? (
            <>
              <span className="size-1.5 rounded-full bg-danger" />
              <WifiOff size={15} aria-hidden="true" /> Analyzer unreachable
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-success" />
              <Wifi size={15} aria-hidden="true" /> Analyzer connected
            </>
          )}
        </m.p>
      </m.div>

      <div className="mb-px flex flex-wrap items-center gap-2 border-t border-hairline py-3.5 text-caption text-muted">
        <span className="size-1.5 shrink-0 rounded-full bg-info" />
        {provenance}
        <span className="ml-auto text-faint">Not stored on a server</span>
      </div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springSmooth, delay: 0.05 }}
        className="panel grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
        data-testid="workbench"
      >
        <StatementEditor text={text} error={text ? validationError : null}
          canExport={Boolean(request)} onChange={(value) => updateDraft(value,
            provenance === 'Synthetic demo' ? 'Synthetic demo' : 'Local draft')}
          onClear={clearDraft} onImport={() => fileInput.current?.click()}
          onExport={exportInput} onExample={() => updateDraft(DEMO_TEXT, 'Synthetic demo')} />
        <AnalysisPanel request={request} result={result} loading={analyzing}
          error={analysisError} stale={stale} onAnalyze={runAnalysis} />
      </m.div>

      <input ref={fileInput} type="file" accept=".json,application/json"
        aria-label="Import input JSON" hidden onChange={importInput} />

      <p className="min-h-7 pt-3 text-small text-accent" role="status">{notice}</p>

      <AnimatePresence>
        {importError && (
          <m.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={springSmooth}
            className="rounded-control border-l-2 border-danger bg-danger-subtle px-4 py-3 text-small text-danger"
            role="alert"
          >
            {importError}
          </m.p>
        )}
      </AnimatePresence>
    </>
  )
}