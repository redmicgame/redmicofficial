import re

with open('types.ts', 'r') as f:
    content = f.read()

old_dupe = """  actingRoles?: ActingRole[];
  location?: string;
  lastMoveDate?: GameDate;
  yearlyIncomeForTax?: number;"""

new_dupe = """  actingRoles?: ActingRole[];
  yearlyIncomeForTax?: number;"""

content = content.replace(old_dupe, new_dupe)

with open('types.ts', 'w') as f:
    f.write(content)
