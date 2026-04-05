import React from 'react';

interface DashboardHeaderProps {
    title?: string;
    subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = 'Energy Console',
    subtitle = 'Real-time monitoring for your connected properties.',
}) => {
    return (
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface mb-2">{title}</h1>
                <p className="text-on-surface-variant font-label text-lg">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAddMeterModal'))}
                    className="bg-primary text-on-primary font-headline font-bold px-4 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(142,229,32,0.3)] hover:brightness-110 transition-all duration-300 volt-btn flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Meter
                </button>
                <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full pulse-dot"></div>
                    <span className="font-label text-sm font-medium tracking-wide text-primary uppercase">System Active</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
