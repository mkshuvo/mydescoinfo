import Navbar from '@/components/Navbar';
import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { data: session } = await auth.getSession();
    
    if (!session?.user) {
        redirect('/auth/sign-in');
    }

    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
