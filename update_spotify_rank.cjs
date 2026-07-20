const fs = require('fs');

const file_path = '/app/applet/components/SpotifyView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const newRankLogic = `const TOP_100_LISTENERS = [
  131300000, 124500000, 114100000, 113400000, 110900000, 103500000, 102400000, 102200000, 94700000, 94200000, 
  92100000, 91900000, 91100000, 88000000, 87500000, 83300000, 81000000, 79400000, 78300000, 78100000, 
  76900000, 75800000, 74900000, 73800000, 72600000, 71800000, 70900000, 69800000, 68900000, 67800000, 
  66900000, 66100000, 65400000, 64700000, 64000000, 63400000, 62800000, 62200000, 61600000, 61000000, 
  60500000, 59900000, 59300000, 58800000, 58200000, 57700000, 57200000, 56700000, 56200000, 55700000, 
  55200000, 54800000, 54300000, 53900000, 53500000, 53000000, 52600000, 52200000, 51800000, 51400000, 
  51000000, 50600000, 50200000, 49800000, 49400000, 49000000, 48700000, 48300000, 47900000, 47500000, 
  47100000, 46700000, 46300000, 45900000, 45500000, 45100000, 44700000, 44300000, 43900000, 43500000, 
  43100000, 42700000, 42300000, 41900000, 41500000, 41100000, 40700000, 40300000, 39900000, 39500000, 
  39100000, 38700000, 38300000, 37900000, 37500000, 37100000, 36700000, 36300000, 35900000, 35500000
];

const getSpotifyRank = (listeners: number) => {
    for (let i = 0; i < TOP_100_LISTENERS.length; i++) {
        if (listeners >= TOP_100_LISTENERS[i]) {
            return i + 1;
        }
    }
    
    if (listeners < 15000000) return null;
    
    const rank = 100 + Math.round(100 * (1 - (listeners - 15000000) / (35500000 - 15000000)));
    return Math.max(101, Math.min(200, rank));
};`;

const oldLogic = `const getSpotifyRank = (listeners: number) => {
    if (listeners < 30000000) return null;
    if (listeners >= 148000000) return 1;
    const rank = Math.round(200 - ((listeners - 30000000) / (118000000 / 199)));
    return Math.max(1, Math.min(200, rank));
};`;

if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newRankLogic);
    fs.writeFileSync(file_path, content);
    console.log("Updated SpotifyView.tsx");
} else {
    console.log("Could not find the old logic in SpotifyView.tsx");
}
