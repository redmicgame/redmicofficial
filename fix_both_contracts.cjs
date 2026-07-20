const fs = require('fs');
let content = fs.readFileSync('context/GameContext.tsx', 'utf-8');

// The botched PRO_SIGN_LABEL block from 15858 to 15910
const proSignRegex = /case "PRO_SIGN_LABEL": \{[\s\S]*?newContract\.advance = advance;/m;

content = content.replace(proSignRegex, `case "PRO_SIGN_LABEL": {
      if (!state.activeArtistId) return state;
      const { labelId } = action.payload;
      const activeData = state.artistsData[state.activeArtistId];
      const artist = allPlayerArtistsAndGroups.find(
        (a) => a.id === state.activeArtistId,
      );
      const label = LABELS.find((l) => l.id === labelId);
      let newPosts: XPost[] = [];
      let advance = 0;

      if (label && artist) {
        if (label.isDistributionOnly) {
          advance = 0;
        } else if (label.contractType === "petty") {
          advance = 1000000;
        } else if (label.id === "umg" || label.id === "sony") {
          advance = 2500000;
        } else if (
          label.tier === "Mid-high" ||
          label.tier === "Mid-Low" ||
          label.tier === "Top"
        ) {
          advance = 750000;
        } else if (label.tier === "Low") {
          advance = 300000;
        }
      }

      const newContract: Contract = createDefaultContract({
        labelId,
        artistId: state.activeArtistId,
        startDate: state.date,
        durationWeeks: 156, // 3 years
        albumQuota: 3,
        albumsReleased: 0,
        advance
      });`);

// Now fix RENEW_CONTRACT which is untouched
const renewRegex = /case "RENEW_CONTRACT": \{[\s\S]*?currentView: "game",\n      \};/m;
const renewMatch = content.match(renewRegex);
if (renewMatch) {
    const renewReplacement = `case "RENEW_CONTRACT": {
      if (!state.contractRenewalOffer) return state;
      const { labelId, isCustom, artistId } = state.contractRenewalOffer;
      const artistData = state.artistsData[artistId];
      if (!artistData) return state;

      const allCustomLabels: CustomLabel[] = Object.values(
        state.artistsData,
      ).flatMap((d) => d.customLabels);
      const label = isCustom ? allCustomLabels.find((l) => l.id === labelId) : LABELS.find((l) => l.id === labelId);
      
      let advance = 0;
      if (label && !isCustom) {
        const stdLabel = label as Label;
        if (stdLabel.isDistributionOnly) advance = 0;
        else if (stdLabel.contractType === "petty") advance = 1000000;
        else if (stdLabel.id === "umg" || stdLabel.id === "sony") advance = 2500000;
        else if (stdLabel.tier === "Mid-high" || stdLabel.tier === "Mid-Low" || stdLabel.tier === "Top") advance = 750000;
        else if (stdLabel.tier === "Low") advance = 300000;
      }

      const newContract: Contract = createDefaultContract({
        labelId,
        isCustom,
        artistId,
        startDate: state.date,
        durationWeeks: 104, // 2 years
        albumQuota: 2, // A standard renewal deal
        albumsReleased: 0,
        advance,
        royaltyPercent: 20 // slightly better royalty for renewal
      });

      const updatedData = { ...artistData, money: artistData.money + advance, contract: newContract, isBlacklistedByLabel: false };

      return {
        ...state,
        artistsData: { ...state.artistsData, [artistId]: updatedData },
        contractRenewalOffer: null,
        currentView: "game",
      };`;
    content = content.replace(renewRegex, renewReplacement);
}

fs.writeFileSync('context/GameContext.tsx', content);
console.log("Fixed PRO_SIGN_LABEL and RENEW_CONTRACT");
