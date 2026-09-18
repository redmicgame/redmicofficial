import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'redmic_shutdown_banner_oct15_dismissed';

export const ShutdownTopBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const isDismissed = localStorage.getItem(STORAGE_KEY);
            if (!isDismissed) {
                setIsVisible(true);
            }
        } catch {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {
            console.error(e);
        }
    };

    if (!isVisible) return null;

    return (
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
                    RED MIC IS SHUTTING DOWN OCTOBER 15TH
                </span>
            </div>
            <button
                id="close-shutdown-banner-btn"
                onClick={handleClose}
                className="ml-2 p-1 rounded-full text-white/80 hover:text-white hover:bg-black/30 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60"
                aria-label="Close announcement banner"
                title="Dismiss (will never appear again)"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default ShutdownTopBanner;
