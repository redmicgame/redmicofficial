const fs = require('fs');
const lines = fs.readFileSync('/app/applet/components/StudioView.tsx', 'utf8').split('\n');

for (let i = 1145; i < 1175; i++) {
    console.log(i + ": " + lines[i]);
}
