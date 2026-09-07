import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createAnalysisRequest,
  inputError,
  MAX_INPUT_CHARACTERS,
  parseAnalysisRequest,
  TARGET_VARIETY,
} from '../src/domain/francanglais.ts'

test('requests always use the fixed variety and preserve raw text', () => {
  const text = '  Le re\u0301seau au kwatt ! \u{1f4f1}\n'
  const request = createAnalysisRequest(text)
  assert.deepEqual(request, { target_variety: TARGET_VARIETY, text })
  assert.ok(Object.isFrozen(request))
  assert.deepEqual(parseAnalysisRequest(JSON.parse(JSON.stringify(request))), request)
})

test('legacy input defaults to Francanglais', () => {
  assert.equal(parseAnalysisRequest({ text: 'Combi, on go.' }).target_variety, TARGET_VARIETY)
})

test('other languages and extra fields cannot enable other modes', () => {
  for (const target of ['english', 'french', 'pidgin', 'multilingual', null]) {
    assert.throws(() => parseAnalysisRequest({ text: 'Combi', target_variety: target }))
  }
  assert.throws(() => parseAnalysisRequest({ text: 'Combi', language: 'french' }))
})

test('invalid shapes, whitespace, and oversized input fail', () => {
  for (const value of [null, [], 'Combi', {}, { text: 10 }, { text: '' }, { text: '\n\t ' }]) {
    assert.throws(() => parseAnalysisRequest(value))
  }
  assert.throws(() => createAnalysisRequest('x'.repeat(MAX_INPUT_CHARACTERS + 1)))
  assert.equal(inputError('Combi'), null)
})

test('limits use Unicode code points, not UTF-16 units', () => {
  const text = '\u{1f4f1}'.repeat(MAX_INPUT_CHARACTERS)
  assert.equal(createAnalysisRequest(text).text, text)
  assert.throws(() => createAnalysisRequest(`${text}x`))
})