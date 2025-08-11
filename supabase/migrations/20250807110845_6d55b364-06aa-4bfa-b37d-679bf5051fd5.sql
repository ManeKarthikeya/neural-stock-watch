-- Disable email confirmation requirement
-- This allows users to sign in immediately after signup without email verification

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET enable_signup = true, 
    enable_confirmations = false
WHERE id = 1;

-- If the config table doesn't exist or doesn't have the row, insert it
INSERT INTO auth.config (id, enable_signup, enable_confirmations)
VALUES (1, true, false)
ON CONFLICT (id) 
DO UPDATE SET 
  enable_signup = true, 
  enable_confirmations = false;