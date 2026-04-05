import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Custom error class for database connection issues
 */
export class DatabaseConnectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}

/**
 * Returns the Drizzle ORM database instance, lazily initialized.
 * Throws DatabaseConnectionError if DATABASE_URL is not set at runtime.
 * During build time, this is expected to fail - catch the error gracefully.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
    if (_db) return _db;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        // During build, DATABASE_URL may not be set.
        // At runtime, this should never happen if .env is configured.
        console.error('[DB] DATABASE_URL not set. Ensure your environment variables are properly configured.');
        throw new DatabaseConnectionError('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);
    _db = drizzle(sql, { schema });
    return _db;
}

/**
 * Safely gets a database instance, returning null if unavailable.
 * Useful for optional database operations or during build time.
 */
export function getDbSafe(): NeonHttpDatabase<typeof schema> | null {
    try {
        return getDb();
    } catch (error) {
        if (error instanceof DatabaseConnectionError) {
            return null;
        }
        throw error;
    }
}
