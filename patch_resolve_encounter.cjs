const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

const targetStr = `            money: Math.max(0, activeData.money + (choice.moneyEffect || 0)),`;

const newLogic = `
            money: Math.max(0, activeData.money + (choice.moneyEffect || 0)),
            recurringExpenses: (() => {
              let exps = activeData.recurringExpenses || [];
              if (choice.label.includes("Annulment")) {
                exps = [...exps, { id: Date.now().toString(), name: "Annulment", cost: 50000, type: "monthly" }];
              }
              if (choice.label.includes("Child Support") || choice.label.includes("Agree to pay")) {
                exps = [...exps, { id: Date.now().toString(), name: "Child Support", cost: 25000, type: "monthly" }];
              }
              return exps;
            })(),
            relationships: (() => {
              let rels = activeData.relationships || [];
              if (state.activeEncounter?.id === "lawsuit_divorce" || state.activeEncounter?.id === "lawsuit_annulment") {
                 // End all marriages
                 return rels.map(r => r.status === 'married' ? { ...r, status: 'ex', endYear: state.date.year, endWeek: state.date.week } : r);
              }
              return rels;
            })(),`;

content = content.replace(targetStr, newLogic);
fs.writeFileSync('context/GameContext.tsx', content);
