const fs = require('fs');
let content = fs.readFileSync('components/YouTubeView.tsx', 'utf-8');

const str = `) : (
                
                <div className="flex justify-between items-center">`;
const str2 = `) : (<>
                
                <div className="flex justify-between items-center">`;

if (content.includes(str)) {
    content = content.replace(str, str2);
} else {
    console.log("Not found!");
}
fs.writeFileSync('components/YouTubeView.tsx', content);
