
-- Добавим колонку summary в таблицу chats
ALTER TABLE public.chats ADD COLUMN summary text;

-- Добавим недостающие поля в таблицу profiles
ALTER TABLE public.profiles ADD COLUMN first_name text;
ALTER TABLE public.profiles ADD COLUMN last_name text;
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- Создадим bucket для аватаров пользователей
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true);

-- Создадим политики для storage bucket user-avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Создадим таблицу для статистики использования моделей
CREATE TABLE public.model_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  model_name text NOT NULL,
  usage_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Включим RLS для model_usage_stats
ALTER TABLE public.model_usage_stats ENABLE ROW LEVEL SECURITY;

-- Создадим политики для model_usage_stats
CREATE POLICY "Users can view their own stats" ON public.model_usage_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.model_usage_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.model_usage_stats
FOR UPDATE USING (auth.uid() = user_id);

-- Создадим функцию для обновления статистики
CREATE OR REPLACE FUNCTION public.update_model_usage(model_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.model_usage_stats (user_id, model_name, usage_count)
  VALUES (auth.uid(), model_name, 1)
  ON CONFLICT (user_id, model_name) 
  DO UPDATE SET 
    usage_count = model_usage_stats.usage_count + 1,
    updated_at = now();
END;
$$;

-- Добавим уникальное ограничение для статистики
ALTER TABLE public.model_usage_stats ADD CONSTRAINT unique_user_model UNIQUE (user_id, model_name);
