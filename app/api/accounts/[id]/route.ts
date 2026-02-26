export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getDb } from '@/lib/db/db';
import { descoAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateAccountSchema = z.object({
    label: z.string().max(100).optional(),
    meterNo: z.string().optional(),
    isActive: z.boolean().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT - Update a DESCO account
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const db = getDb();
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { message: parsed.error.errors[0]?.message ?? 'Validation failed' },
            { status: 400 }
        );
    }

    const [updated] = await db
        .update(descoAccounts)
        .set({
            ...parsed.data,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(descoAccounts.id, id),
                eq(descoAccounts.userId, session.user.id)
            )
        )
        .returning();

    if (!updated) {
        return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
}

// DELETE - Soft-delete a DESCO account (set isActive = false)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const db = getDb();
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [deactivated] = await db
        .update(descoAccounts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
            and(
                eq(descoAccounts.id, id),
                eq(descoAccounts.userId, session.user.id)
            )
        )
        .returning();

    if (!deactivated) {
        return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Account removed.' });
}
