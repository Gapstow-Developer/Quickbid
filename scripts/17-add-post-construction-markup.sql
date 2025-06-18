-- Add post_construction_markup_percentage to settings table
ALTER TABLE public.settings
ADD COLUMN post_construction_markup_percentage DECIMAL(5, 2) NOT NULL DEFAULT 70.00;

-- Update existing row with the default value if it exists
UPDATE public.settings
SET post_construction_markup_percentage = 70.00
WHERE id = '00000000-0000-0000-0000-000000000001';
