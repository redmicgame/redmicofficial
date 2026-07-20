const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// Fix joins
content = content.replace(/\.join\("\n"\)/g, '.join("\\n")');

// Fix "New music out tonight:
content = content.replace(
    /"New music out tonight:\n\n" \+/g,
    '"New music out tonight:\\n\\n" +'
);

// Any other unterminated double quote strings?
// Let's use a regex to find them. Wait, since I can just look at the build error...

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed some strings");
