const fs = require('fs');

let typesFile = '/app/applet/types.ts';
let typesContent = fs.readFileSync(typesFile, 'utf8');

typesContent = typesContent.replace(
  `  | "dating"`,
  `  | "dating"
  | "moviePremiereRedCarpet"
  | "goldenGlobeRedCarpet"`
);

typesContent = typesContent.replace(
  `  activeOscarRedCarpetOffer: { emailId: string } | null;`,
  `  activeOscarRedCarpetOffer: { emailId: string } | null;
  activeMoviePremiereOffer: { roleId: string; roleTitle: string; } | null;
  activeGoldenGlobeRedCarpetOffer: { emailId: string } | null;`
);

fs.writeFileSync(typesFile, typesContent);
console.log("Patched types");
