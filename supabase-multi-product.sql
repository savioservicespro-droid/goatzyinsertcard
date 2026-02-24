-- Migration: Multi-product support for Goatzy US Campaign
-- Run this in Supabase SQL Editor

-- 1. Add product_slug column to customer_submissions
ALTER TABLE customer_submissions
  ADD COLUMN IF NOT EXISTS product_slug TEXT DEFAULT 'goat-stand';

UPDATE customer_submissions SET product_slug = 'goat-stand' WHERE product_slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_product_slug ON customer_submissions(product_slug);

-- 2. Add product_slug column to gift_downloads
ALTER TABLE gift_downloads
  ADD COLUMN IF NOT EXISTS product_slug TEXT DEFAULT 'goat-stand';

UPDATE gift_downloads SET product_slug = 'goat-stand' WHERE product_slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_gift_downloads_product_slug ON gift_downloads(product_slug);

-- 3. Add product_slug to deleted_customer_submissions
ALTER TABLE deleted_customer_submissions
  ADD COLUMN IF NOT EXISTS product_slug TEXT DEFAULT 'goat-stand';

-- 4. Seed products_list
INSERT INTO site_config (config_key, config_value) VALUES
  ('products_list', '[{"slug": "goat-stand", "name": "Goat Stand"}]'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 5. Seed global API key from existing deepseek config
INSERT INTO site_config (config_key, config_value)
SELECT 'deepseek_api_key', jsonb_build_object('api_key', COALESCE(config_value->>'api_key', ''))
FROM site_config WHERE config_key = 'deepseek'
ON CONFLICT (config_key) DO NOTHING;

-- 6. Seed product:goat-stand config from existing config rows
INSERT INTO site_config (config_key, config_value)
SELECT
  'product:goat-stand',
  jsonb_build_object(
    'slug', 'goat-stand',
    'name', 'Goat Stand',
    'deepseek_prompt', COALESCE(
      (SELECT config_value->>'system_prompt' FROM site_config WHERE config_key = 'deepseek'),
      ''
    ),
    'welcome_text', COALESCE(
      (SELECT config_value FROM site_config WHERE config_key = 'welcome_text'),
      '{"title":"Thank you for your purchase!","paragraph1":"Welcome to the Goatzy family!","paragraph2":"We have prepared something special for you!","tagline":"Designed by breeders, made for breeders.\n- Team Goatzy"}'::jsonb
    ),
    'video', COALESCE(
      (SELECT config_value FROM site_config WHERE config_key = 'video'),
      '{"youtube_id":"PwDO6Hiqtk4"}'::jsonb
    ),
    'amazon_review_url', 'https://amazon.com/review/create-review',
    'upsells', '[{"name":"Hay Feeder for Goats with Roof & Wheels, 2 in 1 Goat Feeder Trough 50 Gallon Hay Rack & 20 Gallon Grain","headline":"Complete Your Farm Setup","subheadline":"Save time feeding your herd with this 2-in-1 hay & grain feeder","price":"179.99","imageUrl":"https://m.media-amazon.com/images/I/71s6vIPLFDL._AC_SL1484_.jpg","amazonUrl":"https://www.amazon.com/GOATZY-Feeder-Wheels-Galvanized-Livestock/dp/B0FLWKK4RG","promoCode":"GOATZY5","promoDiscount":"5% OFF","rating":3.8,"reviewCount":58,"trackingId":"upsell_hay_feeder","features":["50 gallon hay rack + 20 gallon grain trough","Weatherproof roof keeps hay dry","Locking wheels for easy transport","Galvanized steel construction","Fits goats, sheep, horses & cattle"]},{"name":"Wall Mount Hay Feeder for Goats, Covered Hay Feeder with Roof, 2in1 25 Gallon Hay Rack & Grain","headline":"One More Thing...","subheadline":"Keep hay organized and dry with this space-saving wall mount feeder","price":"109.99","imageUrl":"https://m.media-amazon.com/images/I/71HsodrUALL._AC_SL1280_.jpg","amazonUrl":"https://www.amazon.com/Feeder-Covered-Horses-Hanging-Galvanized/dp/B0FLWKYBNP","promoCode":"GOATZY5","promoDiscount":"5% OFF","rating":4.4,"reviewCount":59,"trackingId":"upsell_wall_feeder","features":["25 gallon hay rack + grain compartment","Protective roof keeps feed dry","Hanging hook for easy fence mount","Galvanized steel resists rust & weather","Perfect for goats, sheep & cattle"]}]'::jsonb
  )
ON CONFLICT (config_key) DO NOTHING;
