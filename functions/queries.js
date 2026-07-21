import sql from './db.js';

export async function getUserByKey(key) {
  const users = await sql`
    SELECT id, name, key, access 
    FROM "user" 
    WHERE key = ${key} 
    LIMIT 1
  `;
  return users[0] || null;
}

export async function getTasksByUserId(userId) {
  return await sql`
    SELECT id, title, description, status, start_date, end_date, recurrence, id_user
    FROM "task"
    WHERE id_user = ${userId}
    ORDER BY end_date ASC, id ASC
  `;
}

export async function updateTaskStatus(taskId, status) {
  const result = await sql`
    UPDATE "task" 
    SET status = ${status} 
    WHERE id = ${taskId} 
    RETURNING id, title, status
  `;
  return result[0] || null;
}

export async function getAllUsers() {
  return await sql`
    SELECT id, name, key, access 
    FROM "user" 
    ORDER BY name ASC
  `;
}

export async function getAllTasksWithUser() {
  return await sql`
    SELECT t.id, t.title, t.description, t.status, t.start_date, t.end_date, t.recurrence, t.id_user, u.name AS user_name
    FROM "task" t
    JOIN "user" u ON t.id_user = u.id
    ORDER BY t.id DESC
  `;
}

export async function createTask({ title, description, start_date, end_date, recurrence, id_user }) {
  const result = await sql`
    INSERT INTO "task" (title, description, status, start_date, end_date, recurrence, id_user)
    VALUES (${title}, ${description}, 0, ${start_date}, ${end_date}, ${recurrence}, ${id_user})
    RETURNING id, title, status
  `;
  return result[0] || null;
}

export async function deleteTask(taskId) {
  const result = await sql`
    DELETE FROM "task" 
    WHERE id = ${taskId}
    RETURNING id
  `;
  return result[0] || null;
}

export async function getTaskById(taskId) {
  const result = await sql`
    SELECT id, title, description, status, start_date, end_date, recurrence, id_user
    FROM "task"
    WHERE id = ${taskId}
    LIMIT 1
  `;
  return result[0] || null;
}

export async function updateTaskDatesAndStatus(taskId, startDate, endDate, status) {
  return await sql`
    UPDATE "task"
    SET start_date = ${startDate}, end_date = ${endDate}, status = ${status}
    WHERE id = ${taskId}
    RETURNING id
  `;
}

