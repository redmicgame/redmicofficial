

import React, { useState, useMemo } from 'react';
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

    if (!submission) {
        return <div className="p-4">Submission not found.</div>;
    }

    const maxSingles = submission.release.type === 'Album' ? 3 : 1;

    const handleToggleSingle = (songId: string) => {
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
    
    const recommendedSingleIds = useMemo(() => new Set(submission.recommendedSingles?.map(s => s.songId) || []), [submission]);

    return (
        <div className="h-full w-full bg-zinc-900 flex flex-col">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Plan Release: {submission.release.title}</h1>
                    {isSigned && (
                        <p className="text-xs text-emerald-400 font-medium">Signed to {labelName} &bull; Friday Releases Only</p>
                    )}
                </div>
            </header>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                {isSigned && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                        <span className="text-base">📅</span>
                        <div>
                            <p className="font-bold text-white">Label Release Policy</p>
                            <p className="mt-0.5 text-zinc-300">
                                As an artist signed to <strong className="text-emerald-300">{labelName}</strong>, your singles and project must be scheduled on <strong className="text-emerald-300">Fridays (New Music Friday)</strong>. Tap any highlighted Friday on the calendar to schedule.
                            </p>
                        </div>
                    </div>
                )}

                {submission.release.type !== 'Single' && (
                <div>
                    <h2 className="text-lg font-bold">1. Select Pre-Release Singles ({selectedSingles.size}/{maxSingles})</h2>
                    <p className="text-sm text-zinc-400">Your label recommends releasing {submission.recommendedSingles?.length || 0} single{submission.recommendedSingles?.length !== 1 ? 's' : ''}.</p>
                    <div className="mt-2 max-h-60 overflow-y-auto space-y-2 bg-zinc-800 p-2 rounded-lg">
                        {projectSongs.map(song => (
                            <button key={song.id} onClick={() => handleToggleSingle(song.id)} className={`w-full p-2 rounded-md text-left flex items-center gap-3 transition-colors ${selectedSingles.has(song.id) ? 'bg-red-500/20' : 'hover:bg-zinc-700'}`}>
                                <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded-sm object-cover" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{song.title}</p>
                                    {recommendedSingleIds.has(song.id) && (
                                        <span className="text-xs font-bold text-yellow-300 bg-yellow-900/50 px-2 py-0.5 rounded-full">Recommended</span>
                                    )}
                                </div>
                            </button>
                        ))}
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