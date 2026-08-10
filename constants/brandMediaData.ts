import { Brand, SongMediaRequest } from '../types';

export const BRANDS: Brand[] = [
  {
    id: 'cartier',
    name: 'Cartier',
    category: 'Luxury Jewelry & Watches',
    minPopularity: 65,
    oneOffPayout: 160000,
    ambassadorWeeklyPayout: 220000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400',
    description: 'French luxury watchmaker and jeweler. High prestige, massive global reach.'
  },
  {
    id: 'nike',
    name: 'Nike',
    category: 'Sportswear & Culture',
    minPopularity: 30,
    oneOffPayout: 50000,
    ambassadorWeeklyPayout: 90000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    description: 'Global athletic footwear and apparel titan. Culture defining street style.'
  },
  {
    id: 'bmw',
    name: 'BMW',
    category: 'Luxury Automotive',
    minPopularity: 55,
    oneOffPayout: 120000,
    ambassadorWeeklyPayout: 180000,
    contractDurationWeeks: 16,
    logoUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400',
    description: 'German luxury automobile icon. Ultimate driving machine endorsement.'
  },
  {
    id: 'coca_cola',
    name: 'Coca-Cola',
    category: 'Global Beverage',
    minPopularity: 25,
    oneOffPayout: 35000,
    ambassadorWeeklyPayout: 70000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
    description: 'The most recognized beverage brand in human history.'
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'Consumer Technology',
    minPopularity: 60,
    oneOffPayout: 140000,
    ambassadorWeeklyPayout: 210000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=400',
    description: 'Cupertino tech giant shaping music, hardware, and digital culture.'
  },
  {
    id: 'pandora',
    name: 'Pandora',
    category: 'Fine Jewelry & Charms',
    minPopularity: 20,
    oneOffPayout: 25000,
    ambassadorWeeklyPayout: 50000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400',
    description: 'Danish charm bracelet manufacturer and jeweler.'
  },
  {
    id: 'tiffany',
    name: 'Tiffany & Co',
    category: 'Luxury Diamonds & Jewelry',
    minPopularity: 70,
    oneOffPayout: 180000,
    ambassadorWeeklyPayout: 280000,
    contractDurationWeeks: 16,
    logoUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    description: 'American luxury jewelry and specialty retailer with signature Tiffany Blue.'
  },
  {
    id: 'loreal',
    name: "L'Oréal Paris",
    category: 'Cosmetics & Beauty',
    minPopularity: 35,
    oneOffPayout: 60000,
    ambassadorWeeklyPayout: 110000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
    description: 'World leader in beauty, hair care, cosmetics, and skincare.'
  },
  {
    id: 'balenciaga',
    name: 'Balenciaga',
    category: 'Avant-Garde High Fashion',
    minPopularity: 50,
    oneOffPayout: 100000,
    ambassadorWeeklyPayout: 170000,
    contractDurationWeeks: 12,
    logoUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400',
    description: 'Spanish luxury fashion house known for bold, experimental luxury.'
  },
  {
    id: 'louis_vuitton',
    name: 'Louis Vuitton',
    category: 'Haute Couture & Leather Goods',
    minPopularity: 75,
    oneOffPayout: 210000,
    ambassadorWeeklyPayout: 340000,
    contractDurationWeeks: 24,
    logoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400',
    description: "The world's most valuable luxury fashion house with iconic monogram leather."
  },
  {
    id: 'gucci',
    name: 'Gucci',
    category: 'Italian High Fashion',
    minPopularity: 70,
    oneOffPayout: 190000,
    ambassadorWeeklyPayout: 310000,
    contractDurationWeeks: 16,
    logoUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400',
    description: 'Florentine luxury fashion house renowned for eccentric, high-glamour aesthetics.'
  },
  {
    id: 'chanel',
    name: 'Chanel',
    category: 'French Haute Couture',
    minPopularity: 80,
    oneOffPayout: 250000,
    ambassadorWeeklyPayout: 420000,
    contractDurationWeeks: 24,
    logoUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=400',
    description: 'The pinnacle of French luxury, haute couture, and iconic fragrance.'
  }
];

export const MEDIA_REQUESTS_PRESETS: SongMediaRequest[] = [
  {
    id: 'love_island',
    mediaTitle: 'Love Island Season 11',
    type: 'TV Show',
    upfrontPayout: 45000,
    streamBoostPercent: 15,
    durationWeeks: 8,
    minPopularity: 20,
    logoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400',
    description: 'Featured on prime-time Love Island recoupling episodes.'
  },
  {
    id: 'squid_game',
    mediaTitle: 'Squid Game Season 2',
    type: 'TV Show',
    upfrontPayout: 120000,
    streamBoostPercent: 45,
    durationWeeks: 10,
    minPopularity: 45,
    logoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400',
    description: 'Featured climax scene soundtrack.'
  },
  {
    id: 'big_brother',
    mediaTitle: 'Big Brother Season 26',
    type: 'TV Show',
    upfrontPayout: 35000,
    streamBoostPercent: 10,
    durationWeeks: 8,
    minPopularity: 15,
    logoUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=400',
    description: 'Theme music for eviction night intros.'
  },
  {
    id: 'mrbeast_games',
    mediaTitle: 'MrBeast $5,000,000 Beast Games',
    type: 'Web/Game',
    upfrontPayout: 150000,
    streamBoostPercent: 50,
    durationWeeks: 6,
    minPopularity: 50,
    logoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400',
    description: 'Official intro theme song for YouTube Beast Games.'
  },
  {
    id: 'gta_6_trailer',
    mediaTitle: 'GTA 6 Official Trailer 2',
    type: 'Trailer',
    upfrontPayout: 250000,
    streamBoostPercent: 100,
    durationWeeks: 12,
    minPopularity: 60,
    logoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
    description: 'Official background soundtrack for GTA VI Trailer 2.'
  },
  {
    id: 'spiderman_promo',
    mediaTitle: 'Spider-Man 4 Promotional Campaign',
    type: 'Promotional Campaign',
    upfrontPayout: 180000,
    streamBoostPercent: 60,
    durationWeeks: 8,
    minPopularity: 55,
    logoUrl: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&q=80&w=400',
    description: 'Teaser trailer & Marvel promotional theme.'
  },
  {
    id: 'huda_beauty_promo',
    mediaTitle: 'Huda Beauty Matte Line Promo',
    type: 'Promotional Campaign',
    upfrontPayout: 65000,
    streamBoostPercent: 20,
    durationWeeks: 6,
    minPopularity: 25,
    logoUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400',
    description: 'Background track for global influencer campaigns.'
  },
  {
    id: 'fenty_promo',
    mediaTitle: 'FENTY Beauty Global Campaign',
    type: 'Promotional Campaign',
    upfrontPayout: 95000,
    streamBoostPercent: 25,
    durationWeeks: 6,
    minPopularity: 35,
    logoUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400',
    description: 'Official global launching music for Fenty line.'
  }
];
