const fs = require('fs');
let content = fs.readFileSync('components/SpotifyForCreatorsView.tsx', 'utf-8');

// Replace standard alerts/prompts
content = content.replace(
    "const [showDesc, setShowDesc] = useState(selectedPodcast?.description || '');",
    "const [showDesc, setShowDesc] = useState(selectedPodcast?.description || '');\n    const [showEpisodeModal, setShowEpisodeModal] = useState(false);\n    const [newEpTitle, setNewEpTitle] = useState('');\n    const [newEpIsVideo, setNewEpIsVideo] = useState(false);\n    const [toastMsg, setToastMsg] = useState<string | null>(null);"
);

content = content.replace(
    'alert("Settings saved!");',
    'setToastMsg("Settings saved!"); setTimeout(() => setToastMsg(null), 3000);'
);

content = content.replace(
    `    const handleCreateEpisode = () => {
        if (!selectedPodcast) return;
        
        const title = prompt("Episode Title:");
        if (!title) return;
        
        const isVideo = confirm("Is this a Video podcast? (Cancel for Audio only)");
        
        const newEp = {
            id: \`ep_\${Date.now()}\`,
            title,
            description: "A brand new episode.",
            duration: Math.floor(Math.random() * 60) + 30,
            releaseDate: { ...gameState.date },
            plays: 0,
            revenue: 0,
            hasVideo: isVideo
        };
        
        const updated = { ...selectedPodcast, episodes: [...selectedPodcast.episodes, newEp] };
        const newPodcasts = allPodcasts.map(p => p.id === selectedPodcast.id ? updated : p);
        dispatch({ type: 'UPDATE_GAME_STATE', payload: { podcasts: newPodcasts } });
        setSelectedPodcast(updated);
    };`,
    `    const handleCreateEpisode = () => {
        setShowEpisodeModal(true);
        setNewEpTitle("");
        setNewEpIsVideo(false);
    };

    const confirmCreateEpisode = () => {
        if (!selectedPodcast || !newEpTitle) return;
        const newEp = {
            id: \`ep_\${Date.now()}\`,
            title: newEpTitle,
            description: "A brand new episode.",
            duration: Math.floor(Math.random() * 60) + 30,
            releaseDate: { ...gameState.date },
            plays: 0,
            revenue: 0,
            hasVideo: newEpIsVideo
        };
        const updated = { ...selectedPodcast, episodes: [...selectedPodcast.episodes, newEp] };
        const newPodcasts = allPodcasts.map(p => p.id === selectedPodcast.id ? updated : p);
        dispatch({ type: 'UPDATE_GAME_STATE', payload: { podcasts: newPodcasts } });
        setSelectedPodcast(updated);
        setShowEpisodeModal(false);
        setToastMsg("Episode created!"); setTimeout(() => setToastMsg(null), 3000);
    };`
);

// Inject modal UI and Toast at the bottom inside the main wrapper
content = content.replace(
    '            </div>\n        </div>\n    );\n};\n\nexport default SpotifyForCreatorsView;',
    `                {toastMsg && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                        {toastMsg}
                    </div>
                )}
                {showEpisodeModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="font-bold text-xl mb-4">Create New Episode</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">Episode Title</label>
                                <input type="text" value={newEpTitle} onChange={e => setNewEpTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="Episode Title..." />
                            </div>
                            <div className="mb-6 flex items-center gap-2">
                                <input type="checkbox" id="video-ep" checked={newEpIsVideo} onChange={e => setNewEpIsVideo(e.target.checked)} />
                                <label htmlFor="video-ep" className="text-sm">Video Podcast</label>
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button onClick={() => setShowEpisodeModal(false)} className="px-4 py-2 text-zinc-500 font-bold">Cancel</button>
                                <button onClick={confirmCreateEpisode} className="px-4 py-2 bg-black text-white font-bold rounded">Create</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpotifyForCreatorsView;`
);

fs.writeFileSync('components/SpotifyForCreatorsView.tsx', content);
