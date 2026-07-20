const fs = require('fs');

let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const target = `             artistData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: artistProfile!.id,
                content: \`Honored to be nominated for \${nominatedCategories.length} Golden Globe\${nominatedCategories.length > 1 ? 's' : ''}! Thank you HFPA! 🥂🌍\`,
                likes: Math.floor(Math.random() * 500000) + 100000,
                retweets: Math.floor(Math.random() * 50000) + 10000,
                views: Math.floor(Math.random() * 5000000) + 1000000,
                date: newDate,
             });
          }`;

const replacement = `             artistData.xPosts.unshift({
                id: crypto.randomUUID(),
                authorId: artistProfile!.id,
                content: \`Honored to be nominated for \${nominatedCategories.length} Golden Globe\${nominatedCategories.length > 1 ? 's' : ''}! Thank you HFPA! 🥂🌍\`,
                likes: Math.floor(Math.random() * 500000) + 100000,
                retweets: Math.floor(Math.random() * 50000) + 10000,
                views: Math.floor(Math.random() * 5000000) + 1000000,
                date: newDate,
             });
             
             // Also invite to red carpet
             const carpetEmailId = crypto.randomUUID();
             artistData.inbox.unshift({
                id: carpetEmailId,
                sender: "Hollywood Foreign Press Association",
                subject: "Invitation: Golden Globes Red Carpet",
                body: \`Dear \${artistProfile.name},

Congratulations on your nomination. We would be honored to have you attend the \${newDate.year} Golden Globes and walk the red carpet.

Please accept this invitation by sharing your look for the evening.

Sincerely,
HFPA\`,
                date: newDate,
                isRead: false,
                offer: { type: "goldenGlobeRedCarpet", emailId: carpetEmailId },
             });
          }`;

contextContent = contextContent.replace(target, replacement);

fs.writeFileSync(contextFile, contextContent);
console.log("Patched golden globes red carpet");
