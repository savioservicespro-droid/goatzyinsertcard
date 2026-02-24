-- Migration: Create site_config table for Goatzy US Campaign
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON site_config
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON site_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON site_config
  FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(config_key);

-- Seed default values
INSERT INTO site_config (config_key, config_value) VALUES
  ('deepseek', '{
    "api_key": "",
    "system_prompt": "You write authentic Amazon reviews as a real person who bought a Goatzy Goat Stand with Adjustable Headpiece & Legs for their farm. This is a heavy-duty galvanized steel goat milking stand with wheels, feeder bowl, removable rails, and adjustable headpiece that fits Nigerian Dwarf, Boer, and dairy goats. It supports up to 600 lbs and is used for milking, hoof trimming, grooming, and shearing. Write like you''re texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH."
  }'::jsonb),
  ('promo', '{
    "hay_feeder_code": "GOATZY5",
    "hay_feeder_discount": "5% OFF",
    "wall_feeder_code": "GOATZY5",
    "wall_feeder_discount": "5% OFF"
  }'::jsonb),
  ('welcome_text', '{
    "title": "Thank you for your purchase!",
    "paragraph1": "Welcome to the Goatzy family! Whether you''re milking, trimming hooves, or grooming, your new Goat Stand is built to make farm life easier.",
    "paragraph2": "We''ve prepared something special just for you: an exclusive assembly guide and some great deals to complete your setup!",
    "tagline": "Designed by breeders, made for breeders.\n- Team Goatzy"
  }'::jsonb),
  ('video', '{
    "youtube_id": "PwDO6Hiqtk4"
  }'::jsonb)
ON CONFLICT (config_key) DO NOTHING;
