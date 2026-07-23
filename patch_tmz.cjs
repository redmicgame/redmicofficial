const fs = require('fs');
let content = fs.readFileSync('/app/applet/context/GameContext.tsx', 'utf8');

const targetStr = `      if (tourArrestEncounter && !finalState.disableEncounters) {`;
const replacementStr = `      // --- DYNAMIC TMZ RELATIONSHIP & GOSSIP POSTS ---
      for (const artistId in updatedArtistsData) {
        const aData = updatedArtistsData[artistId];
        const aProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
        if (!aProfile) continue;
        
        const isFemale = aProfile.pronouns === "she/her";
        
        // 2% chance per week per artist for a juicy TMZ event if they have relationships
        if (aData.relationships && aData.relationships.length > 0 && Math.random() < 0.02) {
           const activeRels = aData.relationships.filter(r => r.status === "dating" || r.status === "engaged" || r.status === "married");
           const marriedRels = aData.relationships.filter(r => r.status === "married");
           const exRels = aData.relationships.filter(r => r.status === "ex");
           const kids = aData.kids || [];
           
           const possibleEvents = [];
           
           if (kids.length > 0 && newDate.week >= 15 && newDate.week <= 17) {
               possibleEvents.push("coachella_kids");
           }
           if (exRels.length > 0) {
               possibleEvents.push("ex_thinking");
               possibleEvents.push("reignite_ex");
           }
           if (activeRels.length > 0) {
               possibleEvents.push("cheated");
               if (isFemale) possibleEvents.push("cheated_pregnant");
           }
           if (activeRels.length > 0 && kids.length > 0) {
               possibleEvents.push("expecting_baby");
           }
           
           if (possibleEvents.length > 0) {
               const ev = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
               let tmzContent = "";
               
               if (ev === "coachella_kids") {
                   const kid = kids[Math.floor(Math.random() * kids.length)];
                   tmzContent = \`\${kid.name} Turns Coachella Into Their Own Meet and Greet. tmz.me/\${crypto.randomUUID().substring(0,6)}\`;
               } else if (ev === "ex_thinking") {
                   const ex = exRels[Math.floor(Math.random() * exRels.length)];
                   tmzContent = \`😬 EXCLUSIVE: \${aProfile.name}'s ex \${ex.partnerName} thought they were still in a relationship. tmz.com/\${newDate.year}/\${newDate.week}/ex\`;
               } else if (ev === "reignite_ex") {
                   const ex = exRels[Math.floor(Math.random() * exRels.length)];
                   tmzContent = \`🩷 \${aProfile.name} reignites romance with ex \${ex.partnerName}! tmz.com/\${newDate.year}/\${newDate.week}/\${aProfile.name.toLowerCase().replace(/\\s/g, "")}\`;
               } else if (ev === "cheated") {
                   const rel = activeRels[Math.floor(Math.random() * activeRels.length)];
                   tmzContent = \`\${aProfile.name} was brazenly cheating on \${rel.partnerName} with not one but two people. #TMZ\`;
               } else if (ev === "cheated_pregnant") {
                   const rel = activeRels[Math.floor(Math.random() * activeRels.length)];
                   tmzContent = \`\${rel.partnerName} was brazenly cheating on a pregnant \${aProfile.name} with not one but two women. #TMZ\`;
               } else if (ev === "expecting_baby") {
                   const rel = activeRels[Math.floor(Math.random() * activeRels.length)];
                   const sharedKids = kids.filter(k => k.parentName === rel.partnerName).length;
                   if (sharedKids > 0) {
                      tmzContent = \`\${aProfile.name} Pregnant, Expecting Baby Number \${sharedKids + 1} with \${rel.partnerName}.\`;
                   } else {
                      tmzContent = \`\${aProfile.name} Pregnant, Expecting Baby with \${rel.partnerName}.\`;
                   }
               }
               
               if (tmzContent) {
                   const newTmzPost = {
                       id: crypto.randomUUID(),
                       authorId: "tmz",
                       content: tmzContent,
                       likes: Math.floor(Math.random() * 50000) + 10000,
                       retweets: Math.floor(Math.random() * 10000) + 2000,
                       views: Math.floor(Math.random() * 2000000) + 500000,
                       date: newDate,
                   };
                   aData.xPosts.unshift(newTmzPost);
               }
           }
        }
      }
      // --- END TMZ LOGIC ---

      if (tourArrestEncounter && !finalState.disableEncounters) {`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('/app/applet/context/GameContext.tsx', content);
console.log("TMZ Tweets Patched.");
