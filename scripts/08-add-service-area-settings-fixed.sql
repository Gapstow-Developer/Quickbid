-- Add service area settings to the settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS outside_area_message TEXT DEFAULT 'We''re sorry, but your location is outside our typical service area. Please provide your contact information below and we''ll call you to see if we can make an exception for your location.';

-- Update existing settings with default values if they don't exist
-- Since id is UUID, we'll update all existing records
UPDATE settings 
SET 
  service_radius_miles = COALESCE(service_radius_miles, 20),
  outside_area_message = COALESCE(outside_area_message, 'We''re sorry, but your location is outside our typical service area. Please provide your contact information below and we''ll call you to see if we can make an exception for your location.')
WHERE service_radius_miles IS NULL OR outside_area_message IS NULL;

-- Insert default settings if no record exists at all
INSERT INTO settings (
  id,
  service_radius_miles, 
  outside_area_message,
  business_name,
  business_email,
  primary_color,
  secondary_color,
  form_title,
  form_subtitle,
  created_at, 
  updated_at
) 
SELECT 
  gen_random_uuid(),
  20, 
  'We''re sorry, but your location is outside our typical service area. Please provide your contact information below and we''ll call you to see if we can make an exception for your location.',
  'Your Business Name',
  'your-email@example.com',
  '#3695bb',
  '#2a7a9a',
  'Window Cleaning Calculator',
  'Get an instant quote for professional window cleaning services',
  NOW(), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
