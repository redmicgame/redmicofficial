const fs = require('fs');

const file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const replaceStr = `          if (Math.random() < suspensionChance) {
            const playerAccounts = artistData.xUsers.filter((u) => u.isPlayer);
            const suspendedAccountId =
              artistData.selectedPlayerXUserId || playerAccounts[0]?.id;
            artistData.xSuspensionStatus = {`;
            
const insertStr = `          if (Math.random() < suspensionChance) {
            const playerAccounts = artistData.xUsers.filter((u) => u.isPlayer);
            const suspendedAccountId =
              artistData.selectedPlayerXUserId || playerAccounts[0]?.id;
            const account = artistData.xUsers.find(u => u.id === suspendedAccountId);
            if (!account || !account.isVerified) {
            artistData.xSuspensionStatus = {`;

if(content.includes(replaceStr)) {
    content = content.replace(replaceStr, insertStr);
    
    // Now we need to add the closing brace for `if (!account || !account.isVerified) {`
    // Let's find the end of this block.
    // It ends with:
    //             });
    //           }
    //         }
    const replaceEnd = `                });
              }
            }
          }`;
    const insertEnd = `                });
              }
            }
            }
          }`;
          
    content = content.replace(replaceEnd, insertEnd);
    fs.writeFileSync(file_path, content);
    console.log("Patched X suspension");
} else {
    console.log("Could not find string");
}

