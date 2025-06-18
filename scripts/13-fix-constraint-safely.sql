-- Safely add constraint only if it doesn't exist
DO $$ 
BEGIN
    -- Check if constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_step_range' 
        AND table_name = 'quotes'
    ) THEN
        ALTER TABLE quotes 
        ADD CONSTRAINT check_step_range 
        CHECK (last_step_completed >= 0 AND last_step_completed <= 4);
    END IF;
END $$;

-- Add indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_quotes_status_email ON quotes(status, customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status_updated ON quotes(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_incomplete_step ON quotes(status, last_step_completed) WHERE status = 'incomplete';
CREATE INDEX IF NOT EXISTS idx_quotes_incomplete_only ON quotes(customer_email, updated_at DESC) WHERE status = 'incomplete';

-- Update comments
COMMENT ON COLUMN quotes.last_step_completed IS 'Tracks form progress: 1=Step1 complete, 2=Step2 complete, 3=Step3 complete, 4=Step4 complete (final submission)';
COMMENT ON COLUMN quotes.status IS 'Quote status: incomplete (form in progress), submitted (final quote), converted (became customer)';

-- Clean up any duplicate incomplete quotes (keep the most recent one per email)
WITH ranked_quotes AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY customer_email, status ORDER BY updated_at DESC) as rn
    FROM quotes 
    WHERE status = 'incomplete' 
    AND customer_email IS NOT NULL 
    AND customer_email != ''
)
DELETE FROM quotes 
WHERE id IN (
    SELECT id FROM ranked_quotes WHERE rn > 1
);
