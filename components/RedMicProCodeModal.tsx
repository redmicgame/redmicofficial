import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import StarIcon from './icons/StarIcon';

interface RedMicProCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const RedMicProCodeModal: React.FC<RedMicProCodeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { dispatch } = useGame();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    // The only active Red Mic Pro code allowed
    const ONLY_ACTIVE_CODE = "RMP-7A2B-9D60-D79D";

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formattedCode = code.trim().toUpperCase();

        if (!formattedCode) {
            setError('Please enter your Red Mic Pro code.');
            return;
        }

        if (formattedCode === ONLY_ACTIVE_CODE) {
            // Unlocks Red Mic Pro
            dispatch({ type: 'UNLOCK_RED_MIC_PRO', payload: { type: 'code', cost: 0 } });
            setIsSuccess(true);
            if (onSuccess) {
                onSuccess();
            }
        } else {
            // All other codes are explicitly disabled as requested
            setError('This code is disabled or expired. Red Mic Pro is discontinued for new members; only active existing subscriber codes are valid.');
        }
    };

    const handleClose = () => {
        setCode('');
        setError('');
        setIsSuccess(false);
        onClose();
    };

    const handleGoToDashboard = () => {
        handleClose();
        dispatch({ type: 'CHANGE_VIEW', payload: 'redMicProDashboard' });
    };

    return (
        <div 
            id="redmic-pro-code-modal-backdrop"
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn"
            onClick={handleClose}
        >
            <div 
                id="redmic-pro-code-modal-container"
                className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 relative text-white"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    id="close-pro-code-modal-btn"
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {isSuccess ? (
                    <div className="text-center py-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mx-auto">
                            <StarIcon className="w-10 h-10 text-yellow-400 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-yellow-400">Pro Code Verified!</h3>
                            <p className="text-sm text-zinc-300 mt-2">
                                Your active subscription code has been validated. Red Mic Pro features are now unlocked for your artist.
                            </p>
                        </div>
                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                id="go-to-pro-dashboard-btn"
                                onClick={handleGoToDashboard}
                                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors shadow-lg"
                            >
                                Open Pro Dashboard
                            </button>
                            <button
                                onClick={handleClose}
                                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/50 px-2 py-0.5 rounded-full">
                                Discontinued Service
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400">
                                Existing Members Only
                            </span>
                        </div>

                        <h2 className="text-xl font-black text-white">
                            Enter Red Mic Pro Code
                        </h2>

                        <div className="mt-2 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 leading-relaxed">
                            <span className="font-bold text-red-300">Notice:</span> Red Mic Pro is now discontinued for new members. Old members may still be able to use their code if their subscription is still active.
                        </div>

                        <form onSubmit={handleUnlock} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                                    Subscription Code
                                </label>
                                <div className="relative">
                                    <input 
                                        id="redmic-pro-code-input"
                                        type="text"
                                        value={code}
                                        onChange={e => {
                                            setCode(e.target.value);
                                            if (error) setError('');
                                        }}
                                        placeholder="Enter your subscription code..."
                                        autoFocus
                                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm font-mono tracking-wider text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all uppercase"
                                    />
                                </div>
                                {error && (
                                    <div className="mt-2 p-2.5 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-2 text-xs text-red-300 animate-fadeIn">
                                        <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    id="submit-pro-code-btn"
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg text-sm flex items-center justify-center gap-2"
                                >
                                    <span>Verify & Unlock</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RedMicProCodeModal;
