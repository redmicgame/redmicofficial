const fs = require('fs');

const file_path = '/app/applet/components/YouTubeView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

content = content.replace(
    "{channel?.name} • {formatNumber(video.views)} views • {formatTimeAgo(video.releaseDate, date)}",
    "{channel?.name} • {video.isScheduled ? 'Scheduled for ' + video.releaseDate.year + ' W' + video.releaseDate.week : formatNumber(video.views) + ' views • ' + formatTimeAgo(video.releaseDate, date)}"
);

content = content.replace(
    "<p className=\"text-xs text-zinc-400\">{formatNumber(video.views)} views • {formatTimeAgo(video.releaseDate, date)}</p>",
    "<p className=\"text-xs text-zinc-400\">{video.isScheduled ? 'Scheduled for ' + video.releaseDate.year + ' W' + video.releaseDate.week : formatNumber(video.views) + ' views • ' + formatTimeAgo(video.releaseDate, date)}</p>"
);

fs.writeFileSync(file_path, content);
console.log("Patched YouTubeView");
