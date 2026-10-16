import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { BusinessBrand, BusinessProduct } from '../types';
import XIcon from './icons/XIcon';
import TicketIcon from './icons/TicketIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SparklesIcon from './icons/FireIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';

interface ProductLaunchPartyModalProps {
  onClose: () => void;
  preselectedBusinessId?: string;
  preselectedProductId?: string;
}

const VENUES = [
  {
    name: 'Penthouse Skyline Lounge',
    city: 'New York City, NY',
    capacity: 450,
    cost: 45000,
    vibe: 'Intimate VIP rooftop with city skyline views and celebrity guestlist.',
  },
  {
    name: 'The Glass Pavilion & Gallery',
    city: 'Los Angeles, CA',
    capacity: 1200,
    cost: 95000,
    vibe: 'Sleek architectural gallery with runway stage, cocktails, and press wall.',
  },
  {
    name: 'Palais Vivienne Ballroom',
    city: 'Paris, France',
    capacity: 2800,
    cost: 210000,
    vibe: 'Historic European luxury ballroom with gilt moldings and international elite.',
  },
  {
    name: 'Metropolitan Event Arena',
    city: 'London, UK',
    capacity: 6500,
    cost: 380000,
    vibe: 'Massive concert-scale venue with custom brand installations and global live-stream.',
  },
];

export const ProductLaunchPartyModal: React.FC<ProductLaunchPartyModalProps> = ({
  onClose,
  preselectedBusinessId,
  preselectedProductId,
}) => {
  const { gameState, dispatch } = useGame();
  const activeArtistId = gameState.activeArtistId;
  const artistData = activeArtistId ? gameState.artistsData[activeArtistId] : null;

  const businesses: BusinessBrand[] = artistData?.businesses || [];
  const releasedSongs = useMemo(() => {
    return (artistData?.songs || []).filter((s) => s.isReleased && !s.isVaulted);
  }, [artistData?.songs]);

  // All available products across approved businesses
  const allAvailableProducts = useMemo(() => {
    const list: Array<{ business: BusinessBrand; product: BusinessProduct }> = [];
    businesses.forEach((b) => {
      if (b.llcStatus === 'approved' && b.products) {
        b.products.forEach((p) => {
          list.push({ business: b, product: p });
        });
      }
    });
    return list;
  }, [businesses]);

  // Preselection defaults
  const initialSelection = useMemo(() => {
    if (preselectedBusinessId && preselectedProductId) {
      const found = allAvailableProducts.find(
        (item) => item.business.id === preselectedBusinessId && item.product.id === preselectedProductId
      );
      if (found) return `${found.business.id}:${found.product.id}`;
    }
    if (allAvailableProducts.length > 0) {
      return `${allAvailableProducts[0].business.id}:${allAvailableProducts[0].product.id}`;
    }
    return '';
  }, [allAvailableProducts, preselectedBusinessId, preselectedProductId]);

  const [selectedItemKey, setSelectedItemKey] = useState<string>(initialSelection);
  const [selectedVenueIndex, setSelectedVenueIndex] = useState<number>(0);
  const [ticketPrice, setTicketPrice] = useState<number>(120);
  const [selectedSongId, setSelectedSongId] = useState<string>(releasedSongs[0]?.id || '');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [recapData, setRecapData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    if (!selectedItemKey) return null;
    const [bId, pId] = selectedItemKey.split(':');
    return allAvailableProducts.find((i) => i.business.id === bId && i.product.id === pId) || null;
  }, [selectedItemKey, allAvailableProducts]);

  const venue = VENUES[selectedVenueIndex];

  // Projected finances
  const totalFunds = (selectedItem?.business.treasuryFunds || 0) + (artistData?.money || 0);
  const canAffordVenue = totalFunds >= venue.cost;

  const selloutRate = 0.88 + (Math.min(100, artistData?.popularity || 50) / 100) * 0.12;
  const projectedTickets = Math.floor(venue.capacity * selloutRate);
  const projectedTicketRev = projectedTickets * ticketPrice;
  const projectedUnitsSold = selectedItem
    ? Math.min(selectedItem.product.currentStock, Math.floor(projectedTickets * 0.75))
    : 0;
  const projectedProductRev = selectedItem ? projectedUnitsSold * selectedItem.product.price : 0;
  const projectedTotalRev = projectedTicketRev + projectedProductRev;
  const projectedNetProfit = projectedTotalRev - venue.cost;

  const handleHostParty = () => {
    if (!selectedItem) {
      setError('Please select a newly launched product to link to this party.');
      return;
    }
    if (!canAffordVenue) {
      setError(`Insufficient funds to book ${venue.name} ($${venue.cost.toLocaleString()}).`);
      return;
    }

    dispatch({
      type: 'HOST_PRODUCT_LAUNCH_PARTY',
      payload: {
        businessId: selectedItem.business.id,
        productId: selectedItem.product.id,
        venue: {
          name: venue.name,
          city: venue.city,
          capacity: venue.capacity,
          cost: venue.cost,
        },
        ticketPrice,
        performedSongId: selectedSongId || undefined,
      },
    });

    const song = releasedSongs.find((s) => s.id === selectedSongId);
    setRecapData({
      productName: selectedItem.product.name,
      businessName: selectedItem.business.name,
      venueName: venue.name,
      city: venue.city,
      ticketsSold: projectedTickets,
      unitsSold: projectedUnitsSold,
      totalRev: projectedTotalRev,
      netProfit: projectedNetProfit,
      performedSongTitle: song?.title,
    });
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative max-w-2xl w-full max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-7 text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Product Launch Party</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  Ticketmaster Exclusive
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Host an exclusive launch event with press, VIP fans, and a live performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {isSuccess && recapData ? (
          /* SUCCESS RECAP */
          <div className="space-y-5 text-center py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Launch Party a Resounding Success!</h3>
              <p className="text-xs text-zinc-400">
                {recapData.venueName} in {recapData.city}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  VIP Tickets Sold
                </span>
                <span className="text-white font-black text-base">
                  {recapData.ticketsSold.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  Products Sold Tonight
                </span>
                <span className="text-amber-400 font-black text-base">
                  {recapData.unitsSold.toLocaleString()} units
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  Total Event Revenue
                </span>
                <span className="text-emerald-400 font-black text-base">
                  ${recapData.totalRev.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  Net Profit
                </span>
                <span className="text-emerald-300 font-black text-base">
                  ${recapData.netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            {recapData.performedSongTitle && (
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-center gap-2 text-xs text-blue-200">
                <MicrophoneIcon className="w-4 h-4 text-blue-400" />
                <span>
                  Surprise Live Performance:{' '}
                  <strong className="text-white">‘{recapData.performedSongTitle}’</strong> went viral on
                  social media!
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* SETUP FORM */
          <div className="space-y-5">
            {allAvailableProducts.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center space-y-3">
                <ShoppingBagIcon className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="font-bold text-sm text-white">No Products Available</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  You must have an approved business and launch at least one product before you can host a Ticketmaster launch party!
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* 1. Link a Product */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <ShoppingBagIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Link Newly Launched Product (Required)</span>
                  </label>
                  <select
                    value={selectedItemKey}
                    onChange={(e) => setSelectedItemKey(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400 font-semibold cursor-pointer"
                  >
                    {allAvailableProducts.map(({ business, product }) => (
                      <option key={`${business.id}:${product.id}`} value={`${business.id}:${product.id}`}>
                        {product.name} ({business.name} - ${product.price} - Stock: {product.currentStock.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {selectedItem && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                        {selectedItem.product.imageUrl ? (
                          <img
                            src={selectedItem.product.imageUrl}
                            alt={selectedItem.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-400">
                            {selectedItem.product.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-white block">{selectedItem.product.name}</span>
                        <span className="text-zinc-400">
                          Retail: ${selectedItem.product.price} &bull; Current Stock: {selectedItem.product.currentStock.toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Venue Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Select Event Venue & City
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {VENUES.map((v, idx) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVenueIndex(idx)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                          selectedVenueIndex === idx
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500 shadow-md'
                            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-xs text-white">{v.name}</h4>
                          <span className="text-[10px] font-black text-amber-400">
                            ${v.cost.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{v.city}</p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-800/80">
                          <span>Capacity: {v.capacity.toLocaleString()}</span>
                          {selectedVenueIndex === idx && (
                            <span className="text-blue-400 font-bold">Selected ✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Live Song Performance */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <MicrophoneIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Perform a Song Live at the Party (Optional)</span>
                  </label>
                  <select
                    value={selectedSongId}
                    onChange={(e) => setSelectedSongId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                  >
                    <option value="">No Live Performance (VIP Networking Only)</option>
                    {releasedSongs.map((s) => (
                      <option key={s.id} value={s.id}>
                        🎤 Perform &lsquo;{s.title}&rsquo; ({s.streams ? `${(s.streams / 1000000).toFixed(1)}M streams` : 'Released'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-400 italic">
                    Performing a song will boost song streaming momentum, attract music press, and drive viral social media shares!
                  </p>
                </div>

                {/* 4. Ticket Price */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      VIP Ticket Price
                    </label>
                    <span className="text-sm font-black text-blue-400">${ticketPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={500}
                    step={10}
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(Number(e.target.value))}
                    className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>$40 (Accessible)</span>
                    <span>$250</span>
                    <span>$500 (Ultra Luxury VIP)</span>
                  </div>
                </div>

                {/* Projections Card */}
                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Venue Cost:</span>
                    <strong className="text-rose-400">-${venue.cost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Est. Ticket Sales:</span>
                    <strong className="text-white">
                      {projectedTickets.toLocaleString()} tickets (${projectedTicketRev.toLocaleString()})
                    </strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Est. Products Sold at Event:</span>
                    <strong className="text-amber-400">
                      {projectedUnitsSold.toLocaleString()} units (${projectedProductRev.toLocaleString()})
                    </strong>
                  </div>
                  <div className="flex justify-between text-zinc-300 pt-2 border-t border-zinc-800 font-bold">
                    <span>Projected Net Profit:</span>
                    <strong className="text-emerald-400 text-sm">
                      ${projectedNetProfit.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleHostParty}
                    disabled={!canAffordVenue || !selectedItem}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${
                      canAffordVenue && selectedItem
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    }`}
                  >
                    Host Launch Party (${venue.cost.toLocaleString()})
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductLaunchPartyModal;
