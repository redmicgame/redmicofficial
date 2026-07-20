const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const globesNomsEmail = `          if (gotNominated) {
             artistData.hype = Math.min(100, artistData.hype + 5);
             const emailId = crypto.randomUUID();
             artistData.inbox.unshift({
               id: emailId,
               sender: "Hollywood Foreign Press Association",
               subject: "Congratulations! You're a Golden Globe Nominee!",
               body: \`Congratulations! You have been nominated for \${nominatedCategories.length} Golden Globe\${nominatedCategories.length > 1 ? 's' : ''}! We invite you to attend the ceremony in week 20.\`,
               date: newDate,
               isRead: false,
               offer: {
                 type: "goldenGlobeNominations",
                 emailId,
               },
             });
             artistData.xPosts.unshift({`;

if (content.includes('          if (gotNominated) {\n             artistData.hype = Math.min(100, artistData.hype + 5);\n             artistData.xPosts.unshift({')) {
    content = content.replace('          if (gotNominated) {\n             artistData.hype = Math.min(100, artistData.hype + 5);\n             artistData.xPosts.unshift({', globesNomsEmail);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Patched Golden Globes Nominations Email");
}
