const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const actionType = `
  | {
      type: "SUBMIT_FOR_GOLDEN_GLOBES";
      payload: { submissions: any[]; emailId: string };
    }
`;
if (!content.includes('"SUBMIT_FOR_GOLDEN_GLOBES"')) {
    content = content.replace('type: "SUBMIT_FOR_OSCARS";', actionType + '\n  | { type: "SUBMIT_FOR_OSCARS";');
}

const reducerCase = `
    case "SUBMIT_FOR_GOLDEN_GLOBES": {
      if (!state.activeArtistId) return state;
      const { submissions, emailId } = action.payload;
      const activeData = state.artistsData[state.activeArtistId];
      const updatedInbox = activeData.inbox.map((e) => {
        if (e.id === emailId && e.offer) {
          return { ...e, offer: { ...e.offer, isSubmitted: true } };
        }
        return e;
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
        goldenGlobeSubmissions: [...state.goldenGlobeSubmissions, ...submissions],
        currentView: "game",
      };
    }
`;

if (!content.includes('case "SUBMIT_FOR_GOLDEN_GLOBES":')) {
    content = content.replace('case "SUBMIT_FOR_OSCARS":', reducerCase + '\n    case "SUBMIT_FOR_OSCARS":');
}

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Patched SUBMIT_FOR_GOLDEN_GLOBES action");
