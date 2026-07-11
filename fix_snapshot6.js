import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const targetHeaders = `<th className="text-center p-3 font-bold border border-gray-600" colSpan={2}>Change</th>`;
const replHeaders = `<th className="text-center p-3 font-bold border border-gray-600 border-r-0">% Change</th>
                                <th className="text-center p-3 font-bold border border-gray-600 border-l-0">Net Change</th>`;
code = code.replace(targetHeaders, replHeaders);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
