const fs = require('fs');
let file_path = '/app/applet/components/AchievementsView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const str1 = `                <AchievementCard title={gameState.date.year >= 2008 ? "Top First Week Album/EP Streams" : "Top First Week Album/EP Sales"} accentColorClass="text-green-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => gameState.date.year >= 2008 ? (item.firstWeekStreams ?? 0) : Math.floor((item.firstWeekStreams ?? 0) / 1500)} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>`;

const rep1 = `                <AchievementCard title={gameState.date.year >= 2008 ? "Top First Week Album/EP Streams" : "Top First Week Album/EP Sales"} accentColorClass="text-green-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => gameState.date.year >= 2008 ? (item.firstWeekStreams ?? 0) : (Math.floor((item.firstWeekStreams ?? 0) / 1500) + Math.floor(item.firstWeekSales ?? 0))} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>`;

const str2 = `                <AchievementCard title="Highest First Week Album Sales (SPS)" accentColorClass="text-purple-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => Math.floor((item.firstWeekStreams ?? 0) / 1500)} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>`;

const rep2 = `                <AchievementCard title="Highest First Week Album Sales (SPS)" accentColorClass="text-purple-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => Math.floor((item.firstWeekStreams ?? 0) / 1500) + Math.floor(item.firstWeekSales ?? 0)} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>`;

content = content.replace(str1, rep1).replace(str2, rep2);
fs.writeFileSync(file_path, content);
console.log("Patched achievements");
