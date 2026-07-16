'use server';

import { 
  getUserByKey, 
  getTasksByUserId, 
  updateTaskStatus,
  getAllUsers,
  getAllTasksWithUser,
  createTask,
  deleteTask
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
