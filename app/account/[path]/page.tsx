import { AccountView } from '@neondatabase/auth/react';
import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export const dynamicParams = false;

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
    const { data: session } = await auth.getSession();
    
    if (!session?.user) {
        redirect('/auth/sign-in');
    }

    const { path } = await params;

    return (
        <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
            <AccountView path={path} />
        </main>
    );
}
