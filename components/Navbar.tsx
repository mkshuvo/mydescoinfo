'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignedIn, SignedOut } from '@neondatabase/auth/react';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/accounts', label: 'Billing' },
];

const Navbar: React.FC = () => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className="bg-[#0d0f09] flex justify-between items-center w-full px-6 py-4 shadow-[0_0_40px_rgba(142,229,32,0.05)] sticky top-0 z-50">
            {/* Logo and navigation */}
            <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <img
                        src="/wattwatch_logo.png"
                        alt="WattWatch Logo"
                        className="h-8 w-8 object-contain"
                    />
                    <span className="text-2xl font-headline font-bold text-primary tracking-tighter">WattWatch</span>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`font-headline font-bold tracking-tight transition-colors ${
                                pathname === link.href
                                    ? 'text-primary border-b-2 border-primary pb-1'
                                    : 'text-gray-400 hover:text-primary'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* User section */}
            <div className="flex items-center gap-4">
                <SignedIn>
                    <div className="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20">
                        <UserButton size="icon" />
                    </div>
                </SignedIn>
                <SignedOut>
                    <Link
                        href="/auth/sign-in"
                        className="px-4 py-2 bg-surface-container-highest text-on-surface font-headline font-bold rounded-lg border border-outline-variant/30 hover:border-primary/50 transition-all duration-300"
                    >
                        Sign In
                    </Link>
                </SignedOut>
            </div>

            {/* Mobile menu button */}
            <div className="absolute inset-y-0 right-0 flex items-center md:hidden">
                <button
                    type="button"
                    className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-primary hover:bg-surface-container-low transition-colors"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen ? true : false}
                    onClick={toggleMobileMenu}
                >
                    <span className="sr-only">Open main menu</span>
                    <span className="material-symbols-outlined text-2xl">
                        {isMobileMenuOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden absolute top-full left-0 right-0 bg-[#0d0f09] border-b border-outline-variant/20 ${isMobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
                <div className="space-y-1 px-4 py-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`block px-3 py-2 rounded-lg font-headline font-bold transition-colors ${
                                pathname === link.href
                                    ? 'bg-surface-container-high text-primary'
                                    : 'text-gray-400 hover:bg-surface-container-low hover:text-primary'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
