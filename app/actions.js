'use server';

import { getUserByKey, getTasksByUserId, updateTaskStatus } from '../functions/queries.js';

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
