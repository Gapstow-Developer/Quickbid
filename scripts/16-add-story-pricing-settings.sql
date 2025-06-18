-- Add story pricing settings to the settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS story_multipliers JSONB DEFAULT '{"1": 0, "2": 0.02, "3": 0.06}',
ADD COLUMN IF NOT EXISTS story_flat_fees JSONB DEFAULT '{"3": 300}';

-- Update existing settings with default story pricing
UPDATE settings 
SET 
  story_multipliers = '{"1": 0, "2": 0.02, "3": 0.06}',
  story_flat_fees = '{"3": 300}'
WHERE story_multipliers IS NULL OR story_flat_fees IS NULL;
