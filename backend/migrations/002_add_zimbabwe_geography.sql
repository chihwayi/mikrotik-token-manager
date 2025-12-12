-- Migration: Add Zimbabwe Province, District, Town fields to routers table
-- This migration adds geographic fields for Zimbabwe's administrative divisions

-- Add new geographic columns to routers table
ALTER TABLE routers 
ADD COLUMN IF NOT EXISTS province VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS town VARCHAR(100);

-- Update existing routers to have default values if needed
UPDATE routers SET location = COALESCE(location, 'Not specified') WHERE location IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routers_province ON routers(province);
CREATE INDEX IF NOT EXISTS idx_routers_district ON routers(district);
CREATE INDEX IF NOT EXISTS idx_routers_town ON routers(town);

