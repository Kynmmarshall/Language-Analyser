import type { AnalysisRequest } from './francanglais'

// Relative by default so requests go through the frontend dev server's proxy (or the
// same origin in production); override only for a genuinely separate API host.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

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

export class AnalysisApiError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.status = status
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = readCookie('csrf_token')
    if (csrfToken) headers.set('x-csrf-token', csrfToken)
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, method, headers, credentials: 'include' })
  } catch {
    throw new AnalysisApiError('Could not reach the analyzer service.')
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: string }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // ignore body parse failure, keep default message
    }
    throw new AnalysisApiError(detail, response.status)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function analyzeStatement(
  request: AnalysisRequest,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  return apiRequest<AnalyzeResponse>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  })
}

export type UserPublic = Readonly<{ username: string }>

export function login(username: string, password: string): Promise<UserPublic> {
  return apiRequest<UserPublic>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export function fetchCurrentUser(): Promise<UserPublic> {
  return apiRequest<UserPublic>('/api/auth/me')
}

export type StatementPrivate = Readonly<{
  statement_id: string
  revision: number
  source_kind: 'demo' | 'field'
  raw_text: string
  manual_transcription_attested: boolean
  collector_id: string
  topics: readonly string[]
  created_at: string
  published_revision: number | null
}>

export type StatementPublic = Readonly<{
  statement_id: string
  raw_text: string
  topics: readonly string[]
}>

export type StatementRevisionHistoryItem = Readonly<{
  revision: number
  source_kind: 'demo' | 'field'
  raw_text: string
  manual_transcription_attested: boolean
  collector_id: string
  topics: readonly string[]
  created_at: string
  created_by: string | null
}>

export type StatementCreateRequest = Readonly<{
  statement_id: string
  source_kind: 'demo' | 'field'
  raw_text: string
  manual_transcription_attested: boolean
  collector_id: string
  topics?: readonly string[]
}>

export type StatementUpdateRequest = Readonly<{
  expected_revision: number
  raw_text: string
  source_kind: 'demo' | 'field'
  manual_transcription_attested: boolean
  collector_id: string
  topics?: readonly string[]
}>

export function listExamples(): Promise<StatementPublic[]> {
  return apiRequest<StatementPublic[]>('/api/examples')
}

export function listCorpus(): Promise<StatementPrivate[]> {
  return apiRequest<StatementPrivate[]>('/api/corpus')
}

export function createCorpusStatement(payload: StatementCreateRequest): Promise<StatementPrivate> {
  return apiRequest<StatementPrivate>('/api/corpus', { method: 'POST', body: JSON.stringify(payload) })
}

export function getCorpusStatement(statementId: string): Promise<StatementPrivate> {
  return apiRequest<StatementPrivate>(`/api/corpus/${encodeURIComponent(statementId)}`)
}

export function getCorpusHistory(statementId: string): Promise<StatementRevisionHistoryItem[]> {
  return apiRequest<StatementRevisionHistoryItem[]>(
    `/api/corpus/${encodeURIComponent(statementId)}/history`,
  )
}

export function updateCorpusStatement(
  statementId: string,
  payload: StatementUpdateRequest,
): Promise<StatementPrivate> {
  return apiRequest<StatementPrivate>(`/api/corpus/${encodeURIComponent(statementId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function publishCorpusStatement(statementId: string, revision: number): Promise<StatementPrivate> {
  return apiRequest<StatementPrivate>(`/api/corpus/${encodeURIComponent(statementId)}/publish`, {
    method: 'POST',
    body: JSON.stringify({ revision }),
  })
}

export function unpublishCorpusStatement(statementId: string): Promise<StatementPrivate> {
  return apiRequest<StatementPrivate>(`/api/corpus/${encodeURIComponent(statementId)}/unpublish`, {
    method: 'POST',
  })
}
