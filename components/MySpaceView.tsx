import React from 'react';
import { useGame } from '../context/GameContext';

const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
);

const MySpaceView: React.FC = () => {
    const { gameState, dispatch, activeArtist } = useGame();

    return (
        <div className="bg-[#e9e9e9] min-h-screen text-black font-sans pb-24">
            <header className="bg-[#003399] p-2 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="px-2 py-1 bg-[#6699cc] text-xs font-bold rounded border border-blue-300">Back</button>
                    <h1 className="font-bold tracking-tight">MySpace</h1>
                </div>
                <div className="text-xs">
                    <a href="#" className="underline">Home</a> | <a href="#" className="underline">Browse</a> | <a href="#" className="underline">Search</a>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-1/3">
                    <h2 className="text-xl font-bold mb-2">{activeArtist?.name}</h2>
                    <img src={activeArtist?.image} alt={activeArtist?.name} className="w-full max-w-[200px] border border-gray-400 mb-2" />
                    <p className="text-sm">"{activeArtist?.name} is in your extended network"</p>
                    
                    <div className="bg-white border border-[#003399] mt-4 p-2">
                        <h3 className="bg-[#6699cc] text-white p-1 text-sm font-bold">Contacting {activeArtist?.name}</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 mt-2">
                            <a href="#" className="flex items-center gap-1"><UsersIcon className="w-3 h-3"/> Add to Friends</a>
                            <a href="#" className="flex items-center gap-1"><UsersIcon className="w-3 h-3"/> Send Message</a>
                            <a href="#" className="flex items-center gap-1"><UsersIcon className="w-3 h-3"/> Add to Group</a>
                            <a href="#" className="flex items-center gap-1"><UsersIcon className="w-3 h-3"/> Block User</a>
                        </div>
                    </div>
                </aside>

                <section className="w-full md:w-2/3">
                    <div className="bg-white border border-[#003399]">
                        <h3 className="bg-[#ffcc99] text-[#cc6600] p-1 text-sm font-bold mb-2">{activeArtist?.name}'s Interests</h3>
                        <div className="p-2 text-sm space-y-2">
                            <p><strong>General:</strong> Music, recording, touring.</p>
                            <p><strong>Music:</strong> Everything.</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-[#ff6600] text-lg font-bold mb-2">{activeArtist?.name}'s Friend Space</h3>
                        <p className="font-bold text-sm mb-2">{activeArtist?.name} has <span className="text-[#ff0000]">{Math.floor(gameState.artistsData[activeArtist?.id || '']?.popularity * 1000).toLocaleString()}</span> friends.</p>
                        
                        <div className="grid grid-cols-4 gap-4">
                            {/* Dummy friends */}
                            {gameState.npcs.slice(0, 8).map(npc => (
                                <div key={npc.id} className="text-center">
                                    <h4 className="text-xs font-bold text-[#003399] truncate">{npc.name}</h4>
                                    <div className="bg-white shadow aspect-square mt-1 border border-gray-300 flex items-center justify-center p-1">
                                        <img src={npc.image} alt={npc.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MySpaceView;
