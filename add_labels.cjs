const fs = require('fs');

const svgToBase64 = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

const createLogo = (text, bg, fg) => {
    return svgToBase64(`<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="${fg}">${text}</text></svg>`);
};

const newLabels = [
    {
        id: 'def_jam',
        name: 'Def Jam Recordings',
        tier: 'Mid-high',
        logo: createLogo('DEF JAM', '#111', '#FFF'),
        promotionMultiplier: 1.6,
        creativeControl: 65,
        minQuality: 50,
        streamRequirement: 350_000_000
    },
    {
        id: 'bad_boy',
        name: 'Bad Boy Records',
        tier: 'Mid-Low',
        logo: createLogo('BAD BOY', '#000', '#FFF'),
        promotionMultiplier: 1.3,
        creativeControl: 60,
        minQuality: 40,
        streamRequirement: 10_000,
        activeFromYear: 1998,
        activeUntilYear: 2013
    },
    {
        id: 'polydor',
        name: 'Polydor Records',
        tier: 'Mid-Low',
        logo: createLogo('POLYDOR', '#D00', '#FFF'),
        promotionMultiplier: 1.2,
        creativeControl: 50,
        minQuality: 40,
        streamRequirement: 0,
        activeFromYear: 2013
    },
    {
        id: 'nice_life',
        name: 'Nice Life',
        tier: 'Low',
        logo: createLogo('NICE LIFE', '#F90', '#FFF'),
        promotionMultiplier: 1.1,
        creativeControl: 80,
        minQuality: 30,
        streamRequirement: 0,
        activeFromYear: 2018,
        isDistributionOnly: true
    },
    {
        id: 'sony',
        name: 'Sony Music',
        tier: 'Top',
        logo: createLogo('SONY', '#D00', '#FFF'),
        promotionMultiplier: 2.0,
        creativeControl: 75,
        minQuality: 65,
        streamRequirement: 5_000_000_000
    },
    {
        id: 'capitol',
        name: 'Capitol Records',
        tier: 'Mid-Low',
        logo: createLogo('CAPITOL', '#009', '#FFF'),
        promotionMultiplier: 1.3,
        creativeControl: 55,
        minQuality: 45,
        streamRequirement: 1_000_000
    },
    {
        id: 'motown',
        name: 'Motown Records',
        tier: 'Low',
        logo: createLogo('MOTOWN', '#005', '#FFF'),
        promotionMultiplier: 1.1,
        creativeControl: 40,
        minQuality: 30,
        streamRequirement: 0
    },
    {
        id: 'geffen',
        name: 'Geffen Records',
        tier: 'Mid-Low',
        logo: createLogo('GEFFEN', '#222', '#FFF'),
        promotionMultiplier: 1.4,
        creativeControl: 60,
        minQuality: 40,
        streamRequirement: 3_000_000
    },
    {
        id: 'empire',
        name: 'EMPIRE',
        tier: 'Low',
        logo: createLogo('EMPIRE', '#FFF', '#000'),
        promotionMultiplier: 1.15,
        creativeControl: 90,
        minQuality: 25,
        streamRequirement: 0,
        isDistributionOnly: true
    },
    {
        id: 'virgin',
        name: 'Virgin Music Group',
        tier: 'Low',
        logo: createLogo('VIRGIN', '#E00', '#FFF'),
        promotionMultiplier: 1.2,
        creativeControl: 50,
        minQuality: 30,
        streamRequirement: 0
    }
];

let content = fs.readFileSync('constants.ts', 'utf-8');
const strToInsert = newLabels.map(l => JSON.stringify(l, null, 4)).join(',\n') + ',\n';

// Replace the end of the LABELS array
const splitIndex = content.indexOf('];', content.indexOf('export const LABELS: Label[] ='));
if (splitIndex !== -1) {
    // Before inserting, we need to add a comma if there isn't one
    const before = content.substring(0, splitIndex).trimEnd();
    const after = content.substring(splitIndex);
    const newContent = (before.endsWith(',') ? before : before + ',') + '\n' + strToInsert + after;
    fs.writeFileSync('constants.ts', newContent);
    console.log("Added labels successfully.");
} else {
    console.log("Could not find LABELS array.");
}
