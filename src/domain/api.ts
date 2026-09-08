import type { AnalysisRequest } from './francanglais'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000'

export type LanguageLabel =
  | 'english'
  | 'french'
  | 'pidgin'
  | 'fulfulde'
  | 'ewondo'
  | 'mixed'
  | 'uncertain'

export type SourceSpan = Readonly<{ start: number; end: number }>

export type Token = Readonly<{
  raw: string
  canonical: string
  terminal: string
  part_of_speech: string
  language_candidates: readonly LanguageLabel[]
  is_slang: boolean
  is_multiword: boolean
  component_spans: readonly SourceSpan[]
  rule_id: string
  span: SourceSpan
}>

export type ParserAction = 'push' | 'match' | 'expand' | 'accept' | 'reject'

export type TraceStep = Readonly<{
  step: number
  stack: readonly string[]
  remaining_terminals: readonly string[]
  action: ParserAction
  production_id: string | null
}>

export type RejectionReason =
  | 'lexical_unknown_token'
  | 'syntax_no_table_entry'
  | 'syntax_trailing_input'
  | 'resource_limit_exceeded'

export type ParseTreeNode = Readonly<{
  symbol: string
  production_id: string | null
  token_span: SourceSpan | null
  children: readonly ParseTreeNode[]
}>

export type ParseResult = Readonly<{
  accepted: boolean
  rejection_reason: RejectionReason | null
  matched_token_count: number
  failing_position: number | null
  expected_terminals: readonly string[]
  applied_production_ids: readonly string[]
  trace: readonly TraceStep[]
  tree: ParseTreeNode | null
}>

export type TopicMatch = Readonly<{ topic: string; matched_terms: readonly string[] }>

export type AnalyzeResponse = Readonly<{
  tokens: readonly Token[]
  parse: ParseResult
  topics: readonly TopicMatch[]
}>

export class AnalysisApiError extends Error {}

export async function analyzeStatement(
  request: AnalysisRequest,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch {
    throw new AnalysisApiError('Could not reach the analyzer service.')
  }
  if (!response.ok) {
    let detail = `Analyzer request failed (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: string }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // ignore body parse failure, keep default message
    }
    throw new AnalysisApiError(detail)
  }
  return (await response.json()) as AnalyzeResponse
}
