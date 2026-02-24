-- Gift/Action download tracking table - Goatzy US Campaign
-- Tracks: assembly_video views, upsell_hay_feeder clicks, upsell_wall_feeder clicks
-- NOTE: Same table as FR campaign. If using same Supabase project, only run once.

CREATE TABLE IF NOT EXISTS gift_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customer_submissions(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  region TEXT DEFAULT 'US'
);

-- Enable Row Level Security
ALTER TABLE gift_downloads ENABLE ROW LEVEL SECURITY;

-- Policy to allow public insert (for tracking downloads)
CREATE POLICY "Allow public insert" ON gift_downloads
  FOR INSERT WITH CHECK (true);

-- Policy to allow public select (for viewing stats)
CREATE POLICY "Allow public select" ON gift_downloads
  FOR SELECT USING (true);

-- Policy to allow public delete (for admin cleanup)
CREATE POLICY "Allow public delete" ON gift_downloads
  FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_downloads_customer_id ON gift_downloads(customer_id);
CREATE INDEX IF NOT EXISTS idx_gift_downloads_gift_type ON gift_downloads(gift_type);
CREATE INDEX IF NOT EXISTS idx_gift_downloads_downloaded_at ON gift_downloads(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_downloads_region ON gift_downloads(region);

-- Deleted customer submissions trash table (for admin dashboard)
CREATE TABLE IF NOT EXISTS deleted_customer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  opt_in_surveys BOOLEAN,
  review_generated BOOLEAN,
  review_stars INTEGER,
  review_tone TEXT,
  review_text TEXT,
  went_to_amazon BOOLEAN,
  claimed_gifts BOOLEAN,
  region TEXT DEFAULT 'US'
);

ALTER TABLE deleted_customer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON deleted_customer_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON deleted_customer_submissions
  FOR SELECT USING (true);

-- Gift types for US campaign:
-- 'assembly_video'       - Viewed the assembly video
-- 'upsell_hay_feeder'    - Clicked "Shop on Amazon" for Hay Feeder
-- 'upsell_wall_feeder'   - Clicked "Shop on Amazon" for Wall Mount Feeder
