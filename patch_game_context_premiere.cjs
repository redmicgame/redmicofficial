const fs = require('fs');
let file = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        if (!state.activeMoviePremiereOffer) return state;
        
        if (lookUrl) {
            const activeData = state.artistsData[state.activeArtistId];
            const artistName = state.soloArtist?.name || state.group?.name;
            const title = state.activeMoviePremiereOffer.roleTitle;
            
            const locations = ["New York City", "Los Angeles", "Paris", "Dubai", "London", "Tokyo"];
            const loc = locations[Math.floor(Math.random() * locations.length)];
            
            const popBasePost = {`;

const replacement = `        if (!state.activeMoviePremiereOffer) return state;
        
        if (lookUrl) {
            const activeData = state.artistsData[state.activeArtistId];
            const artistName = state.soloArtist?.name || state.group?.name;
            const title = state.activeMoviePremiereOffer.roleTitle;
            
            const loc = action.payload.location || "Los Angeles";
            
            const popBasePost = {`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched GameContext.tsx');
