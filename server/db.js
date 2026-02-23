import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Mask password in logs
const maskedUrl = databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log('Database URL configured:', maskedUrl);

// Parse the URL manually to avoid PG* env var overrides (e.g. PGHOST set by Render)
const parsed = new URL(databaseUrl);

const pool = new Pool({
  host:     parsed.hostname,
  port:     parseInt(parsed.port) || 5432,
  database: parsed.pathname.replace(/^\//, ''),
  user:     parsed.username,
  password: parsed.password,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export const db = pool;