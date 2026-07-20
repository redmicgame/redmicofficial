const fs = require('fs');
let file = '/app/applet/components/GameGuideView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<h3 className="font-bold text-red-400 mt-4">Live Albums<\/h3>/;
const replacement = `<h3 className="font-bold text-red-400 mt-4">Features & Collaborations</h3>
                <p>Sometimes you will get an email asking you to feature on another artist's track. Accepting these can give you a boost in popularity and passive streams. Similarly, you can ask NPCs to feature on your songs during recording, which combines your star power to boost the song's potential streams.</p>
                <h3 className="font-bold text-red-400 mt-4">Live Albums</h3>`;
content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Added collabs to guide');
