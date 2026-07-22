import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const querySource = await readFile(
  new URL('../functions/operationsDiagnosticQueries.js', import.meta.url),
  'utf8'
);
const migrationSource = await readFile(
  new URL('../database/operations-diagnostics.sql', import.meta.url),
  'utf8'
);

const OPERATIONAL_TABLES = [
  'operations_diagnostic_submission',
  'operations_diagnostic_section_response',
  'operations_diagnostic_answer',
  'operations_diagnostic_section_result',
  'operations_diagnostic_submission_result'
];

test('persistência operacional usa somente tabelas dedicadas', () => {
  for (const table of OPERATIONAL_TABLES) {
    assert.match(querySource, new RegExp(`\\b${table}\\b`));
    assert.match(migrationSource, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }

  assert.doesNotMatch(querySource, /(?<!operations_)\bdiagnostic_submission\b/);
  assert.doesNotMatch(querySource, /(?<!operations_)\bdiagnostic_answer\b/);
  assert.doesNotMatch(querySource, /\bmetadata\b|diagnosticType/);
  assert.doesNotMatch(migrationSource, /REFERENCES diagnostic_submission\b/);
});

test('submissão original e revisão atual são armazenadas separadamente', () => {
  for (const column of [
    'submitted_evaluation_code',
    'submitted_implementation_date',
    'submitted_will_implement',
    'submitted_notes',
    'submitted_answers_responsible_name',
    'submitted_sector_responsible_name'
  ]) {
    assert.match(migrationSource, new RegExp(`\\b${column}\\b`));
  }

  assert.match(querySource, /jsonb_to_recordset/);
  assert.match(querySource, /sql\.transaction\(queries\)/);
  assert.match(querySource, /\], \{ readOnly: true \}\)/);
  assert.doesNotMatch(querySource, /COUNT\(answer/);
  assert.match(
    querySource,
    /submitted_implementation_date::text AS submitted_implementation_date/
  );
  assert.match(querySource, /implementation_date::text AS implementation_date/);

  const reviewUpdate = querySource.slice(
    querySource.indexOf('export async function saveOperationsDiagnosticReview')
  );
  assert.doesNotMatch(reviewUpdate, /SET[\s\S]*submitted_evaluation_code\s*=/);
  assert.doesNotMatch(reviewUpdate, /SET[\s\S]*submitted_notes\s*=/);
});
