'use server';

import { 
  getUserByKey, 
  getTasksByUserId, 
  updateTaskStatus,
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
import { ALL_DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_SECTIONS, EVALUATION_OPTIONS } from '../lib/diagnosticCatalog.js';

export async function loginAction(key) {
  if (!key) {
    throw new Error('Chave não informada');
  }
  const user = await getUserByKey(key);
  if (!user) {
    throw new Error('Chave inválida');
  }
  return user;
}

export async function fetchTasksAction(userId) {
  if (!userId) {
    throw new Error('userId não informado');
  }
  const tasks = await getTasksByUserId(userId);
  const needsReload = await processRecurringTasks(tasks);
  if (needsReload) {
    return await getTasksByUserId(userId);
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
  if (taskId === undefined || status === undefined) {
    throw new Error('Parâmetros inválidos');
  }
  const updated = await updateTaskStatus(taskId, status);
  if (!updated) {
    throw new Error('Tarefa não encontrada');
  }
  return updated;
}

export async function fetchUsersAction() {
  return await getAllUsers();
}

export async function fetchAllTasksWithUserAction() {
  const tasks = await getAllTasksWithUser();
  const needsReload = await processRecurringTasks(tasks);
  if (needsReload) {
    return await getAllTasksWithUser();
  }
  return tasks;
}

export async function createTaskAction(taskData) {
  if (!taskData.title || !taskData.end_date || !taskData.id_user) {
    throw new Error('Preencha os campos obrigatórios (título, prazo e usuário).');
  }
  return await createTask(taskData);
}

export async function deleteTaskAction(taskId) {
  if (!taskId) {
    throw new Error('taskId não informado');
  }
  const deleted = await deleteTask(taskId);
  if (!deleted) {
    throw new Error('Tarefa não encontrada');
  }
  return deleted;
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
  return await getDiagnosticSubmissions();
}

export async function fetchDiagnosticSubmissionAction(publicId) {
  if (!/^[0-9a-f-]{36}$/i.test(publicId || '')) return null;
  return await getDiagnosticSubmission(publicId);
}

export async function saveDiagnosticReviewAction(publicId, receivedAnswers, receivedSections) {
  if (!/^[0-9a-f-]{36}$/i.test(publicId || '')) throw new Error('Diagnóstico inválido.');
  const validQuestionCodes = new Set(ALL_DIAGNOSTIC_QUESTIONS.map(question => question.code));
  const validEvaluationCodes = new Set(EVALUATION_OPTIONS.map(option => option.code));

  const answers = (Array.isArray(receivedAnswers) ? receivedAnswers : []).map(answer => {
    if (!validQuestionCodes.has(answer.questionCode) || !validEvaluationCodes.has(answer.evaluationCode)) {
      throw new Error('Resposta de avaliação inválida.');
    }

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
