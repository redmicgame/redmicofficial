const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    case "ACCEPT_OSCAR_RED_CARPET": {`;
const replacement = `    case "ACCEPT_GOLDEN_GLOBE_RED_CARPET": {
        if (!state.activeArtistId) return state;
        const { emailId, lookUrl } = action.payload;
        if (lookUrl) {
            const activeData = state.artistsData[state.activeArtistId];
            const artistName = state.soloArtist?.name || state.group?.name;
            const popBasePost = {
              id: crypto.randomUUID(),
              authorId: "popbase",
              content: \`\${artistName} arrives at the #GoldenGlobes red carpet.\`,
              image: lookUrl,
              likes: Math.floor(Math.random() * 99000) + 16000,
              retweets: Math.floor(Math.random() * 16000) + 7000,
              views: Math.floor(Math.random() * 3100000) + 1200000,
              date: state.date,
            };
            const newLook = {
              id: crypto.randomUUID(),
              awardShow: "Golden Globes",
              year: state.date.year,
              imageUrl: lookUrl,
            };
            
            const updatedInbox = activeData.inbox.map((email) => {
                if (email.id === emailId && email.offer?.type === "goldenGlobeRedCarpet") {
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
                        xPosts: [popBasePost, ...activeData.xPosts],
                        pastRedCarpetLooks: [newLook, ...(activeData.pastRedCarpetLooks || [])],
                    }
                },
                activeGoldenGlobeRedCarpetOffer: null,
                currentView: "game"
            };
        } else {
             return {
                ...state,
                activeGoldenGlobeRedCarpetOffer: null,
                currentView: "game"
            };
        }
    }
    case "ACCEPT_OSCAR_RED_CARPET": {`;

content = content.replace(target, replacement);

const emailTarget = `    case "ACCEPT_GOLDEN_GLOBE_INVITE": {`;
const emailReplacement = `    case "ACCEPT_GOLDEN_GLOBE_RED_CARPET_INVITE": {
      if (!state.activeArtistId) return state;
      return {
        ...state,
        activeGoldenGlobeRedCarpetOffer: { emailId: action.payload.emailId },
        currentView: "goldenGlobeRedCarpet",
      };
    }
    case "ACCEPT_GOLDEN_GLOBE_INVITE": {`;
content = content.replace(emailTarget, emailReplacement);

fs.writeFileSync(file, content);
console.log("Patched game context for golden globes red carpet");
