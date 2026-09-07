export const TARGET_VARIETY = 'cameroon_francanglais' as const
export const TARGET_LABEL = 'Cameroonian Francanglais'
export const MAX_INPUT_CHARACTERS = 2000

export type AnalysisRequest = Readonly<{
  target_variety: typeof TARGET_VARIETY
  text: string
}>

export function inputError(text: string): string | null {
  if (!text.trim()) return 'Enter a statement first.'
  if (Array.from(text).length > MAX_INPUT_CHARACTERS) {
    return `Keep the statement within ${MAX_INPUT_CHARACTERS} characters.`
  }
  return null
}

export function createAnalysisRequest(text: string): AnalysisRequest {
  const error = inputError(text)
  if (error) throw new Error(error)
  return Object.freeze({ target_variety: TARGET_VARIETY, text })
}

export function parseAnalysisRequest(value: unknown): AnalysisRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('The input file must contain a JSON object.')
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).some((key) => key !== 'text' && key !== 'target_variety')) {
    throw new Error('Only text and target_variety are supported.')
  }
  if ('target_variety' in record && record.target_variety !== TARGET_VARIETY) {
    throw new Error('Only Cameroonian Francanglais is supported.')
  }
  if (typeof record.text !== 'string') {
    throw new Error('The input file must contain a text string.')
  }
  return createAnalysisRequest(record.text)
}