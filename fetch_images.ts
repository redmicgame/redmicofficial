import * as fs from 'fs';

const names = [
    'Taylor Swift', 'Ariana Grande', 'Billie Eilish', 'The Weeknd', 'Drake', 
    'Justin Bieber', 'Ed Sheeran', 'Beyoncé', 'Rihanna', 'Adele', 
    'Post Malone', 'Dua Lipa', 'Olivia Rodrigo', 'Harry Styles', 'Bad Bunny',
    'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Doja Cat', 'SZA',
    'Lana Del Rey', 'Frank Ocean', 'Tyler, the Creator', 'Lil Nas X', 'Cardi B',
    'Nicki Minaj', 'Megan Thee Stallion', 'Kanye West', 'Jay-Z', 'Eminem',
    'Lady Gaga', 'Bruno Mars', 'Miley Cyrus', 'Selena Gomez', 'Demi Lovato',
    'Shawn Mendes', 'Camila Cabello', 'Halsey', 'Lorde', 'Charli XCX',
    'Coldplay', 'Imagine Dragons', 'Maroon 5', 'OneRepublic', 'Arctic Monkeys',
    'The 1975', 'Tame Impala', 'Glass Animals', 'FINNEAS', 'Jack Harlow',
    'Sabrina Carpenter', 'Tate McRae', 'Chappell Roan', 'Ice Spice', '21 Savage',
    'Future', 'Metro Boomin', 'Morgan Wallen', 'Luke Combs', 'Zach Bryan',
    'Peso Pluma', 'Karol G', 'Shakira', 'Rauw Alejandro', 'Anitta',
    'Latto', 'GloRilla', 'Sexyy Red', 'Coi Leray', 'Flo Milli',
    'BTS (band)', 'Blackpink', 'NewJeans', 'Stray Kids', 'Twice', 'Seventeen (band)', 'Le Sserafim', '(G)I-dle', 'Jungkook', 'Jennie (singer)', 'Lisa (rapper)', 'Aespa',
    'J Balvin', 'Maluma', 'Rosalía', 'Feid', 'Myke Towers', 'Young Miko', 'Ozuna', 'Bizarrap'
];

async function run() {
    const map: Record<string, string> = {};
    for (const name of names) {
        let success = false;
        while(!success) {
            try {
                const query = encodeURIComponent(name);
                const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${query}&prop=pageimages&format=json&pithumbsize=500`);
                if(res.status === 429) {
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                const data = await res.json();
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];
                if (pageId !== '-1' && pages[pageId].thumbnail) {
                    const keyName = name.replace(/ \([^)]+\)/, '');
                    map[keyName] = pages[pageId].thumbnail.source;
                }
                success = true;
                await new Promise(r => setTimeout(r, 200));
            } catch(e) {
                console.error("error for", name);
                success = true; // skip on other error
            }
        }
    }
    fs.writeFileSync('npc_images.json', JSON.stringify(map, null, 2));
    console.log("Written to npc_images.json");
}
run();
