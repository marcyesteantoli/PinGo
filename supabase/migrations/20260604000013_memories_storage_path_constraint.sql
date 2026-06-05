-- Enforce that image_url is always a Storage path, never an external URL.
-- The app generates signed URLs at read time via createSignedUrls.
ALTER TABLE public.memories
  ADD CONSTRAINT memories_image_url_no_external_url
  CHECK (image_url NOT LIKE 'http://%' AND image_url NOT LIKE 'https://%');
