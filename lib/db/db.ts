import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | undefined;

/**
 * Returns the Drizzle ORM database instance, lazily initialized.
 * During build time (when DATABASE_URL is unavailable), returns undefined.
 * All runtime code should guard against this.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
    if (_db) return _db;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        // During build, DATABASE_URL may not be set.
        // Return undefined and let callers handle it.
        // This should never happen at runtime if .env is configured.
        console.warn('[DB] DATABASE_URL not set — returning stub (build-time only).');
        return undefined as unknown as NeonHttpDatabase<typeof schema>;
    }

    const sql = neon(databaseUrl);
    _db = drizzle(sql, { schema });
    return _db;
}
