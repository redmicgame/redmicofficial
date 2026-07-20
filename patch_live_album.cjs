const fs = require('fs');

const file_path = '/app/applet/components/ReleaseView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

// 1. Add tour selection state
content = content.replace(
    "const [baseAlbumForDeluxe, setBaseAlbumForDeluxe] = useState<string>('');",
    "const [baseAlbumForDeluxe, setBaseAlbumForDeluxe] = useState<string>('');\n    const [selectedLiveTourId, setSelectedLiveTourId] = useState<string>('');"
);

// 2. Add Live Album to release types
content = content.replace(
    "(['Single', 'EP', 'Album', 'Album (Deluxe)', 'Compilation'] as ReleaseType[])",
    "(['Single', 'EP', 'Album', 'Album (Deluxe)', 'Compilation', 'Live Album'] as ReleaseType[])"
);

// 3. Clear tour ID on change
content = content.replace(
    "setBaseAlbumForDeluxe(''); setTitle('');",
    "setBaseAlbumForDeluxe(''); setTitle(''); setSelectedLiveTourId('');"
);

// 4. Update validation for Live Album
content = content.replace(
    "if (releaseType === 'Album (Deluxe)') {",
    `if (releaseType === 'Live Album') {
            if (!selectedLiveTourId) { setError('Please select a completed tour to create a live album for.'); return; }
            if (!coverArt) { setError('A cover art is required for a live album.'); return; }
            finalReleaseType = 'Album';
        } else if (releaseType === 'Album (Deluxe)') {`
);

// 5. Update songIds for Live Album
content = content.replace(
    "songIds: releaseType === 'Album (Deluxe)'",
    "songIds: releaseType === 'Live Album' ? [] /* we will create live songs below */ : releaseType === 'Album (Deluxe)'"
);

// 6. Wait, we need to create the live songs in the handler! 
// Let's modify the SUBMIT_TO_LABEL or RELEASE_PROJECT dispatch to handle Live Album differently. Or just dispatch a new action CREATE_LIVE_ALBUM.
