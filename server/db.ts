import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with better error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Optimize for serverless functions
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 15000, // 15 seconds timeout
  maxUses: 100, // Limit connection reuse
  allowExitOnIdle: false,
});

// Add comprehensive error handling for pool
pool.on('error', (err) => {
  console.error('[Database Pool] Connection error:', err.message);
  // Don't log full error object to reduce noise
});

pool.on('connect', () => {
  console.log('[Database Pool] New client connected');
});

pool.on('remove', () => {
  console.log('[Database Pool] Client removed');
});

export const db = drizzle({ client: pool, schema });

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[Database] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection test failed:', error);
    return false;
  }
}