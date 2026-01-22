-- Create storage bucket for LMS files
INSERT INTO storage.buckets (id, name, public) VALUES ('lms-files', 'lms-files', true);

-- Storage policies for lms-files bucket
CREATE POLICY "Anyone can view files" ON storage.objects FOR SELECT USING (bucket_id = 'lms-files');

CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'lms-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE 
USING (bucket_id = 'lms-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE 
USING (bucket_id = 'lms-files' AND auth.uid()::text = (storage.foldername(name))[1]);