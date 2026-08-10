import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import PlayIcon from './icons/PlayIcon';
import XMarkIcon from './icons/XMarkIcon';

const UKChartView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { ukSinglesChart = [], ukAlbumsChart = [] } = gameState as any;
    
    const initialTab = gameState.currentView === 'ukAlbumsChart' ? 'albums' : 'singles';
    const [activeTab, setActiveTab] = useState<'singles' | 'albums'>(initialTab);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const currentChartList = activeTab === 'singles' 
        ? ukSinglesChart 
        : (ukAlbumsChart || []).slice(0, 100);

    return (
        <div className="bg-[#fdf9f3] h-full text-black overflow-y-auto pb-24 relative">
            <header className="p-4 flex items-center bg-[#0024f0] text-white sticky top-0 z-10 shadow-md">
                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'apps' })} 
                    className="p-1 -ml-1 rounded-full hover:bg-black/10" 
                    aria-label="Go back"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex-1 flex justify-center gap-2 items-center text-xl md:text-2xl pr-8">
                    <svg className="w-7 h-7 text-white rotate-45 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 5h14v14H5z" />
                        <path d="M15 9l-6 6h6V9z" fill="#0024f0" />
                    </svg>
                    <span>
                        <span className="font-black">Official</span>{' '}
                        <span className="font-light">{activeTab === 'singles' ? 'Singles Chart' : 'Albums Chart'}</span>
                    </span>
                </div>
            </header>
            
            <main className="p-4">
                {/* Navigation Tabs */}
                <div className="flex gap-2 mb-4 bg-zinc-200/80 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('singles')}
                        className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'singles'
                                ? 'bg-[#0024f0] text-white shadow'
                                : 'text-zinc-700 hover:text-black hover:bg-zinc-300/60'
                        }`}
                    >
                        Official Singles Chart
                    </button>
                    <button
                        onClick={() => setActiveTab('albums')}
                        className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'albums'
                                ? 'bg-[#0024f0] text-white shadow'
                                : 'text-zinc-700 hover:text-black hover:bg-zinc-300/60'
                        }`}
                    >
                        Official Albums Chart (Top 100)
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-6 text-sm font-semibold border-b border-zinc-300 pb-2 text-zinc-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    view as cards
                </div>

                <div className="space-y-4">
                    {currentChartList.map((entry: any) => {
                        const isUp = entry.lastWeek && entry.rank < entry.lastWeek;
                        const isDown = entry.lastWeek && entry.rank > entry.lastWeek;
                        const isNew = !entry.lastWeek;
                        
                        return (
                            <div key={entry.uniqueId} className="flex gap-4 items-center border-b border-zinc-200 pb-4">
                                <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                                    <span className="text-5xl md:text-6xl font-black">{entry.rank}</span>
                                    {isUp && <div className="text-pink-500 text-2xl leading-none mt-1">▲</div>}
                                    {isDown && <div className="text-blue-700 text-2xl leading-none mt-1">▼</div>}
                                    {isNew && <div className="text-pink-500 text-[10px] font-bold uppercase mt-1">New</div>}
                                </div>
                                
                                <div className="relative flex-shrink-0">
                                    <img src={entry.coverArt} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded shadow-sm" alt="cover" />
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded">
                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center bg-white/30 backdrop-blur-sm">
                                            <PlayIcon className="w-5 h-5 md:w-6 md:h-6 text-white ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-center min-w-0 pl-1">
                                    <h3 className="font-black text-lg md:text-xl uppercase truncate leading-tight tracking-tight">{entry.title}</h3>
                                    <p className="italic text-xs md:text-sm truncate uppercase tracking-tight text-zinc-800 mt-1">{entry.artist}</p>
                                    
                                    <div className="text-[12px] mt-2 flex items-center gap-1 font-light tracking-wide text-black flex-wrap">
                                        LW: <span className="font-bold text-pink-500">{entry.lastWeek || '-'}</span> 
                                        <span className="ml-1">Peak:</span> <span className="font-bold text-blue-800">{entry.peak}</span>,
                                        <span className="ml-1">Weeks:</span> <span className="font-bold text-pink-500">{entry.weeksOnChart}</span>
                                    </div>
                                </div>
                                
                                <button className="p-2 hover:bg-zinc-200 rounded-full transition-colors flex-shrink-0" onClick={() => setSelectedItem(entry)}>
                                    <InformationCircleIcon className="w-8 h-8 text-zinc-700" />
                                </button>
                            </div>
                        );
                    })}

                    {currentChartList.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            No chart data available for this week.
                        </div>
                    )}
                </div>
            </main>

            {/* Info Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white text-black rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-[#0024f0] p-4 flex justify-between items-start text-white">
                            <div>
                                <h3 className="font-black text-xl uppercase leading-tight tracking-tight pr-4">{selectedItem.title}</h3>
                                <p className="text-sm opacity-90">{selectedItem.artist}</p>
                                {selectedItem.label && <p className="text-xs opacity-75 mt-0.5">{selectedItem.label}</p>}
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-black/20 rounded-full transition-colors flex-shrink-0">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-5 space-y-5">
                            <div className="flex gap-4 items-center">
                                <img src={selectedItem.coverArt} className="w-20 h-20 object-cover rounded-lg shadow" alt="cover" />
                                <div className="flex flex-col justify-center">
                                    <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Current Rank</p>
                                    <p className="text-3xl font-black text-[#0024f0]">#{selectedItem.rank}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Peak: #{selectedItem.peak} • Weeks: {selectedItem.weeksOnChart}</p>
                                </div>
                            </div>
                            
                            {activeTab === 'singles' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#fdf9f3] p-3 rounded-xl border border-zinc-200">
                                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">UK Streams</p>
                                        <p className="text-lg font-bold text-zinc-900">{formatNumber(selectedItem.weeklyStreams)}</p>
                                    </div>
                                    <div className="bg-[#fdf9f3] p-3 rounded-lg border border-zinc-200">
                                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">UK Airplay</p>
                                        <p className="text-lg font-bold text-zinc-900">{formatNumber(selectedItem.radioPlays)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="bg-[#fdf9f3] p-3 rounded-xl border border-zinc-200 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Physical & Pure Sales</p>
                                            <p className="text-xs text-zinc-400">Vinyls, CDs & Downloads</p>
                                        </div>
                                        <p className="text-base font-bold text-zinc-900">{formatNumber(selectedItem.weeklyPureSales || selectedItem.weeklySales || 0)}</p>
                                    </div>
                                    <div className="bg-[#fdf9f3] p-3 rounded-xl border border-zinc-200 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Streams (SES)</p>
                                            <p className="text-xs text-zinc-400">Stream Equivalent Sales</p>
                                        </div>
                                        <p className="text-base font-bold text-zinc-900">{formatNumber(selectedItem.weeklySES || 0)}</p>
                                    </div>
                                    <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-blue-700 uppercase font-bold">Total UK Chart Units</p>
                                            <p className="text-xs text-blue-500">Sales + SES</p>
                                        </div>
                                        <p className="text-xl font-black text-[#0024f0]">{formatNumber(selectedItem.weeklyActivity || 0)}</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                                <p>
                                    {activeTab === 'singles' 
                                        ? 'UK Official Singles Chart is determined by a combination of streaming data and radio airplay within the United Kingdom.'
                                        : 'UK Official Albums Chart combines physical and digital album sales with album streams (SES) within the United Kingdom.'}
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UKChartView;
