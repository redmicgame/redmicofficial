import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const targetHeader = `<th className="text-center p-3 font-bold border border-gray-600 border-r-0">% Change</th>
                                <th className="text-center p-3 font-bold border border-gray-600 border-l-0">Net Change</th>`;
const replHeader = `<th className="text-center p-3 font-bold border border-gray-600">% Change</th>
                                <th className="text-center p-3 font-bold border border-gray-600">Net Change</th>`;

code = code.replace(targetHeader, replHeader);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
