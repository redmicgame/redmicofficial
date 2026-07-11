import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const targetOuter = `<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-auto p-4" onClick={onBack}>`;
const replOuter = `<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden" onClick={onBack}>`;

code = code.replace(targetOuter, replOuter);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
