import { BusinessCategory, ProductQualityTier, GameDate } from '../types';

export interface DemandCalculationResult {
  demandScore: number; // 0 - 100
  demandRating: string;
  demandColor: string;
  estimatedSellThrough: number; // 0.05 to 0.95
  priceScore: number;
  qualityScore: number;
  popularityScore: number;
  publicImageScore: number;
  hypeScore: number;
  feedbackTip: string;
}

export interface CategoryBenchmark {
  label: string;
  emoji: string;
  description: string;
  defaultUnitCosts: Record<ProductQualityTier, number>;
  recommendedPrices: Record<ProductQualityTier, { min: number; max: number; standard: number }>;
  defaultProductIdeas: Array<{
    name: string;
    category: string;
    description: string;
    recommendedTier: ProductQualityTier;
    image: string;
  }>;
}

export const BUSINESS_CATEGORIES: Record<BusinessCategory, CategoryBenchmark> = {
  perfume: {
    label: 'Perfume & Fragrance',
    emoji: '✨',
    description: 'Bespoke signature scents, eau de parfums, body mists, and luxury extrait oils.',
    defaultUnitCosts: {
      standard: 6,
      premium: 14,
      luxury: 32,
    },
    recommendedPrices: {
      standard: { min: 25, max: 60, standard: 45 },
      premium: { min: 70, max: 130, standard: 95 },
      luxury: { min: 150, max: 350, standard: 220 },
    },
    defaultProductIdeas: [
      {
        name: 'Signature Eau de Parfum (100ml)',
        category: 'Eau de Parfum',
        description: 'Warm amber, white musk, and bergamot with lingering sensual florals.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop',
      },
      {
        name: 'Midnight Nectar Hair & Body Mist',
        category: 'Fragrance Mist',
        description: 'Light, intoxicating evening mist infused with dark plum and jasmine.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&h=600&fit=crop',
      },
      {
        name: 'Velvet Noir Extrait de Parfum',
        category: 'Luxury Extrait',
        description: 'Ultra-concentrated rare oud and black rose in a numbered crystal flacon.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&h=600&fit=crop',
      },
    ],
  },
  beauty: {
    label: 'Beauty & Cosmetics',
    emoji: '💄',
    description: 'High-pigment makeup, lip oils, blush palettes, complexion products, and highlighters.',
    defaultUnitCosts: {
      standard: 3,
      premium: 8,
      luxury: 20,
    },
    recommendedPrices: {
      standard: { min: 16, max: 30, standard: 22 },
      premium: { min: 32, max: 55, standard: 42 },
      luxury: { min: 60, max: 120, standard: 85 },
    },
    defaultProductIdeas: [
      {
        name: 'Glaze Cushion Lip Oil',
        category: 'Lip Care',
        description: 'Plumping peptide formula with mirror-shine glass finish in 6 signature shades.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&h=600&fit=crop',
      },
      {
        name: 'Soft Radiance Liquid Blush',
        category: 'Complexion',
        description: 'Weightless, buildable cheek tint that melts into skin for 14-hour glow.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=600&fit=crop',
      },
      {
        name: 'Gilded Dimension Eye Palette',
        category: 'Eye Makeup',
        description: '12 multi-dimensional foils, duochromes, and velvet mattes.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&h=600&fit=crop',
      },
    ],
  },
  hair_care: {
    label: 'Hair Care & Styling',
    emoji: '💇‍♀️',
    description: 'Bonding oils, peptide repair masks, curl styling creams, and gloss serums.',
    defaultUnitCosts: {
      standard: 4,
      premium: 9,
      luxury: 22,
    },
    recommendedPrices: {
      standard: { min: 18, max: 32, standard: 24 },
      premium: { min: 34, max: 60, standard: 44 },
      luxury: { min: 65, max: 130, standard: 88 },
    },
    defaultProductIdeas: [
      {
        name: 'Mirror Silk Bonding Oil',
        category: 'Hair Treatment',
        description: 'Heat-activated silicone-free elixir repairing split ends and locking in humidity shield.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1608248597359-25f050b1cb7a?w=600&h=600&fit=crop',
      },
      {
        name: 'Keratin Infusion Deep Mask',
        category: 'Hair Mask',
        description: 'Intense reconstructive treatment restoring elasticity in one 5-minute use.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=600&fit=crop',
      },
      {
        name: 'Cellular Scalp Renewal Serum',
        category: 'Scalp Care',
        description: 'Stem-cell nutrient serum promoting dense hair follicle growth.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop',
      },
    ],
  },
  shoes: {
    label: 'Shoes & Footwear',
    emoji: '👟',
    description: 'Designer sneakers, luxury heels, streetwear silhouettes, and statement boots.',
    defaultUnitCosts: {
      standard: 20,
      premium: 45,
      luxury: 120,
    },
    recommendedPrices: {
      standard: { min: 70, max: 120, standard: 90 },
      premium: { min: 130, max: 240, standard: 175 },
      luxury: { min: 280, max: 750, standard: 480 },
    },
    defaultProductIdeas: [
      {
        name: 'Retro Runner Sneaker',
        category: 'Sneakers',
        description: 'Heritage suede panels with molded EVA cushioning and custom tread pattern.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&h=600&fit=crop',
      },
      {
        name: 'Cloud Slide Foam Sandal',
        category: 'Streetwear',
        description: 'One-piece ergonomic injected foam slide designed for everyday backstage comfort.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&h=600&fit=crop',
      },
      {
        name: 'Sculpted Chrome Stiletto Heel',
        category: 'Luxury Footwear',
        description: 'Italian leather upper with a hand-polished architectural silver heel.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=600&fit=crop',
      },
    ],
  },
  fashion: {
    label: 'Fashion & Apparel',
    emoji: '👗',
    description: 'Luxury streetwear, tailored outerwear, graphic capsule hoodies, and ready-to-wear.',
    defaultUnitCosts: {
      standard: 12,
      premium: 28,
      luxury: 85,
    },
    recommendedPrices: {
      standard: { min: 40, max: 80, standard: 55 },
      premium: { min: 90, max: 180, standard: 130 },
      luxury: { min: 220, max: 650, standard: 380 },
    },
    defaultProductIdeas: [
      {
        name: 'Heavyweight Fleece Boxy Hoodie',
        category: 'Outerwear',
        description: '500 GSM organic French terry cotton with minimalist embossed branding.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=600&fit=crop',
      },
      {
        name: 'Oversized Washed Graphic Tee',
        category: 'Streetwear',
        description: 'Vintage mineral-washed cotton with distressed vintage typography.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&h=600&fit=crop',
      },
      {
        name: 'Tailored Wool Trench Coat',
        category: 'Outerwear',
        description: 'Double-breasted virgin wool silhouette with custom engraved horn buttons.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=600&fit=crop',
      },
    ],
  },
  skincare: {
    label: 'Skincare',
    emoji: '🧴',
    description: 'Clean clinical barrier serums, peptide creams, daily SPF, and soothing toners.',
    defaultUnitCosts: {
      standard: 4,
      premium: 10,
      luxury: 25,
    },
    recommendedPrices: {
      standard: { min: 20, max: 35, standard: 26 },
      premium: { min: 40, max: 75, standard: 54 },
      luxury: { min: 80, max: 180, standard: 115 },
    },
    defaultProductIdeas: [
      {
        name: 'Barrier Lipid Glaze Moisturizer',
        category: 'Moisturizer',
        description: 'Ceramide and squalane emulsion strengthening delicate skin barriers.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop',
      },
      {
        name: 'Milky Essence Hydration Toner',
        category: 'Toner',
        description: 'Fermented rice and tremella mushroom toner restoring dewy suppleness.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop',
      },
      {
        name: 'Multi-Peptide Youth Elixir',
        category: 'Serum',
        description: 'Advanced copper peptide and EGF youth complex smoothing fine lines.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1608248597359-25f050b1cb7a?w=600&h=600&fit=crop',
      },
    ],
  },
  accessories: {
    label: 'Eyewear & Accessories',
    emoji: '🕶️',
    description: 'Designer acetate sunglasses, fine leather goods, jewelry, and luxury bags.',
    defaultUnitCosts: {
      standard: 6,
      premium: 15,
      luxury: 45,
    },
    recommendedPrices: {
      standard: { min: 30, max: 55, standard: 40 },
      premium: { min: 65, max: 120, standard: 85 },
      luxury: { min: 140, max: 380, standard: 210 },
    },
    defaultProductIdeas: [
      {
        name: 'Shield Rimless Sunglasses',
        category: 'Eyewear',
        description: 'Y2K wrapped silver frame with 100% UV polarized rose lenses.',
        recommendedTier: 'premium',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
      },
      {
        name: 'Gilded Chain Link Choker',
        category: 'Jewelry',
        description: '18K gold vermeil chunky chain with engraved toggle clasp.',
        recommendedTier: 'standard',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop',
      },
      {
        name: 'Structured Calfskin Mini Tote',
        category: 'Leather Goods',
        description: 'Hand-stitched Italian leather with suede lining and detachable shoulder strap.',
        recommendedTier: 'luxury',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
      },
    ],
  },
};

/**
 * Calculates real-time estimated demand based on:
 * - price
 * - stock quality
 * - artist popularity
 * - artist public image
 * - artist & brand hype
 */
export function calculateEstimatedDemand(params: {
  price: number;
  qualityTier: ProductQualityTier;
  category: BusinessCategory;
  popularity: number;
  publicImage: number;
  hype: number;
}): DemandCalculationResult {
  const { price, qualityTier, category, popularity, publicImage, hype } = params;
  const benchmark = BUSINESS_CATEGORIES[category] || BUSINESS_CATEGORIES.perfume;
  const recPrice = benchmark.recommendedPrices[qualityTier];

  // 1. Price Score (0 - 100)
  let priceScore = 80;
  if (price <= recPrice.standard) {
    // Under or at standard benchmark: very appealing
    priceScore = 95 + Math.min(5, (recPrice.standard - price) / 2);
  } else if (price <= recPrice.max) {
    // Above standard but within acceptable range
    const ratio = (price - recPrice.standard) / (recPrice.max - recPrice.standard);
    priceScore = 95 - ratio * 25; // 95 down to 70
  } else {
    // Overpriced: penalty depends on public image and tier
    const overage = (price - recPrice.max) / recPrice.max;
    const luxuryCushion = qualityTier === 'luxury' ? 15 : 0;
    priceScore = Math.max(20, 70 - overage * 60 + luxuryCushion);
  }

  // 2. Quality Score (0 - 100)
  const qualityScore = qualityTier === 'luxury' ? 98 : qualityTier === 'premium' ? 84 : 65;

  // 3. Popularity Score (0 - 100)
  const popularityScore = Math.min(100, Math.max(15, popularity));

  // 4. Public Image Score (0 - 100)
  const publicImageScore = Math.min(100, Math.max(10, publicImage));

  // 5. Hype Score (0 - 100)
  const hypeScore = Math.min(100, Math.max(10, hype));

  // Composite Weighted Formula
  // Luxury products rely heavily on Public Image + Hype
  let weightPrice = 0.22;
  let weightQuality = 0.20;
  let weightPopularity = 0.22;
  let weightImage = 0.20;
  let weightHype = 0.16;

  if (qualityTier === 'luxury') {
    weightPrice = 0.14;
    weightQuality = 0.24;
    weightPopularity = 0.22;
    weightImage = 0.24;
    weightHype = 0.16;
  }

  const rawScore =
    priceScore * weightPrice +
    qualityScore * weightQuality +
    popularityScore * weightPopularity +
    publicImageScore * weightImage +
    hypeScore * weightHype;

  const demandScore = Math.round(Math.min(99, Math.max(12, rawScore)));

  // Sell-through estimate during launch (0.15 to 0.95)
  const estimatedSellThrough = Math.min(
    0.95,
    Math.max(0.15, (demandScore / 100) * 0.95)
  );

  // Rating labels & feedback
  let demandRating = 'Moderate Demand';
  let demandColor = 'text-yellow-400';
  let feedbackTip = 'A balanced product launch with stable consumer interest.';

  if (demandScore >= 88) {
    demandRating = 'Sensational / Instant Sell-Out Risk 🔥';
    demandColor = 'text-emerald-400';
    feedbackTip =
      'Extremely high demand! Massive star power, pristine public image, and compelling price point mean this will sell out swiftly.';
  } else if (demandScore >= 74) {
    demandRating = 'Very High Demand ⭐';
    demandColor = 'text-emerald-300';
    feedbackTip =
      'Strong consumer anticipation. Your popularity and product quality create robust launch velocity.';
  } else if (demandScore >= 60) {
    demandRating = 'High Demand 👍';
    demandColor = 'text-blue-400';
    feedbackTip =
      'Solid consumer appeal. Consistent weekly orders expected across online and flagship distribution.';
  } else if (demandScore >= 45) {
    demandRating = 'Moderate / Steady';
    demandColor = 'text-amber-400';
    feedbackTip =
      'Moderate demand. Lowering the price slightly or boosting hype with a promo campaign could stimulate faster sell-out.';
  } else {
    demandRating = 'Niche / Cautious';
    demandColor = 'text-rose-400';
    feedbackTip =
      'Price may be too steep or public image is cautious. Consider a friendlier price point or improving public sentiment.';
  }

  return {
    demandScore,
    demandRating,
    demandColor,
    estimatedSellThrough,
    priceScore: Math.round(priceScore),
    qualityScore,
    popularityScore: Math.round(popularityScore),
    publicImageScore: Math.round(publicImageScore),
    hypeScore: Math.round(hypeScore),
    feedbackTip,
  };
}

export const PRESET_LOGOS = [
  {
    name: 'Minimalist Monogram',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop',
  },
  {
    name: 'Gilded Crest Emblem',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&h=400&fit=crop',
  },
  {
    name: 'Architectural Geometric',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
  },
  {
    name: 'Luxury Botanical Motif',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=400&fit=crop',
  },
  {
    name: 'Cyber Streetwear Signature',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&fit=crop',
  },
];

/**
 * Foolproof resolution of the player artist or group name to prevent any "undefined" in tweets.
 */
export function getSafeArtistName(
  state: any,
  artistId?: string | null,
  artistData?: any
): string {
  const currentId = artistId || state?.activeArtistId;
  const currentData =
    artistData || (currentId && state?.artistsData ? state.artistsData[currentId] : undefined);

  // 1. Check Player X User (guaranteed to be the exact persona used on X/Twitter)
  if (currentData?.xUsers) {
    const playerUser =
      currentData.xUsers.find((u: any) => u.isPlayer) ||
      (currentData.selectedPlayerXUserId
        ? currentData.xUsers.find((u: any) => u.id === currentData.selectedPlayerXUserId)
        : undefined);
    if (playerUser?.name && playerUser.name.trim() !== '' && playerUser.name !== 'undefined') {
      return playerUser.name;
    }
  }

  // 2. Solo Artist name
  if (
    state?.soloArtist?.name &&
    state.soloArtist.name.trim() !== '' &&
    state.soloArtist.name !== 'undefined'
  ) {
    return state.soloArtist.name;
  }

  // 3. Group or Member name
  if (state?.group) {
    if (currentId && state.group.members) {
      const member = state.group.members.find((m: any) => m.id === currentId);
      if (member?.name && member.name.trim() !== '' && member.name !== 'undefined') {
        return member.name;
      }
    }
    if (state.group.name && state.group.name.trim() !== '' && state.group.name !== 'undefined') {
      return state.group.name;
    }
  }

  // 4. Extra playable artists
  if (state?.extraPlayableArtists && state.extraPlayableArtists.length > 0) {
    const extra =
      state.extraPlayableArtists.find((a: any) => a.id === currentId) ||
      state.extraPlayableArtists[0];
    if (extra?.name && extra.name.trim() !== '' && extra.name !== 'undefined') {
      return extra.name;
    }
  }

  // 5. allPlayerArtists or artists array
  const allArtists = state?.allPlayerArtists || state?.artists;
  if (allArtists && Array.isArray(allArtists) && allArtists.length > 0) {
    const found = allArtists.find((a: any) => a.id === currentId) || allArtists[0];
    if (found?.name && found.name.trim() !== '' && found.name !== 'undefined') {
      return found.name;
    }
  }

  // 6. Direct property on artistData
  if (currentData?.name && currentData.name !== 'undefined') return currentData.name;
  if (currentData?.stageName && currentData.stageName !== 'undefined') return currentData.stageName;

  return 'The Artist';
}

/**
 * Generate fan tweets reacting to product quality, price points, luxury feel, or affordability.
 */
export function generateProductFanTweet(params: {
  artistName: string;
  businessName: string;
  productName: string;
  price: number;
  qualityTier: ProductQualityTier;
  category?: BusinessCategory | string;
}): string {
  const { artistName, businessName, productName, price, qualityTier, category } = params;
  const catKey = (category || 'perfume') as BusinessCategory;
  const catConfig = BUSINESS_CATEGORIES[catKey];
  const recPrices = catConfig?.recommendedPrices[qualityTier];

  const isExpensive = recPrices ? price > recPrices.max : price > 80;
  const isLowQuality = qualityTier === 'standard';
  const isLuxury = qualityTier === 'luxury';
  const isAffordable = recPrices ? price <= recPrices.min : price <= 25;

  // Case 1: High price AND low quality = peak fan disappointment & complaints!
  if (isExpensive && isLowQuality) {
    const comboQuotes = [
      `paying $${price} for ${businessName}’s ‘${productName}’ just for it to feel like cheap plastic is actually tragic 😭 ${artistName} we expected better`,
      `love ${artistName} down, but $${price} for ‘${productName}’ with this kind of cheap packaging is NOT it... highway robbery`,
      `not ${artistName} charging luxury prices ($${price}) for standard dollar store quality on ‘${productName}’ 💀`,
      `my ‘${productName}’ from ${businessName} arrived broken because the packaging is so flimsy... and I paid $${price} for this?!`,
    ];
    return comboQuotes[Math.floor(Math.random() * comboQuotes.length)];
  }

  // Case 2: Too expensive complaints
  if (isExpensive) {
    const expensiveQuotes = [
      `love ${artistName} with my whole heart, but $${price} for ‘${productName}’?? in this economy?! 😭💸`,
      `can someone tell ${artistName} that $${price} for ‘${productName}’ is insane... who has that kind of money`,
      `i wanted ‘${productName}’ so bad until i saw that $${price} price tag... ${businessName} is for millionaires only 💀`,
      `$${price} for ‘${productName}’ is wild... ${artistName} please make ${businessName} more affordable for fans 😭`,
      `me looking at the $${price} checkout total for ‘${productName}’ knowing ${artistName} is already rich 👁️👄👁️`,
      `love the aesthetic of ${businessName} but $${price} for ‘${productName}’ is crazy expensive 💔`,
    ];
    return expensiveQuotes[Math.floor(Math.random() * expensiveQuotes.length)];
  }

  // Case 3: Low quality complaints (even at standard price)
  if (isLowQuality) {
    const qualityQuotes = [
      `my ‘${productName}’ from ${businessName} arrived today and the packaging feels kinda cheap 😕 love ${artistName} though`,
      `honestly the quality on ‘${productName}’ isn’t giving what ${artistName} promised... formula is pretty mid`,
      `is it just me or does ${artistName}’s ‘${productName}’ feel low quality for all this hype? definitely expected higher grade materials`,
      `not ${businessName} sending out flimsy packaging for ‘${productName}’ 😭 ${artistName} we need better manufacturers!`,
      `waited 2 weeks for ‘${productName}’ and the caps don’t even seal properly... ${artistName} please fix the quality control!`,
    ];
    return qualityQuotes[Math.floor(Math.random() * qualityQuotes.length)];
  }

  // Case 4: Luxury praise
  if (isLuxury) {
    const luxuryQuotes = [
      `the quality of ${artistName}’s ‘${productName}’ is ACTUALLY breathtaking... the heavy glass packaging and formula 10/10 👑✨`,
      `okay ${businessName} did NOT play with ‘${productName}’. this is genuine luxury and worth every penny`,
      `obsessed with ‘${productName}’!! ${artistName} really put so much love into this formula 💖`,
      `already ordered a backup of ‘${productName}’ from ${businessName}. genuinely one of the best brand launches this year 💎`,
      `the attention to detail on ${businessName}’s ‘${productName}’ is immaculate... ${artistName} really delivered high-end quality`,
    ];
    return luxuryQuotes[Math.floor(Math.random() * luxuryQuotes.length)];
  }

  // Case 5: Affordable praise
  if (isAffordable) {
    const affordableQuotes = [
      `only $${price} for ‘${productName}’?! ${artistName} is an angel for keeping ${businessName} affordable for fans 🥺✨`,
      `such high quality for only $${price}! ${artistName} ate down with ‘${productName}’`,
      `thank you ${artistName} for making ‘${productName}’ reasonably priced so all fans can actually afford ${businessName} 💖`,
    ];
    return affordableQuotes[Math.floor(Math.random() * affordableQuotes.length)];
  }

  // Case 6: General fan buzz
  const buzzQuotes = [
    `just received my order of ‘${productName}’ from ${businessName}!! smells/looks unreal 🔥 ${artistName} didn’t miss`,
    `everyone run don’t walk to get ‘${productName}’ from ${businessName} before it sells out again 🛍️✨`,
    `my vanity table is officially taken over by ${businessName}’s ‘${productName}’. ${artistName} took all my coins!`,
  ];
  return buzzQuotes[Math.floor(Math.random() * buzzQuotes.length)];
}
