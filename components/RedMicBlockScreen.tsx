import React, { useState } from 'react';

interface RedMicBlockScreenProps {
    onUnlock: () => void;
}

export const REDMIC_ACCESS_STORAGE_KEY = 'redmic_access_unlocked';
const ACCESS_CODE = 'gyalasf';

export const RedMicBlockScreen: React.FC<RedMicBlockScreenProps> = ({ onUnlock }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleOpenModal = () => {
        setCode('');
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCode('');
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim().toLowerCase() === ACCESS_CODE) {
            setError('');
            setIsModalOpen(false);
            onUnlock();
        } else {
            setError('Invalid access code. Please try again.');
        }
    };

    return (
        <div
            id="redmic-block-screen"
            className="fixed inset-0 z-[9999999] min-h-[100dvh] h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-between px-6 py-8 overflow-hidden select-none"
        >
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="w-[28rem] h-[28rem] rounded-full bg-red-600/10 blur-3xl" />
            </div>

            {/* Top spacer for vertical centering */}
            <div className="h-6" />

            {/* Center unavailable message */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-950/30">
                    <svg
                        className="w-8 h-8 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Red Mic is currently unavailable
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Please check back later.
                    </p>
                </div>
            </div>

            {/* Bottom Need Access trigger */}
            <div className="relative z-10 pb-2">
                <button
                    id="need-access-btn"
                    type="button"
                    onClick={handleOpenModal}
                    className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-200 underline underline-offset-4 transition-colors cursor-pointer focus:outline-none"
                >
                    Need access?
                </button>
            </div>

            {/* Access Code Modal */}
            {isModalOpen && (
                <div
                    id="access-code-modal-backdrop"
                    className="fixed inset-0 z-[10000000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        id="access-code-modal"
                        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            aria-label="Close modal"
                            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-lg font-black text-white">Enter Access Code</h2>
                        <p className="text-xs text-zinc-400 mt-1">
                            Enter your access code to continue into Red Mic.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div>
                                <input
                                    id="access-code-input"
                                    type="text"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        if (error) setError('');
                                    }}
                                    placeholder="Enter access code..."
                                    autoComplete="off"
                                    autoFocus
                                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                                />
                                {error && (
                                    <p className="mt-2 text-xs text-red-400 font-medium">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="submit-access-code-btn"
                                    type="submit"
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20 text-sm cursor-pointer"
                                >
                                    Enter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RedMicBlockScreen;
