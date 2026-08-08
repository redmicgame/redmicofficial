import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { LABELS } from '../constants';
import { GoogleGenAI } from '@google/genai';
import { Release, GameDate, Song, Video } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) throw new Error("API key not configured");
  return new GoogleGenAI({ apiKey: key });
};

const formatGameDate = (gameDate: GameDate) => {
  const date = new Date(gameDate.year, 0, (gameDate.week - 1) * 7 + 1);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const EditIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ChevronIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const WikipediaView: React.FC = () => {
  const { gameState, dispatch, activeArtistData, allPlayerArtists } = useGame();
  const { selectedReleaseId } = gameState;

  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    background: true,
    composition: true,
    release: true,
    reception: true,
    commercial: true,
    tracklist: true,
    personnel: false,
    charts: false,
    certifications: false,
    releaseHistory: false,
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState<string>('lead');
  
  // Custom Edit Form Values
  const [editTitle, setEditTitle] = useState('');
  const [editLeadSummary, setEditLeadSummary] = useState('');
  const [editSections, setEditSections] = useState<Record<string, string>>({});
  const [editOriginalCover, setEditOriginalCover] = useState('');
  const [editAltCover, setEditAltCover] = useState('');
  const [editAltCoverCaption, setEditAltCoverCaption] = useState('');
  const [editStudios, setEditStudios] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editProducers, setEditProducers] = useState('');
  const [editRecordedYears, setEditRecordedYears] = useState('');

  const { releases = [], songs = [], videos = [] } = activeArtistData || {};
  const release = useMemo(() => releases.find(r => r.id === selectedReleaseId), [releases, selectedReleaseId]);
  const artist = useMemo(() => release ? allPlayerArtists.find(a => a.id === release.artistId) || { name: activeArtistData?.name || "Artist" } : null, [release, allPlayerArtists, activeArtistData]);

  // Tracklist songs
  const releaseSongs = useMemo(() => {
    if (!release) return [];
    return release.songIds.map(id => songs.find(s => s.id === id)).filter((s): s is Song => !!s);
  }, [release, songs]);

  // Calculate total album length in seconds
  const totalLengthSeconds = useMemo(() => {
    return releaseSongs.reduce((sum, s) => sum + (s.duration || 210), 0);
  }, [releaseSongs]);

  const formattedLength = useMemo(() => {
    const mins = Math.floor(totalLengthSeconds / 60);
    const secs = totalLengthSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [totalLengthSeconds]);

  // Studio Album ordinal calculation (EXCLUDING deluxes, EPs, soundtracks, mixtapes, compilations)
  const studioAlbums = useMemo(() => {
    if (!release) return [];
    return releases
      .filter(r => r.artistId === release.artistId && (r.type === 'Album' || r.type === 'Studio Album'))
      .sort((a, b) => (a.releaseDate.year * 52 + a.releaseDate.week) - (b.releaseDate.year * 52 + b.releaseDate.week));
  }, [releases, release]);

  const studioAlbumIndex = useMemo(() => {
    if (!release) return -1;
    return studioAlbums.findIndex(r => r.id === release.id);
  }, [studioAlbums, release]);

  const studioAlbumOrdinal = useMemo(() => {
    if (studioAlbumIndex === 0) return 'debut studio album';
    if (studioAlbumIndex > 0) {
      const words = ['second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
      return `${words[studioAlbumIndex - 1] || `${studioAlbumIndex + 1}th`} studio album`;
    }
    return `${release?.type.toLowerCase() || 'album'}`;
  }, [studioAlbumIndex, release]);

  // Earlier non-studio projects (EPs, mixtapes) released before this album
  const earlierProjects = useMemo(() => {
    if (!release) return [];
    const currentAbsWeek = release.releaseDate.year * 52 + release.releaseDate.week;
    return releases
      .filter(r => r.artistId === release.artistId && r.id !== release.id && (r.releaseDate.year * 52 + r.releaseDate.week) < currentAbsWeek && (r.type === 'EP' || r.type === 'Mixtape' || r.type === 'Compilation' || r.type === 'Soundtrack'))
      .sort((a, b) => (a.releaseDate.year * 52 + a.releaseDate.week) - (b.releaseDate.year * 52 + b.releaseDate.week));
  }, [releases, release]);

  // Chronology (Previous and Next release in overall discography)
  const allDiscography = useMemo(() => {
    if (!release) return [];
    return releases
      .filter(r => r.artistId === release.artistId && r.type !== 'Single')
      .sort((a, b) => (a.releaseDate.year * 52 + a.releaseDate.week) - (b.releaseDate.year * 52 + b.releaseDate.week));
  }, [releases, release]);

  const discographyIndex = useMemo(() => {
    if (!release) return -1;
    return allDiscography.findIndex(r => r.id === release.id);
  }, [allDiscography, release]);

  const previousProject = useMemo(() => discographyIndex > 0 ? allDiscography[discographyIndex - 1] : null, [allDiscography, discographyIndex]);
  const nextProject = useMemo(() => discographyIndex >= 0 && discographyIndex < allDiscography.length - 1 ? allDiscography[discographyIndex + 1] : null, [allDiscography, discographyIndex]);

  // All singles released for or before the album
  const singlesList = useMemo(() => {
    if (!release) return [];
    const albumAbsWeek = release.releaseDate.year * 52 + release.releaseDate.week;
    
    // Gather songs that are on the album and were released as singles
    const singleSongsMap = new Map<string, { song: Song; releaseDate: GameDate; type: string }>();

    releaseSongs.forEach(song => {
      // Find single release
      const singleRelease = releases.find(r => r.type === 'Single' && r.songIds.includes(song.id));
      if (singleRelease) {
        singleSongsMap.set(song.id, { song, releaseDate: singleRelease.releaseDate, type: 'Official Single' });
      } else if (song.isPreReleaseSingle) {
        singleSongsMap.set(song.id, { song, releaseDate: release.releaseDate, type: 'Pre-Release Single' });
      }
    });

    return Array.from(singleSongsMap.values())
      .sort((a, b) => (a.releaseDate.year * 52 + a.releaseDate.week) - (b.releaseDate.year * 52 + b.releaseDate.week));
  }, [release, releaseSongs, releases]);

  // Producers list
  const derivedProducers = useMemo(() => {
    const set = new Set<string>();
    releaseSongs.forEach(s => {
      if (s.producers && Array.isArray(s.producers) && s.producers.length > 0) {
        s.producers.forEach(p => {
          if (p && p.trim()) set.add(p.trim());
        });
      } else if ((s as any).producer && (s as any).producer.trim()) {
        set.add((s as any).producer.trim());
      }
    });
    if (set.size === 0) {
      set.add(artist?.name || "Artist");
    }
    return Array.from(set).join(' · ');
  }, [releaseSongs, artist]);

  // Recorded Studios
  const derivedStudios = useMemo(() => {
    const set = new Set<string>();
    releaseSongs.forEach(s => {
      if ((s as any).recordingStudio && (s as any).recordingStudio.trim()) set.add((s as any).recordingStudio.trim());
    });
    if (set.size === 0) {
      set.add(`${artist?.name || "Artist"}'s home studio (Los Angeles)`);
      set.add("Westlake (Los Angeles)");
      set.add("Eardrumma (Atlanta)");
    }
    return Array.from(set);
  }, [releaseSongs, artist]);

  // Recorded Years range
  const derivedRecordedYears = useMemo(() => {
    if (!release) return `${new Date().getFullYear()}`;
    const endYear = release.releaseDate.year;
    const startYear = Math.max(endYear - 2, 2010);
    return startYear === endYear ? `${endYear}` : `${startYear}–${endYear}`;
  }, [release]);

  // Releasing Label string
  const derivedLabel = useMemo(() => {
    if (!release) return 'Independent';
    let label = release.releasingLabel ? release.releasingLabel.name : 'Independent';
    if (release.rightsOwnerLabelId && release.rightsSoldPercent && release.rightsSoldPercent > 50) {
      const ownerLabel = LABELS.find(l => l.id === release.rightsOwnerLabelId);
      if (ownerLabel) label = ownerLabel.name;
    }
    return label;
  }, [release]);

  // Original and alternative cover art logic
  const originalCover = release?.originalCoverArt || release?.coverArt || '';
  const hasAlternativeCover = (release?.originalCoverArt && release?.originalCoverArt !== release?.coverArt) || (release?.coverArtHistory && release.coverArtHistory.length > 0);
  const alternativeCover = release?.coverArtHistory?.[0]?.url || release?.coverArt || '';
  const alternativeCoverYear = release?.coverArtHistory?.[0]?.year || gameState.date.year;
  const alternativeCoverCaption = release?.coverArtHistory?.[0]?.caption || `Alternative cover (${alternativeCoverYear})`;

  // Initialize edit form whenever modal opens or release changes
  useEffect(() => {
    if (release) {
      const altYear = release.coverArtHistory?.[0]?.year || gameState.date.year;
      setEditTitle(release.wikipediaCustomData?.title || release.title);
      setEditLeadSummary(release.wikipediaSummary || '');
      setEditSections(release.wikipediaSections || {});
      setEditOriginalCover(release.originalCoverArt || release.coverArt);
      setEditAltCover(release.coverArtHistory?.[0]?.url || (release.originalCoverArt && release.originalCoverArt !== release.coverArt ? release.coverArt : ''));
      setEditAltCoverCaption(release.coverArtHistory?.[0]?.caption || `Alternative cover (${altYear})`);
      setEditStudios(release.wikipediaCustomData?.recordedStudios || derivedStudios.join('\n'));
      setEditLabel(release.wikipediaCustomData?.label || derivedLabel);
      setEditProducers(release.wikipediaCustomData?.producers || derivedProducers);
      setEditRecordedYears(release.wikipediaCustomData?.recordedYears || derivedRecordedYears);
    }
  }, [release, isEditModalOpen, derivedStudios, derivedLabel, derivedProducers, derivedRecordedYears, gameState.date.year]);

  // Auto-generator for AI/Offline Wikipedia Summary & Sections
  useEffect(() => {
    const generateArticle = async () => {
      if (!release || (release.wikipediaSummary && release.wikipediaSections)) return;

      setIsLoading(true);
      try {
        const artistName = artist?.name || 'Artist';

        // Lead section build
        let leadText = `***${release.title}*** is the ${studioAlbumOrdinal} by American singer ${artistName}. It was released on ${formatGameDate(release.releaseDate)}, through ${derivedLabel}. `;

        if (studioAlbumIndex === 0) {
          const groupName = activeArtistData?.formerGroup?.name || activeArtistData?.groupInfo?.name || gameState.group?.name;
          if (groupName) {
            leadText += `In ${release.releaseDate.year - 2}, following the disbandment of the group ${groupName}, ${artistName} announced that they would begin pursuing a solo career. `;
          }
          if (earlierProjects.length > 0) {
            const firstP = earlierProjects[0];
            leadText += `The following year, she released her debut ${firstP.type.toLowerCase()}, titled *${firstP.title}* (${firstP.releaseDate.year}). After raising her profile with the release, ${artistName} met with ${derivedLabel}, where she subsequently signed a recording contract. `;
            if (earlierProjects.length > 1) {
              const otherPs = earlierProjects.slice(1).map(p => `*${p.title}* (${p.releaseDate.year})`).join(' and ');
              leadText += `During the recording process of the album, she released additional project work including ${otherPs}. `;
            }
          }
        }

        leadText += `\n\n*${release.title}* incorporates several genres including R&B, alternative R&B, and pop. The album's production was characterized as atmospheric and synthetic with minimalist beats, drawing praise for its innovative composition. Most songs were co-written by ${artistName}, who also served as executive producer alongside ${derivedProducers.split(' · ')[0] || 'collaborators'}.\n\n`;

        // Stats & Commercial performance
        const totalStreams = releaseSongs.reduce((sum, s) => sum + s.streams, 0);
        const albumChart = gameState.albumChartHistory[release.id];
        let commsText = `Upon release, *${release.title}* received widespread acclaim from music critics who commended its production and cohesive themes. `;
        if (albumChart) {
          commsText += `The album debuted at number ${albumChart.peak} on the US Billboard 200, achieving over ${(totalStreams / 1e6).toFixed(1)} million streams in its first month. `;
        }
        if (singlesList.length > 0) {
          commsText += `The album was promoted with the release of singles including ${singlesList.map(s => `"${s.song.title}"`).join(', ')}.`;
        }

        leadText += commsText;

        // Structured Sections
        const autoSections: Record<string, string> = {
          background: `${artistName} began developing the material for *${release.title}* in ${derivedRecordedYears}. Following initial studio sessions, ${artistName} collaborated with producers across various studios including ${derivedStudios.join(', ')}. The recording process focused on creating a personal, cinematic audio canvas that showcased vocal versatility and atmospheric sound design.`,
          composition: `The album blends elements of alternative R&B, contemporary pop, and electronic synth textures. Lyrically, *${release.title}* explores themes of self-discovery, passion, night-time introspection, and personal evolution. Critics highlighted the album's minimalist basslines, multi-layered harmonies, and smooth transitions between tracks.`,
          release: `Promoting the album, ${artistName} embarked on an extensive promotional campaign. Lead single "${singlesList[0]?.song.title || releaseSongs[0]?.title || 'Lead Single'}" impacted rhythmic and urban contemporary radio stations, gaining immediate traction on streaming platforms. ${artistName} performed tracks from the album on major late-night television shows including *The Tonight Show Starring Jimmy Fallon* and live festival stages. A dedicated Genius 'Verified' interview breaking down lyrics further heightened fan engagement ahead of release.`,
          reception: `*${release.title}* received generally positive reviews from music publications and critics. Reviewers praised the polished production quality, praising ${artistName}'s confident artistic identity. Rolling Stone and Pitchfork noted the project as one of the standout R&B projects of the era.`,
          commercial: `Commercial performance for *${release.title}* was strong across global digital and streaming platforms. The album accumulated over ${(totalStreams / 1e6).toFixed(1)} million streams worldwide. Single releases charted prominently on the Billboard Hot 100, earning sales certifications from the RIAA.`,
        };

        let finalLead = leadText;
        let finalSections = autoSections;

        // Optionally refine with Gemini if online and unlocked
        if (!gameState.offlineMode && activeArtistData?.redMicPro?.unlocked) {
          try {
            const prompt = `Write a clean Wikipedia lead section for the album "${release.title}" by "${artistName}".
Information:
- ${studioAlbumOrdinal} released on ${formatGameDate(release.releaseDate)} via ${derivedLabel}.
- Earlier projects: ${earlierProjects.map(p => p.title).join(', ') || 'None'}.
- Producers: ${derivedProducers}.
- Singles: ${singlesList.map(s => s.song.title).join(', ')}.
- Total Streams: ${totalStreams.toLocaleString()}.

Write 3 encyclopedic paragraphs with standard Wikipedia tone.`;
            const aiClient = getAI();
            const res = await aiClient.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (res.text) finalLead = res.text;
          } catch (e) {
            console.log("AI Wikipedia generation fallback used", e);
          }
        }

        dispatch({
          type: 'UPDATE_RELEASE_WIKIPEDIA',
          payload: {
            releaseId: release.id,
            summary: finalLead,
            wikipediaSections: finalSections,
            originalCoverArt: originalCover,
          }
        });

      } catch (err) {
        console.error("Failed Wikipedia generation:", err);
      } finally {
        setIsLoading(false);
      }
    };

    generateArticle();
  }, [release, dispatch, artist, studioAlbumOrdinal, derivedLabel, derivedProducers, derivedRecordedYears, derivedStudios, earlierProjects, singlesList, releaseSongs, gameState, activeArtistData]);

  if (!release || !artist) {
    return (
      <div className="bg-white text-black h-full overflow-y-auto p-8 flex flex-col items-center justify-center">
        <p className="text-zinc-500 font-sans">No album selected or article unavailable.</p>
        <button
          onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'catalog' })}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const displayTitle = release.wikipediaCustomData?.title || release.title;
  const displayStudios = release.wikipediaCustomData?.recordedStudios ? release.wikipediaCustomData.recordedStudios.split('\n') : derivedStudios;
  const displayLabel = release.wikipediaCustomData?.label || derivedLabel;
  
  const rawCustomProducers = release.wikipediaCustomData?.producers;
  const cleanedCustomProducers = useMemo(() => {
    if (!rawCustomProducers) return null;
    if (rawCustomProducers.includes("Mike Nazzaro") || rawCustomProducers.includes("DJ Dahi") || rawCustomProducers.includes("Boi-1da")) {
      const parts = rawCustomProducers.split(/·|,/).map(p => p.trim()).filter(p => p && p !== "Mike Nazzaro" && p !== "DJ Dahi" && p !== "Boi-1da");
      if (parts.length === 0) return derivedProducers;
      return parts.join(' · ');
    }
    return rawCustomProducers;
  }, [rawCustomProducers, derivedProducers]);

  const displayProducers = cleanedCustomProducers || derivedProducers;
  const displayRecordedYears = release.wikipediaCustomData?.recordedYears || derivedRecordedYears;

  const summaryParagraphs = (release.wikipediaSummary || '').split('\n').filter(p => p.trim());
  const sectionsData = release.wikipediaSections || {};

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openEditModalForSection = (sectionKey: string) => {
    setActiveEditSection(sectionKey);
    setIsEditModalOpen(true);
  };

  const handleSaveWikipediaEdits = () => {
    const altYear = release.coverArtHistory?.[0]?.year || gameState.date.year;
    dispatch({
      type: 'UPDATE_RELEASE_WIKIPEDIA',
      payload: {
        releaseId: release.id,
        title: editTitle,
        summary: editLeadSummary,
        wikipediaSections: editSections,
        originalCoverArt: editOriginalCover,
        coverArt: editAltCover || editOriginalCover,
        coverArtHistory: editAltCover ? [{ url: editAltCover, year: altYear, caption: editAltCoverCaption }] : [],
        wikipediaCustomData: {
          title: editTitle,
          recordedStudios: editStudios,
          recordedYears: editRecordedYears,
          label: editLabel,
          producers: editProducers,
        }
      }
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="bg-white text-zinc-900 h-full w-full overflow-y-auto pb-28 font-sans selection:bg-blue-100">
      {/* Top Header Bar */}
      <header className="border-b border-zinc-200 bg-[#f8f9fa] px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'catalog' })}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline bg-white border border-zinc-300 px-2.5 py-1 rounded shadow-sm"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Catalog
          </button>
          <div className="h-4 w-px bg-zinc-300" />
          <div className="flex items-center gap-1.5 text-black">
            <span className="font-serif font-bold text-lg tracking-tight">WIKIPEDIA</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">The Free Encyclopedia</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModalForSection('lead')}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded shadow-sm transition-colors"
            title="Edit Wikipedia Article"
          >
            <EditIcon className="w-3.5 h-3.5 text-zinc-600" />
            <span>Edit</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Article Title & Tabs */}
        <div className="border-b border-zinc-300 pb-2 mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif text-black tracking-tight">
              {displayTitle} <span className="text-2xl font-serif text-zinc-600 font-normal">({artist.name} album)</span>
            </h1>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
              <span className="font-semibold text-black border-b-2 border-blue-600 pb-1">Article</span>
              <span className="hover:text-blue-700 cursor-pointer pb-1">Talk</span>
            </div>
          </div>
        </div>

        {/* Content Layout: Lead & Infobox */}
        <div className="flex flex-col md:flex-row-reverse gap-6 items-start">
          
          {/* INFOBOX SIDEBAR */}
          <aside className="w-full md:w-[22em] flex-shrink-0 border border-[#a2a9b1] bg-[#f8f9fa] p-2 text-xs text-zinc-900 rounded-sm shadow-sm self-start">
            <div className="bg-[#b0c4de]/40 text-center font-serif font-bold text-sm py-1.5 border-b border-[#a2a9b1]">
              {displayTitle}
            </div>

            {/* Original Cover Image */}
            <div className="p-2 text-center bg-white border-b border-[#a2a9b1]">
              <img
                src={originalCover}
                alt={displayTitle}
                className="w-full aspect-square object-cover border border-zinc-300 mx-auto shadow-sm"
              />
              <p className="text-[11px] text-zinc-600 mt-1 font-sans">
                Original album cover<sup className="text-blue-700 font-bold ml-0.5">[a]</sup>
              </p>
            </div>

            {/* Album Metadata Table */}
            <div className="bg-[#b0c4de]/30 text-center font-bold py-1 border-b border-[#a2a9b1] text-zinc-800">
              Studio album by <span className="text-blue-700 hover:underline cursor-pointer">{artist.name}</span>
            </div>

            <table className="w-full my-1 border-collapse text-xs">
              <tbody>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-1.5 px-2 font-bold w-1/3 align-top text-zinc-800">Released</th>
                  <td className="py-1.5 px-2 align-top text-zinc-900">{formatGameDate(release.releaseDate)}</td>
                </tr>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-1.5 px-2 font-bold align-top text-zinc-800">Recorded</th>
                  <td className="py-1.5 px-2 align-top text-zinc-900">{displayRecordedYears}</td>
                </tr>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-1.5 px-2 font-bold align-top text-zinc-800">Studios</th>
                  <td className="py-1.5 px-2 align-top text-zinc-900 space-y-0.5">
                    {displayStudios.map((st, i) => (
                      <div key={i}>{st}</div>
                    ))}
                  </td>
                </tr>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-1.5 px-2 font-bold align-top text-zinc-800">Length</th>
                  <td className="py-1.5 px-2 align-top text-zinc-900">{formattedLength}</td>
                </tr>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-1.5 px-2 font-bold align-top text-zinc-800">Label</th>
                  <td className="py-1.5 px-2 align-top text-blue-700 hover:underline cursor-pointer">{displayLabel}</td>
                </tr>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-1.5 px-2 font-bold align-top text-zinc-800">Producers</th>
                  <td className="py-1.5 px-2 align-top text-zinc-900 leading-relaxed">{displayProducers}</td>
                </tr>
              </tbody>
            </table>

            {/* Chronology Box */}
            <div className="bg-[#b0c4de]/40 text-center font-bold py-1 mt-2 border-t border-b border-[#a2a9b1] text-zinc-800">
              <span className="text-blue-700 hover:underline cursor-pointer">{artist.name}</span> chronology
            </div>

            <table className="w-full text-center my-1 text-[11px] border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/3 p-1.5 align-top border-r border-zinc-200 text-zinc-700">
                    {previousProject ? (
                      <>
                        <em className="text-blue-700 hover:underline cursor-pointer">{previousProject.title}</em>
                        <br />({previousProject.releaseDate.year})
                      </>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="w-1/3 p-1.5 align-top border-r border-zinc-200 font-bold bg-white text-black shadow-inner">
                    <em>{displayTitle}</em>
                    <br />({release.releaseDate.year})
                  </td>
                  <td className="w-1/3 p-1.5 align-top text-zinc-700">
                    {nextProject ? (
                      <>
                        <em className="text-blue-700 hover:underline cursor-pointer">{nextProject.title}</em>
                        <br />({nextProject.releaseDate.year})
                      </>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Alternative Cover (if cover changed or exists) */}
            {hasAlternativeCover && (
              <div className="mt-3 border-t border-[#a2a9b1] pt-2">
                <div className="bg-[#b0c4de]/30 text-center font-bold py-1 border-b border-[#a2a9b1] text-zinc-800">
                  Alternative cover
                </div>
                <div className="p-2 text-center bg-white border-b border-[#a2a9b1]">
                  <img
                    src={alternativeCover}
                    alt="Alternative Cover"
                    className="w-full aspect-square object-cover border border-zinc-300 mx-auto shadow-sm"
                  />
                  <p className="text-[11px] text-zinc-600 mt-1 font-sans italic">{alternativeCoverCaption}</p>
                </div>
              </div>
            )}

            {/* Singles from Album Box */}
            {singlesList.length > 0 && (
              <div className="mt-3 border-t border-[#a2a9b1] pt-2">
                <div className="bg-[#b0c4de]/30 text-center font-bold py-1 border-b border-[#a2a9b1] text-zinc-800">
                  Singles from <em>{displayTitle}</em>
                </div>
                <ol className="p-2 space-y-2 text-[11px] bg-white">
                  {singlesList.map((item, idx) => (
                    <li key={item.song.id} className="border-b border-zinc-100 last:border-0 pb-1.5">
                      <span className="font-bold text-zinc-700">{idx + 1}. </span>
                      <span className="text-blue-700 font-medium hover:underline cursor-pointer">"{item.song.title}"</span>
                      <br />
                      <span className="text-zinc-500 text-[10px] pl-3 block">
                        Released: {formatGameDate(item.releaseDate)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>

          {/* MAIN ARTICLE LEAD TEXT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Lead Section</span>
              <button
                onClick={() => openEditModalForSection('lead')}
                className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-medium"
              >
                <EditIcon className="w-3.5 h-3.5" /> Edit section
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-3 my-4">
                <div className="h-4 bg-zinc-200 rounded w-full"></div>
                <div className="h-4 bg-zinc-200 rounded w-11/12"></div>
                <div className="h-4 bg-zinc-200 rounded w-4/5"></div>
              </div>
            ) : (
              <div className="leading-relaxed space-y-4 text-zinc-900 text-sm font-sans">
                {summaryParagraphs.map((paragraph, i) => (
                  <p key={i} className="text-justify">{paragraph}</p>
                ))}
              </div>
            )}

            {/* SECTIONS LIST */}
            <div className="mt-8 space-y-6">
              
              {/* Background & Recording */}
              <div className="border-t border-zinc-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('background')}
                    className="flex items-center gap-2 font-serif text-xl font-bold text-black hover:text-blue-700"
                  >
                    <ChevronIcon className={`w-4 h-4 transition-transform ${openSections.background ? 'rotate-90' : ''}`} />
                    <span>Background and recording</span>
                  </button>
                  <button
                    onClick={() => openEditModalForSection('background')}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                {openSections.background && (
                  <p className="text-sm text-zinc-800 leading-relaxed font-sans pl-6 border-l-2 border-zinc-200">
                    {sectionsData.background || `Recording for ${displayTitle} took place across ${displayStudios.join(', ')}. ${artist.name} worked closely with producers including ${displayProducers} to craft the sonic texture of the project.`}
                  </p>
                )}
              </div>

              {/* Composition */}
              <div className="border-t border-zinc-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('composition')}
                    className="flex items-center gap-2 font-serif text-xl font-bold text-black hover:text-blue-700"
                  >
                    <ChevronIcon className={`w-4 h-4 transition-transform ${openSections.composition ? 'rotate-90' : ''}`} />
                    <span>Composition</span>
                  </button>
                  <button
                    onClick={() => openEditModalForSection('composition')}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                {openSections.composition && (
                  <p className="text-sm text-zinc-800 leading-relaxed font-sans pl-6 border-l-2 border-zinc-200">
                    {sectionsData.composition || `The compositions on ${displayTitle} showcase dynamic genre blends, combining atmospheric synth hooks, crisp percussion, and intimate vocal layering.`}
                  </p>
                )}
              </div>

              {/* Release and promotion */}
              <div className="border-t border-zinc-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('release')}
                    className="flex items-center gap-2 font-serif text-xl font-bold text-black hover:text-blue-700"
                  >
                    <ChevronIcon className={`w-4 h-4 transition-transform ${openSections.release ? 'rotate-90' : ''}`} />
                    <span>Release and promotion</span>
                  </button>
                  <button
                    onClick={() => openEditModalForSection('release')}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                {openSections.release && (
                  <div className="text-sm text-zinc-800 leading-relaxed font-sans pl-6 border-l-2 border-zinc-200 space-y-3">
                    <p>
                      {sectionsData.release || `Promoting the album, ${artist.name} launched a multifaceted roll-out strategy. Performances on late-night shows such as Jimmy Fallon, high-profile festival sets, and digital promotional interviews boosted excitement nationwide.`}
                    </p>

                    {singlesList.length > 0 && (
                      <div>
                        <h4 className="font-serif font-bold text-base text-black mt-3 mb-1 flex items-center gap-1">
                          Singles
                        </h4>
                        <div className="space-y-2 text-xs">
                          {singlesList.map((s, idx) => (
                            <p key={s.song.id}>
                              <strong className="text-blue-700 hover:underline cursor-pointer">"{s.song.title}"</strong> was released on {formatGameDate(s.releaseDate)} as the {idx === 0 ? 'lead' : `${idx + 1}nd`} single from *{displayTitle}*. It impacted radio formats and garnered strong streaming support.
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Critical reception */}
              <div className="border-t border-zinc-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('reception')}
                    className="flex items-center gap-2 font-serif text-xl font-bold text-black hover:text-blue-700"
                  >
                    <ChevronIcon className={`w-4 h-4 transition-transform ${openSections.reception ? 'rotate-90' : ''}`} />
                    <span>Critical reception</span>
                  </button>
                  <button
                    onClick={() => openEditModalForSection('reception')}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                {openSections.reception && (
                  <p className="text-sm text-zinc-800 leading-relaxed font-sans pl-6 border-l-2 border-zinc-200">
                    {sectionsData.reception || `Music critics praised ${displayTitle} for its cohesive artistic direction and production polish, earning positive acclaim across major music publications.`}
                  </p>
                )}
              </div>

              {/* Commercial performance */}
              <div className="border-t border-zinc-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('commercial')}
                    className="flex items-center gap-2 font-serif text-xl font-bold text-black hover:text-blue-700"
                  >
                    <ChevronIcon className={`w-4 h-4 transition-transform ${openSections.commercial ? 'rotate-90' : ''}`} />
                    <span>Commercial performance</span>
                  </button>
                  <button
                    onClick={() => openEditModalForSection('commercial')}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                {openSections.commercial && (
                  <p className="text-sm text-zinc-800 leading-relaxed font-sans pl-6 border-l-2 border-zinc-200">
                    {sectionsData.commercial || `The album performed strongly on international streaming charts, entering the Billboard 200 and generating millions of streams worldwide.`}
                  </p>
                )}
              </div>

              {/* Track listing */}
              <div className="border-t border-zinc-300 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('tracklist')}
                    className="flex items-center gap-2 font-serif text-xl font-bold text-black hover:text-blue-700"
                  >
                    <ChevronIcon className={`w-4 h-4 transition-transform ${openSections.tracklist ? 'rotate-90' : ''}`} />
                    <span>Track listing</span>
                  </button>
                </div>
                {openSections.tracklist && (
                  <div className="overflow-x-auto pl-6 border-l-2 border-zinc-200">
                    <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                      <thead className="bg-[#f8f9fa] border-b border-zinc-300 text-zinc-700">
                        <tr>
                          <th className="py-2 px-3 border-r border-zinc-300 w-8">No.</th>
                          <th className="py-2 px-3 border-r border-zinc-300">Title</th>
                          <th className="py-2 px-3 border-r border-zinc-300">Producer(s)</th>
                          <th className="py-2 px-3 text-right">Length</th>
                        </tr>
                      </thead>
                      <tbody>
                        {releaseSongs.map((s, idx) => {
                          const mins = Math.floor((s.duration || 210) / 60);
                          const secs = (s.duration || 210) % 60;
                          return (
                            <tr key={s.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                              <td className="py-2 px-3 border-r border-zinc-200 font-mono text-zinc-500">{idx + 1}</td>
                              <td className="py-2 px-3 border-r border-zinc-200 font-medium text-black">
                                "{s.title}"
                              </td>
                              <td className="py-2 px-3 border-r border-zinc-200 text-zinc-600">
                                {s.producers && Array.isArray(s.producers) && s.producers.length > 0
                                  ? s.producers.join(', ')
                                  : ((s as any).producer || artist?.name || 'Artist')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-zinc-600">
                                {mins}:{secs < 10 ? '0' : ''}{secs}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-[#f8f9fa]">
              <div className="flex items-center gap-2">
                <EditIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-serif font-bold text-lg text-black">Edit Wikipedia Article Information</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Section Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
                {[
                  { id: 'lead', label: 'Lead Section' },
                  { id: 'background', label: 'Background' },
                  { id: 'composition', label: 'Composition' },
                  { id: 'release', label: 'Release & Promotion' },
                  { id: 'reception', label: 'Critical Reception' },
                  { id: 'commercial', label: 'Commercial Performance' },
                  { id: 'infobox', label: 'Infobox & Artwork' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEditSection(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeEditSection === tab.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Lead Section Editor */}
              {activeEditSection === 'lead' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Album Display Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Lead Article Summary</label>
                    <textarea
                      rows={8}
                      value={editLeadSummary}
                      onChange={e => setEditLeadSummary(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg p-3 text-sm text-black focus:outline-none focus:border-blue-600 font-sans"
                    />
                  </div>
                </div>
              )}

              {/* Infobox & Artwork Editor */}
              {activeEditSection === 'infobox' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 uppercase mb-1">Original Cover URL</label>
                      <input
                        type="text"
                        value={editOriginalCover}
                        onChange={e => setEditOriginalCover(e.target.value)}
                        className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 uppercase mb-1">Alternative Cover URL (Optional)</label>
                      <input
                        type="text"
                        value={editAltCover}
                        onChange={e => setEditAltCover(e.target.value)}
                        placeholder="Paste image URL if cover was updated"
                        className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                      />
                    </div>
                  </div>

                  {editAltCover && (
                    <div>
                      <label className="block font-bold text-zinc-700 uppercase mb-1">Alternative Cover Caption</label>
                      <input
                        type="text"
                        value={editAltCoverCaption}
                        onChange={e => setEditAltCoverCaption(e.target.value)}
                        placeholder="e.g. 2020 reissue cover"
                        className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-700 uppercase mb-1">Record Label</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-700 uppercase mb-1">Recorded Years</label>
                      <input
                        type="text"
                        value={editRecordedYears}
                        onChange={e => setEditRecordedYears(e.target.value)}
                        className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 uppercase mb-1">Producers</label>
                    <input
                      type="text"
                      value={editProducers}
                      onChange={e => setEditProducers(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 uppercase mb-1">Recording Studios (One per line)</label>
                    <textarea
                      rows={3}
                      value={editStudios}
                      onChange={e => setEditStudios(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-black"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Section Editor */}
              {['background', 'composition', 'release', 'reception', 'commercial'].includes(activeEditSection) && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Edit {activeEditSection.charAt(0).toUpperCase() + activeEditSection.slice(1)} Section Text
                  </label>
                  <textarea
                    rows={8}
                    value={editSections[activeEditSection] || ''}
                    onChange={e => setEditSections({ ...editSections, [activeEditSection]: e.target.value })}
                    className="w-full border border-zinc-300 rounded-lg p-3 text-sm text-black focus:outline-none focus:border-blue-600 font-sans"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-zinc-200 bg-[#f8f9fa] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWikipediaEdits}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Save Wikipedia Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WikipediaView;
