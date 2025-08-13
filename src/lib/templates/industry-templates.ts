/**
 * Comprehensive Industry-Specific Card Templates (Phase 2)
 * 
 * Expanded templates covering:
 * - Coffee & Beverage (4 variants)
 * - Restaurant & Dining (4 variants) 
 * - Fitness & Gym (3 variants)
 * - Beauty & Salon (3 variants)
 * - Retail & Shopping (4 variants)
 */

export const INDUSTRY_TEMPLATES = [
  // === COFFEE & BEVERAGE ===
  {
    id: 'coffee-shop-artisan',
    name: 'Artisan Coffee Shop',
    description: 'For specialty coffee shops and artisan cafes',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#6F4E37',
        iconEmoji: '☕',
        stampsRequired: 8,
        reward: 'Free Specialty Coffee',
        rewardDescription: 'Free artisan coffee or cold brew',
        cardDescription: 'Discover exceptional coffee, one cup at a time',
        howToEarnStamp: 'Purchase any specialty drink to earn a stamp',
        rewardDetails: 'Valid for any specialty coffee, cold brew, or signature drink',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '6h'
        },
        designConfig: {
          gridLayout: { columns: 4, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'premium',
          countdownSettings: { showExpiry: true, urgencyThreshold: 14 }
        }
      },
      membership: {
        cardColor: '#6F4E37',
        iconEmoji: '☕',
        totalSessions: 25,
        cost: 3500,
        durationDays: 30,
        membershipType: 'gold',
        membershipMode: 'sessions',
        reward: 'Coffee Connoisseur',
        rewardDescription: 'Monthly coffee tastings and 15% off all purchases',
        cardDescription: 'Premium coffee membership for true connoisseurs',
        designConfig: {
          progressStyle: 'circular',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 7 }
        }
      }
    }
  },
  {
    id: 'bubble-tea-shop',
    name: 'Bubble Tea Shop',
    description: 'Perfect for bubble tea and Asian beverage shops',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#E91E63',
        iconEmoji: '🧋',
        stampsRequired: 10,
        reward: 'Free Bubble Tea',
        rewardDescription: 'Free bubble tea with any toppings',
        cardDescription: 'Collect bubbles, earn rewards!',
        howToEarnStamp: 'Buy any drink to collect a bubble stamp',
        rewardDetails: 'Valid for any size bubble tea with up to 3 toppings',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 3,
          duplicateVisitBuffer: '4h'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'energetic',
          countdownSettings: { showExpiry: true, urgencyThreshold: 10 }
        }
      },
      membership: {
        cardColor: '#E91E63',
        iconEmoji: '🧋',
        totalSessions: 30,
        cost: 2000,
        durationDays: 30,
        membershipType: 'student',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 20,
        reward: 'Bubble Tea Club',
        rewardDescription: '20% off all drinks and exclusive flavors',
        cardDescription: 'Join the bubble tea club for sweet savings',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'modern',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 10 }
        }
      }
    }
  },
  {
    id: 'juice-bar',
    name: 'Juice & Smoothie Bar',
    description: 'For healthy juice bars and smoothie shops',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#32CD32',
        iconEmoji: '🥤',
        stampsRequired: 7,
        reward: 'Free Fresh Juice',
        rewardDescription: 'Free fresh juice or smoothie',
        cardDescription: 'Fuel your healthy lifestyle with fresh rewards',
        howToEarnStamp: 'Purchase any juice or smoothie',
        rewardDetails: 'Valid for any regular size fresh juice or smoothie',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '8h'
        },
        designConfig: {
          gridLayout: { columns: 7, rows: 1 },
          iconStyle: 'emoji',
          brandLevel: 'modern',
          countdownSettings: { showExpiry: true, urgencyThreshold: 5 }
        }
      },
      membership: {
        cardColor: '#32CD32',
        iconEmoji: '🥤',
        totalSessions: 20,
        cost: 2500,
        durationDays: 30,
        membershipType: 'wellness',
        membershipMode: 'sessions',
        reward: 'Wellness Boost',
        rewardDescription: 'Healthy lifestyle package with nutrition consultation',
        cardDescription: 'Your wellness journey starts with every sip',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'modern',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 5 }
        }
      }
    }
  },
  {
    id: 'bakery-pastry',
    name: 'Bakery & Pastry',
    description: 'For bakeries, pastry shops, and dessert cafes',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#D2691E',
        iconEmoji: '🧁',
        stampsRequired: 6,
        reward: 'Free Pastry',
        rewardDescription: 'Free pastry or dessert of your choice',
        cardDescription: 'Sweet treats for loyal customers',
        howToEarnStamp: 'Purchase any baked good to earn a stamp',
        rewardDetails: 'Valid for any pastry, cake slice, or dessert under ₹300',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '12h'
        },
        designConfig: {
          gridLayout: { columns: 3, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, urgencyThreshold: 7 }
        }
      },
      membership: {
        cardColor: '#D2691E',
        iconEmoji: '🧁',
        totalSessions: 12,
        cost: 1800,
        durationDays: 30,
        membershipType: 'sweet',
        membershipMode: 'sessions',
        reward: 'Sweet Rewards',
        rewardDescription: 'Monthly cake slice and 10% off all orders',
        cardDescription: 'For those who appreciate the sweeter things in life',
        designConfig: {
          progressStyle: 'circular',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 7 }
        }
      }
    }
  },

  // === RESTAURANT & DINING ===
  {
    id: 'restaurant-casual',
    name: 'Casual Restaurant',
    description: 'Perfect for family restaurants and casual dining',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#FF6347',
        iconEmoji: '🍽️',
        stampsRequired: 8,
        reward: 'Free Main Course',
        rewardDescription: 'Free main course meal of your choice',
        cardDescription: 'Dine with us and earn delicious rewards',
        howToEarnStamp: 'Spend ₹500 or more to earn a stamp',
        rewardDetails: 'Valid for any main course item up to ₹800 value',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 500,
          billProofRequired: true,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 4, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'moderate',
          countdownSettings: { showExpiry: true, urgencyThreshold: 3 }
        }
      },
      membership: {
        cardColor: '#FF6347',
        iconEmoji: '🍽️',
        totalSessions: 15,
        cost: 5000,
        durationDays: 30,
        membershipType: 'dining',
        membershipMode: 'sessions',
        reward: 'VIP Dining',
        rewardDescription: 'Priority seating and exclusive menu access',
        cardDescription: 'Elevate your dining experience with VIP benefits',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'premium',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 5 }
        }
      }
    }
  },
  {
    id: 'fine-dining',
    name: 'Fine Dining Restaurant',
    description: 'For upscale restaurants and fine dining establishments',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#2F4F4F',
        iconEmoji: '🍷',
        stampsRequired: 5,
        reward: 'Complimentary Dessert',
        rewardDescription: 'Complimentary chef\'s special dessert',
        cardDescription: 'Exquisite dining deserves exquisite rewards',
        howToEarnStamp: 'Complete a dining experience to earn recognition',
        rewardDetails: 'Chef\'s special dessert with wine pairing',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 2000,
          billProofRequired: true,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 1 },
          iconStyle: 'emoji',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, urgencyThreshold: 14 }
        }
      },
      membership: {
        cardColor: '#2F4F4F',
        iconEmoji: '🍷',
        totalSessions: 8,
        cost: 15000,
        durationDays: 60,
        membershipType: 'platinum',
        membershipMode: 'sessions',
        reward: 'Chef\'s Table',
        rewardDescription: 'Exclusive chef\'s table experiences and wine tastings',
        cardDescription: 'An epicurean journey for discerning palates',
        designConfig: {
          progressStyle: 'elegant',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 14 }
        }
      }
    }
  },
  {
    id: 'pizza-shop',
    name: 'Pizza Shop',
    description: 'For pizzerias and Italian casual dining',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#DC143C',
        iconEmoji: '🍕',
        stampsRequired: 10,
        reward: 'Free Pizza',
        rewardDescription: 'Free personal or regular pizza',
        cardDescription: 'Slice by slice towards your free pizza',
        howToEarnStamp: 'Order any pizza to earn a slice stamp',
        rewardDetails: 'Valid for personal or regular size pizza with up to 3 toppings',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '6h'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'moderate',
          countdownSettings: { showExpiry: true, urgencyThreshold: 7 }
        }
      },
      membership: {
        cardColor: '#DC143C',
        iconEmoji: '🍕',
        totalSessions: 20,
        cost: 3000,
        durationDays: 30,
        membershipType: 'family',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 15,
        reward: 'Pizza Family',
        rewardDescription: '15% off all orders and free delivery',
        cardDescription: 'Join the pizza family for delicious savings',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'moderate',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 10 }
        }
      }
    }
  },
  {
    id: 'fast-food',
    name: 'Fast Food Chain',
    description: 'For quick service restaurants and fast food chains',
    industry: 'food_beverage',
    variants: {
      stamp: {
        cardColor: '#FFD700',
        iconEmoji: '🍔',
        stampsRequired: 12,
        reward: 'Free Combo Meal',
        rewardDescription: 'Free burger combo with fries and drink',
        cardDescription: 'Fast food, fast rewards!',
        howToEarnStamp: 'Purchase any combo meal to earn a stamp',
        rewardDetails: 'Valid for any regular combo meal',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 300,
          billProofRequired: false,
          maxStampsPerDay: 3,
          duplicateVisitBuffer: '4h'
        },
        designConfig: {
          gridLayout: { columns: 4, rows: 3 },
          iconStyle: 'emoji',
          brandLevel: 'energetic',
          countdownSettings: { showExpiry: true, urgencyThreshold: 21 }
        }
      },
      membership: {
        cardColor: '#FFD700',
        iconEmoji: '🍔',
        totalSessions: 50,
        cost: 1500,
        durationDays: 30,
        membershipType: 'express',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 10,
        reward: 'Fast Track',
        rewardDescription: '10% off all orders and skip-the-line privileges',
        cardDescription: 'Speed up your savings with fast track benefits',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'energetic',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 15 }
        }
      }
    }
  },

  // === FITNESS & GYM ===
  {
    id: 'fitness-premium-gym',
    name: 'Premium Fitness Center',
    description: 'For high-end gyms and fitness centers',
    industry: 'fitness',
    variants: {
      stamp: {
        cardColor: '#1E90FF',
        iconEmoji: '🏋️',
        stampsRequired: 15,
        reward: 'Free Personal Training',
        rewardDescription: 'Free 1-hour personal training session',
        cardDescription: 'Strength builds rewards, dedication builds results',
        howToEarnStamp: 'Complete a workout session to earn a strength stamp',
        rewardDetails: '1-hour session with certified personal trainer',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 3 },
          iconStyle: 'emoji',
          brandLevel: 'premium',
          countdownSettings: { showExpiry: false, urgencyThreshold: 1 }
        }
      },
      membership: {
        cardColor: '#1E90FF',
        iconEmoji: '🏋️',
        totalSessions: 40,
        cost: 8000,
        durationDays: 30,
        membershipType: 'platinum',
        membershipMode: 'sessions',
        reward: 'Elite Fitness',
        rewardDescription: 'Access to all premium equipment and group classes',
        cardDescription: 'Elite membership for serious fitness enthusiasts',
        designConfig: {
          progressStyle: 'circular',
          brandLevel: 'premium',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 5 }
        }
      }
    }
  },
  {
    id: 'yoga-studio',
    name: 'Yoga Studio',
    description: 'For yoga studios and wellness centers',
    industry: 'fitness',
    variants: {
      stamp: {
        cardColor: '#9370DB',
        iconEmoji: '🧘',
        stampsRequired: 10,
        reward: 'Free Yoga Class',
        rewardDescription: 'Free drop-in class of your choice',
        cardDescription: 'Find balance through practice and rewards',
        howToEarnStamp: 'Attend any class to earn a zen stamp',
        rewardDetails: 'Valid for any regular group class or beginner session',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '12h'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, urgencyThreshold: 14 }
        }
      },
      membership: {
        cardColor: '#9370DB',
        iconEmoji: '🧘',
        totalSessions: 20,
        cost: 4000,
        durationDays: 30,
        membershipType: 'zen',
        membershipMode: 'sessions',
        reward: 'Mindful Journey',
        rewardDescription: 'Unlimited classes plus meditation workshops',
        cardDescription: 'Embrace your wellness journey with unlimited access',
        designConfig: {
          progressStyle: 'circular',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 7 }
        }
      }
    }
  },
  {
    id: 'boxing-martial-arts',
    name: 'Boxing & Martial Arts',
    description: 'For boxing gyms and martial arts schools',
    industry: 'fitness',
    variants: {
      stamp: {
        cardColor: '#B22222',
        iconEmoji: '🥊',
        stampsRequired: 12,
        reward: 'Free Sparring Session',
        rewardDescription: 'Free sparring or technique session',
        cardDescription: 'Train hard, fight smart, earn rewards',
        howToEarnStamp: 'Complete a training session to earn a fighter stamp',
        rewardDetails: 'Valid for sparring session or advanced technique class',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '12h'
        },
        designConfig: {
          gridLayout: { columns: 4, rows: 3 },
          iconStyle: 'emoji',
          brandLevel: 'energetic',
          countdownSettings: { showExpiry: false, urgencyThreshold: 1 }
        }
      },
      membership: {
        cardColor: '#B22222',
        iconEmoji: '🥊',
        totalSessions: 25,
        cost: 6000,
        durationDays: 30,
        membershipType: 'fighter',
        membershipMode: 'sessions',
        reward: 'Champion Training',
        rewardDescription: 'Access to advanced classes and equipment',
        cardDescription: 'Train like a champion with unlimited access',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'energetic',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 5 }
        }
      }
    }
  },

  // === BEAUTY & SALON ===
  {
    id: 'hair-salon-premium',
    name: 'Premium Hair Salon',
    description: 'For upscale hair salons and styling studios',
    industry: 'beauty_wellness',
    variants: {
      stamp: {
        cardColor: '#FF1493',
        iconEmoji: '💇',
        stampsRequired: 6,
        reward: 'Free Hair Service',
        rewardDescription: 'Free cut, color touch-up, or styling',
        cardDescription: 'Beautiful hair deserves beautiful rewards',
        howToEarnStamp: 'Book any hair service to earn a style stamp',
        rewardDetails: 'Valid for cut, color touch-up, or signature styling',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 1500,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 3, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, urgencyThreshold: 30 }
        }
      },
      membership: {
        cardColor: '#FF1493',
        iconEmoji: '💇',
        totalSessions: 8,
        cost: 12000,
        durationDays: 90,
        membershipType: 'style',
        membershipMode: 'sessions',
        reward: 'Style Icon',
        rewardDescription: 'Priority booking and exclusive treatments',
        cardDescription: 'Become a style icon with VIP salon privileges',
        designConfig: {
          progressStyle: 'elegant',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 21 }
        }
      }
    }
  },
  {
    id: 'nail-salon',
    name: 'Nail Salon & Spa',
    description: 'For nail salons and manicure/pedicure services',
    industry: 'beauty_wellness',
    variants: {
      stamp: {
        cardColor: '#FF69B4',
        iconEmoji: '💅',
        stampsRequired: 8,
        reward: 'Free Manicure',
        rewardDescription: 'Free basic manicure or pedicure',
        cardDescription: 'Perfect nails, perfect rewards',
        howToEarnStamp: 'Book any nail service to earn a beauty stamp',
        rewardDetails: 'Valid for basic manicure, pedicure, or nail art',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 800,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 4, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, urgencyThreshold: 21 }
        }
      },
      membership: {
        cardColor: '#FF69B4',
        iconEmoji: '💅',
        totalSessions: 12,
        cost: 6000,
        durationDays: 60,
        membershipType: 'beauty',
        membershipMode: 'sessions',
        reward: 'Nail Artistry',
        rewardDescription: 'Monthly nail art and premium treatments',
        cardDescription: 'Express your style with unlimited nail artistry',
        designConfig: {
          progressStyle: 'circular',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 14 }
        }
      }
    }
  },
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness Center',
    description: 'For full-service spas and wellness centers',
    industry: 'beauty_wellness',
    variants: {
      stamp: {
        cardColor: '#20B2AA',
        iconEmoji: '🧖',
        stampsRequired: 5,
        reward: 'Free Facial',
        rewardDescription: 'Free signature facial treatment',
        cardDescription: 'Relax, rejuvenate, and earn wellness rewards',
        howToEarnStamp: 'Book any spa service to earn a wellness stamp',
        rewardDetails: 'Valid for signature facial or relaxation treatment',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 2000,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 1 },
          iconStyle: 'emoji',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, urgencyThreshold: 60 }
        }
      },
      membership: {
        cardColor: '#20B2AA',
        iconEmoji: '🧖',
        totalSessions: 6,
        cost: 18000,
        durationDays: 90,
        membershipType: 'wellness',
        membershipMode: 'sessions',
        reward: 'Serenity Package',
        rewardDescription: 'Comprehensive wellness package with massage therapy',
        cardDescription: 'Holistic wellness journey with premium spa access',
        designConfig: {
          progressStyle: 'elegant',
          brandLevel: 'luxury',
          countdownSettings: { showExpiry: true, showSessionsLeft: true, urgencyThreshold: 30 }
        }
      }
    }
  },

  // === RETAIL & SHOPPING ===
  {
    id: 'fashion-boutique',
    name: 'Fashion Boutique',
    description: 'For clothing stores and fashion boutiques',
    industry: 'retail',
    variants: {
      stamp: {
        cardColor: '#8A2BE2',
        iconEmoji: '👗',
        stampsRequired: 10,
        reward: '25% Discount',
        rewardDescription: '25% off your next fashion purchase',
        cardDescription: 'Style rewards for fashion lovers',
        howToEarnStamp: 'Spend ₹2000 or more to earn a style stamp',
        rewardDetails: 'Valid on regular priced items, cannot be combined with sales',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 2000,
          billProofRequired: true,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'premium',
          countdownSettings: { showExpiry: true, urgencyThreshold: 30 }
        }
      },
      membership: {
        cardColor: '#8A2BE2',
        iconEmoji: '👗',
        totalSessions: 15,
        cost: 5000,
        durationDays: 180,
        membershipType: 'style',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 20,
        reward: 'Style Insider',
        rewardDescription: '20% off all purchases and early access to collections',
        cardDescription: 'Exclusive access to the latest fashion trends',
        designConfig: {
          progressStyle: 'elegant',
          brandLevel: 'premium',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 60 }
        }
      }
    }
  },
  {
    id: 'electronics-store',
    name: 'Electronics Store',
    description: 'For electronics retailers and tech stores',
    industry: 'retail',
    variants: {
      stamp: {
        cardColor: '#4169E1',
        iconEmoji: '📱',
        stampsRequired: 8,
        reward: 'Tech Voucher',
        rewardDescription: '₹1000 voucher for next tech purchase',
        cardDescription: 'Upgrade your tech, upgrade your rewards',
        howToEarnStamp: 'Spend ₹5000 or more to earn a tech stamp',
        rewardDetails: 'Valid for any product, can be combined with ongoing offers',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 5000,
          billProofRequired: true,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '1d'
        },
        designConfig: {
          gridLayout: { columns: 4, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'modern',
          countdownSettings: { showExpiry: true, urgencyThreshold: 45 }
        }
      },
      membership: {
        cardColor: '#4169E1',
        iconEmoji: '📱',
        totalSessions: 12,
        cost: 8000,
        durationDays: 365,
        membershipType: 'tech',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 15,
        reward: 'Tech Pro',
        rewardDescription: '15% off all electronics and priority support',
        cardDescription: 'Professional tech benefits for serious enthusiasts',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'modern',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 90 }
        }
      }
    }
  },
  {
    id: 'bookstore-cafe',
    name: 'Bookstore & Cafe',
    description: 'For bookstores and literary cafes',
    industry: 'retail',
    variants: {
      stamp: {
        cardColor: '#8B4513',
        iconEmoji: '📚',
        stampsRequired: 7,
        reward: 'Free Book',
        rewardDescription: 'Free book under ₹500 or coffee',
        cardDescription: 'Read more, discover more, earn more',
        howToEarnStamp: 'Purchase any book or spend 2 hours reading',
        rewardDetails: 'Valid for any book under ₹500 or premium coffee',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 300,
          billProofRequired: false,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '8h'
        },
        designConfig: {
          gridLayout: { columns: 7, rows: 1 },
          iconStyle: 'emoji',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, urgencyThreshold: 60 }
        }
      },
      membership: {
        cardColor: '#8B4513',
        iconEmoji: '📚',
        totalSessions: 20,
        cost: 3000,
        durationDays: 90,
        membershipType: 'reader',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 20,
        reward: 'Bookworm Club',
        rewardDescription: '20% off all books and free coffee refills',
        cardDescription: 'Join fellow book lovers in the ultimate reading experience',
        designConfig: {
          progressStyle: 'circular',
          brandLevel: 'elegant',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 30 }
        }
      }
    }
  },
  {
    id: 'grocery-market',
    name: 'Grocery & Market',
    description: 'For grocery stores and local markets',
    industry: 'retail',
    variants: {
      stamp: {
        cardColor: '#228B22',
        iconEmoji: '🛒',
        stampsRequired: 15,
        reward: '₹500 Grocery Credit',
        rewardDescription: '₹500 credit for grocery shopping',
        cardDescription: 'Smart shopping, smart savings',
        howToEarnStamp: 'Spend ₹1000 or more to earn a shopping stamp',
        rewardDetails: 'Valid for any grocery items, fresh produce, or household goods',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 1000,
          billProofRequired: true,
          maxStampsPerDay: 2,
          duplicateVisitBuffer: '12h'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 3 },
          iconStyle: 'emoji',
          brandLevel: 'moderate',
          countdownSettings: { showExpiry: true, urgencyThreshold: 21 }
        }
      },
      membership: {
        cardColor: '#228B22',
        iconEmoji: '🛒',
        totalSessions: 30,
        cost: 2000,
        durationDays: 30,
        membershipType: 'family',
        membershipMode: 'discount',
        discountType: 'percentage',
        discountValue: 10,
        reward: 'Smart Shopper',
        rewardDescription: '10% off all groceries and free delivery',
        cardDescription: 'Family savings for everyday essentials',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'moderate',
          countdownSettings: { showExpiry: true, showUsesLeft: true, urgencyThreshold: 15 }
        }
      }
    }
  },

  // === CUSTOM TEMPLATE ===
  {
    id: 'custom',
    name: 'Start from Scratch',
    description: 'Create a completely custom card',
    industry: 'custom',
    variants: {
      stamp: {
        cardColor: '#6B7280',
        iconEmoji: '⭐',
        stampsRequired: 10,
        reward: '',
        rewardDescription: '',
        cardDescription: '',
        howToEarnStamp: '',
        rewardDetails: '',
        stampConfig: {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '12h'
        },
        designConfig: {
          gridLayout: { columns: 5, rows: 2 },
          iconStyle: 'emoji',
          brandLevel: 'minimal',
          countdownSettings: { showExpiry: false }
        }
      },
      membership: {
        cardColor: '#6B7280',
        iconEmoji: '⭐',
        totalSessions: 10,
        cost: 1000,
        durationDays: 30,
        membershipType: 'basic',
        membershipMode: 'sessions',
        reward: '',
        rewardDescription: '',
        cardDescription: '',
        designConfig: {
          progressStyle: 'bar',
          brandLevel: 'minimal',
          countdownSettings: { showExpiry: false }
        }
      }
    }
  }
]

export default INDUSTRY_TEMPLATES