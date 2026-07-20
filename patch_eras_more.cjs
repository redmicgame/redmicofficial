const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf-8');

const moreEras = {
  // 70s additional
  "Aretha Franklin": { start: 1961, end: 2018, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/b8110b6d21f8a846200257c70cbf73e9/250x250-000000-80-0-0.jpg" },
  "Diana Ross": { start: 1970, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/b6f1ca33fbe40d348a27d2194cf3eec9/250x250-000000-80-0-0.jpg" },
  "Bee Gees": { start: 1965, end: 2003, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/4ebef891bc86ff542b6f5cf1de36f875/250x250-000000-80-0-0.jpg" },
  "The Rolling Stones": { start: 1962, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/1e74880c54bb9b5f818fdfcb796b4121/250x250-000000-80-0-0.jpg" },
  "Eagles": { start: 1971, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/c1a6f8742cc65a8df241dcd79fcbd9fa/250x250-000000-80-0-0.jpg" },
  "Donna Summer": { start: 1974, end: 2012, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/7e4a77b311319dbf678cded0c67e1a38/250x250-000000-80-0-0.jpg" },

  // 80s additional
  "Tina Turner": { start: 1984, end: 2023, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/f1fb89eb8e390c5003c20c0dcfe63f45/250x250-000000-80-0-0.jpg" },
  "Cyndi Lauper": { start: 1983, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/8cc53ff33be927164ccb6ce2ec9e4ba6/250x250-000000-80-0-0.jpg" },
  "Cher": { start: 1965, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/b28096f9bf11b66ebbb1296c6b412140/250x250-000000-80-0-0.jpg" },
  "Def Leppard": { start: 1980, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/f9630c33ad78a834c9c22eb430dcb989/250x250-000000-80-0-0.jpg" },
  "AC/DC": { start: 1973, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/b2fa8bc635583b27b3e839e9fc1f912a/250x250-000000-80-0-0.jpg" },

  // 90s additional
  "Shania Twain": { start: 1993, end: 2050, genre: "Country", image: "https://e-cdns-images.dzcdn.net/images/artist/7e4a77b311319dbf678cded0c67e1a38/250x250-000000-80-0-0.jpg" },
  "No Doubt": { start: 1992, end: 2012, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/23c14d485ee414cae818bbd0a79040db/250x250-000000-80-0-0.jpg" },
  "Aaliyah": { start: 1994, end: 2001, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/81005a39626c8cd1cf9c9f28ecb3a2a6/250x250-000000-80-0-0.jpg" },
  "Lauryn Hill": { start: 1998, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/b6f1ca33fbe40d348a27d2194cf3eec9/250x250-000000-80-0-0.jpg" },
  "Pearl Jam": { start: 1991, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/43e74ff1f3bf78b4d08e56314ff9478e/250x250-000000-80-0-0.jpg" },
  "Red Hot Chili Peppers": { start: 1984, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/6b68596fde6be6ecab39cb32eefdd920/250x250-000000-80-0-0.jpg" },

  // 00s additional
  "Eminem": { start: 1999, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/19cc38f9d69b352f718782e7a22f9c32/250x250-000000-80-0-0.jpg" },
  "Christina Aguilera": { start: 1999, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/3ff402daee9c78d5ce8084a77b75ecb0/250x250-000000-80-0-0.jpg" },
  "Kelly Clarkson": { start: 2002, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/7733cc50d87edfa15739c9df382fb2e4/250x250-000000-80-0-0.jpg" },
  "Avril Lavigne": { start: 2002, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/a1be2e68449c25f4ab36181b5fbce306/250x250-000000-80-0-0.jpg" },
  "P!nk": { start: 2000, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/b7a2d6742512f45037d453715c0a373b/250x250-000000-80-0-0.jpg" },
  "Justin Timberlake": { start: 2002, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/818fdfcb796b41217e74880c54bb9b5f/250x250-000000-80-0-0.jpg" },
  "Missy Elliott": { start: 1997, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/bdab4cc8dbad3a9dae88ff39ccb36ce9/250x250-000000-80-0-0.jpg" }
};

if (!content.includes('// Eras extra additions')) {
    content = content.replace('Object.assign(NPC_ERAS, {', "Object.assign(NPC_ERAS, " + JSON.stringify(moreEras) + ", {");
    // simpler to just append it before the merge block
    const mergeRegex = /\/\/ Merging Eras data into standard lists[\s\S]*?\}\);/;
    const mergeMatch = content.match(mergeRegex);
    if (mergeMatch) {
        const mergeBlock = mergeMatch[0];
        content = content.replace(mergeRegex, '');
        content += '\n// Eras extra additions\n';
        content += "Object.assign(NPC_ERAS, " + JSON.stringify(moreEras, null, 2) + ");\n";
        content += '\n' + mergeBlock + '\n';
        fs.writeFileSync('constants.ts', content);
        console.log('Added more eras to constants');
    }
}
