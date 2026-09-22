import React, { useState, useRef } from "react";
import { useGame } from "../context/GameContext";
import {
  TvAndFilmProject,
  TvShowCategory,
  MovieCategory,
  CastMember,
  TvEpisode,
} from "../types";
import {
  Tv,
  Film,
  Sparkles,
  Users,
  Video,
  Plus,
  CheckCircle2,
  Calendar,
  Star,
  TrendingUp,
  Award,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  Play,
  RotateCw,
  Eye,
  DollarSign,
  AlertCircle,
  X,
  Radio,
  Clapperboard,
  Heart,
  Baby,
  Smile,
  ShieldAlert,
  Search,
  Check,
} from "lucide-react";
import { NPC_ARTIST_NAMES, getArtistImage } from "../constants";

// Calculate deterministic talent fee between $70,000 and $1,000,000 for NPC artists
export const getNpcCastingFee = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000000;
  }
  const ratio = (Math.abs(hash) % 1000) / 1000;
  // Spread $70,000 to $1,000,000 ($930,000 spread)
  const rawFee = 70000 + ratio * 930000;
  return Math.round(rawFee / 5000) * 5000;
};

export const formatCastingFee = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 2)}M`;
  }
  return `$${Math.round(amount / 1000)}K`;
};

export const TvAndFilmProductionView: React.FC = () => {
  const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
  const [activeTab, setActiveTab] = useState<"dashboard" | "create_tv" | "create_movie">("dashboard");
  const [selectedProject, setSelectedProject] = useState<TvAndFilmProject | null>(null);

  // TV Creation State
  const [tvTitle, setTvTitle] = useState("");
  const [tvCategory, setTvCategory] = useState<TvShowCategory>("Reality TV");
  const [tvSynopsis, setTvSynopsis] = useState("");
  const [tvEpisodesCount, setTvEpisodesCount] = useState<number>(10);
  const [tvNetwork, setTvNetwork] = useState("E! Entertainment & Peacock");
  const [tvHasYouTubeDeal, setTvHasYouTubeDeal] = useState(true);
  const [tvCoverUrl, setTvCoverUrl] = useState(
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
  );
  const [tvCast, setTvCast] = useState<CastMember[]>([]);

  // Movie Creation State
  const [movieTitle, setMovieTitle] = useState("");
  const [movieCategory, setMovieCategory] = useState<MovieCategory>("Comedy");
  const [movieSynopsis, setMovieSynopsis] = useState("");
  const [movieBudgetTier, setMovieBudgetTier] = useState<number>(() => {
    const money = activeArtistData?.money || 0;
    if (money >= 8000000) return 8000000;
    if (money >= 1500000) return 1500000;
    return 250000;
  });
  const [movieCoverUrl, setMovieCoverUrl] = useState(
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"
  );
  const [movieCast, setMovieCast] = useState<CastMember[]>([]);

  // Validation and Feedback states
  const [tvFormError, setTvFormError] = useState<string | null>(null);
  const [movieFormError, setMovieFormError] = useState<string | null>(null);
  const [castingError, setCastingError] = useState<string | null>(null);
  const [guestModalError, setGuestModalError] = useState<string | null>(null);

  // Casting Suite Tabs & Search States
  const [tvCastingTab, setTvCastingTab] = useState<"family" | "group" | "npcs">("family");
  const [movieCastingTab, setMovieCastingTab] = useState<"family" | "group" | "npcs">("family");
  const [tvNpcSearch, setTvNpcSearch] = useState("");
  const [movieNpcSearch, setMovieNpcSearch] = useState("");

  // Modals & Secondary States
  const [showRenewalModal, setShowRenewalModal] = useState<TvAndFilmProject | null>(null);
  const [renewalEpisodesCount, setRenewalEpisodesCount] = useState<number>(10);
  const [renewalCoverUrl, setRenewalCoverUrl] = useState<string>("");

  const [showAddGuestModal, setShowAddGuestModal] = useState<TvAndFilmProject | null>(null);
  const [guestModalTab, setGuestModalTab] = useState<"quick" | "group" | "npcs" | "custom">("quick");
  const [guestNpcSearch, setGuestNpcSearch] = useState("");
  const [customGuestName, setCustomGuestName] = useState("");
  const [customGuestRole, setCustomGuestRole] = useState<"main" | "recurring" | "guest">("guest");
  const [customGuestCost, setCustomGuestCost] = useState<number>(0);
  const [customGuestImage, setCustomGuestImage] = useState<string>("");
  const [customGuestRelationType, setCustomGuestRelationType] = useState<CastMember['relationType']>("celebrity");

  const [editingThumbnailEp, setEditingThumbnailEp] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const movieFileInputRef = useRef<HTMLInputElement>(null);
  const renewalFileInputRef = useRef<HTMLInputElement>(null);
  const epThumbnailFileInputRef = useRef<HTMLInputElement>(null);

  if (!activeArtistData) return null;

  const projects = activeArtistData.tvAndFilmProjects || [];
  const artistName = activeArtist?.name || activeArtistData.artistName || "You";

  // Safe Contact Getters for Family, Partners & Children
  const getPartnerName = (rel: any): string => {
    return rel?.partnerName || rel?.name || "Partner";
  };
  const getPartnerImage = (rel: any): string => {
    const pName = getPartnerName(rel);
    return rel?.image || rel?.imageUrl || getArtistImage(pName) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";
  };
  const getKidName = (k: any): string => {
    return k?.name || k?.kidName || "Child";
  };
  const getKidImage = (k: any): string => {
    return k?.photoUrl || k?.image || "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400";
  };

  // Contacts
  const currentPartner = activeArtistData.relationships?.find((r) => r.endYear === null);
  const exPartners = (activeArtistData.relationships || []).filter((r) => r.endYear !== null);
  const kids = activeArtistData.kids || [];

  // Group Members (if in musical group)
  const groupMembers = (gameState.group?.members || []).filter(
    (m) => m.name.toLowerCase() !== artistName.toLowerCase() && m.id !== activeArtist?.id
  );

  // Default image fallback for covers
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-seed current artist as main star if not already
  const initializeSelfCast = (): CastMember => ({
    id: "artist_self",
    name: artistName,
    roleType: "main",
    relationType: "artist",
    image: activeArtist?.image || activeArtistData.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    isFree: true,
    popularityBonus: activeArtistData.popularity || 10,
  });

  const handleAddPersonToCast = (
    person: {
      id: string;
      name: string;
      relationType: 'partner' | 'ex' | 'child' | 'celebrity' | 'friend' | 'artist' | 'group_member';
      image?: string;
      cost?: number;
      isFree?: boolean;
      popularityBonus?: number;
    },
    defaultRole: 'main' | 'recurring' | 'guest',
    isMovie: boolean = false
  ) => {
    const castList = isMovie ? movieCast : tvCast;
    const setter = isMovie ? setMovieCast : setTvCast;

    if (!person.name || castList.some((c) => c.name.toLowerCase() === person.name.toLowerCase())) {
      return;
    }

    const isFree = person.isFree !== undefined
      ? person.isFree
      : ['partner', 'ex', 'child', 'artist', 'group_member'].includes(person.relationType);
    const cost = isFree ? 0 : (person.cost || (person.relationType === 'celebrity' || person.relationType === 'artist' ? getNpcCastingFee(person.name) : 0));

    // Validate if player can afford this cast member
    const currentTotalCastCost = castList.reduce((acc, c) => acc + (c.cost || 0), 0);
    if (!isFree && cost > 0 && activeArtistData.money < (currentTotalCastCost + cost)) {
      setCastingError(`Insufficient funds! Casting ${person.name} requires a $${cost.toLocaleString()} talent fee (You have $${activeArtistData.money.toLocaleString()}).`);
      return;
    }
    setCastingError(null);

    const newMember: CastMember = {
      id: person.id || crypto.randomUUID(),
      name: person.name,
      roleType: defaultRole,
      relationType: person.relationType,
      image: person.image || getArtistImage(person.name) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      isFree,
      cost,
      popularityBonus: person.popularityBonus || (person.relationType === 'ex' ? 35 : person.relationType === 'group_member' ? 30 : person.relationType === 'celebrity' ? 45 : 20),
    };

    setter([...castList, newMember]);
  };

  const handleRemoveFromCast = (memberId: string, isMovie: boolean = false) => {
    const castList = isMovie ? movieCast : tvCast;
    const setter = isMovie ? setMovieCast : setTvCast;
    setter(castList.filter((c) => c.id !== memberId));
  };

  const handleToggleCastRole = (memberId: string, isMovie: boolean = false) => {
    const castList = isMovie ? movieCast : tvCast;
    const setter = isMovie ? setMovieCast : setTvCast;
    setter(
      castList.map((c) => {
        if (c.id === memberId) {
          const nextRole: 'main' | 'recurring' | 'guest' =
            c.roleType === 'main' ? 'recurring' : c.roleType === 'recurring' ? 'guest' : 'main';
          return { ...c, roleType: nextRole };
        }
        return c;
      })
    );
  };

  // Launch TV Show
  const handleLaunchTvShow = () => {
    setTvFormError(null);
    if (!tvTitle.trim()) {
      setTvFormError("Please enter a title for your TV show.");
      return;
    }

    const selfMember = initializeSelfCast();
    const finalCast = tvCast.some((c) => c.id === selfMember.id) ? tvCast : [selfMember, ...tvCast];
    const totalCastFees = finalCast.reduce((acc, c) => acc + (c.cost || 0), 0);

    if (totalCastFees > 0 && activeArtistData.money < totalCastFees) {
      setTvFormError(`Insufficient funds! You need $${totalCastFees.toLocaleString()} to pay your cast talent fees (You currently have $${activeArtistData.money.toLocaleString()}).`);
      return;
    }

    const currentDateObj = (gameState as any).date || { week: 1, year: 2024 };
    const newShow: TvAndFilmProject = {
      id: crypto.randomUUID(),
      title: tvTitle.trim(),
      type: "tv",
      category: tvCategory,
      synopsis: tvSynopsis.trim() || `${artistName}'s groundbreaking new television experience.`,
      coverUrl: tvCoverUrl,
      status: "airing",
      releaseDate: currentDateObj,
      seasonsCount: 1,
      currentSeason: 1,
      episodesPerSeason: tvEpisodesCount,
      episodesAiredInSeason: 0,
      episodes: [],
      cast: finalCast,
      isRealityTv: tvCategory === "Reality TV",
      hasYouTubeDeal: tvCategory === "Reality TV" ? tvHasYouTubeDeal : false,
      youtubeEpisodeThumbnails: {},
      network: tvNetwork,
      imdbRating: 8.4,
      totalViewers: 0,
      canBeRenewed: false,
    };

    dispatch({
      type: "CREATE_TV_FILM_PROJECT",
      payload: { project: newShow },
    });

    // Reset Form
    setTvTitle("");
    setTvSynopsis("");
    setTvCast([]);
    setTvFormError(null);
    setActiveTab("dashboard");
    setSelectedProject(newShow);
  };

  // Greenlight Movie
  const handleLaunchMovie = () => {
    setMovieFormError(null);
    if (!movieTitle.trim()) {
      setMovieFormError("Please enter a title for your movie.");
      return;
    }

    const selfMember = initializeSelfCast();
    const finalCast = movieCast.some((c) => c.id === selfMember.id) ? movieCast : [selfMember, ...movieCast];
    const totalCastFees = finalCast.reduce((acc, c) => acc + (c.cost || 0), 0);
    const totalRequiredBudget = movieBudgetTier + totalCastFees;

    if (activeArtistData.money < totalRequiredBudget) {
      const budgetFormatted = movieBudgetTier >= 1000000 
        ? `$${(movieBudgetTier / 1000000).toFixed(movieBudgetTier % 1000000 === 0 ? 0 : 1)}M`
        : `$${(movieBudgetTier / 1000).toFixed(0)}K`;
      setMovieFormError(
        `Insufficient funds! You need $${totalRequiredBudget.toLocaleString()} (${budgetFormatted} production + $${totalCastFees.toLocaleString()} cast fees) to produce this film (You currently have $${activeArtistData.money.toLocaleString()}).`
      );
      return;
    }

    const currentDateObj = (gameState as any).date || { week: 1, year: 2024 };
    const newMovie: TvAndFilmProject = {
      id: crypto.randomUUID(),
      title: movieTitle.trim(),
      type: "movie",
      category: movieCategory,
      synopsis: movieSynopsis.trim() || `A major motion picture starring ${artistName}.`,
      coverUrl: movieCoverUrl,
      status: "in_production",
      releaseDate: currentDateObj,
      cast: finalCast,
      budget: movieBudgetTier,
      productionWeeksRemaining: 4,
      imdbRating: 7.8,
    };

    dispatch({
      type: "CREATE_TV_FILM_PROJECT",
      payload: { project: newMovie },
    });

    setMovieTitle("");
    setMovieSynopsis("");
    setMovieCast([]);
    setMovieFormError(null);
    setActiveTab("dashboard");
    setSelectedProject(newMovie);
  };

  // Renew TV Show
  const handleConfirmRenewal = () => {
    if (!showRenewalModal) return;

    dispatch({
      type: "RENEW_TV_SHOW",
      payload: {
        projectId: showRenewalModal.id,
        episodesCount: renewalEpisodesCount,
        coverUrl: renewalCoverUrl || showRenewalModal.coverUrl,
      },
    });

    if (selectedProject && selectedProject.id === showRenewalModal.id) {
      setSelectedProject({
        ...selectedProject,
        currentSeason: (selectedProject.currentSeason || 1) + 1,
        seasonsCount: Math.max(selectedProject.seasonsCount || 1, (selectedProject.currentSeason || 1) + 1),
        episodesPerSeason: renewalEpisodesCount,
        episodesAiredInSeason: 0,
        status: 'airing',
        canBeRenewed: false,
        coverUrl: renewalCoverUrl || selectedProject.coverUrl,
      });
    }

    setShowRenewalModal(null);
  };

  // Add Guest Star to existing project
  const handleAddGuestStarToProject = () => {
    if (!showAddGuestModal || !customGuestName.trim()) return;

    const trimmedName = customGuestName.trim();
    const isNpc = NPC_ARTIST_NAMES.some((n) => n.toLowerCase() === trimmedName.toLowerCase());
    const finalCost = customGuestCost > 0 ? customGuestCost : (isNpc ? getNpcCastingFee(trimmedName) : 0);

    if (finalCost > 0 && activeArtistData.money < finalCost) {
      setGuestModalError(`Insufficient funds! Casting ${trimmedName} requires a $${finalCost.toLocaleString()} talent fee (You have $${activeArtistData.money.toLocaleString()}).`);
      return;
    }

    const guestMember: CastMember = {
      id: crypto.randomUUID(),
      name: trimmedName,
      roleType: customGuestRole,
      relationType: customGuestRelationType || (isNpc ? "celebrity" : "friend"),
      isFree: finalCost === 0,
      cost: finalCost,
      popularityBonus: isNpc ? 45 : 25,
      image: customGuestImage || getArtistImage(trimmedName) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    };

    dispatch({
      type: "ADD_GUEST_CAST_MEMBER",
      payload: {
        projectId: showAddGuestModal.id,
        castMember: guestMember,
      },
    });

    if (selectedProject && selectedProject.id === showAddGuestModal.id) {
      setSelectedProject({
        ...selectedProject,
        cast: [...(selectedProject.cast || []), guestMember],
      });
    }

    setCustomGuestName("");
    setCustomGuestCost(0);
    setCustomGuestImage("");
    setCustomGuestRelationType("celebrity");
    setGuestModalError(null);
    setShowAddGuestModal(null);
  };

  // Update Episode Thumbnail for YouTube Deal
  const handleUploadEpisodeThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProject && editingThumbnailEp !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          dispatch({
            type: "UPDATE_EPISODE_YOUTUBE_THUMBNAIL",
            payload: {
              projectId: selectedProject.id,
              episodeNumber: editingThumbnailEp,
              thumbnailUrl: reader.result,
            },
          });
          setEditingThumbnailEp(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sign YouTube Deal later
  const handleSignYouTubeDeal = (projectId: string) => {
    dispatch({
      type: "SIGN_YOUTUBE_DEAL",
      payload: { projectId },
    });
  };

  const renderCastingSuite = (isMovie: boolean) => {
    const castList = isMovie ? movieCast : tvCast;
    const tab = isMovie ? movieCastingTab : tvCastingTab;
    const setTab = isMovie ? setMovieCastingTab : setTvCastingTab;
    const search = isMovie ? movieNpcSearch : tvNpcSearch;
    const setSearch = isMovie ? setMovieNpcSearch : setTvNpcSearch;

    const totalCastFees = castList.reduce((acc, c) => acc + (c.cost || 0), 0);

    const filteredNpcs = NPC_ARTIST_NAMES.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase().trim())
    );

    const isPersonInCast = (name: string) => {
      return castList.some((c) => c.name.toLowerCase() === name.toLowerCase());
    };

    return (
      <div className="space-y-4 pt-3 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Casting Suite & Star Talent Roster
            </h3>
            <p className="text-[11px] text-zinc-400">
              Cast your partner, exes, kids, and group members for <span className="text-emerald-400 font-semibold">FREE</span> — or recruit NPC celebrity artists (<span className="text-amber-400 font-medium">$70K–$1M fee</span>) to boost initial buzz & box office!
            </p>
          </div>
          {totalCastFees > 0 && (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1.5 self-start sm:self-auto">
              <DollarSign className="w-3.5 h-3.5" />
              Cast Fees: ${totalCastFees.toLocaleString()}
            </div>
          )}
        </div>

        {/* Talent Category Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2.5">
          <button
            type="button"
            onClick={() => setTab("family")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tab === "family"
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            Family & Exes (FREE)
          </button>

          <button
            type="button"
            onClick={() => setTab("group")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tab === "group"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Group Members (FREE)
            {groupMembers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/40 text-white font-black">
                {groupMembers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("npcs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tab === "npcs"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            NPC Celebrity Artists ($70K–$1M)
          </button>
        </div>

        {/* TAB 1: FAMILY & EXES */}
        {tab === "family" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Partner */}
            <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Heart className="w-3 h-3" />
                  Current Partner (FREE)
                </span>
                {currentPartner ? (
                  <div className="flex items-center gap-2.5 mt-2">
                    <img
                      src={getPartnerImage(currentPartner)}
                      alt={getPartnerName(currentPartner)}
                      className="w-10 h-10 rounded-full object-cover border border-pink-500/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{getPartnerName(currentPartner)}</p>
                      <p className="text-[10px] text-zinc-400">{currentPartner.status || "Partner"} • Romantic Lead</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-2 italic">No current partner.</p>
                )}
              </div>

              {currentPartner && (
                <div className="mt-3 pt-2 border-t border-zinc-900">
                  {isPersonInCast(getPartnerName(currentPartner)) ? (
                    <span className="w-full py-1 bg-zinc-900 text-zinc-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 text-pink-400" />
                      In Cast
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPersonToCast(
                          {
                            id: `partner_${currentPartner.id || "current"}`,
                            name: getPartnerName(currentPartner),
                            relationType: "partner",
                            image: getPartnerImage(currentPartner),
                            isFree: true,
                            cost: 0,
                          },
                          "main",
                          isMovie
                        )
                      }
                      className="w-full py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-lg text-xs font-bold hover:bg-pink-500/30 transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Cast Partner
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Exes */}
            <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3 h-3" />
                  Ex-Partners (FREE)
                </span>
                {exPartners.length > 0 ? (
                  <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                    {exPartners.map((ex) => {
                      const pName = getPartnerName(ex);
                      const inCast = isPersonInCast(pName);
                      return (
                        <div key={ex.id} className="flex items-center justify-between text-xs bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <img
                              src={getPartnerImage(ex)}
                              alt={pName}
                              className="w-7 h-7 rounded-full object-cover border border-amber-500/30 shrink-0"
                            />
                            <span className="text-zinc-200 truncate text-[11px] font-medium">{pName}</span>
                          </div>
                          {inCast ? (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] font-medium">
                              ✓ Cast
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddPersonToCast(
                                  {
                                    id: `ex_${ex.id}`,
                                    name: pName,
                                    relationType: "ex",
                                    image: getPartnerImage(ex),
                                    isFree: true,
                                    cost: 0,
                                  },
                                  "recurring",
                                  isMovie
                                )
                              }
                              className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold hover:bg-amber-500/30 transition shrink-0"
                            >
                              + Cast
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-2 italic">No recorded exes.</p>
                )}
              </div>
            </div>

            {/* 3. Children */}
            <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Baby className="w-3 h-3" />
                  Children (FREE)
                </span>
                {kids.length > 0 ? (
                  <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                    {kids.map((kid) => {
                      const kName = getKidName(kid);
                      const inCast = isPersonInCast(kName);
                      return (
                        <div key={kid.id} className="flex items-center justify-between text-xs bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <img
                              src={getKidImage(kid)}
                              alt={kName}
                              className="w-7 h-7 rounded-full object-cover border border-emerald-500/30 shrink-0"
                            />
                            <span className="text-zinc-200 truncate text-[11px] font-medium">{kName}</span>
                          </div>
                          {inCast ? (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] font-medium">
                              ✓ Cast
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddPersonToCast(
                                  {
                                    id: `kid_${kid.id}`,
                                    name: kName,
                                    relationType: "child",
                                    image: getKidImage(kid),
                                    isFree: true,
                                    cost: 0,
                                  },
                                  "recurring",
                                  isMovie
                                )
                              }
                              className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold hover:bg-emerald-500/30 transition shrink-0"
                            >
                              + Cast
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 mt-2 italic">No kids yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUP MEMBERS */}
        {tab === "group" && (
          <div className="space-y-2">
            {groupMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {groupMembers.map((member) => {
                  const inCast = isPersonInCast(member.name);
                  const memberImg = member.image || member.imageUrl || getArtistImage(member.name);
                  return (
                    <div
                      key={member.id}
                      className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-2.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={memberImg}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-indigo-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{member.name}</p>
                          <p className="text-[10px] text-indigo-400 font-medium">Bandmate • FREE</p>
                        </div>
                      </div>

                      {inCast ? (
                        <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 rounded-lg text-xs font-medium">
                          ✓ In Cast
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleAddPersonToCast(
                              {
                                id: `group_${member.id}`,
                                name: member.name,
                                relationType: "group_member",
                                image: memberImg,
                                isFree: true,
                                cost: 0,
                                popularityBonus: 30,
                              },
                              "main",
                              isMovie
                            )
                          }
                          className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold hover:bg-indigo-500/30 transition shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Cast
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-zinc-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-zinc-300">Solo Artist Career</p>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto mt-0.5">
                  You are currently pursuing a solo music career. If you form or join a group or band, all bandmates can be cast here with 0 talent fees!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NPC CELEBRITY ARTISTS */}
        {tab === "npcs" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 100+ celebrity artists (e.g. Taylor Swift, Drake, Billie Eilish, SZA)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-zinc-500"
                />
              </div>
              <span className="text-[11px] text-zinc-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Fee: $70K - $1M (Deducted on Greenlight)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredNpcs.slice(0, 36).map((npcName) => {
                const inCast = isPersonInCast(npcName);
                const fee = getNpcCastingFee(npcName);
                const canAfford = activeArtistData.money >= fee;
                const npcImg = getArtistImage(npcName);

                return (
                  <div
                    key={npcName}
                    className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-2.5 flex items-center justify-between hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                      <img
                        src={npcImg}
                        alt={npcName}
                        className="w-9 h-9 rounded-full object-cover border border-amber-500/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{npcName}</p>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-amber-400 font-extrabold">{formatCastingFee(fee)}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-purple-400 font-semibold">+45 Star Power</span>
                        </div>
                      </div>
                    </div>

                    {inCast ? (
                      <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 rounded-lg text-[11px] font-medium shrink-0">
                        ✓ In Cast
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() =>
                          handleAddPersonToCast(
                            {
                              id: `npc_${npcName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                              name: npcName,
                              relationType: "celebrity",
                              image: npcImg,
                              cost: fee,
                              isFree: false,
                              popularityBonus: 45,
                            },
                            "recurring",
                            isMovie
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                          canAfford
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                        }`}
                        title={!canAfford ? `Need $${fee.toLocaleString()} cash` : `Cast ${npcName}`}
                      >
                        <Plus className="w-3 h-3" />
                        {canAfford ? "Cast" : "Need Cash"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CURRENT CAST ROSTER */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-zinc-400 gap-1">
            <span className="text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Project Cast Roster ({castList.length + 1} Members)
            </span>
            <span className="text-[11px] text-zinc-400">
              Click role badge to cycle (Main / Recurring / Guest)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Self */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <img
                src={activeArtist?.image || activeArtistData.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                alt={artistName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span>★ {artistName} (Lead / Producer)</span>
            </div>

            {/* Added Cast */}
            {castList.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-medium"
              >
                <img
                  src={member.image || getArtistImage(member.name) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                  alt={member.name}
                  className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                />
                <span className="font-semibold text-white">{member.name}</span>

                {/* Relation Badge */}
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    member.relationType === "partner"
                      ? "bg-pink-500/20 text-pink-300"
                      : member.relationType === "ex"
                      ? "bg-amber-500/20 text-amber-300"
                      : member.relationType === "child"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : member.relationType === "group_member"
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {member.relationType === "group_member" ? "Bandmate" : member.relationType}
                </span>

                {/* Cost Badge */}
                {member.cost && member.cost > 0 ? (
                  <span className="text-[10px] text-amber-400 font-extrabold">
                    {formatCastingFee(member.cost)}
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 font-bold">FREE</span>
                )}

                {/* Role Toggle Pill */}
                <button
                  type="button"
                  onClick={() => handleToggleCastRole(member.id, isMovie)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    member.roleType === "main"
                      ? "bg-amber-400 text-black"
                      : member.roleType === "recurring"
                      ? "bg-purple-500/30 text-purple-300 border border-purple-400/40"
                      : "bg-blue-500/30 text-blue-300 border border-blue-400/40"
                  }`}
                  title="Click to toggle role"
                >
                  {member.roleType}
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFromCast(member.id, isMovie)}
                  className="text-zinc-500 hover:text-red-400 ml-0.5"
                  title="Remove from cast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="shrink-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="tv-film-exit-button"
            onClick={() => dispatch({ type: "CHANGE_VIEW", payload: "game" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 active:scale-95 transition font-medium text-xs shadow-sm cursor-pointer"
            title="Exit to Game"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Exit</span>
          </button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-amber-400" />
              TV & Film Studio
            </h1>
            <p className="text-xs text-zinc-400">
              Executive produce, cast, and broadcast your own shows & movies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="tv-film-hub-button"
            onClick={() => dispatch({ type: "CHANGE_VIEW", payload: "actingCareer" })}
            className="hidden sm:flex px-2.5 py-1.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-700 hover:text-white transition items-center gap-1 cursor-pointer"
            title="Hollywood Hub"
          >
            Acting Hub
          </button>
          <button
            id="tv-film-imdb-button"
            onClick={() => dispatch({ type: "CHANGE_VIEW", payload: "imdb" })}
            className="px-3 py-1.5 bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold hover:bg-amber-400/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Star className="w-3.5 h-3.5" />
            <span>IMDb</span>
          </button>
          <button
            id="tv-film-close-button"
            onClick={() => dispatch({ type: "CHANGE_VIEW", payload: "game" })}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 active:scale-95 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Main Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedProject(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === "dashboard"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <Tv className="w-4 h-4" />
              My Productions ({projects.length})
            </button>

            <button
              onClick={() => setActiveTab("create_tv")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === "create_tv"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <Radio className="w-4 h-4" />
              + Start TV Show
            </button>

            <button
              onClick={() => setActiveTab("create_movie")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === "create_movie"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <Film className="w-4 h-4" />
              + Produce Movie
            </button>
          </div>
        </div>

      {/* Content Container */}
      <main className="max-w-5xl mx-auto px-4 pt-5 pb-32">
        {/* TAB 1: DASHBOARD / MY PRODUCTIONS */}
        {activeTab === "dashboard" && (
          <div>
            {projects.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center my-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <Clapperboard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Active Productions Yet</h3>
                <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                  Start your own Reality TV show, sitcom, drama series, or feature movie. Cast your partner, exes, and children for free, choose season episodes, and receive detailed ratings emails after every broadcast!
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => setActiveTab("create_tv")}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition flex items-center gap-2"
                  >
                    <Tv className="w-4 h-4" />
                    Start a Reality TV / Comedy Show
                  </button>
                  <button
                    onClick={() => setActiveTab("create_movie")}
                    className="px-5 py-2.5 bg-zinc-800 text-white font-semibold rounded-xl text-sm border border-zinc-700 hover:bg-zinc-700 transition flex items-center gap-2"
                  >
                    <Film className="w-4 h-4" />
                    Produce a Feature Movie
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {projects.map((proj) => {
                  const isAiring = proj.status === "airing";
                  const isCompleted = proj.status === "completed";
                  const isMovie = proj.type === "movie";

                  return (
                    <div
                      key={proj.id}
                      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition shadow-lg flex flex-col"
                    >
                      {/* Banner / Poster Header */}
                      <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                        <img
                          src={proj.coverUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover opacity-85 hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/10 text-white">
                            {proj.category}
                          </span>
                          {proj.isRealityTv && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-500/80 backdrop-blur-md text-white">
                              Reality TV
                            </span>
                          )}
                          {proj.hasYouTubeDeal && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              YouTube Deal
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3">
                          {isAiring && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black flex items-center gap-1 shadow-md shadow-emerald-500/20 animate-pulse">
                              <Radio className="w-3 h-3" />
                              On Air (S{proj.currentSeason || 1})
                            </span>
                          )}
                          {proj.status === "in_production" && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-black flex items-center gap-1 shadow-md">
                              <Clapperboard className="w-3 h-3" />
                              Filming ({proj.productionWeeksRemaining} wks)
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-700 text-zinc-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {isMovie ? "Released" : "Season Finale Complete"}
                            </span>
                          )}
                        </div>

                        {/* Title overlay */}
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-xl font-black text-white drop-shadow-md truncate">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-zinc-300 drop-shadow truncate">
                            {proj.network || "Theatrical Release"} • Starring {artistName}
                          </p>
                        </div>
                      </div>

                      {/* Body Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {proj.synopsis}
                        </p>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-center">
                          <div>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                              {isMovie ? "Box Office" : "Total Viewers"}
                            </span>
                            <span className="text-xs font-extrabold text-amber-400">
                              {isMovie
                                ? proj.boxOfficeRevenue
                                  ? `$${(proj.boxOfficeRevenue / 1000000).toFixed(1)}M`
                                  : "Pending"
                                : `${(((proj.totalViewers || 0)) / 1000000).toFixed(2)}M`}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                              {isMovie ? "Status" : "Season Progress"}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {isMovie
                                ? proj.status === "in_production"
                                  ? "In Post"
                                  : "Debuted"
                                : `Ep ${proj.episodesAiredInSeason || 0}/${proj.episodesPerSeason || 10}`}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                              IMDb Score
                            </span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {proj.imdbRating || "8.5"}/10
                            </span>
                          </div>
                        </div>

                        {/* Cast Preview */}
                        {proj.cast && proj.cast.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                              <span className="font-semibold flex items-center gap-1">
                                <Users className="w-3 h-3 text-zinc-400" />
                                Star Cast ({proj.cast.length}):
                              </span>
                              <button
                                onClick={() => setShowAddGuestModal(proj)}
                                className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" />
                                Add Guest
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {proj.cast.slice(0, 4).map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                                >
                                  {c.name} ({c.roleType})
                                </span>
                              ))}
                              {proj.cast.length > 4 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800/50 text-zinc-400">
                                  +{proj.cast.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap gap-2 items-center border-t border-zinc-800">
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            {proj.type === "tv" ? "Manage Episodes & Cast" : "View Film Details"}
                          </button>

                          {proj.type === "tv" && proj.canBeRenewed && (
                            <button
                              onClick={() => {
                                setShowRenewalModal(proj);
                                setRenewalEpisodesCount(proj.episodesPerSeason || 10);
                                setRenewalCoverUrl(proj.coverUrl);
                              }}
                              className="py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition flex items-center justify-center gap-1"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              Renew S{(proj.currentSeason || 1) + 1}
                            </button>
                          )}

                          {proj.isRealityTv && !proj.hasYouTubeDeal && (
                            <button
                              onClick={() => handleSignYouTubeDeal(proj.id)}
                              className="py-2 px-3 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-red-600/20"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Sign YouTube Deal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: START TV SHOW FORM */}
        {activeTab === "create_tv" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Radio className="w-6 h-6 text-amber-400" />
                Launch a New Television Series
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Produce your own show, cast your partner, exes & children, set season episodes, and receive ratings reports after every broadcast.
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Show Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Reality TV", icon: "✨", desc: "Cast partners, exes, kids & YouTube deal" },
                  { name: "Comedy", icon: "😂", desc: "Witty sitcom or mockumentary" },
                  { name: "Drama", icon: "🎭", desc: "High-stakes prestige drama" },
                  { name: "Romance", icon: "💖", desc: "Heartfelt romantic serial" },
                  { name: "Horror / Thriller", icon: "👻", desc: "Chilling suspense & mystery" },
                  { name: "Sci-Fi / Fantasy", icon: "🚀", desc: "Futuristic world-building" },
                  { name: "Docuseries", icon: "🎥", desc: "Intimate music documentary" },
                ].map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setTvCategory(cat.name as TvShowCategory)}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      tvCategory === cat.name
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{cat.icon}</span>
                      {cat.name === "Reality TV" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-300 font-bold">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white">{cat.name}</div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1">{cat.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Network */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Show Title
                </label>
                <input
                  type="text"
                  placeholder={
                    tvCategory === "Reality TV"
                      ? "e.g. Keeping Up with The Popstar, Life & Love Unfiltered"
                      : "e.g. Late Night Confessions, Star City"
                  }
                  value={tvTitle}
                  onChange={(e) => setTvTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Broadcast Network / Platform
                </label>
                <select
                  value={tvNetwork}
                  onChange={(e) => setTvNetwork(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="E! Entertainment & Peacock">E! Entertainment & Peacock</option>
                  <option value="Bravo / NBCUniversal">Bravo / NBCUniversal</option>
                  <option value="Netflix Originals">Netflix Originals</option>
                  <option value="HBO Max / Warner Bros">HBO Max / Warner Bros</option>
                  <option value="Hulu / Disney">Hulu / Disney</option>
                  <option value="MTV & Paramount+">MTV & Paramount+</option>
                  <option value="Apple TV+">Apple TV+</option>
                </select>
              </div>
            </div>

            {/* Episodes Count in Season 1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Episodes in Season 1: <span className="text-amber-400 font-extrabold">{tvEpisodesCount} Episodes</span>
                </label>
                <span className="text-[11px] text-zinc-500">
                  Aires 1 episode each in-game week with detailed viewership email
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[6, 8, 10, 12, 16].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTvEpisodesCount(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      tvEpisodesCount === num
                        ? "bg-amber-500 text-black border-amber-400 shadow-md"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {num} Episodes
                  </button>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Logline / Synopsis
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe the concept, drama, or premise of your series..."
                value={tvSynopsis}
                onChange={(e) => setTvSynopsis(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CASTING SUITE */}
            {renderCastingSuite(false)}

            {/* YOUTUBE DEAL TOGGLE (REALITY TV ONLY) */}
            {tvCategory === "Reality TV" && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 to-zinc-950 border border-red-900/40 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Sign YouTube Distribution Deal
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                        Reality TV Exclusive
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Air each episode on YouTube simultaneously. You can upload custom episode thumbnails from your device, and each video receives views comparable to official interview videos.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={tvHasYouTubeDeal}
                    onChange={(e) => setTvHasYouTubeDeal(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            )}

            {/* COVER UPLOAD FROM DEVICE */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Show Cover / Key Art (Device Upload)</span>
                <span className="text-amber-400 font-medium lowercase">Pop Base will announce this on X</span>
              </label>

              <div className="flex items-center gap-4">
                <div className="w-24 h-28 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 relative group">
                  <img
                    src={tvCoverUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e, setTvCoverUrl)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Upload Cover from Device
                  </button>
                  <p className="text-[11px] text-zinc-500">
                    Recommended: 1080x1350 vertical poster or square.
                  </p>
                </div>
              </div>
            </div>

            {/* Pop Base Tweet Preview Banner */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-black font-black text-xs flex items-center justify-center shrink-0">
                PB
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                  <span>Pop Base</span>
                  <span className="text-[10px] text-zinc-500">@PopBase • Just now</span>
                </div>
                <p className="text-zinc-300 mt-1">
                  {tvCategory === "Reality TV"
                    ? `BREAKING: Pop Base confirms that ${artistName} is executive producing and starring in an unscripted Reality TV series titled '${tvTitle || "Untitled"}'!`
                    : `ANNOUNCEMENT: ${artistName} has officially greenlit a brand-new ${tvCategory} television series titled '${tvTitle || "Untitled"}'.`}
                </p>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleLaunchTvShow}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Launch & Announce TV Show to Network
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCE MOVIE FORM */}
        {activeTab === "create_movie" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Film className="w-6 h-6 text-amber-400" />
                Produce a Feature Movie
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Greenlight a major motion picture, cast co-stars, finance production, and premiere worldwide with box office revenue.
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Movie Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: "Comedy", icon: "😂" },
                  { name: "Romance", icon: "💖" },
                  { name: "Drama", icon: "🎭" },
                  { name: "Action", icon: "💥" },
                  { name: "Horror", icon: "🩸" },
                  { name: "Sci-Fi", icon: "🚀" },
                  { name: "Thriller", icon: "🔍" },
                ].map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setMovieCategory(cat.name as MovieCategory)}
                    className={`p-3 rounded-xl text-left border transition flex items-center gap-3 ${
                      movieCategory === cat.name
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-bold text-white">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Movie Title
              </label>
              <input
                type="text"
                placeholder="e.g. Heartstrings, Hollywood Nights, Summer of Secrets"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Budget Tier */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Production Budget Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { tier: 3000000, name: "Indie Feature", cost: "$3,000,000", desc: "High critical acclaim potential" },
                  { tier: 15000000, name: "Mid-Budget Studio Film", cost: "$15,000,000", desc: "Strong commercial balance" },
                  { tier: 50000000, name: "Blockbuster Epic", cost: "$50,000,000", desc: "Massive box office explosion" },
                ].map((b) => (
                  <button
                    key={b.tier}
                    type="button"
                    onClick={() => setMovieBudgetTier(b.tier)}
                    className={`p-3.5 rounded-xl text-left border transition ${
                      movieBudgetTier === b.tier
                        ? "bg-amber-500/10 border-amber-500 text-white"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{b.name}</div>
                    <div className="text-sm font-extrabold text-amber-400 mt-0.5">{b.cost}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Movie Synopsis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Movie Storyline / Synopsis
              </label>
              <textarea
                rows={2}
                placeholder="Logline describing the emotional stakes or cinematic spectacle..."
                value={movieSynopsis}
                onChange={(e) => setMovieSynopsis(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Poster Upload from Device */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Theatrical Poster (Upload from Device)</span>
                <span className="text-amber-400 font-medium lowercase">Pop Base will announce with this poster</span>
              </label>

              <div className="flex items-center gap-4">
                <div className="w-24 h-32 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0">
                  <img
                    src={movieCoverUrl}
                    alt="Movie poster"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={movieFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e, setMovieCoverUrl)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => movieFileInputRef.current?.click()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Upload Poster from Device
                  </button>
                  <p className="text-[11px] text-zinc-500">
                    High resolution vertical format recommended for theatrical release.
                  </p>
                </div>
              </div>
            </div>

            {/* CASTING SUITE */}
            {renderCastingSuite(true)}

            {/* Greenlight Action */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleLaunchMovie}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition flex items-center justify-center gap-2"
              >
                <Clapperboard className="w-4 h-4" />
                Greenlight Feature Film (${(movieBudgetTier / 1000000).toFixed(0)}M Budget
                {movieCast.reduce((a, b) => a + (b.cost || 0), 0) > 0 &&
                  ` + $${movieCast.reduce((a, b) => a + (b.cost || 0), 0).toLocaleString()} Cast Fees`}
                )
              </button>
            </div>
          </div>
        )}

        {/* MODAL: MANAGE PROJECT & EPISODES */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProject.coverUrl}
                    alt={selectedProject.title}
                    className="w-12 h-14 object-cover rounded-lg border border-zinc-800"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedProject.title}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold uppercase">
                        {selectedProject.category}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Season {selectedProject.currentSeason || 1} • {selectedProject.episodesAiredInSeason || 0}/
                      {selectedProject.episodesPerSeason || 10} Episodes Aired
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedProject.type === "tv" && selectedProject.canBeRenewed && (
                    <button
                      onClick={() => {
                        setShowRenewalModal(selectedProject);
                        setRenewalEpisodesCount(selectedProject.episodesPerSeason || 10);
                        setRenewalCoverUrl(selectedProject.coverUrl);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs hover:bg-emerald-400 transition flex items-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Renew Show
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* Cast Roster Banner */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      Show Cast Members
                    </h4>
                    <button
                      onClick={() => setShowAddGuestModal(selectedProject)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Guest Star
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProject.cast || []).map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center gap-2"
                      >
                        <span className="font-semibold text-white">{c.name}</span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            c.roleType === "main"
                              ? "bg-amber-400/20 text-amber-300"
                              : c.roleType === "recurring"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {c.roleType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Episodes List */}
                {selectedProject.type === "tv" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                        Aired Episodes ({selectedProject.episodes?.length || 0})
                      </h4>
                      {selectedProject.hasYouTubeDeal && (
                        <span className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          YouTube Deal Active
                        </span>
                      )}
                    </div>

                    {!selectedProject.episodes || selectedProject.episodes.length === 0 ? (
                      <div className="bg-zinc-950 p-6 rounded-xl text-center border border-zinc-800">
                        <p className="text-xs text-zinc-400">
                          No episodes have aired yet. Advance to next week to broadcast Episode 1 and receive your official Nielsen ratings email!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedProject.episodes.map((ep) => (
                          <div
                            key={ep.episodeNumber}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 relative group">
                                <img
                                  src={ep.thumbnailUrl || selectedProject.coverUrl}
                                  alt={ep.title}
                                  className="w-full h-full object-cover"
                                />
                                {selectedProject.hasYouTubeDeal && (
                                  <button
                                    onClick={() => {
                                      setEditingThumbnailEp(ep.episodeNumber);
                                      epThumbnailFileInputRef.current?.click();
                                    }}
                                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                                    title="Change YouTube Thumbnail"
                                  >
                                    <Upload className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{ep.title}</span>
                                  <span className="text-[10px] text-emerald-400 font-extrabold">
                                    ★ {ep.rating}/10
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                  {ep.synopsis}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                                  Viewers
                                </span>
                                <span className="text-xs font-extrabold text-amber-400">
                                  {(ep.viewers / 1000000).toFixed(2)}M
                                </span>
                              </div>

                              {selectedProject.hasYouTubeDeal && (
                                <button
                                  onClick={() => {
                                    setEditingThumbnailEp(ep.episodeNumber);
                                    epThumbnailFileInputRef.current?.click();
                                  }}
                                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3 h-3 text-red-400" />
                                  Thumbnail
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hidden thumbnail file input */}
                    <input
                      type="file"
                      ref={epThumbnailFileInputRef}
                      accept="image/*"
                      onChange={handleUploadEpisodeThumbnail}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RENEW TV SHOW */}
        {showRenewalModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-emerald-400" />
                  Renew "{showRenewalModal.title}"
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Following massive viewership ratings, order Season {(showRenewalModal.currentSeason || 1) + 1}! Pop Base will officially announce the renewal.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Episodes to Order: <span className="text-emerald-400">{renewalEpisodesCount} Episodes</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[6, 8, 10, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRenewalEpisodesCount(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        renewalEpisodesCount === num
                          ? "bg-emerald-500 text-black border-emerald-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional New Season Cover */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Update Season Cover (Optional)
                </label>
                <input
                  type="file"
                  ref={renewalFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleCoverUpload(e, setRenewalCoverUrl)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => renewalFileInputRef.current?.click()}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Upload New Season Art
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(null)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRenewal}
                  className="flex-1 py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  Confirm Renewal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD GUEST STAR */}
        {showAddGuestModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Cast into "{showAddGuestModal.title}"
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddGuestModal(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Recruit family, group bandmates, or famous NPC artists for upcoming episodes and storylines.
                </p>
              </div>

              {/* Modal Tabs */}
              <div className="flex gap-1.5 border-b border-zinc-800 pb-2 shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setGuestModalTab("quick")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    guestModalTab === "quick"
                      ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  Family & Exes (FREE)
                </button>

                <button
                  type="button"
                  onClick={() => setGuestModalTab("group")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    guestModalTab === "group"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Group Members (FREE)
                  {groupMembers.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/40 text-white font-black">
                      {groupMembers.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setGuestModalTab("npcs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    guestModalTab === "npcs"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  NPC Artists ($70K–$1M)
                </button>

                <button
                  type="button"
                  onClick={() => setGuestModalTab("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    guestModalTab === "custom"
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Custom Name
                </button>
              </div>

              {/* Modal Body / Tab Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[140px] max-h-[260px]">
                {/* 1. Family & Exes */}
                {guestModalTab === "quick" && (
                  <div className="space-y-2.5">
                    {/* Partner */}
                    {currentPartner && (
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getPartnerImage(currentPartner)}
                            alt={getPartnerName(currentPartner)}
                            className="w-9 h-9 rounded-full object-cover border border-pink-500/40"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{getPartnerName(currentPartner)}</p>
                            <p className="text-[10px] text-pink-400 font-medium">Current Partner • FREE</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const pName = getPartnerName(currentPartner);
                            setCustomGuestName(pName);
                            setCustomGuestCost(0);
                            setCustomGuestImage(getPartnerImage(currentPartner));
                            setCustomGuestRelationType("partner");
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            customGuestName === getPartnerName(currentPartner)
                              ? "bg-pink-500 text-white font-black"
                              : "bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                          }`}
                        >
                          {customGuestName === getPartnerName(currentPartner) ? "Selected ✓" : "Select"}
                        </button>
                      </div>
                    )}

                    {/* Exes */}
                    {exPartners.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          Ex-Partners (FREE)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {exPartners.map((ex) => {
                            const pName = getPartnerName(ex);
                            const pImg = getPartnerImage(ex);
                            const isSelected = customGuestName === pName;
                            return (
                              <div
                                key={ex.id}
                                className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-1">
                                  <img
                                    src={pImg}
                                    alt={pName}
                                    className="w-7 h-7 rounded-full object-cover border border-amber-500/40 shrink-0"
                                  />
                                  <span className="text-xs text-white truncate font-medium">{pName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomGuestName(pName);
                                    setCustomGuestCost(0);
                                    setCustomGuestImage(pImg);
                                    setCustomGuestRelationType("ex");
                                  }}
                                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition shrink-0 ${
                                    isSelected
                                      ? "bg-amber-500 text-black font-black"
                                      : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                  }`}
                                >
                                  {isSelected ? "Selected ✓" : "Select"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Kids */}
                    {kids.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Children (FREE)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {kids.map((kid) => {
                            const kName = getKidName(kid);
                            const kImg = getKidImage(kid);
                            const isSelected = customGuestName === kName;
                            return (
                              <div
                                key={kid.id}
                                className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-1">
                                  <img
                                    src={kImg}
                                    alt={kName}
                                    className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 shrink-0"
                                  />
                                  <span className="text-xs text-white truncate font-medium">{kName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomGuestName(kName);
                                    setCustomGuestCost(0);
                                    setCustomGuestImage(kImg);
                                    setCustomGuestRelationType("child");
                                  }}
                                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition shrink-0 ${
                                    isSelected
                                      ? "bg-emerald-500 text-black font-black"
                                      : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                  }`}
                                >
                                  {isSelected ? "Selected ✓" : "Select"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!currentPartner && exPartners.length === 0 && kids.length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-4 text-center">
                        No family, partner, or ex contacts available.
                      </p>
                    )}
                  </div>
                )}

                {/* 2. Group Members */}
                {guestModalTab === "group" && (
                  <div className="space-y-2">
                    {groupMembers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groupMembers.map((member) => {
                          const mImg = member.image || member.imageUrl || getArtistImage(member.name);
                          const isSelected = customGuestName === member.name;
                          return (
                            <div
                              key={member.id}
                              className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                <img
                                  src={mImg}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover border border-indigo-500/40 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{member.name}</p>
                                  <p className="text-[10px] text-indigo-400">Bandmate • FREE</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomGuestName(member.name);
                                  setCustomGuestCost(0);
                                  setCustomGuestImage(mImg);
                                  setCustomGuestRelationType("group_member");
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                                  isSelected
                                    ? "bg-indigo-500 text-white font-black"
                                    : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                                }`}
                              >
                                {isSelected ? "Selected ✓" : "Select"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-950/60 rounded-xl text-center space-y-1">
                        <Users className="w-5 h-5 text-zinc-500 mx-auto" />
                        <p className="text-xs font-bold text-zinc-400">Solo Artist Career</p>
                        <p className="text-[11px] text-zinc-500">
                          Form or join a group in the band tab to unlock free casting for bandmates!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. NPC Artists */}
                {guestModalTab === "npcs" && (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search celebrity artists (Taylor Swift, Drake, SZA)..."
                        value={guestNpcSearch}
                        onChange={(e) => setGuestNpcSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {NPC_ARTIST_NAMES.filter((n) =>
                        n.toLowerCase().includes(guestNpcSearch.toLowerCase().trim())
                      )
                        .slice(0, 30)
                        .map((npcName) => {
                          const fee = getNpcCastingFee(npcName);
                          const canAfford = activeArtistData.money >= fee;
                          const npcImg = getArtistImage(npcName);
                          const isSelected = customGuestName === npcName;

                          return (
                            <div
                              key={npcName}
                              className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                <img
                                  src={npcImg}
                                  alt={npcName}
                                  className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{npcName}</p>
                                  <p className="text-[10px] text-amber-400 font-extrabold">{formatCastingFee(fee)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => {
                                  setCustomGuestName(npcName);
                                  setCustomGuestCost(fee);
                                  setCustomGuestImage(npcImg);
                                  setCustomGuestRelationType("celebrity");
                                }}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition shrink-0 ${
                                  isSelected
                                    ? "bg-amber-500 text-black font-black"
                                    : canAfford
                                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                }`}
                              >
                                {isSelected ? "Selected ✓" : canAfford ? "Select" : "No Cash"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 4. Custom Name */}
                {guestModalTab === "custom" && (
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Enter Custom Guest Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Celebrity Cameo, High-Profile Star"
                      value={customGuestName}
                      onChange={(e) => {
                        setCustomGuestName(e.target.value);
                        setCustomGuestCost(0);
                        setCustomGuestRelationType("friend");
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Selected Talent & Role Config Bar */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-zinc-400 shrink-0">Casting:</span>
                    <span className="text-xs font-black text-white truncate">
                      {customGuestName || "No person selected yet"}
                    </span>
                  </div>
                  {customGuestName && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 ${
                        customGuestCost > 0
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {customGuestCost > 0 ? `Fee: $${customGuestCost.toLocaleString()}` : "FREE"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
                  <span className="text-xs text-zinc-400 font-bold shrink-0">Role Type:</span>
                  <div className="flex gap-1.5">
                    {(["main", "recurring", "guest"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCustomGuestRole(r)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                          customGuestRole === r
                            ? "bg-amber-500 text-black font-black"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(null)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!customGuestName.trim()}
                  onClick={handleAddGuestStarToProject}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 ${
                    customGuestName.trim()
                      ? "bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20"
                      : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {customGuestCost > 0
                    ? `Cast Star ($${customGuestCost.toLocaleString()})`
                    : "Cast into Project (FREE)"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};
