import { neon, Pool } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_ds4tZlk6rEbC@ep-falling-union-acz48i0q-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Client SQL serverless (HTTP, recomendado para queries rápidas no Neon)
export const sql = neon(connectionString);

// Pool de conexão (WebSocket/TCP, recomendado para transações ou compatibilidade com pg)
export const pool = new Pool({ connectionString });

export default sql;
