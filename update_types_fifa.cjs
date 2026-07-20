const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('FifaWorldCupOffer')) {
  content = content.replace(
    /export interface SoundtrackOffer \{/,
    `export interface FifaWorldCupOffer {
  type: "fifaWorldCupOffer";
  emailId: string;
  isAccepted: boolean;
  collabs: string[];
}

export interface SoundtrackOffer {`
  );
  
  content = content.replace(
    /\| SoundtrackOffer/,
    '| SoundtrackOffer\n    | FifaWorldCupOffer'
  );
  
  content = content.replace(
    /activeSoundtrackOffer: \{ albumTitle: string; emailId: string \} \| null;/,
    `activeSoundtrackOffer: { albumTitle: string; emailId: string } | null;
  activeFifaOffer: { emailId: string; collabs: string[] } | null;
  fifaSingleScheduled?: { week: number; year: number; title: string; coverArt: string; collabs: string[] };`
  );
  
  fs.writeFileSync('types.ts', content);
  console.log('Updated types.ts for FIFA');
} else {
  console.log('Already updated types.ts');
}
