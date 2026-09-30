import { ArtistData, GameDate, XPost, XComment, XUser } from "../types";
import { formatNumber } from "../context/GameContext";

/**
 * Generates smart, contextual X posts by fans and haters that react to:
 * - What the player posted on Instagram (posts & reels)
 * - The player's OnlyFans account
 * - The player's Instagram Broadcast Channel
 * - The player's TikTok videos
 * - The player's Public Image (sweet/humble angel vs arrogant/villain era)
 * - The player's Children / Kids
 * - The player's Exes and current Relationships
 */
export function generateSmartFanPosts(
  artistData: ArtistData,
  artistName: string,
  date: GameDate
): XPost[] {
  const posts: XPost[] = [];
  const allUsers = artistData.xUsers || [];
  const fanUsers = allUsers.filter(
    (u) => !u.isPlayer && !u.isVerified && (u.id.startsWith("fan") || u.id.startsWith("addiction") || u.id.includes("stan"))
  );
  const haterUsers = allUsers.filter(
    (u) => !u.isPlayer && (u.id.startsWith("hater") || u.id.includes("critic"))
  );

  const defaultFan: XUser = fanUsers[0] || {
    id: "fan_smart_1",
    name: `${artistName} Updates`,
    username: `${artistName.toLowerCase().replace(/[^a-z0-9]/g, "")}daily`,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
    isVerified: false,
    followersCount: 45000,
    followingCount: 120,
  };

  const defaultHater: XUser = haterUsers[0] || {
    id: "hater_smart_1",
    name: "Pop Reality Check",
    username: "poprealitycheck",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
    isVerified: false,
    followersCount: 28000,
    followingCount: 85,
  };

  const pickFan = () => (fanUsers.length > 0 ? fanUsers[Math.floor(Math.random() * fanUsers.length)] : defaultFan);
  const pickHater = () => (haterUsers.length > 0 ? haterUsers[Math.floor(Math.random() * haterUsers.length)] : defaultHater);

  // 1. Instagram Posts & Reels
  if (artistData.instagramPosts && artistData.instagramPosts.length > 0 && Math.random() < 0.45) {
    const recentPost = artistData.instagramPosts[0];
    const templates = [
      `did y'all see what ${artistName} posted on instagram?! the visuals are UNREAL 😭`,
      `${artistName}'s new instagram photo dump literally cleared every aesthetic this year.`,
      `the caption "${recentPost.caption ? recentPost.caption.slice(0, 40) + '...' : '...'}" on ${artistName}'s new ig post... something huge is coming`,
      `everyone go like and comment on ${artistName}'s new instagram post right now!! 📸`,
      `${artistName} on instagram today. that's it. that's the whole tweet. pure perfection`,
    ];
    posts.push({
      id: crypto.randomUUID(),
      authorId: pickFan().id,
      content: templates[Math.floor(Math.random() * templates.length)],
      image: recentPost.imageUrls?.[0] || '',
      likes: Math.floor(Math.random() * 45000) + 12000,
      retweets: Math.floor(Math.random() * 8000) + 2000,
      views: Math.floor(Math.random() * 600000) + 150000,
      date,
    });
  }

  if (artistData.instagramReels && artistData.instagramReels.length > 0 && Math.random() < 0.35) {
    const recentReel = artistData.instagramReels[0];
    const templates = [
      `not ${artistName} becoming an instagram reels comedian lmaoo i've watched this 50 times 😭`,
      `${artistName}'s new reel already racking up ${formatNumber(recentReel.views)} views on instagram! pure star quality`,
      `the way ${artistName} is hilarious on instagram reels... need them in a comedy movie immediately`,
      `i literally cannot stop replaying ${artistName}'s latest reel on ig help me`,
    ];
    posts.push({
      id: crypto.randomUUID(),
      authorId: pickFan().id,
      content: templates[Math.floor(Math.random() * templates.length)],
      image: recentReel.videoUrl,
      likes: Math.floor(Math.random() * 38000) + 9000,
      retweets: Math.floor(Math.random() * 6500) + 1500,
      views: Math.floor(Math.random() * 500000) + 120000,
      date,
    });
  }

  // 2. OnlyFans
  if (artistData.onlyfans && Math.random() < 0.45) {
    const ofPrice = artistData.onlyfans.subscriptionPrice || 15;
    if (Math.random() < 0.65) {
      // Fan Hype
      const templates = [
        `${artistName}'s onlyfans is genuinely the best $${ofPrice} i've ever spent 😭🔥`,
        `people hating on ${artistName} for doing onlyfans while they're literally funding their own masters and bag. we stan a multitasking boss`,
        `${artistName} is gorgeous, talented, AND runs a thriving onlyfans account. unbothered legend behavior`,
        `the exclusive behind-the-scenes content on ${artistName}'s onlyfans... subscribers are eating so good`,
      ];
      posts.push({
        id: crypto.randomUUID(),
        authorId: pickFan().id,
        content: templates[Math.floor(Math.random() * templates.length)],
        likes: Math.floor(Math.random() * 55000) + 15000,
        retweets: Math.floor(Math.random() * 9000) + 2500,
        views: Math.floor(Math.random() * 750000) + 200000,
        date,
      });
    } else {
      // Hater Criticism
      const templates = [
        `from making top charting music to charging $${ofPrice} on onlyfans... ${artistName}'s career trajectory is wild 💀`,
        `not ${artistName} promoting an onlyfans page instead of announcing a tour... wrap it up`,
        `${artistName} having an onlyfans is proof that stream checks aren't enough 😭 embarrassing`,
      ];
      posts.push({
        id: crypto.randomUUID(),
        authorId: pickHater().id,
        content: templates[Math.floor(Math.random() * templates.length)],
        likes: Math.floor(Math.random() * 40000) + 10000,
        retweets: Math.floor(Math.random() * 7000) + 1800,
        views: Math.floor(Math.random() * 550000) + 130000,
        date,
      });
    }
  }

  // 3. Instagram Broadcast Channel
  if (artistData.instagramCommunityName && Math.random() < 0.5) {
    const channelName = artistData.instagramCommunityName;
    const memberCount = formatNumber(artistData.instagramCommunityMembers || 50);
    const recentMsg = artistData.instagramChannelMessages && artistData.instagramChannelMessages.length > 0
      ? artistData.instagramChannelMessages[artistData.instagramChannelMessages.length - 1]
      : null;

    const templates = [
      `the notifications from ${artistName}'s '${channelName}' broadcast channel always make my day ❤️`,
      `the way ${artistName} texts in the '${channelName}' channel like we've been childhood besties`,
      `if you're not in the '${channelName}' broadcast channel on instagram what are you doing with your life?? [${memberCount} members]`,
      `the reactions in ${artistName}'s broadcast channel literally moving live the second they hit send 🏃‍♀️💨`,
    ];

    if (recentMsg?.text) {
      templates.push(
        `${artistName} just texted the broadcast channel: "${recentMsg.text.slice(0, 45)}..." I'M SCREAMING 😭`,
        `not ${artistName} casually dropping lore in the '${channelName}' channel at 2am`
      );
    }
    if (recentMsg?.imageUrl) {
      templates.push(`${artistName} just sent a picture in the broadcast channel and my jaw is on the floor`);
    }

    posts.push({
      id: crypto.randomUUID(),
      authorId: pickFan().id,
      content: templates[Math.floor(Math.random() * templates.length)],
      image: recentMsg?.imageUrl || undefined,
      likes: Math.floor(Math.random() * 48000) + 14000,
      retweets: Math.floor(Math.random() * 8500) + 2000,
      views: Math.floor(Math.random() * 650000) + 160000,
      date,
    });
  }

  // 4. TikTok
  if (artistData.tiktokVideos && artistData.tiktokVideos.length > 0 && Math.random() < 0.4) {
    const recentTikTok = artistData.tiktokVideos[0];
    const viewsStr = formatNumber(recentTikTok.views || 250000);
    const templates = [
      `${artistName}'s new tiktok audio has half of tiktok in an absolute chokehold right now 😭`,
      `${artistName} being an effortless tiktok comedian on top of making hit records will always be iconic`,
      `my whole for you page is just people recreating ${artistName}'s latest tiktok`,
      `${artistName}'s tiktok has over ${viewsStr} views already... viral queen/king`,
    ];
    posts.push({
      id: crypto.randomUUID(),
      authorId: pickFan().id,
      content: templates[Math.floor(Math.random() * templates.length)],
      likes: Math.floor(Math.random() * 42000) + 11000,
      retweets: Math.floor(Math.random() * 7000) + 1500,
      views: Math.floor(Math.random() * 580000) + 140000,
      date,
    });
  }

  // 5. Public Image (Good vs Bad person)
  const publicImage = artistData.publicImage ?? 80;
  if (Math.random() < 0.45) {
    if (publicImage >= 75) {
      // Good Person
      const templates = [
        `${artistName} is genuinely the sweetest soul in the entire music industry. zero drama, pure kindness ❤️`,
        `hearing behind-the-scenes crew talk about how respectfully ${artistName} treats everyone on set makes me so proud to be a fan.`,
        `${artistName} has the biggest heart in pop music. a literal angel on earth who always stays humble.`,
        `you will never catch ${artistName} being rude to fans or service workers. class act all the way.`,
        `in an industry full of fake egos, ${artistName} remains so pure and genuinely kind to everyone.`,
      ];
      posts.push({
        id: crypto.randomUUID(),
        authorId: pickFan().id,
        content: templates[Math.floor(Math.random() * templates.length)],
        likes: Math.floor(Math.random() * 65000) + 20000,
        retweets: Math.floor(Math.random() * 11000) + 3000,
        views: Math.floor(Math.random() * 850000) + 220000,
        date,
      });
    } else if (publicImage <= 40) {
      // Bad Person / Controversial
      if (Math.random() < 0.65) {
        const templates = [
          `${artistName} has let fame completely go to their head. the arrogance and attitude lately is disgusting 😬`,
          `public image in the gutter and ${artistName} is still acting entitled and rude... somebody humble them please`,
          `everyone in Hollywood knows ${artistName} is a nightmare to work with behind closed doors`,
          `used to be a fan of ${artistName} but their nasty true colors really came out. fame ruins people`,
          `${artistName}'s PR team deserves a raise for having to clean up after them 24/7 💀`,
        ];
        posts.push({
          id: crypto.randomUUID(),
          authorId: pickHater().id,
          content: templates[Math.floor(Math.random() * templates.length)],
          likes: Math.floor(Math.random() * 52000) + 14000,
          retweets: Math.floor(Math.random() * 9500) + 2200,
          views: Math.floor(Math.random() * 700000) + 180000,
          date,
        });
      } else {
        // Fans hyping the "villain era"
        const templates = [
          `${artistName} in their unapologetic villain era and honestly i'm obsessed 💅 let them be messy!`,
          `they want ${artistName} to be a polite quiet industry puppet so bad... stay mad haters!`,
        ];
        posts.push({
          id: crypto.randomUUID(),
          authorId: pickFan().id,
          content: templates[Math.floor(Math.random() * templates.length)],
          likes: Math.floor(Math.random() * 45000) + 12000,
          retweets: Math.floor(Math.random() * 7500) + 1800,
          views: Math.floor(Math.random() * 600000) + 150000,
          date,
        });
      }
    }
  }

  // 6. Children / Kids
  if (artistData.kids && artistData.kids.length > 0 && Math.random() < 0.4) {
    const kid = artistData.kids[Math.floor(Math.random() * artistData.kids.length)];
    const templates = [
      `can we talk about how dedicated of a parent ${artistName} is to ${kid.name}? balancing a massive music career and family 🥹`,
      `${artistName} and ${kid.name} are literally the most wholesome duo on the planet my heart can't take it`,
      `${kid.name} literally has ${artistName}'s exact smile copy and pasted! so precious`,
      `${artistName} having ${kid.name} backstage at shows is the sweetest thing ever. parent of the century`,
      `${kid.name} already having the coolest parent in the world must be so iconic`,
    ];
    posts.push({
      id: crypto.randomUUID(),
      authorId: pickFan().id,
      content: templates[Math.floor(Math.random() * templates.length)],
      image: kid.image || undefined,
      likes: Math.floor(Math.random() * 58000) + 16000,
      retweets: Math.floor(Math.random() * 9500) + 2200,
      views: Math.floor(Math.random() * 780000) + 190000,
      date,
    });
  }

  // 7. Exes and Relationships
  if (artistData.relationships && artistData.relationships.length > 0 && Math.random() < 0.45) {
    const activeRel = artistData.relationships.find(
      (r) => r.status === "dating" || r.status === "engaged" || r.status === "married"
    );
    const exRel = artistData.relationships.find(
      (r) => r.status === "ex" || r.status === "divorcing"
    );

    if (activeRel && Math.random() < 0.6) {
      const templates = [
        `${artistName} and ${activeRel.partnerName} are literally relationship goals. the way they look at each other 😭❤️`,
        `mother and father ${artistName} and ${activeRel.partnerName} just served pure couple chemistry on the red carpet`,
        `${activeRel.partnerName} is the luckiest human being on earth to wake up next to ${artistName} every day`,
        activeRel.status === "married"
          ? `${artistName} being happily married to ${activeRel.partnerName} while breaking streaming records is peak romance`
          : `${artistName} and ${activeRel.partnerName} are the blueprint of celebrity love fr`,
      ];
      posts.push({
        id: crypto.randomUUID(),
        authorId: pickFan().id,
        content: templates[Math.floor(Math.random() * templates.length)],
        image: activeRel.image || undefined,
        likes: Math.floor(Math.random() * 62000) + 18000,
        retweets: Math.floor(Math.random() * 10500) + 2500,
        views: Math.floor(Math.random() * 820000) + 210000,
        date,
      });
    } else if (exRel) {
      const templates = [
        `${artistName}'s ex (${exRel.partnerName}) really fumbled the biggest superstar on the planet... i'd never show my face again 💀`,
        `the breakup songs ${artistName} wrote about ${exRel.partnerName} are generational heartbreak classics`,
        `imagine being ${exRel.partnerName} and having to hear ${artistName} on the radio everywhere you go knowing you lost them`,
        `${artistName} thriving, glowing, and charting at #1 while ${exRel.partnerName} is completely irrelevant is poetic justice`,
        `never forget when ${exRel.partnerName} actually thought they could do better than ${artistName} lmaooo`,
      ];
      posts.push({
        id: crypto.randomUUID(),
        authorId: pickFan().id,
        content: templates[Math.floor(Math.random() * templates.length)],
        likes: Math.floor(Math.random() * 54000) + 15000,
        retweets: Math.floor(Math.random() * 9000) + 2100,
        views: Math.floor(Math.random() * 720000) + 170000,
        date,
      });
    }
  }

  return posts;
}

/**
 * Returns contextual smart comment templates for fan and hater replies under player tweets.
 */
export function getSmartCommentTemplates(
  artistData: ArtistData,
  isHater: boolean
): string[] {
  const templates: string[] = [];

  // Kids
  if (artistData.kids && artistData.kids.length > 0) {
    const kid = artistData.kids[Math.floor(Math.random() * artistData.kids.length)];
    if (!isHater) {
      templates.push(
        `hope you and baby ${kid.name} are having the best day 🥹`,
        `tell ${kid.name} we say hello!! ❤️`,
        `best parent in the industry fr`
      );
    }
  }

  // Active Relationship
  const activeRel = artistData.relationships?.find(
    (r) => r.status === "dating" || r.status === "engaged" || r.status === "married"
  );
  if (activeRel && !isHater) {
    templates.push(
      `tell ${activeRel.partnerName} we say hi!! ❤️`,
      `${activeRel.partnerName} is the luckiest person alive fr`,
      `power couple behavior`
    );
  }

  // Ex
  const exRel = artistData.relationships?.find(
    (r) => r.status === "ex" || r.status === "divorcing"
  );
  if (exRel) {
    if (!isHater) {
      templates.push(
        `this tweet is definitely shading ${exRel.partnerName} 💀`,
        `we know ${exRel.partnerName} is punching the wall right now`,
        `moving on from ${exRel.partnerName} was your best era`
      );
    } else {
      templates.push(`still not over ${exRel.partnerName} i see...`);
    }
  }

  // Broadcast Channel
  if (artistData.instagramCommunityName) {
    if (!isHater) {
      templates.push(
        `girl go check your '${artistData.instagramCommunityName}' broadcast channel we're freaking out!`,
        `text us in the broadcast channel please 😭❤️`,
        `the broadcast channel notifications were insane today`
      );
    }
  }

  // OnlyFans
  if (artistData.onlyfans) {
    if (!isHater) {
      templates.push(
        `checking onlyfans right now queen 💳`,
        `the onlyfans subscribers are eating good this week`
      );
    } else {
      templates.push(
        `promoting on X instead of your onlyfans?`,
        `onlyfans era is crazy`
      );
    }
  }

  // Instagram Posts / Reels
  if (artistData.instagramPosts && artistData.instagramPosts.length > 0 && !isHater) {
    templates.push(
      `now post the outtakes on instagram please!`,
      `the instagram post earlier was lethal mother`,
      `drop the outfit details from your ig`
    );
  }

  // TikTok
  if (artistData.tiktokVideos && artistData.tiktokVideos.length > 0 && !isHater) {
    templates.push(
      `make a tiktok to this sound please!!`,
      `your tiktok sound is trending everywhere right now`
    );
  }

  // Public Image
  const publicImage = artistData.publicImage ?? 80;
  if (publicImage >= 75 && !isHater) {
    templates.push(
      `our humble, kind angel ❤️`,
      `you are genuinely the sweetest soul in this industry`,
      `the most unproblematic pure fave`
    );
  } else if (publicImage <= 40) {
    if (isHater) {
      templates.push(
        `apologize to your staff first then tweet`,
        `the ego is wild`,
        `humility is free btw`,
        `public image down the drain`
      );
    } else {
      templates.push(
        `villain era looks good on you 💅`,
        `they hate to see an unbothered icon`
      );
    }
  }

  return templates;
}
