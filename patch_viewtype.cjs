const fs = require('fs');

let typesContent = fs.readFileSync('types.ts', 'utf-8');
if (!typesContent.includes('| "goldenGlobes"')) {
    typesContent = typesContent.replace('| "oscars"', '| "oscars"\n  | "goldenGlobes"\n  | "submit_for_golden_globes"');
    fs.writeFileSync('types.ts', typesContent);
    console.log("Patched ViewType in types.ts");
}

let appContent = fs.readFileSync('App.tsx', 'utf-8');
if (!appContent.includes('GoldenGlobesView')) {
    appContent = "import GoldenGlobesView from './components/GoldenGlobesView';\nimport SubmitForGoldenGlobesView from './components/SubmitForGoldenGlobesView';\n" + appContent;
    
    appContent = appContent.replace(
        "case 'oscars':\n        return <OscarsView />;",
        "case 'oscars':\n        return <OscarsView />;\n      case 'goldenGlobes':\n        return <GoldenGlobesView />;\n      case 'submit_for_golden_globes':\n        return <SubmitForGoldenGlobesView />;"
    );
    fs.writeFileSync('App.tsx', appContent);
    console.log("Patched App.tsx");
}
