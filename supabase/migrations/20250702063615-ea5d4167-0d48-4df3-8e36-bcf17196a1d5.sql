
-- Удаляем существующие проблемные политики для profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Создаем корректные RLS политики для таблицы profiles
CREATE POLICY "Enable read access for users to own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users to own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Создаем RLS политики для остальных таблиц если их нет
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own chats" ON chats
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage messages in own chats" ON messages
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM chats WHERE chats.id = messages.chat_id
        )
    );

ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own folders" ON chat_folders
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);
