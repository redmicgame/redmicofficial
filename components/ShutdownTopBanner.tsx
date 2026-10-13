import React, { useState } from 'react';

const STORAGE_KEY = 'redmic_shutdown_banner_nov15_dismissed';

export const ShutdownTopBanner: React.FC = () => {
    const [isDismissed, setIsDismissed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDismiss = () => {
        setIsModalOpen(false);
        setIsDismissed(true);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            console.error(e);
        }
    };

    if (isDismissed) return null;

    return (
        <>
            {/* Top Announcement Banner */}
            <div 
                id="redmic-shutdown-top-banner"
                className="w-full bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between shadow-2xl border-b border-red-500/70 z-[999999] shrink-0 select-none"
            >
                <div className="flex items-center gap-2 sm:gap-3 mx-auto text-center truncate">
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <span className="tracking-wider uppercase font-black text-xs sm:text-sm drop-shadow truncate">
                        UPDATE: RED MIC IS SHUTTING DOWN ON NOVEMBER 15TH
                    </span>
                </div>
                <button
                    id="view-more-shutdown-banner-btn"
                    onClick={() => setIsModalOpen(true)}
                    className="ml-2 px-3 py-1 rounded-full bg-white/20 hover:bg-white text-white hover:text-red-700 transition-all font-bold text-xs uppercase tracking-wider border border-white/40 shadow-sm shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60"
                    aria-label="View more details about the shutdown update"
                >
                    View more
                </button>
            </div>

            {/* Shutdown Update Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={handleDismiss}
                >
                    <div 
                        className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 sm:p-7 text-white space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="border-b border-zinc-800 pb-3">
                            <h2 className="text-lg sm:text-xl font-black text-red-400 flex items-center gap-2 leading-snug">
                                <span>📢</span>
                                <span>IMPORTANT ANNOUNCEMENT: RED MIC SHUTDOWN UPDATE</span>
                            </h2>
                        </div>

                        {/* Modal Content */}
                        <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
                            <p className="font-semibold text-white">
                                Hello Red Mic Community,
                            </p>

                            <p>
                                I would like to inform everyone that the previously scheduled shutdown of Red Mic on October 15th has officially been postponed to <strong className="text-white">November 15th, 2026</strong>.
                            </p>

                            <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-2">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                                    Updated Shutdown Schedule:
                                </h3>
                                <ul className="list-disc list-inside space-y-1.5 text-zinc-200 text-sm">
                                    <li>
                                        <strong>Shutdown Begins:</strong> November 15th, 2026, at 12:00 AM EST
                                    </li>
                                    <li>
                                        <strong>Expected Return:</strong> December 1st, 2026
                                    </li>
                                </ul>
                            </div>

                            <p>
                                During this temporary shutdown, I will be prioritizing two major projects:
                            </p>

                            <div className="space-y-3">
                                <div className="bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-700">
                                    <p className="text-sm">
                                        <span className="font-bold text-white">📱 Red Mic App Store Release:</span> Preparing Red Mic for its official launch on mobile app stores, making the platform more accessible to users.
                                    </p>
                                </div>

                                <div className="bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-700">
                                    <p className="text-sm">
                                        <span className="font-bold text-white">🌐 Future Online Mode:</span> Continuing development and preparations for an upcoming online mode, designed to introduce new ways for our community to connect and interact.
                                    </p>
                                </div>
                            </div>

                            <p>
                                This temporary shutdown will allow me to focus my resources on these important developments and improve the overall Red Mic experience.
                            </p>

                            <p>
                                I sincerely appreciate your continued patience, understanding, and support as I work toward the next chapter of Red Mic.
                            </p>

                            <p className="font-medium text-zinc-200">
                                Thank you for being part of the Red Mic community. I look forward to welcoming you back on December 1st!
                            </p>

                            <p className="text-right italic font-semibold text-zinc-400 pt-2">
                                — The Red Mic Developer
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-3 border-t border-zinc-800 flex justify-end">
                            <button
                                onClick={handleDismiss}
                                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShutdownTopBanner;
