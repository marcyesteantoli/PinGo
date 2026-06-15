-- Memories belong to the trip's shared diary, not just their uploader: keep
-- the row and image when the author's account is purged, anonymize
-- attribution instead of cascading (was ON DELETE CASCADE).
ALTER TABLE memories ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE memories DROP CONSTRAINT memories_user_id_fkey;
ALTER TABLE memories ADD CONSTRAINT memories_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
