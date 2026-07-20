const fs = require('fs');

let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      const newPost: XPost = {
        id: crypto.randomUUID(),
        authorId: "popbase",
        content: postContent,
        image: imageUrl,
        likes: Math.floor(Math.random() * 200000) + 50000,
        retweets: Math.floor(Math.random() * 20000) + 5000,
        views: Math.floor(Math.random() * 1000000) + 500000,
        date: state.date,
      };

      return {
        ...state,
        activeEventInvitation: null,
        currentView: "game",
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            xPosts: [newPost, ...activeData.xPosts],
            hype: Math.min(100, (activeData.hype || 50) + 10),
            publicImage: Math.min(100, (activeData.publicImage || 50) + 15),
          },
        },
      };`;

const replacement = `      const newPost: XPost = {
        id: crypto.randomUUID(),
        authorId: "popbase",
        content: postContent,
        image: imageUrl,
        likes: Math.floor(Math.random() * 200000) + 50000,
        retweets: Math.floor(Math.random() * 20000) + 5000,
        views: Math.floor(Math.random() * 1000000) + 500000,
        date: state.date,
      };
      
      const newLook = {
          id: crypto.randomUUID(),
          awardShow: eventInfo.eventType === "afterParty" ? eventInfo.eventName : eventInfo.eventType === "soundtrackPremiere" ? "Premiere: " + eventInfo.associatedSoundtrack : eventInfo.eventName,
          year: state.date.year,
          imageUrl: imageUrl || "",
      };

      return {
        ...state,
        activeEventInvitation: null,
        currentView: "game",
        artistsData: {
          ...state.artistsData,
          [state.activeArtistId]: {
            ...activeData,
            xPosts: [newPost, ...activeData.xPosts],
            pastRedCarpetLooks: [newLook, ...(activeData.pastRedCarpetLooks || [])],
            hype: Math.min(100, (activeData.hype || 50) + 10),
            publicImage: Math.min(100, (activeData.publicImage || 50) + 15),
          },
        },
      };`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log("Patched after party");
