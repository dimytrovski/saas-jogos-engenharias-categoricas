import { Pool } from 'pg';

const writeConfig = {
  connectionString: process.env.DATABASE_WRITE_URL || process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
};

const readConfig = {
  connectionString: process.env.DATABASE_READ_URL || process.env.DATABASE_URL,
  max: 50,
  idleTimeoutMillis: 10000,
};

export const writeDb = new Pool(writeConfig);
export const readDb = new Pool(readConfig);

export async function executeQuery(text: string, params: any[], usePrimary: boolean = false) {
  const start = Date.now();
  const client = usePrimary ? await writeDb.connect() : await readDb.connect();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    if (duration > 300) {
      console.warn('Slow query detected:', { text, duration });
    }
    return res.rows;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  } finally {
    client.release();
  }
}
