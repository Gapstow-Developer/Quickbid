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

-- Insert default services if they don't exist
INSERT INTO services (name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
SELECT 
    v.name::VARCHAR(255),
    v.description::TEXT,
    v.category::VARCHAR(50),
    v.per_sqft_price::DECIMAL(10,4),
    v.flat_fee::DECIMAL(10,2),
    v.minimum_price::DECIMAL(10,2),
    v.is_active::BOOLEAN,
    v.display_order::INTEGER
FROM (VALUES
    ('Interior & Exterior Window Cleaning', 'Complete window cleaning service for both inside and outside', 'main', 0.13, 250.00, 250.00, true, 1),
    ('Exterior Only Window Cleaning', 'Professional exterior window cleaning service', 'main', 0.08, 150.00, 150.00, true, 2),
    ('Screen Cleaning', 'Remove and clean window screens', 'addon', 0.04, NULL, NULL, true, 3),
    ('Track Cleaning', 'Clean window tracks and sills', 'addon', 0.04, NULL, NULL, true, 4),
    ('Skylights & Hard-to-Reach Glass', 'Custom pricing for difficult access windows', 'upsell', NULL, NULL, NULL, true, 5),
    ('Pressure Washing', 'Exterior surface cleaning', 'upsell', NULL, NULL, NULL, true, 6),
    ('Gutter Cleaning', 'Clean and inspect gutters', 'upsell', NULL, NULL, NULL, true, 7)
) AS v(name, description, category, per_sqft_price, flat_fee, minimum_price, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = v.name);

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
    notification_emails = COALESCE(notification_emails, '[]'::jsonb)
WHERE id = 1;
