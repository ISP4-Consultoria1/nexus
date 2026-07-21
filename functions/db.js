import { neon, Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('A variável de ambiente DATABASE_URL não foi configurada.');
}

// Client SQL serverless (HTTP, recomendado para queries rápidas no Neon)
export const sql = neon(connectionString);

// Pool de conexão (WebSocket/TCP, recomendado para transações ou compatibilidade com pg)
export const pool = new Pool({ connectionString });

export default sql;
