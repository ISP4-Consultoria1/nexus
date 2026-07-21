-- Migração única: catálogo relacional -> diagnóstico fixo em código.
--
-- Preserva submissões, respostas, avaliações, resultados e protocolos existentes.
-- Remove somente as sete tabelas de catálogo estático após copiar seus códigos
-- para as tabelas operacionais. Faça backup antes de executar em produção.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('nexus:diagnostics:to-fixed:v1'));

DROP TRIGGER IF EXISTS diagnostic_section_response_validate_link ON diagnostic_section_response;
DROP TRIGGER IF EXISTS diagnostic_section_result_validate_link ON diagnostic_section_result;
DROP TRIGGER IF EXISTS diagnostic_answer_validate_links ON diagnostic_answer;
DROP TRIGGER IF EXISTS diagnostic_recommendation_validate_question ON diagnostic_recommendation;

ALTER TABLE diagnostic_section_response ADD COLUMN section_code varchar(30);

UPDATE diagnostic_section_response response
SET section_code = section.code
FROM diagnostic_section section
WHERE section.id = response.section_id;

ALTER TABLE diagnostic_section_response
  ALTER COLUMN section_code SET NOT NULL,
  DROP COLUMN section_id,
  ADD PRIMARY KEY (submission_id, section_code),
  ADD CONSTRAINT diagnostic_section_response_code_check CHECK (section_code IN (
    'societario', 'tecnologia', 'comercial', 'marketing', 'financeiro',
    'controladoria', 'fiscal', 'contabil', 'gestao_pessoas', 'estrategia'
  ));

ALTER TABLE diagnostic_answer
  ADD COLUMN question_code varchar(20),
  ADD COLUMN evaluation_code varchar(80);

UPDATE diagnostic_answer answer
SET question_code = question.code
FROM diagnostic_question question
WHERE question.id = answer.question_id;

UPDATE diagnostic_answer answer
SET evaluation_code = option.code
FROM diagnostic_evaluation_option option
WHERE option.id = answer.evaluation_option_id;

UPDATE diagnostic_answer
SET applicable = false
WHERE applicable IS NULL;

UPDATE diagnostic_answer
SET answered_at = COALESCE(answered_at, created_at, now())
WHERE answered_at IS NULL;

ALTER TABLE diagnostic_answer
  ALTER COLUMN question_code SET NOT NULL,
  ALTER COLUMN applicable SET DEFAULT false,
  ALTER COLUMN applicable SET NOT NULL,
  ALTER COLUMN answered_at SET DEFAULT now(),
  ALTER COLUMN answered_at SET NOT NULL,
  DROP COLUMN question_id,
  DROP COLUMN evaluation_option_id,
  ADD UNIQUE (submission_id, question_code),
  ADD CONSTRAINT diagnostic_answer_question_code_check CHECK (
    question_code ~ '^(1\.[1-6]|2\.[1-5]|3\.[1-6]|4\.[1-3]|5\.[1-7]|6\.[1-9]|7\.[1-4]|8\.[1-4]|9\.[1-4]|10\.[1-3])$'
  ),
  ADD CONSTRAINT diagnostic_answer_evaluation_code_check CHECK (
    evaluation_code IS NULL OR evaluation_code IN ('nao_existe', 'informal', 'padronizada', 'perfeita')
  );

CREATE INDEX IF NOT EXISTS diagnostic_answer_reviewed_idx
  ON diagnostic_answer(submission_id, evaluation_code);

ALTER TABLE diagnostic_section_result ADD COLUMN section_code varchar(30);

UPDATE diagnostic_section_result result
SET section_code = section.code
FROM diagnostic_section section
WHERE section.id = result.section_id;

ALTER TABLE diagnostic_section_result
  ALTER COLUMN section_code SET NOT NULL,
  ALTER COLUMN calculation_code SET DEFAULT 'diagnostico_empresarial_fixo_v1',
  DROP COLUMN section_id,
  ADD PRIMARY KEY (submission_id, section_code),
  ADD CONSTRAINT diagnostic_section_result_code_check CHECK (section_code IN (
    'societario', 'tecnologia', 'comercial', 'marketing', 'financeiro',
    'controladoria', 'fiscal', 'contabil', 'gestao_pessoas', 'estrategia'
  )),
  ADD CONSTRAINT diagnostic_section_result_self_score_check CHECK (self_score_sum >= 0),
  ADD CONSTRAINT diagnostic_section_result_consultant_score_check CHECK (consultant_score_sum >= 0),
  ADD CONSTRAINT diagnostic_section_result_max_score_check CHECK (max_score_sum >= 0);

ALTER TABLE diagnostic_submission_result
  ALTER COLUMN calculation_code SET DEFAULT 'diagnostico_empresarial_fixo_v1',
  ADD CONSTRAINT diagnostic_submission_result_section_count_check CHECK (section_count = 10),
  ADD CONSTRAINT diagnostic_submission_result_pillar_count_check CHECK (growth_pillar_count = 4);

UPDATE diagnostic_section_result
SET calculation_code = 'diagnostico_empresarial_fixo_v1';

UPDATE diagnostic_submission_result
SET calculation_code = 'diagnostico_empresarial_fixo_v1';

ALTER TABLE diagnostic_submission DROP COLUMN version_id;

DROP TABLE diagnostic_deliverable;
DROP TABLE diagnostic_recommendation;
DROP TABLE diagnostic_evaluation_option;
DROP TABLE diagnostic_question;
DROP TABLE diagnostic_section;
DROP TABLE diagnostic_version;
DROP TABLE diagnostic_template;

DROP FUNCTION IF EXISTS diagnostic_validate_section_link();
DROP FUNCTION IF EXISTS diagnostic_validate_answer_links();
DROP FUNCTION IF EXISTS diagnostic_validate_recommendation_question();

COMMIT;
