import React from 'react';

interface EmptyStateProps {
    onAddClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
    return (
        <div className="text-center py-20 bg-surface-container-low rounded-xl kinetic-glow">
            <div className="p-4 bg-surface-container-highest rounded-xl inline-block mb-6">
                <span className="material-symbols-outlined text-primary text-6xl">bolt</span>
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">
                No meters linked
            </h2>
            <p className="text-on-surface-variant mb-6">
                Add your first meter to start tracking consumption
            </p>
            <button
                onClick={onAddClick}
                className="px-6 py-3 bg-primary text-on-primary font-headline font-bold rounded-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(142,229,32,0.15)] volt-btn"
            >
                + Add Your First Meter
            </button>
        </div>
    );
};

export default EmptyState;
