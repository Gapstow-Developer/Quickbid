-- Fix the quotes table schema to handle the data correctly
-- Drop and recreate the quotes table with proper data types

-- First, let's see what we have
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
ORDER BY ordinal_position;

-- Drop the existing quotes table (this will remove all existing quotes)
DROP TABLE IF EXISTS quotes CASCADE;

-- Create the quotes table with correct data types
CREATE TABLE quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    address TEXT,
    square_footage INTEGER,
    stories INTEGER,
    service_type TEXT, -- Changed from UUID to TEXT
    addons TEXT[], -- Array of text values, not UUIDs
    final_price DECIMAL(10,2),
    status TEXT DEFAULT 'incomplete',
    last_step_completed INTEGER DEFAULT 1,
    notes TEXT,
    
    -- Additional fields for better tracking
    has_skylights BOOLEAN DEFAULT FALSE,
    additional_services JSONB DEFAULT '{}',
    quote_data JSONB DEFAULT '{}',
    distance DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_customer_email ON quotes(customer_email);

-- Insert some sample data to test
INSERT INTO quotes (
    customer_name, 
    customer_email, 
    customer_phone, 
    address, 
    service_type, 
    addons, 
    square_footage, 
    stories, 
    final_price, 
    status
) VALUES 
(
    'Test Customer', 
    'test@example.com', 
    '555-0123', 
    '123 Test St, Test City, TS 12345', 
    'exterior-only', 
    ARRAY['screen', 'track'], 
    2500, 
    2, 
    350.00, 
    'submitted'
);

-- Show the final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
ORDER BY ordinal_position;

-- Show sample data
SELECT id, customer_name, service_type, addons, status, created_at FROM quotes LIMIT 5;
