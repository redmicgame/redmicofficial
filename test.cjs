const fs = require('fs');
const code = fs.readFileSync('/app/applet/components/StudioView.tsx', 'utf8');

let indent = 0;
// super basic parenthesis and bracket matcher
let lines = code.split('\n');
for (let i = 1000; i < 1130; i++) {
    console.log(i + ": " + lines[i]);
}
