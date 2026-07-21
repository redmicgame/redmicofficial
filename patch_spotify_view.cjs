const fs = require('fs');
let file = '/app/applet/components/SpotifyView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.filter\(s => s\.isReleased && !s\.isTakenDown && s\.isAvailableOnStreaming === true\)/, 
                          '.filter(s => s.isReleased && !s.isTakenDown && (s.isAvailableOnStreaming === true || s.isFeatureToNpc))');
fs.writeFileSync(file, content);
console.log('Fixed streamingSongs filter in SpotifyView');
