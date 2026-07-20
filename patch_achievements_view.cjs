const fs = require('fs');

let file = '/app/applet/components/AchievementsView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                <AchievementCard title={gameState.date.year >= 2008 ? "Top First Week Album/EP Streams" : "Top First Week Album/EP Sales"} accentColorClass="text-green-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek}
                        getValue={(item) => gameState.date.year >= 2008 ? (item.firstWeekStreams ?? 0) : (Math.floor((item.firstWeekStreams ?? 0) / 1500) + Math.floor(item.firstWeekSales ?? 0))}
                        emptyMessage="No projects with first week data yet."
                    />
                </AchievementCard>

                <AchievementCard title="Highest First Week Album Sales (SPS)" accentColorClass="text-purple-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek}
                        getValue={(item) => Math.floor((item.firstWeekStreams ?? 0) / 1500) + Math.floor(item.firstWeekSales ?? 0)}
                        emptyMessage="No projects with first week data yet."
                    />
                </AchievementCard>`;

const replacement = `                <AchievementCard title="Top First Week Album/EP Units (SPS)" accentColorClass="text-green-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek}
                        getValue={(item) => Math.floor((item.firstWeekStreams ?? 0) / 1500) + Math.floor(item.firstWeekSales ?? 0)}
                        emptyMessage="No projects with first week data yet."
                    />
                </AchievementCard>
                
                <AchievementCard title="Top First Week Album/EP Streams" accentColorClass="text-purple-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek}
                        getValue={(item) => item.firstWeekStreams ?? 0}
                        emptyMessage="No projects with first week data yet."
                    />
                </AchievementCard>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log("Patched achievements view");
