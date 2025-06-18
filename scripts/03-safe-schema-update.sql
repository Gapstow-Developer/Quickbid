-- Safe schema update script that handles existing objects

-- Check if tables exist and create only if they don't
DO $$
BEGIN
    -- Create settings table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings') THEN
        CREATE TABLE settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            business_name TEXT NOT NULL DEFAULT 'Window Cleaning Business',
            business_address TEXT,
            business_phone TEXT,
            business_email TEXT,
            primary_color TEXT DEFAULT '#3695bb',
            secondary_color TEXT DEFAULT '#2a7a9a',
            form_title TEXT DEFAULT 'Window Cleaning Calculator',
            form_subtitle TEXT DEFAULT 'Get an instant quote for professional window cleaning services',
            notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
            logo_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add logo_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'logo_url') THEN
        ALTER TABLE settings ADD COLUMN logo_url TEXT;
    END IF;

    -- Create services table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') THEN
        CREATE TABLE services (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL CHECK (category IN ('main', 'upsell', 'addon')),
            per_sqft_price DECIMAL(10, 4),
            flat_fee DECIMAL(10, 2),
            use_both_pricing BOOLEAN DEFAULT FALSE,
            minimum_price DECIMAL(10, 2),
            is_active BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Create form_fields table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'form_fields') THEN
        CREATE TABLE form_fields (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            field_name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            placeholder TEXT,
            is_required BOOLEAN DEFAULT TRUE,
            field_type TEXT NOT NULL,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Create quotes table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') THEN
        CREATE TABLE quotes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            address TEXT,
            square_footage INTEGER,
            stories INTEGER,
            service_type UUID REFERENCES services(id),
            addons UUID[] DEFAULT ARRAY[]::UUID[],
            final_price DECIMAL(10, 2),
            status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'submitted', 'contacted', 'scheduled', 'completed', 'cancelled')),
            last_step_completed INTEGER DEFAULT 1,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_updated_at') THEN
        CREATE TRIGGER update_settings_updated_at
        BEFORE UPDATE ON settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
        CREATE TRIGGER update_services_updated_at
        BEFORE UPDATE ON services
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_fields_updated_at') THEN
        CREATE TRIGGER update_form_fields_updated_at
        BEFORE UPDATE ON form_fields
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quotes_updated_at') THEN
        CREATE TRIGGER update_quotes_updated_at
        BEFORE UPDATE ON quotes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default data only if tables are empty
INSERT INTO settings (business_name, business_address, business_phone, business_email)
SELECT 'Westlake Window Cleaners', '13477 Prospect Rd. Strongsville, OH 44149', '(440) 207-0991', 'info@westlakewindowcleaners.com'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Insert default services only if services table is empty
INSERT INTO services (name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, display_order)
SELECT * FROM (VALUES 
    ('Interior & Exterior Cleaning', 'Complete window cleaning inside and out', 'main', 0.13, 0, FALSE, 250, 1),
    ('Exterior Only Cleaning', 'Clean the outside of windows only', 'main', 0.08, 0, FALSE, 150, 2),
    ('Screen Cleaning', 'Clean and wipe down window screens', 'addon', 0.04, 0, FALSE, 0, 1),
    ('Track Cleaning', 'Clean window tracks and sills', 'addon', 0.04, 0, FALSE, 0, 2),
    ('Pressure Washing', 'Clean exterior surfaces with pressure washer', 'upsell', 0, 0, FALSE, 0, 1),
    ('Gutter Cleaning', 'Remove debris from gutters', 'upsell', 0, 0, FALSE, 0, 2),
    ('Specialty Cleaning', 'Custom cleaning solutions', 'upsell', 0, 0, FALSE, 0, 3)
) AS v(name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, display_order)
WHERE NOT EXISTS (SELECT 1 FROM services);

-- Insert default form fields only if form_fields table is empty
INSERT INTO form_fields (field_name, display_name, placeholder, is_required, field_type, display_order)
SELECT * FROM (VALUES 
    ('address', 'Property Address', 'Enter your complete address', TRUE, 'text', 1),
    ('stories', 'Number of Stories', 'Select number of stories', TRUE, 'select', 2),
    ('customerName', 'Your Name', 'Enter your full name', TRUE, 'text', 3),
    ('customerEmail', 'Email Address', 'Enter your email address', TRUE, 'email', 4),
    ('customerPhone', 'Phone Number', 'Enter your phone number', TRUE, 'tel', 5)
) AS v(field_name, display_name, placeholder, is_required, field_type, display_order)
WHERE NOT EXISTS (SELECT 1 FROM form_fields);

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Settings records: ' || COUNT(*) as settings_count FROM settings;
SELECT 'Services records: ' || COUNT(*) as services_count FROM services;
SELECT 'Form fields records: ' || COUNT(*) as form_fields_count FROM form_fields;
SELECT 'Quotes records: ' || COUNT(*) as quotes_count FROM quotes;
