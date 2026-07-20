const fs = require('fs');

let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

// Update GameContext:
// Week 5: Determine Oscar Nominations
// we need to process all categories

const target = `      // Week 5: Determine Oscar Nominations
      if (newDate.week === 5 && (state.oscarSubmissions?.length || 0) > 0) {
        const categoryName = "Best Original Song";
        const contenders: OscarContender[] = [];

        // Player contenders
        for (const sub of (state.oscarSubmissions || [])) {
          const artistData = updatedArtistsData[sub.artistId];
          const artistProfile = allPlayerArtistsAndGroups.find(
            (a) => a.id === sub.artistId,
          );
          const song = artistData.songs.find((s) => s.id === sub.itemId);
          if (artistData && artistProfile && song) {
            const score = song.quality * 3 + song.streams / 1000000;
            contenders.push({
              id: song.id,
              name: song.title,
              artistName: artistProfile.name,
              isPlayer: true,
              score,
              coverArt: song.coverArt,
            });
          }
        }

        // NPC contenders
        const npcSongsForOscars = [...newNpcsList]
          .sort((a, b) => b.basePopularity - a.basePopularity)
          .slice(0, 10);
        npcSongsForOscars.forEach((song) => {
          contenders.push({
            id: song.uniqueId,
            name: song.title,
            artistName: song.artist,
            isPlayer: false,
            score: (song.basePopularity / 100000) * 1.5,
            coverArt:
              song.coverArt ||
              \`https://ui-avatars.com/api/?name=\${encodeURIComponent(song.artist)}&background=random&color=fff&size=250\`,
          });
        });

        contenders.sort((a, b) => b.score - a.score);
        const nominees = contenders.slice(0, 5);

        if (nominees.length > 0) {
          newOscarNominations = [
            {
              name: categoryName,
              nominees,
              winner: null,
            },
          ];`;

const replacement = `      // Week 5: Determine Oscar Nominations
      if (newDate.week === 5 && (state.oscarSubmissions?.length || 0) > 0) {
        newOscarNominations = [];
        const categories = ["Best Original Song", "Best Actor/Actress", "Best Supporting Actor/Actress", "Best Voice Actor/Actress"];
        
        for (const categoryName of categories) {
            const contenders: OscarContender[] = [];
            const catSubs = (state.oscarSubmissions || []).filter(sub => sub.category === categoryName);

            // Player contenders
            for (const sub of catSubs) {
              const artistData = updatedArtistsData[sub.artistId];
              const artistProfile = allPlayerArtistsAndGroups.find(
                (a) => a.id === sub.artistId,
              );
              if (categoryName === "Best Original Song") {
                  const song = artistData.songs.find((s) => s.id === sub.itemId);
                  if (artistData && artistProfile && song) {
                    const score = song.quality * 3 + song.streams / 1000000;
                    contenders.push({
                      id: song.id,
                      name: song.title,
                      artistName: artistProfile.name,
                      isPlayer: true,
                      score,
                      coverArt: song.coverArt,
                    });
                  }
              } else {
                  const role = artistData.actingRoles?.find((r) => r.id === sub.itemId);
                  if (artistData && artistProfile && role) {
                    // Only previous year work
                    if (role.year !== newDate.year - 1) continue;
                    let score = (role.rating || 50) * 2;
                    if (role.roleType === 'Extra') score /= 10;
                    contenders.push({
                      id: role.id,
                      name: role.title,
                      artistName: artistProfile.name + ' (' + role.roleName + ')',
                      isPlayer: true,
                      score,
                      coverArt: role.coverUrl || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(role.title)}&background=random&color=fff&size=250\`,
                    });
                  }
              }
            }

            // NPC contenders
            if (categoryName === "Best Original Song") {
                const npcSongsForOscars = [...newNpcsList]
                  .sort((a, b) => b.basePopularity - a.basePopularity)
                  .slice(0, 10);
                npcSongsForOscars.forEach((song) => {
                  contenders.push({
                    id: song.uniqueId,
                    name: song.title,
                    artistName: song.artist,
                    isPlayer: false,
                    score: (song.basePopularity / 100000) * 1.5,
                    coverArt:
                      song.coverArt ||
                      \`https://ui-avatars.com/api/?name=\${encodeURIComponent(song.artist)}&background=random&color=fff&size=250\`,
                  });
                });
            } else {
                const fakeActors = ["Tom Hanks", "Meryl Streep", "Leonardo DiCaprio", "Cate Blanchett", "Denzel Washington", "Viola Davis", "Brad Pitt", "Nicole Kidman", "Joaquin Phoenix", "Emma Stone"];
                const fakeRoles = ["The Great Journey", "Midnight Shadows", "Echoes of Time", "Silent Rivers", "The Last Stand", "Rising Sun"];
                for (let i = 0; i < 10; i++) {
                    contenders.push({
                        id: \`npc_role_\${i}\`,
                        name: fakeRoles[Math.floor(Math.random() * fakeRoles.length)],
                        artistName: fakeActors[Math.floor(Math.random() * fakeActors.length)],
                        isPlayer: false,
                        score: 70 + Math.random() * 40,
                        coverArt: \`https://ui-avatars.com/api/?name=Movie&background=random&color=fff&size=250\`,
                    });
                }
            }

            contenders.sort((a, b) => b.score - a.score);
            const nominees = contenders.slice(0, 5);

            if (nominees.length > 0) {
              newOscarNominations.push({
                  name: categoryName,
                  nominees,
                  winner: null,
              });
            }
        }`;

contextContent = contextContent.replace(target, replacement);
fs.writeFileSync(contextFile, contextContent);
console.log("Patched oscars");
