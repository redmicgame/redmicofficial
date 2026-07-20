const fs = require('fs');
let file_path = '/app/applet/context/GameContext.tsx';
let content = fs.readFileSync(file_path, 'utf8');

const targetStr = `          if (deluxeVersion && deluxeVersion.releaseDate) {
            if (
              newDate.year * 52 +
                newDate.week -
                (deluxeVersion.releaseDate.year * 52 +
                  deluxeVersion.releaseDate.week) ===
              1
            ) {
              totalWeeklySales += deluxeVersion.preorderSales || 0;
            }
          }`;

const insertStr = `          if (deluxeVersion && deluxeVersion.releaseDate) {
            if (
              newDate.year * 52 +
                newDate.week -
                (deluxeVersion.releaseDate.year * 52 +
                  deluxeVersion.releaseDate.week) ===
              1
            ) {
              totalWeeklySales += deluxeVersion.preorderSales || 0;
            }
          }
          
          if (
            newDate.year * 52 +
              newDate.week -
              (relDate.year * 52 + relDate.week) ===
            1
          ) {
            release.firstWeekSales = totalWeeklySales;
          }`;

content = content.replace(targetStr, insertStr);
fs.writeFileSync(file_path, content);
console.log("Patched GameContext for firstWeekSales");
