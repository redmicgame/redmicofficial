import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = "import { ScreenshotOverlay } from './components/ScreenshotOverlay';\n" + content

old_code = """    return (
        <div className={`bg-black min-h-[100dvh] h-[100dvh] w-full flex items-center justify-center ${isGoldTheme ? 'gold-theme' : ''}`}> 
             <div className="relative bg-zinc-900 text-white w-full h-full overflow-hidden">
                {renderView()}
                {gameState.activeEncounter && <EncounterModalView />}
             </div>
        </div>
    );"""

new_code = """    return (
        <div className={`bg-black min-h-[100dvh] h-[100dvh] w-full flex items-center justify-center ${isGoldTheme ? 'gold-theme' : ''}`}> 
             <div className="relative bg-zinc-900 text-white w-full h-full overflow-hidden">
                <ScreenshotOverlay />
                {renderView()}
                {gameState.activeEncounter && <EncounterModalView />}
             </div>
        </div>
    );"""

content = content.replace(old_code, new_code)

with open('App.tsx', 'w') as f:
    f.write(content)
