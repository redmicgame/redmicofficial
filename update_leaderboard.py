with open('components/LiveLeaderboardView.tsx', 'r') as f:
    content = f.read()

import re
# Remove the !user block
# We want to replace everything from `{!user ? (` down to `) : (` with just `<div className="p-4 overflow-y-auto pb-24">`.
# And we need to remove the trailing `)}` before the final `</div>`.
pattern1 = r'\{!user \? \(\s*<div className="p-8.*?</div>\s*\) : \(\s*(<div className="p-4 overflow-y-auto pb-24">)'
content = re.sub(pattern1, r'\1', content, flags=re.DOTALL)

# At the end of the file, we have:
#                 </div>
#             )}
#         </div>
#     );
# };
# We need to remove that `)}`
pattern2 = r'                </div>\s*\)\}\s*</div>\s*\);\s*\};'
content = re.sub(pattern2, r'                </div>\n        </div>\n    );\n};', content)

# Update the button
old_button = r'''<button\s*onClick=\{handleSync\}\s*disabled=\{syncing\}\s*className=\{`px-4 py-2 rounded-lg text-sm font-bold \$\{syncing \? 'bg-zinc-700 text-zinc-400' : 'bg-green-600 hover:bg-green-500 text-white'\} transition-colors`\}\s*>\s*\{syncing \? `Syncing\.\.\. \$\{syncProgress\}%` : 'Sync My Saves'\}\s*</button>'''
new_button = '''<button
                                onClick={!user ? undefined : handleSync}
                                disabled={!user || syncing}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${!user ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed' : syncing ? 'bg-zinc-700 text-zinc-400' : 'bg-green-600 hover:bg-green-500 text-white'} transition-colors`}
                                title={!user ? "Sign in via Settings to sync saves" : ""}
                            >
                                {!user ? 'Sign in to Sync' : syncing ? `Syncing... ${syncProgress}%` : 'Sync My Saves'}
                            </button>'''
content = re.sub(old_button, new_button, content)

with open('components/LiveLeaderboardView.tsx', 'w') as f:
    f.write(content)
