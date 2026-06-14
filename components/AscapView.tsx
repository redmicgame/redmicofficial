import React, { useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const AscapView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();

    const oldSongs = useMemo(() => {
        if (!activeArtistData) return [];
        return activeArtistData.songs.filter(s => 
            s.isReleased && 
            s.releaseDate && 
            s.releaseDate.year < 2008 && 
            s.isAvailableOnStreaming !== true
        );
    }, [activeArtistData]);

    const handleUpload = (songId: string) => {
        if (!activeArtistData) return;
        const COST = 1500;
        if (activeArtistData.money < COST) {
            alert('Not enough money to upload to streaming. Costs $1,500.');
            return;
        }
        dispatch({ type: 'UPLOAD_TO_STREAMING', payload: { songId, cost: COST } });
    };

    const handleUploadAll = () => {
        if (!activeArtistData) return;
        const COST = oldSongs.length * 1500;
        if (activeArtistData.money < COST) {
            alert(`Not enough money to upload all. Costs $${formatNumber(COST)}.`);
            return;
        }
        oldSongs.forEach(song => {
             dispatch({ type: 'UPLOAD_TO_STREAMING', payload: { songId: song.id, cost: 1500 } });
        });
    }

    if (!activeArtistData) return null;

    return (
        <div className="bg-[#EFEFEF] min-h-full font-serif text-black pt-12 pb-24 relative overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-12 bg-blue-900 flex items-center px-4 shadow-md z-10">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="text-white p-1 hover:bg-blue-800 rounded mr-4">
                    <ArrowLeftIcon className="w-5 h-5"/>
                </button>
                <div className="flex-1 flex items-center">
                    <span className="font-bold text-white text-lg tracking-widest uppercase">ASCAP</span>
                </div>
            </div>

            <div className="p-6">
                <div className="bg-white p-6 shadow-md border-t-8 border-blue-900 mb-6">
                    <h2 className="text-2xl font-bold mb-2">Digital Streaming Rights Management</h2>
                    <p className="text-sm text-gray-700">
                        In the modern era, music generates revenue primarily through streaming services like Spotify and Apple Music. 
                        Songs released on CD or Vinyl before 2008 are NOT automatically available on streaming platforms. 
                        You must negotiate back-catalog clearances and pay server hosting fees to distribute your legacy music digitally.
                    </p>
                </div>
                
                <h3 className="text-xl font-bold mb-4 border-b-2 border-blue-900 pb-2">Legacy Catalog Pending Distribution</h3>

                {oldSongs.length === 0 ? (
                    <div className="bg-white p-4 text-center text-gray-500 italic shadow">
                        All eligible legacy music has been uploaded to streaming platforms.
                    </div>
                ) : (
                    <div>
                        <div className="mb-4 flex justify-end">
                            <button onClick={handleUploadAll} className="bg-blue-900 text-white px-4 py-2 text-sm font-bold shadow hover:bg-blue-800">
                                Distribute All Selected ($ {formatNumber(oldSongs.length * 1500)})
                            </button>
                        </div>
                        <div className="space-y-3">
                            {oldSongs.map((song) => (
                                <div key={song.id} className="bg-white p-4 border border-gray-300 shadow flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{song.title}</p>
                                        <p className="text-xs text-gray-500">Released: {song.releaseDate?.month} / {song.releaseDate?.year}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleUpload(song.id)}
                                        className="bg-green-700 text-white px-3 py-1 text-sm font-bold rounded-sm shadow hover:bg-green-600 border border-green-900"
                                    >
                                        Distribute ($1,500)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AscapView;
