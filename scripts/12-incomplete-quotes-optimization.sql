-- Add indexes for better performance on incomplete quote queries
CREATE INDEX IF NOT EXISTS idx_quotes_status_email ON quotes(status, customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status_updated ON quotes(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_incomplete_step ON quotes(status, last_step_completed) WHERE status = 'incomplete';

-- Add a partial index specifically for incomplete quotes
CREATE INDEX IF NOT EXISTS idx_quotes_incomplete_only ON quotes(customer_email, updated_at DESC) WHERE status = 'incomplete';

-- Update the quotes table to ensure we have proper constraints
ALTER TABLE quotes 
ADD CONSTRAINT check_step_range 
CHECK (last_step_completed >= 0 AND last_step_completed <= 3);

-- Add a comment to document the incomplete quote workflow
COMMENT ON COLUMN quotes.last_step_completed IS 'Tracks form progress: 1=Step1 complete, 2=Step2 complete, 3=Step3 complete (final submission)';
COMMENT ON COLUMN quotes.status IS 'Quote status: incomplete (form in progress), submitted (final quote), converted (became customer)';
