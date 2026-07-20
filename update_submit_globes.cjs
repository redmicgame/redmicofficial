const fs = require('fs');
let content = fs.readFileSync('components/SubmitForGoldenGlobesView.tsx', 'utf-8');

content = content.replace(/SubmitForOscarsView/g, 'SubmitForGoldenGlobesView');
content = content.replace(/OscarAward/g, 'GoldenGlobeAward');
content = content.replace(/oscarSubmission/g, 'goldenGlobeSubmission');
content = content.replace(/SUBMIT_FOR_OSCARS/g, 'SUBMIT_FOR_GOLDEN_GLOBES');
content = content.replace(/Best Original Song/g, 'Best Original Song');
content = content.replace(/94th Academy Awards/g, 'Golden Globe Awards');

// Update Categories
content = content.replace("type CategoryName = OscarAward['category'];", "type CategoryName = GoldenGlobeAward['category'];");

const categoriesDef = `
    const categories: { name: CategoryName; type: 'song' | 'movie' | 'tv' | 'soundtrack' }[] = [
        { name: 'Best Actor/Actress', type: 'movie' }, // Allow movie and tv via UI, maybe use a general 'gig'
        { name: 'Best Supporting Actor/Actress', type: 'movie' },
        { name: 'Best Voice Acting', type: 'movie' },
        { name: 'Best TV Show', type: 'tv' },
        { name: 'Best Movie', type: 'movie' },
        { name: 'Best Soundtrack', type: 'soundtrack' },
        { name: 'Best Original Song', type: 'song' }
    ];
`;

content = content.replace(/const categories: {.*};/s, categoriesDef);
content = content.replace(/const categories:.*};/s, categoriesDef); // if single line
content = content.replace(/const categories = \[\s*\{ name: 'Best Original Song'.*\s*\];/s, categoriesDef);

fs.writeFileSync('components/SubmitForGoldenGlobesView.tsx', content);
