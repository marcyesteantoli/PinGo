-- Rename file_url → file_path to align with app code (stores storage path, not URL)
alter table documents rename column file_url to file_path;

-- Make nullable for link documents (no file in storage)
alter table documents alter column file_path drop not null;

-- Document type discriminator
alter table documents
  add column document_type text not null default 'file'
  check (document_type in ('file', 'link', 'pass'));

-- URL for link documents
alter table documents add column url text;
