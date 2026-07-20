const fs = require('fs');
let content = fs.readFileSync('components/TikTokView.tsx', 'utf-8');

const target = `                    if (fanPhotos.length > 0 && Math.random() > 0.5) {
                        const randomPhoto = fanPhotos[Math.floor(Math.random() * fanPhotos.length)];
                        avatar = "https://ui-avatars.com/api/?name=F&background=random"; // generic fan avatar
                        thumbnail = randomPhoto.image;
                    } else {
                        avatar = "https://ui-avatars.com/api/?name=F&background=random";
                        thumbnail = "https://ui-avatars.com/api/?name=F&background=random"; // generic fan photo
                    }`;

const replacement = `                    avatar = \`https://ui-avatars.com/api/?name=\${username[0]}&background=random\`;
                    if (fanPhotos.length > 0) {
                        const randomPhoto = fanPhotos[Math.floor(Math.random() * fanPhotos.length)];
                        thumbnail = randomPhoto.image;
                    } else {
                        thumbnail = activeArtist?.image || "https://ui-avatars.com/api/?name=F&background=random"; 
                    }`;

content = content.replace(target, replacement);
fs.writeFileSync('components/TikTokView.tsx', content);
