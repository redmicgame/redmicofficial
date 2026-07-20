const fs = require('fs');

// Patch InboxView
let inboxContent = fs.readFileSync('components/InboxView.tsx', 'utf-8');
if (!inboxContent.includes('goldenGlobeSubmission')) {
    inboxContent = inboxContent.replace("case 'oscarSubmission':", "case 'goldenGlobeSubmission':\n                dispatch({ type: 'GO_TO_GOLDEN_GLOBE_SUBMISSIONS', payload: { emailId: email.id } });\n                break;\n            case 'oscarSubmission':");
    inboxContent = inboxContent.replace("case 'oscarSubmission':\n                buttonText = \"Submit For Oscars\";", "case 'goldenGlobeSubmission':\n                buttonText = \"Submit For Golden Globes\";\n                buttonClass = \"bg-amber-400 hover:bg-amber-500 text-black shadow-amber-400/20\";\n                acceptedText = \"Submissions Sent\";\n                isAccepted = email.offer.isSubmitted;\n                break;\n            case 'oscarSubmission':\n                buttonText = \"Submit For Oscars\";");
    fs.writeFileSync('components/InboxView.tsx', inboxContent);
    console.log("Patched InboxView");
}

// Patch GameContext
let gameContext = fs.readFileSync('context/GameContext.tsx', 'utf-8');
if (!gameContext.includes('GO_TO_GOLDEN_GLOBE_SUBMISSIONS')) {
    const actionType = `| { type: "GO_TO_GOLDEN_GLOBE_SUBMISSIONS"; payload: { emailId: string } }`;
    gameContext = gameContext.replace('type: "GO_TO_OSCAR_SUBMISSIONS"', actionType + '\n  | { type: "GO_TO_OSCAR_SUBMISSIONS"');
    
    const reducerCase = `
    case "GO_TO_GOLDEN_GLOBE_SUBMISSIONS":
      return {
        ...state,
        currentView: "submit_for_golden_globes",
      };
`;
    gameContext = gameContext.replace('case "GO_TO_OSCAR_SUBMISSIONS":', reducerCase + '\n    case "GO_TO_OSCAR_SUBMISSIONS":');
    fs.writeFileSync('context/GameContext.tsx', gameContext);
    console.log("Patched GameContext for GO_TO_GOLDEN_GLOBE_SUBMISSIONS");
}
