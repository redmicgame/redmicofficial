const fs = require('fs');
let content = fs.readFileSync('components/InboxView.tsx', 'utf-8');

if (!content.includes("'fifaWorldCupOffer'")) {
    content = content.replace(
        /case 'soundtrackOffer':\n                setShowSoundtrackConfirm\(true\);\n                break;/,
        "case 'soundtrackOffer':\n                setShowSoundtrackConfirm(true);\n                break;\n            case 'fifaWorldCupOffer':\n                dispatch({ type: 'ACCEPT_FIFA_OFFER', payload: { emailId: email.id, collabs: email.offer.collabs }});\n                break;"
    );

    content = content.replace(
        /case 'soundtrackOffer':\n                buttonText = `Contribute to "\$\{email.offer.albumTitle\}"`;/,
        "case 'fifaWorldCupOffer':\n                buttonText = 'Accept FIFA Offer';\n                buttonClass = 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20';\n                acceptedText = 'Offer Accepted';\n                isAccepted = email.offer.isAccepted;\n                break;\n            case 'soundtrackOffer':\n                buttonText = `Contribute to \"\${email.offer.albumTitle}\"`;"
    );

    fs.writeFileSync('components/InboxView.tsx', content);
    console.log("Updated InboxView with fifaWorldCupOffer");
} else {
    console.log("Already updated InboxView");
}
