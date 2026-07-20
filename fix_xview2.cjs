const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const startIdx = content.indexOf('const renderContentWithHighlights = (text: string) => {');
const endIdx = content.indexOf('}> = ({ post, author, onQuote, onQuoteHold }) => {');

if (startIdx > -1 && endIdx > -1) {
    const replacement = `const renderContentWithHighlights = (text: string) => {
    return text.split(/(\\$[a-zA-Z0-9]+)/g).map((part, i) => {
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
`;
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync('components/XView.tsx', content);
    console.log('Fixed exactly!');
}
