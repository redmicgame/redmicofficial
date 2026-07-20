const fs = require('fs');
let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const target = `            if (eligibleSongs.length > 0) {
              const emailId = crypto.randomUUID();
              artistData.inbox.push({
                id: emailId,
                sender: "The Academy",
                senderIcon: "oscars",
                subject: \`Submit for the \${newDate.year} Academy Awards\`,
                body: \`Hi \${artistProfile.name},

The submission window for the \${newDate.year} Academy Awards is open. Please submit your eligible soundtrack releases and acting roles from last year.

Sincerely,
The Academy\`,
                date: newDate,
                isRead: false,
                offer: { type: "oscarSubmission", emailId, isSubmitted: false },
              });
            }`;

const replacement = `            const eligibleRoles = (artistData.actingRoles || []).filter(r => r.year === newDate.year - 1);
            if (eligibleSongs.length > 0 || eligibleRoles.length > 0) {
              const emailId = crypto.randomUUID();
              artistData.inbox.push({
                id: emailId,
                sender: "The Academy",
                senderIcon: "oscars",
                subject: \`Submit for the \${newDate.year} Academy Awards\`,
                body: \`Hi \${artistProfile.name},

The submission window for the \${newDate.year} Academy Awards is open. Please submit your eligible soundtrack releases and acting roles from last year.

Sincerely,
The Academy\`,
                date: newDate,
                isRead: false,
                offer: { type: "oscarSubmission", emailId, isSubmitted: false },
              });
            }`;

contextContent = contextContent.replace(target, replacement);
fs.writeFileSync(contextFile, contextContent);
console.log("Patched oscar submission email condition");
