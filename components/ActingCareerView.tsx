import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { TALENT_AGENCIES } from '../constants';
import { ActingAudition, ActingRole } from '../types';

const ACTING_TITLES = {
  Movie: [
    { title: 'Dune: Part Three', studio: 'Warner Bros', genre: 'Sci-Fi' as const, snippet: 'Standing atop the Arrakis ridge, staring into the endless spice storms...' },
    { title: 'The Batman - Part II', studio: 'Warner Bros', genre: 'Thriller' as const, snippet: 'Shadows engulf the alleyway as rain pours down on Gotham City...' },
    { title: 'Oppenheimer II: Manhattan Project', studio: 'Universal', genre: 'Drama' as const, snippet: 'A silent room where physics equations dictate the fate of humanity...' },
    { title: 'Spider-Man 4', studio: 'Marvel / Sony', genre: 'Action' as const, snippet: 'Swinging through Manhattan skyline while facing a classic nemesis...' },
    { title: 'Joker: Folie à Deux Sequel', studio: 'Warner Bros', genre: 'Drama' as const, snippet: 'A tragic laugh echoes in the soundproof courtroom interrogation room...' },
    { title: 'Knives Out 3: Wake Up Dead Man', studio: 'Netflix', genre: 'Thriller' as const, snippet: 'Benoit Blanc questions suspects in a grand New England manor...' },
    { title: 'Avatar 3: Fire and Ash', studio: '20th Century', genre: 'Sci-Fi' as const, snippet: 'Riding an ash-drake through volcanic rift valleys of Pandora...' },
    { title: 'Wicked: Part Two', studio: 'Universal', genre: 'Romance' as const, snippet: 'Defying gravity atop Emerald City in a soaring musical duet...' },
    { title: 'Deadpool & Wolverine 2', studio: 'Marvel', genre: 'Action' as const, snippet: 'Breaking the fourth wall while unsheathing twin katana blades...' },
    { title: 'Gladiator III', studio: 'Paramount', genre: 'Action' as const, snippet: 'The roar of the Colosseum echoes through the dusty Roman arena...' },
    { title: 'Mission: Impossible 8', studio: 'Paramount', genre: 'Action' as const, snippet: 'Hanging off the side of a cargo plane over arctic mountain peaks...' },
    { title: 'Avengers: Secret Wars', studio: 'Marvel', genre: 'Action' as const, snippet: 'As Battleworld fractures, variants meet face to face for the final clash...' },
    { title: 'Fast X: Part 2', studio: 'Universal', genre: 'Action' as const, snippet: 'Revving a supercharged V8 engine before a high-stakes highway jump...' },
    { title: 'A24 Psychological Thriller', studio: 'A24', genre: 'Horror' as const, snippet: 'Unspoken grief suffocates a desolate Scandinavian farmhouse...' },
    { title: 'Euphoria Movie (Recast Lead)', studio: 'HBO / A24', genre: 'Drama' as const, snippet: 'Emergency recast for lead protagonist in a high-stakes drama feature...', roleType: 'Recast' },
    { title: 'Marvel Franchise (Recast Lead)', studio: 'Marvel', genre: 'Action' as const, snippet: 'Emergency replacement taking over the Superhero mantle...', roleType: 'Recast' }
  ],
  'TV Show': [
    { title: 'The White Lotus: Season 4', studio: 'HBO', genre: 'Comedy' as const, snippet: 'Sipping champagne at a luxury resort while secretly judging everyone...' },
    { title: 'Euphoria: Season 3', studio: 'HBO', genre: 'Drama' as const, snippet: 'Neon lights reflecting in teary eyes at a late night suburban house party...' },
    { title: 'Stranger Things: Season 5', studio: 'Netflix', genre: 'Sci-Fi' as const, snippet: 'Static buzzes on the walkie-talkie as red lightning strikes Hawkins...' },
    { title: 'The Bear: Season 4', studio: 'FX / Hulu', genre: 'Drama' as const, snippet: 'Yes chef! Screaming order tickets across a chaotic Michelin kitchen line...' },
    { title: 'Severance: Season 2', studio: 'Apple TV+', genre: 'Thriller' as const, snippet: 'Swiping keycard into the sterile, endless white subterranean corridors...' },
    { title: 'The Last of Us: Season 2', studio: 'HBO', genre: 'Drama' as const, snippet: 'Clutching an acoustic guitar in an overgrown abandoned music shop...' },
    { title: 'House of the Dragon: Season 3', studio: 'HBO', genre: 'Drama' as const, snippet: 'Commanding dragonfire atop the Great Hall throne room of Dragonstone...' },
    { title: 'Succession: Legacy Spin-Off', studio: 'HBO', genre: 'Drama' as const, snippet: 'Negotiating a multi-billion dollar media buyout inside a private jet...' },
    { title: 'Wednesday: Season 2', studio: 'Netflix', genre: 'Comedy' as const, snippet: 'Delivering deadpan morbid jokes while playing cello in Nevermore Academy...' },
    { title: 'Yellowstone (Recast Season 6)', studio: 'Paramount+', genre: 'Drama' as const, snippet: 'Replacing previous lead cowboy role on the Dutton Ranch...', roleType: 'Recast' }
  ],
  'Voice Acting': [
    { title: 'Grand Theft Auto VI', studio: 'Rockstar Games', genre: 'Action' as const, snippet: 'Voice recording for high-octane Vice City getaway car banter...' },
    { title: 'Spider-Man: Beyond the Spider-Verse', studio: 'Sony Animation', genre: 'Sci-Fi' as const, snippet: 'Voicing a futuristic multidimensional Spider-Hero in animated combat...' },
    { title: 'Inside Out 3', studio: 'Pixar / Disney', genre: 'Comedy' as const, snippet: 'Voicing a chaotic brand new emotion inside a teenager mind...' },
    { title: 'Cyberpunk 2077 Sequel', studio: 'CD Projekt Red', genre: 'Sci-Fi' as const, snippet: 'Voicing a rogue mercenary netrunner AI in Night City...' },
    { title: 'Shrek 5', studio: 'DreamWorks', genre: 'Comedy' as const, snippet: 'Voicing a sassy fairytale creature in Far Far Away...' },
    { title: 'Arcane: Season 2 (Recast Voice)', studio: 'Riot Games / Netflix', genre: 'Action' as const, snippet: 'Voicing Hextech inventor after previous voice actor recast...', roleType: 'Recast' }
  ]
};

// Signature Drawing Pad Component
const SignaturePad: React.FC<{ onSignatureChange: (hasSigned: boolean) => void }> = ({ onSignatureChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    onSignatureChange(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(false);
  };

  return (
    <div className="space-y-1 mt-2">
      <div className="flex justify-between items-center text-[11px] text-amber-900 font-bold uppercase tracking-wider">
        <span>✍️ Draw Signature Here:</span>
        <button type="button" onClick={clearCanvas} className="text-red-700 hover:underline text-[10px]">Clear Canvas</button>
      </div>
      <canvas
        ref={canvasRef}
        width={340}
        height={85}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full bg-[#fdfcf7] border-2 border-dashed border-amber-800/40 rounded cursor-crosshair touch-none"
      />
    </div>
  );
};

const ActingCareerView: React.FC = () => {
  const { activeArtist, activeArtistData, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState<'auditions' | 'production' | 'pr' | 'filmography' | 'agencies'>('auditions');
  
  // Filters for Hollywood Hub
  const [filterMediaType, setFilterMediaType] = useState<'all' | 'Movie' | 'TV Show' | 'Voice Acting'>('all');
  const [filterRoleType, setFilterRoleType] = useState<'all' | 'Leading Role' | 'Supporting Role' | 'Recast'>('all');

  // Audition modal state
  const [selectedAudition, setSelectedAudition] = useState<ActingAudition | null>(null);
  const [auditionStyle, setAuditionStyle] = useState<'comedy' | 'drama' | 'action' | 'method'>('drama');
  const [auditionResult, setAuditionResult] = useState<{ success: boolean; message: string; contract?: any } | null>(null);

  // Contract Modal state
  const [contractSigningOffer, setContractSigningOffer] = useState<any | null>(null);
  const [customCharacterName, setCustomCharacterName] = useState<string>('');
  const [hasUserSigned, setHasUserSigned] = useState<boolean>(false);

  useEffect(() => {
    if (activeArtistData?.activeActingOffer && !contractSigningOffer) {
      setContractSigningOffer(activeArtistData.activeActingOffer);
      setCustomCharacterName(activeArtistData.activeActingOffer.roleName || '');
      setHasUserSigned(false);
    }
  }, [activeArtistData?.activeActingOffer]);

  // Press junket modal state
  const [selectedPrRole, setSelectedPrRole] = useState<ActingRole | null>(null);
  const [prOutlet, setPrOutlet] = useState<'GQ' | 'Variety' | 'Hollywood Reporter'>('GQ');
  const [prAnswer, setPrAnswer] = useState<string>('');

  // Soundtrack modal state
  const [showSoundtrackModal, setShowSoundtrackModal] = useState<boolean>(false);
  const [selectedSongForSoundtrack, setSelectedSongForSoundtrack] = useState<string>('');
  const [customSoundtrackCover, setCustomSoundtrackCover] = useState<string>('');

  // Quit Filming state
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [selectedQuitReason, setSelectedQuitReason] = useState<'conflicting schedules' | 'political beliefs' | 'personal reasons' | 'no comment'>('conflicting schedules');

  const handleSoundtrackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCustomSoundtrackCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!activeArtist || !activeArtistData) return null;

  const actingSkill = activeArtistData.actingSkillLevel || 10;
  const currentAgency = TALENT_AGENCIES.find(t => t.id === activeArtistData.talentAgencyId);
  const roles = activeArtistData.actingRoles || [];
  const completedRoles = roles.filter(r => r.status === 'Completed' || r.status === 'Released');

  const skillTitle = useMemo(() => {
    if (actingSkill >= 85) return 'A-List Oscar Contender';
    if (actingSkill >= 65) return 'Mainstream Lead Actor';
    if (actingSkill >= 45) return 'Rising Hollywood Talent';
    if (actingSkill >= 25) return 'Recognizable Supporting Actor';
    return 'Hollywood Rookie';
  }, [actingSkill]);

  // Generate auditions list
  const allAuditions = useMemo(() => {
    if (activeArtistData.actingAuditions && activeArtistData.actingAuditions.length > 0) {
      return activeArtistData.actingAuditions;
    }
    const list: ActingAudition[] = [];
    let idCounter = 1;
    for (const [type, itemArray] of Object.entries(ACTING_TITLES)) {
      for (const item of itemArray) {
        const assignedRoleType = (item as any).roleType || (Math.random() > 0.5 ? 'Leading Role' : 'Supporting Role');
        list.push({
          id: `audition_${idCounter++}`,
          title: item.title,
          type: type as any,
          roleName: assignedRoleType === 'Recast' ? `Recast Lead in ${item.title}` : `Character in ${item.title}`,
          roleType: assignedRoleType as any,
          genre: item.genre,
          requiredSkill: Math.floor(Math.random() * 40) + 15,
          minPopularity: Math.floor(Math.random() * 40) + 10,
          studio: item.studio,
          pay: Math.floor(Math.random() * 3000000) + 250000,
          durationWeeks: type === 'Movie' ? 12 : 8,
          scriptSnippet: item.snippet
        });
      }
    }
    return list;
  }, [activeArtistData.actingAuditions]);

  // Filtered Auditions
  const filteredAuditions = useMemo(() => {
    return allAuditions.filter(audition => {
      if (filterMediaType !== 'all' && audition.type !== filterMediaType) return false;
      if (filterRoleType !== 'all' && audition.roleType !== filterRoleType) return false;
      return true;
    });
  }, [allAuditions, filterMediaType, filterRoleType]);

  const handleAuditionSubmit = () => {
    if (!selectedAudition) return;

    // Check 1: Experience / Skill rejection
    if (actingSkill < selectedAudition.requiredSkill) {
      setAuditionResult({
        success: false,
        message: `❌ REJECTED: The casting director for "${selectedAudition.title}" turned you down immediately because you don't have enough acting experience for this role! (Required Skill: ${selectedAudition.requiredSkill}, Your Skill: ${actingSkill}). Enroll in acting classes to build your craft!`
      });
      return;
    }

    // Check 2: Popularity / Hype rejection
    if (activeArtistData.popularity < selectedAudition.minPopularity) {
      setAuditionResult({
        success: false,
        message: `❌ REJECTED: Studio execs felt your star power wasn't high enough to draw audiences for "${selectedAudition.title}" (Required Popularity: ${selectedAudition.minPopularity}, Your Popularity: ${Math.floor(activeArtistData.popularity)}).`
      });
      return;
    }

    // Calculation: chance of getting hired for qualified actors
    const baseChance = 0.5;
    const skillBonus = (actingSkill - selectedAudition.requiredSkill) * 0.025;
    const popBonus = (activeArtistData.popularity - selectedAudition.minPopularity) * 0.015;
    const styleBonus = auditionStyle === 'method' ? 0.15 : 0.08;

    const totalChance = Math.min(0.95, Math.max(0.2, baseChance + skillBonus + popBonus + styleBonus));
    const isSuccess = Math.random() < totalChance;

    if (isSuccess) {
      const offerData = {
        id: selectedAudition.id,
        title: selectedAudition.title,
        type: selectedAudition.type,
        roleName: selectedAudition.roleName,
        roleType: selectedAudition.roleType,
        pay: selectedAudition.pay,
        durationWeeks: selectedAudition.durationWeeks,
        studio: selectedAudition.studio || 'Warner Bros',
        genre: selectedAudition.genre || 'Drama'
      };

      setAuditionResult({
        success: true,
        message: `🎉 PASSED AUDITION! The director loved your ${auditionStyle} delivery. Sign the official Hollywood production contract to begin filming!`,
        contract: offerData
      });
    } else {
      setAuditionResult({
        success: false,
        message: `The director praised your talent but decided to go with another actor for "${selectedAudition.title}". Keep auditioning!`
      });
    }
  };

  const handleOpenContract = (offer: any) => {
    setSelectedAudition(null);
    setAuditionResult(null);
    setContractSigningOffer(offer);
    setCustomCharacterName(offer?.roleName || '');
    setHasUserSigned(false);
  };

  const handleConfirmContract = () => {
    if (!contractSigningOffer) return;

    const finalRoleName = customCharacterName.trim() || contractSigningOffer.roleName || 'Lead Role';

    const updatedOffer = {
      ...contractSigningOffer,
      roleName: finalRoleName
    };

    dispatch({
      type: 'ACCEPT_ACTING_OFFER',
      payload: {
        offerId: updatedOffer.id,
        offer: updatedOffer,
        roleName: finalRoleName
      }
    });

    setContractSigningOffer(null);
    setActiveTab('production');
  };

  const handleTakeClass = (tier: 'basic' | 'masterclass') => {
    const cost = tier === 'basic' ? 1000 : 5000;
    if (activeArtistData.money < cost) {
      alert("You don't have enough funds for this acting class!");
      return;
    }
    dispatch({
      type: 'ATTEND_ACTING_CLASS',
      payload: { tier }
    });
  };

  const handlePressJunketSubmit = () => {
    if (!selectedPrRole || !prAnswer) return;
    dispatch({
      type: 'HOST_PRESS_JUNKET',
      payload: {
        roleId: selectedPrRole.id,
        outlet: prOutlet,
        answerChoice: prAnswer
      }
    });
    setSelectedPrRole(null);
    alert(`Your ${prOutlet} feature was published! Popularity increased!`);
  };

  const handleAttachSoundtrack = () => {
    if (!selectedSongForSoundtrack || !activeArtistData.filmingGig) return;
    dispatch({
      type: 'RECORD_MOVIE_SOUNDTRACK',
      payload: {
        roleId: activeArtistData.filmingGig.id,
        songId: selectedSongForSoundtrack,
        soundtrackCover: customSoundtrackCover
      }
    });
    setShowSoundtrackModal(false);
    alert("Song attached to official Motion Picture Soundtrack compilation!");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white overflow-hidden max-w-[450px] mx-auto border-x border-zinc-800 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'management' })} className="text-zinc-400 hover:text-white">
          <svg fill="currentColor" viewBox="0 0 24 24" width="22" height="22"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[#f5c518] font-black text-xl tracking-tight">HOLLYWOOD</span>
          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-semibold border border-zinc-700">Acting Hub</span>
        </div>
        <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'imdb' })} className="text-xs bg-[#f5c518] text-black font-bold px-2 py-1 rounded hover:bg-yellow-400">
          IMDb Page
        </button>
      </div>

      {/* Profile & Skill Header Banner */}
      <div className="p-4 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <img src={activeArtist.image} alt={activeArtist.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#f5c518] shadow-md" />
          <div className="flex-1">
            <h2 className="font-bold text-base flex items-center justify-between">
              {activeArtist.name}
              <span className="text-[11px] text-[#f5c518] bg-yellow-950/60 border border-yellow-700/50 px-2 py-0.5 rounded-full font-semibold">
                {skillTitle}
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400">Agency:</span>
              <span className="text-xs font-semibold text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                {currentAgency ? currentAgency.name : 'No Agency (Freelance)'}
              </span>
            </div>
            
            <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden border border-zinc-700">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full transition-all duration-500" style={{ width: `${actingSkill}%` }} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 flex justify-between font-mono">
              <span>Acting Skill: {actingSkill}/100</span>
              <span>Level: {skillTitle}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 bg-zinc-900 text-xs font-bold overflow-x-auto shrink-0 hide-scrollbar">
        <button
          onClick={() => setActiveTab('auditions')}
          className={`flex-1 min-w-[80px] py-2.5 text-center border-b-2 transition-colors ${activeTab === 'auditions' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-zinc-400'}`}
        >
          Auditions
        </button>
        <button
          onClick={() => setActiveTab('production')}
          className={`flex-1 min-w-[80px] py-2.5 text-center border-b-2 transition-colors relative ${activeTab === 'production' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-zinc-400'}`}
        >
          Production
          {activeArtistData.filmingGig && <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
        </button>
        <button
          onClick={() => setActiveTab('pr')}
          className={`flex-1 min-w-[80px] py-2.5 text-center border-b-2 transition-colors ${activeTab === 'pr' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-zinc-400'}`}
        >
          PR & Junket
        </button>
        <button
          onClick={() => setActiveTab('filmography')}
          className={`flex-1 min-w-[80px] py-2.5 text-center border-b-2 transition-colors ${activeTab === 'filmography' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-zinc-400'}`}
        >
          Filmography
        </button>
        <button
          onClick={() => setActiveTab('agencies')}
          className={`flex-1 min-w-[80px] py-2.5 text-center border-b-2 transition-colors ${activeTab === 'agencies' ? 'border-[#f5c518] text-[#f5c518]' : 'border-transparent text-zinc-400'}`}
        >
          Agencies
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        {/* TAB 1: AUDITIONS & ACTING CLASSES */}
        {activeTab === 'auditions' && (
          <div className="space-y-4">
            {/* Training / Skill Boost Section */}
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
              <h3 className="font-bold text-sm text-yellow-400 mb-1 flex items-center gap-1.5">
                <span>🎭</span> Acting Classes & Coaching
              </h3>
              <p className="text-xs text-zinc-400 mb-3">Improve your acting skill level to pass auditions for major Hollywood studio blockbusters.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTakeClass('basic')}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-left rounded-lg border border-zinc-700 transition-colors"
                >
                  <div className="font-bold text-xs text-white">Basic Class ($1,000)</div>
                  <div className="text-[10px] text-yellow-400 mt-0.5">+5 Acting Skill</div>
                </button>
                <button
                  onClick={() => handleTakeClass('masterclass')}
                  className="p-2.5 bg-yellow-950/40 border border-yellow-700/50 hover:bg-yellow-900/50 text-left rounded-lg transition-colors"
                >
                  <div className="font-bold text-xs text-yellow-300">Masterclass ($5,000)</div>
                  <div className="text-[10px] text-yellow-400 mt-0.5">+12 Acting Skill</div>
                </button>
              </div>
            </div>

            {/* HOLLYWOOD HUB FILTER BAR */}
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Filter Audition Board</h4>
              
              {/* Media Type Filter */}
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar text-xs">
                <button
                  onClick={() => setFilterMediaType('all')}
                  className={`px-2.5 py-1 rounded font-bold border shrink-0 ${filterMediaType === 'all' ? 'bg-[#f5c518] text-black border-[#f5c518]' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setFilterMediaType('Movie')}
                  className={`px-2.5 py-1 rounded font-bold border shrink-0 ${filterMediaType === 'Movie' ? 'bg-[#f5c518] text-black border-[#f5c518]' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
                >
                  🎬 Movies
                </button>
                <button
                  onClick={() => setFilterMediaType('TV Show')}
                  className={`px-2.5 py-1 rounded font-bold border shrink-0 ${filterMediaType === 'TV Show' ? 'bg-[#f5c518] text-black border-[#f5c518]' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
                >
                  📺 TV Shows
                </button>
                <button
                  onClick={() => setFilterMediaType('Voice Acting')}
                  className={`px-2.5 py-1 rounded font-bold border shrink-0 ${filterMediaType === 'Voice Acting' ? 'bg-[#f5c518] text-black border-[#f5c518]' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
                >
                  🎙️ Voice Acting
                </button>
              </div>

              {/* Role Type Filter */}
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar text-[11px]">
                <button
                  onClick={() => setFilterRoleType('all')}
                  className={`px-2 py-0.5 rounded font-semibold border ${filterRoleType === 'all' ? 'bg-zinc-200 text-black border-zinc-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                >
                  All Roles
                </button>
                <button
                  onClick={() => setFilterRoleType('Leading Role')}
                  className={`px-2 py-0.5 rounded font-semibold border ${filterRoleType === 'Leading Role' ? 'bg-zinc-200 text-black border-zinc-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                >
                  Leading Role
                </button>
                <button
                  onClick={() => setFilterRoleType('Supporting Role')}
                  className={`px-2 py-0.5 rounded font-semibold border ${filterRoleType === 'Supporting Role' ? 'bg-zinc-200 text-black border-zinc-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                >
                  Supporting Role
                </button>
                <button
                  onClick={() => setFilterRoleType('Recast')}
                  className={`px-2 py-0.5 rounded font-semibold border ${filterRoleType === 'Recast' ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                >
                  🔄 Recast / Replacement
                </button>
              </div>
            </div>

            {/* Auditions Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Open Script Auditions ({filteredAuditions.length})</h3>
              <button
                onClick={() => dispatch({ type: 'REFRESH_ACTING_AUDITIONS' })}
                className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded font-medium border border-zinc-700"
              >
                Refresh Board
              </button>
            </div>

            {/* Auditions List */}
            <div className="space-y-3">
              {filteredAuditions.map((audition) => {
                const meetsSkill = actingSkill >= audition.requiredSkill;
                const meetsPop = activeArtistData.popularity >= audition.minPopularity;
                const isBusy = !!activeArtistData.filmingGig;

                return (
                  <div key={audition.id} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs bg-zinc-800 text-yellow-400 px-2 py-0.5 rounded font-bold">{audition.studio}</span>
                          <span className="text-[11px] text-zinc-400">{audition.type} • {audition.genre}</span>
                          {audition.roleType === 'Recast' && (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-bold">RECAST ROLE</span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-white mt-1">{audition.title}</h4>
                        <p className="text-xs text-zinc-300 font-medium">{audition.roleName} ({audition.roleType})</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-green-400">${formatNumber(audition.pay)}</p>
                        <p className="text-[10px] text-zinc-400">{audition.durationWeeks} Weeks Filming</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                      "{audition.scriptSnippet}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="flex gap-2">
                        <span className={meetsSkill ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                          Req Skill: {audition.requiredSkill}
                        </span>
                        <span className={meetsPop ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                          Req Hype: {audition.minPopularity}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAudition(audition);
                          setAuditionResult(null);
                        }}
                        disabled={isBusy}
                        className="bg-[#f5c518] hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded text-xs transition-colors disabled:bg-zinc-800 disabled:text-zinc-500"
                      >
                        {isBusy ? 'Busy Filming' : 'Audition'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FILMING & PRODUCTION */}
        {activeTab === 'production' && (
          <div className="space-y-4">
            {activeArtistData.filmingGig ? (
              <div className="bg-zinc-900 border border-yellow-600/50 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-xs bg-yellow-950 text-yellow-400 font-bold px-2 py-0.5 rounded border border-yellow-700/50">
                      ON SET FILMING
                    </span>
                    <h3 className="font-bold text-lg text-white mt-1.5">{activeArtistData.filmingGig.title}</h3>
                    <p className="text-xs text-zinc-300">Role: {activeArtistData.filmingGig.roleName} ({activeArtistData.filmingGig.roleType})</p>
                    <p className="text-xs text-zinc-400">Studio: {activeArtistData.filmingGig.studio} • {activeArtistData.filmingGig.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Production Time</p>
                    <p className="text-base font-bold text-yellow-400">{activeArtistData.filmingGig.remainingWeeks} Weeks Left</p>
                  </div>
                </div>

                {/* On Set Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">On-Set Directors & Production Choices</h4>
                  
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                    <p className="text-xs text-zinc-300">
                      🎬 <strong className="text-white">Method Acting Commitment:</strong> Stay in character off-camera to boost performance quality and critical acclaim.
                    </p>
                    <button
                      onClick={() => alert("You went Method Acting on set! Production team was impressed. Critical acclaim potential increased!")}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-semibold py-2 rounded border border-zinc-700"
                    >
                      Commit to Method Acting (+Acclaim Risk)
                    </button>
                  </div>

                  {/* Soundtrack Linking */}
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                    <p className="text-xs text-zinc-300">
                      🎵 <strong className="text-white">Lead Single / Soundtrack Song:</strong> Attach one of your songs as the official theme song for this movie/show!
                    </p>
                    <button
                      onClick={() => setShowSoundtrackModal(true)}
                      className="w-full bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-xs text-white font-bold py-2 rounded transition-colors"
                    >
                      Attach Lead Soundtrack Song
                    </button>
                  </div>

                  {/* Quit Production (First 2 Weeks Only) */}
                  {(() => {
                    const gig = activeArtistData.filmingGig;
                    const totalWeeks = (gig as any).totalDurationWeeks || 10;
                    const elapsedWeeks = totalWeeks - gig.remainingWeeks;
                    const canQuit = elapsedWeeks <= 2;

                    if (canQuit) {
                      return (
                        <div className="bg-red-950/40 p-3 rounded-lg border border-red-900/50 space-y-2 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-red-400 flex items-center gap-1">
                              <span>🚪</span> Quit Movie / Production
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">Week {elapsedWeeks + 1} of 2 Allowed</span>
                          </div>
                          <p className="text-[11px] text-zinc-300">
                            You can quit this movie/show within the first 2 weeks. The studio will get their money back in full plus a 10% breach fee penalty.
                          </p>
                          <button
                            onClick={() => setShowQuitModal(true)}
                            className="w-full bg-red-900/80 hover:bg-red-800 text-xs text-white font-bold py-2 rounded border border-red-700 transition-colors"
                          >
                            Quit Filming & Exit Project
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/60 rounded-xl border border-zinc-800 p-6">
                <span className="text-3xl">🎬</span>
                <h3 className="font-bold text-base text-white mt-2">Not Currently Filming</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Audition for movies, TV shows, or voice acting in the Auditions tab to sign a production contract and start filming!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PR & PREMIERE */}
        {activeTab === 'pr' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white">Press Junkets & Movie Premieres</h3>

            {completedRoles.length > 0 ? (
              completedRoles.map((role) => (
                <div key={role.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{role.title}</h4>
                      <p className="text-xs text-zinc-400">{role.roleName} • {role.type}</p>
                    </div>
                    <span className="text-[11px] bg-green-950 text-green-400 font-bold px-2 py-0.5 rounded border border-green-800">
                      {role.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setSelectedPrRole(role)}
                      className="py-2 bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded font-semibold text-xs transition-colors"
                    >
                      Host Press Junket
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'ATTEND_ACTING_PREMIERE', payload: { roleId: role.id } })}
                      className="py-2 bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 border border-yellow-700/50 rounded font-semibold text-xs transition-colors"
                    >
                      Red Carpet Premiere
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">Complete a movie or TV role to unlock Hollywood Press Junkets and Red Carpet Premieres.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FILMOGRAPHY & REVIEWS */}
        {activeTab === 'filmography' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">Hollywood Filmography & Ratings</h3>

            {completedRoles.length > 0 ? (
              completedRoles.map((role) => {
                const rtScore = role.rottenTomatoes || Math.floor(Math.random() * 30 + 65);
                const isFresh = rtScore >= 75;
                const metacritic = role.metacritic || Math.floor(rtScore * 0.9);
                const boxOffice = role.boxOfficeWorldwide || (role.type === 'Movie' ? Math.floor(Math.random() * 300000000) + 50000000 : 0);

                return (
                  <div key={role.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                          {role.title}
                          {isFresh && (
                            <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded font-black">
                              🍅 FRESH
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-zinc-300">{role.roleName} • {role.year}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                          ⭐ {role.rating?.toFixed(1) || '8.2'} / 10
                        </span>
                      </div>
                    </div>

                    {/* Ratings Badges */}
                    <div className="flex gap-2 text-xs pt-1 flex-wrap">
                      <div className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 flex items-center gap-1">
                        <span className="text-red-500 font-black">🍅 RT:</span>
                        <span className="font-bold text-white">{rtScore}%</span>
                      </div>
                      <div className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 flex items-center gap-1">
                        <span className="text-green-500 font-black">MC:</span>
                        <span className="font-bold text-white">{metacritic}/100</span>
                      </div>
                      {role.type === 'Movie' && boxOffice > 0 && (
                        <div className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 flex items-center gap-1">
                          <span className="text-zinc-400 font-semibold">Box Office:</span>
                          <span className="font-bold text-green-400">${formatNumber(boxOffice)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-xs text-zinc-500">
                Your completed acting roles, box office performance, and Rotten Tomatoes scores will appear here.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TALENT AGENCIES */}
        {activeTab === 'agencies' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white">Hollywood Talent Agencies</h3>
            <p className="text-xs text-zinc-400">Sign with top agencies to get access to blockbuster auditions and negotiate higher acting pay.</p>

            <div className="space-y-3 pt-1">
              {TALENT_AGENCIES.map((agency) => {
                const isSigned = activeArtistData.talentAgencyId === agency.id;
                const meetsPop = activeArtistData.popularity >= agency.minPopularity;
                const meetsSkill = actingSkill >= (agency.minSkill || 0);

                return (
                  <div key={agency.id} className={`p-3.5 rounded-xl border ${isSigned ? 'bg-yellow-950/30 border-[#f5c518]' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{agency.name}</h4>
                        <p className="text-xs text-yellow-400 font-medium">Agency Commission Fee: {agency.feePercent}%</p>
                      </div>
                      {isSigned && (
                        <span className="text-[10px] bg-[#f5c518] text-black font-bold px-2 py-0.5 rounded">
                          CURRENT AGENCY
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-2">{agency.description || 'Top agency securing leading film roles and brand endorsements.'}</p>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-800 text-xs">
                      <div className="text-zinc-400 text-[11px]">
                        Req Pop: {agency.minPopularity}%
                      </div>
                      {!isSigned && (
                        <button
                          onClick={() => {
                            if (!meetsPop || !meetsSkill) {
                              alert("You don't meet the agency's requirements yet!");
                              return;
                            }
                            dispatch({ type: 'SIGN_TALENT_AGENCY', payload: { agencyId: agency.id } });
                          }}
                          disabled={!meetsPop || !meetsSkill}
                          className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold px-3 py-1 rounded text-xs transition-colors"
                        >
                          Sign Contract
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AUDITION MODAL */}
      {selectedAudition && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white">
            <h3 className="font-bold text-base text-[#f5c518]">Auditioning for: {selectedAudition.title}</h3>
            
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1 text-xs">
              <p><strong>Studio:</strong> {selectedAudition.studio}</p>
              <p><strong>Role:</strong> {selectedAudition.roleName} ({selectedAudition.roleType})</p>
              <p><strong>Base Salary:</strong> <span className="text-green-400 font-bold">${formatNumber(selectedAudition.pay)}</span></p>
            </div>

            {auditionResult ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg text-xs leading-relaxed border ${auditionResult.success ? 'bg-green-950/70 border-green-700 text-green-200' : 'bg-red-950/70 border-red-700 text-red-200'}`}>
                  {auditionResult.message}
                </div>

                {auditionResult.success && auditionResult.contract && (
                  <button
                    onClick={() => handleOpenContract(auditionResult.contract)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>📜</span> Sign Hollywood Contract Now
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">Choose Audition Delivery Approach:</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <button onClick={() => setAuditionStyle('drama')} className={`p-2 rounded border text-center ${auditionStyle === 'drama' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>Dramatic Monologue</button>
                  <button onClick={() => setAuditionStyle('comedy')} className={`p-2 rounded border text-center ${auditionStyle === 'comedy' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>Comedic Timing</button>
                  <button onClick={() => setAuditionStyle('action')} className={`p-2 rounded border text-center ${auditionStyle === 'action' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>High Energy Action</button>
                  <button onClick={() => setAuditionStyle('method')} className={`p-2 rounded border text-center ${auditionStyle === 'method' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>Raw Method Intensity</button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedAudition(null);
                  setAuditionResult(null);
                }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg text-zinc-300"
              >
                Close
              </button>
              {!auditionResult && (
                <button
                  onClick={handleAuditionSubmit}
                  className="flex-1 py-2 bg-[#f5c518] hover:bg-yellow-400 text-xs font-bold rounded-lg text-black"
                >
                  Deliver Audition
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE LEGAL CONTRACT SIGNING MODAL */}
      {contractSigningOffer && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#fefcf8] text-stone-900 border-4 border-amber-900/60 rounded-xl max-w-sm w-full p-4 space-y-3 shadow-2xl font-serif text-xs">
            {/* Header Seal */}
            <div className="text-center border-b-2 border-amber-900/40 pb-2">
              <div className="inline-block bg-amber-900 text-amber-100 text-[10px] font-mono px-2 py-0.5 font-bold uppercase rounded tracking-widest mb-1">
                HOLLYWOOD SCREEN ACTORS GUILD & STUDIO CONTRACT
              </div>
              <h2 className="font-extrabold text-sm text-stone-900 tracking-tight uppercase">
                PRODUCTION TALENT AGREEMENT
              </h2>
              <p className="text-[10px] text-stone-600 font-sans italic">Studio: {contractSigningOffer.studio || 'Warner Bros. Pictures'}</p>
            </div>

            {/* Section 1: Parties & Role */}
            <div className="space-y-2 bg-[#f7f2e7] p-3 rounded border border-amber-800/30 font-sans">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-amber-950">Project Title:</span>
                <span className="font-extrabold text-stone-900">{contractSigningOffer.title}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-amber-950">Media Format:</span>
                <span className="font-medium text-stone-800">{contractSigningOffer.type}</span>
              </div>

              {/* Editable Character Name Input */}
              <div className="flex flex-col gap-1 text-[11px] pt-1.5 border-t border-amber-800/20">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-amber-950">Character Name / Role Title:</label>
                  <span className="text-[10px] text-amber-800 font-semibold italic">✏️ Type your character name</span>
                </div>
                <input
                  type="text"
                  value={customCharacterName}
                  onChange={(e) => setCustomCharacterName(e.target.value)}
                  placeholder="e.g. Tony Stark, Arthur Fleck, Voice of Hero..."
                  className="w-full bg-white border border-amber-800/40 rounded px-2.5 py-1.5 text-xs text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-amber-700 shadow-inner"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="font-bold text-amber-950">Role Level:</span>
                <span className="font-semibold text-amber-900">{contractSigningOffer.roleType || 'Leading Role'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-amber-950">Filming Schedule:</span>
                <span className="font-medium text-stone-800">{contractSigningOffer.durationWeeks} Weeks On Set</span>
              </div>
            </div>

            {/* Section 2: Compensation & Financial Disclaimers */}
            <div className="space-y-1 bg-[#f7f2e7] p-2.5 rounded border border-amber-800/30 font-sans">
              <div className="flex justify-between text-xs font-bold text-emerald-900">
                <span>Base Salary Compensation:</span>
                <span>${contractSigningOffer.pay?.toLocaleString()} USD</span>
              </div>
              <p className="text-[9.5px] text-stone-600 italic leading-tight pt-0.5">
                * Note: Base compensation excludes external brand sponsorships, merchandise royalties, union dues, and applicable federal & state income taxes.
              </p>
              {currentAgency && (
                <p className="text-[10px] text-amber-900 font-medium pt-0.5">
                  Talent Agency Fee: {currentAgency.feePercent}% ({currentAgency.name})
                </p>
              )}
            </div>

            {/* Section 3: Expected Box Office & Financial Projection */}
            <div className="space-y-1 bg-[#f7f2e7] p-2.5 rounded border border-amber-800/30 font-sans">
              <h4 className="font-bold text-[11px] text-amber-950 uppercase tracking-wider">Projected Financial Target</h4>
              {contractSigningOffer.type === 'Movie' ? (
                <p className="text-[11px] text-stone-800 font-semibold">
                  🍿 Expected Worldwide Box Office Target: <span className="text-emerald-800 font-extrabold">$150M – $850M+</span>
                </p>
              ) : (
                <p className="text-[11px] text-stone-800 font-semibold">
                  📺 Expected Global Viewership Target: <span className="text-emerald-800 font-extrabold">20M – 60M+ Streamers</span>
                </p>
              )}
              <p className="text-[9.5px] text-stone-600 italic leading-tight">
                * Note: Actual box office returns may flop or turn into giant blockbuster hits depending on Rotten Tomatoes critical reception and audience word-of-mouth!
              </p>
            </div>

            {/* Section 4: NDA & Conduct Clause */}
            <div className="p-2 bg-[#f4ebd9] rounded border border-amber-800/40 text-[9.5px] font-sans text-stone-700 leading-tight">
              <strong>STRICT NON-DISCLOSURE (NDA) CLAUSE:</strong> The artist agrees to full plot confidentiality. Leaking spoilers, misconduct, or poor performance on set may lead to contract cancellation, recasting, or network termination.
            </div>

            {/* Interactive Drawing Signature Pad */}
            <SignaturePad onSignatureChange={(signed) => setHasUserSigned(signed)} />

            {/* Actions */}
            <div className="flex gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setContractSigningOffer(null)}
                className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded"
              >
                Decline Contract
              </button>
              <button
                type="button"
                onClick={handleConfirmContract}
                disabled={!hasUserSigned}
                className="flex-1 py-2 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 disabled:text-stone-500 text-amber-50 font-bold text-xs rounded transition-colors shadow"
              >
                Sign & Execute Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESS JUNKET MODAL */}
      {selectedPrRole && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white">
            <h3 className="font-bold text-base text-yellow-400">Host Press Junket Interview</h3>
            <p className="text-xs text-zinc-300">Promoting movie: <strong>{selectedPrRole.title}</strong></p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Select Media Outlet:</label>
              <div className="flex gap-2 text-xs font-bold">
                <button onClick={() => setPrOutlet('GQ')} className={`flex-1 py-1.5 rounded border ${prOutlet === 'GQ' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700'}`}>GQ Cover</button>
                <button onClick={() => setPrOutlet('Variety')} className={`flex-1 py-1.5 rounded border ${prOutlet === 'Variety' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700'}`}>Variety</button>
                <button onClick={() => setPrOutlet('Hollywood Reporter')} className={`flex-1 py-1.5 rounded border ${prOutlet === 'Hollywood Reporter' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-zinc-800 border-zinc-700'}`}>Hollywood Rep.</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Question: "What drew you to this project?"</label>
              <div className="space-y-1.5 text-xs">
                <button onClick={() => setPrAnswer("The script had such a profound emotional depth.")} className={`w-full p-2 text-left rounded border ${prAnswer.includes("profound") ? 'bg-yellow-950/50 border-yellow-500 text-yellow-200' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                  "The script had such a profound emotional depth."
                </button>
                <button onClick={() => setPrAnswer("Honestly, the paycheck and working with an visionary director!")} className={`w-full p-2 text-left rounded border ${prAnswer.includes("paycheck") ? 'bg-yellow-950/50 border-yellow-500 text-yellow-200' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                  "Honestly, working with a visionary director and expanding my craft."
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setSelectedPrRole(null)} className="flex-1 py-2 bg-zinc-800 text-xs font-bold rounded-lg">Cancel</button>
              <button onClick={handlePressJunketSubmit} disabled={!prAnswer} className="flex-1 py-2 bg-[#f5c518] hover:bg-yellow-400 disabled:bg-zinc-800 text-black font-bold text-xs rounded-lg">Publish Article</button>
            </div>
          </div>
        </div>
      )}

      {/* SOUNDTRACK MODAL */}
      {showSoundtrackModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white">
            <h3 className="font-bold text-base text-purple-400">Attach Lead Soundtrack Single</h3>
            <p className="text-xs text-zinc-300">Select one of your catalog songs to feature as the main theme song for "{activeArtistData.filmingGig?.title}":</p>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
              {(activeArtistData.songs || []).map((song) => (
                <button
                  key={song.id}
                  onClick={() => setSelectedSongForSoundtrack(song.id)}
                  className={`w-full p-2 text-left rounded border text-xs flex justify-between items-center ${selectedSongForSoundtrack === song.id ? 'bg-purple-950 border-purple-500 text-purple-200 font-bold' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                >
                  <span>{song.title}</span>
                  <span className="text-[10px] text-zinc-400">{song.genre || 'Single'}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Upload Custom Soundtrack Cover Artwork:</label>
              
              <div className="flex items-center gap-3">
                {customSoundtrackCover ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-purple-500 shrink-0">
                    <img src={customSoundtrackCover} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomSoundtrackCover('')}
                      className="absolute top-0.5 right-0.5 bg-black/80 text-red-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-zinc-950 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 text-xl shrink-0">
                    🖼️
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <label className="inline-block bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-bold px-3 py-1.5 rounded cursor-pointer border border-purple-700 transition-colors">
                    <span>📁 Choose Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSoundtrackImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-zinc-400">Supports PNG, JPG, WebP. Or enter URL below:</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Or paste image URL (https://...)"
                value={customSoundtrackCover}
                onChange={(e) => setCustomSoundtrackCover(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowSoundtrackModal(false)} className="flex-1 py-2 bg-zinc-800 text-xs font-bold rounded-lg">Cancel</button>
              <button onClick={handleAttachSoundtrack} disabled={!selectedSongForSoundtrack} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-bold text-xs rounded-lg">Attach Song</button>
            </div>
          </div>
        </div>
      )}

      {/* QUIT FILMING MODAL */}
      {showQuitModal && activeArtistData.filmingGig && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-800/80 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-base text-red-400 flex items-center gap-1.5">
                <span>🚨</span> Quit Filming Production
              </h3>
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded font-bold">
                BREACH OF CONTRACT
              </span>
            </div>

            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-1.5">
              <p className="text-zinc-300 font-semibold">Financial Recapturing Penalty:</p>
              <div className="flex justify-between text-zinc-400">
                <span>Refund Full Salary Advance:</span>
                <span className="font-bold text-red-400">${formatNumber((activeArtistData.filmingGig as any).pay || 2000000)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>10% Contract Breach Fee:</span>
                <span className="font-bold text-red-400">${formatNumber(Math.floor(((activeArtistData.filmingGig as any).pay || 2000000) * 0.1))}</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-zinc-800 pt-1">
                <span>Total Deducted from Balance:</span>
                <span className="text-red-400">${formatNumber(Math.floor(((activeArtistData.filmingGig as any).pay || 2000000) * 1.1))}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Select Public Reason for TMZ & Press Statement:</label>
              <div className="space-y-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSelectedQuitReason('conflicting schedules')}
                  className={`w-full p-2.5 rounded border text-left flex items-center justify-between ${selectedQuitReason === 'conflicting schedules' ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold' : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'}`}
                >
                  <span>📅 Conflicting Schedules</span>
                  {selectedQuitReason === 'conflicting schedules' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuitReason('political beliefs')}
                  className={`w-full p-2.5 rounded border text-left flex items-center justify-between ${selectedQuitReason === 'political beliefs' ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold' : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'}`}
                >
                  <span>⚖️ Political Beliefs</span>
                  {selectedQuitReason === 'political beliefs' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuitReason('personal reasons')}
                  className={`w-full p-2.5 rounded border text-left flex items-center justify-between ${selectedQuitReason === 'personal reasons' ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold' : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'}`}
                >
                  <span>🔒 Personal Reasons</span>
                  {selectedQuitReason === 'personal reasons' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuitReason('no comment')}
                  className={`w-full p-2.5 rounded border text-left flex items-center justify-between ${selectedQuitReason === 'no comment' ? 'bg-red-950/80 border-red-500 text-red-200 font-bold' : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'}`}
                >
                  <span>🤐 "No Comment" (Backlash!)</span>
                  {selectedQuitReason === 'no comment' && <span>✓</span>}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuitModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({
                    type: 'QUIT_FILMING_GIG',
                    payload: { reason: selectedQuitReason }
                  });
                  setShowQuitModal(false);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg"
              >
                Confirm Quit Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActingCareerView;
