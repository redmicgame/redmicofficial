const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const fifaLogic = `
        // --- FIFA WORLD CUP LOGIC ---
        if (newDate.year % 4 === 2 && newDate.week === 20 && artistProfileForEmail) {
          const emailId = crypto.randomUUID();
          
          // Select 1 or 2 random npcs
          const allNpcs = state.npcs || [];
          const numCollabs = Math.random() > 0.5 ? 2 : 1;
          const collabs = [];
          for (let i = 0; i < numCollabs; i++) {
              const randomNpc = allNpcs[Math.floor(Math.random() * allNpcs.length)];
              if (randomNpc) collabs.push(randomNpc.artist);
          }
          
          newEmails.push({
            id: emailId,
            sender: "FIFA Sound",
            senderIcon: "soundtrack",
            subject: \`Invitation: Official FIFA World Cup \${newDate.year} Soundtrack\`,
            body: \`Hello \${artistProfileForEmail.name},\\n\\nWe are thrilled to invite you to be a lead artist on a featured track for the upcoming Official FIFA World Cup \${newDate.year} Soundtrack!\\n\\nWe envision this as a powerful collaboration and would like to pair you with \${collabs.join(" and ")}.\\n\\nIf you accept, you will need to provide the song title and cover art, and the single will drop on week 23, building hype before the full soundtrack release on week 25.\\n\\nPlease let us know if you accept.\\n\\nBest,\\nFIFA Sound\`,
            date: newDate,
            isRead: false,
            offer: {
              type: "fifaWorldCupOffer",
              emailId: emailId,
              isAccepted: false,
              collabs
            },
          });
        }
`;

content = content.replace(
  /\/\/ --- VOGUE OFFER LOGIC ---/,
  fifaLogic + '\n        // --- VOGUE OFFER LOGIC ---'
);

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Added FIFA offer logic");
