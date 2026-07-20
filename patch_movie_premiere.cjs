const fs = require('fs');
let file = '/app/applet/components/MoviePremiereRedCarpetView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleAttend = \(\) => \{\n\s*if \(lookUrl\) \{\n\s*dispatch\(\{ type: 'ACCEPT_MOVIE_PREMIERE_RED_CARPET', payload: \{ emailId: activeMoviePremiereOffer\.emailId, lookUrl \}\}\);\n\s*\}\n\s*\};/;
const replacement = `const [location, setLocation] = useState<string>('Los Angeles');
    
    const locations = ["New York City", "Los Angeles", "Paris", "Dubai", "London", "Tokyo", "London Leicester Square", "Hollywood", "Cannes", "Venice"];

    const handleAttend = () => {
        if (lookUrl) {
            dispatch({ type: 'ACCEPT_MOVIE_PREMIERE_RED_CARPET', payload: { emailId: activeMoviePremiereOffer.emailId, lookUrl, location }});
        }
    };`;
content = content.replace(regex, replacement);

const returnRegex = /<h2 className="text-3xl font-bold text-yellow-500">Upload Your Look<\/h2>\n\s*<p className="text-zinc-400 max-w-sm">Outlets want to post your Oscars red carpet arrival\. Upload an image or video still\.<\/p>/;
const returnReplacement = `<h2 className="text-3xl font-bold text-yellow-500">Premiere Red Carpet</h2>
                <p className="text-zinc-400 max-w-sm">Outlets want to post your movie premiere red carpet arrival. Upload an image or video still.</p>
                <div className="w-full max-w-sm text-left">
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Select Premiere Location</label>
                    <select 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500 text-white"
                    >
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>`;
content = content.replace(returnRegex, returnReplacement);

const backRegex = /<button onClick=\{\(\) => dispatch\(\{type: 'DECLINE_OSCAR_RED_CARPET', payload: \{emailId: activeMoviePremiereOffer\.emailId\}\}\)\} className="p-2 rounded-full hover:bg-white\/10">/
const backReplacement = `<button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'inbox'})} className="p-2 rounded-full hover:bg-white/10">`
content = content.replace(backRegex, backReplacement);

fs.writeFileSync(file, content);
console.log('Patched MoviePremiereRedCarpetView.tsx');
