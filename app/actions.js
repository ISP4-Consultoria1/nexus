'use server';

import { 
  getUserByKey, 
  getTasksByUserId, 
  updateTaskStatus,
  getAllUsers,
  getAllTasksWithUser,
  createTask,
  deleteTask,
  getTaskById
} from '../functions/queries.js';

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
  return await getTasksByUserId(userId);
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

export async function updateTaskStatusAction(taskId, status) {
  if (taskId === undefined || status === undefined) {
    throw new Error('Parâmetros inválidos');
  }

  // 1. Obter tarefa atual para verificar recorrência
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error('Tarefa não encontrada');
  }

  // 2. Se for marcada como concluída (status 1 ou 5) e tiver recorrência (1 a 6)
  if ((status === 1 || status === 5) && task.recurrence >= 1 && task.recurrence <= 6) {
    const { start_date, end_date } = calculateNextRecurrenceDates(task.start_date, task.end_date, task.recurrence);
    
    // Clonar e gerar a nova ocorrência pendente (status 0)
    await createTask({
      title: task.title,
      description: task.description,
      start_date,
      end_date,
      recurrence: task.recurrence,
      id_user: task.id_user
    });
  }

  // 3. Atualizar o status do registro atual
  const updated = await updateTaskStatus(taskId, status);
  if (!updated) {
    throw new Error('Erro ao atualizar status da tarefa');
  }
  return updated;
}

export async function fetchUsersAction() {
  return await getAllUsers();
}

export async function fetchAllTasksWithUserAction() {
  return await getAllTasksWithUser();
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
