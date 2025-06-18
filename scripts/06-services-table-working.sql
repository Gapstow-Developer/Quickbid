-- Create services table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'main', -- 'main', 'addon', 'upsell'
    per_sqft_price DECIMAL(10,4),
    flat_fee DECIMAL(10,2),
    use_both_pricing BOOLEAN DEFAULT false,
    minimum_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default services one by one to avoid casting issues
INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Interior & Exterior Window Cleaning', 'Complete window cleaning service for both inside and outside', 'main', 0.13, 250.00, 250.00, true, 1
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Interior & Exterior Window Cleaning');

INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Exterior Only Window Cleaning', 'Professional exterior window cleaning service', 'main', 0.08, 150.00, 150.00, true, 2
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Exterior Only Window Cleaning');

INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Screen Cleaning', 'Remove and clean window screens', 'addon', 0.04, 50.00, 25.00, true, 3
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Screen Cleaning');

INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Track Cleaning', 'Clean window tracks and sills', 'addon', 0.04, 40.00, 20.00, true, 4
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Track Cleaning');

INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Skylights & Hard-to-Reach Glass', 'Custom pricing for difficult access windows', 'upsell', 0.20, 100.00, 75.00, true, 5
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Skylights & Hard-to-Reach Glass');

INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Pressure Washing', 'Exterior surface cleaning', 'upsell', 0.15, 200.00, 150.00, true, 6
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Pressure Washing');

INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 'Gutter Cleaning', 'Clean and inspect gutters', 'upsell', 0.00, 150.00, 100.00, true, 7
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Gutter Cleaning');

-- Update settings table to ensure all columns exist
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS notification_emails JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_email_template TEXT,
ADD COLUMN IF NOT EXISTS customer_email_template TEXT;

-- Set default email templates if they don't exist
UPDATE settings 
SET 
    business_email_template = COALESCE(business_email_template, 'NEW WINDOW CLEANING QUOTE REQUEST

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

Generated: {{timestamp}}'),
    customer_email_template = COALESCE(customer_email_template, 'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}.

YOUR QUOTE DETAILS:
- Service: {{serviceType}}
- Property: {{address}}
- Total Quote: ${{finalPrice}}

Someone from our team will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}'),
    notification_emails = COALESCE(notification_emails, '[]'::jsonb);

-- Ensure there's at least one settings record
INSERT INTO settings (
    business_name, 
    business_email, 
    business_phone, 
    business_address,
    form_title,
    form_subtitle,
    primary_color,
    secondary_color,
    notification_emails,
    business_email_template,
    customer_email_template
) 
SELECT 
    'Your Window Cleaning Business',
    'info@yourwindowcleaning.com',
    '(555) 123-4567',
    '123 Main St, Your City, ST 12345',
    'Get Your Window Cleaning Quote',
    'Professional window cleaning services for your home or business',
    '#3b82f6',
    '#1e40af',
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
WHERE NOT EXISTS (SELECT 1 FROM settings);
