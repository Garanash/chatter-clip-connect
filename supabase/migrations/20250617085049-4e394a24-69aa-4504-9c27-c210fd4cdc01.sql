
-- Создаем таблицу для папок чатов
CREATE TABLE public.chat_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Добавляем поля к таблице чатов для папок и позиций
ALTER TABLE public.chats 
ADD COLUMN folder_id UUID REFERENCES public.chat_folders(id) ON DELETE SET NULL,
ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Создаем таблицу для пользовательских настроек
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  chat_background TEXT DEFAULT 'default',
  daily_message_limit INTEGER NOT NULL DEFAULT 30,
  messages_sent_today INTEGER NOT NULL DEFAULT 0,
  last_message_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Обновляем профили пользователей с базовыми данными
UPDATE public.profiles 
SET 
  first_name = COALESCE(first_name, 'Пользователь'),
  last_name = COALESCE(last_name, ''),
  avatar_url = COALESCE(avatar_url, 'https://via.placeholder.com/150/667eea/ffffff?text=П')
WHERE first_name IS NULL OR last_name IS NULL OR avatar_url IS NULL;

-- Создаем настройки для существующих пользователей
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.profiles 
WHERE id NOT IN (SELECT user_id FROM public.user_settings);

-- Добавляем RLS политики для папок чатов
ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat folders" 
  ON public.chat_folders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat folders" 
  ON public.chat_folders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat folders" 
  ON public.chat_folders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat folders" 
  ON public.chat_folders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Добавляем RLS политики для настроек пользователей
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
  ON public.user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON public.user_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Создаем триггеры для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_folders_updated_at BEFORE UPDATE ON public.chat_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для проверки лимита сообщений
CREATE OR REPLACE FUNCTION public.check_daily_message_limit(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_settings public.user_settings%ROWTYPE;
BEGIN
  -- Получаем настройки пользователя
  SELECT * INTO current_settings
  FROM public.user_settings 
  WHERE user_id = user_uuid;
  
  -- Если настроек нет, создаем их
  IF NOT FOUND THEN
    INSERT INTO public.user_settings (user_id) VALUES (user_uuid);
    RETURN TRUE;
  END IF;
  
  -- Если новый день, сбрасываем счетчик
  IF current_settings.last_message_date < CURRENT_DATE THEN
    UPDATE public.user_settings 
    SET messages_sent_today = 0, last_message_date = CURRENT_DATE
    WHERE user_id = user_uuid;
    RETURN TRUE;
  END IF;
  
  -- Проверяем лимит
  RETURN current_settings.messages_sent_today < current_settings.daily_message_limit;
END;
$$;

-- Функция для увеличения счетчика сообщений
CREATE OR REPLACE FUNCTION public.increment_daily_message_count(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, messages_sent_today, last_message_date)
  VALUES (user_uuid, 1, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    messages_sent_today = 
      CASE 
        WHEN user_settings.last_message_date < CURRENT_DATE THEN 1
        ELSE user_settings.messages_sent_today + 1
      END,
    last_message_date = CURRENT_DATE;
END;
$$;
