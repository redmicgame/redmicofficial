const fs = require('fs');
let content = fs.readFileSync('components/YouTubeView.tsx', 'utf-8');
content = content.replace(") : (<>\n                    <div className=\"text-center py-12", ") : (\n                    <div className=\"text-center py-12");
fs.writeFileSync('components/YouTubeView.tsx', content);
