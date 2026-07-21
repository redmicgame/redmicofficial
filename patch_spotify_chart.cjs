const fs = require('fs');
const file = '/app/applet/components/SpotifyChartView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\{\/\* Chart Links \*\/\}/,
    `{/* Chart Links */}
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'spotifyVideoChart'})} className="w-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4 rounded-lg text-left text-black shadow-lg">
                    <p className="font-bold text-lg text-white">Music Video Charts Global</p>
                    <p className="text-white/80">Top 30 Global</p>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="w-16 h-16 bg-black rounded-md flex items-center justify-center text-white font-bold text-xs">
                            Daily Music<br/>Charts
                        </div>
                        <div className="text-white">
                            <p className="font-bold text-sm">UPDATED DAILY</p>
                            <p className="text-sm opacity-80">Check out the most watched videos</p>
                        </div>
                    </div>
                </button>
`
);

fs.writeFileSync(file, content);
