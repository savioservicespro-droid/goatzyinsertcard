-- Supabase Database Schema - Goatzy US Campaign
-- Customer submissions table for tracking review collection campaign
-- NOTE: This is the SAME schema as the FR campaign.
-- If using the same Supabase project, you only need to run this once.
-- The 'region' column differentiates US vs FR data.

-- Create the customer_submissions table (if not exists)
CREATE TABLE IF NOT EXISTS customer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  opt_in_surveys BOOLEAN DEFAULT FALSE,
  review_generated BOOLEAN DEFAULT FALSE,
  review_stars INTEGER CHECK (review_stars >= 1 AND review_stars <= 5),
  review_tone TEXT,
  review_text TEXT,
  went_to_amazon BOOLEAN DEFAULT FALSE,
  claimed_gifts BOOLEAN DEFAULT FALSE,
  region TEXT DEFAULT 'US'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_email ON customer_submissions(email);
CREATE INDEX IF NOT EXISTS idx_created_at ON customer_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_went_to_amazon ON customer_submissions(went_to_amazon);
CREATE INDEX IF NOT EXISTS idx_claimed_gifts ON customer_submissions(claimed_gifts);
CREATE INDEX IF NOT EXISTS idx_region ON customer_submissions(region);

-- Enable Row Level Security
ALTER TABLE customer_submissions ENABLE ROW LEVEL SECURITY;

-- Policy to allow public insert (anyone can submit)
CREATE POLICY "Allow public insert" ON customer_submissions
  FOR INSERT WITH CHECK (true);

-- Policy to allow public updates (for tracking user actions)
CREATE POLICY "Allow public update" ON customer_submissions
  FOR UPDATE USING (true);

-- Policy to allow reading (for admin dashboard)
CREATE POLICY "Allow public select" ON customer_submissions
  FOR SELECT USING (true);

-- Policy to allow delete (for admin dashboard)
CREATE POLICY "Allow public delete" ON customer_submissions
  FOR DELETE USING (true);

-- Comments
COMMENT ON TABLE customer_submissions IS 'Stores customer information and tracks their journey through the Goatzy review collection funnel';
COMMENT ON COLUMN customer_submissions.region IS 'Market region: US or FR';
