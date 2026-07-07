import re

with open('types.ts', 'r') as f:
    content = f.read()

content = content.replace(
    '  flopEraLock?: boolean;\n  money: number;',
    '  flopEraLock?: boolean;\n  isBlacklistedByLabel?: boolean;\n  money: number;'
)

with open('types.ts', 'w') as f:
    f.write(content)
