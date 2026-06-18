DROP POLICY IF EXISTS "memories_storage_select" ON storage.objects;

CREATE POLICY "memories_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'memories'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
