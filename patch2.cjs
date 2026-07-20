const fs = require('fs');
let content = fs.readFileSync('components/TikTokView.tsx', 'utf-8');

const stateTarget = `    const [createThumbnail, setCreateThumbnail] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);`;

const stateReplacement = `    const [createThumbnail, setCreateThumbnail] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);

    const [fypVideos, setFypVideos] = useState<any[]>([]);

    useEffect(() => {
        if (currentTab === 'foryou' && fypVideos.length === 0) {
            const newFypVideos = [];
            const allSongs = [...(activeArtistData?.songs?.filter(s => s.isReleased) || []), ...(gameState.npcs || [])];
            const captions = [
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
            
            for (let i = 0; i < 20; i++) {
                const song = allSongs[Math.floor(Math.random() * allSongs.length)];
                if (!song) continue;
                
                const isPlayerSong = song.hasOwnProperty('streams');
                const artistName = isPlayerSong ? (activeArtist?.name || "") : (song.artist || "Unknown");
                const defaultAvatar = "https://i.pinimg.com/736x/8f/c9/b5/8fc9b578c773cf2b6678da47f9f225eb.jpg";
                const avatar = isPlayerSong 
                    ? (activeArtist?.imageUrl || activeArtist?.image || defaultAvatar) 
                    : (gameState.npcImages?.[artistName] || defaultAvatar);
                
                let thumbnail = avatar;
                if (artistName === "Taylor Swift") {
                    thumbnail = "https://i.insider.com/62e2a00c4361de00188091be"; // Taylor Swift TikTok Image
                }

                newFypVideos.push({
                    id: \`fyp_\${Date.now()}_\${i}\`,
                    username: artistName.replace(/\\s+/g, '').toLowerCase(),
                    userAvatar: avatar,
                    content: captions[Math.floor(Math.random() * captions.length)],
                    songName: \`\${song.title || "Original"} - \${artistName}\`,
                    thumbnail: thumbnail,
                    likes: Math.floor(Math.random() * 5000000) + 10000,
                    comments: Math.floor(Math.random() * 100000) + 1000,
                    views: Math.floor(Math.random() * 20000000) + 100000,
                    isVerified: Math.random() > 0.2
                });
            }
            setFypVideos(newFypVideos);
        }
    }, [currentTab, fypVideos.length, activeArtist, activeArtistData, gameState.npcs, gameState.npcImages]);`;

if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
    fs.writeFileSync('components/TikTokView.tsx', content);
    console.log('patched successfully');
} else {
    console.log('target not found, wait let me try regex');
    content = content.replace(/const containerRef = useRef<HTMLDivElement>\(null\);/g, stateReplacement.replace('    const [createThumbnail, setCreateThumbnail] = useState<string>(\'\');\n', ''));
    fs.writeFileSync('components/TikTokView.tsx', content);
}
