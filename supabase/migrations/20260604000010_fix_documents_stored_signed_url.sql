-- Fix: documents.file_url stored a 1-year pre-generated signed URL (bearer token).
-- Removing a collaborator from a trip did not revoke their existing signed URLs,
-- giving them up to 365 more days of access to sensitive documents.
-- Solution: store only the storage path; generate short-lived signed URLs at read time.

ALTER TABLE documents ADD COLUMN file_path TEXT;

-- Migrate existing data: extract storage path from signed URL.
-- Signed URL format: https://<host>/storage/v1/object/sign/documents/<path>?token=...
UPDATE documents
SET file_path = regexp_replace(
  regexp_replace(
    file_url,
    '^https?://[^/]+/storage/v1/object/sign/documents/',
    ''
  ),
  '\?.*$',
  ''
)
WHERE file_url LIKE '%/storage/v1/object/sign/documents/%';

-- Fallback: any row not matched (e.g. already a plain path) keeps value as-is
UPDATE documents
SET file_path = file_url
WHERE file_path IS NULL;

ALTER TABLE documents ALTER COLUMN file_path SET NOT NULL;
ALTER TABLE documents DROP COLUMN file_url;
