import sql from './db.js';
import {
  calculateDiagnosticResults,
  DIAGNOSTIC_SECTIONS,
  DIAGNOSTIC_TEMPLATE,
  EVALUATION_OPTIONS
} from '../lib/diagnosticCatalog.js';

const evaluationByCode = new Map(EVALUATION_OPTIONS.map(option => [option.code, option]));

function buildResultQueries(publicId, answers) {
  const results = calculateDiagnosticResults(answers);
  const queries = results.sections.map(section => sql`
    INSERT INTO diagnostic_section_result (
      submission_id,
      section_code,
      self_score_sum,
      consultant_score_sum,
      max_score_sum,
      score_ratio,
      calculation_code,
      calculated_at
    )
    SELECT
      submission.id,
      ${section.code},
      ${section.selfAssessment},
      ${section.consultantTotal},
      ${section.maximumTotal},
      ${section.percentage},
      ${DIAGNOSTIC_TEMPLATE.formulaCode},
      now()
    FROM diagnostic_submission submission
    WHERE submission.public_id = ${publicId}
      AND COALESCE(submission.metadata->>'diagnosticType', 'general') = 'general'
    ON CONFLICT (submission_id, section_code)
    DO UPDATE SET
      self_score_sum = EXCLUDED.self_score_sum,
      consultant_score_sum = EXCLUDED.consultant_score_sum,
      max_score_sum = EXCLUDED.max_score_sum,
      score_ratio = EXCLUDED.score_ratio,
      calculation_code = EXCLUDED.calculation_code,
      calculated_at = EXCLUDED.calculated_at
  `);

  queries.push(sql`
    INSERT INTO diagnostic_submission_result (
      submission_id,
      overall_score_ratio,
      growth_pillars_ratio,
      section_count,
      growth_pillar_count,
      calculation_code,
      calculated_at
    )
    SELECT
      submission.id,
      ${results.overallPercentage},
      ${results.leveragePercentage},
      ${DIAGNOSTIC_SECTIONS.length},
      ${DIAGNOSTIC_SECTIONS.filter(section => section.isPillar).length},
      ${DIAGNOSTIC_TEMPLATE.formulaCode},
      now()
    FROM diagnostic_submission submission
    WHERE submission.public_id = ${publicId}
      AND COALESCE(submission.metadata->>'diagnosticType', 'general') = 'general'
    ON CONFLICT (submission_id)
    DO UPDATE SET
      overall_score_ratio = EXCLUDED.overall_score_ratio,
      growth_pillars_ratio = EXCLUDED.growth_pillars_ratio,
      section_count = EXCLUDED.section_count,
      growth_pillar_count = EXCLUDED.growth_pillar_count,
      calculation_code = EXCLUDED.calculation_code,
      calculated_at = EXCLUDED.calculated_at
  `);

  return queries;
}

export async function createPublicDiagnosticSubmission({
  publicId,
  companyName,
  diagnosticDate,
  sections,
  answers
}) {
  const queries = [sql`
    INSERT INTO diagnostic_submission (
      public_id,
      status,
      company_name,
      diagnostic_date,
      consent_accepted_at,
      submitted_at
    )
    VALUES (
      ${publicId},
      'submitted',
      ${companyName},
      ${diagnosticDate},
      now(),
      now()
    )
    RETURNING public_id
  `];

  for (const section of sections) {
    queries.push(sql`
      INSERT INTO diagnostic_section_response (
        submission_id,
        section_code,
        answers_responsible_name,
        sector_responsible_name
      )
      SELECT
        submission.id,
        ${section.sectionCode},
        ${section.answersResponsible || null},
        ${section.sectorResponsible || null}
      FROM diagnostic_submission submission
      WHERE submission.public_id = ${publicId}
      ON CONFLICT (submission_id, section_code)
      DO UPDATE SET
        answers_responsible_name = EXCLUDED.answers_responsible_name,
        sector_responsible_name = EXCLUDED.sector_responsible_name,
        updated_at = now()
    `);
  }

  for (const answer of answers) {
    queries.push(sql`
      INSERT INTO diagnostic_answer (
        submission_id,
        question_code,
        applicable,
        self_score,
        answered_at
      )
      SELECT
        submission.id,
        ${answer.questionCode},
        ${answer.applicable},
        ${answer.selfScore},
        now()
      FROM diagnostic_submission submission
      WHERE submission.public_id = ${publicId}
      ON CONFLICT (submission_id, question_code)
      DO UPDATE SET
        applicable = EXCLUDED.applicable,
        self_score = EXCLUDED.self_score,
        answered_at = now(),
        updated_at = now()
    `);
  }

  const results = await sql.transaction(queries);
  if (!results[0]?.[0]) {
    throw new Error('Não foi possível criar a submissão do diagnóstico.');
  }

  return results[0][0];
}

export async function getDiagnosticSubmissions() {
  return await sql`
    SELECT
      submission.public_id,
      submission.company_name,
      submission.diagnostic_date,
      submission.status,
      submission.submitted_at,
      submission.reviewed_at,
      result.overall_score_ratio,
      result.growth_pillars_ratio,
      COUNT(answer.id)::integer AS answer_count,
      COUNT(answer.evaluation_code)::integer AS reviewed_answer_count
    FROM diagnostic_submission submission
    LEFT JOIN diagnostic_answer answer ON answer.submission_id = submission.id
    LEFT JOIN diagnostic_submission_result result ON result.submission_id = submission.id
    WHERE COALESCE(submission.metadata->>'diagnosticType', 'general') = 'general'
    GROUP BY submission.id, result.submission_id
    ORDER BY submission.created_at DESC
  `;
}

export async function getDiagnosticSubmission(publicId) {
  const submissions = await sql`
    SELECT
      submission.id,
      submission.public_id,
      submission.company_name,
      submission.diagnostic_date,
      submission.status,
      submission.submitted_at,
      submission.reviewed_at,
      result.overall_score_ratio,
      result.growth_pillars_ratio
    FROM diagnostic_submission submission
    LEFT JOIN diagnostic_submission_result result ON result.submission_id = submission.id
    WHERE submission.public_id = ${publicId}
      AND COALESCE(submission.metadata->>'diagnosticType', 'general') = 'general'
    LIMIT 1
  `;

  if (!submissions[0]) return null;

  const [sectionResponses, storedAnswers, sectionResults] = await Promise.all([
    sql`
      SELECT
        section_code,
        answers_responsible_name,
        sector_responsible_name
      FROM diagnostic_section_response
      WHERE submission_id = ${submissions[0].id}
    `,
    sql`
      SELECT
        question_code,
        applicable,
        self_score,
        evaluation_code,
        consultant_observation,
        possible_improvements
      FROM diagnostic_answer
      WHERE submission_id = ${submissions[0].id}
      ORDER BY question_code
    `,
    sql`
      SELECT
        section_code,
        self_score_sum,
        consultant_score_sum,
        max_score_sum,
        score_ratio,
        gap_ratio
      FROM diagnostic_section_result
      WHERE submission_id = ${submissions[0].id}
    `
  ]);

  const answers = storedAnswers.map(answer => {
    const evaluation = evaluationByCode.get(answer.evaluation_code);
    return {
      ...answer,
      evaluation_label: evaluation?.label || null,
      consultant_score: evaluation?.score ?? null
    };
  });
  const { id: _internalId, ...submission } = submissions[0];
  return {
    ...submission,
    formula_code: DIAGNOSTIC_TEMPLATE.formulaCode,
    sectionResponses,
    answers,
    sectionResults
  };
}

export async function saveDiagnosticReview({ publicId, answers, sections }) {
  const queries = answers.map(answer => sql`
    UPDATE diagnostic_answer target
    SET
      applicable = ${answer.applicable},
      self_score = ${answer.selfScore},
      evaluation_code = ${answer.evaluationCode},
      consultant_observation = ${answer.consultantObservation || null},
      possible_improvements = ${answer.possibleImprovements || null},
      reviewed_at = now(),
      updated_at = now()
    FROM diagnostic_submission submission
    WHERE target.submission_id = submission.id
      AND submission.public_id = ${publicId}
      AND COALESCE(submission.metadata->>'diagnosticType', 'general') = 'general'
      AND target.question_code = ${answer.questionCode}
  `);

  for (const section of sections) {
    queries.push(sql`
      INSERT INTO diagnostic_section_response (
        submission_id,
        section_code,
        answers_responsible_name,
        sector_responsible_name
      )
      SELECT
        submission.id,
        ${section.sectionCode},
        ${section.answersResponsible || null},
        ${section.sectorResponsible || null}
      FROM diagnostic_submission submission
      WHERE submission.public_id = ${publicId}
        AND COALESCE(submission.metadata->>'diagnosticType', 'general') = 'general'
      ON CONFLICT (submission_id, section_code)
      DO UPDATE SET
        answers_responsible_name = EXCLUDED.answers_responsible_name,
        sector_responsible_name = EXCLUDED.sector_responsible_name,
        updated_at = now()
    `);
  }

  queries.push(sql`
    UPDATE diagnostic_submission
    SET status = 'under_review', reviewed_at = now(), updated_at = now()
    WHERE public_id = ${publicId}
      AND COALESCE(metadata->>'diagnosticType', 'general') = 'general'
  `);
  queries.push(...buildResultQueries(publicId, answers));

  await sql.transaction(queries);
  return await getDiagnosticSubmission(publicId);
}
