import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let pool: Pool;

async function getDbCredentials() {
  // Local development fallback
  if (process.env.DB_HOST) {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
  }

  // AWS Secrets Manager
  const secretName = process.env.DB_SECRET_NAME;
  const region = process.env.AWS_REGION || 'ap-south-2'; // Updated to ap-south-2

  if (!secretName) {
    console.warn('DB_SECRET_NAME or DB_HOST environment variables are not set. Database connection may fail.');
    return null;
  }

  const client = new SecretsManagerClient({ region });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    throw new Error('Secret string is empty');
  } catch (error) {
    console.error('Error fetching secret from Secrets Manager', error);
    throw error;
  }
}

async function initializeDatabase(dbPool: Pool) {
  let client;
  try {
    client = await dbPool.connect();
    console.log('Verifying and initializing database schema...');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_skills (
        user_id TEXT PRIMARY KEY,
        skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_chats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        skill_id TEXT,
        type TEXT NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, skill_id, type)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_chats_user_id ON user_chats(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);`);

    // Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers
    await client.query(`
      DROP TRIGGER IF EXISTS trg_user_skills_updated_at ON user_skills;
    `);
    await client.query(`
      CREATE TRIGGER trg_user_skills_updated_at
        BEFORE UPDATE ON user_skills
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_user_chats_updated_at ON user_chats;
    `);
    await client.query(`
      CREATE TRIGGER trg_user_chats_updated_at
        BEFORE UPDATE ON user_chats
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    console.log('Database schema checked/initialized successfully.');
  } catch (error) {
    console.error('Error during database schema auto-initialization:', error);
  } finally {
    if (client) client.release();
  }
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  const credentials = await getDbCredentials();

  if (!credentials) {
    throw new Error('Failed to retrieve database credentials');
  }

  // Connect to RDS using the credentials
  pool = new Pool({
    host: credentials.host,
    port: credentials.port,
    database: credentials.dbname || credentials.database,
    user: credentials.username || credentials.user,
    password: credentials.password,
    ssl: {
      rejectUnauthorized: false, // Required for RDS
    },
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Run database schema check/initialization asynchronously
  initializeDatabase(pool).catch((err) => {
    console.error('Database auto-initialization failed:', err);
  });

  return pool;
}

export async function query(text: string, params?: any[]) {
  const currentPool = await getPool();
  const start = Date.now();
  const res = await currentPool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}
