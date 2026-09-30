import { InstagramChannelReaction } from "../types";

export const INSTAGRAM_CHANNEL_EMOJIS = ['❤️', '🔥', '😍', '👏', '🙌', '😂', '😮', '😢', '💯', '🚀'];

/**
 * Generates initial emoji reactions from channel fans for a broadcast message.
 * The total volume and distribution of reactions directly scales with the number of members in the channel.
 */
export function generateInstagramChannelReactions(memberCount: number, startAtOne: boolean = true): InstagramChannelReaction[] {
  const effectiveMembers = Math.max(12, memberCount);
  
  // A realistic percentage of broadcast channel members react (8% to 25%)
  const engagementRate = 0.08 + Math.random() * 0.17;
  const totalReactions = Math.max(2, Math.floor(effectiveMembers * engagementRate));
  
  const emojiDefs = [
    { emoji: '❤️', weight: 0.45 },
    { emoji: '🔥', weight: 0.25 },
    { emoji: '😍', weight: 0.15 },
    { emoji: '👏', weight: 0.10 },
    { emoji: '🙌', weight: 0.05 },
  ];

  return emojiDefs.map(item => {
    const variance = 0.8 + Math.random() * 0.4;
    const finalCount = Math.max(1, Math.round(totalReactions * item.weight * variance));
    return {
      emoji: item.emoji,
      count: startAtOne ? 1 : finalCount,
      targetCount: finalCount,
      userReacted: false,
    };
  }).filter(r => (r.targetCount || r.count) > 0);
}

/**
 * Calculates the growth duration in milliseconds based on the channel's member count.
 * Exactly matches user specification: ~30 minutes for 10k members.
 */
export function calculateReactionGrowthDuration(memberCount: number): number {
  const members = Math.max(10, memberCount);
  const minutes = (members / 10000) * 30;
  // Clamp between 3 minutes (minimum) and 180 minutes (3 hours maximum)
  const clampedMinutes = Math.max(3, Math.min(180, minutes));
  return Math.round(clampedMinutes * 60 * 1000);
}
