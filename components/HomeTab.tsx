import React, { useState, useMemo } from "react";
import { useGame, formatNumber } from "../context/GameContext";
import ChevronDownIcon from "./icons/ChevronDownIcon";
import StarIcon from "./icons/StarIcon";
import FireIcon from "./icons/FireIcon";
import { Artist, Group, LabelSubmission, Song } from "../types";
import ChevronRightIcon from "./icons/ChevronRightIcon";
import ConfirmationModal from "./ConfirmationModal";

const QualityBadge: React.FC<{ quality: number; showNumber: boolean }> = ({
  quality,
  showNumber,
}) => {
  const getQualityColor = () => {
    if (quality < 50) return "bg-red-500 text-white";
    if (quality < 70) return "bg-yellow-500 text-black";
    if (quality < 96) return "bg-green-400 text-black";
    return "bg-green-600 text-white";
  };
  return (
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg ${getQualityColor()}`}
    >
      {showNumber ? quality : ""}
    </div>
  );
};

const UnreleasedSongItem: React.FC<{
  song: Song;
  showQualityNumber: boolean;
  onDelete?: (songId: string) => void;
  onToggleVault?: (songId: string) => void;
}> = ({ song, showQualityNumber, onDelete, onToggleVault }) => (
  <div
    className={`bg-zinc-800 p-3 rounded-lg flex items-center gap-4 ${song.isVaulted ? "opacity-70 grayscale border-zinc-600 border" : ""}`}
  >
    <img
      src={song.coverArt}
      alt={song.title}
      className="w-16 h-16 rounded-md object-cover"
    />
    <div className="flex-grow">
      <p className="font-bold">
        {song.title}{" "}
        {song.isVaulted && (
          <span className="text-xs bg-zinc-700 text-zinc-300 px-1 py-0.5 rounded ml-2 uppercase">
            Vaulted
          </span>
        )}
      </p>
      <p className="text-sm text-zinc-400">{song.genre}</p>
      {song.leakInfo && (
        <div className="mt-1 text-xs font-semibold flex items-center gap-3">
          <span className="text-red-400 flex items-center gap-1">
            ⚠️ Leaked
          </span>
        </div>
      )}
    </div>
    <div className="flex flex-col items-center">
        <QualityBadge quality={song.quality} showNumber={showQualityNumber} />
        {showQualityNumber && (song as any).trait && (
            <span className="text-[9px] text-zinc-400 mt-1 uppercase font-bold text-center leading-tight max-w-[60px]">{(song as any).trait}</span>
        )}
    </div>
    {onToggleVault && (
      <button
        onClick={() => onToggleVault(song.id)}
        className="p-2 ml-2 bg-zinc-600 rounded-md text-white font-bold text-xs hover:bg-zinc-500"
      >
        {song.isVaulted ? "Unvault" : "Vault"}
      </button>
    )}
    {onDelete && (
      <button
        onClick={() => onDelete(song.id)}
        className="p-2 ml-1 bg-red-600 rounded-md text-white font-bold text-xs hover:bg-red-500"
      >
        Delete
      </button>
    )}
  </div>
);

const SubmissionStatusBadge: React.FC<{
  status: LabelSubmission["status"];
}> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="text-xs font-bold text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded-full">
          Pending
        </span>
      );
    case "awaiting_player_input":
      return (
        <span className="text-xs font-bold text-blue-400 bg-blue-900/50 px-2 py-1 rounded-full">
          Action Required
        </span>
      );
    case "scheduled":
      return (
        <span className="text-xs font-bold text-purple-400 bg-purple-900/50 px-2 py-1 rounded-full">
          Scheduled
        </span>
      );
    case "rejected":
      return (
        <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full">
          Rejected
        </span>
      );
  }
};

const SubmissionItem: React.FC<{ submission: LabelSubmission }> = ({
  submission,
}) => {
  const { dispatch } = useGame();

  const handlePlanRelease = () => {
    dispatch({
      type: "GO_TO_LABEL_PLAN",
      payload: { submissionId: submission.id },
    });
  };

  return (
    <div className="bg-zinc-800 p-3 rounded-lg flex items-center gap-4">
      <img
        src={submission.release.coverArt}
        alt={submission.release.title}
        className="w-16 h-16 rounded-md object-cover"
      />
      <div className="flex-grow">
        <p className="font-bold">{submission.release.title}</p>
        <p className="text-sm text-zinc-400">
          {submission.release.type.replace(" (Deluxe)", "")}
        </p>
        {submission.status === "scheduled" && submission.projectReleaseDate && (
          <p className="text-xs text-green-300">
            Releasing W{submission.projectReleaseDate.week},{" "}
            {submission.projectReleaseDate.year}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <SubmissionStatusBadge status={submission.status} />
        {submission.status === "awaiting_player_input" && (
          <button
            onClick={handlePlanRelease}
            className="text-sm bg-blue-500 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-600"
          >
            Plan Release
          </button>
        )}
        {submission.status === "scheduled" && (
          <button
            onClick={() =>
              dispatch({
                type: "CANCEL_SCHEDULED_RELEASE",
                payload: { submissionId: submission.id },
              })
            }
            className="text-xs bg-red-600/20 text-red-400 font-semibold px-2 py-1 rounded hover:bg-red-600/40"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const RegionalPopularityBar: React.FC<{
  region: string;
  score: number;
  color: string;
}> = ({ region, score, color }) => (
  <div>
    <div className="flex justify-between items-baseline text-sm">
      <p className="font-semibold text-zinc-300">{region}</p>
      <p className="font-mono text-zinc-400">{score.toFixed(0)}/100</p>
    </div>
    <div className="w-full bg-zinc-700 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${score}%` }}
      ></div>
    </div>
  </div>
);

const HomeTab: React.FC = () => {
  const {
    gameState,
    dispatch,
    activeArtist,
    activeArtistData,
    allPlayerArtists,
  } = useGame();
  const { date, careerMode, activeArtistId } = gameState;
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isEraModalOpen, setIsEraModalOpen] = useState(false);
  const [isPopularityExpanded, setIsPopularityExpanded] = useState(false);
  const [deleteSongId, setDeleteSongId] = useState<string | null>(null);

  if (!activeArtistData || !activeArtist) return null;

  const {
    money,
    hype,
    popularity,
    songs,
    labelSubmissions,
    contract,
    redMicPro,
  } = activeArtistData;

  const isPro = Boolean(redMicPro && redMicPro.unlocked);

  const hasNo1Hit = useMemo(() => {
    return (
      (activeArtistData.numberOneDebuts || 0) > 0 ||
      (gameState.chartHistory &&
        Object.values(gameState.chartHistory).some(
          (h: any) => h.peak === 1 && songs.some((s) => s.id === h.songId)
        )) ||
      (gameState.billboardHot100 &&
        gameState.billboardHot100.some(
          (e) => e.isPlayerSong && e.rank === 1 && songs.some((s) => s.id === e.songId)
        ))
    );
  }, [activeArtistData, gameState.chartHistory, gameState.billboardHot100, songs]);

  const hasNo1Album = useMemo(() => {
    return (
      (gameState.albumChartHistory &&
        Object.values(gameState.albumChartHistory).some(
          (h: any) =>
            h.peak === 1 &&
            activeArtistData.releases.some((r) => r.id === h.albumId)
        )) ||
      (gameState.billboardTopAlbums &&
        gameState.billboardTopAlbums.some(
          (e) =>
            e.isPlayerAlbum &&
            e.rank === 1 &&
            activeArtistData.releases.some((r) => r.id === e.albumId)
        ))
    );
  }, [activeArtistData.releases, gameState.albumChartHistory, gameState.billboardTopAlbums]);

  const hasTop10Hit = useMemo(() => {
    return (
      hasNo1Hit ||
      (gameState.chartHistory &&
        Object.values(gameState.chartHistory).some(
          (h: any) => h.peak <= 10 && songs.some((s) => s.id === h.songId)
        )) ||
      (gameState.billboardHot100 &&
        gameState.billboardHot100.some(
          (e) => e.isPlayerSong && e.rank <= 10 && songs.some((s) => s.id === e.songId)
        ))
    );
  }, [hasNo1Hit, gameState.chartHistory, gameState.billboardHot100, songs]);

  const hasMassiveStreams = useMemo(() => {
    return (
      songs.some((s) => (s.weeklyStreams || 0) >= 12000000) ||
      activeArtistData.releases.some((r) => (r.firstWeekStreams || 0) >= 10000000)
    );
  }, [songs, activeArtistData.releases]);

  const has20MListeners = (activeArtistData.monthlyListeners || 0) >= 20000000;
  const hasCriticalAcclaim = activeArtistData.releases.some(
    (r) => r.review && r.review.score >= 8.0
  );

  const qualifiesForSmash =
    hasNo1Hit ||
    hasNo1Album ||
    hasTop10Hit ||
    hasMassiveStreams ||
    has20MListeners ||
    hasCriticalAcclaim;

  const regionalScores = useMemo(() => {
    if (activeArtistData.regionalPopularity && Object.keys(activeArtistData.regionalPopularity).length > 0) { return Object.entries(activeArtistData.regionalPopularity).map(([k, v]) => ({ region: k, score: v as number })); }
    const base = popularity;
    const regions = ["US", "Canada", "Latin America", "Asia", "UK", "Africa"];
    const scores: { region: string; score: number }[] = [];
    let scoreSum = 0;

    for (let i = 0; i < regions.length - 1; i++) {
      const seed = (activeArtistId.charCodeAt(0) || 0) + i;
      const rand = Math.abs(Math.sin(seed) * 10000) % 1;
      const variance = (rand - 0.5) * 20; // -10 to +10 deterministic variance
      let score = base + variance;
      if ((activeArtistData.location || (activeArtist as Artist).country) === regions[i]) {
        score += 5; // Home country boost
      }
      score = Math.max(0, Math.min(100, score));
      scores.push({ region: regions[i], score });
      scoreSum += score;
    }

    // Adjust the last region to make the average roughly equal to the base popularity
    const lastRegion = regions[regions.length - 1];
    let lastScore = base * regions.length - scoreSum;
    if ((activeArtistData.location || (activeArtist as Artist).country) === lastRegion) {
      lastScore += 5;
    }
    lastScore = Math.max(0, Math.min(100, lastScore));
    scores.push({ region: lastRegion, score: lastScore });

    return scores.sort((a, b) => b.score - a.score);
  }, [popularity, activeArtist]);

  const getWeekDate = (d: { week: number; year: number; day?: number }) => {
    const dayOffset = d.day !== undefined ? (d.day - 1) : 0;
    const date = new Date(d.year, 0, (d.week - 1) * 7 + 1 + dayOffset);
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    if (d.day !== undefined || gameState.timeMode === "daily") {
      const weekday = date.toLocaleString("en-US", { weekday: "short" });
      return `${weekday}, ${month} ${day}, ${d.year}`;
    }
    return `${month} ${day}, ${d.year}`;
  };

  const widthPercentagePopularity = `${popularity}%`;
  const widthPercentageHype = `${hype}%`;
  const publicImageVal = activeArtistData.publicImage ?? 80;
  const widthPercentagePublicImage = `${publicImageVal}%`;

  const getPopularityColor = (p: number) => {
    if (p < 50) return "from-red-600 to-red-500";
    if (p < 70) return "from-yellow-500 to-yellow-400";
    if (p < 91) return "from-green-500 to-green-400";
    return "from-emerald-600 to-emerald-500";
  };

  const getPublicImageInfo = (score: number) => {
    if (score <= 20)
      return {
        label: "Cancelled",
        color: "bg-red-600",
        textColor: "text-red-500",
      };
    if (score <= 40)
      return {
        label: "Problematic",
        color: "bg-orange-500",
        textColor: "text-orange-500",
      };
    if (score <= 60)
      return {
        label: "Controversial",
        color: "bg-yellow-500",
        textColor: "text-yellow-500",
      };
    if (score <= 80)
      return {
        label: "Respected",
        color: "bg-green-400",
        textColor: "text-green-400",
      };
    return {
      label: "Beloved",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
    };
  };

  const unreleasedSongs = songs.filter((s) => !s.isReleased && !s.releaseId);

  const hasUnreleased = unreleasedSongs.length > 0;

  return (
    <div className="p-4 space-y-8">
      {isSwitcherOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsSwitcherOpen(false)}
        >
          <div
            className="bg-zinc-800 rounded-lg p-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Switch Artist</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {allPlayerArtists.map((artist: Artist | Group) => (
                <button
                  key={artist.id}
                  onClick={() => {
                    dispatch({
                      type: "CHANGE_ACTIVE_ARTIST",
                      payload: artist.id,
                    });
                    setIsSwitcherOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${activeArtistId === artist.id ? "bg-red-600" : "hover:bg-zinc-700"}`}
                >
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-semibold">{artist.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <header className="flex justify-between items-center flex-shrink-0">
        <div>
          <p className="text-lg font-bold">
            Week {date.week}, {date.year}
          </p>
          <p className="text-sm text-zinc-400">{getWeekDate(date)}</p>
          <p className="text-3xl font-bold text-green-400 mt-1">
            ${formatNumber(money)}
          </p>
        </div>
        {allPlayerArtists.length > 1 && (
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <img
              src={activeArtist.image}
              alt={activeArtist.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-left">
              <p className="text-xs text-zinc-400">Active</p>
              <p className="font-semibold">{activeArtist.name}</p>
            </div>
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        )}
      </header>

      <div>
        {gameState.difficultyMode !== "easy" && (
          <div className="mb-8">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500 text-sm">
                Career Stage
              </h2>
              <button
                onClick={() => setIsEraModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Manage Era & Requirements</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div
              onClick={() => setIsEraModalOpen(true)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                activeArtistData.careerStage === "flop"
                  ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                  : activeArtistData.careerStage === "smash"
                    ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
                    : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeArtistData.careerStage === "flop" && (
                    <div className="text-3xl">📉</div>
                  )}
                  {activeArtistData.careerStage === "smash" && (
                    <div className="text-3xl">🚀</div>
                  )}
                  {(!activeArtistData.careerStage ||
                    activeArtistData.careerStage === "neutral") && (
                    <div className="text-3xl">⚖️</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-black text-xl uppercase tracking-wider ${
                          activeArtistData.careerStage === "flop"
                            ? "text-red-400"
                            : activeArtistData.careerStage === "smash"
                              ? "text-green-400"
                              : "text-zinc-300"
                        }`}
                      >
                        {activeArtistData.careerStage === "flop"
                          ? "Flop Era"
                          : activeArtistData.careerStage === "smash"
                            ? "Smash Era"
                            : "Neutral Era"}
                      </h3>
                      {isPro && (activeArtistData.eraLock || activeArtistData.stuckOnEra) && (
                        <span className="text-[10px] uppercase font-bold bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded-full border border-amber-600">
                          Era Locked
                        </span>
                      )}
                      {isPro && activeArtistData.flopEraLock && (
                        <span className="text-[10px] uppercase font-bold bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-600">
                          Flop Locked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      {activeArtistData.careerStage === "flop"
                        ? "-80% on all streams and physical sales on new releases."
                        : activeArtistData.careerStage === "smash"
                          ? "+30% on all streams and physical sales on new releases."
                          : "Your career is currently stable."}
                    </p>
                  </div>
                </div>
                <div className="text-zinc-400 text-sm font-medium flex items-center gap-1">
                  <span>Details</span>
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Era Management & Requirements Modal */}
        {isEraModalOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEraModalOpen(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-6 text-zinc-100 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-xl font-black">Era Management & Milestones</h2>
                </div>
                <button
                  onClick={() => setIsEraModalOpen(false)}
                  className="text-zinc-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-zinc-800"
                >
                  ✕
                </button>
              </div>

              {/* Current Active Era */}
              <div
                className={`p-4 rounded-xl border ${
                  activeArtistData.careerStage === "flop"
                    ? "bg-red-500/10 border-red-500/30"
                    : activeArtistData.careerStage === "smash"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <p className="text-xs uppercase tracking-widest font-bold text-zinc-400">Current Era Status</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {activeArtistData.careerStage === "flop" ? "📉" : activeArtistData.careerStage === "smash" ? "🚀" : "⚖️"}
                    </span>
                    <div>
                      <h3
                        className={`text-2xl font-black uppercase ${
                          activeArtistData.careerStage === "flop"
                            ? "text-red-400"
                            : activeArtistData.careerStage === "smash"
                              ? "text-green-400"
                              : "text-zinc-200"
                        }`}
                      >
                        {activeArtistData.careerStage === "flop"
                          ? "Flop Era"
                          : activeArtistData.careerStage === "smash"
                            ? "Smash Era"
                            : "Neutral Era"}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {activeArtistData.careerStage === "flop"
                          ? "Penalty: -80% streams & physical sales on all releases within 26 weeks."
                          : activeArtistData.careerStage === "smash"
                            ? "Perk: +30% bonus streams & sales on all releases within 26 weeks."
                            : "Baseline: Standard industry performance multiplier (1.0x)."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smash Era Requirements Checklist */}
              <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider">
                      Smash Era Milestones
                    </h4>
                    <span className="text-[10px] bg-red-900 border border-red-700 text-red-100 px-1.5 py-0.5 rounded font-bold">
                      PRO
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      !isPro
                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        : qualifiesForSmash
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {!isPro
                      ? "PRO Tier Required"
                      : qualifiesForSmash
                        ? "Qualifies for Smash Era 🎉"
                        : "In Progress"}
                  </span>
                </div>
                {!isPro ? (
                  <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                    ⚡ Smash Era is exclusive to Red Mic PRO members. Non-PRO artists can only fluctuate between Neutral and Flop eras.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Hit ANY of the following milestones to unlock and sustain a Smash Era:
                  </p>
                )}

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span>{hasNo1Hit || hasNo1Album ? "✅" : "⚪"}</span>
                      <span>Billboard #1 Single or Album</span>
                    </div>
                    <span className={hasNo1Hit || hasNo1Album ? "text-green-400 font-bold" : "text-zinc-500"}>
                      {hasNo1Hit || hasNo1Album ? "Achieved" : "Needs #1 Peak"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span>{hasTop10Hit ? "✅" : "⚪"}</span>
                      <span>Billboard Hot 100 Top 10 Entry</span>
                    </div>
                    <span className={hasTop10Hit ? "text-green-400 font-bold" : "text-zinc-500"}>
                      {hasTop10Hit ? "Achieved" : "Needs Top 10"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span>{hasMassiveStreams ? "✅" : "⚪"}</span>
                      <span>Massive Streams (10M+ 1st Wk / 12M+ Wkly)</span>
                    </div>
                    <span className={hasMassiveStreams ? "text-green-400 font-bold" : "text-zinc-500"}>
                      {hasMassiveStreams ? "Achieved" : "Needs 10M+ Stream Release"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span>{has20MListeners ? "✅" : "⚪"}</span>
                      <span>20M+ Monthly Listeners</span>
                    </div>
                    <span className={has20MListeners ? "text-green-400 font-bold" : "text-zinc-500"}>
                      {formatNumber(activeArtistData.monthlyListeners || 0)} / 20M
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <span>{hasCriticalAcclaim ? "✅" : "⚪"}</span>
                      <span>Critical Acclaim (8.0+ Review Score)</span>
                    </div>
                    <span className={hasCriticalAcclaim ? "text-green-400 font-bold" : "text-zinc-500"}>
                      {hasCriticalAcclaim ? "Achieved" : "Needs 8.0+ Review"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Era Switch Controls */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">
                  Switch Active Era
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (!isPro) return;
                      dispatch({
                        type: "SET_CAREER_STAGE",
                        payload: { stage: "smash", artistId: activeArtistId },
                      });
                    }}
                    disabled={!isPro}
                    className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                      activeArtistData.careerStage === "smash"
                        ? "bg-green-600 text-white ring-2 ring-green-400"
                        : isPro
                          ? "bg-green-600/20 text-green-300 border border-green-500/40 hover:bg-green-600 hover:text-white"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-xl">🚀</span>
                    <span>Smash Era</span>
                    {!isPro && (
                      <span className="text-[10px] text-red-400 font-semibold">PRO Only</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      dispatch({
                        type: "SET_CAREER_STAGE",
                        payload: { stage: "neutral", artistId: activeArtistId },
                      });
                    }}
                    className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                      (!activeArtistData.careerStage || activeArtistData.careerStage === "neutral")
                        ? "bg-zinc-600 text-white ring-2 ring-zinc-400"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
                    }`}
                  >
                    <span className="text-xl">⚖️</span>
                    <span>Neutral Era</span>
                  </button>

                  <button
                    onClick={() => {
                      dispatch({
                        type: "SET_CAREER_STAGE",
                        payload: { stage: "flop", artistId: activeArtistId },
                      });
                    }}
                    className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                      activeArtistData.careerStage === "flop"
                        ? "bg-red-600 text-white ring-2 ring-red-400"
                        : "bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">📉</span>
                    <span>Flop Era</span>
                  </button>
                </div>
              </div>

              {/* Pro Era Controls (Flop Era Lock & Stuck on Era) */}
              {isPro && (
                <div className="space-y-3">
                  {/* Flop Era Lock Toggle (Pro Only) */}
                  <div className="flex items-center justify-between bg-zinc-800 p-3.5 rounded-xl border border-zinc-700">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-zinc-200">Flop Era Lock</p>
                        <span className="text-[10px] bg-red-900 border border-red-700 text-red-100 px-1.5 py-0.5 rounded font-bold">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Protect your artist from naturally falling into a flop era.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "TOGGLE_FLOP_ERA_LOCK",
                          payload: { artistId: activeArtistId },
                        })
                      }
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors relative ${
                        activeArtistData.flopEraLock ? "bg-red-500" : "bg-zinc-600"
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                          activeArtistData.flopEraLock ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Stuck on Era / Era Lock Toggle (Pro Only) */}
                  <div className="flex items-center justify-between bg-zinc-800 p-3.5 rounded-xl border border-zinc-700">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-zinc-200">Stuck on Era (Era Freeze)</p>
                        <span className="text-[10px] bg-red-900 border border-red-700 text-red-100 px-1.5 py-0.5 rounded font-bold">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Freeze your current era so it never changes automatically during weekly progression.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "TOGGLE_ERA_LOCK",
                          payload: { artistId: activeArtistId },
                        })
                      }
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors relative ${
                        activeArtistData.eraLock || activeArtistData.stuckOnEra
                          ? "bg-amber-500"
                          : "bg-zinc-600"
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                          activeArtistData.eraLock || activeArtistData.stuckOnEra
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setIsEraModalOpen(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={() => setIsPopularityExpanded(!isPopularityExpanded)}
            className="w-full text-left"
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Popularity</h2>
                <ChevronDownIcon
                  className={`w-5 h-5 text-zinc-400 transition-transform ${isPopularityExpanded ? "rotate-180" : ""}`}
                />
              </div>
              <span className="font-bold text-lg">
                {Math.round(popularity)}/100
              </span>
            </div>
          </button>
          <div className="w-full bg-zinc-700 rounded-full h-4 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${getPopularityColor(popularity)} h-4 rounded-full transition-all duration-500 ease-out`}
              style={{ width: widthPercentagePopularity }}
            ></div>
          </div>
          <div
            className="grid transition-all duration-300 ease-in-out overflow-hidden"
            style={{ gridTemplateRows: isPopularityExpanded ? "1fr" : "0fr" }}
          >
            <div className="min-h-0">
              <div className="bg-zinc-800/50 p-3 mt-2 rounded-lg space-y-2">
                {regionalScores.map((item) => (
                  <RegionalPopularityBar
                    key={item.region}
                    region={item.region}
                    score={item.score}
                    color={
                      getPopularityColor(item.score)
                        .replace("from-", "bg-")
                        .split(" ")[0]
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1 text-right">
            Increases streams, views, sales, and likes.
          </p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <svg
                className={`w-5 h-5 ${getPublicImageInfo(publicImageVal).textColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-bold">Public Image</h2>
            </div>
            <span
              className={`font-bold text-lg ${getPublicImageInfo(publicImageVal).textColor}`}
            >
              {getPublicImageInfo(publicImageVal).label}
            </span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-4 overflow-hidden">
            <div
              className={`${getPublicImageInfo(publicImageVal).color} h-4 rounded-full transition-all duration-500 ease-out`}
              style={{ width: widthPercentagePublicImage }}
            ></div>
          </div>
          <p className="text-xs text-zinc-400 mt-1 text-right">
            Impacts fan & media reaction to your actions.
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold">Hype</h2>
            </div>
            <span className="font-bold text-lg">{Math.round(hype)}/100</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: widthPercentageHype }}
            ></div>
          </div>
          <p className="text-xs text-zinc-400 mt-1 text-right">
            Higher hype leads to more streams for all your songs.
          </p>
        </div>
      </div>
      {contract && labelSubmissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Submitted to Label</h2>
          <div className="space-y-3">
            {labelSubmissions.map((sub) => (
              <SubmissionItem key={sub.id} submission={sub} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Unreleased Songs</h2>
          {hasUnreleased && (
            <button
              onClick={() =>
                dispatch({ type: "CHANGE_VIEW", payload: "releaseHub" })
              }
              className="flex items-center gap-1 text-red-500 hover:text-red-400 font-semibold"
            >
              View All <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {hasUnreleased ? (
          <div className="space-y-3">
            {unreleasedSongs.slice(0, 3).map((song) => (
              <UnreleasedSongItem
                key={song.id}
                song={song}
                showQualityNumber={redMicPro.unlocked}
                onToggleVault={(id) =>
                  dispatch({
                    type: "TOGGLE_VAULT_SONG",
                    payload: { songId: id },
                  })
                }
                onDelete={(id) => setDeleteSongId(id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-800 rounded-lg">
            <p className="text-zinc-400">No unreleased songs.</p>
            <p className="text-zinc-500 text-sm">
              Go to the "Studio" app to record something new!
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteSongId}
        title="Delete Song"
        message="Are you sure you want to delete this unreleased song? This action cannot be undone."
        onConfirm={() => {
          if (deleteSongId) {
            dispatch({
              type: "DELETE_SONG",
              payload: { songId: deleteSongId },
            });
            setDeleteSongId(null);
          }
        }}
        onClose={() => setDeleteSongId(null)}
        confirmText="Delete"
      />
    </div>
  );
};

export default HomeTab;
