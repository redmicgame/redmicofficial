import React, { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    ChevronDown, 
    ChevronUp, 
    Music, 
    Disc, 
    Check, 
    X, 
    Sparkles, 
    SlidersHorizontal,
    Layers,
    Upload,
    Camera
} from 'lucide-react';
import { NPC_ARTIST_IMAGES } from '../constants';

export interface AutoWriteSample {
    songTitle: string;
    artistName: string;
    type: 'Sample' | 'Interpolation';
    coverArt: string;
}

export interface AutoWriteTrack {
    id: string;
    title: string;
    duration: number; // in milliseconds or seconds
    explicit: boolean;
    producers: string[];
    songwriters: string[];
    samples: AutoWriteSample[];
}

interface Props {
    tracks: AutoWriteTrack[];
    onChangeTracks: (tracks: AutoWriteTrack[]) => void;
    potentialProducers: string[];
    potentialCollaborators: string[];
    allPlayerArtists: any[];
}

export const AutoWriteTracklistPreview: React.FC<Props> = ({
    tracks,
    onChangeTracks,
    potentialProducers,
    potentialCollaborators,
    allPlayerArtists,
}) => {
    const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
    const [showBatchModal, setShowBatchModal] = useState(false);

    // Track editing local inputs
    const [customProducerInput, setCustomProducerInput] = useState('');
    const [customSongwriterInput, setCustomSongwriterInput] = useState('');

    // Sample form state for the currently expanded track
    const [sampleType, setSampleType] = useState<'Sample' | 'Interpolation'>('Sample');
    const [sampleSongTitle, setSampleSongTitle] = useState('');
    const [sampleArtistName, setSampleArtistName] = useState('');
    const [sampleCoverDataUrl, setSampleCoverDataUrl] = useState('');
    const sampleFileInputRef = React.useRef<HTMLInputElement>(null);
    const existingSampleFileRef = React.useRef<HTMLInputElement>(null);
    const [targetExistingSample, setTargetExistingSample] = useState<{ trackId: string; sampleIdx: number } | null>(null);

    const handleSampleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const res = ev.target?.result as string;
                if (res) {
                    setSampleCoverDataUrl(res);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExistingSampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && targetExistingSample) {
            const { trackId, sampleIdx } = targetExistingSample;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const res = ev.target?.result as string;
                if (res) {
                    updateSingleTrack(trackId, t => {
                        const nextSamples = [...(t.samples || [])];
                        if (nextSamples[sampleIdx]) {
                            nextSamples[sampleIdx] = { ...nextSamples[sampleIdx], coverArt: res };
                        }
                        return { ...t, samples: nextSamples };
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Batch apply state
    const [batchProducer, setBatchProducer] = useState('');
    const [batchSongwriter, setBatchSongwriter] = useState('');

    const formatDuration = (val: number) => {
        const totalSec = val > 1000 ? Math.floor(val / 1000) : Math.floor(val || 180);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const updateSingleTrack = (trackId: string, updater: (t: AutoWriteTrack) => AutoWriteTrack) => {
        onChangeTracks(tracks.map(t => t.id === trackId ? updater(t) : t));
    };

    const handleRemoveTrack = (trackId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tracks.length <= 1) {
            alert('An album must have at least one track.');
            return;
        }
        onChangeTracks(tracks.filter(t => t.id !== trackId));
        if (expandedTrackId === trackId) setExpandedTrackId(null);
    };

    const handleAddNewTrack = () => {
        const newTrackNum = tracks.length + 1;
        const newTrack: AutoWriteTrack = {
            id: crypto.randomUUID(),
            title: `New Track ${newTrackNum}`,
            duration: 180000,
            explicit: false,
            producers: [],
            songwriters: [],
            samples: []
        };
        onChangeTracks([...tracks, newTrack]);
        setExpandedTrackId(newTrack.id);
    };

    const handleAddProducerToTrack = (trackId: string, producerName: string) => {
        const trimmed = producerName.trim();
        if (!trimmed) return;
        updateSingleTrack(trackId, t => {
            if (t.producers.includes(trimmed)) return t;
            return { ...t, producers: [...t.producers, trimmed] };
        });
        setCustomProducerInput('');
    };

    const handleRemoveProducerFromTrack = (trackId: string, producerName: string) => {
        updateSingleTrack(trackId, t => ({
            ...t,
            producers: t.producers.filter(p => p !== producerName)
        }));
    };

    const handleAddSongwriterToTrack = (trackId: string, writerName: string) => {
        const trimmed = writerName.trim();
        if (!trimmed) return;
        updateSingleTrack(trackId, t => {
            if (t.songwriters.includes(trimmed)) return t;
            return { ...t, songwriters: [...t.songwriters, trimmed] };
        });
        setCustomSongwriterInput('');
    };

    const handleRemoveSongwriterFromTrack = (trackId: string, writerName: string) => {
        updateSingleTrack(trackId, t => ({
            ...t,
            songwriters: t.songwriters.filter(w => w !== writerName)
        }));
    };

    const resolveSampleCoverArt = (artistName: string, customImage?: string) => {
        if (customImage && customImage.trim()) return customImage.trim();
        const p = allPlayerArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
        if (p?.image) return p.image;
        if (NPC_ARTIST_IMAGES[artistName]) return NPC_ARTIST_IMAGES[artistName];
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=random&color=fff`;
    };

    const handleAddSampleToTrack = (trackId: string) => {
        if (!sampleSongTitle.trim() || !sampleArtistName.trim()) return;
        const coverArt = resolveSampleCoverArt(sampleArtistName.trim(), sampleCoverDataUrl);

        const newSample: AutoWriteSample = {
            songTitle: sampleSongTitle.trim(),
            artistName: sampleArtistName.trim(),
            type: sampleType,
            coverArt
        };

        updateSingleTrack(trackId, t => ({
            ...t,
            samples: [...(t.samples || []), newSample]
        }));

        // Reset form
        setSampleSongTitle('');
        setSampleArtistName('');
        setSampleCoverDataUrl('');
        if (sampleFileInputRef.current) {
            sampleFileInputRef.current.value = '';
        }
    };

    const handleRemoveSampleFromTrack = (trackId: string, index: number) => {
        updateSingleTrack(trackId, t => {
            const nextSamples = [...(t.samples || [])];
            nextSamples.splice(index, 1);
            return { ...t, samples: nextSamples };
        });
    };

    const handleBatchApply = () => {
        if (!batchProducer && !batchSongwriter) return;
        onChangeTracks(tracks.map(t => {
            const producers = [...t.producers];
            if (batchProducer && !producers.includes(batchProducer)) {
                producers.push(batchProducer);
            }
            const songwriters = [...t.songwriters];
            if (batchSongwriter && !songwriters.includes(batchSongwriter)) {
                songwriters.push(batchSongwriter);
            }
            return { ...t, producers, songwriters };
        }));
        setBatchProducer('');
        setBatchSongwriter('');
        setShowBatchModal(false);
    };

    return (
        <div className="space-y-4">
            {/* Header with Stats & Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700/80 pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#12FF80] bg-[#12FF80]/10 px-2 py-0.5 rounded border border-[#12FF80]/20">
                        Tracklist Preview
                    </span>
                    <span className="text-sm font-semibold text-zinc-300">
                        {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowBatchModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                        title="Add common producers or songwriters to all tracks"
                    >
                        <Layers className="w-3.5 h-3.5 text-[#12FF80]" />
                        Apply Credits to All
                    </button>
                    <button
                        type="button"
                        onClick={handleAddNewTrack}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-800 hover:bg-zinc-700 text-[#12FF80] border border-zinc-700 hover:border-[#12FF80]/40 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Track
                    </button>
                </div>
            </div>

            {/* Batch Credits Modal */}
            {showBatchModal && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#12FF80]" />
                            <span className="font-bold text-sm text-white">Apply Credits Across Entire Album</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setShowBatchModal(false)}
                            className="text-zinc-400 hover:text-white p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-zinc-400 text-xs">
                        Quickly append executive producers or songwriters to every track on the album at once. You can still customize individual tracks below.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-zinc-300 font-semibold mb-1">Add Producer to All Tracks</label>
                            <div className="flex gap-1.5">
                                <select 
                                    value={batchProducer}
                                    onChange={e => setBatchProducer(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-white"
                                >
                                    <option value="">Select Producer...</option>
                                    {potentialProducers.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-zinc-300 font-semibold mb-1">Add Songwriter to All Tracks</label>
                            <div className="flex gap-1.5">
                                <select 
                                    value={batchSongwriter}
                                    onChange={e => setBatchSongwriter(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-white"
                                >
                                    <option value="">Select Songwriter...</option>
                                    {potentialCollaborators.map(w => (
                                        <option key={w} value={w}>{w}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setShowBatchModal(false)}
                            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleBatchApply}
                            disabled={!batchProducer && !batchSongwriter}
                            className="px-4 py-1.5 rounded-md bg-[#12FF80] hover:bg-[#12FF80]/90 text-black font-bold text-xs disabled:opacity-50 transition-colors"
                        >
                            Apply to All Tracks
                        </button>
                    </div>
                </div>
            )}

            {/* Tracklist List */}
            <div className="space-y-2">
                {tracks.map((track, index) => {
                    const isExpanded = expandedTrackId === track.id;
                    const hasCredits = track.producers.length > 0 || track.songwriters.length > 0 || (track.samples && track.samples.length > 0);

                    return (
                        <div 
                            key={track.id}
                            className={`rounded-xl border transition-all ${
                                isExpanded 
                                    ? 'bg-zinc-800/90 border-[#12FF80]/40 shadow-lg' 
                                    : 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800/70 hover:border-zinc-600'
                            }`}
                        >
                            {/* Track Header Row */}
                            <div 
                                className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                                onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="w-6 text-center text-xs font-mono font-bold text-zinc-400">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-white truncate">
                                                {track.title}
                                            </span>
                                            {track.explicit && (
                                                <span className="bg-zinc-700 text-zinc-300 text-[10px] font-bold px-1 rounded uppercase">
                                                    E
                                                </span>
                                            )}
                                        </div>

                                        {/* Metadata Badges preview */}
                                        {hasCredits && (
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                                                {track.producers.length > 0 && (
                                                    <span className="bg-zinc-700/70 text-zinc-300 px-1.5 py-0.5 rounded text-[10px]">
                                                        Prod: <strong className="text-zinc-200">{track.producers.join(', ')}</strong>
                                                    </span>
                                                )}
                                                {track.songwriters.length > 0 && (
                                                    <span className="bg-zinc-700/70 text-zinc-300 px-1.5 py-0.5 rounded text-[10px]">
                                                        Written: <strong className="text-zinc-200">{track.songwriters.join(', ')}</strong>
                                                    </span>
                                                )}
                                                {track.samples && track.samples.length > 0 && (
                                                    <span className="bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border border-purple-700/40">
                                                        <Disc className="w-2.5 h-2.5" />
                                                        {track.samples.length} {track.samples.length === 1 ? 'Sample/Interp' : 'Samples/Interps'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs font-mono text-zinc-400">
                                        {formatDuration(track.duration)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedTrackId(isExpanded ? null : track.id);
                                        }}
                                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                            isExpanded 
                                                ? 'bg-[#12FF80] text-black' 
                                                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white'
                                        }`}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{isExpanded ? 'Done' : 'Edit'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveTrack(track.id, e)}
                                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                                        title="Remove track"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Detailed Track Editor */}
                            {isExpanded && (
                                <div className="p-4 border-t border-zinc-700/70 bg-zinc-900/90 rounded-b-xl space-y-4">
                                    {/* Edit Track Title & Explicit */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                                Track Title
                                            </label>
                                            <input 
                                                type="text"
                                                value={track.title}
                                                onChange={(e) => updateSingleTrack(track.id, t => ({ ...t, title: e.target.value }))}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#12FF80]"
                                                placeholder="Track Title"
                                            />
                                        </div>
                                        <div className="flex items-end pb-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 w-full">
                                                <input 
                                                    type="checkbox"
                                                    checked={track.explicit}
                                                    onChange={(e) => updateSingleTrack(track.id, t => ({ ...t, explicit: e.target.checked }))}
                                                    className="rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-700 w-4 h-4"
                                                />
                                                <span className="text-xs font-semibold text-zinc-300">Explicit Content</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Producers Section */}
                                    <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-200">
                                                Producers
                                            </span>
                                            <span className="text-[11px] text-zinc-400">
                                                {track.producers.length} assigned
                                            </span>
                                        </div>

                                        {/* Current producers chips */}
                                        <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                                            {track.producers.length === 0 ? (
                                                <span className="text-[11px] text-zinc-500 italic">No producers added yet</span>
                                            ) : (
                                                track.producers.map((prod) => (
                                                    <span 
                                                        key={prod}
                                                        className="inline-flex items-center gap-1.5 bg-zinc-700 border border-zinc-600 px-2 py-1 rounded-md text-xs text-white"
                                                    >
                                                        <span>{prod}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveProducerFromTrack(track.id, prod)}
                                                            className="text-zinc-400 hover:text-red-400"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        {/* Add producer controls */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <select 
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) handleAddProducerToTrack(track.id, e.target.value);
                                                }}
                                                className="bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#12FF80] flex-1"
                                            >
                                                <option value="">+ Choose Preset Producer...</option>
                                                {potentialProducers.filter(p => !track.producers.includes(p)).map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-1.5 flex-1">
                                                <input 
                                                    type="text"
                                                    value={customProducerInput}
                                                    onChange={e => setCustomProducerInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddProducerToTrack(track.id, customProducerInput);
                                                        }
                                                    }}
                                                    placeholder="Or type custom producer name..."
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#12FF80]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddProducerToTrack(track.id, customProducerInput)}
                                                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md text-xs font-semibold shrink-0"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Songwriters Section */}
                                    <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-200">
                                                Songwriters
                                            </span>
                                            <span className="text-[11px] text-zinc-400">
                                                {track.songwriters.length} assigned
                                            </span>
                                        </div>

                                        {/* Current songwriters chips */}
                                        <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                                            {track.songwriters.length === 0 ? (
                                                <span className="text-[11px] text-zinc-500 italic">No songwriters added yet</span>
                                            ) : (
                                                track.songwriters.map((writer) => (
                                                    <span 
                                                        key={writer}
                                                        className="inline-flex items-center gap-1.5 bg-zinc-700 border border-zinc-600 px-2 py-1 rounded-md text-xs text-white"
                                                    >
                                                        <span>{writer}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveSongwriterFromTrack(track.id, writer)}
                                                            className="text-zinc-400 hover:text-red-400"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        {/* Add songwriter controls */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <select 
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) handleAddSongwriterToTrack(track.id, e.target.value);
                                                }}
                                                className="bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#12FF80] flex-1"
                                            >
                                                <option value="">+ Choose Preset Songwriter / Artist...</option>
                                                {potentialCollaborators.filter(w => !track.songwriters.includes(w)).map(w => (
                                                    <option key={w} value={w}>{w}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-1.5 flex-1">
                                                <input 
                                                    type="text"
                                                    value={customSongwriterInput}
                                                    onChange={e => setCustomSongwriterInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddSongwriterToTrack(track.id, customSongwriterInput);
                                                        }
                                                    }}
                                                    placeholder="Or type custom songwriter..."
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#12FF80]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSongwriterToTrack(track.id, customSongwriterInput)}
                                                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md text-xs font-semibold shrink-0"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interpolations & Samples Section */}
                                    <div className="bg-zinc-800/60 p-3 rounded-lg border border-purple-700/40 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Disc className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs font-bold text-white">
                                                    Interpolations & Samples
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-purple-300 font-semibold">
                                                {track.samples?.length || 0} credited
                                            </span>
                                        </div>

                                        {/* Hidden file input for changing existing sample covers */}
                                        <input 
                                            ref={existingSampleFileRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleExistingSampleChange}
                                        />

                                        {/* Current Samples List */}
                                        {track.samples && track.samples.length > 0 && (
                                            <div className="space-y-2">
                                                {track.samples.map((s, sIdx) => (
                                                    <div 
                                                        key={sIdx}
                                                        className="flex items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-700/60 p-2 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div 
                                                                className="relative group w-10 h-10 rounded overflow-hidden cursor-pointer shrink-0 border border-zinc-700 hover:border-purple-400 shadow-sm"
                                                                onClick={() => {
                                                                    setTargetExistingSample({ trackId: track.id, sampleIdx: sIdx });
                                                                    existingSampleFileRef.current?.click();
                                                                }}
                                                                title="Tap to change sample image from device"
                                                            >
                                                                <img 
                                                                    src={s.coverArt} 
                                                                    alt={s.songTitle} 
                                                                    className="w-full h-full object-cover bg-zinc-800"
                                                                />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Upload className="w-3.5 h-3.5 text-purple-300" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-white truncate">
                                                                    {s.songTitle}
                                                                </p>
                                                                <p className="text-[11px] text-zinc-400 truncate">
                                                                    {s.artistName}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                                s.type === 'Sample' 
                                                                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40' 
                                                                    : 'bg-purple-900/60 text-purple-300 border border-purple-700/40'
                                                            }`}>
                                                                {s.type}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSampleFromTrack(track.id, sIdx)}
                                                                className="text-zinc-500 hover:text-red-400 p-1"
                                                                title="Remove sample"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Sample Form */}
                                        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg space-y-3">
                                            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 block">
                                                Add Sample or Interpolation to "{track.title}"
                                            </span>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSampleType('Sample')}
                                                    className={`flex-1 py-1 text-xs font-bold rounded border transition-colors ${
                                                        sampleType === 'Sample'
                                                            ? 'bg-emerald-600 text-white border-emerald-500'
                                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                                                    }`}
                                                >
                                                    Sample
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSampleType('Interpolation')}
                                                    className={`flex-1 py-1 text-xs font-bold rounded border transition-colors ${
                                                        sampleType === 'Interpolation'
                                                            ? 'bg-purple-600 text-white border-purple-500'
                                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                                                    }`}
                                                >
                                                    Interpolation
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <input 
                                                    type="text"
                                                    value={sampleSongTitle}
                                                    onChange={e => setSampleSongTitle(e.target.value)}
                                                    placeholder="Original Song Title (e.g. Gimme! Gimme!)"
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                                                />
                                                <input 
                                                    type="text"
                                                    value={sampleArtistName}
                                                    onChange={e => setSampleArtistName(e.target.value)}
                                                    placeholder="Original Artist (e.g. ABBA)"
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>

                                            {/* Upload Cover from Device (NO image link) */}
                                            <div className="bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-700/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div 
                                                        onClick={() => sampleFileInputRef.current?.click()}
                                                        className="group relative w-12 h-12 rounded-lg bg-zinc-700/80 border-2 border-dashed border-zinc-500 hover:border-purple-400 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 transition-all shadow-sm"
                                                        title="Upload image from device"
                                                    >
                                                        {sampleCoverDataUrl ? (
                                                            <img src={sampleCoverDataUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-purple-300">
                                                                <Upload className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Upload className="w-4 h-4 text-purple-300" />
                                                        </div>
                                                    </div>
                                                    <input 
                                                        ref={sampleFileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleSampleFileChange}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-zinc-200">
                                                            {sampleCoverDataUrl ? 'Image Selected from Device' : 'Upload Image from Device'}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => sampleFileInputRef.current?.click()}
                                                                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline text-left"
                                                            >
                                                                {sampleCoverDataUrl ? 'Change image' : 'Choose image file'}
                                                            </button>
                                                            {sampleCoverDataUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSampleCoverDataUrl('');
                                                                        if (sampleFileInputRef.current) sampleFileInputRef.current.value = '';
                                                                    }}
                                                                    className="text-[11px] text-zinc-400 hover:text-red-400"
                                                                >
                                                                    Remove
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] text-zinc-400">
                                                                    (Auto avatar if none chosen)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSampleToTrack(track.id)}
                                                    disabled={!sampleSongTitle.trim() || !sampleArtistName.trim()}
                                                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-md text-xs font-bold shrink-0 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add to Track
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Done Editing Button */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedTrackId(null)}
                                            className="px-4 py-1.5 rounded-lg bg-[#12FF80] text-black font-bold text-xs hover:bg-[#12FF80]/90 transition-colors flex items-center gap-1"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Done with Track
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
