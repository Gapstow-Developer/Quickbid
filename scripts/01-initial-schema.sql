-- Create tables for our application

-- Settings table to store global app settings
CREATE TABLE IF NOT EXISTS settings (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table to store different service types
CREATE TABLE IF NOT EXISTS services (
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

-- Form fields table to store customizable form fields
CREATE TABLE IF NOT EXISTS form_fields (
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

-- Quotes table to store submitted and in-progress quotes
CREATE TABLE IF NOT EXISTS quotes (
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

-- Insert default settings
INSERT INTO settings (business_name, business_address, business_phone, business_email)
VALUES ('Westlake Window Cleaners', '13477 Prospect Rd. Strongsville, OH 44149', '(440) 207-0991', 'info@westlakewindowcleaners.com')
ON CONFLICT DO NOTHING;

-- Insert default services
INSERT INTO services (name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, display_order)
VALUES 
('Interior & Exterior Cleaning', 'Complete window cleaning inside and out', 'main', 0.13, 0, FALSE, 250, 1),
('Exterior Only Cleaning', 'Clean the outside of windows only', 'main', 0.08, 0, FALSE, 150, 2),
('Screen Cleaning', 'Clean and wipe down window screens', 'addon', 0.04, 0, FALSE, 0, 1),
('Track Cleaning', 'Clean window tracks and sills', 'addon', 0.04, 0, FALSE, 0, 2),
('Pressure Washing', 'Clean exterior surfaces with pressure washer', 'upsell', 0, 0, FALSE, 0, 1),
('Gutter Cleaning', 'Remove debris from gutters', 'upsell', 0, 0, FALSE, 0, 2),
('Specialty Cleaning', 'Custom cleaning solutions', 'upsell', 0, 0, FALSE, 0, 3)
ON CONFLICT DO NOTHING;

-- Insert default form fields
INSERT INTO form_fields (field_name, display_name, placeholder, is_required, field_type, display_order)
VALUES 
('address', 'Property Address', 'Enter your complete address', TRUE, 'text', 1),
('stories', 'Number of Stories', 'Select number of stories', TRUE, 'select', 2),
('customerName', 'Your Name', 'Enter your full name', TRUE, 'text', 3),
('customerEmail', 'Email Address', 'Enter your email address', TRUE, 'email', 4),
('customerPhone', 'Phone Number', 'Enter your phone number', TRUE, 'tel', 5)
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
BEFORE UPDATE ON form_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
