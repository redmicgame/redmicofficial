import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { Release, Song } from '../types';
import {
  getSongCertInfo,
  getAlbumCertInfo,
  calculateAlbumUnits,
  CertTierInfo,
} from '../utils/certificationUtils';

export const CertificationsManagementSection: React.FC = () => {
  const { gameState, dispatch, activeArtistData } = useGame();
  const [filterTab, setFilterTab] = useState<'all' | 'eligible' | 'songs' | 'albums'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justCertifiedId, setJustCertifiedId] = useState<string | null>(null);

  if (!activeArtistData) return null;

  const { songs, releases } = activeArtistData;

  const releasedSongs = useMemo(() => {
    return (songs || []).filter((s) => s.isReleased);
  }, [songs]);

  const releasedAlbums = useMemo(() => {
    return (releases || []).filter((r) => r.type !== 'Single');
  }, [releases]);

  // Combine items with cert info
  const items = useMemo(() => {
    const songItems = releasedSongs.map((song) => {
      const info = getSongCertInfo(song);
      return {
        id: song.id,
        isAlbum: false,
        title: song.title,
        coverArt: song.coverArt,
        typeLabel: song.isFeatureToNpc ? 'Feature Song' : 'Song',
        lastCert: song.lastCertification || null,
        info,
        rawUnits: song.streams || 0,
        unitLabel: 'Streams',
      };
    });

    const albumItems = releasedAlbums.map((album) => {
      const info = getAlbumCertInfo(album, songs);
      return {
        id: album.id,
        isAlbum: true,
        title: album.title,
        coverArt: album.coverArt,
        typeLabel: album.type,
        lastCert: album.lastCertification || null,
        info,
        rawUnits: info.currentUnits,
        unitLabel: 'Units',
      };
    });

    return [...songItems, ...albumItems];
  }, [releasedSongs, releasedAlbums, songs]);

  const eligibleItems = useMemo(() => {
    return items.filter((item) => item.info.isEligibleForNewCert);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filterTab === 'eligible') return item.info.isEligibleForNewCert;
        if (filterTab === 'songs') return !item.isAlbum;
        if (filterTab === 'albums') return item.isAlbum;
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        return item.title.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        // Put eligible items first, then by units/streams descending
        if (a.info.isEligibleForNewCert && !b.info.isEligibleForNewCert) return -1;
        if (!a.info.isEligibleForNewCert && b.info.isEligibleForNewCert) return 1;
        return b.rawUnits - a.rawUnits;
      });
  }, [items, filterTab, searchQuery]);

  // Total stats
  const totalCertifiedCount = items.filter((i) => i.lastCert).length;
  const totalGold = items.filter((i) => i.lastCert?.includes('Gold')).length;
  const totalPlatinum = items.filter((i) => i.lastCert?.includes('Platinum')).length;
  const totalDiamond = items.filter((i) => i.lastCert?.includes('Diamond')).length;

  const handleClaimCertification = (itemId: string, isAlbum: boolean, certName: string) => {
    dispatch({
      type: 'MANUAL_CLAIM_CERTIFICATION',
      payload: { itemId, isAlbum },
    });
    setJustCertifiedId(itemId);
    setTimeout(() => {
      setJustCertifiedId(null);
    }, 3000);
  };

  const getCertBadgeStyle = (certStr: string | null) => {
    if (!certStr) {
      return 'bg-zinc-800 text-zinc-500 border border-zinc-700/60';
    }
    if (certStr.includes('Diamond')) {
      return 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 shadow-sm shadow-cyan-950';
    }
    if (certStr.includes('Platinum')) {
      return 'bg-slate-800 text-slate-200 border border-slate-400/50 shadow-sm shadow-slate-900';
    }
    if (certStr.includes('Gold')) {
      return 'bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-sm shadow-amber-950';
    }
    return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
  };

  return (
    <div className="bg-zinc-800 p-4 rounded-xl space-y-4 border border-zinc-700/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-700 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🏆</span> Certifications
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50">
              Manual Mode
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review catalogue performance, track milestone progress, and manually submit songs & albums for RIAA certifications.
          </p>
        </div>

        {eligibleItems.length > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/60 px-3 py-1.5 rounded-lg border border-yellow-500/40 animate-pulse">
            <span className="text-sm">⭐️</span>
            <span className="text-xs font-bold text-yellow-300">
              {eligibleItems.length} {eligibleItems.length === 1 ? 'Title' : 'Titles'} Ready to Certify!
            </span>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/40">
          <p className="text-[11px] text-zinc-400 uppercase font-semibold">Total Certified</p>
          <p className="text-lg font-bold text-white mt-0.5">{totalCertifiedCount}</p>
        </div>
        <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/40">
          <p className="text-[11px] text-amber-400 uppercase font-semibold">Gold Plaques</p>
          <p className="text-lg font-bold text-amber-300 mt-0.5">{totalGold}</p>
        </div>
        <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/40">
          <p className="text-[11px] text-slate-300 uppercase font-semibold">Platinum</p>
          <p className="text-lg font-bold text-slate-200 mt-0.5">{totalPlatinum}</p>
        </div>
        <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/40">
          <p className="text-[11px] text-cyan-400 uppercase font-semibold">Diamond</p>
          <p className="text-lg font-bold text-cyan-300 mt-0.5">{totalDiamond}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
        <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-zinc-700/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTab === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('eligible')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              filterTab === 'eligible' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>Ready</span>
            {eligibleItems.length > 0 && (
              <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-bold">
                {eligibleItems.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('songs')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTab === 'songs' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Songs ({releasedSongs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('albums')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTab === 'albums' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Albums ({releasedAlbums.length})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs or albums..."
          className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 min-w-[200px]"
        />
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 bg-zinc-900/40 rounded-lg border border-zinc-800">
          <p className="text-sm text-zinc-400">No releases found matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isJustCertified = justCertifiedId === item.id;
            const { info } = item;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  info.isEligibleForNewCert
                    ? 'bg-gradient-to-r from-zinc-900 via-zinc-850 to-amber-950/20 border-yellow-500/40 shadow-sm'
                    : 'bg-zinc-900/80 border-zinc-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.coverArt}
                    alt={item.title}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-zinc-700"
                  />

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{item.title}</p>
                        <p className="text-[11px] text-zinc-400">
                          {item.typeLabel} • {formatNumber(item.rawUnits)} {item.unitLabel}
                        </p>
                      </div>

                      {/* Certification Badge */}
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-md flex-shrink-0 ${getCertBadgeStyle(
                          item.lastCert,
                        )}`}
                      >
                        {item.lastCert || 'Uncertified'}
                      </span>
                    </div>

                    {/* Progress to Next Certification */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">
                          Next:{' '}
                          <strong className="text-zinc-200">{info.nextCert}</strong> (
                          {formatNumber(info.nextTierTarget)} {item.unitLabel})
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {info.unitsNeeded > 0
                            ? `Needs ${formatNumber(info.unitsNeeded)} more`
                            : 'Target Reached!'}
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            info.isEligibleForNewCert
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max(3, info.progressPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[10px] text-zinc-500">
                        {info.progressPercent.toFixed(1)}% to {info.nextCert}
                      </div>

                      {info.isEligibleForNewCert ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleClaimCertification(
                              item.id,
                              item.isAlbum,
                              info.earnedCert || 'Certified',
                            )
                          }
                          className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-md hover:shadow-yellow-500/20 transition-all flex items-center gap-1.5 transform active:scale-95"
                        >
                          <span>🏆</span>
                          <span>Certify as {info.earnedCert}</span>
                        </button>
                      ) : isJustCertified ? (
                        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                          <span>✓</span> Plaque Claimed & Tweeted!
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">
                          {item.lastCert ? `Certified ${item.lastCert}` : 'Awaiting stream milestone'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
