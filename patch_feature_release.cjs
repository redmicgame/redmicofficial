const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /      const updatedData = {\n        \.\.\.activeData,\n        money: activeData\.money \+ payout,\n        songs: \[\.\.\.activeData\.songs, newFeatureSong\],\n      };/;

const replacement = `      const releaseId = crypto.randomUUID();
      newFeatureSong.releaseId = releaseId;
      const newFeatureRelease = {
        id: releaseId,
        title: \`\${songTitle} (feat. \${activeArtist.name})\`,
        type: "Single" as const,
        coverArt: coverArt,
        releaseDate: releaseDate,
        songIds: [newFeatureSong.id],
        isFeatureToNpc: true,
        npcArtistName: npcArtistName,
        totalStreams: 0,
        lastWeekStreams: 0,
        marketingBudget: 0,
        marketingSpent: 0,
        artistId: state.activeArtistId,
        labelId: activeData.contract?.labelId,
      };

      const updatedData = {
        ...activeData,
        money: activeData.money + payout,
        songs: [...activeData.songs, newFeatureSong],
        releases: [...activeData.releases, newFeatureRelease],
      };`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed feature release creation');
