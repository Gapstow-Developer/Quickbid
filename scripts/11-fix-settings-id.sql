-- Fix the settings table to use a consistent UUID for the single settings row
-- First, check if we have any existing settings
DO $$
DECLARE
    settings_count INTEGER;
    fixed_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Count existing settings
    SELECT COUNT(*) INTO settings_count FROM settings;
    
    -- If we have settings with integer IDs, migrate them
    IF settings_count > 0 THEN
        -- Delete any existing settings and recreate with proper UUID
        DELETE FROM settings;
        
        -- Insert a default settings row with fixed UUID
        INSERT INTO settings (
            id,
            business_name,
            business_email,
            business_phone,
            business_address,
            primary_color,
            secondary_color,
            form_title,
            form_subtitle,
            discount_percentage,
            discount_enabled,
            discount_message,
            discount_type,
            created_at,
            updated_at
        ) VALUES (
            fixed_uuid,
            'Your Business Name',
            '',
            '',
            '',
            '#3695bb',
            '#2a7a9a',
            'Window Cleaning Calculator',
            'Get an instant quote for professional window cleaning services',
            15,
            true,
            'Start your quote to see if you qualify for a discount!',
            'visual_only',
            NOW(),
            NOW()
        );
    END IF;
END $$;
