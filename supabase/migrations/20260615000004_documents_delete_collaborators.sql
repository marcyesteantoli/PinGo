-- documents_delete only allowed the uploader to delete, so any other trip
-- collaborator swiping to delete a shared document hit RLS silently (DELETE
-- matches 0 rows, no error). Documents are a shared trip resource like
-- experiences, so any active collaborator should be able to remove them.
DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_delete" ON documents
  FOR DELETE TO authenticated USING (
    is_trip_member(trip_id)
  );

-- Mirror the same relaxation on storage so the underlying file is actually
-- removed when a collaborator deletes someone else's document.
DROP POLICY IF EXISTS "documents_storage_delete" ON storage.objects;
CREATE POLICY "documents_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active'
    )
  );
