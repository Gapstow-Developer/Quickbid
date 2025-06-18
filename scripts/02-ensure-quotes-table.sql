-- Ensure quotes table exists with all necessary columns
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    address TEXT,
    stories INTEGER,
    service_type TEXT,
    square_footage INTEGER,
    addons JSONB DEFAULT '[]'::jsonb,
    has_skylights BOOLEAN DEFAULT false,
    additional_services JSONB DEFAULT '{}'::jsonb,
    final_price DECIMAL(10,2),
    quote_data JSONB,
    last_step_completed INTEGER DEFAULT 1,
    status TEXT DEFAULT 'incomplete',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Ensure settings table exists
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name TEXT DEFAULT 'Window Cleaning Business',
    business_email TEXT,
    business_phone TEXT,
    business_address TEXT,
    primary_color TEXT DEFAULT '#3695bb',
    secondary_color TEXT DEFAULT '#2a7a9a',
    form_title TEXT DEFAULT 'Window Cleaning Calculator',
    form_subtitle TEXT DEFAULT 'Get an instant quote for professional window cleaning services',
    notification_emails JSONB DEFAULT '[]'::jsonb,
    logo_url TEXT,
    business_email_template TEXT,
    customer_email_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if none exist
INSERT INTO settings (business_name, business_email, primary_color, secondary_color, form_title, form_subtitle)
SELECT 'Window Cleaning Business', 'business@example.com', '#3695bb', '#2a7a9a', 'Window Cleaning Calculator', 'Get an instant quote for professional window cleaning services'
WHERE NOT EXISTS (SELECT 1 FROM settings);
