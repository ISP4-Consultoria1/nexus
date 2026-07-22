import sql from './db.js';
import {
  ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS,
  calculateOperationsDiagnosticResults,
  OPERATIONS_DIAGNOSTIC_SECTIONS,
  OPERATIONS_DIAGNOSTIC_TEMPLATE
} from '../lib/operationsDiagnosticCatalog.js';

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

function buildResultQueries(publicId, answers) {
  const results = calculateOperationsDiagnosticResults(answers);
  const sectionResults = results.sections.map(section => ({
    sectionCode: section.code,
    scoreTotal: section.scoreTotal,
    maximumTotal: section.maximumTotal,
    percentage: section.percentage,
    answeredCount: section.answeredCount,
    totalQuestions: section.totalQuestions
  }));

  return [
    sql`
      INSERT INTO operations_diagnostic_section_result (
        submission_id,
        section_code,
        score_sum,
        max_score_sum,
        score_ratio,
        answered_count,
        total_question_count,
        calculation_code,
        calculated_at
      )
      SELECT
        submission.id,
        result."sectionCode",
        result."scoreTotal",
        result."maximumTotal",
        result.percentage,
        result."answeredCount",
        result."totalQuestions",
        ${OPERATIONS_DIAGNOSTIC_TEMPLATE.formulaCode},
        now()
      FROM operations_diagnostic_submission submission
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(sectionResults)}::jsonb) AS result(
        "sectionCode" text,
        "scoreTotal" numeric,
        "maximumTotal" numeric,
        percentage numeric,
        "answeredCount" smallint,
        "totalQuestions" smallint
      )
      WHERE submission.public_id = ${publicId}
      ON CONFLICT (submission_id, section_code)
      DO UPDATE SET
        score_sum = EXCLUDED.score_sum,
        max_score_sum = EXCLUDED.max_score_sum,
        score_ratio = EXCLUDED.score_ratio,
        answered_count = EXCLUDED.answered_count,
        total_question_count = EXCLUDED.total_question_count,
        calculation_code = EXCLUDED.calculation_code,
        calculated_at = EXCLUDED.calculated_at
    `,
    sql`
      INSERT INTO operations_diagnostic_submission_result (
        submission_id,
        overall_score_ratio,
        score_sum,
        max_score_sum,
        item_score_sum,
        item_max_score_sum,
        section_count,
        answered_count,
        total_question_count,
        calculation_code,
        calculated_at
      )
      SELECT
        submission.id,
        ${results.overallPercentage},
        ${results.scoreTotal},
        ${results.maximumTotal},
        ${results.itemScoreTotal},
        ${results.itemMaximumTotal},
        ${OPERATIONS_DIAGNOSTIC_SECTIONS.length},
        ${results.answeredCount},
        ${results.totalQuestions},
        ${OPERATIONS_DIAGNOSTIC_TEMPLATE.formulaCode},
        now()
      FROM operations_diagnostic_submission submission
      WHERE submission.public_id = ${publicId}
      ON CONFLICT (submission_id)
      DO UPDATE SET
        overall_score_ratio = EXCLUDED.overall_score_ratio,
        score_sum = EXCLUDED.score_sum,
        max_score_sum = EXCLUDED.max_score_sum,
        item_score_sum = EXCLUDED.item_score_sum,
        item_max_score_sum = EXCLUDED.item_max_score_sum,
        section_count = EXCLUDED.section_count,
        answered_count = EXCLUDED.answered_count,
        total_question_count = EXCLUDED.total_question_count,
        calculation_code = EXCLUDED.calculation_code,
        calculated_at = EXCLUDED.calculated_at
    `
  ];
}

function prepareSections(sections) {
  return sections.map(section => ({
    sectionCode: section.sectionCode,
    answersResponsible: section.answersResponsible || null,
    sectorResponsible: section.sectorResponsible || null
  }));
}

function prepareAnswers(answers) {
  return answers.map(answer => ({
    questionCode: answer.questionCode,
    evaluationCode: answer.evaluationCode,
    implementationDate: answer.implementationDate || null,
    willImplement: answer.willImplement ?? null,
    notes: answer.notes || ''
  }));
}

function mapSections(rows, submitted = false) {
  const orderByCode = new Map(
    OPERATIONS_DIAGNOSTIC_SECTIONS.map((section, index) => [section.code, index])
  );

  return [...rows]
    .sort((left, right) => (
      (orderByCode.get(left.section_code) ?? Number.MAX_SAFE_INTEGER)
      - (orderByCode.get(right.section_code) ?? Number.MAX_SAFE_INTEGER)
    ))
    .map(row => ({
      sectionCode: row.section_code,
      answersResponsible: submitted
        ? row.submitted_answers_responsible_name || ''
        : row.answers_responsible_name || '',
      sectorResponsible: submitted
        ? row.submitted_sector_responsible_name || ''
        : row.sector_responsible_name || ''
    }));
}

function mapAnswers(rows, submitted = false) {
  return rows.map(row => ({
    questionCode: row.question_code,
    evaluationCode: submitted ? row.submitted_evaluation_code : row.evaluation_code,
    implementationDate: submitted
      ? row.submitted_implementation_date
      : row.implementation_date,
    willImplement: submitted ? row.submitted_will_implement : row.will_implement,
    notes: submitted ? row.submitted_notes : row.notes
  }));
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
    answer_count: Number(row.answer_count) || 0,
    reviewed_answer_count: Number(row.reviewed_answer_count) || 0
  };
}

export async function createPublicOperationsDiagnosticSubmission({
  publicId,
  companyName,
  diagnosticDate,
  sections,
  answers
}) {
  const storedSections = prepareSections(sections);
  const storedAnswers = prepareAnswers(answers);
  const queries = [
    sql`
      INSERT INTO operations_diagnostic_submission (
        public_id,
        status,
        company_name,
        diagnostic_date,
        template_code,
        template_version,
        formula_code,
        submitted_at
      )
      VALUES (
        ${publicId},
        'submitted',
        ${companyName},
        ${diagnosticDate},
        ${OPERATIONS_DIAGNOSTIC_TEMPLATE.code},
        ${OPERATIONS_DIAGNOSTIC_TEMPLATE.version},
        ${OPERATIONS_DIAGNOSTIC_TEMPLATE.formulaCode},
        now()
      )
      RETURNING public_id
    `,
    sql`
      INSERT INTO operations_diagnostic_section_response (
        submission_id,
        section_code,
        submitted_answers_responsible_name,
        submitted_sector_responsible_name,
        answers_responsible_name,
        sector_responsible_name
      )
      SELECT
        submission.id,
        section."sectionCode",
        section."answersResponsible",
        section."sectorResponsible",
        section."answersResponsible",
        section."sectorResponsible"
      FROM operations_diagnostic_submission submission
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(storedSections)}::jsonb) AS section(
        "sectionCode" text,
        "answersResponsible" text,
        "sectorResponsible" text
      )
      WHERE submission.public_id = ${publicId}
    `,
    sql`
      INSERT INTO operations_diagnostic_answer (
        submission_id,
        question_code,
        submitted_evaluation_code,
        submitted_implementation_date,
        submitted_will_implement,
        submitted_notes,
        evaluation_code,
        implementation_date,
        will_implement,
        notes
      )
      SELECT
        submission.id,
        answer."questionCode",
        answer."evaluationCode",
        answer."implementationDate",
        answer."willImplement",
        COALESCE(answer.notes, ''),
        answer."evaluationCode",
        answer."implementationDate",
        answer."willImplement",
        COALESCE(answer.notes, '')
      FROM operations_diagnostic_submission submission
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(storedAnswers)}::jsonb) AS answer(
        "questionCode" text,
        "evaluationCode" text,
        "implementationDate" date,
        "willImplement" boolean,
        notes text
      )
      WHERE submission.public_id = ${publicId}
    `,
    ...buildResultQueries(publicId, storedAnswers)
  ];

  const results = await sql.transaction(queries);
  if (!results[0]?.[0]) {
    throw new Error('Não foi possível criar a submissão do diagnóstico operacional.');
  }
  return results[0][0];
}

export async function getOperationsDiagnosticSubmissions() {
  const rows = await sql`
    SELECT
      submission.public_id,
      submission.company_name,
      submission.diagnostic_date::text AS diagnostic_date,
      submission.status,
      submission.submitted_at,
      submission.reviewed_at,
      result.overall_score_ratio,
      COALESCE(
        result.total_question_count,
        ${ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length}
      )::integer AS answer_count,
      COALESCE(result.answered_count, 0)::integer AS reviewed_answer_count
    FROM operations_diagnostic_submission submission
    LEFT JOIN operations_diagnostic_submission_result result
      ON result.submission_id = submission.id
    ORDER BY submission.created_at DESC
  `;

  return rows.map(toListItem);
}

/*
 * As três leituras do detalhe são enviadas ao Neon como um único lote
 * transacional. Isso mantém um snapshot consistente e apenas um round-trip no
 * runtime serverless, mesmo com as 226 respostas do modelo.
 */
export async function getOperationsDiagnosticSubmission(publicId) {
  const [submissions, sectionRows, answerRows] = await sql.transaction([
    sql`
      SELECT
        submission.public_id,
        submission.company_name,
        submission.diagnostic_date::text AS diagnostic_date,
        submission.status,
        submission.submitted_at,
        submission.reviewed_at,
        submission.formula_code,
        result.overall_score_ratio
      FROM operations_diagnostic_submission submission
      LEFT JOIN operations_diagnostic_submission_result result
        ON result.submission_id = submission.id
      WHERE submission.public_id = ${publicId}
      LIMIT 1
    `,
    sql`
      SELECT
        response.section_code,
        response.submitted_answers_responsible_name,
        response.submitted_sector_responsible_name,
        response.answers_responsible_name,
        response.sector_responsible_name
      FROM operations_diagnostic_section_response response
      JOIN operations_diagnostic_submission submission
        ON submission.id = response.submission_id
      WHERE submission.public_id = ${publicId}
    `,
    sql`
      SELECT
        answer.question_code,
        answer.submitted_evaluation_code,
        answer.submitted_implementation_date::text AS submitted_implementation_date,
        answer.submitted_will_implement,
        answer.submitted_notes,
        answer.evaluation_code,
        answer.implementation_date::text AS implementation_date,
        answer.will_implement,
        answer.notes
      FROM operations_diagnostic_answer answer
      JOIN operations_diagnostic_submission submission
        ON submission.id = answer.submission_id
      WHERE submission.public_id = ${publicId}
      ORDER BY answer.question_code
    `
  ], { readOnly: true });

  if (!submissions[0]) return null;

  const sections = mapSections(sectionRows);
  const submittedSections = mapSections(sectionRows, true);
  const answers = mapAnswers(answerRows);
  const submittedAnswers = mapAnswers(answerRows, true);
  const results = buildStoredResults(answers);
  const submission = submissions[0];

  return {
    ...submission,
    overall_score_ratio: submission.overall_score_ratio ?? results.overallPercentage,
    answer_count: answerRows.length || ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length,
    reviewed_answer_count: answers.filter(answer => answer.evaluationCode).length,
    formula_code: submission.formula_code || OPERATIONS_DIAGNOSTIC_TEMPLATE.formulaCode,
    sections,
    answers,
    submittedSections,
    submittedAnswers,
    results
  };
}

export async function saveOperationsDiagnosticReview({ publicId, answers, sections }) {
  const storedSections = prepareSections(sections);
  const storedAnswers = prepareAnswers(answers);
  const queries = [
    sql`
      UPDATE operations_diagnostic_submission
      SET status = 'under_review', reviewed_at = now()
      WHERE public_id = ${publicId}
      RETURNING public_id
    `,
    sql`
      UPDATE operations_diagnostic_section_response target
      SET
        answers_responsible_name = section."answersResponsible",
        sector_responsible_name = section."sectorResponsible"
      FROM operations_diagnostic_submission submission
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(storedSections)}::jsonb) AS section(
        "sectionCode" text,
        "answersResponsible" text,
        "sectorResponsible" text
      )
      WHERE target.submission_id = submission.id
        AND submission.public_id = ${publicId}
        AND target.section_code = section."sectionCode"
    `,
    sql`
      UPDATE operations_diagnostic_answer target
      SET
        evaluation_code = answer."evaluationCode",
        implementation_date = answer."implementationDate",
        will_implement = answer."willImplement",
        notes = COALESCE(answer.notes, ''),
        reviewed_at = now()
      FROM operations_diagnostic_submission submission
      CROSS JOIN jsonb_to_recordset(${JSON.stringify(storedAnswers)}::jsonb) AS answer(
        "questionCode" text,
        "evaluationCode" text,
        "implementationDate" date,
        "willImplement" boolean,
        notes text
      )
      WHERE target.submission_id = submission.id
        AND submission.public_id = ${publicId}
        AND target.question_code = answer."questionCode"
    `,
    ...buildResultQueries(publicId, storedAnswers)
  ];

  const transactionResults = await sql.transaction(queries);
  if (!transactionResults[0]?.[0]) {
    throw new Error('Diagnóstico operacional não encontrado.');
  }
  return await getOperationsDiagnosticSubmission(publicId);
}
