-- Migration: Email tracking for Resend integration
-- Run this in Supabase SQL Editor

-- 1. Add email tracking columns to customer_submissions
ALTER TABLE customer_submissions
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP;

-- 2. Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_submissions(id) ON DELETE CASCADE,
  product_slug TEXT,
  status TEXT DEFAULT 'pending',
  resend_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_customer ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_email_sent ON customer_submissions(email_sent);

-- 4. RLS (same open policy as other tables)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on email_logs" ON email_logs FOR ALL USING (true) WITH CHECK (true);
