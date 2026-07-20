const fs = require('fs');
let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /title: original\.title \+ " - Live",\s*isReleased: false,/g;
const replacement1 = `title: original.title + " - Live",
                    coverArt: coverArt || original.coverArt,
                    isReleased: false,`;
content = content.replace(regex1, replacement1);

const regex2 = /const qualityBonus = Math\.floor\(Math\.random\(\) \* \(selectedStudio\.maxQuality \- selectedStudio\.minQuality \+ 1\)\) \+ selectedStudio\.minQuality;/g;
const replacement2 = `const qualityBonus = Math.floor(Math.random() * (selectedStudio.qualityRange[1] - selectedStudio.qualityRange[0] + 1)) + selectedStudio.qualityRange[0];`;
content = content.replace(regex2, replacement2);

fs.writeFileSync(file, content);
console.log('Patched handleLiveAlbum logic fixes');
