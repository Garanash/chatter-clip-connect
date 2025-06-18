
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Folder, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatFolder {
  id: string;
  name: string;
}

interface ChatFolderSelectorProps {
  currentFolderId?: string | null;
  onFolderChange: (folderId: string | null) => void;
  chatId?: string;
}

export function ChatFolderSelector({ currentFolderId, onFolderChange, chatId }: ChatFolderSelectorProps) {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadFolders();
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Ошибка загрузки папок:', error);
    }
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .insert([
          {
            user_id: user.id,
            name: newFolderName.trim(),
            position: folders.length
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, { id: data.id, name: data.name }]);
      setNewFolderName('');
      setIsCreating(false);
      
      // Автоматически выбираем новую папку
      onFolderChange(data.id);
    } catch (error) {
      console.error('Ошибка создания папки:', error);
    }
  };

  const handleFolderChange = async (value: string) => {
    const folderId = value === 'none' ? null : value;
    onFolderChange(folderId);

    // Если есть chatId, обновляем чат
    if (chatId) {
      try {
        await supabase
          .from('chats')
          .update({ folder_id: folderId })
          .eq('id', chatId);
      } catch (error) {
        console.error('Ошибка обновления папки чата:', error);
      }
    }
  };

  if (isCreating) {
    return (
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Название папки"
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          onKeyPress={(e) => e.key === 'Enter' && createFolder()}
          autoFocus
        />
        <Button
          onClick={createFolder}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          ✓
        </Button>
        <Button
          onClick={() => {
            setIsCreating(false);
            setNewFolderName('');
          }}
          size="sm"
          variant="ghost"
          className="text-gray-400"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Folder className="w-4 h-4 text-gray-400" />
      <Select value={currentFolderId || 'none'} onValueChange={handleFolderChange}>
        <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-white">
          <SelectValue placeholder="Выберите папку" />
        </SelectTrigger>
        <SelectContent className="bg-gray-700 border-gray-600">
          <SelectItem value="none" className="text-gray-300 hover:bg-gray-600">
            Без папки
          </SelectItem>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id} className="text-gray-300 hover:bg-gray-600">
              {folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={() => setIsCreating(true)}
        size="sm"
        variant="ghost"
        className="text-gray-400 hover:text-white"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
