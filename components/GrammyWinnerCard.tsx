import React, { useState } from 'react';
import { GrammyWinnerCardData } from '../utils/grammyCardUtils';
import XIcon from './icons/XIcon';

interface GrammyWinnerCardProps {
  dataString?: string;
  cardData?: GrammyWinnerCardData;
  className?: string;
  isInteractive?: boolean;
}

const FALLBACK_ARTIST_IMAGE =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop';

const GramophoneIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gwHorn" x1="15%" y1="10%" x2="85%" y2="85%">
        <stop offset="0%" stopColor="#fff7c2" />
        <stop offset="30%" stopColor="#f8cc4e" />
        <stop offset="68%" stopColor="#c47e18" />
        <stop offset="100%" stopColor="#704207" />
      </linearGradient>
      <linearGradient id="gwHornDeep" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="60%" stopColor="#854d0e" />
        <stop offset="100%" stopColor="#2e1604" />
      </linearGradient>
      <linearGradient id="gwPlinth" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#27272a" />
        <stop offset="50%" stopColor="#18181b" />
        <stop offset="100%" stopColor="#09090b" />
      </linearGradient>
    </defs>

    {/* Pedestal / Base */}
    <polygon points="24,132 96,132 103,144 17,144" fill="url(#gwPlinth)" stroke="#52525b" strokeWidth="1" />
    <rect x="27" y="109" width="66" height="23" rx="2" fill="url(#gwPlinth)" stroke="#3f3f46" strokeWidth="1" />
    <rect x="35" y="117" width="50" height="7" rx="1" fill="url(#gwHorn)" opacity="0.92" />

    {/* Gold Turntable Deck */}
    <rect x="29" y="102" width="62" height="7" rx="1.5" fill="url(#gwHorn)" />
    <ellipse cx="60" cy="102" rx="28" ry="3.5" fill="#fde68a" opacity="0.55" />

    {/* Turntable Tonearm & Support Bracket */}
    <circle cx="72" cy="96" r="4.5" fill="url(#gwHorn)" />
    <path
      d="M36 102 C32 88 35 74 49 69 L57 73 C47 77 44 88 47 102 Z"
      fill="url(#gwHorn)"
    />

    {/* Iconic Flared Gramophone Horn */}
    <path
      d="M46 72 C51 60 57 48 61 36 C65 23 73 10 92 7 C100 18 103 36 94 52 C84 68 65 71 50 75 Z"
      fill="url(#gwHorn)"
    />
    <ellipse
      cx="87"
      cy="29"
      rx="13"
      ry="23"
      transform="rotate(22 87 29)"
      fill="url(#gwHornDeep)"
      stroke="#fef08a"
      strokeWidth="1.4"
    />
    <ellipse
      cx="83"
      cy="30"
      rx="6.5"
      ry="12"
      transform="rotate(22 83 30)"
      fill="#271303"
      opacity="0.72"
    />
  </svg>
);

export const GrammyWinnerCard: React.FC<GrammyWinnerCardProps> = ({
  dataString,
  cardData: propData,
  className = '',
  isInteractive = true,
}) => {
  const [showFullModal, setShowFullModal] = useState(false);

  let data: GrammyWinnerCardData | null = propData || null;
  if (!data && dataString) {
    try {
      const jsonStr = dataString.startsWith('grammyWinner:')
        ? dataString.replace('grammyWinner:', '')
        : dataString;
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Grammy winner card data', e);
    }
  }

  if (!data) return null;

  const { category, artistName, itemName, artistImage, coverArt } = data;
  const leftImage = artistImage || coverArt || FALLBACK_ARTIST_IMAGE;
  const backdropImage = coverArt || artistImage || FALLBACK_ARTIST_IMAGE;
  const isBna = category === 'Best New Artist';
  const showItemTitle =
    !isBna &&
    Boolean(itemName) &&
    itemName.trim().toLowerCase() !== artistName.trim().toLowerCase();

  return (
    <>
      <div
        onClick={(e) => {
          if (isInteractive) {
            e.stopPropagation();
            setShowFullModal(true);
          }
        }}
        className={`group relative mt-2 w-full aspect-[16/9] rounded-2xl overflow-hidden border border-zinc-700/80 bg-[#07151f] select-none shadow-2xl ${
          isInteractive ? 'cursor-pointer hover:border-emerald-300/60 transition-colors' : ''
        } ${className}`}
      >
        {/* Atmospheric Blurred Backdrop */}
        <img
          src={backdropImage}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2230]/90 via-[#091722]/85 to-[#23320d]/85" />
        {/* Warm golden-moss glow along lower edge matching Recording Academy backdrop */}
        <div className="absolute -bottom-6 left-[35%] w-[55%] h-[32%] rounded-full bg-[#a3c42a]/35 blur-2xl pointer-events-none" />
        <div className="absolute -top-6 -left-6 w-[40%] h-[40%] rounded-full bg-[#2dd4bf]/20 blur-2xl pointer-events-none" />

        {/* Geometric Mint/Aqua Offset Frame Bars */}
        <div className="absolute top-[7%] left-[8%] w-[18%] h-[30%] border-t-[7px] border-l-[7px] sm:border-t-[9px] sm:border-l-[9px] border-[#42f0c3] pointer-events-none opacity-95" />
        <div className="absolute top-[7%] right-[14%] w-[44%] h-[7px] sm:h-[9px] bg-[#42f0c3] pointer-events-none opacity-95" />
        <div className="absolute bottom-[7%] right-[6%] w-[24%] h-[32%] border-b-[7px] border-r-[7px] sm:border-b-[9px] sm:border-r-[9px] border-[#42f0c3] pointer-events-none opacity-95" />

        {/* Inner Two-Column Split Card */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-[8.5%]">
          <div className="w-full h-full flex bg-[#06131c] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Left Column: Artist Photo (or Cover Fallback) */}
            <div className="w-[46%] h-full relative bg-zinc-900 overflow-hidden flex-shrink-0">
              <img
                src={leftImage}
                alt={artistName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== coverArt && coverArt) {
                    target.src = coverArt;
                  } else if (target.src !== FALLBACK_ARTIST_IMAGE) {
                    target.src = FALLBACK_ARTIST_IMAGE;
                  }
                }}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {/* Subtle inner right edge vignette blending into dark card */}
              <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/35 to-transparent pointer-events-none" />
              {/* Small song/album cover inlay if distinct from artist photo */}
              {showItemTitle && coverArt && coverArt !== leftImage && (
                <div className="absolute bottom-2 left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden border border-white/25 shadow-lg bg-black/60">
                  <img
                    src={coverArt}
                    alt={itemName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Right Column: Gradient Header, Category, Artist, Title, Trophy */}
            <div className="w-[54%] h-full relative bg-gradient-to-br from-[#071824] via-[#06121b] to-[#040a10] p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden">
              {/* Subtle trophy ambient backlight */}
              <div className="absolute -bottom-6 -right-4 w-28 h-28 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

              {/* Top Title */}
              <div className="relative z-10 leading-[0.94] font-black tracking-tight text-[17px] sm:text-[26px] md:text-[28px] bg-gradient-to-r from-[#f3ff78] via-[#8af7b8] to-[#3be3c5] bg-clip-text text-transparent">
                <div>
                  Grammy
                  <span className="text-[8px] sm:text-[11px] align-top ml-0.5 text-[#a7f7bd]">
                    ®
                  </span>
                </div>
                <div>Winner</div>
              </div>

              {/* Center Metadata */}
              <div className="relative z-10 my-auto pr-8 sm:pr-14 py-1">
                <p className="text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-200/90 leading-tight line-clamp-2 mb-0.5">
                  {category}
                </p>
                <p className="text-[11px] sm:text-[15px] md:text-[17px] font-extrabold uppercase tracking-tight text-white leading-[1.05] line-clamp-2">
                  {artistName}
                </p>
                {showItemTitle && (
                  <p className="text-[8px] sm:text-[11px] font-medium text-zinc-200/95 mt-0.5 line-clamp-2 leading-tight">
                    "{itemName}"
                  </p>
                )}
              </div>

              {/* Bottom Recording Academy Wordmark */}
              <div className="relative z-10 flex items-end justify-between">
                <span className="text-[6px] sm:text-[7.5px] font-bold uppercase tracking-[0.14em] text-zinc-200/90">
                  RECORDING ACADEMY<span className="text-[5px] align-top">®</span>
                </span>
              </div>

              {/* Lower-right Gold Gramophone Trophy */}
              <GramophoneIllustration className="absolute -bottom-1 right-1 sm:right-2 w-12 h-16 sm:w-[74px] sm:h-[94px] pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Fullscreen Modal */}
      {showFullModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullModal(false);
          }}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowFullModal(false)}
              className="absolute -top-11 right-0 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full border border-zinc-700 transition-colors"
              aria-label="Close Grammy Winner graphic"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <GrammyWinnerCard cardData={data} isInteractive={false} className="mt-0" />
          </div>
        </div>
      )}
    </>
  );
};

export default GrammyWinnerCard;
