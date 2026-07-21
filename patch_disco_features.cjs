const fs = require('fs');
let file = '/app/applet/components/SpotifyDiscographyView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const allFeatures = \[\.\.\.sortedReleases\.filter\(r => isFeature\(r\)\), \.\.\.playerFeatureReleases\];/;
const replacement = `const mockFeatureReleases = activeArtistData.songs
                .filter(s => s.isFeatureToNpc && !s.releaseId)
                .map(s => ({
                    id: 'mock_rel_' + s.id,
                    title: s.title,
                    type: 'Single' as const,
                    coverArt: s.coverArt,
                    releaseDate: s.releaseDate || {year: 0, week: 0},
                    songIds: [s.id],
                    isFeatureToNpc: true,
                    npcArtistName: s.npcArtistName,
                    totalStreams: s.streams,
                    lastWeekStreams: s.lastWeekStreams,
                    marketingBudget: 0,
                    marketingSpent: 0,
                    artistId: s.artistId,
                    labelId: undefined
                }));
            const allFeatures = [...sortedReleases.filter(r => isFeature(r)), ...playerFeatureReleases, ...mockFeatureReleases];`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed discography view features');
