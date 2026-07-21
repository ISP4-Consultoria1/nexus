import sql from './db.js';

export async function createPublicDiagnosticSubmission({
  publicId,
  companyName,
  diagnosticDate,
  sections,
  answers
}) {
  const queries = [
    sql`
      INSERT INTO diagnostic_submission (
        public_id,
        version_id,
        status,
        company_name,
        diagnostic_date,
        consent_accepted_at,
        submitted_at
      )
      SELECT
        ${publicId},
        version.id,
        'submitted',
        ${companyName},
        ${diagnosticDate},
        now(),
        now()
      FROM diagnostic_version version
      JOIN diagnostic_template template ON template.id = version.template_id
      WHERE template.slug = 'diagnostico-empresarial'
        AND version.is_active = true
        AND version.status = 'published'
      RETURNING public_id
    `
  ];

  for (const section of sections) {
    queries.push(sql`
      INSERT INTO diagnostic_section_response (
        submission_id,
        section_id,
        answers_responsible_name,
        sector_responsible_name
      )
      SELECT
        submission.id,
        section.id,
        ${section.answersResponsible || null},
        ${section.sectorResponsible || null}
      FROM diagnostic_submission submission
      JOIN diagnostic_section section ON section.version_id = submission.version_id
      WHERE submission.public_id = ${publicId}
        AND section.code = ${section.sectionCode}
      ON CONFLICT (submission_id, section_id)
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
        question_id,
        applicable,
        self_score,
        answered_at
      )
      SELECT
        submission.id,
        question.id,
        ${answer.applicable},
        ${answer.selfScore},
        now()
      FROM diagnostic_submission submission
      JOIN diagnostic_section section ON section.version_id = submission.version_id
      JOIN diagnostic_question question ON question.section_id = section.id
      WHERE submission.public_id = ${publicId}
        AND question.code = ${answer.questionCode}
      ON CONFLICT (submission_id, question_id)
      DO UPDATE SET
        applicable = EXCLUDED.applicable,
        self_score = EXCLUDED.self_score,
        answered_at = now(),
        updated_at = now()
    `);
  }

  const results = await sql.transaction(queries);
  if (!results[0]?.[0]) {
    throw new Error('Não existe uma versão publicada e ativa do formulário de diagnóstico.');
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
      COUNT(answer.evaluation_option_id)::integer AS reviewed_answer_count
    FROM diagnostic_submission submission
    LEFT JOIN diagnostic_answer answer ON answer.submission_id = submission.id
    LEFT JOIN diagnostic_submission_result result ON result.submission_id = submission.id
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
      version.formula_code,
      result.overall_score_ratio,
      result.growth_pillars_ratio
    FROM diagnostic_submission submission
    JOIN diagnostic_version version ON version.id = submission.version_id
    LEFT JOIN diagnostic_submission_result result ON result.submission_id = submission.id
    WHERE submission.public_id = ${publicId}
    LIMIT 1
  `;

  if (!submissions[0]) return null;

  const [sectionResponses, answers, sectionResults] = await Promise.all([
    sql`
      SELECT
        section.code AS section_code,
        response.answers_responsible_name,
        response.sector_responsible_name
      FROM diagnostic_section_response response
      JOIN diagnostic_section section ON section.id = response.section_id
      WHERE response.submission_id = ${submissions[0].id}
    `,
    sql`
      SELECT
        question.code AS question_code,
        answer.applicable,
        answer.self_score,
        option.code AS evaluation_code,
        option.label AS evaluation_label,
        option.score AS consultant_score,
        answer.consultant_observation,
        answer.possible_improvements
      FROM diagnostic_answer answer
      JOIN diagnostic_question question ON question.id = answer.question_id
      LEFT JOIN diagnostic_evaluation_option option ON option.id = answer.evaluation_option_id
      WHERE answer.submission_id = ${submissions[0].id}
      ORDER BY question.code
    `,
    sql`
      SELECT
        section.code AS section_code,
        result.self_score_sum,
        result.consultant_score_sum,
        result.max_score_sum,
        result.score_ratio,
        result.gap_ratio
      FROM diagnostic_section_result result
      JOIN diagnostic_section section ON section.id = result.section_id
      WHERE result.submission_id = ${submissions[0].id}
    `
  ]);

  const { id: _internalId, ...submission } = submissions[0];
  return { ...submission, sectionResponses, answers, sectionResults };
}

export async function saveDiagnosticReview({ publicId, answers, sections }) {
  const queries = answers.map(answer => sql`
    UPDATE diagnostic_answer target
    SET
      applicable = ${answer.applicable},
      self_score = ${answer.selfScore},
      evaluation_option_id = option.id,
      consultant_observation = ${answer.consultantObservation || null},
      possible_improvements = ${answer.possibleImprovements || null},
      reviewed_at = now(),
      updated_at = now()
    FROM diagnostic_submission submission,
         diagnostic_question question,
         diagnostic_section section,
         diagnostic_evaluation_option option
    WHERE target.submission_id = submission.id
      AND target.question_id = question.id
      AND question.section_id = section.id
      AND option.version_id = submission.version_id
      AND submission.public_id = ${publicId}
      AND question.code = ${answer.questionCode}
      AND option.code = ${answer.evaluationCode}
  `);

  for (const section of sections) {
    queries.push(sql`
      INSERT INTO diagnostic_section_response (
        submission_id,
        section_id,
        answers_responsible_name,
        sector_responsible_name
      )
      SELECT
        submission.id,
        diagnostic_section.id,
        ${section.answersResponsible || null},
        ${section.sectorResponsible || null}
      FROM diagnostic_submission submission
      JOIN diagnostic_section ON diagnostic_section.version_id = submission.version_id
      WHERE submission.public_id = ${publicId}
        AND diagnostic_section.code = ${section.sectionCode}
      ON CONFLICT (submission_id, section_id)
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
  `);

  await sql.transaction(queries);
  await recalculateDiagnosticResults(publicId);
  return await getDiagnosticSubmission(publicId);
}

export async function recalculateDiagnosticResults(publicId) {
  await sql.transaction(transaction => [
    transaction`
      WITH totals AS (
        SELECT
          submission.id AS submission_id,
          section.id AS section_id,
          version.formula_code,
          COALESCE(SUM(answer.self_score), 0) AS self_score_sum,
          COALESCE(SUM(CASE WHEN answer.applicable IS TRUE THEN COALESCE(option.score, 0) ELSE 0 END), 0) AS consultant_score_sum,
          COALESCE(SUM(CASE WHEN answer.applicable IS TRUE THEN question.max_score ELSE 0 END), 0) AS max_score_sum
        FROM diagnostic_submission submission
        JOIN diagnostic_version version ON version.id = submission.version_id
        JOIN diagnostic_section section ON section.version_id = submission.version_id
        JOIN diagnostic_question question ON question.section_id = section.id
        LEFT JOIN diagnostic_answer answer
          ON answer.submission_id = submission.id
         AND answer.question_id = question.id
        LEFT JOIN diagnostic_evaluation_option option ON option.id = answer.evaluation_option_id
        WHERE submission.public_id = ${publicId}
        GROUP BY submission.id, section.id, version.formula_code
      )
      INSERT INTO diagnostic_section_result (
        submission_id,
        section_id,
        self_score_sum,
        consultant_score_sum,
        max_score_sum,
        score_ratio,
        calculation_code,
        calculated_at
      )
      SELECT
        submission_id,
        section_id,
        self_score_sum,
        consultant_score_sum,
        max_score_sum,
        CASE WHEN max_score_sum > 0 THEN consultant_score_sum / max_score_sum ELSE 0 END,
        formula_code,
        now()
      FROM totals
      ON CONFLICT (submission_id, section_id)
      DO UPDATE SET
        self_score_sum = EXCLUDED.self_score_sum,
        consultant_score_sum = EXCLUDED.consultant_score_sum,
        max_score_sum = EXCLUDED.max_score_sum,
        score_ratio = EXCLUDED.score_ratio,
        calculation_code = EXCLUDED.calculation_code,
        calculated_at = EXCLUDED.calculated_at
    `,
    transaction`
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
        result.submission_id,
        COALESCE(AVG(result.score_ratio), 0),
        COALESCE(AVG(result.score_ratio) FILTER (WHERE section.is_growth_pillar), 0),
        COUNT(*)::smallint,
        COUNT(*) FILTER (WHERE section.is_growth_pillar)::smallint,
        MAX(result.calculation_code),
        now()
      FROM diagnostic_section_result result
      JOIN diagnostic_section section ON section.id = result.section_id
      JOIN diagnostic_submission submission ON submission.id = result.submission_id
      WHERE submission.public_id = ${publicId}
      GROUP BY result.submission_id
      ON CONFLICT (submission_id)
      DO UPDATE SET
        overall_score_ratio = EXCLUDED.overall_score_ratio,
        growth_pillars_ratio = EXCLUDED.growth_pillars_ratio,
        section_count = EXCLUDED.section_count,
        growth_pillar_count = EXCLUDED.growth_pillar_count,
        calculation_code = EXCLUDED.calculation_code,
        calculated_at = EXCLUDED.calculated_at
    `
  ]);
}
