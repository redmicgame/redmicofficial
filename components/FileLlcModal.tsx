import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import XIcon from './icons/XIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BanknotesIcon from './icons/BanknotesIcon';

interface FileLlcModalProps {
  onClose: () => void;
}

const MIN_FUNDS = 1500000; // $1.5M
const MAX_FUNDS = 10000000; // $10M

export const FileLlcModal: React.FC<FileLlcModalProps> = ({ onClose }) => {
  const { gameState, dispatch } = useGame();
  const activeArtistId = gameState.activeArtistId;
  const artistData = activeArtistId ? gameState.artistsData[activeArtistId] : null;

  const [brandName, setBrandName] = useState('');
  const [initialFunds, setInitialFunds] = useState<number>(2500000);
  const [error, setError] = useState<string | null>(null);

  const artistMoney = artistData?.money || 0;
  const canAfford = artistMoney >= initialFunds;

  const quickPresets = [
    { label: '$1.5M (Min)', value: 1500000 },
    { label: '$2.5M', value: 2500000 },
    { label: '$5.0M', value: 5000000 },
    { label: '$7.5M', value: 7500000 },
    { label: '$10M (Max)', value: 10000000 },
  ];

  const handleFileLlc = () => {
    if (!brandName.trim()) {
      setError('Please enter a name for your brand / LLC.');
      return;
    }
    if (initialFunds < MIN_FUNDS || initialFunds > MAX_FUNDS) {
      setError(`Initial funds must be between $${(MIN_FUNDS / 1000000).toFixed(1)}M and $${(MAX_FUNDS / 1000000).toFixed(1)}M.`);
      return;
    }
    if (!canAfford) {
      setError(`Insufficient funds. You have $${artistMoney.toLocaleString()} but need $${initialFunds.toLocaleString()}.`);
      return;
    }

    dispatch({
      type: 'FILE_BUSINESS_LLC',
      payload: {
        name: brandName.trim(),
        initialFunds,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative max-w-xl w-full max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-7 text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BriefcaseIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                File for LLC & Form Brand
              </h2>
              <p className="text-xs text-zinc-400">
                Register a new corporate enterprise and allocate initial capital
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Your Personal Available Funds
          </span>
          <span className={`text-base font-black ${artistMoney >= MIN_FUNDS ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${artistMoney.toLocaleString()}
          </span>
        </div>

        {/* Brand Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Brand / Enterprise Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Rare, Fenty, Rhode, Haus, Aura"
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-semibold"
              maxLength={40}
            />
          </div>
          {brandName.trim() && (
            <p className="text-[11px] text-zinc-400">
              Official Legal Registration:{' '}
              <span className="text-amber-400 font-bold">{brandName.trim()} LLC</span>
            </p>
          )}
        </div>

        {/* Initial Funds Allocation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Initial Capital Investment
            </label>
            <span className="text-lg font-black text-amber-400">
              ${(initialFunds / 1000000).toFixed(2)}M{' '}
              <span className="text-xs text-zinc-400 font-normal">
                (${initialFunds.toLocaleString()})
              </span>
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={MIN_FUNDS}
            max={MAX_FUNDS}
            step={250000}
            value={initialFunds}
            onChange={(e) => {
              setInitialFunds(Number(e.target.value));
              setError(null);
            }}
            className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />

          <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
            <span>Min: $1.5M</span>
            <span>$5.0M</span>
            <span>Max: $10.0M</span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {quickPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setInitialFunds(preset.value);
                  setError(null);
                }}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all text-center ${
                  initialFunds === preset.value
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legal Notice & Leak Warning */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
            <span>⚠️</span>
            <span>Statutory 2-Week LLC Review Period</span>
          </div>
          <p className="text-zinc-300">
            Filing for an LLC takes <strong className="text-white">two in-game weeks</strong> to be stamped and approved by state regulators.
          </p>
          <p className="text-zinc-400">
            Because trademark and corporate registry databases are public records, <strong className="text-amber-300">your business information might leak</strong> to entertainment blogs, Pop Base, TMZ, and fans during these two weeks. Leaks generate initial brand hype!
          </p>
          <p className="text-zinc-400">
            Once your LLC is approved, you will be able to upload your business logo, select your industry (Perfume, Beauty, Hair Care, Shoes, etc.), and launch your first 1-3 flagship products with custom pricing and stock.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFileLlc}
            disabled={!canAfford}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
          >
            <BanknotesIcon className="w-4 h-4" />
            <span>Invest & File for LLC (${(initialFunds / 1000000).toFixed(2)}M)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileLlcModal;
