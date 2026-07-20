const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const regex = /const renderContentWithHighlights = \(text: string\) => \{\n\s*return text\.split\(\/\(\\\$\[A-Z0-9\]\+\)\/gi\)\.map\(\(part, i\) => \{\n\s*if \(part\.startsWith\('.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n/gm;

const toRemove = /const renderContentWithHighlights = \(text: string\) => \{[\s\S]*?if \(part\.startsWith\('.*?onQuoteHold\?: \(post: XPost\) => void;\n\}>\s*=\s*\(\{/m;

const replacement = `const renderContentWithHighlights = (text: string) => {
    return text.split(/(\\$[A-Z0-9]+)/gi).map((part, i) => {
        if (part.startsWith('$')) {
            return <span key={i} className="text-purple-500 font-semibold">{part}</span>;
        }
        return part;
    });
};

export const Post: React.FC<{
  post: XPost;
  author: XUser | undefined;
  onQuote?: (post: XPost) => void;
  onQuoteHold?: (post: XPost) => void;
}> = ({`;

content = content.replace(toRemove, replacement);
fs.writeFileSync('components/XView.tsx', content);
console.log('fixed xview');
