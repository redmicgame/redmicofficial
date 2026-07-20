const fs = require('fs');

const moreArtists = {
  // 60s
  "The Beatles": { start: 1962, end: 1970, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/9c45c3ec047eb3ba7ad43dbbbf1025a7/250x250-000000-80-0-0.jpg" },
  "The Beach Boys": { start: 1961, end: 2012, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/dfa473f6ed9100742f534fa889241b12/250x250-000000-80-0-0.jpg" },
  "The Supremes": { start: 1959, end: 1977, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/8cc53ff33be927164ccb6ce2ec9e4ba6/250x250-000000-80-0-0.jpg" },
  "Jimi Hendrix": { start: 1963, end: 1970, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/5cb1b702ec4cb03e4823db9dfd048d08/250x250-000000-80-0-0.jpg" },
  "Bob Dylan": { start: 1961, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/23c14d485ee414cae818bbd0a79040db/250x250-000000-80-0-0.jpg" },
  
  // 70s
  "The Jackson 5": { start: 1969, end: 1989, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/c1a6f8742cc65a8df241dcd79fcbd9fa/250x250-000000-80-0-0.jpg" },
  "Aerosmith": { start: 1970, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/1e74880c54bb9b5f818fdfcb796b4121/250x250-000000-80-0-0.jpg" },
  "The Clash": { start: 1976, end: 1986, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/f9630c33ad78a834c9c22eb430dcb989/250x250-000000-80-0-0.jpg" },
  "Ramones": { start: 1974, end: 1996, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/b28096f9bf11b66ebbb1296c6b412140/250x250-000000-80-0-0.jpg" },
  "Blondie": { start: 1974, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/7e4a77b311319dbf678cded0c67e1a38/250x250-000000-80-0-0.jpg" },
  
  // 80s
  "Duran Duran": { start: 1978, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/8cc53ff33be927164ccb6ce2ec9e4ba6/250x250-000000-80-0-0.jpg" },
  "The Cure": { start: 1978, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/43e74ff1f3bf78b4d08e56314ff9478e/250x250-000000-80-0-0.jpg" },
  "Depeche Mode": { start: 1980, end: 2050, genre: "Electronic", image: "https://e-cdns-images.dzcdn.net/images/artist/6b68596fde6be6ecab39cb32eefdd920/250x250-000000-80-0-0.jpg" },
  "The Smiths": { start: 1982, end: 1987, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/f1fb89eb8e390c5003c20c0dcfe63f45/250x250-000000-80-0-0.jpg" },
  "INXS": { start: 1977, end: 2012, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/b6f1ca33fbe40d348a27d2194cf3eec9/250x250-000000-80-0-0.jpg" },
  
  // 90s
  "TLC": { start: 1991, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/7733cc50d87edfa15739c9df382fb2e4/250x250-000000-80-0-0.jpg" },
  "Spice Girls": { start: 1994, end: 2000, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/3ff402daee9c78d5ce8084a77b75ecb0/250x250-000000-80-0-0.jpg" },
  "Backstreet Boys": { start: 1993, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/19cc38f9d69b352f718782e7a22f9c32/250x250-000000-80-0-0.jpg" },
  "NSYNC": { start: 1995, end: 2002, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/81005a39626c8cd1cf9c9f28ecb3a2a6/250x250-000000-80-0-0.jpg" },
  "The Notorious B.I.G.": { start: 1992, end: 1997, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/23c14d485ee414cae818bbd0a79040db/250x250-000000-80-0-0.jpg" },
  
  // 00s
  "Black Eyed Peas": { start: 1995, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/818fdfcb796b41217e74880c54bb9b5f/250x250-000000-80-0-0.jpg" },
  "Nelly": { start: 1993, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/b7a2d6742512f45037d453715c0a373b/250x250-000000-80-0-0.jpg" }
};

let content = fs.readFileSync('constants.ts', 'utf-8');

const patchCode = `
// More era additions
Object.assign(NPC_ERAS, ${JSON.stringify(moreArtists, null, 2)});
`;

if (!content.includes('The Beatles')) {
    const mergeRegex = /\/\/ Merging Eras data into standard lists[\s\S]*?\}\);/;
    const mergeMatch = content.match(mergeRegex);
    if (mergeMatch) {
        const mergeBlock = mergeMatch[0];
        content = content.replace(mergeRegex, '');
        content += patchCode + '\n' + mergeBlock + '\n';
        fs.writeFileSync('constants.ts', content);
        console.log('Patched new artists');
    }
}

