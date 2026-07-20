const fs = require('fs');

const file_path = '/app/applet/components/TourDetailView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const replaceStr = `                {tour.status === 'planning' && (
                    <button onClick={handleStartTour} className="w-full bg-green-600 p-3 rounded-lg font-bold hover:bg-green-500 transition-colors">Start Tour</button>
                )}`;
                
const insertStr = `                {tour.status === 'planning' && (
                    <button onClick={handleStartTour} className="w-full bg-green-600 p-3 rounded-lg font-bold hover:bg-green-500 transition-colors">Start Tour</button>
                )}
                
                {tour.status === 'finished' && (!activeArtistData.actingRoles || !activeArtistData.actingRoles.some(r => r.title === \`\${tour.name}: The Documentary\`)) && (
                    <div className="bg-zinc-800 p-4 rounded-xl space-y-3 border border-zinc-700">
                        <h3 className="font-bold text-lg text-white">Release Tour Documentary</h3>
                        <p className="text-sm text-zinc-400">Release a movie documenting the tour to boost hype and popularity, which will appear on your IMDb profile.</p>
                        <button 
                            onClick={() => {
                                dispatch({ type: 'RELEASE_TOUR_DOCUMENTARY', payload: { tourId: tour.id, coverUrl: tour.bannerImage }});
                                alert("Documentary Released!");
                            }} 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition-colors"
                        >
                            Release Documentary
                        </button>
                    </div>
                )}`;

content = content.replace(replaceStr, insertStr);

fs.writeFileSync(file_path, content);
console.log("Patched TourDetailView for Documentary");
