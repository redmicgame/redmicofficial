const fs = require('fs');
let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(liveSongs\.length === 0\) \{[\s\S]*?dispatch\(\{ type: 'CHANGE_VIEW', payload: 'game' \}\);/m;
const replacement = `if (liveSongs.length === 0) {
            setError("No valid songs found in the tour setlist.");
            return;
        }

        const totalCost = liveSongs.length * selectedStudio.cost;
        if (money < totalCost) {
            setError("Not enough money to record all live tracks at this studio.");
            return;
        }

        for (const song of liveSongs) {
            // Apply studio quality bonus
            const qualityBonus = Math.floor(Math.random() * (selectedStudio.maxQuality - selectedStudio.minQuality + 1)) + selectedStudio.minQuality;
            song.quality = Math.min(100, Math.max(1, song.quality + Math.floor(qualityBonus / 2))); // slightly lower boost than normal studio
            
            dispatch({ type: 'RECORD_SONG', payload: { song, cost: selectedStudio.cost } });
        }
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log('Patched handleLiveAlbum logic');
