
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import MusicNoteIcon from './icons/MusicNoteIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import FireIcon from './icons/FireIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import StarIcon from './icons/StarIcon';
import AmaAwardIcon from './icons/AmaAwardIcon';
import LocationMarkerIcon from './icons/LocationMarkerIcon';
import BuildingOfficeIcon from './icons/BuildingOfficeIcon';
import { LABELS } from '../constants';
import { Label } from '../types';

interface GuideSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const RecordLabelsGuideContent: React.FC = () => {
    const [tierFilter, setTierFilter] = useState<'All' | 'Top' | 'Mid-high' | 'Mid-Low' | 'Low' | 'Petty'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLabels = useMemo(() => {
        return LABELS.filter(label => {
            const matchesTier =
                tierFilter === 'All' ? true :
                tierFilter === 'Petty' ? label.contractType === 'petty' :
                label.tier === tierFilter;
            const matchesSearch = label.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTier && matchesSearch;
        });
    }, [tierFilter, searchQuery]);

    const formatStreams = (streams: number) => {
        if (!streams) return '0 Streams (Open)';
        if (streams >= 1_000_000_000) return `${(streams / 1_000_000_000).toFixed(1)}B Streams`;
        if (streams >= 1_000_000) return `${Math.round(streams / 1_000_000)}M Streams`;
        if (streams >= 1_000) return `${Math.round(streams / 1_000)}k Streams`;
        return `${streams.toLocaleString()} Streams`;
    };

    const getQualityBadgeColor = (minQuality: number, isPetty?: boolean) => {
        if (isPetty || minQuality >= 70) {
            return 'bg-red-950/80 text-red-300 border-red-700/80';
        }
        if (minQuality >= 60) {
            return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
        }
        if (minQuality >= 40) {
            return 'bg-blue-950/80 text-blue-300 border-blue-700/80';
        }
        if (minQuality > 0) {
            return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
        }
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    };

    const getTierBadgeColor = (tier: string, isPetty?: boolean) => {
        if (isPetty) return 'bg-purple-900/60 text-purple-300 border-purple-600';
        switch (tier) {
            case 'Top': return 'bg-yellow-900/60 text-yellow-300 border-yellow-600';
            case 'Mid-high': return 'bg-blue-900/60 text-blue-300 border-blue-600';
            case 'Mid-Low': return 'bg-indigo-900/60 text-indigo-300 border-indigo-600';
            case 'Low':
            default: return 'bg-zinc-700/60 text-zinc-300 border-zinc-600';
        }
    };

    return (
        <div className="space-y-4">
            <p>
                When you submit songs, singles, EPs, or albums to your signed record label, the label A&R team evaluates the <strong>average quality of all tracks</strong>. If your submission falls below the label's <strong>Required Quality</strong> threshold, the release is <strong>rejected</strong>.
            </p>

            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700 space-y-2 text-xs">
                <p className="font-bold text-white text-sm">💡 Key Approval & Contract Rules:</p>
                <p>• <strong>Average Quality Calculation:</strong> All songs in a multi-track release are averaged together.</p>
                <p>• <strong>Petty Labels (TDE, Roc Nation, QC):</strong> Enforce a strict minimum quality of <strong>70</strong>. If you ever leave a petty label, they seize all masters released during your contract!</p>
                <p>• <strong>Distribution Only Deals (EMPIRE, Nice Life):</strong> Offer higher creative control (80-90%) with lower quality bars (25-30).</p>
                <p>• <strong>Dismissing Rejected Submissions:</strong> If your release is rejected, you can dismiss it directly from your Home Screen or Labels tab to clean up your dashboard.</p>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-2 pt-2">
                <input
                    type="text"
                    placeholder="Search label by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                <div className="flex flex-wrap gap-1.5">
                    {(['All', 'Top', 'Mid-high', 'Mid-Low', 'Low', 'Petty'] as const).map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setTierFilter(tier)}
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors border ${
                                tierFilter === tier
                                    ? 'bg-red-600 text-white border-red-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-white'
                            }`}
                        >
                            {tier === 'Petty' ? '⚠️ Petty Labels' : `${tier} ${tier !== 'All' ? 'Tier' : 'Tiers'}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Labels Table / Cards */}
            <div className="space-y-3 pt-1">
                {filteredLabels.map((label: Label) => {
                    const isPetty = label.contractType === 'petty';
                    const effectiveMinQuality = isPetty ? Math.max(label.minQuality || 0, 70) : (label.minQuality || 0);

                    return (
                        <div
                            key={label.id}
                            className="bg-zinc-900/90 border border-zinc-700/80 rounded-lg p-3.5 space-y-2 hover:border-zinc-500 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-md bg-white border border-zinc-200 p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <img
                                            src={label.logo}
                                            alt={label.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white truncate text-base">{label.name}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getTierBadgeColor(label.tier, isPetty)}`}>
                                                {label.tier} Tier
                                            </span>
                                            {isPetty && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700">
                                                    Petty Label
                                                </span>
                                            )}
                                            {label.isDistributionOnly && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
                                                    Distribution Only
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <div className={`px-2.5 py-1 rounded-md border text-xs font-bold ${getQualityBadgeColor(effectiveMinQuality, isPetty)}`}>
                                        ⭐️ Min Quality: {effectiveMinQuality}+
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1 text-xs border-t border-zinc-800/80">
                                <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800">
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Signing Requirement</span>
                                    <span className="font-semibold text-zinc-200">{formatStreams(label.streamRequirement)}</span>
                                </div>
                                <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800">
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Promo Multiplier</span>
                                    <span className="font-semibold text-emerald-400">{label.promotionMultiplier}x Boost</span>
                                </div>
                                <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800">
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Creative Control</span>
                                    <span className="font-semibold text-blue-400">{label.creativeControl}% Control</span>
                                </div>
                            </div>

                            {(isPetty || label.activeFromYear || label.activeUntilYear || label.isDistributionOnly) && (
                                <div className="text-xs bg-zinc-950/40 p-2 rounded border border-zinc-800/60 text-zinc-400 space-y-1">
                                    {isPetty && (
                                        <p className="text-red-400">
                                            ⚠️ <strong>Petty Clause:</strong> Requires strictly 70+ quality for all project submissions. Retains all master rights upon contract termination.
                                        </p>
                                    )}
                                    {label.activeFromYear && (
                                        <p className="text-zinc-400">
                                            📅 <strong>Era Availability:</strong> Active starting in {label.activeFromYear}{label.activeUntilYear ? ` until ${label.activeUntilYear}` : '+'}.
                                        </p>
                                    )}
                                    {label.isDistributionOnly && (
                                        <p className="text-blue-300">
                                            📦 <strong>Distribution Deal:</strong> Provides direct distribution pipeline with maximum artistic autonomy.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const guideSections: GuideSection[] = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: <BookOpenIcon className="w-5 h-5" />,
        content: (
            <>
                <p>Welcome to Red Mic! Your goal is to become a music superstar. You'll record songs, release projects, build a fanbase, and climb the charts. Success hinges on managing three key stats:</p>
                <ul className="list-disc list-inside space-y-2 pl-2 mt-2">
                    <li><strong>Money:</strong> Your cash on hand. Used for everything from studio time to promotions. Earn it from streams, views, sales, and gigs.</li>
                    <li><strong>Popularity (0-100):</strong> A long-term measure of your fame. It grows with successful releases and decays slowly if you're inactive. Higher popularity leads to more organic streams, sales, and social media engagement.</li>
                    <li><strong>Hype (0-1000):</strong> A short-term measure of your buzz. Generated by new releases, promotional activities, and gigs. Hype decays every week. High hype provides a massive boost to streams for your entire catalog.</li>
                </ul>
            </>
        )
    },
    {
        id: 'groups-and-solo',
        title: 'Groups vs Solo',
        icon: <StarIcon className="w-5 h-5" />,
        content: (
            <>
                <p>When starting, you can choose to be a Solo artist or form a Music Group (like a boyband or girl group).</p>
                <h3 className="font-bold text-red-400 mt-4">Music Groups</h3>
                <p>Groups have unique dynamics. Over time, members might express desires to go solo, or you can decide to disband the group and launch a solo career. After a breakup, you can even reunite for a massive nostalgia boost.</p>
            </>
        )
    },
    {
        id: 'making-a-hit-song',
        title: 'How to Make a Hit Song',
        icon: <MusicNoteIcon className="w-5 h-5" />,
        content: (
            <>
                <p>Creating a chart-topping hit involves more than just pressing "Record". Here's the winning formula:</p>
                <h3 className="font-bold text-red-400 mt-4">1. Invest in Studio Quality</h3>
                <p>The most important stat in the game is <strong className="text-white">Song Quality</strong>. If your song quality is below 80, it will be hard to make it a global smash. Always use the most expensive studio you can afford (e.g. Abbey Road) to maximize your chances of generating an 80+ or 90+ quality song.</p>
                
                <h3 className="font-bold text-red-400 mt-4">2. Build Hype Pre-Release</h3>
                <p>Hype acts as a multiplier for streams. Before dropping your single, do gigs, answer PopBase questions favorably, start fan wars on X, and accept feature/magazine offers. You want your Hype to be as high as possible the week the song drops.</p>
                <h3 className="font-bold text-red-400 mt-4">3. Massive Playlist & Payola Push</h3>
                <p>In the "Spotify for Artists" app, ALWAYS pitch your single to Editorial Playlists before launch. Once released, immediately go to the Payola app and dump money into Radio rotation, TikTok influencers, and Spotify playlisting. The more you spend, the higher it climbs.</p>
                <h3 className="font-bold text-red-400 mt-4">4. Drop A Music Video</h3>
                <p>Go to the YouTube app and drop a High Budget Music Video for the song simultaneously. This adds massive first-week streams and pushes the song further up the Billboard Hot 100.</p>
            </>
        )
    },
    {
        id: 'releasing-music',
        title: 'Releasing Projects & Live Albums',
        icon: <BookOpenIcon className="w-5 h-5" />,
        content: (
            <>
                <p>Go to the 'Release Hub' to package unreleased songs. You can release a <strong>Single</strong> (1 song), an <strong>EP</strong> (3-7 songs), or an <strong>Album</strong> (8+ songs). Releasing independently gives you full control, but signing to a label offers promotional power.</p>
                <h3 className="font-bold text-red-400 mt-4">Features & Collaborations</h3>
                <p>Sometimes you will get an email asking you to feature on another artist's track. Accepting these can give you a boost in popularity and passive streams. Similarly, you can ask NPCs to feature on your songs during recording, which combines your star power to boost the song's potential streams.</p>
                <h3 className="font-bold text-red-400 mt-4">Live Albums</h3>
                <p>You can package live performances into a <strong>Live Album</strong>. However, be aware that live album tracks receive a massive <strong>-95% stream penalty permanently</strong> compared to studio recordings. They are mostly for fan service and modest revenue bumps, not for topping charts.</p>
                <h3 className="font-bold text-red-400 mt-4">Compilations & Deluxe</h3>
                <p>Later in your career, you can release <strong>Deluxe Albums</strong> with extra vault tracks, or <strong>Compilation Albums</strong> to package greatest hits and rarities. You can now add <strong>any song — whether unreleased or previously released</strong> — into a compilation with a minimum of 2 tracks.</p>
            </>
        )
    },
    {
        id: 'genres-subgenres-regions',
        title: 'Genres, Subgenres & Regions',
        icon: <LocationMarkerIcon className="w-5 h-5 text-amber-400" />,
        content: (
            <>
                <p>Music trends change across history, seasons, and geographic borders. Using the right genre, subgenre, and region targeting will give your songs massive algorithmic multipliers.</p>

                <h3 className="font-bold text-red-400 mt-4">1. Subgenre Trends by Era (Year Multipliers)</h3>
                <div className="space-y-3 mt-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-700/50">
                    <div className="border-b border-zinc-800 pb-2">
                        <p className="font-bold text-white text-sm">📅 Pre-2003 (Up to 2002): The Boyband Mania</p>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            • <strong className="text-emerald-400">Teen Pop Boyband:</strong> Receives a massive <span className="text-emerald-400 font-bold">+200% stream boost (3.0x multiplier)</span>!
                        </p>
                    </div>
                    <div className="border-b border-zinc-800 pb-2">
                        <p className="font-bold text-white text-sm">📅 2006 – 2009: The Digital & Club Boom</p>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            • <strong className="text-emerald-400">Ringtone Rap & Electro-Pop:</strong> Receive a <span className="text-emerald-400 font-bold">+150% stream boost (2.5x multiplier)</span>.
                        </p>
                    </div>
                    <div className="border-b border-zinc-800 pb-2">
                        <p className="font-bold text-white text-sm">📅 2006 – 2012: The Teen Pop Boyband Slump</p>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            • <strong className="text-rose-400">Teen Pop Boyband:</strong> Crashes completely during this period, receiving a <span className="text-rose-400 font-bold">-90% penalty (0.1x flop multiplier)</span>.
                        </p>
                    </div>
                    <div className="border-b border-zinc-800 pb-2">
                        <p className="font-bold text-white text-sm">📅 2010 – 2014: The Golden EDM Era</p>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            • <strong className="text-emerald-400">EDM & Festival:</strong> Dominate streaming and clubs with a <span className="text-emerald-400 font-bold">+150% stream boost (2.5x multiplier)</span>.
                        </p>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">📅 2018+: The Modern Streaming Era</p>
                        <p className="text-xs text-zinc-300 mt-0.5">
                            • <strong className="text-emerald-400">Trap & Alt-Pop:</strong> Receive a powerful <span className="text-emerald-400 font-bold">+80% stream boost (1.8x multiplier)</span>.<br/>
                            • <strong className="text-sky-400">Short Song Algorithm Boost:</strong> Any song under 2:30 (&lt;150 seconds) receives an extra <span className="text-sky-400 font-bold">+50% (1.5x)</span> streaming boost!
                        </p>
                    </div>
                </div>

                <h3 className="font-bold text-red-400 mt-4">2. Regional Market Strengths</h3>
                <p className="text-sm">Certain genres gain huge market share multipliers in specific global territories:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-700/50">
                        <p className="font-bold text-white text-sm">🇺🇸 United States</p>
                        <p className="text-xs text-zinc-300 mt-0.5"><strong className="text-amber-400">Country</strong> gets a <span className="text-emerald-400 font-bold">2.5x boost</span> in US market share.</p>
                    </div>
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-700/50">
                        <p className="font-bold text-white text-sm">🌏 Asia</p>
                        <p className="text-xs text-zinc-300 mt-0.5"><strong className="text-pink-400">K-Pop / J-Pop</strong> gets a <span className="text-emerald-400 font-bold">2.5x boost</span> in Asian market share.</p>
                    </div>
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-700/50">
                        <p className="font-bold text-white text-sm">🌍 Africa</p>
                        <p className="text-xs text-zinc-300 mt-0.5"><strong className="text-emerald-400">Afrobeats & Reggae</strong> get a <span className="text-emerald-400 font-bold">2.5x boost</span> in African market share.</p>
                    </div>
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-700/50">
                        <p className="font-bold text-white text-sm">💃 Latin America</p>
                        <p className="text-xs text-zinc-300 mt-0.5"><strong className="text-orange-400">Latin & Reggaeton</strong> get a <span className="text-emerald-400 font-bold">2.5x boost</span> in Latin American market share.</p>
                    </div>
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-700/50 sm:col-span-2">
                        <p className="font-bold text-white text-sm">🇬🇧 United Kingdom (UK)</p>
                        <p className="text-xs text-zinc-300 mt-0.5"><strong className="text-indigo-400">Electronic, Dance, Rock, and Indie</strong> get a <span className="text-emerald-400 font-bold">2.0x boost</span> in UK market share.</p>
                    </div>
                </div>

                <h3 className="font-bold text-red-400 mt-4">3. Seasonal Genre Dynamics (Christmas)</h3>
                <p className="text-sm">The <strong>Christmas</strong> genre follows strict seasonal cycles:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300 pl-2 mt-2">
                    <li><strong>Off-Season (Weeks 1–40):</strong> Streams drop significantly (0.05x–0.25x).</li>
                    <li><strong>Early Momentum (Weeks 41–44):</strong> Streams gain 1.5x–3.0x boost.</li>
                    <li><strong>Holiday Push (Weeks 45–49):</strong> Streams skyrocket by 8.0x–13.0x.</li>
                    <li><strong>Peak Holiday Season (Weeks 50–52):</strong> Astronomical <span className="text-emerald-400 font-bold">15.0x–20.0x stream multiplier</span>.</li>
                </ul>

                <h3 className="font-bold text-red-400 mt-4">4. Radio Format Compatibility</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300 pl-2 mt-2">
                    <li><strong>Pop Radio:</strong> Fully supports Pop, K-Pop, Dance, and Electronic (1.0x); R&amp;B receives 0.4x; Hip Hop receives 0.2x; Country receives 0.05x.</li>
                    <li><strong>Urban Radio:</strong> 1.0x support for Hip Hop, Rap, and R&amp;B.</li>
                    <li><strong>Rhythmic Radio:</strong> 1.0x support for Hip Hop, Rap, R&amp;B, Pop, Dance, Electronic, and K-Pop.</li>
                    <li><strong>Country Radio:</strong> 1.0x support for Country songs only.</li>
                </ul>
            </>
        )
    },
    {
        id: 'how-to-become-critically-acclaimed',
        title: 'Critical Acclaim & Awards',
        icon: <AmaAwardIcon className="w-5 h-5 text-zinc-300" />,
        content: (
            <>
                <p>To win GRAMMYs, AMAs, Oscars, and end up with a legacy that lasts forever, you need a different strategy than just raw streams.</p>
                <h3 className="font-bold text-red-400 mt-4">1. Quality Over Everything</h3>
                <p>Award shows look heavily at the underlying quality of your music. A 95-quality album with moderate streams will almost always beat a 70-quality album with billions of streams at the GRAMMYs. Delete low-quality songs from your studio so they don't drag down your album's average.</p>
                
                <h3 className="font-bold text-red-400 mt-4">2. Submit on Time</h3>
                <p>Check your Inbox religiously. Submissions for Oscars, VMAs, AMAs, and GRAMMYs come at specific times of the year and have a limited submission window. If you miss the email, you miss the awards year.</p>
                <h3 className="font-bold text-red-400 mt-4">3. Soundtrack Dominance</h3>
                <p>If you get offered to write a track for a movie (e.g. <em>Wicked</em>, <em>Breaking Bad</em>), make an incredibly high-quality song for it. Movie soundtracks are the ONLY way to be nominated for "Best Original Song" at the Oscars.</p>
                <h3 className="font-bold text-red-400 mt-4">4. Perform at the Shows</h3>
                <p>If you are nominated, the award show committee will often reach out to ask you to perform on their stage. Doing so boosts your favor with the voting body and significantly raises your popularity.</p>
            </>
        )
    },
    {
        id: 'acting-and-hollywood',
        title: 'Acting Careers & Hollywood',
        icon: <StarIcon className="w-5 h-5" />,
        content: (
            <>
                <h3 className="font-bold text-red-400">Auditions & Roles</h3>
                <p>Once you achieve high popularity, you can start an acting career in the IMDb app. You can audition for roles in Movies, TV Shows, and Theater. Roles vary from Lead, Supporting, to Cameo.</p>
                <h3 className="font-bold text-red-400 mt-4">Filming & Premieres</h3>
                <p>Booking a role will take up your time for a few weeks (or months) as you film. Upon completion, you will be asked to upload a Trailer and Cover image for the project.</p>
                <p>After uploading, you'll receive an invitation to the <strong>Movie Premiere</strong>. You can upload your red carpet look, choose the premiere location, and generate massive buzz across PopBase and social media.</p>
                <h3 className="font-bold text-red-400 mt-4">Oscars & Red Carpets</h3>
                <p>As you attend award shows (GRAMMYs, Oscars, Golden Globes) and premieres, you'll build up a Red Carpet History tracking your best looks throughout your career.</p>
            </>
        )
    },
    {
        id: 'dating-and-family',
        title: 'Dating & Family',
        icon: <FireIcon className="w-5 h-5" />,
        content: (
            <>
                <h3 className="font-bold text-red-400">Relationships</h3>
                <p>In the 'Dating' app, you can choose to date fellow artists (NPCs) or a custom partner. You can choose to keep the relationship private or go public (e.g., via Pop Base or TMZ) to generate immense hype.</p>
                <h3 className="font-bold text-red-400 mt-4">Marriage & Breakups</h3>
                <p>As relationships progress, you can Get Engaged and Get Married. If things go sour, you can Break Up (which may spawn breakup songs and fan wars!). You can also get back together with your exes.</p>
                <h3 className="font-bold text-red-400 mt-4">Having Children</h3>
                <p>You can choose to 'Try for Baby' with your partner (or as a single parent). After a 9-month pregnancy, you'll welcome a child. You can reveal the pregnancy publicly for a huge popularity boost.</p>
                <h3 className="font-bold text-red-400 mt-4">Nepo Babies</h3>
                <p>Once your child reaches the age of 10, you can use your industry connections to <strong>Start their Music Career</strong>. They will become a new artist in the game, and you can guide them to stardom.</p>
            </>
        )
    },
    {
        id: 'career-progression',
        title: 'Career Progression',
        icon: <BriefcaseIcon className="w-5 h-5" />,
        content: (
            <>
                <h3 className="font-bold text-red-400">Gigs & Tours</h3>
                <p>Perform live shows in the 'Gigs' app to earn quick cash and hype. As your popularity grows, you'll unlock bigger venues. In the 'Ticketmaster' app, you can plan multi-city tours, which are a massive source of income.</p>
                
                <h3 className="font-bold text-red-400 mt-4">Record Labels & Custom Labels</h3>
                <p>Use the 'Labels' app to seek a record deal. You'll need to meet their stream requirements. Once signed, they handle releases and provide a huge promotional multiplier. (Check out the <strong>Record Labels & Quality</strong> section below for all label thresholds!)</p>
                <p>Beware of <strong>"Petty Labels"</strong>. If you leave their contract, they will take down all music you released with them. You can later re-record these songs to reclaim your masters.</p>
                <p>If you are wealthy and popular enough, you can <strong>Create Your Own Custom Label</strong>. You can sign upcoming artists (like your children), handle their releases, and earn a percentage of their revenue.</p>
                
                <h3 className="font-bold text-red-400 mt-4">Business Ventures</h3>
                <p>Hire staff in the 'Management' and 'Security' apps. Managers automatically book gigs and unlock higher-tier opportunities. Security teams reduce the chance of your unreleased music leaking.</p>
            </>
        )
    },
    {
        id: 'record-labels',
        title: 'Record Labels & Quality Requirements',
        icon: <BuildingOfficeIcon className="w-5 h-5 text-yellow-400" />,
        content: <RecordLabelsGuideContent />
    },
    {
        id: 'fame-and-image',
        title: 'Fame & Public Image',
        icon: <FireIcon className="w-5 h-5" />,
        content: (
            <>
                <h3 className="font-bold text-red-400">Social Media (X)</h3>
                <p>Use the 'X' app to engage with your fanbase. You can make normal posts, start "fan wars" against rival artists for a hype boost, or "push" a song on iTunes during a fan war. The media (PopBase, TMZ) will also post about your activities, creating buzz and sometimes controversy.</p>
                <h3 className="font-bold text-red-400 mt-4">Stage Name Changes</h3>
                <p>As an independent artist, you are allowed to reinvent yourself by changing your stage name up to two times via the 'Profile' tab in Spotify for Artists.</p>
                <p>However, when dealing with record labels, they may have an opinion on your brand: <br/>Micro, Small, and "Petty" labels have a 50% chance of demanding a name change when you try to sign. Petty labels will force you into picking from random names, while smaller labels will allow you to pick your own, or force you to pay a costly "Name Change Settlement Fee" if you want to keep your current name.</p>
                <h3 className="font-bold text-red-400 mt-4">Media Features</h3>
                <p>As you gain traction, you'll receive offers in your 'Inbox' for interviews and performances with platforms like Genius, The Tonight Show, and Vogue. Accepting these provides significant hype and popularity boosts.</p>
                <h3 className="font-bold text-red-400 mt-4">Exclusive Content (OnlyFans)</h3>
                <p>Once you've built a dedicated fanbase, you can create an OnlyFans profile to monetize exclusive content and interact more directly with your top supporters, creating a new revenue stream.</p>
            </>
        )
    },
    {
        id: 'charts-and-awards',
        title: 'Charts & Sales',
        icon: <ChartBarIcon className="w-5 h-5" />,
        content: (
            <>
                <h3 className="font-bold text-red-400">How Charts Work</h3>
                <p>Song charts (like the Billboard Hot 100) are based purely on weekly streams. Album charts use "album equivalent units," which combine streams from album tracks with pure sales from your merch store (vinyls, CDs).</p>
                <p><strong>Recurrent Rule:</strong> A song is removed from the Hot 100 if it has been on the chart for 20+ weeks AND falls below position #50.</p>
                <h3 className="font-bold text-red-400 mt-4">Merchandise & Pure Sales</h3>
                <p>In the Shopify app, you can list physical copies (Vinyl, CDs, Cassettes) of your albums. These contribute directly to "Pure Sales", which drastically help you chart higher on the Billboard 200, especially in the early eras of the game.</p>
            </>
        )
    },
    {
        id: 'timeline-and-eras',
        title: 'Timeline & Eras',
        icon: <BookOpenIcon className="w-5 h-5" />,   
        content: (
            <>
                <p>The music industry evolves rapidly as years progress in the game. Here is a definitive guide on how the landscape changes:</p>
                
                <h3 className="font-bold text-red-400 mt-4">Pre-2003: The Physical Golden Age</h3>
                <p><strong>Physical Sales (90% market share):</strong> CDs, Cassettes, and Vinyl rule the world. <strong>Radio (100% impact):</strong> Radio play is the primary way your songs chart. You must dominate radio to succeed. No streaming or digital downloads exist.</p>
                <h3 className="font-bold text-red-400 mt-4">2003 - 2007: The Digital Revolution Begins</h3>
                <p><strong>iTunes & MySpace:</strong> In 2003, digital downloads (iTunes) become active, opening up the digital sales market. Additionally, MySpace becomes available from 2003-2011, allowing you to connect directly with fans, post blogs, and update your profile song for huge hype.</p>
                <p><strong>YouTube (2005):</strong> The ability to post Music Videos, Interviews, and Live Performances debuts. A very critical visual era begins.</p>
                
                <h3 className="font-bold text-red-400 mt-4">2008 - 2011: The Streaming Dawn</h3>
                <p><strong>Spotify & Twitter (X):</strong> In 2008, streaming (Spotify) goes live, slowly eating into market share. 'X' (Twitter) also goes mainstream, shifting organic hype towards micro-blogging and viral fan wars.</p>
                <p><strong>Market Dynamics:</strong> Physical sales steadily decline (dropping to 60%). Digital downloads peak in relevance alongside radio.</p>
                <h3 className="font-bold text-red-400 mt-4">2012 - 2017: The Social Media Boom</h3>
                <p><strong>Instagram (2012):</strong> Visual dominance shifts to Instagram. MySpace dies and is no longer available.</p>
                <p><strong>OnlyFans (2016):</strong> A new way to monetize hardcore fans. Streaming slowly becomes the dominant force over digital and physical sales.</p>
                
                <h3 className="font-bold text-red-400 mt-4">2018+: The Streaming & Short-Form Era</h3>
                <p><strong>TikTok (2018):</strong> Viral short-form video takes over. Songs explode seemingly overnight through trends.</p>
                <p><strong>Market Dynamics:</strong> Streaming has an 85% market share. Pure digital downloads are mostly dead. Physical sales only exist as niche record sales (5% - vinyl resurgence). Radio impact is significantly diluted to 30% of its former glory.</p>
            </>
        )
    },
    {
        id: 'switch-saves',
        title: 'Switch Saves',
        icon: <StarIcon className="w-5 h-5 text-blue-400" />,
        content: (
            <>
                <p>Want to start a new career without losing your current progress? You can manage up to 3 Save Slots.</p>
                <p>Go to the main menu (Settings icon or via the dashboard) and select <strong>Switch Save</strong>. From there, you can switch between active games, delete old saves, or start a completely new artist in an empty slot. Saves are persisted automatically to your browser.</p>
            </>
        )
    },
    {
        id: 'red-mic-pro',
        title: 'Red Mic Pro',
        icon: <StarIcon className="w-5 h-5 text-yellow-500" />,
        content: (
            <>
                <p>Red Mic Pro is the premium version of the game, designed for players who want more control.</p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><strong>Edit Stats:</strong> Directly change your money, hype, and popularity.</li>
                    <li><strong>Song Quality:</strong> See the exact quality score of your unreleased songs and edit it.</li>
                    <li><strong>Sign Instantly:</strong> Sign with any label instantly, ignoring their requirements.</li>
                    <li><strong>Gold Theme:</strong> Unlock an exclusive cosmetic gold theme for the UI.</li>
                </ul>
            </>
        )
    },
];

const GameGuideView: React.FC = () => {
    const { dispatch } = useGame();
    const [activeSection, setActiveSection] = useState(guideSections[0].id);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { root: contentRef.current, threshold: 0.3, rootMargin: '-40% 0px -60% 0px' }
        );

        Object.values(sectionRefs.current).forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => {
            Object.values(sectionRefs.current).forEach(ref => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, []);

    const scrollToSection = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <div className="h-full w-full bg-zinc-900 flex flex-col text-white">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Game Guide</h1>
            </header>
            <div className="flex flex-grow overflow-hidden">
                <aside className="w-1/3 md:w-1/4 h-full overflow-y-auto border-r border-zinc-700/50 p-4">
                    <nav className="space-y-1">
                        {guideSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors text-sm font-semibold ${
                                    activeSection === section.id
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'text-zinc-300 hover:bg-zinc-800'
                                }`}
                            >
                                <span className="flex-shrink-0">{section.icon}</span>
                                <span className="truncate">{section.title}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
                <main ref={contentRef} className="w-2/3 md:w-3/4 h-full overflow-y-auto p-4 md:p-6">
                    <div className="space-y-8 max-w-2xl mx-auto">
                        {guideSections.map(section => (
                            <div
                                key={section.id}
                                id={section.id}
                                ref={el => { sectionRefs.current[section.id] = el; }}
                                className="bg-zinc-800 p-4 rounded-lg scroll-mt-4"
                            >
                                <h2 className="text-2xl font-bold text-red-400 mb-4">{section.title}</h2>
                                <div className="space-y-3 text-zinc-300 leading-relaxed">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                         <div className="h-32"></div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GameGuideView;
