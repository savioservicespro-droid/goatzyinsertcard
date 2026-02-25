-- Migration: Add ARAC (Wall Mount Hay Rack) and AFEDER (Hay Feeder with Roof & Wheels)
-- Run this in Supabase SQL Editor

-- 1. Update products_list to include ARAC and AFEDER
UPDATE site_config
SET config_value = (
  SELECT COALESCE(config_value, '[]'::jsonb) || '[{"slug": "arac", "name": "Wall Mount Hay Rack"}, {"slug": "afeder", "name": "Hay Feeder with Roof & Wheels"}]'::jsonb
  FROM site_config WHERE config_key = 'products_list'
),
updated_at = NOW()
WHERE config_key = 'products_list';

-- 2. Seed product:arac config
INSERT INTO site_config (config_key, config_value, updated_at) VALUES (
  'product:arac',
  '{
    "slug": "arac",
    "name": "Wall Mount Hay Rack",
    "deepseek_prompt": "You write authentic Amazon reviews as a real person who bought a Goatzy Wall Mount Hay Feeder with Roof for their farm. This is a 2-in-1 covered wall-mount hay rack (25 gallon) and grain feeder, made of galvanized steel with a protective roof to keep feed dry. It has a hanging hook for easy fence mounting and works great for goats, sheep, and cattle. Write like you are texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.",
    "welcome_text": {
      "title": "Thank you for your purchase!",
      "paragraph1": "Welcome to the Goatzy family! Your new Wall Mount Hay Feeder is designed to keep feed dry and organized, making feeding time a breeze.",
      "paragraph2": "We have prepared something special just for you: an exclusive setup guide and some great deals to complete your farm equipment!",
      "tagline": "Designed by breeders, made for breeders.\n- Team Goatzy"
    },
    "video": {"youtube_id": ""},
    "amazon_review_url": "",
    "upsells": []
  }'::jsonb,
  NOW()
) ON CONFLICT (config_key) DO NOTHING;

-- 3. Seed product:afeder config
INSERT INTO site_config (config_key, config_value, updated_at) VALUES (
  'product:afeder',
  '{
    "slug": "afeder",
    "name": "Hay Feeder with Roof & Wheels",
    "deepseek_prompt": "You write authentic Amazon reviews as a real person who bought a Goatzy Hay Feeder with Roof & Wheels for their farm. This is a heavy-duty 2-in-1 galvanized steel hay feeder trough (50 gallon hay rack + 20 gallon grain trough) with a weatherproof roof and locking wheels. It is designed for goats, sheep, horses, and cattle, and makes feeding time efficient and mess-free. Write like you are texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.",
    "welcome_text": {
      "title": "Thank you for your purchase!",
      "paragraph1": "Welcome to the Goatzy family! Your new Hay Feeder with Roof & Wheels is built to make feeding time easier and keep your hay dry and your grain organized.",
      "paragraph2": "We have prepared something special just for you: an exclusive assembly guide and some great deals to complete your farm setup!",
      "tagline": "Designed by breeders, made for breeders.\n- Team Goatzy"
    },
    "video": {"youtube_id": ""},
    "amazon_review_url": "",
    "upsells": []
  }'::jsonb,
  NOW()
) ON CONFLICT (config_key) DO NOTHING;
