

import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Tour } from '../types';

const ChevronDownIcon = ({className}: {className?: string}) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>;
const ChevronUpIcon = ({className}: {className?: string}) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="18 15 12 9 6 15"></polyline></svg>;
const ChevronRightIcon = ({className}: {className?: string}) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;

const ToursView: React.FC = () => {
    const { dispatch, activeArtistData, activeArtist } = useGame();
    const [activeTab, setActiveTab] = useState<'ABOUT' | 'SETLISTS' | 'FAQS' | 'REVIEWS'>('SETLISTS');
    const [expandedSetlistTourId, setExpandedSetlistTourId] = useState<string | null>(null);

    if (!activeArtistData || !activeArtist) return null;
    const { tours, songs } = activeArtistData;

    const plannedTours = tours.filter(t => t.status === 'planning' || t.status === 'presale');
    const activeTours = tours.filter(t => t.status === 'active');
    const pastTours = tours.filter(t => t.status === 'finished');

    const handleSelectTour = (tourId: string) => {
        dispatch({ type: 'SELECT_TOUR', payload: tourId });
        dispatch({ type: 'CHANGE_VIEW', payload: 'tourDetail' });
    };

    return (
        <div className="h-screen w-full bg-white text-black overflow-y-auto relative font-sans">
            <header className="p-4 flex justify-between items-center bg-[#111111] text-white">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-bold tracking-widest uppercase">{activeArtist.name}</h1>
                <div className="flex gap-3">
                    <button className="p-2 rounded-full bg-white/10"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
                    <button className="p-2 rounded-full bg-white/10"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></button>
                </div>
            </header>

            <div className="flex px-4 border-b border-gray-200 overflow-x-auto no-scrollbar pt-2 bg-white sticky top-0 z-10">
                {['ABOUT', 'SETLISTS', 'FAQS', 'REVIEWS'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-3 text-xs font-bold tracking-widest whitespace-nowrap border-b-2 ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-500'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <main className="p-5 pb-32">
                {activeTab === 'SETLISTS' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">SETLISTS</h2>
                        
                        <div className="divide-y divide-gray-200">
                            {[...activeTours, ...pastTours].reverse().map(tour => {
                                const isExpanded = expandedSetlistTourId === tour.id;
                                const setlistSongs = tour.setlist.map(id => songs.find(s => s.id === id)).filter(Boolean);
                                
                                // Generate a mock date for display
                                const dateStr = `Thu, Mar ${Math.floor(Math.random() * 28) + 1}, 2025`;

                                return (
                                    <div key={tour.id} className="py-5">
                                        <div 
                                            className="flex gap-4 cursor-pointer" 
                                            onClick={() => setExpandedSetlistTourId(isExpanded ? null : tour.id)}
                                        >
                                            <div className="mt-1"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></div>
                                            <div className="flex-grow">
                                                <h3 className="text-lg font-medium">{tour.name}</h3>
                                                <p className="text-gray-500">{tour.venues[0]?.city}, {tour.venues[0]?.name}</p>
                                                <p className="text-gray-500">{dateStr}</p>
                                            </div>
                                            <div>
                                                {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-400"/> : <ChevronDownIcon className="w-5 h-5 text-gray-400"/>}
                                            </div>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="mt-6  pl-10 space-y-3 pb-4">
                                                {setlistSongs.map((song, i) => (
                                                    <div key={i} className="flex gap-4 text-base">
                                                        <span className="w-6 text-right text-gray-800">{i + 1}.</span>
                                                        <span className="font-medium">{song?.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {activeTours.length === 0 && pastTours.length === 0 && (
                                <p className="text-gray-500 py-4">No setlists available yet. Complete a tour first.</p>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'ABOUT' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">TOURS</h2>
                        <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'createTour'})} className="w-full bg-[#0055FF] text-white p-4 rounded-full font-bold text-base hover:bg-blue-700 transition-colors">
                            Plan a New Tour
                        </button>
                        
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming & Active</h3>
                            {plannedTours.map(tour => (
                                <div key={tour.id} onClick={() => handleSelectTour(tour.id)} className="border border-gray-200 p-4 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-lg">{tour.name}</p>
                                        <p className="text-sm text-gray-500">{tour.venues.length} dates • {tour.status.toUpperCase()}</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                                </div>
                            ))}
                            {plannedTours.length === 0 && <p className="text-gray-400 text-sm">No active tours.</p>}

                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-8">Past Tours</h3>
                            {pastTours.map(tour => (
                                <div key={tour.id} onClick={() => handleSelectTour(tour.id)} className="border border-gray-200 bg-gray-50 p-4 rounded-xl cursor-pointer hover:border-gray-400 transition-all flex items-center justify-between opacity-80">
                                    <div>
                                        <p className="font-bold text-lg text-gray-700">{tour.name}</p>
                                        <p className="text-sm text-gray-500">{tour.venues.length} dates • {tour.status.toUpperCase()}</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                                </div>
                            ))}
                            {pastTours.length === 0 && <p className="text-gray-400 text-sm">No past tours.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'FAQS' && (
                     <div className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">FAQS</h2>
                        <p className="text-gray-500">How do I buy tickets? You must use Ticketmaster. No exceptions.</p>
                     </div>
                )}

                {activeTab === 'REVIEWS' && (
                     <div className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">REVIEWS</h2>
                        <p className="text-gray-500">4.8 / 5.0 (Ticketmaster Verified)</p>
                     </div>
                )}
            </main>

            <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none px-4">
                <button className="bg-[#0055FF] pointer-events-auto text-white px-6 py-3.5 rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm md:text-base">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    Events Around the World
                </button>
            </div>
        </div>
    );
};

export default ToursView;