
import React, { useState, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import StarIcon from './icons/StarIcon';
import { RedMicProCodeModal } from './RedMicProCodeModal';

const RedMicProUnlockView: React.FC = () => {
    const { dispatch, activeArtistData } = useGame();
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    
    if (!activeArtistData) return null;

    const handlePatreonLogin = async () => {
        try {
            const origin = window.location.origin;
            const response = await fetch(`/api/patreon/url?origin=${encodeURIComponent(origin)}`);
            if (!response.ok) {
                return;
            }
            const { url } = await response.json();
            
            window.open(url, 'oauth_popup', 'width=600,height=700');
        } catch (e) {
             console.error('Error connecting to Patreon', e);
        }
    };

    const faqs = [
        {
            question: "Is Red Mic Pro available for new users?",
            answer: "No. Red Mic Pro is now discontinued for new members. Old members may still be able to use their code if their subscription is still active."
        },
        {
            question: "How do existing members redeem their code?",
            answer: "Click the 'Enter Pro Code' button to open the member verification pop-up modal and enter your active subscription code."
        },
        {
            question: "What are all the features of Red Mic Pro?",
            answer: "Red Mic Pro unlocks an infinite hype cap, limitless music video shoots, access to premium analytics to track your rise to stardom, removes all limits on playlist generation, includes the YouTube Music streaming platform, and provides a custom Red Mic Pro Dashboard with a song quality editor, custom feature builder, NPC user editor, and custom award show builder."
        },
        {
            question: "Why was Red Mic Pro discontinued?",
            answer: "New sign-ups have been permanently closed ahead of service transition. Existing active codes remain functional for active subscribers."
        }
    ];

    return (
        <>
            <div className="h-full w-full bg-zinc-900 overflow-y-auto">
                <header className="p-4 flex items-center justify-between sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 border-b border-zinc-700/50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Red Mic Pro</h1>
                    </div>
                    <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Discontinued for New Members
                    </span>
                </header>
                
                <main className="p-4 max-w-2xl mx-auto space-y-6">
                    {/* Red Notice Banner */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950 via-red-900/80 to-zinc-900 border-2 border-red-500/80 shadow-2xl text-white">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/60 flex items-center justify-center shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-black text-red-400 tracking-wide uppercase">
                                        Discontinued For New Members
                                    </h2>
                                    <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Notice
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-100 mt-1.5 font-medium leading-relaxed">
                                    Red Mic Pro is now discontinued for new members, old members may still be able to use their code if their subscription is still active.
                                </p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setIsCodeModalOpen(true)}
                                        className="text-xs sm:text-sm bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        <span>Enter Existing Member Code</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center py-4">
                        <StarIcon className="w-16 h-16 text-yellow-400 mx-auto" />
                        <h2 className="text-3xl font-black mt-2">Legacy Pro Portal</h2>
                        <p className="text-zinc-400 mt-2 max-w-md mx-auto text-sm">
                            New memberships are permanently discontinued. Existing members with an active code may unlock below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Separate Code Modal Trigger Card */}
                        <div className="bg-zinc-800/90 border border-zinc-700/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">Active Subscriber Code</h3>
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                                        Modal Verification
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-sm mt-1">
                                    Have an active Red Mic Pro subscription code? Open the separate modal to verify your code.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCodeModalOpen(true)}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-5 py-3 rounded-xl transition-all shadow-md text-sm shrink-0 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                <span>Enter Pro Code</span>
                            </button>
                        </div>

                        {/* Patreon status card */}
                        <div className="bg-zinc-800/60 p-5 rounded-2xl border border-zinc-700/50 flex flex-col gap-3 opacity-80">
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-zinc-300">Patreon Subscriptions</h3>
                                    <span className="text-xs text-red-400 font-semibold bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                                        Closed to New Members
                                    </span>
                                </div>
                                <p className="text-zinc-400 text-xs mt-1">
                                    New subscriber registration is closed. Existing active patrons can use their assigned access code in the modal above.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 space-y-3">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-zinc-200">
                            Frequently Asked Questions
                        </h3>
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-zinc-800/80 rounded-xl overflow-hidden transition-all duration-200 border border-zinc-700/50">
                                <button 
                                    className="w-full p-4 flex items-center justify-between font-medium text-left hover:bg-zinc-700/50 transition-colors text-sm" 
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                >
                                    <span className="text-zinc-100 font-semibold">{faq.question}</span>
                                    <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaq === index && (
                                    <div className="p-4 pt-1 text-zinc-400 bg-zinc-800/50 text-xs sm:text-sm leading-relaxed border-t border-zinc-700/30">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Separate Pop-up Modal for entering the code */}
            <RedMicProCodeModal 
                isOpen={isCodeModalOpen} 
                onClose={() => setIsCodeModalOpen(false)} 
            />
        </>
    );
};

export default RedMicProUnlockView;
