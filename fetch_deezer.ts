import { NPC_ARTIST_NAMES } from './constants';
import * as fs from 'fs';

async function run() {
    const map: Record<string, string> = {};
    const promises = NPC_ARTIST_NAMES.map(async (name) => {
        try {
            const res = await fetch("https://api.deezer.com/search/artist?q=" + encodeURIComponent(name));
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                map[name] = data.data[0].picture_medium;
            }
        } catch (e) {
            console.error('Failed', name);
        }
    });
    await Promise.all(promises);
    fs.writeFileSync('npc_images.json', JSON.stringify(map, null, 2));
    console.log("Written!");
}
run();
