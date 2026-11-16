import React, { useState, useEffect } from 'react';
import { db, getActiveSaveId, injectMediaIntoState } from '../db/db';

interface RedMicBlockScreenProps {
    onUnlock: () => void;
}

interface SavedSlotItem {
    id: number;
    state: any;
}

export const REDMIC_ACCESS_STORAGE_KEY = 'redmic_access_unlocked';
const ACCESS_CODE = 'gyalasf';

export const RedMicBlockScreen: React.FC<RedMicBlockScreenProps> = ({ onUnlock }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloadsPageOpen, setIsDownloadsPageOpen] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    // Save downloads page state
    const [savedSlots, setSavedSlots] = useState<SavedSlotItem[]>([]);
    const [loadingSaves, setLoadingSaves] = useState(false);
    const [downloadingSlotId, setDownloadingSlotId] = useState<number | null>(null);
    const [downloadError, setDownloadError] = useState('');
    const activeSaveId = getActiveSaveId();

    useEffect(() => {
        if (!isDownloadsPageOpen) return;

        let cancelled = false;
        const fetchSaves = async () => {
            setLoadingSaves(true);
            setDownloadError('');
            try {
                const allSaves = await db.saves.toArray();
                const validSaves = allSaves
                    .filter((s): s is SavedSlotItem => typeof s.id === 'number' && !!s.state && !!s.state.careerMode)
                    .sort((a, b) => a.id - b.id);
                if (!cancelled) {
                    setSavedSlots(validSaves);
                }
            } catch (err) {
                console.error('Failed to load saves for download:', err);
                if (!cancelled) {
                    setDownloadError('Unable to read saved games from local storage.');
                }
            } finally {
                if (!cancelled) {
                    setLoadingSaves(false);
                }
            }
        };

        fetchSaves();
        return () => {
            cancelled = true;
        };
    }, [isDownloadsPageOpen]);

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

    const handleDownloadSave = async (slot: SavedSlotItem) => {
        if (downloadingSlotId !== null) return;
        setDownloadingSlotId(slot.id);
        setDownloadError('');
        try {
            const fullState = await injectMediaIntoState(slot.state);
            const rawArtistName =
                fullState.careerMode === 'solo'
                    ? fullState.soloArtist?.name
                    : fullState.group?.name;
            const artistSlug = (rawArtistName || `slot_${slot.id}`).replace(/\s+/g, '_');
            const dateStr = fullState.date ? `${fullState.date.year}-W${fullState.date.week}` : `slot-${slot.id}`;
            const fileName = `red-mic-save_${artistSlug}_${dateStr}.json`;

            const jsonStr = JSON.stringify(fullState, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export save:', err);
            setDownloadError(`Failed to prepare download for Save Slot ${slot.id}.`);
        } finally {
            setDownloadingSlotId(null);
        }
    };

    if (isDownloadsPageOpen) {
        return (
            <div
                id="redmic-save-downloads-page"
                className="fixed inset-0 z-[9999999] min-h-[100dvh] h-[100dvh] w-full bg-zinc-950 text-white flex flex-col overflow-hidden"
            >
                {/* Top Header */}
                <header className="w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-4 sm:px-6 py-4 shrink-0">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                        <button
                            id="save-downloads-back-top-btn"
                            type="button"
                            onClick={() => setIsDownloadsPageOpen(false)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Go Back</span>
                        </button>

                        <h1 className="text-base sm:text-xl font-black tracking-tight text-white text-right">
                            Saves available for download
                        </h1>
                    </div>
                </header>

                {/* Scrollable Saves List */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {downloadError && (
                            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-sm text-red-300">
                                {downloadError}
                            </div>
                        )}

                        {loadingSaves ? (
                            <div className="py-16 text-center text-zinc-400 text-sm">
                                Loading your saved files...
                            </div>
                        ) : savedSlots.length === 0 ? (
                            <div className="py-16 px-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-center space-y-2">
                                <p className="text-base font-bold text-zinc-200">No saved files found</p>
                                <p className="text-sm text-zinc-400">
                                    There are currently no saved careers stored in this browser.
                                </p>
                            </div>
                        ) : (
                            savedSlots.map((slot) => {
                                const saveState = slot.state;
                                const isActive = slot.id === activeSaveId;
                                const isSolo = saveState.careerMode === 'solo';
                                const artistName = isSolo
                                    ? saveState.soloArtist?.name || 'Unnamed Artist'
                                    : saveState.group?.name || 'Unnamed Group';
                                const isDownloading = downloadingSlotId === slot.id;

                                return (
                                    <div
                                        key={slot.id}
                                        className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
                                            isActive
                                                ? 'bg-red-950/20 border-red-500/40'
                                                : 'bg-zinc-900 border-zinc-800'
                                        }`}
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-base sm:text-lg font-bold text-white">
                                                    Save Slot {slot.id}
                                                </span>
                                                {isActive && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-300 truncate">
                                                {isSolo ? 'Artist' : 'Group'}:{' '}
                                                <span className="font-semibold text-white">{artistName}</span>
                                            </p>
                                            {saveState.date && (
                                                <p className="text-xs text-zinc-400">
                                                    Year {saveState.date.year}, Week {saveState.date.week}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            id={`download-save-slot-${slot.id}-btn`}
                                            type="button"
                                            disabled={downloadingSlotId !== null}
                                            onClick={() => handleDownloadSave(slot)}
                                            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                            <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>

                {/* Bottom Go Back Bar */}
                <footer className="w-full border-t border-zinc-800 bg-zinc-900/80 px-4 sm:px-6 py-4 shrink-0">
                    <div className="max-w-2xl mx-auto flex justify-center">
                        <button
                            id="save-downloads-go-back-btn"
                            type="button"
                            onClick={() => setIsDownloadsPageOpen(false)}
                            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-sm transition-colors cursor-pointer"
                        >
                            Go Back
                        </button>
                    </div>
                </footer>
            </div>
        );
    }

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

            {/* Bottom Need Access & Download Saves triggers */}
            <div className="relative z-10 pb-2 flex flex-col items-center gap-2.5">
                <button
                    id="need-access-btn"
                    type="button"
                    onClick={handleOpenModal}
                    className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-200 underline underline-offset-4 transition-colors cursor-pointer focus:outline-none"
                >
                    Need access?
                </button>
                <button
                    id="need-download-saves-btn"
                    type="button"
                    onClick={() => setIsDownloadsPageOpen(true)}
                    className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-200 underline underline-offset-4 transition-colors cursor-pointer focus:outline-none"
                >
                    Need to download your saves?
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
