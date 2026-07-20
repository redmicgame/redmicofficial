const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

content = content.replace(/state\.grammySubmissions\.length > 0/g, "(state.grammySubmissions?.length || 0) > 0");
content = content.replace(/state\.grammySubmissions\.filter/g, "(state.grammySubmissions || []).filter");
content = content.replace(/\.\.\.state\.grammySubmissions/g, "...(state.grammySubmissions || [])");
content = content.replace(/\.\.\.finalState\.grammySubmissions/g, "...(finalState.grammySubmissions || [])");

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed undefined grammy submissions");
