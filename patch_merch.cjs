const fs = require('fs');

const file_path = '/app/applet/components/YouTubeStoreView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

content = content.replace(
    "const [merchType, setMerchType] = useState<'Vinyl' | 'CD' | 'Ringtone'>('Vinyl');",
    "const [merchType, setMerchType] = useState<'Vinyl' | 'CD' | 'Ringtone' | 'Cassette' | 'T-Shirt' | 'Hoodie' | 'Tour Exclusive Merch'>('Vinyl');"
);

content = content.replace(
    "const handleMerchTypeChange = (type: 'Vinyl' | 'CD' | 'Ringtone') => {",
    "const handleMerchTypeChange = (type: 'Vinyl' | 'CD' | 'Ringtone' | 'Cassette' | 'T-Shirt' | 'Hoodie' | 'Tour Exclusive Merch') => {"
);

content = content.replace(
    "const unitCost = merchType === 'Vinyl' ? 12 : merchType === 'CD' ? 3 : 0;",
    "const unitCost = merchType === 'Vinyl' ? 12 : merchType === 'CD' ? 3 : merchType === 'Cassette' ? 4 : merchType === 'T-Shirt' ? 15 : merchType === 'Hoodie' ? 25 : merchType === 'Tour Exclusive Merch' ? 20 : 0;"
);

content = content.replace(
    "            setPrice(type === 'Vinyl' ? 39.98 : 12.98);",
    "            setPrice(type === 'Vinyl' ? 39.98 : type === 'CD' ? 12.98 : type === 'Cassette' ? 14.98 : type === 'T-Shirt' ? 35.00 : type === 'Hoodie' ? 65.00 : type === 'Tour Exclusive Merch' ? 50.00 : 12.98);"
);

content = content.replace(
    "                    <button onClick={() => handleMerchTypeChange('Vinyl')} className={`py-2 rounded ${merchType === 'Vinyl' ? 'bg-red-500' : 'bg-zinc-700'}`}>Vinyl</button>\n                    <button onClick={() => handleMerchTypeChange('CD')} className={`py-2 rounded ${merchType === 'CD' ? 'bg-red-500' : 'bg-zinc-700'}`}>CD</button>\n                    {selectedRelease && (\n                        <button onClick={() => handleMerchTypeChange('Ringtone')} className={`py-2 rounded ${merchType === 'Ringtone' ? 'bg-red-500' : 'bg-zinc-700'}`}>Ringtone</button>\n                    )}",
    `                    <button onClick={() => handleMerchTypeChange('Vinyl')} className={\`py-2 rounded \${merchType === 'Vinyl' ? 'bg-red-500' : 'bg-zinc-700'}\`}>Vinyl</button>
                    <button onClick={() => handleMerchTypeChange('CD')} className={\`py-2 rounded \${merchType === 'CD' ? 'bg-red-500' : 'bg-zinc-700'}\`}>CD</button>
                    <button onClick={() => handleMerchTypeChange('Cassette')} className={\`py-2 rounded \${merchType === 'Cassette' ? 'bg-red-500' : 'bg-zinc-700'}\`}>Cassette</button>
                    <button onClick={() => handleMerchTypeChange('T-Shirt')} className={\`py-2 rounded \${merchType === 'T-Shirt' ? 'bg-red-500' : 'bg-zinc-700'}\`}>T-Shirt</button>
                    <button onClick={() => handleMerchTypeChange('Hoodie')} className={\`py-2 rounded \${merchType === 'Hoodie' ? 'bg-red-500' : 'bg-zinc-700'}\`}>Hoodie</button>
                    <button onClick={() => handleMerchTypeChange('Tour Exclusive Merch')} className={\`py-2 rounded \${merchType === 'Tour Exclusive Merch' ? 'bg-red-500' : 'bg-zinc-700'}\`}>Tour Excl.</button>
                    {selectedRelease && (
                        <button onClick={() => handleMerchTypeChange('Ringtone')} className={\`py-2 rounded \${merchType === 'Ringtone' ? 'bg-red-500' : 'bg-zinc-700'}\`}>Ringtone</button>
                    )}`
);

fs.writeFileSync(file_path, content);
console.log("Patched Merch");
