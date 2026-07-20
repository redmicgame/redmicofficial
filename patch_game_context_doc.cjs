const fs = require('fs');

const file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const replaceStr = `    case "CREATE_LIVE_ALBUM": {`;
const insertStr = `    case "RELEASE_TOUR_DOCUMENTARY": {
      if (!state.activeArtistId) return state;
      const activeData = state.artistsData[state.activeArtistId];
      const tour = activeData.tours.find(t => t.id === action.payload.tourId);
      if (!tour) return state;

      const newRole = {
          id: crypto.randomUUID(),
          title: \`\${tour.name}: The Documentary\`,
          type: "Tour Documentary",
          roleName: "Self",
          year: state.date.year,
          status: "Released",
          coverUrl: action.payload.coverUrl,
          rating: 80 + Math.floor(Math.random() * 15) // Good rating
      };

      const existingRoles = activeData.actingRoles || [];
      // Don't release twice
      if (existingRoles.some(r => r.title === newRole.title)) {
          return state;
      }

      return {
          ...state,
          artistsData: {
              ...state.artistsData,
              [state.activeArtistId]: {
                  ...activeData,
                  actingRoles: [...existingRoles, newRole],
                  hype: Math.min(100, (activeData.hype || 0) + 20),
                  popularity: Math.min(100, (activeData.popularity || 0) + 5)
              }
          }
      };
    }
    case "CREATE_LIVE_ALBUM": {`;

content = content.replace(replaceStr, insertStr);

fs.writeFileSync(file_path, content);
console.log("Patched GameContext with RELEASE_TOUR_DOCUMENTARY");
