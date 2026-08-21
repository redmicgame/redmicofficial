

import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { GameDate, Song } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { CalendarDatePicker, formatFullDateString, getDateFromGameWeek, getGameWeekFromDate } from './CalendarDatePicker';
import { LABELS } from '../constants';

const LabelReleasePlanView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();
    const { date, activeSubmissionId } = gameState;
    const { songs, labelSubmissions, contract } = activeArtistData!;

    const submission = useMemo(() => {
        return labelSubmissions.find(s => s.id === activeSubmissionId);
    }, [labelSubmissions, activeSubmissionId]);

    const projectSongs = useMemo(() => {
        if (!submission) return [];
        return submission.release.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
    }, [submission, songs]);

    const isSigned = !!contract;
    const labelName = contract?.isCustom
        ? (gameState.customLabels?.find(l => l.id === contract.labelId)?.name || 'Custom Label')
        : (LABELS.find(l => l.id === contract?.labelId)?.name || 'Record Label');

    const creativeControl = isSigned ? (contract.creativeControl || 'Medium') : 'High';

    const recommendedSingles = useMemo<{ songId: string; reason: string }[]>(() => {
        if (!submission) return [];
        if (submission.recommendedSingles && submission.recommendedSingles.length > 0) {
            return submission.recommendedSingles;
        }
        if (projectSongs.length <= 1) return [];
        const sorted = [...projectSongs].sort((a, b) => (b.quality || 0) - (a.quality || 0));
        const numToRec = submission.release.type === 'Album' ? (sorted.length > 4 ? 2 : 1) : 1;
        const reasons = [
            "Highest commercial appeal & radio viability",
            "Strongest melodic hook & algorithmic playlist potential",
            "A&R consensus choice for lead promotional push"
        ];
        return sorted.slice(0, numToRec).map((s, idx) => ({
            songId: s.id,
            reason: reasons[idx % reasons.length]
        }));
    }, [submission, projectSongs]);

    const recommendedSingleMap = useMemo(() => {
        return new Map(recommendedSingles.map(r => [r.songId, r.reason]));
    }, [recommendedSingles]);

    const isForcedByContract = isSigned && !contract.isCustom && creativeControl === 'Low' && recommendedSingles.length > 0 && submission?.release.type !== 'Single';

    interface SinglePlanData {
        date: GameDate;
        singleType: 'lead' | 'standalone' | 'interlude';
        eraImages: string[];
    }
    const [selectedSingles, setSelectedSingles] = useState<Map<string, SinglePlanData>>(new Map());
    const [activeCalendarForSingle, setActiveCalendarForSingle] = useState<string | null>(null);

    const isFriday = (d: GameDate) => {
        const dateObj = getDateFromGameWeek(d.year, d.week, d.day || 1);
        return dateObj.getDay() === 5;
    };

    const getDefaultFridayDate = (weeksAhead: number): GameDate => {
        const currentRealDate = getDateFromGameWeek(date.year, date.week, date.day || 1);
        const targetRealDate = new Date(currentRealDate);
        targetRealDate.setDate(targetRealDate.getDate() + weeksAhead * 7);
        const currentDay = targetRealDate.getDay();
        const distanceToFriday = (5 - currentDay + 7) % 7;
        targetRealDate.setDate(targetRealDate.getDate() + distanceToFriday);
        const { week, year, day } = getGameWeekFromDate(targetRealDate);
        return { week, year, day };
    };

    const nextWeek = { week: date.week === 52 ? 1 : date.week + 1, year: date.week === 52 ? date.year + 1 : date.year, day: 1 };
    const [projectDate, setProjectDate] = useState<GameDate>(() => isSigned ? getDefaultFridayDate(8) : { week: Math.min(52, nextWeek.week + 8), year: nextWeek.year, day: 1 });
    const [projectSingleType, setProjectSingleType] = useState<'lead' | 'standalone' | 'interlude'>('standalone');
    const [projectEraImages, setProjectEraImages] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isForcedByContract && recommendedSingles.length > 0 && selectedSingles.size === 0) {
            const initialMap = new Map<string, SinglePlanData>();
            recommendedSingles.forEach((rec, idx) => {
                const fridayDate = isSigned
                    ? getDefaultFridayDate((idx + 1) * 2)
                    : { week: Math.min(52, nextWeek.week + ((idx + 1) * 2)), year: nextWeek.year, day: 1 };
                initialMap.set(rec.songId, { date: fridayDate, singleType: 'lead', eraImages: [] });
            });
            setSelectedSingles(initialMap);
        }
    }, [isForcedByContract, recommendedSingles]);

    if (!submission) {
        return <div className="p-4">Submission not found.</div>;
    }

    const maxSingles = submission.release.type === 'Album' ? 3 : 1;

    const handleToggleSingle = (songId: string) => {
        if (isForcedByContract) {
            const mandatedTitles = recommendedSingles.map(r => projectSongs.find(s => s.id === r.songId)?.title).filter(Boolean).join(', ');
            setError(`Under your contract terms with ${labelName} (Low Creative Control), single selection is mandated by the label. You are required to release "${mandatedTitles}" as your lead single.`);
            return;
        }
        setError('');
        const newSelection = new Map(selectedSingles);
        if (newSelection.has(songId)) {
            newSelection.delete(songId);
        } else {
            if (newSelection.size < maxSingles) {
                const newDate = isSigned
                    ? getDefaultFridayDate((newSelection.size + 1) * 2)
                    : { week: Math.min(52, nextWeek.week + (newSelection.size * 2)), year: nextWeek.year, day: 1 };
                newSelection.set(songId, { date: newDate, singleType: 'lead', eraImages: [] });
            }
        }
        setSelectedSingles(newSelection);
    };

    const handleSingleDateChange = (songId: string, newDate: GameDate) => {
        const newSelection = new Map(selectedSingles);
        const current = newSelection.get(songId);
        if (current) {
            newSelection.set(songId, { ...current, date: newDate });
        }
        setSelectedSingles(newSelection);
        setActiveCalendarForSingle(null);
    };

    const handleSubmit = () => {
        setError('');
        const singleDates: GameDate[] = Array.from(selectedSingles.values()).map(s => s.date);
        
        // Validation
        const toTotalDays = (d: GameDate) => d.year * 364 + (d.week - 1) * 7 + (d.day || 1);
        const nowTotalDays = toTotalDays(date);

        for (const singleDate of singleDates) {
            if (toTotalDays(singleDate) <= nowTotalDays) {
                setError('All single release dates must be in the future.'); return;
            }
            if (toTotalDays(singleDate) >= toTotalDays(projectDate)) {
                setError('All singles must be released before the main project.'); return;
            }

            if (isSigned && !isFriday(singleDate)) {
                setError(`${labelName} requires all single releases to drop on Friday (New Music Friday).`);
                return;
            }
        }
        if(toTotalDays(projectDate) <= nowTotalDays) {
            setError('Project release date must be in the future.'); return;
        }
        if (isSigned && !isFriday(projectDate)) {
            setError(`${labelName} requires project releases to drop on Friday (New Music Friday).`);
            return;
        }

        // Check for date clashes
        const allDates = [...singleDates, projectDate];
        const uniqueDates = new Set(allDates.map(d => `${d.year}-${d.week}`));
        if(uniqueDates.size !== allDates.length) {
            setError('Each release (single or project) must have a unique release week.'); return;
        }

        dispatch({
            type: 'PLAN_LABEL_RELEASE',
            payload: {
                submissionId: submission.id,
                singles: Array.from(selectedSingles.entries()).map(([songId, data]) => ({ songId, releaseDate: data.date, singleType: data.singleType, eraImages: data.eraImages })),
                projectReleaseDate: projectDate,
                projectSingleType: submission.release.type === 'Single' ? projectSingleType : undefined,
                projectEraImages: submission.release.type === 'Single' ? projectEraImages : undefined,
            }
        });
    };

    return (
        <div className="h-full w-full bg-zinc-900 flex flex-col">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Plan Release: {submission.release.title}</h1>
                    {isSigned && (
                        <p className="text-xs text-emerald-400 font-medium">Signed to {labelName} &bull; Friday Releases Only &bull; {creativeControl} Creative Control</p>
                    )}
                </div>
            </header>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                {isSigned && (
                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                        <span className="text-base">📅</span>
                        <div>
                            <p className="font-bold text-white">Label Release Policy</p>
                            <p className="mt-0.5 text-zinc-300">
                                As an artist signed to <strong className="text-emerald-300">{labelName}</strong>, your singles and project must be scheduled on <strong className="text-emerald-300">Fridays (New Music Friday)</strong>. Tap any highlighted Friday on the calendar to schedule.
                            </p>
                        </div>
                    </div>
                )}

                {/* Contract Single Mandate / Recommendation Banner */}
                {submission.release.type !== 'Single' && recommendedSingles.length > 0 && (
                    <>
                        {isForcedByContract ? (
                            <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-3">
                                <span className="text-xl">🔒</span>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-red-100 text-sm">Mandatory Single Selection (Low Creative Control)</p>
                                        <span className="px-2 py-0.5 rounded bg-red-800 text-red-100 font-mono text-[10px] font-bold">Contract Bound</span>
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed">
                                        Under your contract with <strong className="text-white">{labelName}</strong> (<strong>Low Creative Control</strong>), the label has executive authority over your rollout and requires releasing <strong className="text-yellow-300">{recommendedSingles.map(r => `"${projectSongs.find(s => s.id === r.songId)?.title}"`).join(' and ')}</strong> as your lead single{recommendedSingles.length > 1 ? 's' : ''}. You cannot substitute other tracks.
                                    </p>
                                    <div className="pt-1 flex flex-col gap-1">
                                        {recommendedSingles.map(rec => (
                                            <div key={rec.songId} className="text-[11px] text-zinc-400 bg-black/30 p-1.5 rounded border border-red-900/40">
                                                🎯 <span className="font-semibold text-white">{projectSongs.find(s => s.id === rec.songId)?.title}</span>: {rec.reason}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : isSigned && !contract.isCustom && creativeControl === 'Medium' ? (
                            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-3">
                                <span className="text-xl">⚡</span>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-amber-100 text-sm">Label Single Recommendation (Medium Creative Control)</p>
                                        <span className="px-2 py-0.5 rounded bg-amber-800 text-amber-100 font-mono text-[10px] font-bold">Discretionary Choice</span>
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed">
                                        A&amp;R executives at <strong className="text-white">{labelName}</strong> recommend releasing <strong className="text-yellow-300">{recommendedSingles.map(r => `"${projectSongs.find(s => s.id === r.songId)?.title}"`).join(' and ')}</strong> as the lead single{recommendedSingles.length > 1 ? 's' : ''}. With Medium Creative Control, you may follow their recommendation or choose your own track(s).
                                    </p>
                                    <div className="pt-1 flex flex-col gap-1">
                                        {recommendedSingles.map(rec => (
                                            <div key={rec.songId} className="text-[11px] text-zinc-400 bg-black/30 p-1.5 rounded border border-amber-900/40">
                                                💡 <span className="font-semibold text-white">{projectSongs.find(s => s.id === rec.songId)?.title}</span>: {rec.reason}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 bg-blue-950/30 border border-blue-600/30 rounded-xl text-xs text-blue-200 flex items-start gap-3">
                                <span className="text-base">✨</span>
                                <div className="space-y-1 flex-1">
                                    <p className="font-bold text-blue-100">Full Creative Control</p>
                                    <p className="text-zinc-300">
                                        You hold full artistic authority over single selection. {labelName} suggests <strong className="text-blue-300">{recommendedSingles.map(r => `"${projectSongs.find(s => s.id === r.songId)?.title}"`).join(' and ')}</strong>, but the choice is 100% yours.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {submission.release.type !== 'Single' && (
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <h2 className="text-lg font-bold">1. Select Pre-Release Singles ({selectedSingles.size}/{maxSingles})</h2>
                        {isForcedByContract && (
                            <span className="text-xs text-red-400 font-semibold">Selection Locked by Label</span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-400">
                        {isForcedByContract 
                            ? `Your label requires ${recommendedSingles.length} specific track${recommendedSingles.length > 1 ? 's' : ''} to be released as lead single${recommendedSingles.length > 1 ? 's' : ''}.`
                            : `Your label recommends ${recommendedSingles.length} single${recommendedSingles.length !== 1 ? 's' : ''}. Select up to ${maxSingles} singles.`}
                    </p>
                    <div className="mt-3 space-y-2 bg-zinc-800/90 border border-zinc-700/60 p-2.5 rounded-xl max-h-72 overflow-y-auto">
                        {projectSongs.map(song => {
                            const isRecommended = recommendedSingleMap.has(song.id);
                            const recReason = recommendedSingleMap.get(song.id);
                            const isSelected = selectedSingles.has(song.id);
                            const isLockedOut = isForcedByContract && !isRecommended;

                            return (
                                <button 
                                    key={song.id} 
                                    onClick={() => handleToggleSingle(song.id)} 
                                    disabled={isLockedOut}
                                    className={`w-full p-2.5 rounded-lg text-left flex items-center gap-3 transition-all border ${
                                        isSelected 
                                            ? 'bg-blue-900/30 border-blue-500/60 text-white' 
                                            : isLockedOut 
                                                ? 'opacity-40 bg-zinc-800/40 border-zinc-800 cursor-not-allowed' 
                                                : 'hover:bg-zinc-700/60 border-zinc-700/40 text-zinc-200'
                                    }`}
                                >
                                    <img src={song.coverArt} alt={song.title} className="w-11 h-11 rounded-md object-cover flex-shrink-0" />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm truncate">{song.title}</p>
                                            {isRecommended && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isForcedByContract
                                                        ? 'text-red-200 bg-red-900/60 border border-red-500/40'
                                                        : 'text-yellow-300 bg-yellow-900/50 border border-yellow-500/40'
                                                }`}>
                                                    {isForcedByContract ? '🔒 Label Mandate' : '⭐ Label Pick'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                            Quality: {song.quality || 50} • {song.genre || 'Pop'}
                                            {recReason && <span className="text-zinc-300 ml-1.5">• {recReason}</span>}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 pl-2">
                                        {isSelected ? (
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                                        ) : isLockedOut ? (
                                            <span className="text-xs text-zinc-500">🔒</span>
                                        ) : (
                                            <span className="w-6 h-6 rounded-full border border-zinc-500 flex items-center justify-center text-xs text-zinc-400">+</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                )}
                {submission.release.type !== 'Single' && selectedSingles.size > 0 && (
                    <div>
                        <h2 className="text-lg font-bold">2. Schedule Single Releases</h2>
                        <div className="space-y-4 mt-2">
                            {Array.from(selectedSingles.entries()).map(([songId, data]) => {
                                const song = projectSongs.find(s => s.id === songId);
                                const isCalendarOpen = activeCalendarForSingle === songId;

                                return (
                                    <div key={songId} className="bg-zinc-800/90 border border-zinc-700/60 p-3.5 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <img src={song?.coverArt} alt={song?.title} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                                                <p className="font-semibold text-white truncate">{song?.title}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveCalendarForSingle(isCalendarOpen ? null : songId)}
                                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                                            >
                                                <span>📅</span>
                                                <span>{formatFullDateString(data.date)}</span>
                                            </button>
                                        </div>

                                        {isCalendarOpen && (
                                            <div className="mt-2">
                                                <CalendarDatePicker
                                                    currentDate={date}
                                                    selectedDate={data.date}
                                                    onSelectDate={(newDate) => handleSingleDateChange(songId, newDate)}
                                                    isSigned={isSigned}
                                                    labelName={labelName}
                                                    title={`Select Friday Release Date for "${song?.title}"`}
                                                    onClose={() => setActiveCalendarForSingle(null)}
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <select 
                                                value={data.singleType} 
                                                onChange={(e) => {
                                                    const newSelection = new Map(selectedSingles);
                                                    const current = newSelection.get(songId);
                                                    if (current) {
                                                        newSelection.set(songId, { ...current, singleType: e.target.value as any });
                                                    }
                                                    setSelectedSingles(newSelection);
                                                }}
                                                className="w-full bg-zinc-700 text-white p-2 rounded-md text-sm"
                                            >
                                                <option value="lead">Lead Single (must be added to your next album)</option>
                                                <option value="standalone">Standalone Single</option>
                                                <option value="interlude">Interlude (-50% streams permanently)</option>
                                            </select>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-zinc-400">Era Images (Optional)</label>
                                                <div className="flex gap-2">
                                                    {[0, 1, 2].map((idx) => (
                                                        <div key={idx} className="flex-1">
                                                            {data.eraImages[idx] ? (
                                                                <div className="relative aspect-square">
                                                                    <img src={data.eraImages[idx]} className="w-full h-full object-cover rounded-md" />
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newSelection = new Map(selectedSingles);
                                                                            const current = newSelection.get(songId);
                                                                            if (current) {
                                                                                const newImages = [...current.eraImages];
                                                                                newImages.splice(idx, 1);
                                                                                newSelection.set(songId, { ...current, eraImages: newImages });
                                                                                setSelectedSingles(newSelection);
                                                                            }
                                                                        }}
                                                                        className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold cursor-pointer z-10"
                                                                    >✕</button>
                                                                </div>
                                                            ) : (
                                                                <label className="w-full aspect-square bg-zinc-700 hover:bg-zinc-600 rounded-md flex items-center justify-center cursor-pointer border border-dashed border-zinc-500">
                                                                    <span className="text-xl text-zinc-400">+</span>
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onload = (ev) => {
                                                                                const url = ev.target?.result as string;
                                                                                const newSelection = new Map(selectedSingles);
                                                                                const current = newSelection.get(songId);
                                                                                if (current) {
                                                                                    const newImages = [...current.eraImages];
                                                                                    newImages[idx] = url;
                                                                                    newSelection.set(songId, { ...current, eraImages: newImages });
                                                                                    setSelectedSingles(newSelection);
                                                                                }
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }} />
                                                                </label>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                 <div className="space-y-3">
                    <h2 className="text-lg font-bold">
                        {submission.release.type === 'Single' ? '1. Schedule Single Release' : '3. Schedule Project Release'}
                    </h2>
                    <CalendarDatePicker
                        currentDate={date}
                        selectedDate={projectDate}
                        onSelectDate={(newDate) => setProjectDate(newDate)}
                        isSigned={isSigned}
                        labelName={labelName}
                        title={`Select ${isSigned ? 'Friday ' : ''}Date for "${submission.release.title}"`}
                    />

                    {submission.release.type === 'Single' && (
                        <div className="mt-4 flex flex-col gap-2">
                            <select 
                                value={projectSingleType} 
                                onChange={(e) => setProjectSingleType(e.target.value as any)}
                                className="w-full bg-zinc-700 text-white p-2 rounded-md text-sm"
                            >
                                <option value="lead">Lead Single (must be added to your next album)</option>
                                <option value="standalone">Standalone Single</option>
                                <option value="interlude">Interlude (-50% streams permanently)</option>
                            </select>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-zinc-400">Era Images (Optional)</label>
                                <div className="flex gap-2">
                                    {[0, 1, 2].map((idx) => (
                                        <div key={idx} className="flex-1">
                                            {projectEraImages[idx] ? (
                                                <div className="relative aspect-square">
                                                    <img src={projectEraImages[idx]} className="w-full h-full object-cover rounded-md" />
                                                    <button 
                                                        onClick={() => {
                                                            const newImages = [...projectEraImages];
                                                            newImages.splice(idx, 1);
                                                            setProjectEraImages(newImages);
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold cursor-pointer z-10"
                                                    >✕</button>
                                                </div>
                                            ) : (
                                                <label className="w-full aspect-square bg-zinc-700 hover:bg-zinc-600 rounded-md flex items-center justify-center cursor-pointer border border-dashed border-zinc-500">
                                                    <span className="text-xl text-zinc-400">+</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                const url = ev.target?.result;
                                                                const newImages = [...projectEraImages];
                                                                newImages[idx] = url;
                                                                setProjectEraImages(newImages);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
            <div className="p-4 border-t border-zinc-700/50">
                <button onClick={handleSubmit} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20">
                    Confirm Release Plan
                </button>
            </div>
        </div>
    );
};

export default LabelReleasePlanView;