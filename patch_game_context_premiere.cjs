const fs = require('fs');

let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const target = `    case "ATTEND_ACTING_PREMIERE": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const role = activeData.actingRoles?.find(r => r.id === action.payload.roleId);
      if (!role) return state;
      
      return {
          ...state,
          artistsData: {
              ...state.artistsData,
              [state.activeArtistId]: {
                  ...activeData,
                  actingRoles: activeData.actingRoles?.map(r => r.id === action.payload.roleId ? { ...r, status: "Released" } : r),
                  popularity: Math.min(100, activeData.popularity + 2),
                  publicImage: Math.min(100, (activeData.publicImage || 80) + 5),
                  hype: Math.min(100, activeData.hype + 5)
              }
          }
      };
    }`;

const replacement = `    case "ATTEND_ACTING_PREMIERE": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const role = activeData.actingRoles?.find(r => r.id === action.payload.roleId);
      if (!role) return state;
      
      const email = activeData.inbox.find(e => e.offer?.type === 'actingPremiere' && e.offer.roleId === role.id);
      const updatedInbox = activeData.inbox.map(e => e.id === email?.id ? { ...e, offer: { ...e.offer, isAccepted: true } } : e);

      return {
          ...state,
          artistsData: {
              ...state.artistsData,
              [state.activeArtistId]: {
                  ...activeData,
                  actingRoles: activeData.actingRoles?.map(r => r.id === action.payload.roleId ? { ...r, status: "Released" } : r),
                  inbox: updatedInbox
              }
          },
          activeMoviePremiereOffer: { roleId: role.id, roleTitle: role.title },
          currentView: "moviePremiereRedCarpet"
      };
    }
    
    case "ACCEPT_MOVIE_PREMIERE_RED_CARPET": {
        if (!state.activeArtistId) return state;
        const { lookUrl } = action.payload;
        if (!state.activeMoviePremiereOffer) return state;
        
        if (lookUrl) {
            const activeData = state.artistsData[state.activeArtistId];
            const artistName = state.soloArtist?.name || state.group?.name;
            const title = state.activeMoviePremiereOffer.roleTitle;
            
            const locations = ["New York City", "Los Angeles", "Paris", "Dubai", "London", "Tokyo"];
            const loc = locations[Math.floor(Math.random() * locations.length)];
            
            const popBasePost = {
              id: crypto.randomUUID(),
              authorId: "popbase",
              content: \`\${artistName} stuns for '\${title.toUpperCase()}' premiere in \${loc}.\`,
              image: lookUrl,
              likes: Math.floor(Math.random() * 99000) + 16000,
              retweets: Math.floor(Math.random() * 16000) + 7000,
              views: Math.floor(Math.random() * 3100000) + 1200000,
              date: state.date,
            };
            
            const newLook = {
              id: crypto.randomUUID(),
              awardShow: "Movie Premiere: " + title,
              year: state.date.year,
              imageUrl: lookUrl,
            };
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        xPosts: [popBasePost, ...activeData.xPosts],
                        pastRedCarpetLooks: [newLook, ...(activeData.pastRedCarpetLooks || [])],
                        popularity: Math.min(100, activeData.popularity + 2),
                        publicImage: Math.min(100, (activeData.publicImage || 80) + 5),
                        hype: Math.min(100, activeData.hype + 5)
                    }
                },
                activeMoviePremiereOffer: null,
                currentView: "game"
            };
        } else {
             return {
                ...state,
                activeMoviePremiereOffer: null,
                currentView: "game"
            };
        }
    }`;

contextContent = contextContent.replace(target, replacement);

fs.writeFileSync(contextFile, contextContent);
console.log("Patched acting premiere");
