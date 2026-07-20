const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const regex = /disabled=\{!content\.trim\(\) disabled=\{!content\.trim\(\) \&\& !image\}disabled=\{!content\.trim\(\) \&\& !image\} !image \&\& postType === "normal"\}/g;
content = content.replace(regex, 'disabled={!content.trim() && !image && postType === "normal"}');

fs.writeFileSync('components/XView.tsx', content);
