import React from 'react';

interface AddMeterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    newAccountNo: string;
    setNewAccountNo: (value: string) => void;
    newMeterNo: string;
    setNewMeterNo: (value: string) => void;
    newLabel: string;
    setNewLabel: (value: string) => void;
    adding: boolean;
    error?: string | null;
}

const AddMeterModal: React.FC<AddMeterModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    newAccountNo,
    setNewAccountNo,
    newMeterNo,
    setNewMeterNo,
    newLabel,
    setNewLabel,
    adding,
    error,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-surface-container-high rounded-xl shadow-[0_0_60px_rgba(142,229,32,0.1)] border border-outline-variant/10 overflow-hidden">
                <div className="p-8">
                    {/* Modal Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Add New Meter</h2>
                            <p className="font-body text-on-surface-variant mt-2 text-sm">Register a new metering point to your energy management grid.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* Account Number */}
                        <div>
                            <label htmlFor="addAccountNo" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                                Account Number
                            </label>
                            <input
                                id="addAccountNo"
                                type="text"
                                required
                                value={newAccountNo}
                                onChange={(e) => setNewAccountNo(e.target.value)}
                                className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-none p-4 text-on-surface font-headline tracking-wider rounded-lg placeholder:text-outline-variant"
                                placeholder="e.g. 25013973"
                            />
                            <div className="h-[2px] w-full bg-gradient-to-r from-primary/50 to-transparent"></div>
                        </div>

                        {/* Grid: Meter ID + Label */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="addMeterNo" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                                    Meter ID
                                </label>
                                <input
                                    id="addMeterNo"
                                    type="text"
                                    value={newMeterNo}
                                    onChange={(e) => setNewMeterNo(e.target.value)}
                                    className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-none p-4 text-on-surface font-headline tracking-wider rounded-lg placeholder:text-outline-variant"
                                    placeholder="Auto"
                                />
                                <div className="h-[2px] w-full bg-gradient-to-r from-primary/50 to-transparent"></div>
                            </div>
                            <div>
                                <label htmlFor="addLabel" className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                                    Label
                                </label>
                                <input
                                    id="addLabel"
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-none p-4 text-on-surface font-headline tracking-wider rounded-lg placeholder:text-outline-variant"
                                    placeholder="Home"
                                />
                                <div className="h-[2px] w-full bg-gradient-to-r from-primary/50 to-transparent"></div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded-lg">
                                <p className="font-label text-sm uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={adding}
                                className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : 'Add Meter'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full border border-outline-variant text-on-surface font-headline font-bold py-4 rounded-lg hover:bg-surface-variant/50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Decoration */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-tertiary to-primary animate-pulse"></div>
            </div>
        </div>
    );
};

export default AddMeterModal;
