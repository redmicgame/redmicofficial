const fs = require('fs');
let content = fs.readFileSync('components/AppsTab.tsx', 'utf-8');

if (!content.includes("view: 'goldenGlobes'")) {
    content = content.replace(
        "{ name: 'Oscars', description: 'Your film awards history', icon: <OscarAwardIcon className=\"w-8 h-8\" />, view: 'oscars', bgColor: '#c7a34a' },",
        "{ name: 'Oscars', description: 'Your film awards history', icon: <OscarAwardIcon className=\"w-8 h-8\" />, view: 'oscars', bgColor: '#c7a34a' },\n            { name: 'Golden Globes', description: 'Your TV & film awards history', icon: <TrophyIcon className=\"w-8 h-8\" />, view: 'goldenGlobes', bgColor: '#d97706' },"
    );
    fs.writeFileSync('components/AppsTab.tsx', content);
    console.log("Patched apps tab");
}
