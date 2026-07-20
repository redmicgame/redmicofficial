const fs = require('fs');

let gameContext = fs.readFileSync('context/GameContext.tsx', 'utf-8');
gameContext = gameContext.replace(/artistData\.gigs\.find/g, 'artistData.actingRoles.find');
fs.writeFileSync('context/GameContext.tsx', gameContext);
console.log('Fixed actingRoles in GameContext');

let submitGlobes = fs.readFileSync('components/SubmitForGoldenGlobesView.tsx', 'utf-8');
submitGlobes = submitGlobes.replace(/activeArtistData\.gigs/g, 'activeArtistData.actingRoles');
fs.writeFileSync('components/SubmitForGoldenGlobesView.tsx', submitGlobes);
console.log('Fixed actingRoles in SubmitForGoldenGlobesView');

let globesView = fs.readFileSync('components/GoldenGlobesView.tsx', 'utf-8');
globesView = globesView.replace(/const \{ goldenGlobeHistory, songs, releases, gigs, goldenGlobeBanner \} = activeArtistData;/, 'const { goldenGlobeHistory, songs, releases, actingRoles, goldenGlobeBanner } = activeArtistData;');
globesView = globesView.replace(/const gig = gigs\.find/g, 'const role = actingRoles.find');
globesView = globesView.replace(/if \(gig\) return gig\.imageUrl;/g, 'if (role) return role.coverUrl;');
fs.writeFileSync('components/GoldenGlobesView.tsx', globesView);
console.log('Fixed actingRoles in GoldenGlobesView');

