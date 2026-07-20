const fs = require('fs');

let typesContent = fs.readFileSync('types.ts', 'utf-8');
if (!typesContent.includes('goldenGlobeBanner?: string;')) {
    typesContent = typesContent.replace('oscarBanner?: string;', 'oscarBanner?: string;\n  goldenGlobeBanner?: string;');
    fs.writeFileSync('types.ts', typesContent);
    console.log("Patched types.ts");
}

let gameContextContent = fs.readFileSync('context/GameContext.tsx', 'utf-8');
if (!gameContextContent.includes('UPDATE_GOLDEN_GLOBE_BANNER')) {
    const actionType = `| { type: "UPDATE_GOLDEN_GLOBE_BANNER"; payload: string }`;
    gameContextContent = gameContextContent.replace('type: "UPDATE_OSCAR_BANNER";', actionType + '\n  | { type: "UPDATE_OSCAR_BANNER";');
    
    const reducerCase = `
    case "UPDATE_GOLDEN_GLOBE_BANNER": {
      if (!state.activeArtistId) return state;
      return {
        ...state,
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...state.artistsData[state.activeArtistId],
            goldenGlobeBanner: action.payload,
          },
        },
      };
    }
`;
    gameContextContent = gameContextContent.replace('case "UPDATE_OSCAR_BANNER":', reducerCase + '\n    case "UPDATE_OSCAR_BANNER":');
    fs.writeFileSync('context/GameContext.tsx', gameContextContent);
    console.log("Patched game context banner");
}
