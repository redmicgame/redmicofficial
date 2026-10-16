import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BusinessBrand } from '../types';
import FileLlcModal from './FileLlcModal';
import SetupBusinessBrandModal from './SetupBusinessBrandModal';
import BusinessDetailModal from './BusinessDetailModal';
import ProductLaunchPartyModal from './ProductLaunchPartyModal';
import ChevronRightIcon from './icons/ChevronRightIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import PlusIcon from './icons/PlusIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import ShieldCheckIcon from './icons/CheckCircleIcon';
import FireIcon from './icons/FireIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import TicketIcon from './icons/TicketIcon';

export const BusinessTab: React.FC = () => {
  const { gameState, dispatch } = useGame();
  const activeArtistId = gameState.activeArtistId;
  const artistData = activeArtistId ? gameState.artistsData[activeArtistId] : null;

  const [isFileLlcOpen, setIsFileLlcOpen] = useState(false);
  const [selectedBrandForSetup, setSelectedBrandForSetup] = useState<BusinessBrand | null>(null);
  const [selectedBrandForDetail, setSelectedBrandForDetail] = useState<BusinessBrand | null>(null);
  const [launchPartyBusiness, setLaunchPartyBusiness] = useState<BusinessBrand | null>(null);

  const businesses: BusinessBrand[] = artistData?.businesses || [];
  const pendingBusinesses = businesses.filter((b) => b.llcStatus === 'pending');
  const approvedBusinesses = businesses.filter((b) => b.llcStatus === 'approved');

  const artistMoney = artistData?.money || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-red-500 tracking-tight flex items-center gap-2">
            <span>Business & Empire</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Form corporate LLC entities, launch consumer brands, and manage your commercial enterprise.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {approvedBusinesses.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'businessStore' })}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <ShoppingBagIcon className="w-4 h-4 text-amber-400" />
              <span>🛍️ Brand Storefront</span>
            </button>
          )}

          {/* Start Business Button */}
          <button
            onClick={() => setIsFileLlcOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>File for LLC / Start Brand</span>
          </button>
        </div>
      </div>

      {/* Founder Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Personal Liquid Wealth
            </span>
            <span className="text-xl font-black text-emerald-400">
              ${artistMoney.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BanknotesIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Commercial Brands
            </span>
            <span className="text-xl font-black text-white">
              {businesses.length} Total{' '}
              <span className="text-xs text-zinc-500 font-normal">
                ({approvedBusinesses.length} active, {pendingBusinesses.length} pending)
              </span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BriefcaseIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Total Enterprise Revenue
            </span>
            <span className="text-xl font-black text-emerald-400">
              ${businesses
                .reduce((acc, b) => acc + (b.totalRevenue || 0), 0)
                .toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FireIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PENDING LLC FILINGS */}
      {pendingBusinesses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Pending LLC Registrations ({pendingBusinesses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingBusinesses.map((pending) => {
              const weeksDone = 2 - pending.llcWeeksRemaining;
              const percent = Math.min(100, Math.max(10, (weeksDone / 2) * 100));

              return (
                <div
                  key={pending.id}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-amber-500/30 shadow-lg space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-white">
                          {pending.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          LLC Pending
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                        {pending.legalName} &bull; Capital: ${(pending.initialFunds / 1000000).toFixed(2)}M
                      </p>
                    </div>

                    {pending.hasLeaked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <span>⚠️</span> Leaked to Press
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                        🔒 Confidential
                      </span>
                    )}
                  </div>

                  {/* Progress info */}
                  <div className="space-y-1.5 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Filing Timeline:</span>
                      <strong className="text-white">
                        {pending.llcWeeksRemaining === 1 ? 'Week 1 of 2 Complete' : 'Week 0 of 2 (Submitted)'}
                      </strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 italic">
                      {pending.hasLeaked
                        ? 'Pop Base & media have leaked your trademark filing! Public anticipation is rising.'
                        : 'Articles of Organization submitted. Review completes in 2 game weeks.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* APPROVED BRANDS */}
      {approvedBusinesses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Active Commercial Brands & Ventures ({approvedBusinesses.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedBusinesses.map((b) => {
              const hasLaunchedProducts = b.products && b.products.length > 0;

              if (!hasLaunchedProducts) {
                // Approved but needs setup & first 1-3 products
                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-amber-400/60 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 text-lg font-black">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-lg text-white">{b.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              LLC Approved
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Initial Capital: ${(b.initialFunds / 1000000).toFixed(2)}M in treasury
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                      🎉 Your corporate entity is registered! Upload your official business logo, pick what business it is (Perfume, Beauty, Hair Care, Shoes, etc.), and launch your first 1-3 flagship products.
                    </p>

                    <button
                      onClick={() => setSelectedBrandForSetup(b)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      Setup Logo & Launch Products &rarr;
                    </button>
                  </div>
                );
              }

              // Fully launched brand
              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all shadow-lg space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {b.logoUrl ? (
                            <img
                              src={b.logoUrl}
                              alt={b.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-amber-400 font-black">
                              {b.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-lg text-white">{b.name}</h3>
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-xs text-zinc-400">
                            {b.categoryDisplayName} &bull; {b.products.length} Products
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                          Treasury
                        </span>
                        <span className="text-sm font-black text-amber-400">
                          ${b.treasuryFunds.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800/80 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">
                          Revenue
                        </span>
                        <strong className="text-emerald-400 font-bold">
                          ${b.totalRevenue.toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">
                          Net Profit
                        </span>
                        <strong className="text-emerald-300 font-bold">
                          ${b.totalNetProfit.toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">
                          Units Sold
                        </span>
                        <strong className="text-white font-bold">
                          {b.products
                            .reduce((acc, p) => acc + p.totalUnitsSold, 0)
                            .toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'businessStore' })}
                      className="py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingBagIcon className="w-3.5 h-3.5" />
                      <span>Storefront</span>
                    </button>
                    <button
                      onClick={() => setSelectedBrandForDetail(b)}
                      className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span>PR & Restock</span>
                    </button>
                    <button
                      onClick={() => setLaunchPartyBusiness(b)}
                      className="py-2 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <TicketIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Launch Party</span>
                    </button>
                    <button
                      onClick={() => setSelectedBrandForSetup(b)}
                      className="py-2 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                      title="Edit Brand Logo or Industry"
                    >
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE SHOWCASE */}
      {businesses.length === 0 && (
        <div className="p-8 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl">
            👑
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-white">
              Build Your Consumer Brand Empire
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Branch out beyond music into high-margin consumer industries:
              Perfume & Fragrance, Beauty Brands, Hair Care, Designer Shoes, Fashion lines, and Skincare.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-xs text-left text-zinc-300 space-y-1.5">
            <p>
              &bull; <strong className="text-white">Initial Capital:</strong> Minimum $1.5M, Maximum $10M.
            </p>
            <p>
              &bull; <strong className="text-white">LLC Process:</strong> 2-week statutory review during which corporate trademark info might leak to Pop Base & TMZ.
            </p>
            <p>
              &bull; <strong className="text-white">Launch:</strong> Upload official logo, pick industry, and launch the first 1-3 products with detailed pricing, stock, and live estimated demand.
            </p>
          </div>

          <button
            onClick={() => setIsFileLlcOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all"
          >
            File for LLC & Form Brand &rarr;
          </button>
        </div>
      )}

      {/* EXISTING MANAGEMENT & SECURITY LINKS */}
      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Artist Operations & Team
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'management' })}
            className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-left hover:bg-zinc-800/80 transition-all flex justify-between items-center group cursor-pointer"
          >
            <div>
              <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                Artist Management
              </h3>
              <p className="text-xs text-zinc-400">
                Hire top-tier managers and booking agents.
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'security' })}
            className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl text-left hover:bg-zinc-800/80 transition-all flex justify-between items-center group cursor-pointer"
          >
            <div>
              <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                Executive Security Team
              </h3>
              <p className="text-xs text-zinc-400">
                Protect unreleased music and master files from leaks.
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* MODALS */}
      {isFileLlcOpen && (
        <FileLlcModal onClose={() => setIsFileLlcOpen(false)} />
      )}

      {selectedBrandForSetup && (
        <SetupBusinessBrandModal
          business={selectedBrandForSetup}
          onClose={() => setSelectedBrandForSetup(null)}
        />
      )}

      {selectedBrandForDetail && (
        <BusinessDetailModal
          business={selectedBrandForDetail}
          onClose={() => setSelectedBrandForDetail(null)}
        />
      )}

      {launchPartyBusiness && (
        <ProductLaunchPartyModal
          preselectedBusinessId={launchPartyBusiness.id}
          onClose={() => setLaunchPartyBusiness(null)}
        />
      )}
    </div>
  );
};

export default BusinessTab;
