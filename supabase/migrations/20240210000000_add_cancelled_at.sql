-- Add cancelled_at column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN subscriptions.cancelled_at IS 'Timestamp when the subscription was cancelled';
