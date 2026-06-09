export interface eBayComp {
  id: string;
  title: string;
  price: number;
  shipping: number;
  dateSold: string;
  imageUrl: string;
  link: string;
}

export interface ScannableItem {
  id: string;
  title: string;
  category: string;
  cogs: number;
  weightClass: 'Small' | 'Medium' | 'Large';
  description: string;
  suggestedTitle: string;
  suggestedDescription: string;
  tags: string[];
  imageUrl: string;
  comps: eBayComp[];
  customSearchQuery?: string;
  price?: number;
}

export interface DailyDeal {
  id: string;
  title: string;
  source: 'Facebook Marketplace' | 'Craigslist' | 'OfferUp';
  listPrice: number;
  estSoldPrice: number;
  potentialProfit: number;
  dealScore: number; // 0 to 100
  imageUrl: string;
  location: string;
  category: string;
  link: string;
}

export const MOCK_SCANNABLE_ITEMS: ScannableItem[] = [
  {
    id: 'scan-1',
    title: 'Vintage Nike Colorblock Windbreaker',
    category: 'Clothing & Accessories > Men\'s Clothing > Coats, Jackets & Vests',
    cogs: 8.00,
    weightClass: 'Medium',
    description: 'Vintage 90s Nike windbreaker with bold red, white, and blue panels. Features embroidered swoosh, mesh lining, and packable hood.',
    suggestedTitle: 'Vintage 90s Nike Colorblock Windbreaker Jacket Red Blue White Swoosh Size L',
    suggestedDescription: 'Vintage 90s Nike colorblock windbreaker jacket in excellent condition. Bold colorway (red, white, blue) with classic embroidered Nike swoosh logo on the left chest. Packable hood in collar, zip side pockets, and elastic cuffs. Ideal for streetwear or retro athletic collections.',
    tags: ['vintage nike', 'nike windbreaker', 'colorblock jacket', '90s streetwear', 'retro nike'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
    comps: [
      {
        id: 'c1-1',
        title: 'Vintage 90s Nike Windbreaker Jacket Colorblock Size Large Red White Blue',
        price: 49.99,
        shipping: 6.50,
        dateSold: '2026-05-28',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c1-2',
        title: 'Nike Vintage Color Block Zip Up Windbreaker Jacket 90s Mens Size L Swoosh',
        price: 45.00,
        shipping: 7.20,
        dateSold: '2026-05-26',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c1-3',
        title: 'Vintage Nike Windbreaker Outerwear 90s panel design Blue Red Size Large',
        price: 52.00,
        shipping: 5.99,
        dateSold: '2026-05-22',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c1-4',
        title: 'Retro Nike 1990s wind jacket color block sportswear swoosh',
        price: 39.00,
        shipping: 8.00,
        dateSold: '2026-05-18',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      }
    ]
  },
  {
    id: 'scan-2',
    title: 'Nintendo Switch Pro Controller (Black)',
    category: 'Video Games & Consoles > Video Game Accessories > Controllers & Attachments',
    cogs: 5.00,
    weightClass: 'Small',
    description: 'Official OEM Nintendo Switch Pro Controller in black. Cordless, wireless gamepad, tested and verified working.',
    suggestedTitle: 'Official Nintendo Switch Pro Controller Wireless Gamepad Black OEM Tested',
    suggestedDescription: 'Original wireless Nintendo Switch Pro Controller in classic black. Fully tested and 100% operational. Analog sticks are firm with zero drift; all buttons, triggers, and D-pad are crisp and responsive. Minor surface wear from light play. Includes original battery (charging cable not included).',
    tags: ['nintendo switch pro controller', 'switch controller', 'wireless switch gamepad', 'oem nintendo controller', 'switch pro'],
    imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&auto=format&fit=crop&q=80',
    comps: [
      {
        id: 'c2-1',
        title: 'Nintendo Switch Pro Controller Wireless OEM Black - Tested & Working',
        price: 38.50,
        shipping: 4.99,
        dateSold: '2026-05-29',
        imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c2-2',
        title: 'Official Nintendo Switch Pro Controller - Black (HAC-013) Original Cordless',
        price: 42.00,
        shipping: 5.50,
        dateSold: '2026-05-27',
        imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c2-3',
        title: 'Nintendo Switch Pro Controller OEM Wireless Gamepad - Excellent Condition',
        price: 39.99,
        shipping: 0.00,
        dateSold: '2026-05-25',
        imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      }
    ]
  },
  {
    id: 'scan-3',
    title: 'Le Creuset Enameled Cast Iron Dutch Oven 4.5 Qt Flame',
    category: 'Home & Garden > Kitchen, Dining & Bar > Cookware > Dutch Ovens',
    cogs: 25.00,
    weightClass: 'Large',
    description: 'Enamel cast iron round Dutch oven, Flame (bright orange) color. Signature collection, 4.5 quart size.',
    suggestedTitle: 'Le Creuset Enameled Cast Iron Round Dutch Oven 4.5 Qt Flame Orange Lid Sign. #24',
    suggestedDescription: 'Genuine Le Creuset 4.5 Quart enameled cast iron Dutch oven in the iconic Flame orange color. Made in France. Standard size #24. Heat retention is unmatched. Cooking surface has light, typical crazing/staining consistent with normal use but no chips or raw cast iron exposed. Lid fits snugly. Ready for years of cooking.',
    tags: ['le creuset dutch oven', 'le creuset flame', 'cast iron dutch oven', 'enameled cast iron', 'le creuset 24'],
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80',
    comps: [
      {
        id: 'c3-1',
        title: 'Le Creuset Signature Enameled Cast Iron Round Dutch Oven 4.5 Qt Flame Orange #24',
        price: 149.00,
        shipping: 18.50,
        dateSold: '2026-05-29',
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c3-2',
        title: 'Le Creuset Cast Iron Dutch Oven Flame Orange Round 4.5 Quart French Cookware',
        price: 135.00,
        shipping: 20.00,
        dateSold: '2026-05-26',
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c3-3',
        title: 'Vintage Le Creuset Flame Orange Cast Iron Dutch Oven #24 Round 4.5qt France',
        price: 155.00,
        shipping: 15.99,
        dateSold: '2026-05-20',
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      }
    ]
  },
  {
    id: 'scan-4',
    title: 'Sony WH-1000XM4 Noise Canceling Headphones',
    category: 'Consumer Electronics > Portable Audio & Headphones > Headphones',
    cogs: 15.00,
    weightClass: 'Medium',
    description: 'Sony WH-1000XM4 Wireless Noise Cancelling Over-the-Ear Headphones in Matte Black. Fully tested, active noise cancellation works.',
    suggestedTitle: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones Black - Checked Good Sound',
    suggestedDescription: 'Sony WH-1000XM4 over-ear active noise-canceling headphones in black. Tested and sounding excellent. Battery holds a full charge. Earpads are soft and clean with minimal signs of use. Ships with original carrying case, 3.5mm aux cable, and USB-C charging cord. The industry standard in comfort and noise reduction.',
    tags: ['sony wh-1000xm4', 'sony headphones', 'noise canceling headphones', 'wireless over ear', 'sony active noise'],
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    comps: [
      {
        id: 'c4-1',
        title: 'Sony WH-1000XM4 Noise Cancelling Wireless Headphones - Black (Tested & Good)',
        price: 125.00,
        shipping: 6.99,
        dateSold: '2026-05-28',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c4-2',
        title: 'Sony WH-1000XM4 Wireless Over-Ear Active Noise Canceling Headphones Black Case',
        price: 130.00,
        shipping: 8.50,
        dateSold: '2026-05-27',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c4-3',
        title: 'Sony WH1000XM4 Active Noise Cancelling Headset Black USB Cord Case Included',
        price: 118.00,
        shipping: 5.95,
        dateSold: '2026-05-24',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      }
    ]
  },
  {
    id: 'scan-5',
    title: 'Harry Potter 1st Edition Hardcover Books Set (1-4)',
    category: 'Books & Magazines > Books',
    cogs: 4.00,
    weightClass: 'Medium',
    description: 'Set of books 1-4 of Harry Potter (Sorcerer\'s Stone, Chamber of Secrets, Prisoner of Azkaban, Goblet of Fire). Hardcovers with dust jackets.',
    suggestedTitle: 'Harry Potter 1st Edition Hardcover Set Books 1-4 J.K. Rowling Scholastic DJ',
    suggestedDescription: 'Set of Harry Potter hardcovers, books 1 through 4 (Sorcerer\'s Stone, Chamber of Secrets, Prisoner of Azkaban, Goblet of Fire) by J.K. Rowling. Published by Scholastic. Early printings of first editions (not first state). All feature original dust jackets in good condition, complete binding, clean pages. A great starter set for a young reader\'s library.',
    tags: ['harry potter books', 'harry potter 1st edition', 'harry potter hardcover', 'scholastic harry potter', 'rowling books'],
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80',
    comps: [
      {
        id: 'c5-1',
        title: 'Harry Potter Books Hardcover Set 1-4 First American Edition J K Rowling DJ',
        price: 29.99,
        shipping: 8.95,
        dateSold: '2026-05-28',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      },
      {
        id: 'c5-2',
        title: 'Harry Potter J.K. Rowling Books 1 2 3 4 Hardcover Set Dustjacket Collectible',
        price: 24.50,
        shipping: 9.99,
        dateSold: '2026-05-23',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&auto=format&fit=crop&q=60',
        link: 'https://ebay.com'
      }
    ]
  }
];

export const MOCK_DAILY_DEALS: DailyDeal[] = [
  {
    id: 'deal-1',
    title: 'Vintage Herman Miller Aeron Chair - Size B',
    source: 'Facebook Marketplace',
    listPrice: 150.00,
    estSoldPrice: 550.00,
    potentialProfit: 400.00,
    dealScore: 94,
    imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=80',
    location: 'Brooklyn, NY (2.4 mi)',
    category: 'Office Supplies > Chairs',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-2',
    title: 'Vintage Canon AE-1 Film Camera w/ 50mm Lens',
    source: 'Craigslist',
    listPrice: 40.00,
    estSoldPrice: 180.00,
    potentialProfit: 140.00,
    dealScore: 89,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
    location: 'Queens, NY (5.1 mi)',
    category: 'Cameras & Optics > Photography',
    link: 'https://craigslist.org'
  },
  {
    id: 'deal-3',
    title: 'Patagonia Nano Puff Jacket Men\'s Medium Black',
    source: 'OfferUp',
    listPrice: 20.00,
    estSoldPrice: 95.00,
    potentialProfit: 75.00,
    dealScore: 86,
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop&q=80',
    location: 'Manhattan, NY (1.8 mi)',
    category: 'Clothing > Jackets',
    link: 'https://offerup.com'
  },
  {
    id: 'deal-4',
    title: 'Sony PlayStation 4 Pro 1TB Console',
    source: 'Facebook Marketplace',
    listPrice: 50.00,
    estSoldPrice: 140.00,
    potentialProfit: 90.00,
    dealScore: 82,
    imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop&q=80',
    location: 'Bronx, NY (8.3 mi)',
    category: 'Electronics > Video Games',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-5',
    title: 'KitchenAid Artisan Series 5-Quart Stand Mixer',
    source: 'Craigslist',
    listPrice: 80.00,
    estSoldPrice: 220.00,
    potentialProfit: 140.00,
    dealScore: 81,
    imageUrl: 'https://images.unsplash.com/photo-1594269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80',
    location: 'Staten Island, NY (12.5 mi)',
    category: 'Home & Kitchen > Small Appliances',
    link: 'https://craigslist.org'
  },
  {
    id: 'deal-6',
    title: 'Rare Vintage Pokémon Cards Binder (Base Set/Jungle)',
    source: 'Facebook Marketplace',
    listPrice: 100.00,
    estSoldPrice: 350.00,
    potentialProfit: 250.00,
    dealScore: 88,
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    location: 'Brooklyn, NY (3.0 mi)',
    category: 'Collectibles > Trading Cards',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-7',
    title: 'Bose QuietComfort 35 II Headset',
    source: 'OfferUp',
    listPrice: 35.00,
    estSoldPrice: 90.00,
    potentialProfit: 55.00,
    dealScore: 79,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
    location: 'Hoboken, NJ (4.2 mi)',
    category: 'Electronics > Headphones',
    link: 'https://offerup.com'
  },
  {
    id: 'deal-8',
    title: 'Sega Dreamcast Console w/ Controller & Cables',
    source: 'Craigslist',
    listPrice: 30.00,
    estSoldPrice: 95.00,
    potentialProfit: 65.00,
    dealScore: 80,
    imageUrl: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=500&auto=format&fit=crop&q=80',
    location: 'Manhattan, NY (2.0 mi)',
    category: 'Electronics > Consoles',
    link: 'https://craigslist.org'
  },
  {
    id: 'deal-9',
    title: 'Yeti Tundra 45 Cooler Tan',
    source: 'Facebook Marketplace',
    listPrice: 100.00,
    estSoldPrice: 220.00,
    potentialProfit: 120.00,
    dealScore: 78,
    imageUrl: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=500&auto=format&fit=crop&q=80',
    location: 'Queens, NY (7.0 mi)',
    category: 'Outdoor Recreation > Coolers',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-10',
    title: 'Apple iPad Air (4th Generation) 64GB WiFi',
    source: 'OfferUp',
    listPrice: 120.00,
    estSoldPrice: 280.00,
    potentialProfit: 160.00,
    dealScore: 83,
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80',
    location: 'Brooklyn, NY (1.5 mi)',
    category: 'Electronics > Tablets',
    link: 'https://offerup.com'
  },
  {
    id: 'deal-11',
    title: 'Lego Star Wars Millennium Falcon 75105 (Complete)',
    source: 'Facebook Marketplace',
    listPrice: 40.00,
    estSoldPrice: 110.00,
    potentialProfit: 70.00,
    dealScore: 77,
    imageUrl: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=80',
    location: 'Manhattan, NY (3.5 mi)',
    category: 'Toys > Building Blocks',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-12',
    title: 'Red Wing Iron Ranger Boots Men\'s 9D Brown',
    source: 'Craigslist',
    listPrice: 90.00,
    estSoldPrice: 220.00,
    potentialProfit: 130.00,
    dealScore: 79,
    imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=500&auto=format&fit=crop&q=80',
    location: 'Queens, NY (6.4 mi)',
    category: 'Clothing > Shoes',
    link: 'https://craigslist.org'
  },
  {
    id: 'deal-13',
    title: 'Tascam DR-40X Four-Track Audio Recorder',
    source: 'OfferUp',
    listPrice: 50.00,
    estSoldPrice: 130.00,
    potentialProfit: 80.00,
    dealScore: 81,
    imageUrl: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?w=500&auto=format&fit=crop&q=80',
    location: 'Bronx, NY (10.0 mi)',
    category: 'Electronics > Audio',
    link: 'https://offerup.com'
  },
  {
    id: 'deal-14',
    title: 'Vintage Pioneer SX-650 Stereo Receiver',
    source: 'Facebook Marketplace',
    listPrice: 120.00,
    estSoldPrice: 320.00,
    potentialProfit: 200.00,
    dealScore: 84,
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80',
    location: 'Brooklyn, NY (4.8 mi)',
    category: 'Audio > Receivers',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-15',
    title: 'Dyson V11 Animal Cordless Vacuum',
    source: 'Craigslist',
    listPrice: 100.00,
    estSoldPrice: 250.00,
    potentialProfit: 150.00,
    dealScore: 78,
    imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&auto=format&fit=crop&q=80',
    location: 'Staten Island, NY (15.0 mi)',
    category: 'Appliances > Vacuum',
    link: 'https://craigslist.org'
  },
  {
    id: 'deal-16',
    title: 'TaylorMade Stealth Driver 9.0 Stiff Flex',
    source: 'Facebook Marketplace',
    listPrice: 150.00,
    estSoldPrice: 320.00,
    potentialProfit: 170.00,
    dealScore: 80,
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500&auto=format&fit=crop&q=80',
    location: 'Brooklyn, NY (5.5 mi)',
    category: 'Sports > Golf Clubs',
    link: 'https://facebook.com'
  },
  {
    id: 'deal-17',
    title: 'Nintendo 3DS XL Pikachu Edition (Tested)',
    source: 'OfferUp',
    listPrice: 80.00,
    estSoldPrice: 260.00,
    potentialProfit: 180.00,
    dealScore: 87,
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    location: 'Hoboken, NJ (3.8 mi)',
    category: 'Electronics > Consoles',
    link: 'https://offerup.com'
  }
];
