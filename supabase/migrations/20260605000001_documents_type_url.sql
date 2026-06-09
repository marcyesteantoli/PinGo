-- file_url was already dropped and replaced by file_path in 20260604000010.
-- This migration only adds the nullable constraint and new columns.

-- Make nullable for link documents (no file in storage)
alter table documents alter column file_path drop not null;

-- Document type discriminator
alter table documents
  add column document_type text not null default 'file'
  check (document_type in ('file', 'link', 'pass'));

-- URL for link documents
alter table documents add column url text;
