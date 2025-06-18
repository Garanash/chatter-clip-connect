
-- Add nickname and other fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- Add color field to chat_folders table
ALTER TABLE public.chat_folders ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6';

-- Add selected_model field to user_settings table
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS selected_model text DEFAULT 'openai/gpt-4.1';

-- Clear existing user data to start fresh
DELETE FROM public.model_usage_stats;
DELETE FROM public.messages;
DELETE FROM public.chats;
DELETE FROM public.chat_folders;
DELETE FROM public.user_settings;
DELETE FROM public.profiles;

-- Update handle_new_user function to work with nickname-based registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nickname', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'admin@example.com' THEN 'admin' ELSE 'user' END
  );
  RETURN NEW;
END;
$$;
