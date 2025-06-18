-- Add service area settings to the settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS outside_area_message TEXT DEFAULT 'We''re sorry, but your location is outside our typical service area. Please provide your contact information below and we''ll call you to see if we can make an exception for your location.';

-- Update existing settings with default values if they don't exist
UPDATE settings 
SET 
  service_radius_miles = COALESCE(service_radius_miles, 20),
  outside_area_message = COALESCE(outside_area_message, 'We''re sorry, but your location is outside our typical service area. Please provide your contact information below and we''ll call you to see if we can make an exception for your location.')
WHERE id = 1;

-- Insert default settings if no record exists
INSERT INTO settings (
  id, 
  service_radius_miles, 
  outside_area_message,
  created_at, 
  updated_at
) 
SELECT 
  1, 
  20, 
  'We''re sorry, but your location is outside our typical service area. Please provide your contact information below and we''ll call you to see if we can make an exception for your location.',
  NOW(), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
