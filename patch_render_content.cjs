const fs = require('fs');
let content = fs.readFileSync('components/XView.tsx', 'utf-8');

const replacementFunc = `const renderContentWithHighlights = (text: string) => {
    return text.split(/(\\$[A-Z0-9]+)/gi).map((part, i) => {
        if (part.startsWith('$')) {
            return <span key={i} className="text-purple-500 font-semibold">{part}</span>;
        }
        return part;
    });
};

export const Post: React.FC<{`;

if (!content.includes('renderContentWithHighlights')) {
    content = content.replace('export const Post: React.FC<{', replacementFunc);
    
    // Replace {post.content} in the <p>
    const regexP = /<p className="text-white whitespace-pre-wrap break-words">\n\s*\{post\.content\}\n\s*<\/p>/g;
    content = content.replace(regexP, '<p className="text-white whitespace-pre-wrap break-words">\n          {renderContentWithHighlights(post.content)}\n        </p>');
    
    fs.writeFileSync('components/XView.tsx', content);
    console.log('patched XView rendering successfully');
}
