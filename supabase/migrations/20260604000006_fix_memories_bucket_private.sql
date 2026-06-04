-- Fix: memories bucket was public:true, making all photos world-readable
-- without authentication. Storage RLS policies were bypassed entirely.
-- Solution: make bucket private, store storage paths instead of public URLs,
-- sign URLs at read time via SECURITY DEFINER RPC or client SDK.

-- 1. Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'memories';

-- 2. Data migration: convert stored public URLs to storage paths
-- Before: https://<project>.supabase.co/storage/v1/object/public/memories/memories/<trip_id>/<file>
-- After:  memories/<trip_id>/<file>
UPDATE memories
SET image_url = regexp_replace(
  image_url,
  '^https://[^/]+/storage/v1/object/public/memories/',
  ''
)
WHERE image_url LIKE 'https://%';
