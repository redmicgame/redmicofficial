import React from 'react';

interface SpotifyPlaylistCoverProps {
    name: string;
    imageUrl?: string;
    artistName?: string;
    className?: string;
    size?: 'small' | 'large';
    playlistId?: string;
}

const SpotifyLogo = ({ className = "w-4 h-4 text-white" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C13.62 10.02 19.08 10.68 22.8 12.96c.42.24.6.84.24 1.262zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.72-1.56.42z"/>
    </svg>
);

export const SpotifyPlaylistCover: React.FC<SpotifyPlaylistCoverProps> = ({ 
    name, 
    imageUrl, 
    artistName,
    className = '',
    size = 'small',
    playlistId
}) => {
    const isLarge = size === 'large';
    const lowerName = (name || '').toLowerCase();
    const id = (playlistId || '').toLowerCase();
    const displayImage = imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop";

    // Spotify Logo Badge
    const LogoBadge = () => (
        <div className="absolute top-2.5 left-2.5 z-20">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
                <SpotifyLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            </div>
        </div>
    );

    // 1. Today's Top Hits (tth)
    if (lowerName === "today's top hits" || id === 'tth') {
        return (
            <div className={`relative w-full h-full bg-zinc-900 overflow-hidden group rounded-xl ${className}`}>
                <img 
                    src={displayImage} 
                    alt="Today's Top Hits" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <LogoBadge />
                {/* Bottom Pink/White Frame Banner */}
                <div className="absolute bottom-0 inset-x-0 p-2 sm:p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                    <div className="border-[2px] sm:border-[3px] border-[#ffb6c1] bg-[#ffb6c1]/10 backdrop-blur-[2px] p-1.5 sm:p-2 rounded-lg flex items-center justify-between shadow-2xl">
                        <div className="font-black italic text-[#ffb6c1] tracking-tighter leading-none"
                             style={{ 
                                 fontSize: isLarge ? '5.5rem' : '2.2rem',
                                 WebkitTextStroke: isLarge ? '3px #000' : '1.5px #000',
                                 fontFamily: "'Impact', 'Arial Black', sans-serif"
                             }}>
                            TTH
                        </div>
                        <div className="text-right font-extrabold uppercase leading-[0.85] text-[#ffb6c1]"
                             style={{ 
                                 fontSize: isLarge ? '2rem' : '0.8rem',
                                 letterSpacing: '-0.02em',
                                 textShadow: '0 2px 4px rgba(0,0,0,0.9)'
                             }}>
                            <div>TODAY'S</div>
                            <div>TOP</div>
                            <div>HITS</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. RapCaviar
    if (lowerName === 'rapcaviar' || id === 'rapcaviar') {
        return (
            <div className={`relative w-full h-full bg-black overflow-hidden group rounded-xl ${className}`}>
                <img 
                    src={displayImage} 
                    alt="RapCaviar" 
                    className="w-full h-full object-cover grayscale brightness-90 transition-transform duration-500 group-hover:scale-105"
                />
                <LogoBadge />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
                    <div className="bg-black/90 border-b-2 border-amber-400 px-3 py-1.5 text-center shadow-lg">
                        <h2 className={`${isLarge ? 'text-5xl md:text-6xl' : 'text-xl sm:text-2xl'} font-black text-white italic tracking-tighter uppercase`}
                            style={{ fontFamily: "'Georgia', serif" }}>
                            Rap<span className="text-amber-400">Caviar</span>
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Global Top 50 / Top 50 - Global
    if (lowerName.includes('top 50') || id === 'global50' || id === 'viral50') {
        return (
            <div className={`relative w-full h-full bg-gradient-to-b from-[#148a8c] via-[#115e5f] to-[#0c2e3a] overflow-hidden group rounded-xl flex flex-col justify-between ${className}`}>
                <LogoBadge />
                <div className="absolute inset-0">
                    <img src={displayImage} alt="" className="w-full h-full object-cover opacity-35 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-3 text-center">
                    <span className={`${isLarge ? 'text-7xl md:text-9xl' : 'text-3xl sm:text-4xl'} font-black text-white tracking-tighter drop-shadow-lg`}>
                        TOP 50
                    </span>
                    <div className="w-12 h-1 bg-[#1ed760] my-2 rounded-full"></div>
                    <span className={`${isLarge ? 'text-xl' : 'text-[10px] sm:text-xs'} font-bold uppercase tracking-[0.3em] text-[#1ed760]`}>
                        {lowerName.includes('viral') ? 'VIRAL GLOBAL' : 'GLOBAL'}
                    </span>
                </div>
            </div>
        );
    }

    // 4. Viral Hits
    if (lowerName.includes('viral') || id === 'viralhits') {
        return (
            <div className={`relative w-full h-full bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] overflow-hidden group rounded-xl ${className}`}>
                <img src={displayImage} alt="" className="w-full h-full object-cover opacity-40 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                <LogoBadge />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
                    <h2 className={`${isLarge ? 'text-7xl' : 'text-2xl sm:text-3xl'} font-black text-yellow-300 italic text-center uppercase tracking-tight`}
                        style={{ textShadow: '2px 2px 0 #000, 4px 4px 0 #1ed760' }}>
                        VIRAL<br/>HITS
                    </h2>
                </div>
            </div>
        );
    }

    // 5. Pop Rising
    if (lowerName.includes('pop rising') || id === 'poprising') {
        return (
            <div className={`relative w-full h-full bg-gradient-to-tr from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] overflow-hidden group rounded-xl ${className}`}>
                <img src={displayImage} alt="" className="w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
                <LogoBadge />
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-10">
                    <div className="border border-pink-400 bg-pink-500/20 backdrop-blur-sm p-2 rounded-lg text-center">
                        <h2 className={`${isLarge ? 'text-5xl' : 'text-xl sm:text-2xl'} font-black text-white italic uppercase tracking-wider`}>
                            POP <span className="text-pink-300">RISING</span>
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    // 6. Hot Country
    if (lowerName.includes('country') || id === 'hotcountry') {
        return (
            <div className={`relative w-full h-full bg-gradient-to-b from-[#b45309] to-[#78350f] overflow-hidden group rounded-xl ${className}`}>
                <img src={displayImage} alt="" className="w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
                <LogoBadge />
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
                    <div className="border-b-2 border-amber-500 pb-1">
                        <h2 className={`${isLarge ? 'text-5xl' : 'text-xl sm:text-2xl'} font-black text-amber-100 uppercase tracking-tight italic`}>
                            HOT COUNTRY
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    // 7. This Is [Artist]
    if (lowerName.startsWith('this is ') || id.startsWith('this_is')) {
        const artist = name.replace(/^This Is /i, '');
        return (
            <div className={`relative w-full h-full bg-white flex flex-col rounded-xl overflow-hidden shadow-lg ${className}`}>
                <div className={`${isLarge ? 'py-4' : 'py-2'} bg-white text-black text-center font-black uppercase tracking-tighter ${isLarge ? 'text-3xl' : 'text-sm'}`}>
                    THIS IS
                </div>
                <div className="flex-1 relative bg-zinc-900 border-x-4 border-white overflow-hidden">
                    <img src={displayImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={artist} />
                    <LogoBadge />
                </div>
                <div className={`${isLarge ? 'py-4' : 'py-2'} bg-[#fbef3a] text-black text-center font-black truncate px-2 ${isLarge ? 'text-3xl' : 'text-sm'}`}>
                    {artist}
                </div>
            </div>
        );
    }

    // 8. Default Playlist Cover
    return (
        <div className={`relative w-full h-full bg-[#282828] overflow-hidden group rounded-xl ${className}`}>
            <img 
                src={displayImage} 
                alt={name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <LogoBadge />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-3">
                <span className={`${isLarge ? 'text-4xl md:text-5xl drop-shadow-md' : 'text-sm sm:text-base'} text-white font-black uppercase tracking-tight leading-tight line-clamp-2`}>
                    {name}
                </span>
            </div>
        </div>
    );
};

