import { Download, FileInput, RotateCcw, Sparkles } from 'lucide-react'
import { MAX_INPUT_CHARACTERS } from '../../domain/francanglais'

type StatementEditorProps = {
  text: string
  error: string | null
  canExport: boolean
  onChange: (text: string) => void
  onExample: () => void
  onClear: () => void
  onImport: () => void
  onExport: () => void
}

export function StatementEditor({
  text, error, canExport, onChange, onExample, onClear, onImport, onExport,
}: StatementEditorProps) {
  return (
    <section className="editor-section" aria-labelledby="statement-heading">
      <div className="section-heading">
        <div>
          <span className="section-index">01 / SOURCE</span>
          <h2 id="statement-heading">Statement</h2>
        </div>
        <span className="scope-label">Francanglais</span>
      </div>
      <div className="editor-frame">
        <div className="editor-toolbar">
          <label htmlFor="statement">Original wording</label>
          <button className="icon-button" type="button" onClick={onClear}
            disabled={!text} aria-label="Clear statement" title="Clear statement">
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        </div>
        <textarea id="statement" lang="fr" value={text} spellCheck={false}
          autoCorrect="off" autoCapitalize="off"
          placeholder="Votre phrase en francanglais..."
          aria-invalid={Boolean(error)} aria-describedby="character-count input-error"
          onChange={(event) => onChange(event.target.value)} />
        <div className="editor-footer">
          <span>UTF-8</span>
          <span id="character-count">{Array.from(text).length} / {MAX_INPUT_CHARACTERS} characters</span>
        </div>
      </div>
      <p className="input-error" id="input-error" role="status">{error}</p>
      <div className="editor-actions">
        <button className="primary-button" type="button" onClick={onExport} disabled={!canExport}>
          <Download size={17} aria-hidden="true" /> Export input
        </button>
        <button className="secondary-button" type="button" onClick={onImport}>
          <FileInput size={17} aria-hidden="true" /> Import input
        </button>
        <button className="text-button" type="button" onClick={onExample} disabled={Boolean(text)}>
          <Sparkles size={16} aria-hidden="true" /> Demo example
        </button>
      </div>
    </section>
  )
}