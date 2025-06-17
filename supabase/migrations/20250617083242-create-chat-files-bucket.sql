
-- Создаем bucket для файлов чата
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true);

-- Создаем политики для bucket chat-files
CREATE POLICY "Users can upload their own chat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat files" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Users can update their own chat files" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
