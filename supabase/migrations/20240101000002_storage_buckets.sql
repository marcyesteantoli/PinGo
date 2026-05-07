-- Bucket para fotos de recuerdos (público — las URLs son directas sin firma)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memories',
  'memories',
  true,
  5242880, -- 5MB máximo por archivo (la app comprime antes de subir, esto es red de seguridad)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para documentos de experiencias (privado — URLs firmadas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20MB máximo por archivo
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Políticas Storage: memories
CREATE POLICY "memories_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'memories');

CREATE POLICY "memories_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = 'memories'
    -- El path debe ser memories/{trip_id}/{filename}
    -- Verificamos que el usuario sea colaborador del viaje
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "memories_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'memories'
    AND owner = auth.uid()
  );

-- Políticas Storage: documents
CREATE POLICY "documents_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "documents_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "documents_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
  );
