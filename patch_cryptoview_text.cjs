const fs = require('fs');
let content = fs.readFileSync('components/CryptoView.tsx', 'utf-8');

content = content.replace(
    'This will delete the coin and severely damage your public image and hype!',
    'This will cash out your holdings, crash the coin, and severely damage your public image and hype!'
);

fs.writeFileSync('components/CryptoView.tsx', content);
console.log('patched cryptoview confirm text');
