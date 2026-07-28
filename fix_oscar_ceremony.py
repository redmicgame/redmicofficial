import re
with open('context/GameContext.tsx', 'r') as f:
    content = f.read()

pattern2 = r'''      // Week 10: Oscar Ceremony
      if \(newDate\.week === 10 && state\.oscarCurrentYearNominations\) \{
        const category = state\.oscarCurrentYearNominations\[0\];
        if \(category\.winner\) \{
          const winner = category\.winner;
          const content = `The Oscar for Best Original Song goes to\.\.\. "\$\{winner\.name\}" by \$\{winner\.artistName\}! #Oscars`;
          Object\.values\(updatedArtistsData\)\.forEach\(\(d\) =>
            d\.xPosts\.unshift\(\{
              id: crypto\.randomUUID\(\),
              authorId: "popbase",
              content,
              image: winner\.coverArt,
              likes: Math\.floor\(Math\.random\(\) \* 100000\) \+ 50000,
              retweets: Math\.floor\(Math\.random\(\) \* 20000\) \+ 10000,
              views: Math\.floor\(Math\.random\(\) \* 5000000\) \+ 2000000,
              date: newDate,
            \}\),
          \);
        \}

        for \(const artistId in updatedArtistsData\) \{
          const artistData = updatedArtistsData\[artistId\];
          const artistProfile = allPlayerArtistsAndGroups\.find\(
            \(a\) => a\.id === artistId,
          \);
          const nomination = category\.nominees\.find\(
            \(n\) => n\.isPlayer && n\.artistName === artistProfile\?\.name,
          \);
          if \(nomination\) \{
            const isWinner = category\.winner\?\.id === nomination\.id;
            if \(isWinner\)
              artistData\.popularity = Math\.min\(100, artistData\.popularity \+ 10\);

            artistData\.oscarHistory\.push\(\{
              year: newDate\.year,
              category: "Best Original Song",
              itemId: nomination\.id,
              itemName: nomination\.name,
              artistName: nomination\.artistName,
              isWinner,
            \}\);
          \}
        \}

        finalState\.oscarSubmissions = \[\];
        finalState\.oscarCurrentYearNominations = null;
      \}'''

replacement2 = '''      // Week 10: Oscar Ceremony
      if (newDate.week === 10 && state.oscarCurrentYearNominations) {
        for (const category of state.oscarCurrentYearNominations) {
            const winner = category.nominees.sort((a, b) => b.score - a.score)[0];
            category.winner = winner;
            
            const content = `The Oscar for ${category.name} goes to... "${winner.name}" by ${winner.artistName}! #Oscars`;
            Object.values(updatedArtistsData).forEach((d) =>
              d.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: "popbase",
                content,
                image: winner.coverArt,
                likes: Math.floor(Math.random() * 100000) + 50000,
                retweets: Math.floor(Math.random() * 20000) + 10000,
                views: Math.floor(Math.random() * 5000000) + 2000000,
                date: newDate,
              }),
            );
        }

        for (const artistId in updatedArtistsData) {
            const artistData = updatedArtistsData[artistId];
            const artistProfile = allPlayerArtistsAndGroups.find((a) => a.id === artistId);
            
            for (const category of state.oscarCurrentYearNominations) {
                const nomination = category.nominees.find(n => n.isPlayer && n.artistName === artistProfile?.name);
                if (nomination) {
                    const isWinner = category.winner?.id === nomination.id;
                    if (isWinner) {
                        artistData.popularity = Math.min(100, artistData.popularity + 10);
                    }
                    artistData.oscarHistory.push({
                        year: newDate.year,
                        category: category.name,
                        itemId: nomination.id,
                        itemName: nomination.name,
                        artistName: nomination.artistName,
                        isWinner,
                    });
                }
            }
        }

        finalState.oscarSubmissions = [];
        finalState.oscarCurrentYearNominations = null;
      }'''

content = re.sub(pattern2, replacement2, content)
with open('context/GameContext.tsx', 'w') as f:
    f.write(content)
