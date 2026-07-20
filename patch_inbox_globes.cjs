const fs = require('fs');

let file = '/app/applet/components/InboxView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `            case 'oscarRedCarpet':
                dispatch({ type: 'ACCEPT_OSCAR_RED_CARPET_INVITE', payload: { emailId: email.id } });
                break;`;
const replacement1 = `            case 'oscarRedCarpet':
                dispatch({ type: 'ACCEPT_OSCAR_RED_CARPET_INVITE', payload: { emailId: email.id } });
                break;
            case 'goldenGlobeRedCarpet':
                dispatch({ type: 'ACCEPT_GOLDEN_GLOBE_RED_CARPET_INVITE', payload: { emailId: email.id } });
                break;`;

content = content.replace(target1, replacement1);

const target2 = `            case 'oscarRedCarpet':
                buttonText = "Attend Red Carpet";
                buttonClass = "bg-[#d4af37] hover:bg-[#b5952f] text-black shadow-yellow-500/20";
                acceptedText = "Attending Red Carpet";
                isAccepted = email.offer.isAccepted;
                break;`;
const replacement2 = `            case 'oscarRedCarpet':
                buttonText = "Attend Red Carpet";
                buttonClass = "bg-[#d4af37] hover:bg-[#b5952f] text-black shadow-yellow-500/20";
                acceptedText = "Attending Red Carpet";
                isAccepted = email.offer.isAccepted;
                break;
            case 'goldenGlobeRedCarpet':
                buttonText = "Attend Red Carpet";
                buttonClass = "bg-[#d4af37] hover:bg-[#b5952f] text-black shadow-yellow-500/20";
                acceptedText = "Attending Red Carpet";
                isAccepted = email.offer.isAccepted;
                break;`;

content = content.replace(target2, replacement2);
fs.writeFileSync(file, content);
console.log("Patched inbox view");
