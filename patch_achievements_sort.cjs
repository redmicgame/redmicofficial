const fs = require('fs');
let file_path = '/app/applet/components/AchievementsView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const target = `    const topAlbumsFirstWeek = useMemo(() => releases
        .filter(r => (r.type === 'Album' || r.type === 'EP' || r.type === 'Album (Deluxe)' || r.type === 'Compilation') && typeof r.firstWeekStreams === 'number')
        .sort((a, b) => (b.firstWeekStreams ?? 0) - (a.firstWeekStreams ?? 0)), [releases]);`;

const replacement = `    const topAlbumsFirstWeek = useMemo(() => releases
        .filter(r => (r.type === 'Album' || r.type === 'EP' || r.type === 'Album (Deluxe)' || r.type === 'Compilation') && typeof r.firstWeekStreams === 'number')
        .sort((a, b) => {
            const bSPS = Math.floor((b.firstWeekStreams ?? 0) / 1500) + Math.floor(b.firstWeekSales ?? 0);
            const aSPS = Math.floor((a.firstWeekStreams ?? 0) / 1500) + Math.floor(a.firstWeekSales ?? 0);
            return bSPS - aSPS;
        }), [releases]);`;

content = content.replace(target, replacement);

fs.writeFileSync(file_path, content);
console.log("Patched sorting for achievements view");
