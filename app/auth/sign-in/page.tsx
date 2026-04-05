'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) {
                setError(error?.message ?? 'An error occurred');
                setLoading(false);
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-surface-container-low relative overflow-hidden">
                {/* Decorative Grid Lines */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute left-0 top-0 w-px h-full bg-primary"></div>
                    <div className="absolute right-0 top-0 w-px h-full bg-primary"></div>
                    <div className="absolute top-0 left-0 h-px w-full bg-primary"></div>
                    <div className="absolute bottom-0 left-0 h-px w-full bg-primary"></div>
                    <div className="absolute left-1/4 top-0 h-full w-px bg-primary/50"></div>
                    <div className="absolute left-1/2 top-0 h-full w-px bg-primary/50"></div>
                    <div className="absolute left-3/4 top-0 h-full w-px bg-primary/50"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    <div className="flex items-center gap-3 mb-12">
                        <img
                            src="/wattwatch_logo.png"
                            alt="WattWatch Logo"
                            className="h-12 w-12 object-contain"
                        />
                        <span className="text-4xl font-headline font-bold text-primary tracking-tighter">WattWatch</span>
                    </div>

                    <h1 className="text-6xl lg:text-7xl font-headline font-black text-on-surface tracking-tight text-center mb-6">
                        MONITOR YOUR<br />
                        <span className="text-primary">ENERGY</span> FLOW
                    </h1>

                    <p className="text-on-surface-variant text-center text-lg max-w-md mb-12">
                        Real-time monitoring and analytics for your electricity meters. Take control of your energy consumption.
                    </p>

                    {/* System Status */}
                    <div className="flex items-center gap-3 bg-surface-container-high/50 px-5 py-3 rounded-full">
                        <div className="relative">
                            <div className="w-3 h-3 bg-primary rounded-full pulse-dot"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full ping-dot"></div>
                        </div>
                        <span className="font-label text-sm text-primary uppercase tracking-wider">System Status: Active</span>
                    </div>

                    {/* Footer Info */}
                    <div className="absolute bottom-12 flex items-center gap-8 text-on-surface-variant">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">shield</span>
                            <span className="font-label text-xs uppercase tracking-wider">Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">security</span>
                            <span className="font-label text-xs uppercase tracking-wider">Protocol v4.0.2</span>
                        </div>
                    </div>
                </div>

                {/* Kinetic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent pointer-events-none"></div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <img
                        src="/wattwatch_logo.png"
                        alt="WattWatch Logo"
                        className="h-10 w-10 object-contain"
                    />
                    <span className="text-3xl font-headline font-bold text-primary tracking-tighter">WattWatch</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-on-surface-variant">Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded-lg mb-6">
                            <p className="font-label text-sm uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block font-label text-sm text-on-surface-variant uppercase tracking-wider mb-2">
                                Network Identity
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">
                                    mail
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-surface-container-high border-none focus:ring-0 text-on-surface pl-12 pr-4 py-4 font-body placeholder-on-surface-variant/50 volt-input transition-shadow duration-200"
                                    placeholder="operator@wattwatch.io"
                                    autoComplete="email"
                                />
                                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-focus-within:w-full"></div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block font-label text-sm text-on-surface-variant uppercase tracking-wider mb-2">
                                Access Key
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">
                                    lock
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-surface-container-high border-none focus:ring-0 text-on-surface pl-12 pr-12 py-4 font-body placeholder-on-surface-variant/50 volt-input transition-shadow duration-200"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded bg-surface-container-high border border-outline-variant appearance-none cursor-pointer checked:bg-primary checked:border-primary transition-colors"
                                />
                                <span className="font-label text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                                    Remember me
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(142,229,32,0.15)] hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 volt-btn flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Login
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Key Recovery */}
                    <div className="mt-6 text-center">
                        <a href="#" className="font-label text-sm text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider">
                            Key Recovery
                        </a>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-outline-variant"></div>
                        <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Or</span>
                        <div className="flex-1 h-px bg-outline-variant"></div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-on-surface-variant">
                        <span className="font-label text-sm">New operator? </span>
                        <Link
                            href="/auth/sign-up"
                            className="font-label text-sm text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>

                {/* Mobile Footer */}
                <div className="lg:hidden mt-12 flex items-center gap-6 text-on-surface-variant">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">shield</span>
                        <span className="font-label text-xs uppercase tracking-wider">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">security</span>
                        <span className="font-label text-xs uppercase tracking-wider">Protocol v4.0.2</span>
                    </div>
                </div>

                <div className="mt-8 text-center text-on-surface-variant/50 font-label text-xs">
                    © {new Date().getFullYear()} WattWatch Energy Management
                </div>
            </div>
        </div>
    );
}
