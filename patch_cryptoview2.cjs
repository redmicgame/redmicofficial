const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

// Replace launchPrice default to 0.01 so initial market cap is 10M
content = content.replace(
    'const [launchPrice, setLaunchPrice] = useState(0.0001);',
    'const [launchPrice, setLaunchPrice] = useState(0.01);'
);

fs.writeFileSync('components/CryptoView.tsx', content);
console.log('patched cryptoview again');
