const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const target = `      for (const artistId in updatedArtistsData) {
        const artistData = updatedArtistsData[artistId];
        const startingMoneyForWeek = artistData.money;`;

const replacement = `      for (const artistId in updatedArtistsData) {
        const artistData = updatedArtistsData[artistId];
        let startingMoneyForWeek = artistData.money;
        
        // Deduct recurring expenses
        if (artistData.recurringExpenses) {
            let totalDeducted = 0;
            artistData.recurringExpenses.forEach(exp => {
                if (exp.type === 'weekly') {
                    totalDeducted += exp.cost;
                } else if (exp.type === 'monthly' && newDate.week % 4 === 0) {
                    totalDeducted += exp.cost;
                }
            });
            artistData.money -= totalDeducted;
            startingMoneyForWeek = artistData.money;
        }`;

content = content.replace(target, replacement);
fs.writeFileSync('context/GameContext.tsx', content);
