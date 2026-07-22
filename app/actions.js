'use server';

import { 
  getUserByKey, 
  getTasksByUserId, 
  updateTaskStatusForUser,
  getAllUsers,
  getAllTasksWithUser,
  createTask,
  deleteTask,
  getTaskById,
  updateTaskDatesAndStatus
} from '../functions/queries.js';
import {
  createPublicDiagnosticSubmission,
  getDiagnosticSubmissions,
  getDiagnosticSubmission,
  saveDiagnosticReview
} from '../functions/diagnosticQueries.js';
import {
  createPublicOperationsDiagnosticSubmission,
  getOperationsDiagnosticSubmissions,
  getOperationsDiagnosticSubmission,
  saveOperationsDiagnosticReview
} from '../functions/operationsDiagnosticQueries.js';
import { ALL_DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_SECTIONS, EVALUATION_OPTIONS } from '../lib/diagnosticCatalog.js';
import {
  ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS,
  OPERATIONS_DIAGNOSTIC_SECTIONS,
  OPERATIONS_EVALUATION_OPTIONS,
  OPERATIONS_NOTE_MAX_LENGTH
} from '../lib/operationsDiagnosticCatalog.js';
import {
  createSession,
  deleteSession,
  getSessionUser,
  requireAdmin,
  requireSessionUser
} from '../lib/session.js';

export async function loginAction(key) {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) {
    return { ok: false, error: 'Informe sua chave de acesso.' };
  }

  try {
    const user = await getUserByKey(normalizedKey);
    if (!user) {
      return { ok: false, error: 'Chave de acesso inválida.' };
    }

    await createSession(user.id);
    return {
      ok: true,
      user: { id: Number(user.id), name: user.name, access: Number(user.access) }
    };
  } catch (error) {
    console.error('Falha ao autenticar usuário:', error);
    return { ok: false, error: 'Não foi possível acessar o sistema. Tente novamente.' };
  }
}

export async function getSessionAction() {
  return await getSessionUser();
}

export async function logoutAction() {
  await deleteSession();
  return { ok: true };
}

export async function fetchTasksAction() {
  const user = await requireSessionUser();
  const tasks = await getTasksByUserId(user.id);
  const needsReload = await processRecurringTasks(tasks);
  if (needsReload) {
    return await getTasksByUserId(user.id);
  }
  return tasks;
}

function calculateNextRecurrenceDates(startDateStr, endDateStr, recurrenceCode) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  switch (recurrenceCode) {
    case 1: // Diária
      start.setUTCDate(start.getUTCDate() + 1);
      end.setUTCDate(end.getUTCDate() + 1);
      break;
    case 2: // Semanal
      start.setUTCDate(start.getUTCDate() + 7);
      end.setUTCDate(end.getUTCDate() + 7);
      break;
    case 3: // Mensal
      start.setUTCMonth(start.getUTCMonth() + 1);
      end.setUTCMonth(end.getUTCMonth() + 1);
      break;
    case 4: // Trimestral
      start.setUTCMonth(start.getUTCMonth() + 3);
      end.setUTCMonth(end.getUTCMonth() + 3);
      break;
    case 5: // Semestral
      start.setUTCMonth(start.getUTCMonth() + 6);
      end.setUTCMonth(end.getUTCMonth() + 6);
      break;
    case 6: // Anual
      start.setUTCFullYear(start.getUTCFullYear() + 1);
      end.setUTCFullYear(end.getUTCFullYear() + 1);
      break;
  }
  
  const format = (d) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  return {
    start_date: format(start),
    end_date: format(end)
  };
}

async function processRecurringTasks(tasks) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
  
  let needsReload = false;
  for (const task of tasks) {
    if (task.recurrence >= 1 && task.recurrence <= 6) {
      let endStr = '';
      if (typeof task.end_date === 'string') {
        endStr = task.end_date.split('T')[0];
      } else {
        const end = new Date(task.end_date);
        const endYear = end.getUTCFullYear();
        const endMonth = String(end.getUTCMonth() + 1).padStart(2, '0');
        const endDay = String(end.getUTCDate()).padStart(2, '0');
        endStr = `${endYear}-${endMonth}-${endDay}`;
      }
      
      if (todayStr > endStr) {
        let currentStartDate = task.start_date;
        let currentEndDate = task.end_date;
        let tempEndStr = endStr;
        
        while (todayStr > tempEndStr) {
          const next = calculateNextRecurrenceDates(currentStartDate, currentEndDate, task.recurrence);
          currentStartDate = next.start_date;
          currentEndDate = next.end_date;
          tempEndStr = next.end_date;
        }
        
        await updateTaskDatesAndStatus(task.id, currentStartDate, currentEndDate, 0);
        needsReload = true;
      }
    }
  }
  return needsReload;
}

export async function updateTaskStatusAction(taskId, status) {
  const user = await requireSessionUser();
  const normalizedTaskId = Number(taskId);
  const normalizedStatus = Number(status);
  if (
    !Number.isInteger(normalizedTaskId) || normalizedTaskId <= 0 ||
    !Number.isInteger(normalizedStatus) || normalizedStatus < 0 || normalizedStatus > 5
  ) {
    return { ok: false, error: 'Não foi possível atualizar essa tarefa.' };
  }
  const updated = await updateTaskStatusForUser(normalizedTaskId, normalizedStatus, user.id);
  if (!updated) {
    return { ok: false, error: 'Tarefa não encontrada ou não pertence a este usuário.' };
  }
  return { ok: true, task: updated };
}

export async function fetchUsersAction() {
  await requireAdmin();
  return await getAllUsers();
}

export async function fetchAllTasksWithUserAction() {
  await requireAdmin();
  const tasks = await getAllTasksWithUser();
  const needsReload = await processRecurringTasks(tasks);
  if (needsReload) {
    return await getAllTasksWithUser();
  }
  return tasks;
}

export async function createTaskAction(taskData) {
  await requireAdmin();
  if (!taskData.title || !taskData.end_date || !taskData.id_user) {
    return { ok: false, error: 'Preencha os campos obrigatórios (título, prazo e usuário).' };
  }
  const task = await createTask(taskData);
  return { ok: true, task };
}

export async function deleteTaskAction(taskId) {
  await requireAdmin();
  if (!taskId) {
    return { ok: false, error: 'Tarefa não informada.' };
  }
  const deleted = await deleteTask(taskId);
  if (!deleted) {
    return { ok: false, error: 'Tarefa não encontrada.' };
  }
  return { ok: true };
}

export async function submitDiagnosticAction(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Dados do diagnóstico não informados.');
  }

  const companyName = String(payload.companyName || '').trim();
  if (!companyName || companyName.length > 255) {
    throw new Error('Informe o nome da empresa.');
  }

  const validQuestionCodes = new Set(ALL_DIAGNOSTIC_QUESTIONS.map(question => question.code));
  const receivedAnswers = Array.isArray(payload.answers) ? payload.answers : [];
  if (receivedAnswers.length !== validQuestionCodes.size) {
    throw new Error('O diagnóstico deve conter todas as 51 perguntas.');
  }

  const answerCodes = new Set();
  const answers = receivedAnswers.map(answer => {
    const questionCode = String(answer.questionCode || '');
    if (!validQuestionCodes.has(questionCode) || answerCodes.has(questionCode)) {
      throw new Error('Foi recebida uma pergunta inválida ou duplicada.');
    }
    answerCodes.add(questionCode);

    const score = answer.selfScore === '' || answer.selfScore == null ? null : Number(answer.selfScore);
    if (score != null && (!Number.isFinite(score) || score < 0 || score > 10)) {
      throw new Error(`A nota de autoavaliação do item ${questionCode} deve estar entre 0 e 10.`);
    }

    return {
      questionCode,
      applicable: answer.applicable === true || answer.applicable === 'SIM',
      selfScore: score
    };
  });

  const validSectionCodes = new Set(DIAGNOSTIC_SECTIONS.map(section => section.code));
  const sections = (Array.isArray(payload.sections) ? payload.sections : [])
    .filter(section => validSectionCodes.has(section.sectionCode))
    .map(section => ({
      sectionCode: section.sectionCode,
      answersResponsible: String(section.answersResponsible || '').trim().slice(0, 255),
      sectorResponsible: String(section.sectorResponsible || '').trim().slice(0, 255)
    }));

  const diagnosticDate = /^\d{4}-\d{2}-\d{2}$/.test(payload.diagnosticDate || '')
    ? payload.diagnosticDate
    : new Date().toISOString().slice(0, 10);
  const publicId = crypto.randomUUID();

  await createPublicDiagnosticSubmission({ publicId, companyName, diagnosticDate, sections, answers });
  return { publicId };
}

export async function fetchDiagnosticSubmissionsAction() {
  await requireAdmin();
  return await getDiagnosticSubmissions();
}

export async function fetchDiagnosticSubmissionAction(publicId) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(publicId || '')) return null;
  return await getDiagnosticSubmission(publicId);
}

export async function saveDiagnosticReviewAction(publicId, receivedAnswers, receivedSections) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(publicId || '')) throw new Error('Diagnóstico inválido.');
  const validQuestionCodes = new Set(ALL_DIAGNOSTIC_QUESTIONS.map(question => question.code));
  const validEvaluationCodes = new Set(EVALUATION_OPTIONS.map(option => option.code));

  const answerCodes = new Set();
  const sourceAnswers = Array.isArray(receivedAnswers) ? receivedAnswers : [];
  if (sourceAnswers.length !== validQuestionCodes.size) {
    throw new Error('A avaliação deve conter todas as 51 perguntas.');
  }

  const answers = sourceAnswers.map(answer => {
    if (
      !validQuestionCodes.has(answer.questionCode) ||
      !validEvaluationCodes.has(answer.evaluationCode) ||
      answerCodes.has(answer.questionCode)
    ) {
      throw new Error('Resposta de avaliação inválida.');
    }
    answerCodes.add(answer.questionCode);

    const selfScore = answer.selfScore === '' || answer.selfScore == null ? null : Number(answer.selfScore);
    if (selfScore != null && (!Number.isFinite(selfScore) || selfScore < 0 || selfScore > 10)) {
      throw new Error(`A nota de autoavaliação do item ${answer.questionCode} deve estar entre 0 e 10.`);
    }

    return {
      questionCode: answer.questionCode,
      applicable: answer.applicable === true || answer.applicable === 'SIM',
      selfScore,
      evaluationCode: answer.evaluationCode,
      consultantObservation: String(answer.consultantObservation || '').slice(0, 10000),
      possibleImprovements: String(answer.possibleImprovements || '').slice(0, 10000)
    };
  });

  const validSectionCodes = new Set(DIAGNOSTIC_SECTIONS.map(section => section.code));
  const sections = (Array.isArray(receivedSections) ? receivedSections : [])
    .filter(section => validSectionCodes.has(section.sectionCode))
    .map(section => ({
      sectionCode: section.sectionCode,
      answersResponsible: String(section.answersResponsible || '').trim().slice(0, 255),
      sectorResponsible: String(section.sectorResponsible || '').trim().slice(0, 255)
    }));

  return await saveDiagnosticReview({ publicId, answers, sections });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function normalizeLimitedText(value, { fieldName, maxLength, required = false, trim = true }) {
  if (value != null && typeof value !== 'string') {
    throw new Error(`${fieldName} deve ser um texto.`);
  }

  const source = value || '';
  if (source.length > maxLength) {
    throw new Error(`${fieldName} deve ter no máximo ${maxLength} caracteres.`);
  }

  const normalized = trim ? source.trim() : source;
  if (required && !normalized) {
    throw new Error(`Informe ${fieldName.toLowerCase()}.`);
  }
  return normalized;
}

function normalizeOptionalIsoDate(value, questionCode) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`A data de implementação do item ${questionCode} deve estar no formato YYYY-MM-DD.`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    year < 1 ||
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`A data de implementação do item ${questionCode} é inválida.`);
  }
  return value;
}

function normalizeOperationsDiagnosticDate(value) {
  if (value == null || value === '') return new Date().toISOString().slice(0, 10);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('A data do diagnóstico deve estar no formato YYYY-MM-DD.');
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    year < 1 ||
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error('A data do diagnóstico é inválida.');
  }
  return value;
}

function normalizeOptionalImplementationDecision(value, questionCode) {
  if (value == null || value === '') return null;
  if (value === true || value === 'SIM') return true;
  if (value === false || value === 'NÃO') return false;
  throw new Error(`A decisão de implementação do item ${questionCode} é inválida.`);
}

function normalizeOperationsAnswers(receivedAnswers, operationLabel) {
  const questionByCode = new Map(
    ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.map(question => [question.code, question])
  );
  const validQuestionCodes = new Set(questionByCode.keys());
  const validEvaluationCodes = new Set(
    OPERATIONS_EVALUATION_OPTIONS.map(option => option.code)
  );
  const sourceAnswers = Array.isArray(receivedAnswers) ? receivedAnswers : [];

  if (sourceAnswers.length !== validQuestionCodes.size) {
    throw new Error(
      `${operationLabel} deve conter todas as ${validQuestionCodes.size} perguntas do diagnóstico operacional.`
    );
  }

  const answerCodes = new Set();
  const answers = sourceAnswers.map(answer => {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
      throw new Error('Foi recebida uma resposta operacional inválida.');
    }

    const questionCode = String(answer.questionCode || '');
    const evaluationCode = String(answer.evaluationCode || '');
    if (
      !validQuestionCodes.has(questionCode) ||
      answerCodes.has(questionCode) ||
      !validEvaluationCodes.has(evaluationCode)
    ) {
      throw new Error('Foi recebida uma pergunta operacional inválida, duplicada ou sem avaliação válida.');
    }
    answerCodes.add(questionCode);
    const implementationMode = questionByCode.get(questionCode).implementationMode;

    return {
      questionCode,
      evaluationCode,
      implementationDate: implementationMode === 'date'
        ? normalizeOptionalIsoDate(answer.implementationDate, questionCode)
        : null,
      willImplement: implementationMode === 'boolean'
        ? normalizeOptionalImplementationDecision(answer.willImplement, questionCode)
        : null,
      notes: normalizeLimitedText(answer.notes, {
        fieldName: `As anotações do item ${questionCode}`,
        maxLength: OPERATIONS_NOTE_MAX_LENGTH,
        trim: false
      })
    };
  });

  if (answerCodes.size !== validQuestionCodes.size) {
    throw new Error('Os códigos das perguntas do diagnóstico operacional estão incompletos.');
  }
  return answers;
}

function normalizeOperationsSections(receivedSections) {
  const validSectionCodes = new Set(
    OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => section.code)
  );
  const sourceSections = Array.isArray(receivedSections) ? receivedSections : [];

  if (sourceSections.length !== validSectionCodes.size) {
    throw new Error(
      `O diagnóstico operacional deve conter todas as ${validSectionCodes.size} áreas.`
    );
  }

  const sectionCodes = new Set();
  const sections = sourceSections.map(section => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      throw new Error('Foi recebida uma área operacional inválida.');
    }

    const sectionCode = String(section.sectionCode || '');
    if (!validSectionCodes.has(sectionCode) || sectionCodes.has(sectionCode)) {
      throw new Error('Foi recebida uma área operacional inválida ou duplicada.');
    }
    sectionCodes.add(sectionCode);

    return {
      sectionCode,
      answersResponsible: normalizeLimitedText(section.answersResponsible, {
        fieldName: `O responsável pelas respostas da área ${sectionCode}`,
        maxLength: 255
      }),
      sectorResponsible: normalizeLimitedText(section.sectorResponsible, {
        fieldName: `O responsável pelo setor da área ${sectionCode}`,
        maxLength: 255
      })
    };
  });

  if (sectionCodes.size !== validSectionCodes.size) {
    throw new Error('Os códigos das áreas do diagnóstico operacional estão incompletos.');
  }
  return sections;
}

export async function submitOperationsDiagnosticAction(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Dados do diagnóstico operacional não informados.');
  }

  const companyName = normalizeLimitedText(payload.companyName, {
    fieldName: 'O nome da empresa',
    maxLength: 255,
    required: true
  });
  const answers = normalizeOperationsAnswers(payload.answers, 'O diagnóstico operacional');
  const sections = normalizeOperationsSections(payload.sections);
  const diagnosticDate = normalizeOperationsDiagnosticDate(payload.diagnosticDate);
  const publicId = crypto.randomUUID();

  await createPublicOperationsDiagnosticSubmission({
    publicId,
    companyName,
    diagnosticDate,
    sections,
    answers
  });
  return { publicId };
}

export async function fetchOperationsDiagnosticSubmissionsAction() {
  await requireAdmin();
  return await getOperationsDiagnosticSubmissions();
}

export async function fetchOperationsDiagnosticSubmissionAction(publicId) {
  await requireAdmin();
  if (!isValidUuid(publicId)) return null;
  return await getOperationsDiagnosticSubmission(publicId);
}

export async function saveOperationsDiagnosticReviewAction(publicId, receivedAnswers, receivedSections) {
  await requireAdmin();
  if (!isValidUuid(publicId)) {
    throw new Error('Diagnóstico operacional inválido.');
  }

  const answers = normalizeOperationsAnswers(receivedAnswers, 'A avaliação operacional');
  const sections = normalizeOperationsSections(receivedSections);
  return await saveOperationsDiagnosticReview({ publicId, answers, sections });
}
