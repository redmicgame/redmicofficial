import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import TicketIcon from './icons/TicketIcon';
import { Tour, Venue } from '../types';

interface TouringViewProps {
    initialTourId?: string;
    initialVenueId?: string;
    onBack?: () => void;
    isEmbedded?: boolean;
    theme?: 'dark' | 'ticketmaster';
}

interface SeatSection {
    id: string;
    name: string;
    tier: 'vip' | 'pit' | 'lower' | 'club' | 'upper';
    tierName: string;
    level: 'floor' | 'lower' | 'club' | 'upper';
    capacity: number;
    basePriceMultiplier: number;
    path: string;
    textX: number;
    textY: number;
    distanceMeters: number;
    viewQuality: string;
}

const SEAT_SECTIONS: SeatSection[] = [
    // Floor & GA Pit
    { id: 'PIT-L', name: 'VIP Diamond Pit Left', tier: 'vip', tierName: 'VIP Diamond Package', level: 'floor', capacity: 1200, basePriceMultiplier: 2.8, path: 'M 350,250 L 430,250 L 430,340 L 370,340 Z', textX: 395, textY: 295, distanceMeters: 8, viewQuality: 'Stage Front Unobstructed' },
    { id: 'PIT-R', name: 'VIP Diamond Pit Right', tier: 'vip', tierName: 'VIP Diamond Package', level: 'floor', capacity: 1200, basePriceMultiplier: 2.8, path: 'M 570,250 L 650,250 L 630,340 L 570,340 Z', textX: 605, textY: 295, distanceMeters: 8, viewQuality: 'Stage Front Unobstructed' },
    { id: 'FL-A', name: 'Floor Section A (Catwalk Center)', tier: 'pit', tierName: 'Floor GA / Golden Circle', level: 'floor', capacity: 1800, basePriceMultiplier: 1.8, path: 'M 440,360 L 560,360 L 560,430 L 440,430 Z', textX: 500, textY: 395, distanceMeters: 12, viewQuality: 'Runway & B-Stage Center' },
    { id: 'FL-B', name: 'Floor Section B (Mid Floor)', tier: 'pit', tierName: 'Floor GA / Golden Circle', level: 'floor', capacity: 2200, basePriceMultiplier: 1.5, path: 'M 410,440 L 590,440 L 580,510 L 420,510 Z', textX: 500, textY: 475, distanceMeters: 25, viewQuality: 'Direct Eye-Level View' },
    { id: 'FL-C', name: 'Floor Section C (Rear Floor)', tier: 'pit', tierName: 'Floor GA / Golden Circle', level: 'floor', capacity: 2500, basePriceMultiplier: 1.3, path: 'M 390,520 L 610,520 L 600,580 L 400,580 Z', textX: 500, textY: 550, distanceMeters: 45, viewQuality: 'Production Mix Sightline' },

    // Lower Bowl 100 Level
    { id: 'SEC-101', name: 'Section 101 (Lower Side L)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1400, basePriceMultiplier: 1.4, path: 'M 250,220 L 330,230 L 320,310 L 240,300 Z', textX: 285, textY: 265, distanceMeters: 22, viewQuality: 'Close Side-Angle View' },
    { id: 'SEC-102', name: 'Section 102 (Lower Side Floor L)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1600, basePriceMultiplier: 1.45, path: 'M 240,310 L 320,320 L 300,410 L 220,400 Z', textX: 270, textY: 360, distanceMeters: 30, viewQuality: 'Prime Elevated Side View' },
    { id: 'SEC-103', name: 'Section 103 (Lower Bowl Mid L)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1800, basePriceMultiplier: 1.35, path: 'M 220,410 L 300,420 L 290,510 L 210,500 Z', textX: 255, textY: 460, distanceMeters: 40, viewQuality: 'Panoramic Elevated View' },
    { id: 'SEC-104', name: 'Section 104 (Lower Corner L)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1900, basePriceMultiplier: 1.25, path: 'M 210,510 L 290,520 L 330,600 L 250,620 Z', textX: 270, textY: 560, distanceMeters: 55, viewQuality: 'Diagonal Stadium View' },
    { id: 'SEC-105', name: 'Section 105 (Lower Centerline L)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 2000, basePriceMultiplier: 1.3, path: 'M 260,630 L 340,610 L 410,650 L 350,690 Z', textX: 340, textY: 650, distanceMeters: 62, viewQuality: 'Centerfield Angle' },
    { id: 'SEC-106', name: 'Section 106 (Lower Center Direct)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 2400, basePriceMultiplier: 1.4, path: 'M 420,655 L 580,655 L 580,710 L 420,710 Z', textX: 500, textY: 682, distanceMeters: 68, viewQuality: 'Dead Center Sound & Stage' },
    { id: 'SEC-107', name: 'Section 107 (Lower Centerline R)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 2000, basePriceMultiplier: 1.3, path: 'M 590,650 L 660,610 L 740,630 L 650,690 Z', textX: 660, textY: 650, distanceMeters: 62, viewQuality: 'Centerfield Angle' },
    { id: 'SEC-108', name: 'Section 108 (Lower Corner R)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1900, basePriceMultiplier: 1.25, path: 'M 710,520 L 790,510 L 750,620 L 670,600 Z', textX: 730, textY: 560, distanceMeters: 55, viewQuality: 'Diagonal Stadium View' },
    { id: 'SEC-109', name: 'Section 109 (Lower Bowl Mid R)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1800, basePriceMultiplier: 1.35, path: 'M 700,420 L 780,410 L 790,500 L 710,510 Z', textX: 745, textY: 460, distanceMeters: 40, viewQuality: 'Panoramic Elevated View' },
    { id: 'SEC-110', name: 'Section 110 (Lower Side Floor R)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1600, basePriceMultiplier: 1.45, path: 'M 680,320 L 760,310 L 780,400 L 700,410 Z', textX: 730, textY: 360, distanceMeters: 30, viewQuality: 'Prime Elevated Side View' },
    { id: 'SEC-111', name: 'Section 111 (Lower Side Stage R)', tier: 'lower', tierName: 'Lower Bowl Reserved', level: 'lower', capacity: 1400, basePriceMultiplier: 1.4, path: 'M 670,230 L 750,220 L 760,300 L 680,310 Z', textX: 715, textY: 265, distanceMeters: 22, viewQuality: 'Close Side-Angle View' },

    // Club Level / Suites (200 Level)
    { id: 'CLUB-201', name: 'Club Lounge 201 (VIP Terrace L)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 800, basePriceMultiplier: 2.1, path: 'M 170,260 L 230,270 L 210,360 L 150,350 Z', textX: 190, textY: 310, distanceMeters: 35, viewQuality: 'Private Bar & Terrace View' },
    { id: 'CLUB-202', name: 'Club Lounge 202 (Executive Suite L)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 850, basePriceMultiplier: 2.2, path: 'M 150,370 L 210,380 L 190,470 L 130,460 Z', textX: 170, textY: 420, distanceMeters: 48, viewQuality: 'Luxury Box Direct Line' },
    { id: 'CLUB-203', name: 'Club Lounge 203 (Center Mezzanine L)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 900, basePriceMultiplier: 2.3, path: 'M 140,480 L 200,490 L 230,570 L 160,590 Z', textX: 180, textY: 535, distanceMeters: 65, viewQuality: 'Grand Mezzanine Sightline' },
    { id: 'CLUB-204', name: 'Club Lounge 204 (Presidential Box)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 1100, basePriceMultiplier: 2.5, path: 'M 350,700 L 650,700 L 640,750 L 360,750 Z', textX: 500, textY: 725, distanceMeters: 75, viewQuality: 'Full Stage & Production View' },
    { id: 'CLUB-205', name: 'Club Lounge 205 (Center Mezzanine R)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 900, basePriceMultiplier: 2.3, path: 'M 800,490 L 860,480 L 840,590 L 770,570 Z', textX: 820, textY: 535, distanceMeters: 65, viewQuality: 'Grand Mezzanine Sightline' },
    { id: 'CLUB-206', name: 'Club Lounge 206 (Executive Suite R)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 850, basePriceMultiplier: 2.2, path: 'M 790,380 L 850,370 L 870,460 L 810,470 Z', textX: 830, textY: 420, distanceMeters: 48, viewQuality: 'Luxury Box Direct Line' },
    { id: 'CLUB-207', name: 'Club Lounge 207 (VIP Terrace R)', tier: 'club', tierName: 'Club Suites & Lounges', level: 'club', capacity: 800, basePriceMultiplier: 2.1, path: 'M 770,270 L 830,260 L 850,350 L 790,360 Z', textX: 810, textY: 310, distanceMeters: 35, viewQuality: 'Private Bar & Terrace View' },

    // Upper Bowl (300 Level)
    { id: 'UPP-301', name: 'Upper Deck 301 (High Side L)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 2500, basePriceMultiplier: 0.75, path: 'M 90,240 L 160,250 L 140,360 L 70,350 Z', textX: 115, textY: 300, distanceMeters: 55, viewQuality: 'Upper Side Arena Vista' },
    { id: 'UPP-302', name: 'Upper Deck 302 (Upper Mid L)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 2800, basePriceMultiplier: 0.8, path: 'M 70,370 L 140,380 L 120,490 L 50,480 Z', textX: 95, textY: 430, distanceMeters: 70, viewQuality: 'Wide Stadium Panorama' },
    { id: 'UPP-303', name: 'Upper Deck 303 (Upper Corner L)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 3100, basePriceMultiplier: 0.7, path: 'M 60,500 L 130,510 L 170,630 L 100,660 Z', textX: 115, textY: 575, distanceMeters: 85, viewQuality: 'Full Atmosphere Sightline' },
    { id: 'UPP-304', name: 'Upper Deck 304 (Upper Center Direct)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 4200, basePriceMultiplier: 0.85, path: 'M 270,760 L 730,760 L 710,820 L 290,820 Z', textX: 500, textY: 790, distanceMeters: 95, viewQuality: 'Full Stadium Birdseye View' },
    { id: 'UPP-305', name: 'Upper Deck 305 (Upper Corner R)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 3100, basePriceMultiplier: 0.7, path: 'M 870,510 L 940,500 L 900,660 L 830,630 Z', textX: 885, textY: 575, distanceMeters: 85, viewQuality: 'Full Atmosphere Sightline' },
    { id: 'UPP-306', name: 'Upper Deck 306 (Upper Mid R)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 2800, basePriceMultiplier: 0.8, path: 'M 860,380 L 930,370 L 950,480 L 880,490 Z', textX: 905, textY: 430, distanceMeters: 70, viewQuality: 'Wide Stadium Panorama' },
    { id: 'UPP-307', name: 'Upper Deck 307 (High Side R)', tier: 'upper', tierName: 'Upper Bowl Standard', level: 'upper', capacity: 2500, basePriceMultiplier: 0.75, path: 'M 840,250 L 910,240 L 930,350 L 860,360 Z', textX: 885, textY: 300, distanceMeters: 55, viewQuality: 'Upper Side Arena Vista' }
];

export const TouringView: React.FC<TouringViewProps> = ({
    initialTourId,
    initialVenueId,
    onBack,
    isEmbedded = false,
    theme = 'dark'
}) => {
    const { gameState, dispatch, activeArtistData } = useGame();
    
    // Zoom control
    const [zoom, setZoom] = useState(1);
    const [selectedLevel, setSelectedLevel] = useState<'all' | 'floor' | 'lower' | 'club' | 'upper'>('all');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('PIT-L');
    const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

    // Selected Tour
    const currentTour: Tour | undefined = useMemo(() => {
        if (!activeArtistData?.tours?.length) return undefined;
        if (initialTourId) {
            const found = activeArtistData.tours.find(t => t.id === initialTourId);
            if (found) return found;
        }
        if (gameState.activeTourId) {
            const found = activeArtistData.tours.find(t => t.id === gameState.activeTourId);
            if (found) return found;
        }
        return activeArtistData.tours.find(t => t.status === 'active' || t.status === 'presale' || t.status === 'planning') || activeArtistData.tours[0];
    }, [activeArtistData, initialTourId, gameState.activeTourId]);

    // Selected Venue State
    const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(
        initialVenueId || currentTour?.venues[currentTour?.currentVenueIndex || 0]?.id || currentTour?.venues[0]?.id
    );

    // Sync selected venue when currentTour changes
    React.useEffect(() => {
        if (initialVenueId) {
            setSelectedVenueId(initialVenueId);
        } else if (currentTour?.venues?.length && !selectedVenueId) {
            setSelectedVenueId(currentTour.venues[currentTour.currentVenueIndex || 0]?.id || currentTour.venues[0]?.id);
        }
    }, [currentTour, initialVenueId]);

    const activeVenue: Venue | undefined = useMemo(() => {
        if (!currentTour || !currentTour.venues.length) return undefined;
        return currentTour.venues.find(v => v.id === selectedVenueId) || currentTour.venues[0];
    }, [currentTour, selectedVenueId]);

    // Venue Metrics
    const venueCapacity = activeVenue?.capacity || 20000;
    const baseTicketPrice = activeVenue?.ticketPrice || 110;
    const isSoldOut = activeVenue?.soldOut || (activeVenue?.ticketsSold ? activeVenue.ticketsSold >= activeVenue.capacity * 0.98 : false);
    
    // Scale sections to match current venue capacity and sales
    const sectionsWithStats = useMemo(() => {
        const rawTotalCapacity = SEAT_SECTIONS.reduce((sum, s) => sum + s.capacity, 0);
        const scaleFactor = venueCapacity / rawTotalCapacity;

        const venueFillRate = activeVenue 
            ? (activeVenue.ticketsSold > 0 ? (activeVenue.ticketsSold / activeVenue.capacity) : 0.88)
            : 0.85;

        return SEAT_SECTIONS.map(sec => {
            const scaledCap = Math.max(50, Math.round(sec.capacity * scaleFactor));
            const price = Math.round(baseTicketPrice * sec.basePriceMultiplier);
            const fillMultiplier = isSoldOut ? 1.0 : (sec.tier === 'vip' ? 0.98 : venueFillRate);
            const sold = isSoldOut ? scaledCap : Math.min(scaledCap, Math.round(scaledCap * fillMultiplier));
            const available = scaledCap - sold;
            const gross = sold * price;
            const percentSold = Math.round((sold / scaledCap) * 100);

            return {
                ...sec,
                scaledCap,
                sold,
                available,
                price,
                gross,
                percentSold
            };
        });
    }, [venueCapacity, baseTicketPrice, isSoldOut, activeVenue]);

    const selectedSection = useMemo(() => {
        return sectionsWithStats.find(s => s.id === selectedSectionId) || sectionsWithStats[0];
    }, [sectionsWithStats, selectedSectionId]);

    const venueGross = useMemo(() => {
        return sectionsWithStats.reduce((sum, s) => sum + s.gross, 0);
    }, [sectionsWithStats]);

    const totalTicketsSold = useMemo(() => {
        return sectionsWithStats.reduce((sum, s) => sum + s.sold, 0);
    }, [sectionsWithStats]);

    const attendancePercent = useMemo(() => {
        return Math.round((totalTicketsSold / venueCapacity) * 100);
    }, [totalTicketsSold, venueCapacity]);

    // Pricing Tiers Summary
    const tierSummaries = useMemo(() => {
        const tiers: Record<string, { name: string; color: string; count: number; available: number; sold: number; price: number; key: string }> = {
            vip: { name: 'VIP Diamond Pit', color: '#f59e0b', count: 0, available: 0, sold: 0, price: Math.round(baseTicketPrice * 2.8), key: 'vip' },
            pit: { name: 'Floor GA / Circle', color: '#10b981', count: 0, available: 0, sold: 0, price: Math.round(baseTicketPrice * 1.6), key: 'pit' },
            lower: { name: 'Lower Bowl Reserved', color: '#3b82f6', count: 0, available: 0, sold: 0, price: Math.round(baseTicketPrice * 1.35), key: 'lower' },
            club: { name: 'Club Suites & Lounges', color: '#8b5cf6', count: 0, available: 0, sold: 0, price: Math.round(baseTicketPrice * 2.2), key: 'club' },
            upper: { name: 'Upper Bowl Standard', color: '#64748b', count: 0, available: 0, sold: 0, price: Math.round(baseTicketPrice * 0.8), key: 'upper' }
        };

        sectionsWithStats.forEach(s => {
            const t = tiers[s.tier];
            if (t) {
                t.count += s.scaledCap;
                t.available += s.available;
                t.sold += s.sold;
            }
        });

        return Object.values(tiers);
    }, [sectionsWithStats, baseTicketPrice]);

    if (!currentTour || !activeVenue) {
        return (
            <div className="p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400">
                <TicketIcon className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                <p className="font-semibold text-lg text-white">No Tour or Venue Selected</p>
                <p className="text-sm mt-1">Plan or start a tour to view your venue seating map and box office details.</p>
                {onBack && (
                    <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500">
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col space-y-4">
            {/* Header with Tour & Venue Selector */}
            <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="p-2 rounded-lg bg-zinc-700/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            title="Back"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{currentTour.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isSoldOut ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                {isSoldOut ? 'Sold Out' : 'On Sale'}
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-white">{activeVenue.name}</h2>
                        <p className="text-xs text-zinc-400">{activeVenue.city} • Capacity: {formatNumber(venueCapacity)}</p>
                    </div>
                </div>

                {/* Venue Switcher if Tour has multiple stops */}
                {currentTour.venues.length > 1 && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-zinc-400 font-medium whitespace-nowrap">Show Date:</label>
                        <select 
                            value={activeVenue.id}
                            onChange={(e) => setSelectedVenueId(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 text-white text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-blue-500 max-w-[240px] truncate"
                        >
                            {currentTour.venues.map((v, i) => (
                                <option key={v.id} value={v.id}>
                                    {i + 1}. {v.name} ({v.city})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Quick Box Office KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-800/80 border border-zinc-700/60 p-3 rounded-xl">
                    <p className="text-xs text-zinc-400">Gross Revenue</p>
                    <p className="text-xl font-black text-green-400 mt-0.5">${formatNumber(venueGross)}</p>
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/60 p-3 rounded-xl">
                    <p className="text-xs text-zinc-400">Tickets Sold</p>
                    <p className="text-xl font-black text-white mt-0.5">{formatNumber(totalTicketsSold)} <span className="text-xs text-zinc-400 font-normal">/ {formatNumber(venueCapacity)}</span></p>
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/60 p-3 rounded-xl">
                    <p className="text-xs text-zinc-400">Sell-Through</p>
                    <p className="text-xl font-black text-blue-400 mt-0.5">{attendancePercent}%</p>
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/60 p-3 rounded-xl">
                    <p className="text-xs text-zinc-400">Avg Ticket Price</p>
                    <p className="text-xl font-black text-white mt-0.5">${baseTicketPrice}</p>
                </div>
            </div>

            {/* Main Interactive Grid: Seat Map on Left, Section & Tier Breakdown on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* SVG Seating Map Card */}
                <div className="lg:col-span-8 bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-4 flex flex-col">
                    {/* Controls & Level Filter Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-zinc-700/50">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {[
                                { key: 'all', label: 'All Levels' },
                                { key: 'floor', label: 'Floor & Pit' },
                                { key: 'lower', label: 'Lower Bowl' },
                                { key: 'club', label: 'Club Suites' },
                                { key: 'upper', label: 'Upper Deck' }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setSelectedLevel(filter.key as any)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                                        selectedLevel === filter.key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1.5 ml-auto">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.8, prev - 0.15))}
                                className="w-7 h-7 flex items-center justify-center bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-bold"
                                title="Zoom Out"
                            >
                                -
                            </button>
                            <button 
                                onClick={() => setZoom(1)}
                                className="px-2 h-7 flex items-center justify-center bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold"
                                title="Reset Zoom"
                            >
                                {Math.round(zoom * 100)}%
                            </button>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.8, prev + 0.15))}
                                className="w-7 h-7 flex items-center justify-center bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-bold"
                                title="Zoom In"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Interactive SVG Stadium Viewport */}
                    <div className="relative w-full aspect-[4/3] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                        <div 
                            className="w-full h-full flex items-center justify-center transition-transform duration-200"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <svg
                                viewBox="0 0 1000 860"
                                className="w-full h-full max-h-[560px] select-none"
                            >
                                <defs>
                                    {/* Subtle Stage Gradient */}
                                    <linearGradient id="stageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#1e293b" />
                                        <stop offset="100%" stopColor="#0f172a" />
                                    </linearGradient>
                                    <linearGradient id="ledScreen" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="50%" stopColor="#60a5fa" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>

                                {/* Stadium Floor Outline */}
                                <rect x="30" y="30" width="940" height="800" rx="160" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                                <ellipse cx="500" cy="460" rx="360" ry="320" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

                                {/* STAGE PRODUCTION (At top of arena) */}
                                <g id="stage-production">
                                    {/* Main Stage backdrop */}
                                    <rect x="330" y="75" width="340" height="20" rx="3" fill="url(#ledScreen)" opacity="0.9" />
                                    <text x="500" y="89" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="2">ULTRA-HD STAGE LED WALL</text>

                                    {/* A-Stage Structure */}
                                    <polygon points="360,98 640,98 615,185 385,185" fill="url(#stageGrad)" stroke="#38bdf8" strokeWidth="2" />
                                    <text x="500" y="145" fill="#f8fafc" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="1">MAIN STAGE</text>

                                    {/* Catwalk Runway */}
                                    <rect x="475" y="185" width="50" height="95" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />

                                    {/* B-Stage Diamond */}
                                    <polygon points="500,280 545,320 500,360 455,320" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                                    <text x="500" y="324" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">B-STAGE</text>

                                    {/* FOH Sound Mix Console */}
                                    <rect x="460" y="595" width="80" height="28" rx="4" fill="#18181b" stroke="#52525b" strokeWidth="1" />
                                    <text x="500" y="613" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle">FOH SOUND</text>
                                </g>

                                {/* SEATING SECTIONS */}
                                <g id="seating-sections">
                                    {sectionsWithStats.map(sec => {
                                        const isSelected = selectedSectionId === sec.id;
                                        const isHovered = hoveredSectionId === sec.id;
                                        const isDimmed = selectedLevel !== 'all' && selectedLevel !== sec.level;

                                        // Determine section base color
                                        let fillColor = '#3b82f6';
                                        let strokeColor = '#60a5fa';
                                        if (sec.tier === 'vip') {
                                            fillColor = '#f59e0b';
                                            strokeColor = '#fbbf24';
                                        } else if (sec.tier === 'pit') {
                                            fillColor = '#10b981';
                                            strokeColor = '#34d399';
                                        } else if (sec.tier === 'club') {
                                            fillColor = '#8b5cf6';
                                            strokeColor = '#a78bfa';
                                        } else if (sec.tier === 'upper') {
                                            fillColor = '#475569';
                                            strokeColor = '#94a3b8';
                                        }

                                        const fillOpacity = isSelected ? 0.85 : isHovered ? 0.65 : (isDimmed ? 0.12 : 0.32);
                                        const strokeOpacity = isDimmed ? 0.2 : 0.8;

                                        return (
                                            <g 
                                                key={sec.id}
                                                className="cursor-pointer transition-all duration-150"
                                                onClick={() => setSelectedSectionId(sec.id)}
                                                onMouseEnter={() => setHoveredSectionId(sec.id)}
                                                onMouseLeave={() => setHoveredSectionId(null)}
                                            >
                                                <path
                                                    d={sec.path}
                                                    fill={fillColor}
                                                    fillOpacity={fillOpacity}
                                                    stroke={isSelected ? '#ffffff' : strokeColor}
                                                    strokeWidth={isSelected ? 3 : 1.2}
                                                    strokeOpacity={strokeOpacity}
                                                />
                                                {!isDimmed && (
                                                    <text
                                                        x={sec.textX}
                                                        y={sec.textY}
                                                        fill={isSelected ? '#ffffff' : '#cbd5e1'}
                                                        fontSize={sec.tier === 'vip' || sec.tier === 'pit' ? 10 : 9}
                                                        fontWeight={isSelected ? 'bold' : 'normal'}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        pointerEvents="none"
                                                    >
                                                        {sec.id}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>
                        </div>

                        {/* Interactive Tooltip on Hover */}
                        {hoveredSectionId && (
                            <div className="absolute bottom-3 left-3 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg pointer-events-none">
                                <span className="font-bold">{sectionsWithStats.find(s => s.id === hoveredSectionId)?.name}</span>
                                <span className="text-zinc-400 ml-2">Click to inspect</span>
                            </div>
                        )}
                    </div>

                    {/* Color Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-zinc-700/50 text-[11px] text-zinc-300">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                            <span>VIP Pit (${tierSummaries[0]?.price})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                            <span>Floor GA (${tierSummaries[1]?.price})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
                            <span>Lower Bowl (${tierSummaries[2]?.price})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
                            <span>Club Suites (${tierSummaries[3]?.price})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                            <span>Upper Deck (${tierSummaries[4]?.price})</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Selected Section Inspector & Pricing Breakdown */}
                <div className="lg:col-span-4 flex flex-col space-y-4">
                    {/* Selected Section Inspector Card */}
                    <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{selectedSection.tierName}</span>
                                <h3 className="text-lg font-black text-white">{selectedSection.name}</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-700 text-zinc-200">
                                {selectedSection.id}
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs mt-3 pt-3 border-t border-zinc-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Ticket Price:</span>
                                <span className="font-bold text-white text-sm">${selectedSection.price}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Capacity:</span>
                                <span className="font-semibold text-white">{formatNumber(selectedSection.scaledCap)} seats</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Tickets Sold:</span>
                                <span className="font-semibold text-emerald-400">{formatNumber(selectedSection.sold)} ({selectedSection.percentSold}%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Section Gross:</span>
                                <span className="font-bold text-green-400">${formatNumber(selectedSection.gross)}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-1">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${selectedSection.percentSold}%` }}
                                ></div>
                            </div>

                            <div className="pt-2 text-zinc-400 border-t border-zinc-700/40">
                                <p><strong className="text-zinc-300">Distance to Stage:</strong> ~{selectedSection.distanceMeters} meters</p>
                                <p className="mt-0.5"><strong className="text-zinc-300">Sightline:</strong> {selectedSection.viewQuality}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Tiers & Inventory Availability */}
                    <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-4 flex-grow">
                        <h4 className="text-sm font-bold text-white mb-3">Price Levels & Availability</h4>
                        <div className="space-y-3">
                            {tierSummaries.map(tier => {
                                const percent = tier.count > 0 ? Math.round((tier.sold / tier.count) * 100) : 0;
                                return (
                                    <div key={tier.key} className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/40 space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }}></span>
                                                <span className="font-bold text-white">{tier.name}</span>
                                            </div>
                                            <span className="font-bold text-zinc-200">${tier.price}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-zinc-400">
                                            <span>Sold: {formatNumber(tier.sold)} / {formatNumber(tier.count)}</span>
                                            <span className={percent >= 98 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                                                {percent >= 98 ? 'Sold Out' : `${percent}%`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-1.5 rounded-full transition-all"
                                                style={{ width: `${percent}%`, backgroundColor: tier.color }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TouringView;
