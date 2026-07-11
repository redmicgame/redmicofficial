import fs from 'fs';

let code = fs.readFileSync('components/SpotifySnapshotView.tsx', 'utf8');

const target1 = `const getRowData = (song: Song) => {
        const weekStreams = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
        const prevStreams = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);`;
        
const repl1 = `const getRowData = (song: Song) => {
        const weekStreams = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
        const prevStreams = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);
        
        const dailyStreams = Math.floor(weekStreams / 7);
        const prevDailyStreams = Math.floor(prevStreams / 7);`;

code = code.replace(target1, repl1);

const target2 = `if (prevStreams > 0) {
            const change = ((weekStreams - prevStreams) / prevStreams) * 100;
            changePercentDisplay = \`\${change >= 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            const rawChange = weekStreams - prevStreams;
            changeDisplay = \`\${rawChange >= 0 ? '+' : ''}\${rawChange.toLocaleString()}\`;
        } else if (weekStreams > 0) {
            changePercentDisplay = '+NEW';
            changeDisplay = \`+\${weekStreams.toLocaleString()}\`;
        }

        return { weekStreams, prevStreams, changePercentDisplay, changeDisplay, netWeekly: weekStreams };`;

const repl2 = `if (prevDailyStreams > 0) {
            const change = ((dailyStreams - prevDailyStreams) / prevDailyStreams) * 100;
            changePercentDisplay = \`\${change >= 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            const rawChange = dailyStreams - prevDailyStreams;
            changeDisplay = \`\${rawChange >= 0 ? '+' : ''}\${rawChange.toLocaleString()}\`;
        } else if (dailyStreams > 0) {
            changePercentDisplay = '+NEW';
            changeDisplay = \`+\${dailyStreams.toLocaleString()}\`;
        }

        return { changePercentDisplay, changeDisplay, netDaily: dailyStreams };`;
        
code = code.replace(target2, repl2);

const target3 = `const isNegative = data.netWeekly < 0;`;
const repl3 = `const isNegative = data.netDaily < 0;`;
code = code.replace(target3, repl3);

const target4 = `{isNegative ? '' : '+'}{data.netWeekly.toLocaleString()}`;
const repl4 = `{isNegative ? '' : '+'}{data.netDaily.toLocaleString()}`;
code = code.replace(target4, repl4);

const target5 = `const totalWeeklyStreams = songsList.reduce((acc, song) => {
            const w = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
            return acc + w;
        }, 0);
        const totalPrevWeeklyStreams = songsList.reduce((acc, song) => {
            const p = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);
            return acc + p;
        }, 0);`;
const repl5 = `const totalWeeklyStreams = songsList.reduce((acc, song) => {
            const w = song.actualLastWeekStreams !== undefined ? song.actualLastWeekStreams : (song.lastWeekStreams || 0);
            return acc + w;
        }, 0);
        const totalPrevWeeklyStreams = songsList.reduce((acc, song) => {
            const p = song.actualPrevWeekStreams !== undefined ? song.actualPrevWeekStreams : (song.prevWeekStreams || 0);
            return acc + p;
        }, 0);
        
        const totalDailyStreams = Math.floor(totalWeeklyStreams / 7);
        const totalPrevDailyStreams = Math.floor(totalPrevWeeklyStreams / 7);`;
code = code.replace(target5, repl5);

const target6 = `if (totalPrevWeeklyStreams > 0) {
            const change = ((totalWeeklyStreams - totalPrevWeeklyStreams) / totalPrevWeeklyStreams) * 100;
            changePercentDisplay = \`\${change >= 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            const rawChange = totalWeeklyStreams - totalPrevWeeklyStreams;
            changeDisplay = \`\${rawChange >= 0 ? '+' : ''}\${rawChange.toLocaleString()}\`;
        } else if (totalWeeklyStreams > 0) {
            changePercentDisplay = '+NEW';
            changeDisplay = \`+\${totalWeeklyStreams.toLocaleString()}\`;
        }`;
const repl6 = `if (totalPrevDailyStreams > 0) {
            const change = ((totalDailyStreams - totalPrevDailyStreams) / totalPrevDailyStreams) * 100;
            changePercentDisplay = \`\${change >= 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            const rawChange = totalDailyStreams - totalPrevDailyStreams;
            changeDisplay = \`\${rawChange >= 0 ? '+' : ''}\${rawChange.toLocaleString()}\`;
        } else if (totalDailyStreams > 0) {
            changePercentDisplay = '+NEW';
            changeDisplay = \`+\${totalDailyStreams.toLocaleString()}\`;
        }`;
code = code.replace(target6, repl6);

const target7 = `{totalWeeklyStreams >= 0 ? '+' : ''}{totalWeeklyStreams.toLocaleString()}`;
const repl7 = `{totalDailyStreams >= 0 ? '+' : ''}{totalDailyStreams.toLocaleString()}`;
code = code.replace(target7, repl7);

fs.writeFileSync('components/SpotifySnapshotView.tsx', code);
