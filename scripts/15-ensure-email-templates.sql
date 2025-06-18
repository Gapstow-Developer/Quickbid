-- First, let's check if we have any settings record and get its ID
DO $$
DECLARE
    settings_id UUID;
BEGIN
    -- Try to get the first settings record ID
    SELECT id INTO settings_id FROM settings LIMIT 1;
    
    IF settings_id IS NOT NULL THEN
        -- Update existing record
        UPDATE settings 
        SET 
            business_email_template = COALESCE(
                NULLIF(business_email_template, ''),
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

Generated: {{timestamp}}

---
This quote was generated automatically by your window cleaning calculator.
Please contact the customer within 24 hours to schedule their service.'
            ),
            customer_email_template = COALESCE(
                NULLIF(customer_email_template, ''),
                'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}!

YOUR QUOTE DETAILS:
Property Address: {{address}}
Square Footage: {{squareFootage}} sq ft
Number of Stories: {{stories}}
Service Type: {{serviceType}}

Services Requested:
{{services}}

TOTAL QUOTE: ${{finalPrice}}

We will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}

---
Quote generated on {{timestamp}}'
            )
        WHERE id = settings_id;
    ELSE
        -- Insert new record if none exists
        INSERT INTO settings (
            business_name,
            business_email,
            business_phone,
            business_address,
            business_email_template,
            customer_email_template
        ) VALUES (
            'Your Window Cleaning Business',
            'your-email@example.com',
            '(555) 123-4567',
            '123 Main St, Your City, ST 12345',
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

Generated: {{timestamp}}

---
This quote was generated automatically by your window cleaning calculator.
Please contact the customer within 24 hours to schedule their service.',
            'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}!

YOUR QUOTE DETAILS:
Property Address: {{address}}
Square Footage: {{squareFootage}} sq ft
Number of Stories: {{stories}}
Service Type: {{serviceType}}

Services Requested:
{{services}}

TOTAL QUOTE: ${{finalPrice}}

We will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}

---
Quote generated on {{timestamp}}'
        );
    END IF;
END $$;
