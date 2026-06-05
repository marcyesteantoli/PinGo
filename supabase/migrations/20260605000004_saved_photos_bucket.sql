-- Private storage bucket for user cover photos on saved experiences.
-- Path pattern: {userId}/{experienceId}_{timestamp}.jpg
-- RLS: each user can only access their own folder (foldername[1] = user_id).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'saved-photos',
  'saved-photos',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "saved_photos_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'saved-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "saved_photos_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'saved-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "saved_photos_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'saved-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "saved_photos_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'saved-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
