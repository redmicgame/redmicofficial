import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import HeartIcon from './icons/HeartIcon';

interface SymptomOption {
    id: string;
    label: string;
    emoji: string;
}

const SYMPTOM_OPTIONS: SymptomOption[] = [
    { id: 'morning_sickness', label: 'Morning Sickness', emoji: '🤢' },
    { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
    { id: 'cravings', label: 'Food Cravings', emoji: '🍕' },
    { id: 'kicks', label: 'Baby Kicks', emoji: '👶' },
    { id: 'back_pain', label: 'Backache', emoji: '🩺' },
    { id: 'nesting', label: 'Nesting Urge', emoji: '🧹' },
    { id: 'mood_swings', label: 'Mood Swings', emoji: '🎭' },
    { id: 'glow', label: 'Pregnancy Glow', emoji: '✨' },
    { id: 'swollen_ankles', label: 'Swollen Ankles', emoji: '🦶' },
];

interface SizeInfo {
    fruit: string;
    emoji: string;
    length: string;
    weight: string;
    babyMilestone: string;
    bodyMilestone: string;
}

const getWeekDetails = (week: number): SizeInfo => {
    if (week <= 4) {
        return {
            fruit: 'Poppy Seed',
            emoji: '🌱',
            length: '0.1 in',
            weight: '< 0.04 oz',
            babyMilestone: 'The blastocyst implants into the uterus. Neural tube and brain foundations begin forming.',
            bodyMilestone: 'You may notice early fatigue or mild spotting as pregnancy hormones rise.',
        };
    } else if (week <= 8) {
        return {
            fruit: 'Raspberry',
            emoji: '🫐',
            length: '0.6 in',
            weight: '0.04 oz',
            babyMilestone: 'Tiny limb buds are growing, neural tube closes, and tiny heartbeat can be detected!',
            bodyMilestone: 'Morning sickness and heightened sense of smell are common as hCG surges.',
        };
    } else if (week <= 12) {
        return {
            fruit: 'Lime',
            emoji: '🍋',
            length: '2.1 in',
            weight: '0.5 oz',
            babyMilestone: 'Fingernails and reflexes are developing. Baby can open and close tiny hands!',
            bodyMilestone: 'First trimester ends! Nausea starts subsiding, and your uterus rises above pelvis.',
        };
    } else if (week <= 16) {
        return {
            fruit: 'Avocado',
            emoji: '🥑',
            length: '4.6 in',
            weight: '3.5 oz',
            babyMilestone: 'Eyes can move slowly, legs are well-developed, and facial muscles are active.',
            bodyMilestone: 'Second trimester energy surge! Your baby bump is becoming visible to fans.',
        };
    } else if (week <= 20) {
        return {
            fruit: 'Banana',
            emoji: '🍌',
            length: '10.2 in',
            weight: '10.5 oz',
            babyMilestone: 'Baby can hear your singing and music! Eyebrows, eyelashes, and hair grow rapidly.',
            bodyMilestone: 'Halfway mark! Your uterus is level with your belly button. First kicks ("quickening") felt!',
        };
    } else if (week <= 24) {
        return {
            fruit: 'Cantaloupe',
            emoji: '🍈',
            length: '11.8 in',
            weight: '1.3 lbs',
            babyMilestone: 'Taste buds are forming, inner ear develops balance, skin is covered in soft lanugo.',
            bodyMilestone: 'Increased appetite and glowing skin. You can feel rhythmic baby movements.',
        };
    } else if (week <= 28) {
        return {
            fruit: 'Eggplant',
            emoji: '🍆',
            length: '14.8 in',
            weight: '2.2 lbs',
            babyMilestone: 'Baby opens eyes, practices breathing motions, and responds to loud studio music!',
            bodyMilestone: 'Third trimester begins! Backaches and mild pressure as your bump grows proud.',
        };
    } else if (week <= 32) {
        return {
            fruit: 'Squash',
            emoji: '🎃',
            length: '16.7 in',
            weight: '3.8 lbs',
            babyMilestone: 'Bones are fully developed, brain undergoes rapid expansion, practicing swallowing.',
            bodyMilestone: 'Braxton Hicks contractions may occur. Time to organize nursery and name shortlists!',
        };
    } else if (week <= 36) {
        return {
            fruit: 'Honeydew Melon',
            emoji: '🍈',
            length: '18.7 in',
            weight: '5.8 lbs',
            babyMilestone: 'Lungs mature, baby gains fat layer for warmth and drops head-down into pelvis.',
            bodyMilestone: 'Frequent bathroom breaks, nesting instincts, getting ready for labor and birth!',
        };
    } else {
        return {
            fruit: 'Small Watermelon',
            emoji: '🍉',
            length: '20.2 in',
            weight: '7.5 lbs',
            babyMilestone: 'Full term! Baby is ready to enter the world and meet their superstar parent!',
            bodyMilestone: 'Pelvic pressure and readiness. Keep your hospital bag packed and stay rested!',
        };
    }
};

const PregnancyTrackerView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist } = useGame();

    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSymptomModal, setShowSymptomModal] = useState(false);
    const [showBabyModal, setShowBabyModal] = useState(false);
    const [showBodyModal, setShowBodyModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showKickCounter, setShowKickCounter] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);

    // Kick counter state
    const [kickCount, setKickCount] = useState(0);
    const [kickTimer, setKickTimer] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);

    // Baby name candidate state
    const [newNameInput, setNewNameInput] = useState('');

    const pregnancy = activeArtistData?.pregnancy;

    useEffect(() => {
        let interval: any = null;
        if (isTimerActive) {
            interval = setInterval(() => {
                setKickTimer((prev) => prev + 1);
            }, 1000);
        } else if (!isTimerActive && kickTimer !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, kickTimer]);

    if (!pregnancy) {
        return (
            <div className="h-full w-full bg-zinc-950 flex flex-col items-center justify-center text-center p-6 text-white">
                <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-4 border border-pink-500/20 shadow-lg">
                    <span className="text-4xl">👶</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Pregnancy Tracker Locked</h1>
                <p className="text-zinc-400 max-w-md mb-6">
                    This app is only accessible when your artist is expecting a baby.
                </p>
                <button
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition"
                >
                    Back to Game
                </button>
            </div>
        );
    }

    const conceptionWeeks = pregnancy.conceptionDate.year * 52 + pregnancy.conceptionDate.week;
    const currentWeeks = gameState.date.year * 52 + gameState.date.week;
    const rawWeeks = Math.max(1, currentWeeks - conceptionWeeks + 1);
    const week = Math.min(40, rawWeeks);

    const trimester = week <= 12 ? '1st Trimester' : week <= 27 ? '2nd Trimester' : '3rd Trimester';
    const weekInfo = getWeekDetails(week);
    const partner = pregnancy.partnerName || 'Single Parent';

    const handleToggleSymptom = (symptomId: string) => {
        const currentSymptoms = pregnancy.loggedSymptoms || [];
        const exists = currentSymptoms.includes(symptomId);
        const updated = exists
            ? currentSymptoms.filter((s) => s !== symptomId)
            : [...currentSymptoms, symptomId];

        dispatch({
            type: 'UPDATE_PREGNANCY_DETAILS',
            payload: { loggedSymptoms: updated },
        });
    };

    const handleAddBabyName = () => {
        if (!newNameInput.trim()) return;
        const currentNames = pregnancy.candidateNames || [];
        if (!currentNames.includes(newNameInput.trim())) {
            dispatch({
                type: 'UPDATE_PREGNANCY_DETAILS',
                payload: { candidateNames: [...currentNames, newNameInput.trim()] },
            });
        }
        setNewNameInput('');
    };

    const handleRemoveBabyName = (nameToRemove: string) => {
        const currentNames = pregnancy.candidateNames || [];
        dispatch({
            type: 'UPDATE_PREGNANCY_DETAILS',
            payload: { candidateNames: currentNames.filter((n) => n !== nameToRemove) },
        });
    };

    const handleRecordKick = () => {
        if (!isTimerActive) {
            setIsTimerActive(true);
        }
        setKickCount((prev) => prev + 1);
    };

    const handleResetKickCounter = () => {
        setIsTimerActive(false);
        setKickCount(0);
        setKickTimer(0);
    };

    const handleAnnouncePregnancy = () => {
        dispatch({ type: 'REVEAL_PREGNANCY' });
        setShowSettingsModal(false);
    };

    return (
        <div className="h-full w-full bg-zinc-950 overflow-y-auto text-zinc-900 flex flex-col pb-24">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-30 bg-rose-50/90 backdrop-blur-md px-4 py-3 border-b border-rose-200/50 flex items-center justify-between">
                <button
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })}
                    className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm text-zinc-700 transition flex items-center gap-1 text-sm font-semibold"
                >
                    <ArrowLeftIcon className="w-5 h-5" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xl">👶</span>
                    <span className="font-bold text-lg text-rose-900 tracking-tight">BumpTrack</span>
                </div>
                <button
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm"
                >
                    Settings
                </button>
            </div>

            {/* Hero / Visual Fetus Section */}
            <div className="relative w-full bg-gradient-to-b from-rose-100/90 via-amber-50/70 to-rose-50/40 pt-6 pb-12 px-4 rounded-b-[2.5rem] shadow-sm overflow-hidden flex flex-col items-center text-center">
                {/* Background ambient glow */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

                {/* Fetus / Baby Illustration Container */}
                <div className="relative z-10 w-48 h-48 md:w-56 md:h-56 my-2 rounded-full flex items-center justify-center p-4 bg-gradient-to-b from-rose-200/30 to-amber-100/50 backdrop-blur-sm shadow-inner border border-rose-200/60">
                    <div className="relative w-full h-full rounded-full flex flex-col items-center justify-center text-center">
                        <span className="text-7xl md:text-8xl animate-pulse drop-shadow-md">
                            {weekInfo.emoji}
                        </span>
                        <span className="mt-2 text-xs font-bold uppercase tracking-wider text-rose-700 bg-white/80 px-2.5 py-0.5 rounded-full shadow-sm">
                            {weekInfo.fruit}
                        </span>
                    </div>
                </div>

                {/* Week Heading */}
                <div className="relative z-10 flex items-center gap-2 mt-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-rose-950 tracking-tight">
                        {week} weeks
                    </h1>
                    <button
                        onClick={() => setShowInfoModal(true)}
                        className="w-6 h-6 rounded-full bg-white/80 text-rose-800 text-xs font-bold flex items-center justify-center shadow-sm hover:bg-white"
                        title="View Pregnancy Details"
                    >
                        ⓘ
                    </button>
                </div>

                {/* Subtitle Details */}
                <p className="text-xs md:text-sm font-medium text-rose-800/80 mt-1">
                    {trimester} • {partner !== 'Single Parent' ? `With ${partner}` : 'Single Parent'}
                </p>

                {/* Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                    {pregnancy.revealed ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1">
                            ✨ Announced Publicly
                        </span>
                    ) : (
                        <button
                            onClick={handleAnnouncePregnancy}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-md transition animate-bounce"
                        >
                            📣 Announce Pregnancy
                        </button>
                    )}
                </div>
            </div>

            {/* My Daily Insights Section */}
            <div className="p-4 md:p-6 max-w-xl mx-auto w-full">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>My daily insights</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Card 1: Log your symptoms */}
                    <div
                        onClick={() => setShowSymptomModal(true)}
                        className="bg-white hover:bg-rose-50/50 cursor-pointer p-4 rounded-2xl border border-rose-100 shadow-sm transition flex flex-col items-center justify-between text-center min-h-[140px]"
                    >
                        <span className="font-bold text-sm text-zinc-900 leading-snug">
                            Log your symptoms
                        </span>
                        <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center my-2 shadow-sm">
                            <span className="text-xl font-bold">+</span>
                        </div>
                        <span className="text-[11px] text-teal-700 font-semibold">
                            {(pregnancy.loggedSymptoms || []).length} logged today
                        </span>
                    </div>

                    {/* Card 2: Your baby */}
                    <div
                        onClick={() => setShowBabyModal(true)}
                        className="bg-emerald-50/80 hover:bg-emerald-100/80 cursor-pointer p-4 rounded-2xl border-2 border-emerald-400/80 shadow-sm transition flex flex-col justify-between min-h-[140px]"
                    >
                        <div className="bg-white/80 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-max shadow-2xs">
                            {week} weeks
                        </div>
                        <div className="flex flex-col items-start mt-2">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-sm">
                                <span className="text-lg">👶</span>
                            </div>
                            <span className="font-bold text-sm text-emerald-950">Your baby</span>
                        </div>
                    </div>

                    {/* Card 3: Your body */}
                    <div
                        onClick={() => setShowBodyModal(true)}
                        className="bg-sky-50/80 hover:bg-sky-100/80 cursor-pointer p-4 rounded-2xl border-2 border-sky-400/80 shadow-sm transition flex flex-col justify-between min-h-[140px]"
                    >
                        <div className="bg-white/80 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-max shadow-2xs">
                            {week} weeks
                        </div>
                        <div className="flex flex-col items-start mt-2">
                            <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center mb-1 shadow-sm">
                                <span className="text-lg">🤰</span>
                            </div>
                            <span className="font-bold text-sm text-sky-950">Your body</span>
                        </div>
                    </div>
                </div>

                {/* Interactive Tools Grid */}
                <div className="mt-8 space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Pregnancy Tools & Planning</span>
                    </h2>

                    {/* Kick Counter Card */}
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-2xl shrink-0">
                                🦶
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Baby Kick Counter</h3>
                                <p className="text-xs text-zinc-400">
                                    Track baby movements in real-time
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowKickCounter(true)}
                            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
                        >
                            Open Counter
                        </button>
                    </div>

                    {/* Baby Names Brainstorming */}
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shrink-0">
                                📝
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Baby Name Shortlist</h3>
                                <p className="text-xs text-zinc-400">
                                    {(pregnancy.candidateNames || []).length} names saved on shortlist
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowNameModal(true)}
                            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
                        >
                            Manage Names
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL 1: Pregnancy Info Details */}
            {showInfoModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>Pregnancy Breakdown</span>
                        </h3>
                        <div className="space-y-3 text-sm text-zinc-300">
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Gestational Age:</span>
                                <span className="font-bold text-white">{week} Weeks</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Current Trimester:</span>
                                <span className="font-bold text-rose-400">{trimester}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Estimated Due Date:</span>
                                <span className="font-bold text-white">Week 40</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Co-Parent:</span>
                                <span className="font-bold text-white">{partner}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-zinc-400">Weeks Remaining:</span>
                                <span className="font-bold text-amber-400">{Math.max(0, 40 - week)} Weeks</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 2: Symptom Logger */}
            {showSymptomModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <span>Log Today's Symptoms</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mb-4">
                            Select what you are feeling today to keep track of your wellness.
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {SYMPTOM_OPTIONS.map((symptom) => {
                                const isSelected = (pregnancy.loggedSymptoms || []).includes(symptom.id);
                                return (
                                    <button
                                        key={symptom.id}
                                        onClick={() => handleToggleSymptom(symptom.id)}
                                        className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                                            isSelected
                                                ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm'
                                                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                    >
                                        <span className="text-lg">{symptom.emoji}</span>
                                        <span>{symptom.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowSymptomModal(false)}
                            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-md"
                        >
                            Done Logging
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 3: Your Baby Detail */}
            {showBabyModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
                                👶
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Your Baby ({week} Weeks)</h3>
                                <p className="text-xs text-emerald-400 font-semibold">
                                    Size of a {weekInfo.fruit} {weekInfo.emoji}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-zinc-800/80 p-3 rounded-xl text-center">
                                <span className="text-xs text-zinc-400 block">Length</span>
                                <span className="font-extrabold text-base text-emerald-400">{weekInfo.length}</span>
                            </div>
                            <div className="bg-zinc-800/80 p-3 rounded-xl text-center">
                                <span className="text-xs text-zinc-400 block">Weight</span>
                                <span className="font-extrabold text-base text-emerald-400">{weekInfo.weight}</span>
                            </div>
                        </div>

                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 mb-6">
                            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Development Highlights</h4>
                            <p className="text-sm text-zinc-200 leading-relaxed">{weekInfo.babyMilestone}</p>
                        </div>

                        <button
                            onClick={() => setShowBabyModal(false)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 4: Your Body Detail */}
            {showBodyModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-2xl">
                                🤰
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Your Body ({week} Weeks)</h3>
                                <p className="text-xs text-sky-400 font-semibold">{trimester} Wellness</p>
                            </div>
                        </div>

                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 mb-6">
                            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Bodily Changes & Advice</h4>
                            <p className="text-sm text-zinc-200 leading-relaxed">{weekInfo.bodyMilestone}</p>
                        </div>

                        <button
                            onClick={() => setShowBodyModal(false)}
                            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-sm transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 5: Kick Counter */}
            {showKickCounter && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl text-center">
                        <h3 className="text-xl font-bold mb-1">Kick Counter</h3>
                        <p className="text-xs text-zinc-400 mb-6">Tap the button every time you feel a kick!</p>

                        <div className="bg-rose-950/40 border border-rose-800/40 rounded-full w-40 h-40 mx-auto flex flex-col items-center justify-center my-4 shadow-inner">
                            <span className="text-5xl font-black text-rose-400">{kickCount}</span>
                            <span className="text-xs text-rose-300 uppercase tracking-wider mt-1">Kicks</span>
                        </div>

                        <div className="text-xs text-zinc-400 mb-6">
                            Timer: <span className="font-mono text-zinc-200 font-bold">{Math.floor(kickTimer / 60)}m {kickTimer % 60}s</span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRecordKick}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>🦶 Record Kick</span>
                            </button>
                            <button
                                onClick={handleResetKickCounter}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-3 rounded-xl text-xs transition"
                            >
                                Reset
                            </button>
                        </div>

                        <button
                            onClick={() => setShowKickCounter(false)}
                            className="mt-4 w-full bg-transparent hover:bg-zinc-800/50 text-zinc-400 font-semibold py-2 rounded-xl text-xs transition"
                        >
                            Close Counter
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 6: Baby Names Shortlist */}
            {showNameModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
                        <h3 className="text-xl font-bold mb-1">Baby Name Brainstorming</h3>
                        <p className="text-xs text-zinc-400 mb-4">Shortlist potential names for when your baby arrives!</p>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newNameInput}
                                onChange={(e) => setNewNameInput(e.target.value)}
                                placeholder="Enter baby name..."
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                            />
                            <button
                                onClick={handleAddBabyName}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto mb-6 pr-1">
                            {(pregnancy.candidateNames || []).length === 0 ? (
                                <p className="text-xs text-zinc-500 text-center py-4">No names added yet.</p>
                            ) : (
                                (pregnancy.candidateNames || []).map((name) => (
                                    <div
                                        key={name}
                                        className="flex items-center justify-between bg-zinc-800/70 px-3.5 py-2.5 rounded-xl border border-zinc-700/60 text-sm font-semibold"
                                    >
                                        <span>⭐️ {name}</span>
                                        <button
                                            onClick={() => handleRemoveBabyName(name)}
                                            className="text-xs text-red-400 hover:text-red-300 font-bold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setShowNameModal(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-sm transition"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 7: Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Pregnancy App Options</h3>

                        <div className="space-y-3 mb-6">
                            {!pregnancy.revealed ? (
                                <button
                                    onClick={handleAnnouncePregnancy}
                                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition text-left flex items-center justify-between"
                                >
                                    <span>📢 Announce Pregnancy to Fans (+200 Hype)</span>
                                    <span>→</span>
                                </button>
                            ) : (
                                <div className="p-3 bg-zinc-800/80 rounded-xl text-xs text-emerald-400 font-semibold">
                                    ✓ Pregnancy has been publicly announced.
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowSettingsModal(false)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PregnancyTrackerView;
