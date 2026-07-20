const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// fix length > 0
content = content.replace(/state\.goldenGlobeSubmissions\.length > 0/g, "(state.goldenGlobeSubmissions?.length || 0) > 0");
content = content.replace(/state\.oscarSubmissions\.length > 0/g, "(state.oscarSubmissions?.length || 0) > 0");

// fix filter
content = content.replace(/state\.goldenGlobeSubmissions\.filter/g, "(state.goldenGlobeSubmissions || []).filter");
content = content.replace(/for \(const sub of state\.oscarSubmissions\)/g, "for (const sub of (state.oscarSubmissions || []))");

// fix spread
content = content.replace(/\.\.\.state\.goldenGlobeSubmissions/g, "...(state.goldenGlobeSubmissions || [])");
content = content.replace(/\.\.\.state\.oscarSubmissions/g, "...(state.oscarSubmissions || [])");

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed undefined submissions");
