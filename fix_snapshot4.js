import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const target1 = `    // Calculate lighter color for Deluxe subtotal (basic approach: just use opacity or a fixed variant, let's use opacity via rgba or simply the same color slightly faded. Actually, we can just use a slightly lower opacity).

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-auto" onClick={onBack}>
            <div className="w-full max-w-4xl shadow-2xl rounded-lg overflow-hidden relative font-sans min-w-[700px] my-auto" onClick={e => e.stopPropagation()} style={{ transform: \`scale(\${releaseSongs.length > 15 ? 0.8 : 1})\`, transformOrigin: 'center center' }}>`;

const repl1 = `    // Responsive scaling
    const [scale, setScale] = useState(1);
    
    useEffect(() => {
        const updateScale = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Base width of the snapshot
            const targetWidth = 800;
            
            // Estimate height (banner 192px + date 40px + header 48px + footer 44px + rows ~37px each)
            const rowCount = standardSongs.length + deluxeSongs.length + (hasDeluxe ? 2 : 0) + 1;
            const estimatedHeight = 192 + 40 + 48 + 44 + (rowCount * 37) + 32; // 32px for padding
            
            const widthScale = (viewportWidth - 32) / targetWidth; // 32px padding
            const heightScale = (viewportHeight - 32) / estimatedHeight;
            
            // Use the smaller scale so it fits entirely, cap at 1
            setScale(Math.min(1, widthScale, heightScale));
        };
        
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [standardSongs.length, deluxeSongs.length, hasDeluxe]);

    return (
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

code = code.replace(target1, repl1);

const target2 = `                    <td className={\`text-center p-2 font-semibold border border-gray-300 border-r-0 \${isChangeNegative ? 'text-red-600' : 'text-green-600'}\`}>
                        {data.changePercentDisplay}
                    </td>
                    <td className={\`text-center p-2 font-semibold border border-gray-300 border-l-0 \${isChangeNegative ? 'text-red-600' : 'text-green-600'}\`}>
                        {data.changeDisplay}
                    </td>`;

const repl2 = `                    <td className={\`text-center p-2 font-semibold border border-gray-300 \${isChangeNegative ? 'text-red-600' : 'text-green-600'}\`}>
                        {data.changePercentDisplay}
                    </td>
                    <td className={\`text-center p-2 font-semibold border border-gray-300 \${isChangeNegative ? 'text-red-600' : 'text-green-600'}\`}>
                        {data.changeDisplay}
                    </td>`;

code = code.replace(target2, repl2);

const target3 = `                <td className={\`text-center p-2 border-r-0\`}>
                    {changePercentDisplay}
                </td>
                <td className={\`text-center p-2 border-l-0\`}>
                    {changeDisplay}
                </td>`;

const repl3 = `                <td className={\`text-center p-2 border-r border-gray-300/30\`}>
                    {changePercentDisplay}
                </td>
                <td className={\`text-center p-2\`}>
                    {changeDisplay}
                </td>`;

code = code.replace(target3, repl3);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
