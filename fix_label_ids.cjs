const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

content = content.replace(
  /id:\s*\|\s*"umg"[\s\S]*?\|\s*"roc_nation";/,
  `id:
    | "umg"
    | "republic"
    | "rca"
    | "island"
    | "interscope"
    | "columbia"
    | "atlantic"
    | "epic"
    | "quality_control"
    | "tde"
    | "roc_nation"
    | "def_jam"
    | "bad_boy"
    | "polydor"
    | "nice_life"
    | "sony"
    | "capitol"
    | "motown"
    | "geffen"
    | "empire"
    | "virgin"
    | string;`
);

fs.writeFileSync('types.ts', content);
console.log("Fixed Label id type");
