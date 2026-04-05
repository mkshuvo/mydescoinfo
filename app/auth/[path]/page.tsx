import { redirect } from 'next/navigation';

export const dynamicParams = false;

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = await params;

    // Redirect to custom sign-in page
    if (path === 'sign-in') {
        redirect('/auth/sign-in');
    }

    // Redirect to custom sign-up page
    if (path === 'sign-up') {
        redirect('/auth/sign-up');
    }

    // Default redirect
    redirect('/auth/sign-in');
}
