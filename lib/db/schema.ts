import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    numeric,
    date,
    jsonb,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================================================
// Application Tables
// Neon Auth manages auth tables (users, sessions, accounts) in the 'neon_auth'
// schema automatically. We only define app-specific tables here.
// The userId columns reference neon_auth.users(id) — a text UUID.
// ============================================================================

export const descoAccounts = pgTable(
    'desco_accounts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id').notNull(), // References neon_auth.users.id
        accountNo: varchar('account_no', { length: 50 }).notNull(),
        meterNo: varchar('meter_no', { length: 50 }),
        label: varchar('label', { length: 100 }), // "Home", "Office", etc.
        isActive: boolean('is_active').default(true).notNull(),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex('desco_accounts_user_account_unique').on(
            table.userId,
            table.accountNo
        ),
    ]
);

export const dailyConsumptionCache = pgTable(
    'daily_consumption_cache',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        descoAccountId: uuid('desco_account_id')
            .notNull()
            .references(() => descoAccounts.id, { onDelete: 'cascade' }),
        date: date('date').notNull(),
        consumedTaka: numeric('consumed_taka'),
        consumedUnit: numeric('consumed_unit'),
        dailyTakaDiff: numeric('daily_taka_diff'),
        dailyUnitDiff: numeric('daily_unit_diff'),
        balance: numeric('balance'),
        rawJson: jsonb('raw_json'),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex('daily_consumption_account_date_unique').on(
            table.descoAccountId,
            table.date
        ),
    ]
);

// ============================================================================
// Type Exports
// ============================================================================

export type DescoAccount = typeof descoAccounts.$inferSelect;
export type NewDescoAccount = typeof descoAccounts.$inferInsert;
export type DailyConsumptionCacheEntry = typeof dailyConsumptionCache.$inferSelect;
export type NewDailyConsumptionCacheEntry = typeof dailyConsumptionCache.$inferInsert;
