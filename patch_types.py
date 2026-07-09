import re
with open('types.ts', 'r') as f:
    content = f.read()
content = content.replace("  redMicPro: RedMicProState;", "  redMicPro: RedMicProState;\n  customContributorImages?: Record<string, string>;")
with open('types.ts', 'w') as f:
    f.write(content)
