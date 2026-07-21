import React, { useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

const SpotifyVideoChartView: React.FC = () => {
    const { gameState, dispatch } = useGame();

    const videoChart = useMemo(() => {
        // Find 30 songs from NPCs that are released and have high streaming
        const allSongs = [];
        Object.values(gameState.artistsData).forEach(artistData => {
            if (artistData.artist.id !== gameState.activeArtistId) {
                artistData.songs.forEach(song => {
                    if (song.isReleased) {
                        allSongs.push({ ...song, artistName: artistData.artist.name });
                    }
                });
            }
        });
        
        allSongs.sort((a, b) => b.streams - a.streams);
        const top30 = allSongs.slice(0, 30);
        
        // Add fake video data
        return top30.map((song, i) => ({
            ...song,
            videoThumbnail: song.coverArt, // fallback
            videoViews: Math.floor(song.streams * 0.4), // 40% of streams as video views
            rank: i + 1,
            isNew: Math.random() > 0.8
        }));
    }, [gameState.artistsData, gameState.activeArtistId]);

    return (
        <div className="bg-[#121212] min-h-full text-white pb-20">
            <header className="sticky top-0 bg-[#121212]/90 backdrop-blur-md p-4 flex items-center z-10">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'spotifyChart' })} className="p-1 -ml-1 rounded-full hover:bg-white/10" aria-label="Go back">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            </header>
            
            <div className="px-4 pb-4">
                <div className="flex flex-col items-center text-center mt-2 mb-6">
                    <div className="w-52 h-52 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 mb-4 shadow-xl flex items-center justify-center rounded">
                        <div className="text-left p-4 w-full h-full flex flex-col justify-between">
                            <div>
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.693 15.642c-.22.36-.684.478-1.042.257-2.857-1.745-6.452-2.14-10.672-1.173-.41.094-.82-.162-.914-.572-.094-.41.162-.82.572-.914 4.59-.105 8.524.333 11.758 2.31.36.22.478.683.257 1.042zm1.328-2.955c-.276.45-.856.598-1.306.322-3.266-2.008-8.243-2.613-11.956-1.428-.507.162-1.044-.117-1.205-.623-.162-.507.117-1.044.623-1.205 4.25-1.353 9.75-.68 13.522 1.636.45.276.598.856.322 1.306zm.13-3.084c-3.92-2.327-10.4-2.542-14.15-1.405-.595.18-1.226-.156-1.406-.75-.18-.595.156-1.226.75-1.406 4.34-1.317 11.536-1.063 16.082 1.636.53.315.705 1.002.39 1.533-.315.53-1.002.705-1.533.39z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white leading-tight">Music Video</h1>
                                <h1 className="text-3xl font-black text-white leading-tight">Charts</h1>
                                <h1 className="text-3xl font-black text-white leading-tight">Global</h1>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded flex items-center">
                                <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5 21V3l16 9-16 9z"/>
                                </svg>
                                Daily Music Charts
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400 mt-2">Your daily update of the most played music videos right now - Global.</p>
                    <div className="flex items-center gap-2 mt-3 text-sm font-semibold">
                        <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                        </svg>
                        <span>Spotify</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <button className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center text-black hover:scale-105 transition-transform ml-auto">
                        <svg className="w-6 h-6 ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {videoChart.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="w-6 text-center text-zinc-400 font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="w-24 h-14 relative flex-shrink-0">
                                <img src={item.videoThumbnail} alt={item.title} className="w-full h-full object-cover rounded" />
                                <div className="absolute bottom-1 right-1 bg-black/70 text-[10px] px-1 rounded text-white">4:32</div>
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-white text-base truncate font-semibold">{item.title}</p>
                                <div className="flex items-center text-sm text-zinc-400 truncate gap-1 mt-0.5">
                                    {item.isExplicit && <span className="bg-zinc-300 text-black text-[10px] px-1 rounded font-bold">E</span>}
                                    <span className="truncate">{item.artistName}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SpotifyVideoChartView;
