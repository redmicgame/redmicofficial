import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { MERCH_PRODUCT_LIMIT } from '../constants';
import type { MerchProduct, Release, GameDate } from '../types';
import MenuIcon from './icons/MenuIcon';
import SearchIcon from './icons/SearchIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { CalendarDatePicker, formatFullDateString } from './CalendarDatePicker';

// Helper to add weeks to GameDate
const addWeeks = (date: GameDate, weeksToAdd: number): GameDate => {
    let w = date.week + weeksToAdd;
    let y = date.year;
    while (w > 52) {
        w -= 52;
        y += 1;
    }
    return { year: y, week: w };
};

const isDateBefore = (a: GameDate, b: GameDate) => {
    if (a.year !== b.year) return a.year < b.year;
    return a.week < b.week;
};

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

    // Shipment Date Management
    const minShipmentDate = useMemo(() => addWeeks(gameState.date, 8), [gameState.date]);
    const [shippingDate, setShippingDate] = useState<GameDate>(minShipmentDate);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isPhysical = merchType === 'Vinyl' || merchType === 'CD' || merchType === 'Cassette' || merchType === 'T-Shirt' || merchType === 'Hoodie' || merchType === 'Tour Exclusive Merch';
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

    // When release is selected, intelligently set default shippingDate
    useEffect(() => {
        if (!selectedRelease) return;
        const sub = activeArtistData.labelSubmissions.find(s => s.release.id === selectedRelease.id);
        if (sub?.projectReleaseDate) {
            if (isDateBefore(sub.projectReleaseDate, minShipmentDate)) {
                setShippingDate(minShipmentDate);
            } else {
                setShippingDate(sub.projectReleaseDate);
            }
        } else {
            setShippingDate(minShipmentDate);
        }
    }, [selectedRelease, activeArtistData.labelSubmissions, minShipmentDate]);

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
        if (itemsForSelectedRelease >= 8) { setError('You can only have 8 product variants per release.'); return; }
        if (money < totalCost) { setError('Not enough money to stock this inventory.'); return; }
        if (stockQty < 1 && merchType !== 'Ringtone') { setError('Must stock at least 1 unit.'); return; }
        if (price < unitCost) { setError('Price cannot be lower than unit cost.'); return; }

        if (isPhysical && isDateBefore(shippingDate, minShipmentDate)) {
            setError('Shipments for Vinyls and CDs must be scheduled at least 8 weeks in advance.');
            return;
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
            stock: merchType === 'Ringtone' ? 9999999 : stockQty,
            unitsSold: 0,
            image: image || selectedRelease.coverArt,
            artistId: activeArtist.id,
            isPreorder: isPhysical || isScheduled,
            shippingDate: isPhysical ? shippingDate : undefined,
            isShipped: false,
            preorderUnitsSold: 0,
            regionExclusive,
            bonusSongIds: selectedBonusSongIds.length > 0 ? selectedBonusSongIds : undefined,
            bonusSongTitles: bonusSongTitles.length > 0 ? bonusSongTitles : undefined,
        };
        dispatch({ type: 'ADD_MERCH', payload: { item: newItem, cost: totalCost } });
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
                <div className="bg-zinc-800 text-white w-full max-w-md rounded-lg p-6 space-y-4 my-auto relative" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold">Add New {merchType === 'Ringtone' ? 'Digital Item' : 'Product'}</h2>
                    <select value={releaseId} onChange={e => { setReleaseId(e.target.value); setImage(availableReleases.find(r=>r.id===e.target.value)?.coverArt || null); }} className="w-full bg-zinc-700 p-2 rounded">
                        <option value="">Select a Release...</option>
                        {availableReleases.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                    {itemsForSelectedRelease >= 8 && <p className="text-sm text-red-400">This release already has the maximum of 8 product variants.</p>}
                    
                    <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)} placeholder="Variant Name (e.g., Apple Red Vinyl)" className="w-full bg-zinc-700 p-2 rounded" />
                    
                    <div className={`grid ${isRingtoneEra ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                        <button onClick={() => handleMerchTypeChange('Vinyl')} className={`py-2 rounded ${merchType === 'Vinyl' ? 'bg-red-500' : 'bg-zinc-700'}`}>Vinyl</button>
                        <button onClick={() => handleMerchTypeChange('CD')} className={`py-2 rounded ${merchType === 'CD' ? 'bg-red-500' : 'bg-zinc-700'}`}>CD</button>
                        {isRingtoneEra && (
                            <button onClick={() => handleMerchTypeChange('Ringtone')} className={`py-2 rounded ${merchType === 'Ringtone' ? 'bg-red-500' : 'bg-zinc-700'}`}>Ringtone</button>
                        )}
                    </div>

                    {/* Physical Shipment Scheduling Section */}
                    {isPhysical && (
                        <div className="space-y-1.5 bg-zinc-900/90 p-3 rounded-lg border border-blue-500/30">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                                    <span>🚚 Shipment Date</span>
                                    <span className="text-[10px] text-zinc-400 font-normal">(Min 8 Weeks in Advance)</span>
                                </label>
                                <span className="text-[10px] text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/50">Counts Week of Shipment</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDatePicker(true)}
                                className="w-full flex items-center justify-between p-2.5 rounded bg-zinc-800 border border-zinc-600 hover:border-blue-400 text-left transition-colors"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-white">{formatFullDateString(shippingDate)}</p>
                                    <p className="text-[11px] text-zinc-400">Week {shippingDate.week}, {shippingDate.year}</p>
                                </div>
                                <span className="text-xs font-bold text-blue-400 hover:text-blue-300">Change Date →</span>
                            </button>
                            <p className="text-[10px] text-zinc-400">Shipments must be scheduled at least 8 weeks ahead. Sales will count towards first week sales on the shipment date.</p>
                        </div>
                    )}

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
                    <button onClick={handleAddMerch} disabled={!releaseId || itemsForSelectedRelease >= 8 || money < totalCost} className="w-full bg-red-600 hover:bg-red-700 p-2 rounded font-bold disabled:bg-zinc-600 transition-colors">
                        Add Product
                    </button>
                </div>
            </div>

            {/* Modal Calendar Date Picker to avoid overlay collisions */}
            {showDatePicker && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setShowDatePicker(false)}>
                    <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <CalendarDatePicker
                            title="Schedule Physical Shipment"
                            subtitle="Vinyls and CDs must be scheduled at least 8 weeks in advance for pressing and manufacturing."
                            currentDate={gameState.date}
                            selectedDate={shippingDate}
                            minDate={minShipmentDate}
                            minDateErrorMessage="Physical shipments must be scheduled at least 8 weeks in advance."
                            onSelectDate={(newDate) => {
                                setShippingDate(newDate);
                                setShowDatePicker(false);
                            }}
                            onClose={() => setShowDatePicker(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

const RestockModal: React.FC<{
    item: MerchProduct;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const { dispatch, activeArtistData } = useGame();
    const [amount, setAmount] = useState(1000);
    const unitCost = item.type === 'Vinyl' ? 12 : 3;
    const totalCost = amount * unitCost;
    const money = activeArtistData?.money || 0;

    const handleRestock = () => {
        if (amount <= 0) return;
        if (money < totalCost) return;
        dispatch({ type: 'RESTOCK_MERCH', payload: { id: item.id, amount, cost: totalCost } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-md rounded-lg p-6 space-y-4 my-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold">Restock {item.name}</h2>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Order Quantity <span className="float-right text-[10px] bg-zinc-700 px-1 rounded block mt-0.5">Unit Cost: ${unitCost}</span></label>
                    <input type="range" min="100" max="50000" step="100" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full mb-2 accent-red-500" />
                    <input type="number" min="1" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-zinc-700 p-2 rounded" />
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-black text-sm">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-zinc-400">Total Manufacturing Cost:</span>
                        <span className="font-bold text-red-400">${formatNumber(totalCost)}</span>
                    </div>
                </div>
                {money < totalCost && <p className="text-red-400 text-sm">Not enough money to stock this inventory. You have ${formatNumber(Math.floor(money))}.</p>}
                <button onClick={handleRestock} disabled={amount <= 0 || money < totalCost} className="w-full bg-red-600 hover:bg-red-700 p-2 rounded font-bold disabled:bg-zinc-600 transition-colors">
                    Pay & Restock
                </button>
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
    const unitCost = item.type === 'Vinyl' ? 12 : 3;

    const handleSave = () => {
        if (price < unitCost) return;
        dispatch({ type: 'UPDATE_MERCH_PRICE', payload: { id: item.id, price } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-md rounded-lg p-6 space-y-4 my-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold">Edit Price for {item.name}</h2>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Retail Price <span className="text-[10px] text-zinc-500">(Unit Cost: ${unitCost} | Recommended: ${item.type === 'Vinyl' ? '39.98' : '12.98'})</span></label>
                    <input type="number" step="0.01" min={unitCost} value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="Price" className="w-full bg-zinc-700 p-2 rounded" />
                </div>
                {price < unitCost && <p className="text-red-400 text-sm">Price cannot be lower than unit cost (${unitCost}).</p>}
                <button onClick={handleSave} disabled={price < unitCost} className="w-full bg-red-600 hover:bg-red-700 p-2 rounded font-bold disabled:bg-zinc-600 transition-colors">
                    Save Price
                </button>
            </div>
        </div>
    );
};

// Edit Shipment Date Modal
const EditShipmentModal: React.FC<{
    item: MerchProduct;
    onClose: () => void;
}> = ({ item, onClose }) => {
    const { gameState, dispatch } = useGame();
    const minShipmentDate = useMemo(() => addWeeks(gameState.date, 8), [gameState.date]);
    const [selectedDate, setSelectedDate] = useState<GameDate>(item.shippingDate || minShipmentDate);
    const [showPicker, setShowPicker] = useState(false);

    const handleSave = () => {
        if (isDateBefore(selectedDate, minShipmentDate)) return;
        dispatch({
            type: 'UPDATE_MERCH_SHIPMENT',
            payload: { id: item.id, shippingDate: selectedDate },
        });
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
                <div className="bg-zinc-800 text-white w-full max-w-md rounded-lg p-6 space-y-4 my-auto relative" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Manage Shipment</h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white line-clamp-1">{item.name}</p>
                        <p className="text-xs text-zinc-400">{item.type} • {item.stock} in stock • {item.unitsSold || 0} pre-ordered</p>
                    </div>

                    <div className="bg-zinc-900/90 p-4 rounded-lg border border-zinc-700 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-400">Shipment Status:</span>
                            {item.isShipped ? (
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">📦 Dispatched / Shipped</span>
                            ) : (
                                <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">⏳ Pre-Order Window</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-400">Scheduled Date:</span>
                            <span className="text-xs font-semibold text-white">{formatFullDateString(selectedDate)}</span>
                        </div>
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPicker(true)}
                                className="w-full py-2 px-3 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-between"
                            >
                                <span>Change Shipment Date</span>
                                <span>📅 Open Calendar →</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                        Sales and pre-orders count towards first week pure chart sales on the shipment date.
                    </p>

                    <button
                        onClick={handleSave}
                        disabled={isDateBefore(selectedDate, minShipmentDate)}
                        className="w-full bg-blue-600 hover:bg-blue-700 p-2.5 rounded font-bold disabled:bg-zinc-600 transition-colors text-sm"
                    >
                        Save Shipment Date
                    </button>
                </div>
            </div>

            {/* Modal Calendar Date Picker to avoid overlay collisions */}
            {showPicker && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
                    <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <CalendarDatePicker
                            title="Reschedule Physical Shipment"
                            subtitle="Shipments must be scheduled at least 8 weeks in advance for manufacturing."
                            currentDate={gameState.date}
                            selectedDate={selectedDate}
                            minDate={minShipmentDate}
                            minDateErrorMessage="Physical shipments must be scheduled at least 8 weeks in advance."
                            onSelectDate={(newDate) => {
                                setSelectedDate(newDate);
                                setShowPicker(false);
                            }}
                            onClose={() => setShowPicker(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

// Overview Modal to Manage All Shipments
const ManageShipmentsModal: React.FC<{
    onClose: () => void;
    onEditShipment: (item: MerchProduct) => void;
}> = ({ onClose, onEditShipment }) => {
    const { activeArtistData, gameState } = useGame();
    const merch = activeArtistData?.merch || [];

    const physicalItems = useMemo(() => {
        return merch.filter(m => m.type === 'Vinyl' || m.type === 'CD' || m.type === 'Cassette' || m.shippingDate);
    }, [merch]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-800 text-white w-full max-w-2xl rounded-lg p-6 space-y-4 my-auto max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-zinc-700 pb-3">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span>🚚 Physical Shipments Manager</span>
                        </h2>
                        <p className="text-xs text-zinc-400">Current Date: {formatFullDateString(gameState.date)}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {physicalItems.length === 0 ? (
                        <p className="text-sm text-zinc-500 py-8 text-center">No physical merch items created yet. Add a Vinyl or CD to schedule shipments.</p>
                    ) : (
                        physicalItems.map(item => {
                            const shipWeeks = item.shippingDate ? item.shippingDate.year * 52 + item.shippingDate.week : null;
                            const currentWeeks = gameState.date.year * 52 + gameState.date.week;
                            const weeksAway = shipWeeks !== null ? Math.max(0, shipWeeks - currentWeeks) : null;

                            return (
                                <div key={item.id} className="bg-zinc-900/90 border border-zinc-700 rounded-lg p-3 flex items-center justify-between gap-3">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-zinc-400">
                                            <span>{item.type}</span>
                                            <span>•</span>
                                            <span>Pre-orders: <strong className="text-white">{formatNumber(item.unitsSold || 0)}</strong></span>
                                            <span>•</span>
                                            <span>Stock: <strong className="text-white">{formatNumber(item.stock)}</strong></span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                            {item.isShipped ? (
                                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                                                    📦 Shipped
                                                </span>
                                            ) : item.shippingDate ? (
                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">
                                                    🚚 Ships {formatFullDateString(item.shippingDate)} ({weeksAway}w away)
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-500">No date set</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onEditShipment(item)}
                                        className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 text-xs font-bold rounded border border-zinc-600 transition-colors flex-shrink-0"
                                    >
                                        Reschedule
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="pt-2 border-t border-zinc-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-bold">
                        Close
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
    const [showManageShipments, setShowManageShipments] = useState(false);
    const [restockItem, setRestockItem] = useState<MerchProduct | null>(null);
    const [priceItem, setPriceItem] = useState<MerchProduct | null>(null);
    const [shipmentItem, setShipmentItem] = useState<MerchProduct | null>(null);

    if (!activeArtistData || !activeArtist) return null;
    const { merch, merchStoreBanner, releases } = activeArtistData;

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
            {showManageShipments && (
                <ManageShipmentsModal
                    onClose={() => setShowManageShipments(false)}
                    onEditShipment={(item) => {
                        setShowManageShipments(false);
                        setShipmentItem(item);
                    }}
                />
            )}
            {restockItem && <RestockModal item={restockItem} onClose={() => setRestockItem(null)} />}
            {priceItem && <EditPriceModal item={priceItem} onClose={() => setPriceItem(null)} />}
            {shipmentItem && <EditShipmentModal item={shipmentItem} onClose={() => setShipmentItem(null)} />}

            <div className="bg-white text-black h-full overflow-y-auto pb-24">
                <header className="sticky top-0 bg-white z-20 border-b border-zinc-200">
                    <div className="p-4 flex justify-between items-center">
                        <button><MenuIcon className="w-6 h-6" /></button>
                        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase font-anton">{activeArtist.name}</h1>
                        <div className="flex items-center gap-4">
                            <button><SearchIcon className="w-5 h-5" /></button>
                            <button><ShoppingBagIcon className="w-6 h-6" /></button>
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
                        <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                            Upload Banner
                        </button>
                    </div>

                    <div className="p-4 md:p-8">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <button
                                onClick={() => setShowManageShipments(true)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-2 px-3 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors"
                            >
                                <span>🚚</span> Manage Shipments
                            </button>
                            {merch.length < MERCH_PRODUCT_LIMIT && (
                                <button onClick={() => setShowAddModal(true)} className="bg-black hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-md inline-flex items-center gap-2 text-xs transition-colors">
                                    <PlusIcon className="w-4 h-4" /> Add Product
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {merch.map(item => (
                                <div key={item.id} className="group relative border border-zinc-200 bg-white flex flex-col rounded-md overflow-hidden shadow-sm">
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
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 w-full py-2 text-center text-red-500 font-extrabold tracking-widest uppercase z-30">SOLD OUT</div>
                                    )}
                                    <div className="mt-2 text-center md:text-left px-2 mb-2">
                                        <p className="font-semibold line-clamp-1 text-sm">{item.name}</p>
                                        <p className="text-zinc-600 text-sm font-bold">${item.price.toFixed(2)} USD</p>
                                        {item.bonusSongTitles && item.bonusSongTitles.length > 0 && (
                                            <p className="text-[11px] text-yellow-700 font-semibold line-clamp-1 mt-0.5">
                                                Bonus: {item.bonusSongTitles.join(', ')}
                                            </p>
                                        )}
                                        {/* Physical Shipment status info */}
                                        {item.shippingDate && (
                                            <div className="mt-1">
                                                {item.isShipped ? (
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                        📦 Shipped
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                        🚚 Ships W{item.shippingDate.week}, {item.shippingDate.year}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center mt-1 text-xs text-zinc-500">
                                            <span>Stock: {formatNumber(item.stock)}</span>
                                            <span>Sold: {formatNumber(item.unitsSold || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                        {(item.type === 'Vinyl' || item.type === 'CD' || item.shippingDate) && (
                                            <button onClick={() => setShipmentItem(item)} className="p-1 px-2 bg-blue-600 text-white text-[10px] font-bold rounded shadow hover:bg-blue-700">
                                                SHIPMENT
                                            </button>
                                        )}
                                        <button onClick={() => setRestockItem(item)} className="p-1 px-2 bg-white/90 text-[10px] font-bold rounded shadow hover:bg-zinc-200">
                                            RESTOCK
                                        </button>
                                        <button onClick={() => setPriceItem(item)} className="p-1 px-2 bg-white/90 text-[10px] font-bold rounded shadow hover:bg-zinc-200">
                                            PRICE
                                        </button>
                                        <button onClick={() => { if(confirm("Remove product?")) dispatch({type: 'REMOVE_MERCH', payload: {id: item.id}}) }} className="p-1.5 bg-white/90 rounded shadow hover:bg-zinc-200">
                                            <TrashIcon className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                 <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="fixed bottom-4 left-4 bg-zinc-800 text-white p-3 rounded-full shadow-lg hover:bg-zinc-700 transition-colors z-30">
                     <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </div>
        </>
    );
};

export default MerchStoreView;
