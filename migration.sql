-- Migration: Convert from invite-code auth to username/password auth
-- Run this against your Neon database before using the new auth system.

-- 1. Add username and password_hash columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Drop the invite_code_id column from users (no longer needed)
ALTER TABLE users DROP COLUMN IF EXISTS invite_code_id;

-- 3. Drop the invite_codes table entirely
DROP TABLE IF EXISTS invite_codes;

-- 4. Delete existing users (they'll re-register with username/password)
--    Remove this line if you want to keep existing users and manually set their credentials.
DELETE FROM sessions;
DELETE FROM users;

-- 5. After running this migration:
--    POST to /api/auth/setup to create the admin account (getrekt / Welcome2DHL!)
