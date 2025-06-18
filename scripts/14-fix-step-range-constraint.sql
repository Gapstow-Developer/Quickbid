-- Drop the existing constraint and recreate it with the correct range
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS check_step_range;

-- Add the correct constraint allowing 0-4
ALTER TABLE quotes 
ADD CONSTRAINT check_step_range 
CHECK (last_step_completed >= 0 AND last_step_completed <= 4);

-- Update any existing records that might have invalid values
UPDATE quotes 
SET last_step_completed = 4 
WHERE status = 'submitted' AND last_step_completed < 4;

-- Update comments to reflect the correct range
COMMENT ON COLUMN quotes.last_step_completed IS 'Tracks form progress: 0=not started, 1=Step1 complete, 2=Step2 complete, 3=Step3 complete, 4=final submission complete';
