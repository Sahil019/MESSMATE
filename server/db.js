import pkg from "pg";
const { Pool } = pkg;

// Log the DATABASE_URL for debugging (mask password in logs)
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  // Mask password in logs
  const maskedUrl = databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log('Database URL configured:', maskedUrl);
} else {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection on startup
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

// Export the pool for use throughout the app
export const db = pool;
