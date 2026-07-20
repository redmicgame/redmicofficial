const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const goldenGlobesEmail = `      // Week 12: Golden Globe Submissions
      if (newDate.week === 12) {
        for (const artistId in updatedArtistsData) {
          const artistData = updatedArtistsData[artistId];
          const hasEligibleRoles = (artistData.actingRoles && artistData.actingRoles.length > 0) || (artistData.songs && artistData.songs.some(s => s.soundtrackTitle)) || (artistData.releases && artistData.releases.some(r => r.soundtrackInfo));
          if (hasEligibleRoles) {
              const emailId = crypto.randomUUID();
              artistData.inbox.unshift({
                id: emailId,
                sender: "Hollywood Foreign Press Association",
                subject: "Golden Globe Submissions Now Open",
                body: "The HFPA is now accepting submissions for the upcoming Golden Globe Awards. Please submit your eligible film and television work for consideration.",
                date: newDate,
                isRead: false,
                offer: {
                  type: "goldenGlobeSubmission",
                  emailId,
                },
              });
          }
        }
      }

      // Week 12: Coachella Selection`;

if (!content.includes('Week 12: Golden Globe Submissions')) {
    content = content.replace('      // Week 12: Coachella Selection', goldenGlobesEmail);
    fs.writeFileSync('context/GameContext.tsx', content);
    console.log("Patched Golden Globe Emails");
}
