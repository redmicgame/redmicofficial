const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf-8');

if (!content.includes('"goldenGlobeSubmission"')) {
    content = content.replace('| "oscarSubmission"', '| "oscarSubmission"\n      | "goldenGlobeSubmission"');
    fs.writeFileSync('types.ts', content);
    console.log("Patched inbox offer type");
}
