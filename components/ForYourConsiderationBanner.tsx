import React, { useState } from 'react';
import { FycBannerData } from '../types';
import GrammyAwardIcon from './icons/GrammyAwardIcon';
import AmaAwardIcon from './icons/AmaAwardIcon';
import OscarAwardIcon from './icons/OscarAwardIcon';
import BritAwardIcon from './icons/BritAwardIcon';
import GoldenGlobeAwardIcon from './icons/GoldenGlobeAwardIcon';
import XIcon from './icons/XIcon';

interface ForYourConsiderationBannerProps {
  dataString?: string;
  bannerData?: FycBannerData;
  className?: string;
  isInteractive?: boolean;
}

export const ForYourConsiderationBanner: React.FC<ForYourConsiderationBannerProps> = ({
  dataString,
  bannerData: propBannerData,
  className = '',
  isInteractive = true,
}) => {
  const [showFullModal, setShowFullModal] = useState(false);

  // Parse bannerData from dataString or props
  let data: FycBannerData | null = propBannerData || null;
  if (!data && dataString) {
    try {
      const jsonStr = dataString.startsWith('fyc:') ? dataString.replace('fyc:', '') : dataString;
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse FYC banner data', e);
    }
  }

  if (!data) {
    return (
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-400">
        Unable to load For Your Consideration banner.
      </div>
    );
  }

  const {
    awardShow,
    awardShowTitle,
    artistName,
    artistImage,
    mainProjectName,
    submissions = [],
    date,
  } = data;

  const fallbackImage =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop';
  const bgImage = artistImage || fallbackImage;

  // Format award show title
  const formattedAwardTitle =
    awardShowTitle ||
    (awardShow === 'GRAMMYs'
      ? 'FOR YOUR GRAMMY® CONSIDERATION'
      : awardShow === 'AMAs'
      ? 'FOR YOUR AMAs CONSIDERATION'
      : awardShow === 'BRITs'
      ? 'FOR YOUR BRIT AWARDS CONSIDERATION'
      : awardShow === 'OSCARS'
      ? 'FOR YOUR OSCAR® CONSIDERATION'
      : awardShow === 'Golden Globes'
      ? 'FOR YOUR GOLDEN GLOBES CONSIDERATION'
      : `FOR YOUR ${awardShow.toUpperCase()} CONSIDERATION`);

  // Award Show Icon
  const renderAwardIcon = () => {
    switch (awardShow) {
      case 'GRAMMYs':
        return <GrammyAwardIcon className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />;
      case 'AMAs':
        return <AmaAwardIcon className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.6)]" />;
      case 'BRITs':
        return <BritAwardIcon className="w-7 h-7 sm:w-8 sm:h-8 text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.6)]" />;
      case 'OSCARS':
        return <OscarAwardIcon className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.6)]" />;
      case 'Golden Globes':
        return <GoldenGlobeAwardIcon className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />;
      default:
        return <span className="text-xl sm:text-2xl drop-shadow">🏆</span>;
    }
  };

  // Color theme per award show
  const getAccentColor = () => {
    switch (awardShow) {
      case 'GRAMMYs':
        return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
      case 'AMAs':
        return 'text-amber-200 border-amber-300/40 bg-amber-300/10';
      case 'BRITs':
        return 'text-red-300 border-red-400/40 bg-red-400/10';
      case 'OSCARS':
        return 'text-yellow-300 border-yellow-400/40 bg-yellow-400/10';
      case 'Golden Globes':
        return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
      default:
        return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
    }
  };

  const accentBorder =
    awardShow === 'BRITs'
      ? 'border-red-500/40 shadow-red-950/40'
      : 'border-amber-400/40 shadow-amber-950/40';

  const goldText =
    awardShow === 'BRITs'
      ? 'text-red-200'
      : 'text-amber-200';

  return (
    <>
      <div
        onClick={() => isInteractive && setShowFullModal(true)}
        className={`group relative overflow-hidden rounded-2xl border ${accentBorder} bg-black text-white shadow-2xl transition-all duration-300 ${
          isInteractive ? 'cursor-pointer hover:border-amber-300/70 hover:shadow-amber-500/10' : ''
        } ${className}`}
      >
        {/* Background Image: Profile Picture Zoomed In */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={bgImage}
            alt={artistName}
            className="w-full h-full object-cover scale-150 transform transition-transform duration-700 ease-out group-hover:scale-[1.58] filter contrast-110 brightness-[0.78]"
          />
        </div>

        {/* Cinematic Vignette & Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 pointer-events-none" />

        {/* Elegant Trade Ad Inner Border Framing */}
        <div className="absolute inset-2.5 sm:inset-3 border border-amber-400/25 rounded-xl pointer-events-none" />
        <div className="absolute inset-3 sm:inset-3.5 border border-white/10 rounded-lg pointer-events-none" />

        {/* SIDE ARTIST NAME (as described: "on the side where it says 'GLITTER THEORY' should be your artist name") */}
        <div className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 flex items-center justify-center z-20 pointer-events-none">
          <div className="[writing-mode:vertical-rl] rotate-180 uppercase tracking-[0.42em] text-[10px] sm:text-xs md:text-sm font-black text-amber-200/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] select-none border-l-2 border-amber-400/60 pl-2 sm:pl-2.5 py-3 bg-black/30 backdrop-blur-[2px] rounded-r">
            {artistName}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-10 flex flex-col justify-between min-h-[460px] sm:min-h-[500px] p-5 sm:p-7 pl-10 sm:pl-14 pr-5 sm:pr-8">
          {/* Top Section: For Your Consideration Header */}
          <div className="flex flex-col items-center text-center pt-2 sm:pt-3">
            <div className="mb-2.5 filter drop-shadow">
              {renderAwardIcon()}
            </div>
            
            <h3 className="text-[11px] sm:text-xs md:text-sm tracking-[0.28em] font-serif uppercase font-bold text-amber-200/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2">
              {formattedAwardTitle}
            </h3>

            {/* Subtle Divider Rule */}
            <div className="flex items-center justify-center gap-2 mt-2 w-full max-w-[200px]">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-400/50 to-amber-400" />
              <div className="w-1.5 h-1.5 rotate-45 bg-amber-300 shadow-sm" />
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-amber-400/50 to-amber-400" />
            </div>

            {/* Main Project Name (e.g. "Wild Weekend" or Artist Name) */}
            <div className="mt-4 sm:mt-5 mb-2 px-2 max-w-full">
              <h1 className="font-serif font-black tracking-wider text-2xl sm:text-3xl md:text-4xl lg:text-[42px] uppercase text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] leading-tight line-clamp-2">
                {mainProjectName || artistName}
              </h1>
              {mainProjectName && mainProjectName !== artistName && (
                <p className="text-[11px] sm:text-xs tracking-[0.22em] uppercase text-zinc-300 font-semibold mt-1 drop-shadow">
                  AN ALBUM BY {artistName}
                </p>
              )}
            </div>
          </div>

          {/* Center Section: Everything You Submitted For */}
          <div className="my-auto py-3 px-1 sm:px-3 flex flex-col items-center">
            <div className="w-full max-w-md bg-black/45 backdrop-blur-[3px] border border-amber-400/20 rounded-xl p-3 sm:p-4 shadow-xl">
              <div className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-amber-300/80 font-bold text-center mb-2.5 border-b border-amber-400/20 pb-1.5">
                SUBMITTED CATEGORIES
              </div>

              <div className={`grid ${submissions.length > 4 ? 'grid-cols-2 gap-2 sm:gap-2.5' : 'grid-cols-1 gap-2.5'} text-center`}>
                {submissions.length > 0 ? (
                  submissions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-center py-1 px-1.5 rounded transition-colors group-hover:bg-white/[0.03]"
                    >
                      <span className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] leading-tight">
                        {sub.category}
                      </span>
                      {sub.itemName &&
                        sub.itemName !== mainProjectName &&
                        sub.itemName !== artistName && (
                          <span className="text-[10px] sm:text-[11px] text-amber-200/90 font-serif italic mt-0.5 drop-shadow line-clamp-1">
                            "{sub.itemName}"
                          </span>
                        )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-400 italic py-2">
                    Official voting consideration entry
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: Official Campaign Trade Footer */}
          <div className="flex flex-col items-center text-center pt-2 border-t border-amber-400/20">
            <p className="text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-zinc-300/90 font-medium drop-shadow">
              FOR VOTING ACADEMY CONSIDERATION ONLY
            </p>
            <p className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-amber-300/70 font-semibold mt-0.5">
              OFFICIAL {awardShow.toUpperCase()} FYC CAMPAIGN • {date ? date.year : new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Hover Click Hint */}
        {isInteractive && (
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-zinc-300 flex items-center gap-1 border border-zinc-700">
            <span>Click to view</span>
          </div>
        )}
      </div>

      {/* Expanded Modal View */}
      {showFullModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowFullModal(false)}
        >
          <div
            className="relative max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullModal(false)}
              className="absolute top-4 right-4 z-30 bg-black/70 hover:bg-black text-white p-2.5 rounded-full border border-zinc-700 transition-colors shadow-lg"
              title="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Full Banner Display */}
            <ForYourConsiderationBanner
              bannerData={data}
              isInteractive={false}
              className="shadow-[0_0_50px_rgba(251,191,36,0.15)]"
            />

            <div className="mt-3 flex items-center justify-between px-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Pop Base FYC Banner
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(
                    `For Your Consideration: ${artistName} - ${mainProjectName} for ${awardShow}`
                  );
                  alert('FYC Campaign details copied to clipboard!');
                }}
                className="hover:text-white underline"
              >
                Copy Campaign Text
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForYourConsiderationBanner;
