const fs = require('fs');

let file = '/app/applet/components/StudioView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetAutoWriteButton = `                    <button
                        onClick={() => { setMode('autoWrite'); setError(''); }}
                        className={\`px-4 py-1 rounded-md text-sm font-semibold transition-colors shrink-0 \${mode === 'autoWrite' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}\`}
                    >
                        Auto Write (Spotify)
                    </button>`;
const replacementLiveAlbumButton = `                    <button
                        onClick={() => { setMode('autoWrite'); setError(''); }}
                        className={\`px-4 py-1 rounded-md text-sm font-semibold transition-colors shrink-0 \${mode === 'autoWrite' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}\`}
                    >
                        Auto Write (Spotify)
                    </button>
                    <button
                        onClick={() => { setMode('liveAlbum'); setError(''); }}
                        className={\`px-4 py-1 rounded-md text-sm font-semibold transition-colors shrink-0 \${mode === 'liveAlbum' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}\`}
                    >
                        Live Album
                    </button>`;
content = content.replace(targetAutoWriteButton, replacementLiveAlbumButton);

fs.writeFileSync(file, content);
console.log("Patched StudioView Live Album Button");
