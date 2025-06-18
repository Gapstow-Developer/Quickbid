-- Add column to track when follow-up emails are sent
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of incomplete quotes needing follow-up
CREATE INDEX IF NOT EXISTS idx_quotes_followup_check 
ON quotes (status, created_at, followup_sent_at) 
WHERE status = 'incomplete' AND followup_sent_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotes.followup_sent_at IS 'Timestamp when follow-up email was sent for incomplete quotes';
