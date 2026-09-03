

import React, { useState, useMemo, useRef } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { MERCH_PRODUCT_LIMIT } from '../constants';
import type { MerchProduct, Release, GameDate } from '../types';
import { CalendarDatePicker, formatFullDateString } from './CalendarDatePicker';
import MenuIcon from './icons/MenuIcon';
import SearchIcon from './icons/SearchIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
// FIX: Imported ArrowLeftIcon to resolve the "Cannot find name" error.
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Copy, Layers, Sparkles, Check } from 'lucide-react';

const AddMerchModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const [releaseId, setReleaseId] = useState('');
    const [variantName, setVariantName] = useState('');
    const [merchType, setMerchType] = useState<'Vinyl' | 'CD' | 'Ringtone' | 'Cassette' | 'T-Shirt' | 'Hoodie' | 'Tour Exclusive Merch'>('Vinyl');
    const [price, setPrice] = useState(39.98);
    const [stockQty, setStockQty] = useState(1000);
    const [image, setImage] = useState<string | null>(null);
    const [color, setColor] = useState('#000000');
    const [regionExclusive, setRegionExclusive] = useState<'Global' | 'US' | 'UK'>('Global');
    const [selectedBonusSongIds, setSelectedBonusSongIds] = useState<string[]>([]);
    const [error, setError] = useState('');

    const minShipmentDate = useMemo(() => {
        let week = gameState.date.week + 8;
        let year = gameState.date.year;
        while (week > 52) {
            week -= 52;
            year += 1;
        }
        return { year, week, day: gameState.date.day || 5 };
    }, [gameState.date]);

    const [shipmentDate, setShipmentDate] = useState<GameDate>(minShipmentDate);
    const [showShipmentCalendar, setShowShipmentCalendar] = useState(false);

    const isRingtoneEra = gameState.date.year >= 2006 && gameState.date.year <= 2010;

    const unitCost = merchType === 'Vinyl' ? 12 : merchType === 'CD' ? 3 : merchType === 'Cassette' ? 4 : merchType === 'T-Shirt' ? 15 : merchType === 'Hoodie' ? 25 : merchType === 'Tour Exclusive Merch' ? 20 : 0;
    const totalCost = merchType === 'Ringtone' ? 0 : stockQty * unitCost;

    if (!activeArtistData || !activeArtist) return null;
    const { merch, releases, money, songs } = activeArtistData;

    const unreleasedSongs = useMemo(() => {
        return (songs || []).filter(s => !s.isReleased && !s.isVaulted);
    }, [songs]);

    const availableReleases = useMemo(() => {
        const released = releases.filter(r => r.type === 'Album' || r.type === 'EP' || r.type === 'Album (Deluxe)' || r.type === 'Compilation' || r.type === 'Live Album' || r.type === 'Single');
        const scheduled = activeArtistData.labelSubmissions
            .filter(s => s.release.type === 'Album' || s.release.type === 'EP' || s.release.type === 'Album (Deluxe)' || s.release.type === 'Compilation' || s.release.type === 'Live Album' || s.release.type === 'Single')
            .map(s => s.release);
        return [...released, ...scheduled];
    }, [releases, activeArtistData.labelSubmissions]);
    
    const selectedRelease = useMemo(() => {
        return availableReleases.find(r => r.id === releaseId);
    }, [availableReleases, releaseId]);
    
    const itemsForSelectedRelease = useMemo(() => {
        return merch.filter(m => m.releaseId === releaseId).length;
    }, [merch, releaseId]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleMerchTypeChange = (type: 'Vinyl' | 'CD' | 'Ringtone' | 'Cassette' | 'T-Shirt' | 'Hoodie' | 'Tour Exclusive Merch') => {
        setMerchType(type);
        if (type === 'Ringtone') {
            setPrice(2.99);
            setStockQty(9999999);
        } else {
            setPrice(type === 'Vinyl' ? 39.98 : type === 'CD' ? 12.98 : type === 'Cassette' ? 14.98 : type === 'T-Shirt' ? 35.00 : type === 'Hoodie' ? 65.00 : type === 'Tour Exclusive Merch' ? 50.00 : 12.98);
        }
    };

    const handleAddMerch = () => {
        setError('');
        if (!selectedRelease) { setError('Please select a release.'); return; }
        if (!image && !selectedRelease.coverArt) { setError('Please provide an image.'); return; }
        if (merch.length >= MERCH_PRODUCT_LIMIT) { setError(`Your store is at capacity (${MERCH_PRODUCT_LIMIT} products).`); return; }
        if (money < totalCost) { setError('Not enough money to stock this inventory.'); return; }
        if (stockQty < 1 && merchType !== 'Ringtone') { setError('Must stock at least 1 unit.'); return; }
        if (price < unitCost) { setError('Price cannot be lower than unit cost.'); return; }

        let finalShipmentDate = shipmentDate;
        const currentTotalWeeks = gameState.date.year * 52 + gameState.date.week;
        const shipmentTotalWeeks = shipmentDate.year * 52 + shipmentDate.week;
        if (shipmentTotalWeeks - currentTotalWeeks < 8) {
            finalShipmentDate = minShipmentDate;
        }

        const isScheduled = !releases.some(r => r.id === selectedRelease.id);

        const selectedBonusSongs = unreleasedSongs.filter(s => selectedBonusSongIds.includes(s.id));
        const bonusSongTitles = selectedBonusSongs.map(s => s.title);

        const newItem: MerchProduct = {
            id: crypto.randomUUID(),
            releaseId: selectedRelease.id,
            name: `${selectedRelease.title}${variantName ? ` (${variantName})` : (merchType === 'Ringtone' ? ' (Ringtone)' : '')}`,
            type: merchType,
            price,
            color: merchType === 'Vinyl' ? color : undefined,
            stock: merchType === 'Ringtone' ? 9999999 : stockQty, // Infinite stock basically
            unitsSold: 0,
            image: image || selectedRelease.coverArt,
            artistId: activeArtist.id,
            isPreorder: isScheduled, // Automatically set based on release status
            shipmentDate: finalShipmentDate,
            regionExclusive,
            bonusSongIds: selectedBonusSongIds.length > 0 ? selectedBonusSongIds : undefined,
            bonusSongTitles: bonusSongTitles.length > 0 ? bonusSongTitles : undefined,
        };
        dispatch({ type: 'ADD_MERCH', payload: { item: newItem, cost: totalCost } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-md rounded-lg p-6 space-y-4 my-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold">Add New {merchType === 'Ringtone' ? 'Digital Item' : 'Product'}</h2>
                <select value={releaseId} onChange={e => { setReleaseId(e.target.value); setImage(availableReleases.find(r=>r.id===e.target.value)?.coverArt || null); }} className="w-full bg-zinc-700 p-2 rounded">
                    <option value="">Select a Release...</option>
                    {availableReleases.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                
                <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)} placeholder="Variant Name (e.g., Apple Red Vinyl)" className="w-full bg-zinc-700 p-2 rounded" />
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <button type="button" onClick={() => handleMerchTypeChange('Vinyl')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'Vinyl' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>Vinyl</button>
                    <button type="button" onClick={() => handleMerchTypeChange('CD')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'CD' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>CD</button>
                    <button type="button" onClick={() => handleMerchTypeChange('Cassette')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'Cassette' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>Cassette</button>
                    <button type="button" onClick={() => handleMerchTypeChange('T-Shirt')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'T-Shirt' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>T-Shirt</button>
                    <button type="button" onClick={() => handleMerchTypeChange('Hoodie')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'Hoodie' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>Hoodie</button>
                    <button type="button" onClick={() => handleMerchTypeChange('Tour Exclusive Merch')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'Tour Exclusive Merch' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>Tour Merch</button>
                    {isRingtoneEra && (
                        <button type="button" onClick={() => handleMerchTypeChange('Ringtone')} className={`py-2 text-xs font-bold rounded-lg transition-colors ${merchType === 'Ringtone' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-650'}`}>Ringtone</button>
                    )}
                </div>

                {/* Shipment Date Picker (min 8 weeks in advance) */}
                <div className="space-y-1.5 bg-zinc-900/80 p-3 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-white flex items-center gap-1">
                            <span>📦 Estimated Shipment Date</span>
                        </label>
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/50">
                            Min. 8 Weeks in Advance
                        </span>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => setShowShipmentCalendar(prev => !prev)}
                        className="w-full text-left bg-zinc-800 hover:bg-zinc-750 border border-zinc-600 rounded-lg p-2.5 flex items-center justify-between text-xs transition-colors"
                    >
                        <div>
                            <p className="text-white font-bold">{formatFullDateString(shipmentDate)}</p>
                            <p className="text-zinc-400 text-[11px]">Game Week {shipmentDate.week}, {shipmentDate.year}</p>
                        </div>
                        <span className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded">
                            {showShipmentCalendar ? 'Close Calendar' : 'Change Date'}
                        </span>
                    </button>

                    {showShipmentCalendar && (
                        <div className="mt-2">
                            <CalendarDatePicker
                                currentDate={gameState.date}
                                minDate={minShipmentDate}
                                selectedDate={shipmentDate}
                                onSelectDate={(newDate) => {
                                    setShipmentDate(newDate);
                                    setShowShipmentCalendar(false);
                                }}
                                title="Select Shipment Date (Min. 8 Weeks)"
                                onClose={() => setShowShipmentCalendar(false)}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Territory Exclusivity</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setRegionExclusive('Global')} className={`py-1.5 text-xs font-bold rounded ${regionExclusive === 'Global' ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>Global</button>
                        <button type="button" onClick={() => setRegionExclusive('US')} className={`py-1.5 text-xs font-bold rounded ${regionExclusive === 'US' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>🇺🇸 US Excl.</button>
                        <button type="button" onClick={() => setRegionExclusive('UK')} className={`py-1.5 text-xs font-bold rounded ${regionExclusive === 'UK' ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>🇬🇧 UK Excl.</button>
                    </div>
                </div>

                {(merchType === 'Vinyl' || merchType === 'CD' || merchType === 'Cassette') && (
                    <div className="space-y-2 bg-zinc-900/80 p-3 rounded-lg border border-zinc-700">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                                <span>⭐️ Physical Bonus Tracks</span>
                                <span className="text-[10px] text-zinc-400 font-normal">(Max 3)</span>
                            </label>
                            <span className="text-[10px] text-green-400 font-semibold bg-green-950/80 px-1.5 py-0.5 rounded border border-green-800/50">+25% Sales Boost</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Select unreleased songs as bonus tracks for this physical release.</p>
                        {unreleasedSongs.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                {unreleasedSongs.map(song => {
                                    const isChecked = selectedBonusSongIds.includes(song.id);
                                    return (
                                        <label key={song.id} className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs border ${isChecked ? 'bg-yellow-500/20 border-yellow-500/60 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700/50'}`}>
                                            <span className="font-medium truncate mr-2">{song.title}</span>
                                            <input
                                                type="checkbox"
                                                
                                                checked={isChecked}
                                                onChange={() => {
                                                    if (isChecked) {
                                                        setSelectedBonusSongIds(prev => prev.filter(id => id !== song.id));
                                                    } else if (selectedBonusSongIds.length < 3) {
                                                        setSelectedBonusSongIds(prev => [...prev, song.id]);
                                                    }
                                                }}
                                                disabled={!isChecked && selectedBonusSongIds.length >= 3}
                                                className="rounded border-zinc-600 accent-yellow-500"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500 italic">No unreleased songs available. Write/record new songs first.</p>
                        )}
                    </div>
                )}

                {merchType === 'Vinyl' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-400">Vinyl Color</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 bg-transparent border-0 rounded cursor-pointer p-0" />
                            <span className="text-sm text-zinc-300">{color}</span>
                        </div>
                    </div>
                )}

                {merchType !== 'Ringtone' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-400">Initial Stock Quantity <span className="float-right text-[10px] bg-zinc-700 px-1 rounded block mt-0.5">Unit Cost: ${unitCost}</span></label>
                        <input type="number" min="0" value={stockQty} onChange={e => setStockQty(Number(e.target.value))} placeholder="Stock Quantity" className="w-full bg-zinc-700 p-2 rounded" />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Retail Price <span className="text-[10px] text-zinc-500">(Recommended: ${merchType === 'Vinyl' ? '39.98' : merchType === 'CD' ? '12.98' : '2.99'})</span></label>
                    <input type="number" step="0.01" min={unitCost} value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="Price" className="w-full bg-zinc-700 p-2 rounded" />
                </div>

                <label className="block text-sm text-zinc-400">Product Image (defaults to cover art)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"/>
                
                <div className="bg-black/30 p-3 rounded-lg border border-black text-sm">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-zinc-400">Total Manufacturing Cost:</span>
                        <span className="font-bold text-red-400">${formatNumber(totalCost)}</span>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                    type="button"
                    onClick={handleAddMerch}
                    disabled={!selectedRelease || money < totalCost || merch.length >= MERCH_PRODUCT_LIMIT}
                    className="w-full bg-red-600 hover:bg-red-700 p-2.5 rounded-lg font-bold disabled:bg-zinc-600 transition-colors shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                    Add Product
                </button>
            </div>
        </div>
    );
};

const RestockModal: React.FC<{
    item: MerchProduct;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const { dispatch, activeArtistData } = useGame();
    const unitCost = item.type === 'Vinyl' ? 12 : item.type === 'CD' ? 3 : item.type === 'Cassette' ? 4 : item.type === 'T-Shirt' ? 15 : item.type === 'Hoodie' ? 25 : item.type === 'Tour Exclusive Merch' ? 20 : 3;
    const money = activeArtistData?.money || 0;
    const maxAffordable = Math.max(0, Math.floor(money / unitCost));
    const [amount, setAmount] = useState(() => Math.min(1000, Math.max(100, maxAffordable)));
    const totalCost = amount * unitCost;

    const handleRestock = () => {
        if (amount <= 0) return;
        if (money < totalCost) return;
        dispatch({ type: 'RESTOCK_MERCH', payload: { id: item.id, amount, cost: totalCost } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-md rounded-xl p-6 space-y-4 my-auto border border-zinc-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">Restock Inventory</h2>
                        <p className="text-xs text-zinc-400">{item.name} ({item.type})</p>
                    </div>
                    <span className="text-xs bg-zinc-700 px-2.5 py-1 rounded-full font-semibold">
                        Current: {formatNumber(item.stock)}
                    </span>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                        <span>Units to Order</span>
                        <span>Unit Cost: ${unitCost}</span>
                    </div>
                    <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-zinc-700 border border-zinc-600 p-2.5 rounded-lg font-bold text-white text-base focus:outline-none focus:border-indigo-500"
                    />
                    
                    {/* Quick quantity presets */}
                    <div className="flex gap-1.5 pt-1">
                        {[500, 1000, 5000, 10000].map(qty => (
                            <button
                                key={qty}
                                type="button"
                                onClick={() => setAmount(qty)}
                                className={`flex-1 py-1 text-xs font-semibold rounded border transition-colors ${
                                    amount === qty
                                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                                        : 'bg-zinc-700/80 hover:bg-zinc-700 text-zinc-300 border-zinc-600'
                                }`}
                            >
                                +{formatNumber(qty)}
                            </button>
                        ))}
                        {maxAffordable > 0 && (
                            <button
                                type="button"
                                onClick={() => setAmount(maxAffordable)}
                                className="px-2 py-1 text-[11px] font-bold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 transition-colors"
                                title={`Set to maximum units you can afford (${formatNumber(maxAffordable)})`}
                            >
                                Max ({formatNumber(maxAffordable)})
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-black/40 p-3 rounded-lg border border-zinc-700/60 space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-400">
                        <span>Total Manufacturing Cost:</span>
                        <span className="font-bold text-amber-400 text-sm">${formatNumber(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                        <span>Available Funds:</span>
                        <span className={money >= totalCost ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            ${formatNumber(Math.floor(money))}
                        </span>
                    </div>
                </div>

                {money < totalCost && (
                    <div className="text-red-400 text-xs bg-red-950/50 p-2.5 rounded-lg border border-red-800/50 flex justify-between items-center">
                        <span>Insufficient funds for {formatNumber(amount)} units.</span>
                        {maxAffordable > 0 && (
                            <button
                                type="button"
                                onClick={() => setAmount(maxAffordable)}
                                className="underline font-bold text-white hover:text-red-200 ml-2 text-xs"
                            >
                                Fit ({formatNumber(maxAffordable)})
                            </button>
                        )}
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleRestock}
                        disabled={amount <= 0 || money < totalCost}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors shadow-md disabled:cursor-not-allowed cursor-pointer"
                    >
                        Pay & Restock
                    </button>
                </div>
            </div>
        </div>
    );
};

const VINYL_COLOR_PRESETS = [
    { name: 'Onyx Black', hex: '#1A1A1A' },
    { name: 'Ruby Red', hex: '#DC2626' },
    { name: 'Cobalt Blue', hex: '#2563EB' },
    { name: 'Emerald Green', hex: '#16A34A' },
    { name: 'Royal Purple', hex: '#9333EA' },
    { name: 'Sunset Orange', hex: '#EA580C' },
    { name: 'Gold / Yellow', hex: '#EAB308' },
    { name: 'Hot Pink', hex: '#EC4899' },
    { name: 'Snow White', hex: '#F8FAFC' },
    { name: 'Clear Aqua', hex: '#06B6D4' },
];

const CD_EDITION_PRESETS = [
    'Deluxe Edition',
    "Collector's Edition",
    'Special Edition',
    'Signed CD Edition',
    'Target Exclusive',
    'Tour Edition',
    'Alternate Cover',
];

const DuplicateMerchModal: React.FC<{
    item: MerchProduct;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    if (!activeArtistData || !activeArtist) return null;
    const { merch, releases, money, songs } = activeArtistData;

    const availableReleases = useMemo(() => {
        const released = releases.filter(r => r.type === 'Album' || r.type === 'EP' || r.type === 'Album (Deluxe)' || r.type === 'Compilation' || r.type === 'Live Album' || r.type === 'Single');
        const scheduled = (activeArtistData.labelSubmissions || [])
            .filter(s => s.release.type === 'Album' || s.release.type === 'EP' || s.release.type === 'Album (Deluxe)' || s.release.type === 'Compilation' || s.release.type === 'Live Album' || s.release.type === 'Single')
            .map(s => s.release);
        return [...released, ...scheduled];
    }, [releases, activeArtistData.labelSubmissions]);

    const release = availableReleases.find(r => r.id === item.releaseId);
    const releaseTitle = release?.title || item.name.replace(/\s*\([^)]*\)$/, '');
    const itemsForThisRelease = merch.filter(m => m.releaseId === item.releaseId).length;
    const maxAllowedStore = Math.max(0, MERCH_PRODUCT_LIMIT - merch.length);
    const maxBatchCount = Math.min(maxAllowedStore, 5);

    const minShipmentDate = useMemo(() => {
        let week = gameState.date.week + 8;
        let year = gameState.date.year;
        while (week > 52) {
            week -= 52;
            year += 1;
        }
        return { year, week, day: gameState.date.day || 5 };
    }, [gameState.date]);

    const initialShipmentDate = useMemo(() => {
        if (item.shipmentDate) {
            const currentTotalWeeks = gameState.date.year * 52 + gameState.date.week;
            const itemTotalWeeks = item.shipmentDate.year * 52 + item.shipmentDate.week;
            if (itemTotalWeeks - currentTotalWeeks >= 8) {
                return item.shipmentDate;
            }
        }
        return minShipmentDate;
    }, [item.shipmentDate, gameState.date, minShipmentDate]);

    const getInitialVariantName = () => {
        const match = item.name.match(/\((.*?)\)/);
        if (match && match[1]) {
            const cur = match[1];
            const numMatch = cur.match(/(.*?)(\d+)$/);
            if (numMatch) {
                return `${numMatch[1]}${parseInt(numMatch[2], 10) + 1}`;
            }
            return `${cur} (Alt)`;
        }
        if (item.type === 'Vinyl') return 'Ruby Red Vinyl';
        if (item.type === 'CD') return 'Deluxe Edition CD';
        return 'Edition 2';
    };

    const [mode, setMode] = useState<'single' | 'batch'>(maxBatchCount >= 2 ? 'single' : 'single');
    const [variantName, setVariantName] = useState(getInitialVariantName());
    const [color, setColor] = useState(item.color || '#DC2626');
    const [price, setPrice] = useState(item.price);
    const [stockQty, setStockQty] = useState(item.stock > 0 && item.type !== 'Ringtone' ? Math.min(item.stock, 5000) : 1000);
    const [regionExclusive, setRegionExclusive] = useState<'Global' | 'US' | 'UK'>(item.regionExclusive || 'Global');
    const [selectedBonusSongIds, setSelectedBonusSongIds] = useState<string[]>(item.bonusSongIds || []);
    const [image, setImage] = useState<string | null>(item.image || null);
    const [shipmentDate, setShipmentDate] = useState<GameDate>(initialShipmentDate);
    const [showShipmentCalendar, setShowShipmentCalendar] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Batch setup
    const [batchCount, setBatchCount] = useState(Math.min(Math.max(2, maxBatchCount), 3));
    const [batchList, setBatchList] = useState<Array<{ name: string; color?: string }>>(() => {
        if (item.type === 'Vinyl') {
            const unused = VINYL_COLOR_PRESETS.filter(p => p.hex.toLowerCase() !== (item.color || '').toLowerCase());
            return Array.from({ length: 5 }).map((_, idx) => {
                const p = unused[idx % unused.length] || VINYL_COLOR_PRESETS[idx % VINYL_COLOR_PRESETS.length];
                return {
                    name: `${p.name} Vinyl`,
                    color: p.hex,
                };
            });
        } else {
            return CD_EDITION_PRESETS.slice(0, 5).map(name => ({
                name,
                color: undefined,
            }));
        }
    });

    const unreleasedSongs = useMemo(() => {
        return (songs || []).filter(s => !s.isReleased && !s.isVaulted);
    }, [songs]);

    const unitCost = item.type === 'Vinyl' ? 12 : item.type === 'CD' ? 3 : item.type === 'Cassette' ? 4 : item.type === 'T-Shirt' ? 15 : item.type === 'Hoodie' ? 25 : item.type === 'Tour Exclusive Merch' ? 20 : 0;
    const singleTotalCost = item.type === 'Ringtone' ? 0 : stockQty * unitCost;
    const batchTotalCost = item.type === 'Ringtone' ? 0 : batchCount * stockQty * unitCost;

    const handleColorPresetClick = (p: { name: string; hex: string }) => {
        setColor(p.hex);
        if (!variantName || variantName.toLowerCase().includes('vinyl')) {
            setVariantName(`${p.name} Vinyl`);
        }
    };

    const handleBatchItemNameChange = (index: number, newName: string) => {
        setBatchList(prev => prev.map((it, i) => i === index ? { ...it, name: newName } : it));
    };

    const handleBatchItemColorChange = (index: number, newColor: string) => {
        setBatchList(prev => prev.map((it, i) => i === index ? { ...it, color: newColor } : it));
    };

    const validateSingle = () => {
        setError('');
        if (merch.length >= MERCH_PRODUCT_LIMIT) {
            setError(`Your store has reached the maximum ${MERCH_PRODUCT_LIMIT} products.`);
            return false;
        }
        if (money < singleTotalCost) {
            setError(`Not enough money. Required: $${formatNumber(singleTotalCost)}, available: $${formatNumber(Math.floor(money))}.`);
            return false;
        }
        if (stockQty < 1 && item.type !== 'Ringtone') {
            setError('Must stock at least 1 unit.');
            return false;
        }
        if (price < unitCost) {
            setError(`Price cannot be lower than manufacturing unit cost ($${unitCost}).`);
            return false;
        }

        const currentTotalWeeks = gameState.date.year * 52 + gameState.date.week;
        const shipmentTotalWeeks = shipmentDate.year * 52 + shipmentDate.week;
        if (shipmentTotalWeeks - currentTotalWeeks < 8) {
            setShipmentDate(minShipmentDate);
        }
        return true;
    };

    const handleCreateSingle = (closeOnDone = true) => {
        if (!validateSingle()) return;

        const isScheduled = release ? !releases.some(r => r.id === release.id) : false;
        const selectedBonusSongs = unreleasedSongs.filter(s => selectedBonusSongIds.includes(s.id));
        const bonusSongTitles = selectedBonusSongs.map(s => s.title);

        const newItem: MerchProduct = {
            id: crypto.randomUUID(),
            releaseId: item.releaseId,
            name: `${releaseTitle}${variantName ? ` (${variantName})` : ''}`,
            type: item.type,
            price,
            color: item.type === 'Vinyl' ? color : undefined,
            stock: item.type === 'Ringtone' ? 9999999 : stockQty,
            unitsSold: 0,
            image: image || item.image || release?.coverArt || '',
            artistId: activeArtist.id,
            isPreorder: isScheduled,
            shipmentDate,
            regionExclusive,
            bonusSongIds: selectedBonusSongIds.length > 0 ? selectedBonusSongIds : undefined,
            bonusSongTitles: bonusSongTitles.length > 0 ? bonusSongTitles : undefined,
        };

        dispatch({ type: 'ADD_MERCH', payload: { item: newItem, cost: singleTotalCost } });

        if (closeOnDone) {
            onClose();
        } else {
            setSuccessMessage(`✓ Created "${newItem.name}"!`);
            setTimeout(() => setSuccessMessage(''), 3000);
            // Advance to next variant
            if (item.type === 'Vinyl') {
                const currentIdx = VINYL_COLOR_PRESETS.findIndex(p => p.hex.toLowerCase() === color.toLowerCase());
                const nextPreset = VINYL_COLOR_PRESETS[(currentIdx + 1) % VINYL_COLOR_PRESETS.length];
                setColor(nextPreset.hex);
                setVariantName(`${nextPreset.name} Vinyl`);
            } else {
                setVariantName(prev => {
                    const numMatch = prev.match(/(.*?)(\d+)$/);
                    if (numMatch) return `${numMatch[1]}${parseInt(numMatch[2], 10) + 1}`;
                    return `${prev} (Variant 2)`;
                });
            }
        }
    };

    const handleCreateBatch = () => {
        setError('');
        if (merch.length + batchCount > MERCH_PRODUCT_LIMIT) {
            setError(`Cannot add ${batchCount} products: store limit is ${MERCH_PRODUCT_LIMIT} total.`);
            return;
        }
        if (money < batchTotalCost) {
            setError(`Not enough money. Required: $${formatNumber(batchTotalCost)}, available: $${formatNumber(Math.floor(money))}.`);
            return;
        }
        if (price < unitCost) {
            setError(`Price cannot be lower than unit cost ($${unitCost}).`);
            return;
        }

        const isScheduled = release ? !releases.some(r => r.id === release.id) : false;
        const selectedBonusSongs = unreleasedSongs.filter(s => selectedBonusSongIds.includes(s.id));
        const bonusSongTitles = selectedBonusSongs.map(s => s.title);

        const itemsToCreate: MerchProduct[] = batchList.slice(0, batchCount).map(batchVariant => ({
            id: crypto.randomUUID(),
            releaseId: item.releaseId,
            name: `${releaseTitle} (${batchVariant.name})`,
            type: item.type,
            price,
            color: item.type === 'Vinyl' ? (batchVariant.color || '#DC2626') : undefined,
            stock: stockQty,
            unitsSold: 0,
            image: image || item.image || release?.coverArt || '',
            artistId: activeArtist.id,
            isPreorder: isScheduled,
            shipmentDate,
            regionExclusive,
            bonusSongIds: selectedBonusSongIds.length > 0 ? selectedBonusSongIds : undefined,
            bonusSongTitles: bonusSongTitles.length > 0 ? bonusSongTitles : undefined,
        }));

        dispatch({
            type: 'BATCH_ADD_MERCH',
            payload: {
                items: itemsToCreate,
                totalCost: batchTotalCost,
            },
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 text-white w-full max-w-lg rounded-2xl p-6 space-y-4 my-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-indigo-300">
                            <Copy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                Duplicate {item.type}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-medium">
                                    {merch.length}/{MERCH_PRODUCT_LIMIT} Store Capacity
                                </span>
                            </h2>
                            <p className="text-xs text-zinc-400 truncate max-w-xs font-semibold">
                                From: <span className="text-zinc-200">{item.name}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded cursor-pointer">✕</button>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                    <button
                        type="button"
                        onClick={() => setMode('single')}
                        className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            mode === 'single'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <span>Single Variant</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('batch')}
                        disabled={maxBatchCount < 2}
                        className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            mode === 'batch'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : maxBatchCount < 2
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title={maxBatchCount < 2 ? 'Store capacity reached' : 'Quickly generate multiple copies'}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Make Multiple ({maxBatchCount} Available)</span>
                    </button>
                </div>

                {successMessage && (
                    <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 p-2.5 rounded-xl text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-950/80 border border-red-700/60 text-red-200 p-2.5 rounded-xl text-xs">
                        ⚠️ {error}
                    </div>
                )}

                {/* MODE 1: SINGLE DUPLICATE */}
                {mode === 'single' && (
                    <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Variant Name */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Variant / Edition Name:
                            </label>
                            <input
                                type="text"
                                value={variantName}
                                onChange={e => setVariantName(e.target.value)}
                                placeholder="e.g. Cobalt Blue Vinyl, Collector's Edition CD"
                                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                            />
                            <p className="text-[11px] text-zinc-400">
                                Full Title Preview: <span className="font-bold text-white">{releaseTitle} ({variantName || 'Variant'})</span>
                            </p>
                        </div>

                        {/* Vinyl Color Palette (Only for Vinyl) */}
                        {item.type === 'Vinyl' && (
                            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                        Vinyl Color Palette:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                                            style={{ backgroundColor: color }}
                                        />
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={e => setColor(e.target.value)}
                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                            title="Custom color picker"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-2 pt-1">
                                    {VINYL_COLOR_PRESETS.map(p => (
                                        <button
                                            key={p.hex}
                                            type="button"
                                            onClick={() => handleColorPresetClick(p)}
                                            className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                                color.toLowerCase() === p.hex.toLowerCase()
                                                    ? 'border-indigo-400 bg-indigo-950/60 shadow-md font-bold'
                                                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                                                style={{ backgroundColor: p.hex }}
                                            />
                                            <span className="truncate">{p.name.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CD Edition Presets (Only for CD) */}
                        {item.type === 'CD' && (
                            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                    Quick Edition Presets:
                                </label>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {CD_EDITION_PRESETS.map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setVariantName(preset)}
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                                variantName === preset
                                                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock Quantity & Retail Price */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                    Stock Units:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={stockQty}
                                    onChange={e => setStockQty(Math.max(1, Number(e.target.value)))}
                                    className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex gap-1 pt-0.5">
                                    {[500, 1000, 2500, 5000].map(qty => (
                                        <button
                                            key={qty}
                                            type="button"
                                            onClick={() => setStockQty(qty)}
                                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold"
                                        >
                                            {qty >= 1000 ? `${qty / 1000}k` : qty}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                    Retail Price ($):
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={unitCost}
                                    value={price}
                                    onChange={e => setPrice(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500"
                                />
                                <p className="text-[10px] text-zinc-500 pt-0.5 font-medium">
                                    Mfg Cost: ${unitCost}/unit | Margin: ${(price - unitCost).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Shipment Date Picker */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Scheduled Shipment Date:
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowShipmentCalendar(true)}
                                className="w-full text-left bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm font-semibold flex items-center justify-between hover:bg-zinc-750 transition-colors"
                            >
                                <span>📦 {formatFullDateString(shipmentDate)} (Week {shipmentDate.week}, {shipmentDate.year})</span>
                                <span className="text-xs text-indigo-400 font-bold">Change Date</span>
                            </button>
                            <p className="text-[10px] text-zinc-400">
                                Minimum 8-week physical manufacturing lead time enforced.
                            </p>
                        </div>

                        {showShipmentCalendar && (
                            <CalendarDatePicker
                                currentDate={gameState.date}
                                selectedDate={shipmentDate}
                                onSelectDate={(date) => {
                                    setShipmentDate(date);
                                    setShowShipmentCalendar(false);
                                }}
                                onClose={() => setShowShipmentCalendar(false)}
                                title="Select Merch Shipment Date (Min 8 Weeks)"
                                minDate={minShipmentDate}
                            />
                        )}

                        {/* Exclusivity */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Regional Exclusivity:
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Global', 'US', 'UK'] as const).map(reg => (
                                    <button
                                        key={reg}
                                        type="button"
                                        onClick={() => setRegionExclusive(reg)}
                                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                                            regionExclusive === reg
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                                        }`}
                                    >
                                        {reg === 'Global' ? 'Global' : `${reg} Exclusive`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bonus Songs (if any unreleased songs available) */}
                        {unreleasedSongs.length > 0 && (
                            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                        Exclusive Bonus Tracks (Max 3):
                                    </label>
                                    <span className="text-[11px] text-indigo-400 font-semibold">
                                        {selectedBonusSongIds.length}/3 Selected
                                    </span>
                                </div>
                                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                                    {unreleasedSongs.map(song => {
                                        const isSelected = selectedBonusSongIds.includes(song.id);
                                        return (
                                            <label
                                                key={song.id}
                                                className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-indigo-950/60 border border-indigo-700/50 text-white' : 'hover:bg-zinc-900 text-zinc-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            if (selectedBonusSongIds.length < 3) {
                                                                setSelectedBonusSongIds(prev => [...prev, song.id]);
                                                            }
                                                        } else {
                                                            setSelectedBonusSongIds(prev => prev.filter(id => id !== song.id));
                                                        }
                                                    }}
                                                    className="rounded border-zinc-700"
                                                />
                                                <span className="truncate">{song.title}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Cost & Balance Summary */}
                        <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700/60 space-y-1 text-xs">
                            <div className="flex justify-between text-zinc-400">
                                <span>Units Manufactured:</span>
                                <span className="font-semibold text-white">{formatNumber(stockQty)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Unit Cost:</span>
                                <span className="font-semibold text-white">${unitCost}.00</span>
                            </div>
                            <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-zinc-700/50">
                                <span>Total Inventory Cost:</span>
                                <span>${formatNumber(singleTotalCost)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 text-[11px]">
                                <span>Artist Balance:</span>
                                <span className={money >= singleTotalCost ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    ${formatNumber(Math.floor(money))}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => handleCreateSingle(false)}
                                disabled={money < singleTotalCost || merch.length >= MERCH_PRODUCT_LIMIT}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-indigo-700/40 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                <span>Duplicate & Make Another</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCreateSingle(true)}
                                disabled={money < singleTotalCost || merch.length >= MERCH_PRODUCT_LIMIT}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Confirm Duplicate
                            </button>
                        </div>
                    </div>
                )}

                {/* MODE 2: BATCH DUPLICATE (MAKE MULTIPLE) */}
                {mode === 'batch' && (
                    <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="bg-indigo-950/40 border border-indigo-800/40 p-3 rounded-xl text-xs text-indigo-200">
                            ⚡️ <strong>Batch Duplicate:</strong> Quickly manufacture multiple distinct {item.type} variants in a single click with contrasting colorways or editions.
                        </div>

                        {/* Number of Copies */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Number of Variants to Create:
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[2, 3, 4, 5].map(cnt => {
                                    const isDisabled = cnt > maxBatchCount;
                                    return (
                                        <button
                                            key={cnt}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => setBatchCount(cnt)}
                                            className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                                batchCount === cnt
                                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg font-black'
                                                    : isDisabled
                                                    ? 'bg-zinc-900/50 text-zinc-600 border-zinc-800 cursor-not-allowed'
                                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                                            }`}
                                        >
                                            {cnt} Copies
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Batch Variants Preview List */}
                        <div className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Customize Variants ({batchCount}):
                            </label>
                            <div className="space-y-2">
                                {batchList.slice(0, batchCount).map((v, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                                        {item.type === 'Vinyl' && (
                                            <div className="relative flex items-center">
                                                <input
                                                    type="color"
                                                    value={v.color || '#DC2626'}
                                                    onChange={e => handleBatchItemColorChange(idx, e.target.value)}
                                                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                                                    title="Change vinyl color"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={v.name}
                                                onChange={e => handleBatchItemNameChange(idx, e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-750 px-2 py-1.5 rounded text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                                                placeholder={`Variant #${idx + 1}`}
                                            />
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-bold shrink-0">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stock & Price Per Variant */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                    Stock per Variant:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={stockQty}
                                    onChange={e => setStockQty(Math.max(1, Number(e.target.value)))}
                                    className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded-xl text-xs font-semibold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                    Retail Price per Unit ($):
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={unitCost}
                                    value={price}
                                    onChange={e => setPrice(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded-xl text-xs font-semibold"
                                />
                            </div>
                        </div>

                        {/* Cost calculation */}
                        <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700/60 space-y-1 text-xs">
                            <div className="flex justify-between text-zinc-400">
                                <span>Variants Created:</span>
                                <span className="font-semibold text-white">{batchCount} Variants</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Total Units Combined:</span>
                                <span className="font-semibold text-white">{formatNumber(batchCount * stockQty)} Units</span>
                            </div>
                            <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-zinc-700/50">
                                <span>Combined Mfg Cost:</span>
                                <span>${formatNumber(batchTotalCost)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 text-[11px]">
                                <span>Artist Balance:</span>
                                <span className={money >= batchTotalCost ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    ${formatNumber(Math.floor(money))}
                                </span>
                            </div>
                        </div>

                        {/* Batch Action Button */}
                        <button
                            type="button"
                            onClick={handleCreateBatch}
                            disabled={money < batchTotalCost || maxBatchCount < 2}
                            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3 rounded-xl text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Create All {batchCount} Variants (${formatNumber(batchTotalCost)})</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const EditPriceModal: React.FC<{
    item: MerchProduct;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const { dispatch } = useGame();
    const [price, setPrice] = useState(item.price);
    const unitCost = item.type === 'Vinyl' ? 12 : item.type === 'CD' ? 3 : item.type === 'Cassette' ? 4 : item.type === 'T-Shirt' ? 15 : item.type === 'Hoodie' ? 25 : item.type === 'Tour Exclusive Merch' ? 20 : 2.99;
    const recommendedPrice = item.type === 'Vinyl' ? 39.98 : item.type === 'CD' ? 12.98 : item.type === 'Cassette' ? 14.98 : item.type === 'T-Shirt' ? 35.00 : item.type === 'Hoodie' ? 65.00 : item.type === 'Tour Exclusive Merch' ? 50.00 : 2.99;

    const handleSave = () => {
        if (price < unitCost) return;
        dispatch({ type: 'UPDATE_MERCH_PRICE', payload: { id: item.id, price } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-md rounded-xl p-6 space-y-4 my-auto border border-zinc-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">Edit Retail Price</h2>
                        <p className="text-xs text-zinc-400">{item.name} ({item.type})</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded cursor-pointer">✕</button>
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex justify-between">
                        <span>Retail Price ($)</span>
                        <span className="text-zinc-400">Mfg Cost: ${unitCost}</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min={unitCost}
                        value={price}
                        onChange={e => setPrice(Number(e.target.value))}
                        placeholder="Price"
                        className="w-full bg-zinc-700 border border-zinc-600 p-2.5 rounded-lg text-white font-bold text-base focus:outline-none focus:border-indigo-500"
                    />
                    
                    {/* Quick price presets */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setPrice(recommendedPrice)}
                            className="flex-1 py-1 text-xs font-semibold rounded bg-zinc-700 hover:bg-zinc-650 text-zinc-300 border border-zinc-600 cursor-pointer"
                        >
                            Standard (${recommendedPrice})
                        </button>
                        <button
                            type="button"
                            onClick={() => setPrice(Number((recommendedPrice * 1.25).toFixed(2)))}
                            className="flex-1 py-1 text-xs font-semibold rounded bg-zinc-700 hover:bg-zinc-650 text-zinc-300 border border-zinc-600 cursor-pointer"
                        >
                            Premium (+25%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setPrice(Number((recommendedPrice * 0.8).toFixed(2)))}
                            className="flex-1 py-1 text-xs font-semibold rounded bg-zinc-700 hover:bg-zinc-650 text-zinc-300 border border-zinc-600 cursor-pointer"
                        >
                            Sale (-20%)
                        </button>
                    </div>
                </div>

                <div className="bg-black/30 p-2.5 rounded-lg border border-zinc-700/60 text-xs text-zinc-400 flex justify-between">
                    <span>Profit Margin per Unit:</span>
                    <span className={price >= unitCost ? 'font-bold text-emerald-400' : 'font-bold text-red-400'}>
                        ${(price - unitCost).toFixed(2)}
                    </span>
                </div>

                {price < unitCost && (
                    <p className="text-red-400 text-xs bg-red-950/50 p-2 rounded border border-red-800/50">
                        Price cannot be lower than unit manufacturing cost (${unitCost}).
                    </p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={price < unitCost}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-colors shadow-md disabled:cursor-not-allowed cursor-pointer"
                    >
                        Save Price
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmModal: React.FC<{
    item: MerchProduct;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ item, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-sm rounded-xl p-5 space-y-4 my-auto border border-zinc-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
                        <TrashIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold">Remove Product</h2>
                        <p className="text-xs text-zinc-400">Remove from official store</p>
                    </div>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                    Are you sure you want to remove <strong className="text-white">"{item.name}"</strong> ({item.type})? Any unsold physical stock will be delisted.
                </p>
                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md cursor-pointer"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

const MerchStoreView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [restockItem, setRestockItem] = useState<MerchProduct | null>(null);
    const [priceItem, setPriceItem] = useState<MerchProduct | null>(null);
    const [duplicateItem, setDuplicateItem] = useState<MerchProduct | null>(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState<MerchProduct | null>(null);

    if (!activeArtistData || !activeArtist) return null;
    const { merch, merchStoreBanner, youtubeStoreUnlocked, releases } = activeArtistData;

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                dispatch({ type: 'UPDATE_MERCH_BANNER', payload: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <>
            {showAddModal && <AddMerchModal onClose={() => setShowAddModal(false)} />}
            {restockItem && <RestockModal item={restockItem} onClose={() => setRestockItem(null)} />}
            {priceItem && <EditPriceModal item={priceItem} onClose={() => setPriceItem(null)} />}
            {duplicateItem && <DuplicateMerchModal item={duplicateItem} onClose={() => setDuplicateItem(null)} />}
            {deleteConfirmItem && (
                <DeleteConfirmModal
                    item={deleteConfirmItem}
                    onClose={() => setDeleteConfirmItem(null)}
                    onConfirm={() => dispatch({ type: 'REMOVE_MERCH', payload: { id: deleteConfirmItem.id } })}
                />
            )}
            <div className="bg-white text-black h-full overflow-y-auto pb-24">
                <header className="sticky top-0 bg-white z-20 border-b border-zinc-200">
                    <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'youtube' })}
                                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                                title="Back to YouTube"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] uppercase font-anton">{activeArtist.name}</h1>
                                <p className="text-[11px] text-zinc-500 font-semibold">{merch.length}/{MERCH_PRODUCT_LIMIT} Products in Store</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {merch.length < MERCH_PRODUCT_LIMIT && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-black hover:bg-zinc-800 text-white font-bold py-1.5 px-3.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-sm"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add Product
                                </button>
                            )}
                            <button type="button" className="p-1.5 rounded hover:bg-zinc-100"><SearchIcon className="w-5 h-5" /></button>
                            <button type="button" className="p-1.5 rounded hover:bg-zinc-100"><ShoppingBagIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </header>

                <main>
                    <div className="relative group w-full h-[30vh] md:h-[40vh] bg-zinc-200 flex items-center justify-center">
                        <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                        {merchStoreBanner ? (
                            <img src={merchStoreBanner} alt="Store Banner" className="w-full h-full object-cover" />
                        ) : (
                            <p className="text-zinc-500">No banner set.</p>
                        )}
                        <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold cursor-pointer">
                            Upload Banner
                        </button>
                    </div>

                    <div className="p-4 md:p-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {merch.map(item => (
                                <div key={item.id} className="group relative border border-zinc-200 bg-white rounded-lg overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-shadow">
                                    <div className="relative w-full aspect-[5/4] bg-zinc-100 flex items-center justify-center overflow-hidden">
                                        <div className="relative h-[75%] aspect-square mr-8"> {/* Offset so the disc is visible */}
                                            {/* Vinyl Disc */}
                                            {item.type === 'Vinyl' && (
                                                <div 
                                                    className="absolute top-0 bottom-0 -right-[40%] aspect-square rounded-full shadow-lg transition-transform duration-500 ease-out group-hover:translate-x-2"
                                                    style={{ backgroundColor: item.color || '#1A1A1A' }}
                                                >
                                                    <div className="absolute inset-0 rounded-full border border-white/10" />
                                                    <div className="absolute inset-1 rounded-full border border-black/20" />
                                                    <div className="absolute inset-2 rounded-full border border-black/20" />
                                                    <div className="absolute inset-4 rounded-full border border-black/10" />
                                                    <div className="absolute top-1/2 left-1/2 w-[35%] h-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 overflow-hidden">
                                                        <img src={item.image} className="w-full h-full object-cover opacity-80" alt="center label" />
                                                    </div>
                                                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner" />
                                                </div>
                                            )}

                                            {/* CD Disc */}
                                            {item.type === 'CD' && (
                                                <div 
                                                    className="absolute top-[2%] bottom-[2%] -right-[45%] w-auto aspect-square rounded-full bg-gradient-to-tr from-zinc-300 via-gray-100 to-zinc-400 shadow-lg border border-zinc-300 transition-transform duration-500 ease-out group-hover:translate-x-2"
                                                >
                                                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.8),transparent,rgba(255,255,255,0.8),transparent)] mix-blend-overlay opacity-50" />
                                                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,rgba(255,0,0,0.1),rgba(0,255,0,0.1),rgba(0,0,255,0.1),rgba(255,0,0,0.1))] mix-blend-overlay" />
                                                    
                                                    <div className="absolute top-1/2 left-1/2 w-[15%] h-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-400 bg-white shadow-inner flex items-center justify-center">
                                                        <div className="w-[30%] h-[30%] rounded-full bg-zinc-200 border border-black/10 shadow-inner" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sleeve/Case */}
                                            <div className={`absolute inset-0 z-10 shadow-[0_5px_15px_rgba(0,0,0,0.25)] bg-white ${item.type === 'CD' ? 'rounded-sm overflow-hidden border border-white/50 border-r-zinc-300 border-b-zinc-300' : ''}`}>
                                                {item.type === 'CD' && (
                                                    <>
                                                        <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-zinc-900 flex flex-col items-center justify-center border-r-[2px] border-zinc-400/50 z-20 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.5)]">
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/40 pointer-events-none z-20 mix-blend-screen" />
                                                        <div className="absolute left-[12%] top-0 bottom-0 w-1 bg-white/30 pointer-events-none z-20" />
                                                    </>
                                                )}
                                                <img src={item.image} alt={item.name} className={`w-full h-full object-cover relative z-10 ${item.type === 'CD' ? 'pl-[12%] pr-0.5' : ''}`} />
                                            </div>
                                        </div>

                                        {(item.isPreorder && !releases.some(r => r.id === item.releaseId)) && (
                                            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-20">PRE-ORDER</div>
                                        )}

                                        {item.regionExclusive && item.regionExclusive !== 'Global' && (
                                            <div className={`absolute top-2 left-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow z-20 text-white ${item.regionExclusive === 'US' ? 'bg-blue-600' : 'bg-red-600'}`}>
                                                {item.regionExclusive === 'US' ? '🇺🇸 US Excl.' : '🇬🇧 UK Excl.'}
                                            </div>
                                        )}

                                        {item.bonusSongTitles && item.bonusSongTitles.length > 0 && (
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow z-20 flex items-center gap-1">
                                                ⭐️ +{item.bonusSongTitles.length} Bonus
                                            </div>
                                        )}
                                    </div>
                                    
                                    {item.stock <= 0 && (
                                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 w-full py-2.5 text-center text-red-400 font-extrabold tracking-widest uppercase z-30 shadow-md">
                                            <span>SOLD OUT</span>
                                        </div>
                                    )}

                                    {/* Product Details */}
                                    <div className="mt-2 text-center md:text-left px-2 mb-1 flex-1">
                                        <p className="font-semibold line-clamp-1 text-zinc-900 text-sm">{item.name}</p>
                                        <p className="text-zinc-800 font-bold text-sm">${item.price.toFixed(2)} USD</p>
                                        {item.bonusSongTitles && item.bonusSongTitles.length > 0 && (
                                            <p className="text-[11px] text-amber-800 font-semibold line-clamp-1 mt-0.5">
                                                Bonus: {item.bonusSongTitles.join(', ')}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center mt-1 text-xs text-zinc-500">
                                            <span>Stock: <strong className={item.stock > 0 ? "text-zinc-800" : "text-red-600"}>{formatNumber(item.stock)}</strong></span>
                                            <span>Sold: <strong className="text-zinc-800">{formatNumber(item.unitsSold || 0)}</strong></span>
                                        </div>
                                        {item.shipmentDate && (
                                            <div className="mt-1 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 inline-block font-medium">
                                                📦 Ships: {formatFullDateString(item.shipmentDate)} (W{item.shipmentDate.week})
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons: Always-visible dedicated action grid */}
                                    <div className="mt-2 px-2 pb-2.5 pt-1.5 border-t border-zinc-100 flex flex-col gap-1.5">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDuplicateItem(item);
                                            }}
                                            className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Duplicate {item.type}</span>
                                        </button>

                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRestockItem(item);
                                                }}
                                                className="py-1 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded text-[11px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                                                title="Order more inventory"
                                            >
                                                <PlusIcon className="w-3 h-3 text-emerald-600" />
                                                <span>Restock</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPriceItem(item);
                                                }}
                                                className="py-1 px-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                                                title="Change retail price"
                                            >
                                                <span>Price</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmItem(item);
                                                }}
                                                className="py-1 px-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-[11px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                                                title="Remove product"
                                            >
                                                <TrashIcon className="w-3 h-3 text-rose-600" />
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hover overlay quick actions */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDuplicateItem(item);
                                            }}
                                            className="p-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow flex items-center gap-1 cursor-pointer"
                                        >
                                            <Copy className="w-3 h-3" />
                                            DUPLICATE
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRestockItem(item);
                                            }}
                                            className="p-1 px-2 bg-white/95 text-zinc-900 text-xs font-bold rounded shadow hover:bg-zinc-200 cursor-pointer"
                                        >
                                            RESTOCK
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPriceItem(item);
                                            }}
                                            className="p-1 px-2 bg-white/95 text-zinc-900 text-xs font-bold rounded shadow hover:bg-zinc-200 cursor-pointer"
                                        >
                                            PRICE
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmItem(item);
                                            }}
                                            className="p-1.5 bg-white/95 rounded shadow hover:bg-zinc-200 cursor-pointer"
                                        >
                                            <TrashIcon className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                 <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="fixed bottom-4 left-4 bg-zinc-800 text-white p-3 rounded-full shadow-lg hover:bg-zinc-700 transition-colors z-30 cursor-pointer">
                     <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </div>
        </>
    );
};

export default MerchStoreView;