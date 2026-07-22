import sql from './db.js';
import {
  ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS,
  calculateOperationsDiagnosticResults,
  OPERATIONS_DIAGNOSTIC_TEMPLATE
} from '../lib/operationsDiagnosticCatalog.js';

const OPERATIONS_DIAGNOSTIC_TYPE = 'operations';

function asMetadata(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function buildStoredResults(answers) {
  const results = calculateOperationsDiagnosticResults(answers);

  return {
    scoreTotal: results.scoreTotal,
    maximumTotal: results.maximumTotal,
    itemScoreTotal: results.itemScoreTotal,
    itemMaximumTotal: results.itemMaximumTotal,
    overallPercentage: results.overallPercentage,
    answeredCount: results.answeredCount,
    totalQuestions: results.totalQuestions,
    progress: results.progress,
    sections: results.sections.map(section => ({
      sectionCode: section.code,
      scoreTotal: section.scoreTotal,
      maximumTotal: section.maximumTotal,
      percentage: section.percentage,
      answeredCount: section.answeredCount,
      totalQuestions: section.totalQuestions,
      groups: section.groups.map(group => ({
        groupCode: group.code,
        scoreTotal: group.scoreTotal,
        maximumTotal: group.maximumTotal,
        percentage: group.percentage,
        answeredCount: group.answeredCount,
        totalQuestions: group.totalQuestions
      }))
    }))
  };
}

function buildMetadata({ sections, answers, includeCurrentAnswers = true }) {
  const metadata = {
    diagnosticType: OPERATIONS_DIAGNOSTIC_TYPE,
    templateCode: OPERATIONS_DIAGNOSTIC_TEMPLATE.code,
    templateVersion: OPERATIONS_DIAGNOSTIC_TEMPLATE.version,
    formulaCode: OPERATIONS_DIAGNOSTIC_TEMPLATE.formulaCode,
    results: buildStoredResults(answers)
  };

  if (includeCurrentAnswers) {
    metadata.sections = sections;
    metadata.answers = answers;
  }
  return metadata;
}

function countReviewedAnswers(answers) {
  return answers.filter(answer => String(answer?.evaluationCode || '').trim()).length;
}

function toListItem(row) {
  return {
    public_id: row.public_id,
    company_name: row.company_name,
    diagnostic_date: row.diagnostic_date,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    overall_score_ratio: row.overall_score_ratio,
    answer_count: Number(row.answer_count) || ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length,
    reviewed_answer_count: Number(row.reviewed_answer_count) || 0
  };
}

function toDetail(row) {
  const metadata = asMetadata(row.metadata);
  const submittedSections = Array.isArray(metadata.submittedSections)
    ? metadata.submittedSections
    : Array.isArray(metadata.sections) ? metadata.sections : [];
  const submittedAnswers = Array.isArray(metadata.submittedAnswers)
    ? metadata.submittedAnswers
    : Array.isArray(metadata.answers) ? metadata.answers : [];
  const sections = Array.isArray(metadata.sections) ? metadata.sections : submittedSections;
  const answers = Array.isArray(metadata.answers) ? metadata.answers : submittedAnswers;
  const results = asMetadata(metadata.results);

  return {
    public_id: row.public_id,
    company_name: row.company_name,
    diagnostic_date: row.diagnostic_date,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    overall_score_ratio: results.overallPercentage ?? null,
    answer_count: Number(results.totalQuestions) || ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length,
    reviewed_answer_count: countReviewedAnswers(answers),
    formula_code: metadata.formulaCode || OPERATIONS_DIAGNOSTIC_TEMPLATE.formulaCode,
    sections,
    answers,
    submittedSections,
    submittedAnswers,
    results
  };
}

export async function createPublicOperationsDiagnosticSubmission({
  publicId,
  companyName,
  diagnosticDate,
  sections,
  answers
}) {
  const metadata = {
    ...buildMetadata({ sections, answers, includeCurrentAnswers: false }),
    submittedSections: sections,
    submittedAnswers: answers
  };
  const rows = await sql`
    INSERT INTO diagnostic_submission (
      public_id,
      status,
      company_name,
      diagnostic_date,
      submitted_at,
      metadata
    )
    VALUES (
      ${publicId},
      'submitted',
      ${companyName},
      ${diagnosticDate},
      now(),
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING public_id
  `;

  if (!rows[0]) {
    throw new Error('Não foi possível criar a submissão do diagnóstico operacional.');
  }
  return rows[0];
}

export async function getOperationsDiagnosticSubmissions() {
  const rows = await sql`
    SELECT
      public_id,
      company_name,
      diagnostic_date,
      status,
      submitted_at,
      reviewed_at,
      NULLIF(metadata#>>'{results,overallPercentage}', '')::numeric AS overall_score_ratio,
      COALESCE(
        NULLIF(metadata#>>'{results,totalQuestions}', '')::integer,
        ${ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length}
      ) AS answer_count,
      COALESCE(
        NULLIF(metadata#>>'{results,answeredCount}', '')::integer,
        0
      ) AS reviewed_answer_count
    FROM diagnostic_submission
    WHERE metadata->>'diagnosticType' = ${OPERATIONS_DIAGNOSTIC_TYPE}
    ORDER BY created_at DESC
  `;

  return rows.map(toListItem);
}

export async function getOperationsDiagnosticSubmission(publicId) {
  const rows = await sql`
    SELECT
      public_id,
      company_name,
      diagnostic_date,
      status,
      submitted_at,
      reviewed_at,
      metadata
    FROM diagnostic_submission
    WHERE public_id = ${publicId}
      AND metadata->>'diagnosticType' = ${OPERATIONS_DIAGNOSTIC_TYPE}
    LIMIT 1
  `;

  return rows[0] ? toDetail(rows[0]) : null;
}

export async function saveOperationsDiagnosticReview({ publicId, answers, sections }) {
  const metadataPatch = buildMetadata({ sections, answers });
  const rows = await sql`
    UPDATE diagnostic_submission
    SET
      status = 'under_review',
      reviewed_at = now(),
      updated_at = now(),
      metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(metadataPatch)}::jsonb
    WHERE public_id = ${publicId}
      AND metadata->>'diagnosticType' = ${OPERATIONS_DIAGNOSTIC_TYPE}
    RETURNING public_id
  `;

  if (!rows[0]) {
    throw new Error('Diagnóstico operacional não encontrado.');
  }
  return await getOperationsDiagnosticSubmission(publicId);
}
