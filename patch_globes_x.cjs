const fs = require('fs');

const globesUserCode = `
      const goldenGlobesUser: XUser = {
        id: "golden_globes",
        name: "Golden Globes",
        username: "goldenglobes",
        avatar: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Golden_Globe_Awards_logo.svg/1200px-Golden_Globe_Awards_logo.svg.png",
        isVerified: true,
        bio: "#GoldenGlobes — LIVE Sunday, January 10, 2027 on @CBS and @paramountplus hosted by @NikkiGlaser! 📍 Hollywood, California 🔗 goldenglobes.com",
        followersCount: 1900000,
        followingCount: 822,
      };
`;

let gameContext = fs.readFileSync('context/GameContext.tsx', 'utf-8');
if (!gameContext.includes('id: "golden_globes"')) {
    gameContext = gameContext.replace(/const spotifySnapshotUser: XUser = \{/g, globesUserCode + '\n      const spotifySnapshotUser: XUser = {');
    
    // add goldenGlobesUser to the array
    gameContext = gameContext.replace(/spotifySnapshotUser,\s*addictionUser,/g, 'spotifySnapshotUser,\n          goldenGlobesUser,\n          addictionUser,');
    gameContext = gameContext.replace(/spotifySnapshotUser,\s*addictionUser/g, 'spotifySnapshotUser,\n          goldenGlobesUser,\n          addictionUser');
    fs.writeFileSync('context/GameContext.tsx', gameContext);
    console.log("Patched GameContext with goldenGlobesUser");
}

let xView = fs.readFileSync('components/XView.tsx', 'utf-8');
if (!xView.includes('id: "golden_globes"')) {
    const fallbackCode = `
    golden_globes: {
      id: "golden_globes",
      name: "Golden Globes",
      username: "goldenglobes",
      avatar: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Golden_Globe_Awards_logo.svg/1200px-Golden_Globe_Awards_logo.svg.png",
      isVerified: true,
      bio: "#GoldenGlobes — LIVE Sunday, January 10, 2027 on @CBS and @paramountplus hosted by @NikkiGlaser! 📍 Hollywood, California 🔗 goldenglobes.com",
      followersCount: 1900000,
      followingCount: 822,
    },`;
    xView = xView.replace('spotifysnapshot: {', fallbackCode + '\n    spotifysnapshot: {');
    xView = xView.replace(/spotifysnapshot", "talkofthecharts"\]/g, 'spotifysnapshot", "talkofthecharts", "golden_globes"]');
    xView = xView.replace(/spotifysnapshot"\]/g, 'spotifysnapshot", "golden_globes"]');
    fs.writeFileSync('components/XView.tsx', xView);
    console.log("Patched XView fallback");
}
