
import React from 'react';
import { useGame } from '../context/GameContext';
import ChevronRightIcon from './icons/ChevronRightIcon';

const AwardsTab: React.FC = () => {
    const { dispatch } = useGame();
    return (
        <div className="space-y-4 p-2">
            <h2 className="text-3xl font-black text-amber-500 tracking-tight">Awards & Ceremonies</h2>
            <p className="text-xs text-zinc-400">Track your nominations, wins, and trophy cases across major award bodies.</p>
            
            <div className="space-y-3 pt-2">
                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'grammys' })}
                    className="w-full bg-gradient-to-r from-amber-950/60 via-zinc-800 to-zinc-900 border border-amber-600/30 p-4 rounded-xl text-left hover:border-amber-500 transition-all flex justify-between items-center group shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-amber-500/10 rounded-lg">🎶</span>
                        <div>
                            <h3 className="font-bold text-lg text-amber-200 group-hover:text-amber-400 transition-colors">GRAMMY Awards</h3>
                            <p className="text-xs text-zinc-400">Music recording excellence & category wins.</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </button>

                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'goldenGlobes' })}
                    className="w-full bg-gradient-to-r from-amber-950/60 via-zinc-800 to-zinc-900 border border-amber-600/30 p-4 rounded-xl text-left hover:border-amber-500 transition-all flex justify-between items-center group shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-amber-500/10 rounded-lg">🏆</span>
                        <div>
                            <h3 className="font-bold text-lg text-amber-200 group-hover:text-amber-400 transition-colors">Golden Globe Awards</h3>
                            <p className="text-xs text-zinc-400">TV, Film & soundtrack achievements.</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </button>

                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'oscars' })}
                    className="w-full bg-gradient-to-r from-amber-950/60 via-zinc-800 to-zinc-900 border border-amber-600/30 p-4 rounded-xl text-left hover:border-amber-500 transition-all flex justify-between items-center group shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-amber-500/10 rounded-lg">🎬</span>
                        <div>
                            <h3 className="font-bold text-lg text-amber-200 group-hover:text-amber-400 transition-colors">Academy Awards (Oscars)</h3>
                            <p className="text-xs text-zinc-400">Hollywood cinema, acting & best original song.</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </button>

                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'brits' })}
                    className="w-full bg-gradient-to-r from-blue-950/60 via-zinc-800 to-red-950/60 border border-red-600/30 p-4 rounded-xl text-left hover:border-red-500 transition-all flex justify-between items-center group shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-red-500/10 rounded-lg">🇬🇧</span>
                        <div>
                            <h3 className="font-bold text-lg text-red-200 group-hover:text-red-400 transition-colors">The BRIT Awards</h3>
                            <p className="text-xs text-zinc-400">British music industry honors, Rising Star & genre acts.</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-red-400 transition-colors" />
                </button>

                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'amas' })}
                    className="w-full bg-zinc-800/80 border border-zinc-700/60 p-4 rounded-xl text-left hover:bg-zinc-800 transition-all flex justify-between items-center group"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-zinc-700/40 rounded-lg">⭐</span>
                        <div>
                            <h3 className="font-bold text-lg text-zinc-100 group-hover:text-white transition-colors">American Music Awards (AMAs)</h3>
                            <p className="text-xs text-zinc-400">Fan-voted pop & commercial accolades.</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </button>

                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'vmas' })}
                    className="w-full bg-zinc-800/80 border border-zinc-700/60 p-4 rounded-xl text-left hover:bg-zinc-800 transition-all flex justify-between items-center group"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-zinc-700/40 rounded-lg">🚀</span>
                        <div>
                            <h3 className="font-bold text-lg text-zinc-100 group-hover:text-white transition-colors">MTV Video Music Awards (VMAs)</h3>
                            <p className="text-xs text-zinc-400">Best music videos, visuals & Moon Person trophies.</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
            </div>
        </div>
    );
};

export default AwardsTab;
