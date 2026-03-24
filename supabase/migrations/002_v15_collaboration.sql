-- V1.5: Collaboration features - channels & media

-- Add channel column to messages
ALTER TABLE messages
  ADD COLUMN channel TEXT DEFAULT 'all'
  CHECK (channel IN ('all', 'family_chat'));

-- Update RLS: parents cannot see messages where channel = 'family_chat'
-- Drop existing select policy on messages if it exists, then recreate
DROP POLICY IF EXISTS "messages_select" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
    AND (
      -- Parents cannot see family_chat messages
      CASE
        WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'parent'
        THEN channel != 'family_chat'
        ELSE true
      END
    )
  );

-- Insert policy: any family member can send messages
DROP POLICY IF EXISTS "messages_insert" ON messages;

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Create storage bucket for voice/photo media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their family folder
DROP POLICY IF EXISTS "media_upload" ON storage.objects;

CREATE POLICY "media_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- Storage policy: family members can read media from their family
DROP POLICY IF EXISTS "media_read" ON storage.objects;

CREATE POLICY "media_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );
