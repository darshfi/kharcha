-- URGENT FIX: Remove the failing registration trigger
-- This allows users to register without automatic category seeding
-- Run this immediately in your Supabase SQL Editor

-- Drop the existing problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_seed_categories ON auth.users;
DROP FUNCTION IF EXISTS create_default_categories() CASCADE;
DROP FUNCTION IF EXISTS seed_starter_categories() CASCADE;

-- Registration should now work without category auto-seeding
-- Users will have an empty category list until they create their own

-- OPTIONAL: After confirming registration works, you can re-enable category seeding
-- by running seed-categories.sql, which has better error handling
