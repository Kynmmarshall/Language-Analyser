import { Download, FileInput, RotateCcw, Sparkles } from 'lucide-react'
import { m } from 'motion/react'
import { MAX_INPUT_CHARACTERS } from '../../domain/francanglais'
import { pressable } from '../../motion/presets'

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
  const count = Array.from(text).length
  const over = count > MAX_INPUT_CHARACTERS

  return (
    <section className="min-w-0 p-6 lg:p-8" aria-labelledby="statement-heading">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.14em] text-faint">
            01 / SOURCE
          </span>
          <h2 id="statement-heading" className="text-h2 text-ink">Statement</h2>
        </div>
        <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-caption font-semibold text-accent">
          Francanglais
        </span>
      </div>

      <div className="overflow-hidden rounded-panel border border-hairline bg-surface transition-colors focus-within:border-strong">
        <div className="flex min-h-12 items-center justify-between gap-2 border-b border-hairline bg-surface-sunken px-4 py-2">
          <label htmlFor="statement" className="text-small font-semibold text-muted">
            Original wording
          </label>
          <button
            className="grid size-9 place-items-center rounded-control text-faint transition-colors hover:bg-surface-inset hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            type="button"
            onClick={onClear}
            disabled={!text}
            aria-label="Clear statement"
            title="Clear statement"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        </div>

        <textarea
          id="statement"
          lang="fr"
          value={text}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Votre phrase en francanglais..."
          aria-invalid={Boolean(error)}
          aria-describedby="character-count input-error"
          onChange={(event) => onChange(event.target.value)}
          className="block max-h-[32rem] min-h-[13rem] w-full resize-y bg-surface px-5 py-4 text-[1.1875rem] leading-[1.75] text-ink outline-none placeholder:text-faint"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-2.5 font-mono text-[10px] text-faint">
          <span>UTF-8</span>
          <span id="character-count" className={`tabular ${over ? 'text-danger' : ''}`}>
            {count} / {MAX_INPUT_CHARACTERS} characters
          </span>
        </div>
      </div>

      <p
        className="min-h-7 py-1 text-small text-danger"
        id="input-error"
        role="status"
      >
        {error}
      </p>

      <div className="flex flex-wrap gap-2.5">
        <m.button
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control bg-accent px-4 text-small font-semibold text-accent-contrast shadow-e1 transition-colors hover:bg-accent-hover disabled:bg-surface-inset disabled:text-faint disabled:shadow-none sm:flex-none"
          type="button"
          onClick={onExport}
          disabled={!canExport}
          {...(canExport ? pressable : {})}
        >
          <Download size={16} aria-hidden="true" /> Export input
        </m.button>

        <m.button
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control border border-hairline bg-surface px-4 text-small font-semibold text-ink transition-colors hover:border-strong sm:flex-none"
          type="button"
          onClick={onImport}
          {...pressable}
        >
          <FileInput size={16} aria-hidden="true" /> Import input
        </m.button>

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-control px-3 text-small font-semibold text-muted transition-colors hover:bg-accent-subtle hover:text-accent disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
          type="button"
          onClick={onExample}
          disabled={Boolean(text)}
        >
          <Sparkles size={15} aria-hidden="true" /> Demo example
        </button>
      </div>
    </section>
  )
}