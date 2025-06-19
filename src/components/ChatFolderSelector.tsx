
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Folder, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ColorPicker } from './ColorPicker';

interface ChatFolder {
  id: string;
  name: string;
  color: string;
}

interface ChatFolderSelectorProps {
  currentFolderId?: string | null;
  onFolderChange: (folderId: string | null) => void;
  chatId?: string;
  onUpdate?: () => void;
}

export function ChatFolderSelector({ currentFolderId, onFolderChange, chatId, onUpdate }: ChatFolderSelectorProps) {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');
  const { user } = useAuth();

  useEffect(() => {
    loadFolders();
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .select('id, name, color')
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
            color: newFolderColor,
            position: folders.length
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, { id: data.id, name: data.name, color: data.color }]);
      setNewFolderName('');
      setNewFolderColor('#3B82F6');
      setIsCreating(false);
      
      onFolderChange(data.id);
    } catch (error) {
      console.error('Ошибка создания папки:', error);
    }
  };

  const handleFolderChange = async (value: string) => {
    const folderId = value === 'none' ? null : value;
    onFolderChange(folderId);

    if (chatId) {
      try {
        await supabase
          .from('chats')
          .update({ folder_id: folderId })
          .eq('id', chatId);
        
        // Вызываем обновление если передан колбэк
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Ошибка обновления папки чата:', error);
      }
    }
  };

  const selectedFolder = folders.find(f => f.id === currentFolderId);

  if (isCreating) {
    return (
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Название папки"
          className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          onKeyPress={(e) => e.key === 'Enter' && createFolder()}
          autoFocus
        />
        <ColorPicker
          value={newFolderColor}
          onChange={setNewFolderColor}
        />
        <Button
          onClick={createFolder}
          size="sm"
          className="bg-green-600 hover:bg-green-700 px-2 h-8"
        >
          ✓
        </Button>
        <Button
          onClick={() => {
            setIsCreating(false);
            setNewFolderName('');
            setNewFolderColor('#3B82F6');
          }}
          size="sm"
          variant="ghost"
          className="text-gray-400 px-2 h-8"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <div 
        className="w-4 h-4 rounded-sm flex-shrink-0"
        style={{ backgroundColor: selectedFolder?.color || '#6B7280' }}
      />
      <Select value={currentFolderId || 'none'} onValueChange={handleFolderChange}>
        <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white text-sm h-8">
          <SelectValue placeholder="Выберите папку" />
        </SelectTrigger>
        <SelectContent className="bg-gray-700 border-gray-600">
          <SelectItem value="none" className="text-gray-300 hover:bg-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gray-500" />
              Без папки
            </div>
          </SelectItem>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id} className="text-gray-300 hover:bg-gray-600">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: folder.color }}
                />
                {folder.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={() => setIsCreating(true)}
        size="sm"
        variant="ghost"
        className="text-gray-400 hover:text-white px-2 h-8"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}
