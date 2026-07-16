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
    SELECT id, " title" AS title, description, status, start_date, end_date, recurrence, id_user 
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
    RETURNING id, " title" AS title, status
  `;
  return result[0] || null;
}
