'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState('');
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
            const { error } = await authClient.signUp.email({
                email,
                password,
                name,
            });

            if (error) {
                setError(error?.message ?? 'An error occurred');
                setLoading(false);
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-primary/10 to-transparent rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-radial from-tertiary/10 to-transparent rounded-full -translate-x-1/2 translate-y-1/2"></div>
                </div>

                {/* Concentric Circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[600px] h-[600px] rounded-full border border-primary/5"></div>
                    <div className="absolute w-[850px] h-[850px] rounded-full border border-tertiary/5"></div>
                    <div className="absolute w-[1100px] h-[1100px] rounded-full border border-outline-variant/5"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-16">
                        <img
                            src="/wattwatch_logo.png"
                            alt="WattWatch Logo"
                            className="h-12 w-12 object-contain"
                        />
                        <span className="text-4xl font-headline font-bold text-primary tracking-tighter">WattWatch</span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-headline font-black text-on-surface tracking-tight text-center mb-8">
                        The Kinetic<br />
                        <span className="text-primary">Pulse</span> of Energy
                    </h1>

                    <p className="text-on-surface-variant text-center text-lg max-w-lg mb-12">
                        Join thousands of users monitoring their energy consumption in real-time. Take control of your electricity costs today.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-surface-container-low/50 backdrop-blur-sm rounded-xl p-6 border border-outline-variant/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">electric_bolt</span>
                                <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">Grid Status</span>
                            </div>
                            <p className="font-headline text-2xl font-bold text-on-surface">SYNCHRONIZED</p>
                        </div>
                        <div className="bg-surface-container-low/50 backdrop-blur-sm rounded-xl p-6 border border-outline-variant/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-tertiary text-xl">trending_up</span>
                                <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">Current Load</span>
                            </div>
                            <p className="font-headline text-2xl font-bold text-on-surface">4.2 <span className="text-tertiary text-lg font-normal">kW</span></p>
                        </div>
                    </div>
                </div>

                {/* System Version */}
                <div className="absolute bottom-12 left-12 flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span className="font-label text-xs uppercase tracking-wider">System v4.0.2 • Status: Operational</span>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-surface-container-low">
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
                        <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">Create Account</h2>
                        <p className="text-on-surface-variant">Start your energy monitoring journey</p>
                    </div>

                    {error && (
                        <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded-lg mb-6">
                            <p className="font-label text-sm uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block font-label text-sm text-on-surface-variant uppercase tracking-wider mb-2">
                                Operator Name
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">
                                    person
                                </span>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full bg-surface-container-high border-none focus:ring-0 text-on-surface pl-12 pr-4 py-4 font-body placeholder-on-surface-variant/50 volt-input transition-shadow duration-200"
                                    placeholder="John Doe"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block font-label text-sm text-on-surface-variant uppercase tracking-wider mb-2">
                                Network Identity
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">
                                    alternate_email
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
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block font-label text-sm text-on-surface-variant uppercase tracking-wider mb-2">
                                Security Protocol
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
                                    minLength={8}
                                    className="w-full bg-surface-container-high border-none focus:ring-0 text-on-surface pl-12 pr-12 py-4 font-body placeholder-on-surface-variant/50 volt-input transition-shadow duration-200"
                                    placeholder="Minimum 8 characters"
                                    autoComplete="new-password"
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

                        {/* Terms */}
                        <div className="flex items-start gap-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    required
                                    className="mt-1 w-5 h-5 rounded bg-surface-container-high border border-outline-variant appearance-none cursor-pointer checked:bg-primary checked:border-primary transition-colors"
                                />
                                <span className="font-label text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                                    I agree to the{' '}
                                    <a href="#" className="text-primary hover:text-primary/80">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a>
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
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Sign Up
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <p className="mt-8 text-center text-on-surface-variant">
                        <span className="font-label text-sm">Already registered? </span>
                        <Link
                            href="/auth/sign-in"
                            className="font-label text-sm text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                        >
                            Login
                        </Link>
                    </p>
                </div>

                {/* Mobile Footer */}
                <div className="lg:hidden mt-12 text-center text-on-surface-variant/50 font-label text-xs">
                    © {new Date().getFullYear()} WattWatch Energy Management
                </div>
            </div>
        </div>
    );
}
