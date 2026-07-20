const fs = require('fs');
let file_path = '/app/applet/components/AchievementsView.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const targetStr = `                <AchievementCard title="Highest First Week Album Sales (SPS)" accentColorClass="text-purple-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => Math.floor((item.firstWeekStreams ?? 0) / 1500)} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>`;

const insertStr = `                <AchievementCard title="Highest First Week Album Sales (SPS)" accentColorClass="text-purple-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => Math.floor((item.firstWeekStreams ?? 0) / 1500) + Math.floor(item.firstWeekSales ?? 0)} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>`;

content = content.replace(targetStr, insertStr);

const targetStr2 = `Math.floor((item.firstWeekStreams ?? 0) / 1500)`;
// wait, for the "Top First Week Album/EP Sales" (prior to 2008), we should also include pure sales!
// Let's find it.
