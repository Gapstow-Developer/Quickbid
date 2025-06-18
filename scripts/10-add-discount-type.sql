-- Add discount_type column to settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'settings'
        AND column_name = 'discount_type'
    ) THEN
        ALTER TABLE settings
        ADD COLUMN discount_type text DEFAULT 'visual_only';
    END IF;
END $$;

-- Update any existing rows to have the default value
UPDATE settings
SET discount_type = 'visual_only'
WHERE discount_type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN settings.discount_type IS 'Type of discount: "actual" (reduces price) or "visual_only" (shows crossed-out higher price)';
