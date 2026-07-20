const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const newEncounters = `
    {
      id: "lawsuit_copyright",
      text: "You are being sued by an underground artist who claims you stole their melody for your latest hit. They are demanding a massive payout.",
      requiresImage: false,
      choices: [
        {
          label: "Settle out of court ($2M)",
          tweetTemplate: "{artist} settles copyright lawsuit out of court for $2M. GUILTY much? ☕",
          authorName: "Pop Crave",
          isTMZ: false,
          publicImageEffect: -2,
          hypeEffect: 1,
          moneyEffect: -2000000
        },
        {
          label: "Fight in court (50% chance to lose $5M)",
          tweetTemplate: "{artist} refuses to settle and goes to trial over copyright claim!",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: 3,
          hypeEffect: 5,
          // We will handle the money effect in the component or just make a safe assumption
          moneyEffect: Math.random() > 0.5 ? -5000000 : -100000
        }
      ]
    },
    {
      id: "lawsuit_fan_war",
      text: "A rival artist's fan is suing you because your fan base relentlessly bullied and doxxed them after a subtle shade tweet you made.",
      requiresImage: false,
      choices: [
        {
          label: "Pay their legal fees & apologize ($500k)",
          tweetTemplate: "{artist} apologizes for toxic fans and pays victim's legal fees. Respect.",
          authorName: "Pop Base",
          isTMZ: false,
          publicImageEffect: 5,
          hypeEffect: -2,
          moneyEffect: -500000
        },
        {
          label: "Countersue for defamation ($1M)",
          tweetTemplate: "{artist} is COUNTERSUING the fan who sued them! This is getting messy 😭",
          authorName: "TMZ",
          isTMZ: true,
          publicImageEffect: -8,
          hypeEffect: 10,
          moneyEffect: -1000000
        }
      ]
    },
`;

const isMarriedLogic = `
  if (isMarried) {
    encounters.push(
      {
        id: "lawsuit_divorce",
        text: "Your spouse has filed for DIVORCE! They are demanding a massive settlement and it's all over the tabloids.",
        requiresImage: false,
        choices: [
          {
            label: "Sign the papers ($5M)",
            tweetTemplate: "{artist} officially divorces! The settlement was MASSIVE 💔",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -5,
            hypeEffect: 15,
            moneyEffect: -5000000
          },
          {
            label: "Fight for assets ($2M legal fees)",
            tweetTemplate: "{artist} is fighting their ex in court! The divorce is getting UGLY.",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -10,
            hypeEffect: 20,
            moneyEffect: -2000000
          }
        ]
      },
      {
        id: "lawsuit_annulment",
        text: "Your spouse is filing for an ANNULMENT! They claim the marriage was a sham and want monthly compensation.",
        requiresImage: false,
        choices: [
          {
            label: "Grant annulment ($50k/month)",
            tweetTemplate: "{artist}'s marriage annulled! Rumor has it they are paying a monthly fee...",
            authorName: "Pop Crave",
            isTMZ: false,
            publicImageEffect: -2,
            hypeEffect: 5,
            moneyEffect: 0
          },
          {
            label: "Deny and drag it out ($1M)",
            tweetTemplate: "{artist} denies annulment request, forcing a messy public trial!",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -8,
            hypeEffect: 12,
            moneyEffect: -1000000
          }
        ]
      }
    );
  }

  const hasExes = artistData.relationships?.some(r => r.status === "ex");
  if (hasExes) {
    encounters.push(
      {
        id: "lawsuit_child_support",
        text: "Your ex is suing you for CHILD SUPPORT! They are demanding a hefty monthly payment.",
        requiresImage: false,
        choices: [
          {
            label: "Agree to pay ($25k/month)",
            tweetTemplate: "{artist} agrees to pay child support. A responsible parent! 🍼",
            authorName: "Pop Base",
            isTMZ: false,
            publicImageEffect: 5,
            hypeEffect: 0,
            moneyEffect: 0
          },
          {
            label: "Fight the claim ($500k)",
            tweetTemplate: "{artist} is fighting their ex over child support... not a good look 😬",
            authorName: "TMZ",
            isTMZ: true,
            publicImageEffect: -15,
            hypeEffect: 5,
            moneyEffect: -500000
          }
        ]
      }
    );
  }
`;

content = content.replace(
    '  const encounters: ActiveEncounter[] = [',
    '  const encounters: ActiveEncounter[] = [\n' + newEncounters
);

content = content.replace(
    '  if (isGroup) {',
    isMarriedLogic + '\n  if (isGroup) {'
);

fs.writeFileSync('context/GameContext.tsx', content);
