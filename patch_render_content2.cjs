const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const regex = /if \(part\.startsWith\('.*?\n.*?\n.*?\n/gm;
console.log("matched: " + content.match(regex));
