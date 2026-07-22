import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS,
  calculateOperationsDiagnosticResults,
  OPERATIONS_DIAGNOSTIC_SECTIONS,
  OPERATIONS_EVALUATION_OPTIONS,
  OPERATIONS_NOTE_MAX_LENGTH
} from '../lib/operationsDiagnosticCatalog.js';

const EXPECTED_QUESTION_COUNTS = {
  comercial: 63,
  churn: 31,
  marketing: 52,
  customer_success: 15,
  atendimento: 17,
  rh_cultura: 48
};

test('catálogo operacional mantém a estrutura extraída da planilha', () => {
  assert.equal(OPERATIONS_DIAGNOSTIC_SECTIONS.length, 6);
  assert.equal(OPERATIONS_DIAGNOSTIC_SECTIONS.flatMap(section => section.groups).length, 34);
  assert.equal(ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length, 226);
  assert.equal(OPERATIONS_NOTE_MAX_LENGTH, 1200);
  assert.equal(new Set(ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.map(question => question.code)).size, 226);

  assert.deepEqual(
    Object.fromEntries(OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => [section.code, section.implementationMode])),
    {
      comercial: 'none',
      churn: 'date',
      marketing: 'date',
      customer_success: 'boolean',
      atendimento: 'boolean',
      rh_cultura: 'date'
    }
  );

  for (const section of OPERATIONS_DIAGNOSTIC_SECTIONS) {
    const questions = section.groups.flatMap(group => group.questions);
    assert.equal(questions.length, EXPECTED_QUESTION_COUNTS[section.code]);
    assert.ok(questions.every(question => Number.isInteger(question.sourceRow) && question.sourceRow > 0));
    assert.ok(questions.every(question => typeof question.text === 'string' && question.text.trim()));
  }
});

test('opções de avaliação usam a regra operacional 10/5/0', () => {
  assert.deepEqual(
    Object.fromEntries(OPERATIONS_EVALUATION_OPTIONS.map(option => [option.code, option.score])),
    { sim: 10, revisar: 5, nao: 0 }
  );

  for (const [evaluationCode, expectedPercentage] of [['sim', 1], ['revisar', 0.5], ['nao', 0]]) {
    const answers = ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.map(question => ({
      questionCode: question.code,
      evaluationCode
    }));
    const results = calculateOperationsDiagnosticResults(answers);
    assert.equal(results.overallPercentage, expectedPercentage);
    assert.equal(results.answeredCount, 226);
    assert.equal(results.totalQuestions, 226);
  }
});

test('índice consolidado dá o mesmo peso para cada uma das seis áreas', () => {
  const answers = ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.map(question => ({
    questionCode: question.code,
    evaluationCode: question.sectionCode === 'customer_success' ? 'sim' : 'nao'
  }));
  const results = calculateOperationsDiagnosticResults(answers);

  assert.equal(results.overallPercentage, 1 / 6);
  assert.equal(results.scoreTotal / results.maximumTotal, results.overallPercentage);
  assert.equal(results.itemScoreTotal, 150);
  assert.equal(results.itemMaximumTotal, 2260);
});

test('catálogo não contém o artefato residual da planilha', () => {
  const serialized = JSON.stringify(OPERATIONS_DIAGNOSTIC_SECTIONS);
  assert.equal(serialized.includes('Perguntar ao ChatGPT'), false);
});
