-- Update email templates to include window detail questions
UPDATE settings 
SET 
    business_email_template = 'NEW WINDOW CLEANING QUOTE REQUEST

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

WINDOW DETAILS:
{{windowDetails}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{finalPrice}}

Generated: {{timestamp}}

---
This quote was generated automatically by your window cleaning calculator.
Please contact the customer within 24 hours to schedule their service.

IMPORTANT: Review the window details above as they may affect pricing or service approach.',

    customer_email_template = 'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}!

YOUR QUOTE DETAILS:
Property Address: {{address}}
Square Footage: {{squareFootage}} sq ft
Number of Stories: {{stories}}
Service Type: {{serviceType}}

WINDOW DETAILS:
{{windowDetails}}

Services Requested:
{{services}}

TOTAL QUOTE: ${{finalPrice}}

We will contact you within 24 hours to schedule your service and confirm any specific details about your windows.

Best regards,
{{businessName}}

---
Quote generated on {{timestamp}}'

WHERE id = (SELECT id FROM settings LIMIT 1);

-- If no settings record exists, create one with the updated templates
INSERT INTO settings (
    business_name,
    business_email,
    business_phone,
    business_address,
    business_email_template,
    customer_email_template
)
SELECT 
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

WINDOW DETAILS:
{{windowDetails}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{finalPrice}}

Generated: {{timestamp}}

---
This quote was generated automatically by your window cleaning calculator.
Please contact the customer within 24 hours to schedule their service.

IMPORTANT: Review the window details above as they may affect pricing or service approach.',
    'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}!

YOUR QUOTE DETAILS:
Property Address: {{address}}
Square Footage: {{squareFootage}} sq ft
Number of Stories: {{stories}}
Service Type: {{serviceType}}

WINDOW DETAILS:
{{windowDetails}}

Services Requested:
{{services}}

TOTAL QUOTE: ${{finalPrice}}

We will contact you within 24 hours to schedule your service and confirm any specific details about your windows.

Best regards,
{{businessName}}

---
Quote generated on {{timestamp}}'
WHERE NOT EXISTS (SELECT 1 FROM settings);
