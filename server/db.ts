
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Initialize database connection with error handling
let db: ReturnType<typeof drizzle>;

try {
  const sql = neon(connectionString, {
    // Connection pool settings for better performance
    connectionTimeout: 30000,
    commandTimeout: 30000,
  });
  
  db = drizzle(sql, { schema });
  console.log('✅ Database connection established successfully');
} catch (error) {
  console.error('❌ Failed to establish database connection:', error);
  process.exit(1);
}

export { db };
