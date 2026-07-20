const fs = require('fs');

const file_path = '/app/applet/components/ReleaseView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const replaceHTML = `                {releaseType === 'Album (Deluxe)' ? (`;
const insertHTML = `                {releaseType === 'Live Album' ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="live-tour" className="block text-sm font-medium text-zinc-300">Select Completed Tour</label>
                            <select
                                id="live-tour"
                                value={selectedLiveTourId}
                                onChange={(e) => setSelectedLiveTourId(e.target.value)}
                                className="mt-1 block w-full bg-zinc-800 border-zinc-700 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"
                            >
                                <option value="">Select a tour</option>
                                {activeArtistData.tours.filter(t => t.status === 'finished').map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : releaseType === 'Album (Deluxe)' ? (`;

content = content.replace(replaceHTML, insertHTML);

// For the submit handler:
const submitLogic = `        if (contract) {
            const submission: LabelSubmission = {
                id: crypto.randomUUID(),
                release: newRelease,
                status: 'pending',
                dateSubmitted: date,
                projectReleaseDate: null,
                singlesToRelease: 0,
                promoBudget: 0,
                promoBudgetSpent: 0
            };
            dispatch({ type: 'SUBMIT_TO_LABEL', payload: { submission }});
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
        } else {
            dispatch({ type: 'RELEASE_PROJECT', payload: { release: newRelease } });
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
        }`;

const newSubmitLogic = `        if (releaseType === 'Live Album') {
            dispatch({ type: 'CREATE_LIVE_ALBUM', payload: { tourId: selectedLiveTourId, coverArt: coverArt! } });
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
            return;
        }

        if (contract) {
            const submission: LabelSubmission = {
                id: crypto.randomUUID(),
                release: newRelease,
                status: 'pending',
                dateSubmitted: date,
                projectReleaseDate: null,
                singlesToRelease: 0,
                promoBudget: 0,
                promoBudgetSpent: 0
            };
            dispatch({ type: 'SUBMIT_TO_LABEL', payload: { submission }});
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
        } else {
            dispatch({ type: 'RELEASE_PROJECT', payload: { release: newRelease } });
            dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
        }`;

content = content.replace(submitLogic, newSubmitLogic);

fs.writeFileSync(file_path, content);
console.log("Patched ReleaseView HTML and logic");
