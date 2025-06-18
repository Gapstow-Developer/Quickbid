-- Ensure settings table exists with all required columns
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    business_name TEXT DEFAULT 'Window Cleaning Business',
    business_email TEXT DEFAULT '',
    business_phone TEXT DEFAULT '',
    business_address TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#3695bb',
    secondary_color TEXT DEFAULT '#2a7a9a',
    form_title TEXT DEFAULT 'Window Cleaning Calculator',
    form_subtitle TEXT DEFAULT 'Get an instant quote for professional window cleaning services',
    logo_url TEXT DEFAULT '',
    notification_emails JSONB DEFAULT '[]'::jsonb,
    business_email_template TEXT DEFAULT '',
    customer_email_template TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add business_email_template if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'business_email_template') THEN
        ALTER TABLE settings ADD COLUMN business_email_template TEXT DEFAULT '';
    END IF;
    
    -- Add customer_email_template if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'customer_email_template') THEN
        ALTER TABLE settings ADD COLUMN customer_email_template TEXT DEFAULT '';
    END IF;
    
    -- Add logo_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'logo_url') THEN
        ALTER TABLE settings ADD COLUMN logo_url TEXT DEFAULT '';
    END IF;
    
    -- Ensure notification_emails is JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'notification_emails' AND data_type != 'jsonb') THEN
        ALTER TABLE settings DROP COLUMN notification_emails;
        ALTER TABLE settings ADD COLUMN notification_emails JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Insert default settings if none exist
INSERT INTO settings (
    business_name,
    business_email,
    business_phone,
    business_address,
    primary_color,
    secondary_color,
    form_title,
    form_subtitle,
    logo_url,
    notification_emails,
    business_email_template,
    customer_email_template
) 
SELECT 
    'Window Cleaning Business',
    '',
    '',
    '',
    '#3695bb',
    '#2a7a9a',
    'Window Cleaning Calculator',
    'Get an instant quote for professional window cleaning services',
    '',
    '[]'::jsonb,
    'NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: ${{finalPrice}}

CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Address: {{address}}

PROPERTY DETAILS:
- Square Footage: {{squareFootage}} sq ft
- Number of Stories: {{stories}}
- Service Type: {{serviceType}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{finalPrice}}

Generated: {{timestamp}}',
    'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}.

YOUR QUOTE DETAILS:
- Service: {{serviceType}}
- Property: {{address}}
- Total Quote: ${{finalPrice}}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Update default email templates if they're empty
UPDATE settings 
SET 
    business_email_template = CASE 
        WHEN business_email_template = '' OR business_email_template IS NULL THEN 
            'NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: ${{finalPrice}}

CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Address: {{address}}

PROPERTY DETAILS:
- Square Footage: {{squareFootage}} sq ft
- Number of Stories: {{stories}}
- Service Type: {{serviceType}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{finalPrice}}

Generated: {{timestamp}}'
        ELSE business_email_template 
    END,
    customer_email_template = CASE 
        WHEN customer_email_template = '' OR customer_email_template IS NULL THEN 
            'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}.

YOUR QUOTE DETAILS:
- Service: {{serviceType}}
- Property: {{address}}
- Total Quote: ${{finalPrice}}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}'
        ELSE customer_email_template 
    END,
    updated_at = NOW();

-- Show final settings
SELECT 'Settings table setup complete' as status;
SELECT COUNT(*) as settings_count FROM settings;
