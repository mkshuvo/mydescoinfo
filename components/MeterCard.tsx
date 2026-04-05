import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface MeterCardProps {
    id: string;
    label?: string | null;
    accountNo: string;
    meterNo?: string | null;
    liveBalance?: number | null;
    liveConsumption?: number | null;
    loadingLive?: boolean;
    onRemove: (id: string) => void;
}

const MeterCard: React.FC<MeterCardProps> = ({
    id,
    label,
    accountNo,
    meterNo,
    liveBalance,
    liveConsumption,
    loadingLive,
    onRemove,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isOffice = label?.toLowerCase().includes('office');

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(false);
        onRemove(id);
    };

    return (
        <div className="lg:col-span-6">
            <Link href={`/dashboard/accounts/${id}`} className="group block">
                <div className="bg-surface-container-low rounded-xl p-8 kinetic-glow-hover group-hover:bg-surface-container transition-all duration-500">
                    <div className="flex justify-between items-start mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-surface-container-highest rounded-lg">
                                <span className="material-symbols-outlined text-primary text-3xl">
                                    {isOffice ? 'corporate_fare' : 'home'}
                                </span>
                            </div>
                            <div>
                                <h2 className="font-headline text-2xl font-bold">{label ?? `Account ${accountNo}`}</h2>
                                <span className="text-on-surface-variant font-label text-xs uppercase tracking-widest">Meter ID: {meterNo ?? 'N/A'}</span>
                            </div>
                        </div>

                        {/* Kebab Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMenuOpen(!menuOpen);
                                }}
                                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-container-high"
                                title="More options"
                            >
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpen && (
                                <div className="absolute right-0 mt-1 w-48 bg-surface-container-highest rounded-lg shadow-xl border border-outline-variant/20 py-1 z-50">
                                    <button
                                        onClick={handleRemove}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-on-surface hover:bg-surface-container-low transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-error text-lg">delete</span>
                                        <span className="font-label text-sm">Remove Meter</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <p className="font-label text-sm text-on-surface-variant mb-1 uppercase tracking-wider">Current Balance</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-primary font-headline text-2xl font-light">৳</span>
                                {loadingLive ? (
                                    <span className="text-6xl font-headline font-bold tracking-tighter text-on-surface-variant">...</span>
                                ) : liveBalance !== undefined && liveBalance !== null ? (
                                    <span className="text-6xl font-headline font-bold tracking-tighter">{liveBalance.toFixed(2)}</span>
                                ) : (
                                    <span className="text-6xl font-headline font-bold tracking-tighter text-on-surface-variant">--</span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-outline-variant/10">
                            <div>
                                <p className="font-label text-xs text-on-surface-variant mb-1 uppercase tracking-widest">Hestern Cost</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-on-surface-variant font-headline text-lg">৳</span>
                                    <span className="text-2xl font-headline font-bold">
                                        {liveConsumption !== undefined && liveConsumption !== null
                                            ? liveConsumption.toFixed(2)
                                            : '--'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end items-end">
                                <button className="flex items-center gap-2 font-label text-sm font-bold text-primary hover:gap-3 transition-all group/btn">
                                    Details
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default MeterCard;
