const fs = require('fs');
const file_path = '/app/applet/components/GoogleView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

content = content.replace(
    "${artistProfile.name} (born Year Unknown)",
    "${artistProfile.name} (born ${gameState.startYear - artistProfile.age})"
);

fs.writeFileSync(file_path, content);
console.log("Patched GoogleView wikipedia age");
