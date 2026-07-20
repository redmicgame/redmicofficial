const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// First check if already added
if (!content.includes('ACCEPT_FIFA_OFFER')) {
    const actions = `
    case "ACCEPT_FIFA_OFFER": {
      if (!state.activeArtistId) return state;
      const { emailId, collabs } = action.payload;
      const activeData = state.artistsData[state.activeArtistId];
      
      const updatedInbox = activeData.inbox.map((email) => {
        if (email.id === emailId && email.offer?.type === "fifaWorldCupOffer") {
          return { ...email, offer: { ...email.offer, isAccepted: true } };
        }
        return email;
      });

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            inbox: updatedInbox,
          },
        },
        activeFifaOffer: { emailId, collabs },
        currentView: "createFifaWorldCup",
      };
    }
    case "CANCEL_FIFA_OFFER": {
        return { ...state, activeFifaOffer: null, currentView: "inbox" };
    }
    case "CREATE_FIFA_CONTRIBUTION": {
      if (!state.activeArtistId) return state;
      const { title, coverArt } = action.payload;
      const activeData = state.artistsData[state.activeArtistId];
      const collabs = state.activeFifaOffer?.collabs || [];
      
      // Schedule single for week 23
      const songId = crypto.randomUUID();
      const newSong = {
        id: songId,
        title: title,
        artistId: state.activeArtistId,
        features: [...collabs, "FIFA Sound"],
        duration: 180 + Math.floor(Math.random() * 60),
        explicit: false,
        streams: 0,
        lastWeekStreams: 0,
        prevWeekStreams: 0,
        sales: 0,
        quality: 100, // High quality since it's world cup
        releaseDate: { week: 23, year: state.date.year },
        weeksOnChart: 0,
        peakPosition: 0,
        isPromoted: false,
        isPerformance: false,
        isCollab: true,
        coverArt: coverArt
      };

      const newRelease = {
        id: crypto.randomUUID(),
        title: title,
        type: "Single",
        coverArt: coverArt,
        songIds: [songId],
        releaseDate: { week: 23, year: state.date.year },
        firstWeekStreams: 0,
        firstWeekSales: 0,
        weeksOnChart: 0,
        peakPosition: 0,
        wikipediaSummary: \`"\${title}" is the official single from the FIFA World Cup \${state.date.year} Soundtrack, performed by \${state.soloArtist?.name || state.group?.name} alongside \${collabs.join(", ")} and FIFA Sound. Released ahead of the tournament, it serves as an anthem for football fans globally.\`,
        certifications: [],
      };

      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            songs: [...activeData.songs, newSong],
            releases: [...activeData.releases, newRelease],
          },
        },
        activeFifaOffer: null,
        fifaSingleScheduled: { week: 23, year: state.date.year, title, coverArt, collabs },
        currentView: "game",
      };
    }
`;

    content = content.replace(
        /    case "ACCEPT_SOUNDTRACK_OFFER": \{/,
        actions + '\n    case "ACCEPT_SOUNDTRACK_OFFER": {'
    );
    
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Added FIFA actions to GameContext");
} else {
    console.log("Already added");
}
