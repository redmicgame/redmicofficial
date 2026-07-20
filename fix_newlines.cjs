const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

content = content.replace(/\\n          Object\.values/g, "\n          Object.values");
content = content.replace(/\\n            d\.xPosts/g, "\n            d.xPosts");
content = content.replace(/\\n              id:/g, "\n              id:");
content = content.replace(/\\n              authorId:/g, "\n              authorId:");
content = content.replace(/\\n              content,/g, "\n              content,");
content = content.replace(/\\n              image:/g, "\n              image:");

content = content.replace(/\\n            Object\.values/g, "\n            Object.values");
content = content.replace(/\\n                id:/g, "\n                id:");

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed literal newlines");
