with open('types.ts', 'r') as f:
    content = f.read()

content = content.replace('trait?: "Smash Hit" | "TikTok Hit" | "Slow Burner" | "Flop" | "Radio Hit";', 'trait?: "Smash Hit" | "TikTok Hit" | "Slow Burner" | "Flop" | "Radio Hit" | "Normal";')

with open('types.ts', 'w') as f:
    f.write(content)
