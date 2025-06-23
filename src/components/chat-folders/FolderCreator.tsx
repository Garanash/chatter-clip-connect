
import { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FolderCreatorProps {
  onCreateFolder: (name: string, color?: string, iconUrl?: string) => Promise<void>;
  onCancel: () => void;
}

export function FolderCreator({ onCreateFolder, onCancel }: FolderCreatorProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const { user } = useAuth();

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };

  const handleCreateChat = async () => {
    if (!newChatTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          user_id: user.id,
          title: newChatTitle.trim(),
          folder_id: null // Создаём без папки, пользователь может переместить потом
        }])
        .select()
        .single();

      if (error) throw error;

      // Переходим к новому чату
      window.location.href = `/chat/${data.id}`;
    } catch (error) {
      console.error('Ошибка создания чата:', error);
    }
  };

  if (isCreatingChat) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Название чата"
            className="bg-gray-800 border-gray-700 text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
          />
          <Button onClick={handleCreateChat} size="sm">Создать</Button>
          <Button onClick={() => setIsCreatingChat(false)} size="sm" variant="ghost">Отмена</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Название папки"
          className="bg-gray-800 border-gray-700 text-white"
          onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
        />
        <Button onClick={handleCreateFolder} size="sm">Создать</Button>
        <Button onClick={onCancel} size="sm" variant="ghost">Отмена</Button>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => setIsCreatingChat(true)}
          size="sm"
          variant="outline"
          className="w-full justify-start text-gray-400 border-gray-700 hover:text-white hover:bg-gray-800"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Создать чат
        </Button>
      </div>
    </div>
  );
}
