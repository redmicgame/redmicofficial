

import React, { useState } from 'react';
import LoadingScreen from './LoadingScreen';
import { useGame } from '../context/GameContext';
import HomeTab from './HomeTab';
import AppsTab from './AppsTab';
import MiscTab from './MiscTab';
import BusinessTab from './BusinessTab';
import BottomNav from './BottomNav';

const GameUI: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { activeTab } = gameState;

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'Home':
                return <HomeTab />;
            case 'Apps':
                return <AppsTab />;
            case 'Charts':
                return <HomeTab />;
            case 'Business':
                return <BusinessTab />;
            case 'Misc':
                return <MiscTab />;
            default:
                return <HomeTab />;
        }
    };

    const [loadingData, setLoadingData] = useState<{ active: boolean, progress: number, text: string } | null>(null);

    const handleProgressWeek = () => {
        const stateStr = JSON.stringify(gameState);
        const sizeMB = stateStr.length / (1024 * 1024);
        
        if (sizeMB > 85 && !gameState.disableLoadingScreens) {
            setLoadingData({ active: true, progress: 0, text: 'Preparing to advance week...' });
            
            const extraMB = sizeMB - 85;
            const delayTime = Math.max(1500, Math.floor(extraMB * 200)); 
            
            let currentProgress = 0;
            const steps = 10;
            const stepTime = delayTime / steps;
            
            const stepInterval = setInterval(() => {
                currentProgress += 10;
                setLoadingData({ 
                    active: true, 
                    progress: currentProgress, 
                    text: `Simulating world events... (${sizeMB.toFixed(1)}MB save)` 
                });
                
                if (currentProgress >= 100) {
                    clearInterval(stepInterval);
                    dispatch({ type: 'PROGRESS_WEEK' });
                    setTimeout(() => {
                        setLoadingData(null);
                    }, 100);
                }
            }, stepTime);
        } else {
            dispatch({ type: 'PROGRESS_WEEK' });
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-zinc-900 text-white relative">
            {loadingData && loadingData.active && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Processing</h2>
                    <p className="text-zinc-400 mb-6">{loadingData.text}</p>
                    <div className="w-full max-w-md bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-red-600 h-full transition-all duration-300 ease-out" style={{ width: `${loadingData.progress}%` }}></div>
                    </div>
                </div>
            )}
            <main className="flex-1 overflow-y-auto pb-24 -webkit-overflow-scrolling-touch">
                {renderActiveTab()}
            </main>
            <button 
              onClick={handleProgressWeek}
              className="absolute z-20 bottom-24 right-4 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-all transform hover:scale-105 shadow-red-600/30">
              <span className="font-bold text-sm text-center leading-tight">
                  {gameState.timeMode === 'daily' ? 'Next Day' : 'Next Week'}
              </span>
            </button>
            <BottomNav />
        </div>
    );
};

export default GameUI;
