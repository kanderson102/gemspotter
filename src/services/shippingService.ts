export const SHIPPING_COSTS = {
  Small: 6.00,
  Medium: 12.00,
  Large: 25.00,
};

/**
 * Gets the shipping cost based on the weight class
 */
export const getShippingCost = (weightClass: 'Small' | 'Medium' | 'Large'): number => {
  return SHIPPING_COSTS[weightClass] || 12.00;
};

/**
 * Maps a category name to the appropriate eBay category fee rate.
 * Standard rates on eBay range from 8% to 15% + $0.30 per order.
 * We model the percentage rate here.
 */
export const getEbayFeeRate = (category: string): number => {
  const normalized = category.toLowerCase();
  
  if (normalized.includes('clothing') || normalized.includes('apparel') || normalized.includes('shoes') || normalized.includes('coat') || normalized.includes('jacket')) {
    // Clothing & Accessories are generally around 15%
    return 0.15;
  }
  if (normalized.includes('console') || normalized.includes('video game') || normalized.includes('controller') || normalized.includes('gamepad')) {
    // Video Game Consoles are 6.35% or 10%, accessories are ~12.5%
    return 0.10;
  }
  if (normalized.includes('book') || normalized.includes('magazine') || normalized.includes('media')) {
    // Books & Media are 14.6%
    return 0.146;
  }
  if (normalized.includes('electronic') || normalized.includes('audio') || normalized.includes('headphone') || normalized.includes('camera')) {
    // Electronics and accessories are ~12.0%
    return 0.12;
  }
  if (normalized.includes('art') || normalized.includes('collectible') || normalized.includes('toy')) {
    // Toys and Collectibles are ~12.5%
    return 0.125;
  }
  
  // Default eBay platform fee is 13.25%
  return 0.1325;
};

/**
 * Calculates the exact eBay fee including percentage and flat transaction fee ($0.30)
 */
export const calculateEbayFee = (price: number, category: string): number => {
  const rate = getEbayFeeRate(category);
  return (price * rate) + 0.30;
};
