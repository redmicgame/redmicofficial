import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CameraIcon from './icons/CameraIcon';
import BritAwardIcon from './icons/BritAwardIcon';

const BritRedCarpetView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { activeBritRedCarpetOffer } = gameState;

    const [lookUrl, setLookUrl] = useState<string | null>(null);

    if (!activeBritRedCarpetOffer) return null;
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setLookUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAttend = () => {
        if (lookUrl) {
            dispatch({ type: 'ACCEPT_BRIT_RED_CARPET', payload: { emailId: activeBritRedCarpetOffer.emailId, lookUrl } });
        }
    };
    
    return (
        <div className="h-full w-full bg-zinc-950 text-white flex flex-col overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-gradient-to-r from-blue-950 via-zinc-900 to-red-950 backdrop-blur-md z-20 border-b border-red-800/40 shrink-0">
                <button 
                    onClick={() => dispatch({ type: 'DECLINE_BRIT_RED_CARPET', payload: { emailId: activeBritRedCarpetOffer.emailId } })} 
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <BritAwardIcon className="w-6 h-6 text-red-400" />
                    <h1 className="text-xl font-bold">The BRIT Awards Red Carpet</h1>
                </div>
            </header>

            <main className="flex-grow p-4 md:p-6 flex flex-col justify-start items-center text-center space-y-5 max-w-md mx-auto w-full pb-32 pt-2">
                <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-2xl shrink-0 mt-2">
                    <BritAwardIcon className="w-10 h-10 text-red-400" />
                </div>
                
                <div className="shrink-0">
                    <h2 className="text-2xl md:text-3xl font-black">Upload Your BRITs Look</h2>
                    <p className="text-zinc-400 text-xs md:text-sm mt-1 max-w-sm">
                        Pop Base and international outlets are awaiting your arrival in London for the BRITs red carpet.
                    </p>
                </div>

                <label htmlFor="brit-look-upload" className="cursor-pointer w-full shrink-0">
                    <div className="w-full aspect-square rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center hover:border-red-500 transition-all overflow-hidden group shadow-lg shadow-black/40">
                        {lookUrl ? (
                            <img src={lookUrl} alt="BRITs Red Carpet Look" className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform" />
                        ) : (
                            <div className="text-zinc-400 p-6 space-y-2">
                                <div className="p-3 bg-zinc-800 rounded-full w-fit mx-auto group-hover:bg-red-600/20 transition-colors">
                                    <CameraIcon className="w-8 h-8 mx-auto text-zinc-300 group-hover:text-red-400" />
                                </div>
                                <p className="font-semibold text-sm text-zinc-200">Tap to upload outfit photo</p>
                                <p className="text-xs text-zinc-500">Supports PNG, JPG, WEBP</p>
                            </div>
                        )}
                    </div>
                </label>
                <input id="brit-look-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                <button 
                    onClick={handleAttend} 
                    disabled={!lookUrl} 
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition-all text-sm flex items-center justify-center gap-2 shrink-0"
                >
                    Walk Red Carpet & Post Look
                </button>
            </main>
        </div>
    );
};

export default BritRedCarpetView;
