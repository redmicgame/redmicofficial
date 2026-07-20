const fs = require('fs');
let content = fs.readFileSync('components/TikTokView.tsx', 'utf-8');

const regex = /const \[fypVideos, setFypVideos\] = useState<any\[\]>\(\[\]\);([\s\S]*?)}, \[currentTab, fypVideos\.length, activeArtist, activeArtistData, gameState\.npcs, gameState\.npcImages\]\);/g;

const replacement = `const [fypVideos, setFypVideos] = useState<any[]>([]);

    useEffect(() => {
        if (currentTab === 'foryou' && fypVideos.length === 0) {
            const newFypVideos = [];
            const playerSongs = activeArtistData?.songs?.filter(s => s.isReleased) || [];
            const npcSongs = gameState.npcs || [];
            const allSongs = [...playerSongs, ...npcSongs];
            
            const artistCaptions = [
                "dancing to my new song 🕺",
                "pov: you just released the song of the summer",
                "can't stop listening to this",
                "behind the scenes of the music video!",
                "drafts 🤪",
                "obsessed with this sound",
                "is it giving??",
                "make sure to stream my new single!!",
                "tour rehearsals 🎤"
            ];

            const fanCaptions = [
                "obsessed with this part 😭",
                "the bridge is heavenly",
                "POV: you're listening to the song of the year",
                "choreography time! ✨",
                "my new favorite song",
                "they put something in this song fr",
                "wait this is a bop",
                "i cant stop playing this",
                "stan twitter found its new anthem"
            ];

            const fanUsernames = [
                "popcraved", "musicfanatic", "stanaccount123", "daily_updates",
                "chartdata_fan", "themusictea", "pop_icon", "starlight_22", 
                "moonlight_babe", "vibe_check", "music_lover99", "tayvoodoo"
            ];
            
            const fanPhotos = activeArtistData?.paparazziPhotos?.filter(p => p.category === 'TikTok Fan') || [];

            for (let i = 0; i < 20; i++) {
                const isFan = Math.random() > 0.4 && playerSongs.length > 0;
                let song;
                let artistName = "";
                let username = "";
                let avatar = "";
                let thumbnail = "";
                let isVerified = false;
                let content = "";
                
                if (isFan) {
                    song = playerSongs[Math.floor(Math.random() * playerSongs.length)];
                    artistName = activeArtist?.name || "Unknown";
                    username = fanUsernames[Math.floor(Math.random() * fanUsernames.length)] + Math.floor(Math.random() * 100);
                    
                    if (fanPhotos.length > 0 && Math.random() > 0.5) {
                        const randomPhoto = fanPhotos[Math.floor(Math.random() * fanPhotos.length)];
                        avatar = "https://i.pinimg.com/736x/8f/c9/b5/8fc9b578c773cf2b6678da47f9f225eb.jpg"; // generic fan avatar
                        thumbnail = randomPhoto.image;
                    } else {
                        avatar = "https://i.pinimg.com/736x/8f/c9/b5/8fc9b578c773cf2b6678da47f9f225eb.jpg";
                        thumbnail = "https://i.pinimg.com/736x/8f/c9/b5/8fc9b578c773cf2b6678da47f9f225eb.jpg"; // generic fan photo
                    }
                    content = fanCaptions[Math.floor(Math.random() * fanCaptions.length)];
                    isVerified = false;
                } else {
                    song = allSongs[Math.floor(Math.random() * allSongs.length)];
                    if (!song) continue;
                    
                    const isPlayerSong = song.hasOwnProperty('streams');
                    artistName = isPlayerSong ? (activeArtist?.name || "") : (song.artist || "Unknown");
                    const defaultAvatar = "https://i.pinimg.com/736x/8f/c9/b5/8fc9b578c773cf2b6678da47f9f225eb.jpg";
                    avatar = isPlayerSong 
                        ? (activeArtist?.imageUrl || activeArtist?.image || defaultAvatar) 
                        : (gameState.npcImages?.[artistName] || defaultAvatar);
                    
                    thumbnail = avatar;
                    if (artistName === "Taylor Swift") {
                        thumbnail = "https://i.insider.com/62e2a00c4361de00188091be"; // Taylor Swift TikTok Image
                    }
                    
                    username = artistName.replace(/\\s+/g, '').toLowerCase();
                    content = artistCaptions[Math.floor(Math.random() * artistCaptions.length)];
                    isVerified = Math.random() > 0.2;
                }

                newFypVideos.push({
                    id: \`fyp_\${Date.now()}_\${i}\`,
                    username: username,
                    userAvatar: avatar,
                    content: content,
                    songName: \`\${song.title || "Original"} - \${artistName}\`,
                    thumbnail: thumbnail,
                    likes: Math.floor(Math.random() * (isFan ? 1000000 : 5000000)) + 1000,
                    comments: Math.floor(Math.random() * (isFan ? 20000 : 100000)) + 100,
                    views: Math.floor(Math.random() * (isFan ? 5000000 : 20000000)) + 10000,
                    isVerified: isVerified
                });
            }
            setFypVideos(newFypVideos);
        }
    }, [currentTab, fypVideos.length, activeArtist, activeArtistData, gameState.npcs, gameState.npcImages]);`;

content = content.replace(regex, replacement);
fs.writeFileSync('components/TikTokView.tsx', content);
console.log('patched successfully');
