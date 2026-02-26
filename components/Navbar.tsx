'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignedIn, SignedOut } from '@neondatabase/auth/react';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
];

const Navbar: React.FC = () => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="bg-green-700/90 backdrop-blur-sm border-b border-green-600/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    {/* Mobile menu button */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button
                            type="button"
                            className="relative inline-flex items-center justify-center rounded-md p-2 text-green-200 hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                            onClick={toggleMobileMenu}
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg
                                className={`h-6 w-6 ${isMobileMenuOpen ? 'hidden' : 'block'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                            <svg
                                className={`h-6 w-6 ${isMobileMenuOpen ? 'block' : 'hidden'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Logo and navigation */}
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-2xl">⚡</span>
                            <span className="text-white font-bold text-lg hidden sm:block">
                                myDESCO
                            </span>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex items-center space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                                        ? 'bg-green-800 text-white'
                                        : 'text-green-100 hover:bg-green-600 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* User section */}
                    <div className="flex items-center gap-3">
                        <SignedIn>
                            <UserButton size="icon" />
                        </SignedIn>
                        <SignedOut>
                            <Link
                                href="/auth/sign-in"
                                className="px-3 py-1.5 bg-green-800/60 hover:bg-green-800 text-green-100 text-sm rounded-lg transition-colors border border-green-600/50"
                            >
                                Sign In
                            </Link>
                        </SignedOut>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
                <div className="space-y-1 px-4 pb-3 pt-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${pathname === link.href
                                ? 'bg-green-800 text-white'
                                : 'text-green-100 hover:bg-green-600 hover:text-white'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
