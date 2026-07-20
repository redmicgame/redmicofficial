const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const globesLogic = `
      // --- GOLDEN GLOBES LOGIC ---
      let newGoldenGlobeNominations: GameState["goldenGlobeCurrentYearNominations"] = state.goldenGlobeCurrentYearNominations;

      // Week 17: Determine Nominations
      if (newDate.week === 17 && state.goldenGlobeSubmissions.length > 0) {
        const newNominations: GoldenGlobeCategory[] = [];
        const categories: GoldenGlobeAward["category"][] = [
          "Best Actor/Actress",
          "Best Supporting Actor/Actress",
          "Best Voice Acting",
          "Best TV Show",
          "Best Movie",
          "Best Soundtrack",
          "Best Original Song"
        ];

        for (const categoryName of categories) {
          const contenders: GoldenGlobeContender[] = [];

          const playerSubmissions = state.goldenGlobeSubmissions.filter(s => s.category === categoryName);
          for (const sub of playerSubmissions) {
            const artistData = updatedArtistsData[sub.artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === sub.artistId);
            if (!artistData || !artistProfile) continue;

            let score = 0;
            let coverArt: string | undefined = undefined;

            if (["Best Actor/Actress", "Best Supporting Actor/Actress", "Best Voice Acting"].includes(categoryName)) {
                const gig = artistData.gigs.find(g => g.id === sub.itemId);
                if (gig) {
                    score = artistData.popularity + (gig.basePay / 10000);
                    coverArt = gig.imageUrl;
                }
            } else if (["Best TV Show", "Best Movie"].includes(categoryName)) {
                const gig = artistData.gigs.find(g => g.id === sub.itemId);
                if (gig) {
                    score = artistData.popularity + (gig.basePay / 5000);
                    coverArt = gig.imageUrl;
                }
            } else if (categoryName === "Best Soundtrack") {
                 const release = artistData.releases.find(r => r.id === sub.itemId);
                 if (release) {
                     score = (release.firstWeekStreams || 0) / 100000 + artistData.popularity;
                     coverArt = release.coverArt;
                 }
            } else if (categoryName === "Best Original Song") {
                 const song = artistData.songs.find(s => s.id === sub.itemId);
                 if (song) {
                     score = song.quality * 2 + (song.firstWeekStreams || 0) / 25000;
                     coverArt = song.coverArt;
                 }
            }

            contenders.push({
                id: sub.itemId,
                name: sub.itemName,
                artistName: artistProfile.name,
                isPlayer: true,
                score,
                coverArt
            });
          }

          // Add some NPC contenders
          for (let i = 0; i < 4; i++) {
             const npcName = getRandomNpcName(state.npcs.map((n) => n.name), newDate.year);
             contenders.push({
                 id: "npc-" + Math.random(),
                 name: categoryName.includes("Song") || categoryName.includes("Soundtrack") ? "NPC Project" : "NPC Film/Show",
                 artistName: npcName,
                 isPlayer: false,
                 score: Math.random() * 100 + 50,
                 coverArt: \`https://ui-avatars.com/api/?name=\${encodeURIComponent(npcName)}&background=random&color=fff&size=250\`
             });
          }

          const topNominees = contenders.sort((a, b) => b.score - a.score).slice(0, 5);
          newNominations.push({
             name: categoryName,
             nominees: topNominees
          });
        }
        
        newGoldenGlobeNominations = newNominations;
        finalState.goldenGlobeCurrentYearNominations = newNominations;

        const majorCatsForPosts: GoldenGlobeAward["category"][] = ["Best Actor/Actress", "Best Movie", "Best Original Song"];
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
          let gotNominated = false;
          const nominatedCategories: string[] = [];

          for (const category of newNominations) {
            const isNominated = category.nominees.some(
              (n) => n.isPlayer && n.artistName === artistProfile?.name,
            );
            if (isNominated) {
              gotNominated = true;
              nominatedCategories.push(category.name);
            }
          }

          if (gotNominated) {
             artistData.hype = Math.min(100, artistData.hype + 5);
             artistData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: artistProfile!.id,
                content: \`Honored to be nominated for \${nominatedCategories.length} Golden Globe\${nominatedCategories.length > 1 ? 's' : ''}! Thank you HFPA! 🥂🌍\`,
                likes: Math.floor(Math.random() * 500000) + 100000,
                retweets: Math.floor(Math.random() * 50000) + 10000,
                views: Math.floor(Math.random() * 5000000) + 1000000,
                date: newDate,
             });
          }
        }
      }

      // Week 20: Golden Globes Ceremony
      if (newDate.week === 20 && state.goldenGlobeCurrentYearNominations) {
        for (const category of state.goldenGlobeCurrentYearNominations) {
           const winner = category.nominees.sort((a, b) => b.score - a.score)[0];
           category.winner = winner;

           if (winner.isPlayer) {
              const content = \`Hollywood Foreign Press Association 🌍\n\nCongrats \${category.name} winner - '\${winner.name}' @\${winner.artistName.replace(/\\s/g, "")} #GoldenGlobes\`;
              Object.values(updatedArtistsData).forEach((d) =>
                d.xPosts.unshift({
                  id: crypto.randomUUID(),
                  authorId: "popbase",
                  content,
                  image: winner.coverArt,
                  likes: Math.floor(Math.random() * 40000) + 15000,
                  retweets: Math.floor(Math.random() * 10000) + 5000,
                  views: Math.floor(Math.random() * 2000000) + 1000000,
                  date: newDate,
                }),
              );
           }
        }

        for (const artistId in updatedArtistsData) {
            const artistData = updatedArtistsData[artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
            
            for (const category of state.goldenGlobeCurrentYearNominations) {
               const nomination = category.nominees.find(n => n.isPlayer && n.artistName === artistProfile?.name);
               if (nomination) {
                   const isWinner = category.winner?.id === nomination.id && category.winner?.artistName === nomination.artistName;
                   if (isWinner) {
                       artistData.popularity = Math.min(100, artistData.popularity + 5);
                   }
                   artistData.goldenGlobeHistory.push({
                      year: newDate.year,
                      category: category.name,
                      itemId: nomination.id,
                      itemName: nomination.name,
                      artistName: artistProfile?.name || "Unknown",
                      isWinner
                   });
               }
            }
        }
        finalState.goldenGlobeSubmissions = [];
        finalState.goldenGlobeCurrentYearNominations = null;
      }
`;

if (!content.includes('// --- GOLDEN GLOBES LOGIC ---')) {
    content = content.replace('// --- OSCARS LOGIC ---', globesLogic + '\n      // --- OSCARS LOGIC ---');
}

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Patched globes logic loop");
