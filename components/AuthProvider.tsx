'use client';

import { authClient } from '@/lib/auth/client';
import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import type { ReactNode } from 'react';

export default function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <NeonAuthUIProvider
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            authClient={authClient as any}
            redirectTo="/dashboard"
            credentials={{ forgotPassword: true }}
        >
            {children}
        </NeonAuthUIProvider>
    );
}
