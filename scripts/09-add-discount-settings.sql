-- Add discount settings to the settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS discount_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discount_message TEXT DEFAULT 'Start your quote to see if you qualify for a discount!';

-- Update existing settings with default values if they don't exist
UPDATE settings 
SET 
  discount_percentage = 15,
  discount_enabled = true,
  discount_message = 'Start your quote to see if you qualify for a discount!'
WHERE discount_percentage IS NULL;
