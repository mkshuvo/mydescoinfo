'use client';

import { authClient } from '@/lib/auth/client';
import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import type { ReactBetterAuthClient } from '@neondatabase/auth';
import type { ReactNode } from 'react';

export default function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <NeonAuthUIProvider
            authClient={authClient as ReactBetterAuthClient}
            redirectTo="/dashboard"
            credentials={{ forgotPassword: true }}
        >
            {children}
        </NeonAuthUIProvider>
    );
}
