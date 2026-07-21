const fs = require('fs');
const file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\| \{ type: 'UPDATE_YOUTUBE_CHANNEL'; payload: Partial<YouTubeChannel> \}/g,
    `| { type: 'UPDATE_YOUTUBE_CHANNEL'; payload: Partial<YouTubeChannel> }
  | { type: 'UPDATE_VIDEO'; payload: { id: string, updates: Partial<Video> } }`
);

content = content.replace(
    /case 'UPDATE_YOUTUBE_CHANNEL': \{/g,
    `case 'UPDATE_VIDEO': {
      if (!state.activeArtistId) return state;
      const artistData = state.artistsData[state.activeArtistId];
      if (!artistData) return state;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...artistData,
            videos: artistData.videos.map(v => v.id === action.payload.id ? { ...v, ...action.payload.updates } : v)
          }
        }
      };
    }
    case 'UPDATE_YOUTUBE_CHANNEL': {`
);

fs.writeFileSync(file, content);
