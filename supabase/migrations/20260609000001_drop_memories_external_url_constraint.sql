-- Allow external URLs in memories.image_url (needed for seed/demo data)
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_image_url_no_external_url;
