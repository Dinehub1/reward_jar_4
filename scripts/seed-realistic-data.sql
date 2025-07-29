-- Seed Realistic Test Data for RewardJar 4.0
-- Creates 10 diverse businesses with realistic profiles

-- First, create business owner users (these will be regular business users, not admins)
INSERT INTO users (id, email, role_id) VALUES
('b1000000-0000-0000-0000-000000000001', 'owner@cafebliss.com', 2),
('b1000000-0000-0000-0000-000000000002', 'manager@glowsalon.com', 2),
('b1000000-0000-0000-0000-000000000003', 'admin@fitzonegym.com', 2),
('b1000000-0000-0000-0000-000000000004', 'contact@oceanview.com', 2),
('b1000000-0000-0000-0000-000000000005', 'info@bookwormcafe.com', 2),
('b1000000-0000-0000-0000-000000000006', 'hello@zenmedispa.com', 2),
('b1000000-0000-0000-0000-000000000007', 'orders@pizzapalace.com', 2),
('b1000000-0000-0000-0000-000000000008', 'support@techrepair.com', 2),
('b1000000-0000-0000-0000-000000000009', 'team@floraldesigns.com', 2),
('b1000000-0000-0000-0000-000000000010', 'contact@quickcuts.com', 2)
ON CONFLICT (id) DO NOTHING;

-- Create 10 realistic businesses with diverse industries
INSERT INTO businesses (id, name, description, contact_email, owner_id, status, created_at) VALUES
(
  'bus00000-0000-0000-0000-000000000001',
  'Cafe Bliss',
  'Artisan coffee shop serving premium roasted beans, fresh pastries, and light lunch options in a cozy downtown setting.',
  'owner@cafebliss.com',
  'b1000000-0000-0000-0000-000000000001',
  'active',
  NOW() - INTERVAL '45 days'
),
(
  'bus00000-0000-0000-0000-000000000002',
  'Glow Beauty Salon',
  'Full-service beauty salon offering haircuts, coloring, skincare treatments, and nail services with experienced stylists.',
  'manager@glowsalon.com',
  'b1000000-0000-0000-0000-000000000002',
  'active',
  NOW() - INTERVAL '38 days'
),
(
  'bus00000-0000-0000-0000-000000000003',
  'FitZone Gym',
  'Modern fitness center with state-of-the-art equipment, personal training, group classes, and wellness programs.',
  'admin@fitzonegym.com',
  'b1000000-0000-0000-0000-000000000003',
  'active',
  NOW() - INTERVAL '52 days'
),
(
  'bus00000-0000-0000-0000-000000000004',
  'Ocean View Restaurant',
  'Fine dining restaurant specializing in fresh seafood and Mediterranean cuisine with stunning harbor views.',
  'contact@oceanview.com',
  'b1000000-0000-0000-0000-000000000004',
  'active',
  NOW() - INTERVAL '67 days'
),
(
  'bus00000-0000-0000-0000-000000000005',
  'The Bookworm Cafe',
  'Unique bookstore-cafe combination offering specialty coffee, homemade treats, and a curated selection of books.',
  'info@bookwormcafe.com',
  'b1000000-0000-0000-0000-000000000005',
  'active',
  NOW() - INTERVAL '29 days'
),
(
  'bus00000-0000-0000-0000-000000000006',
  'Zen Medi-Spa',
  'Luxury medical spa providing advanced skincare treatments, massage therapy, and holistic wellness services.',
  'hello@zenmedispa.com',
  'b1000000-0000-0000-0000-000000000006',
  'active',
  NOW() - INTERVAL '41 days'
),
(
  'bus00000-0000-0000-0000-000000000007',
  'Tony\'s Pizza Palace',
  'Family-owned pizzeria serving authentic Italian pizza, pasta, and traditional dishes made with fresh ingredients.',
  'orders@pizzapalace.com',
  'b1000000-0000-0000-0000-000000000007',
  'active',
  NOW() - INTERVAL '73 days'
),
(
  'bus00000-0000-0000-0000-000000000008',
  'TechFix Repair Shop',
  'Professional electronics repair service specializing in smartphones, tablets, laptops, and gaming devices.',
  'support@techrepair.com',
  'b1000000-0000-0000-0000-000000000008',
  'active',
  NOW() - INTERVAL '22 days'
),
(
  'bus00000-0000-0000-0000-000000000009',
  'Bloom Floral Designs',
  'Creative florist offering custom arrangements, wedding flowers, event decoration, and plant care services.',
  'team@floraldesigns.com',
  'b1000000-0000-0000-0000-000000000009',
  'active',
  NOW() - INTERVAL '35 days'
),
(
  'bus00000-0000-0000-0000-000000000010',
  'QuickCuts Barbershop',
  'Traditional barbershop providing classic and modern haircuts, beard trims, and grooming services for men.',
  'contact@quickcuts.com',
  'b1000000-0000-0000-0000-000000000010',
  'active',
  NOW() - INTERVAL '18 days'
);

-- Verify businesses were created
SELECT 
  name, 
  contact_email, 
  EXTRACT(days FROM NOW() - created_at) as days_old,
  status
FROM businesses 
WHERE owner_id LIKE 'b1%'
ORDER BY created_at DESC; 