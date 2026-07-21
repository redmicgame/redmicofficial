const fs = require('fs');
// Fix SpotifyForArtistsView.tsx
let file = '/app/applet/components/SpotifyForArtistsView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const release = releases.find\(\(r\) => r\.id === s\.releaseId\);\n\s*if \(\!release \|\| pitchedSongIds\.has\(s\.id\)\) return false;/,
  `const release = releases.find((r) => r.id === s.releaseId);
      if (pitchedSongIds.has(s.id)) return false;
      if (!release && !s.isFeatureToNpc) return false;`
);

content = content.replace(
  /const weeksSinceRelease = release\n\s*\? \(date\.year - release\.releaseDate\.year\) \* 52 \+ \(date\.week - release\.releaseDate\.week\)\n\s*: 0;/,
  `const releaseDateToUse = release ? release.releaseDate : s.releaseDate;
      const weeksSinceRelease = releaseDateToUse ? (date.year - releaseDateToUse.year) * 52 + (date.week - releaseDateToUse.week) : 0;`
);

fs.writeFileSync(file, content);

// Fix PromoteView.tsx
file = '/app/applet/components/PromoteView.tsx';
content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const release = releases\.find\(r => r\.id === s\.releaseId\);\n\s*if \(\!s\.isReleased \|\| \!release \|\| promotedItemIds\.has\(s\.id\)\) return false;\n\s*return date\.year - release\.releaseDate\.year >= 3;/,
  `const release = releases.find(r => r.id === s.releaseId);
            if (!s.isReleased || promotedItemIds.has(s.id)) return false;
            if (!release && !s.isFeatureToNpc) return false;
            const releaseDateToUse = release ? release.releaseDate : s.releaseDate;
            return releaseDateToUse ? (date.year - releaseDateToUse.year >= 3) : false;`
);

fs.writeFileSync(file, content);
console.log('Fixed fallback release logic');
