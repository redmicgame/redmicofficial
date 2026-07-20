const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('"createFifaWorldCup"')) {
    content = content.replace(
        /\| "createSoundtrack"/,
        '| "createSoundtrack"\n  | "createFifaWorldCup"'
    );
    fs.writeFileSync('types.ts', content);
    console.log("Added createFifaWorldCup to GameView");
} else {
    console.log("Already present");
}
