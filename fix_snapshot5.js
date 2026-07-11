import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const target = `    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden" onClick={onBack}>
            <div 
                className="w-[800px] shadow-2xl rounded-lg overflow-hidden relative font-sans shrink-0" 
                onClick={e => e.stopPropagation()} 
                style={{ 
                    transform: \`scale(\${scale})\`, 
                    transformOrigin: 'center center',
                    maxHeight: '100%'
                }}
            >`;
            
const repl = `    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-auto p-4" onClick={onBack}>
            <div 
                className="w-[800px] shadow-2xl rounded-lg overflow-hidden relative font-sans shrink-0" 
                onClick={e => e.stopPropagation()} 
                style={{ 
                    transform: \`scale(\${scale})\`, 
                    transformOrigin: 'center center'
                }}
            >`;

code = code.replace(target, repl);

// Also let's fix the height scale estimation so it doesn't get overly small if not needed
// We can use a ref to get the actual height, but for now we can tweak the row height estimate.
const targetEstimate = `const estimatedHeight = 192 + 40 + 48 + 44 + (rowCount * 37) + 32;`;
const replEstimate = `const estimatedHeight = 192 + 40 + 48 + 44 + (rowCount * 37);`; // removed 32px padding from estimate, just raw element sizes
code = code.replace(targetEstimate, replEstimate);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
