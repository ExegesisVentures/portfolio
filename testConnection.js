import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configure the connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db.rqpkqunkpgccxmdxksxn.supabase.co',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'ERUedVd7zUtUk12n',
  port: parseInt(process.env.DB_PORT || '6543'),
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL
  },
  connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Database connection successful. Current time:', result.rows[0].current_time);
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection(); 