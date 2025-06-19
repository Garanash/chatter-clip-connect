
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ChatFolder {
  id: string;
  name: string;
  icon_url: string | null;
  position: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

interface Chat {
  id: string;
  title: string;
  folder_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useChatFolders() {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadFoldersAndChats();
    }
  }, [user]);

  const loadFoldersAndChats = async () => {
    if (!user) return;

    try {
      const { data: foldersData, error: foldersError } = await supabase
        .from('chat_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (foldersError) throw foldersError;

      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (chatsError) throw chatsError;

      setFolders(foldersData || []);
      setChats(chatsData || []);
    } catch (error) {
      console.error('Ошибка загрузки папок и чатов:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить папки и чаты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string, color?: string, iconUrl?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .insert([{
          user_id: user.id,
          name,
          color: color || '#3B82F6',
          icon_url: iconUrl || null,
          position: folders.length
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      toast({
        title: "Успешно",
        description: "Папка создана",
      });
      
      return data;
    } catch (error) {
      console.error('Ошибка создания папки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать папку",
        variant: "destructive",
      });
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<ChatFolder>) => {
    try {
      const { error } = await supabase
        .from('chat_folders')
        .update(updates)
        .eq('id', folderId);

      if (error) throw error;

      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? { ...folder, ...updates } : folder
      ));

      toast({
        title: "Успешно",
        description: "Папка обновлена",
      });
    } catch (error) {
      console.error('Ошибка обновления папки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить папку",
        variant: "destructive",
      });
    }
  };

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));

      toast({
        title: "Успешно",
        description: "Название чата обновлено",
      });
    } catch (error) {
      console.error('Ошибка обновления названия чата:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить название чата",
        variant: "destructive",
      });
    }
  };

  const moveChatToFolder = async (chatId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ folder_id: folderId })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, folder_id: folderId } : chat
      ));
      
      // Обновляем данные для синхронизации
      await loadFoldersAndChats();
    } catch (error) {
      console.error('Ошибка перемещения чата:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось переместить чат",
        variant: "destructive",
      });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await supabase
        .from('chats')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      const { error } = await supabase
        .from('chat_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      setChats(prev => prev.map(chat => 
        chat.folder_id === folderId ? { ...chat, folder_id: null } : chat
      ));

      toast({
        title: "Успешно",
        description: "Папка удалена",
      });
    } catch (error) {
      console.error('Ошибка удаления папки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить папку",
        variant: "destructive",
      });
    }
  };

  return {
    folders,
    chats,
    loading,
    createFolder,
    updateFolder,
    updateChatTitle,
    moveChatToFolder,
    deleteFolder,
    refreshData: loadFoldersAndChats
  };
}
