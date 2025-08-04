-- Add email verification tracking to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_email_verified 
ON customers(email_verified_at);

-- Update existing customers who are linked to verified auth users
UPDATE customers c
SET email_verified_at = u.email_confirmed_at
FROM auth.users u
WHERE c.auth_user_id = u.id
AND u.email_confirmed_at IS NOT NULL
AND c.email_verified_at IS NULL;

-- Add email_type column to email_logs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_logs' 
        AND column_name = 'email_type'
    ) THEN
        ALTER TABLE email_logs 
        ADD COLUMN email_type VARCHAR(50);
    END IF;
END $$;

-- Add index for email type queries
CREATE INDEX IF NOT EXISTS idx_email_logs_type 
ON email_logs(email_type, created_at DESC);