
import { useState } from 'react';
import { 
  folder, 
  pencil, 
  trash-2, 
  message-square, 
  chevron-down, 
  chevron-up 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatFolders } from '@/hooks/useChatFolders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ChatFolderListProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onChatDeleted: () => void;
}

export function ChatFolderList({ currentChatId, onChatSelect, onChatDeleted }: ChatFolderListProps) {
  const { folders, chats, loading, createFolder, updateChatTitle, moveChatToFolder, deleteFolder } = useChatFolders();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  if (loading) {
    return <div className="p-4 text-gray-400">Загрузка...</div>;
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleEditChat = (chat: any) => {
    setEditingChat(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveTitle = async () => {
    if (editingChat && editingTitle.trim()) {
      await updateChatTitle(editingChat, editingTitle.trim());
      setEditingChat(null);
      setEditingTitle('');
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setCreatingFolder(false);
    }
  };

  const chatsInFolder = (folderId: string | null) => {
    return chats.filter(chat => chat.folder_id === folderId);
  };

  const rootChats = chatsInFolder(null);

  return (
    <div className="space-y-2">
      {/* Кнопка создания папки */}
      {!creatingFolder ? (
        <Button
          onClick={() => setCreatingFolder(true)}
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl"
        >
          <folder className="w-4 h-4 mr-2" />
          Создать папку
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Название папки"
            className="bg-gray-800 border-gray-700 text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <Button onClick={handleCreateFolder} size="sm">Создать</Button>
          <Button onClick={() => setCreatingFolder(false)} size="sm" variant="ghost">Отмена</Button>
        </div>
      )}

      {/* Папки */}
      {folders.map((folder) => (
        <Collapsible key={folder.id} open={expandedFolders.has(folder.id)}>
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <CollapsibleTrigger
              onClick={() => toggleFolder(folder.id)}
              className="flex items-center flex-1 text-left"
            >
              <div className="flex items-center flex-1">
                <folder className="w-4 h-4 mr-2 text-yellow-500" />
                <span className="text-white font-medium">{folder.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  ({chatsInFolder(folder.id).length})
                </span>
              </div>
              {expandedFolders.has(folder.id) ? 
                <chevron-up className="w-4 h-4 text-gray-400" /> : 
                <chevron-down className="w-4 h-4 text-gray-400" />
              }
            </CollapsibleTrigger>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
                  <pencil className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem
                  onClick={() => deleteFolder(folder.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                >
                  <trash-2 className="w-4 h-4 mr-2" />
                  Удалить папку
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <CollapsibleContent className="ml-4 space-y-1">
            {chatsInFolder(folder.id).map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentChatId={currentChatId}
                onChatSelect={onChatSelect}
                onEditChat={handleEditChat}
                editingChat={editingChat}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onSaveTitle={handleSaveTitle}
                onChatDeleted={onChatDeleted}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Чаты без папки */}
      {rootChats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onEditChat={handleEditChat}
          editingChat={editingChat}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          onSaveTitle={handleSaveTitle}
          onChatDeleted={onChatDeleted}
        />
      ))}
    </div>
  );
}

interface ChatItemProps {
  chat: any;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onEditChat: (chat: any) => void;
  editingChat: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSaveTitle: () => void;
  onChatDeleted: () => void;
}

function ChatItem({ 
  chat, 
  currentChatId, 
  onChatSelect, 
  onEditChat, 
  editingChat, 
  editingTitle, 
  setEditingTitle, 
  onSaveTitle, 
  onChatDeleted 
}: ChatItemProps) {
  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Сначала удаляем сообщения чата
      await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      // Затем удаляем сам чат (статистика НЕ удаляется)
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      if (currentChatId === chatId) {
        onChatDeleted();
      }
    } catch (error: any) {
      console.error('Ошибка удаления чата:', error);
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer ${
        currentChatId === chat.id ? 'bg-gray-700' : ''
      }`}
      onClick={() => onChatSelect(chat.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <message-square className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {editingChat === chat.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSaveTitle()}
                onBlur={onSaveTitle}
                className="text-sm bg-gray-700 border-gray-600 text-white"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <div className="text-sm font-medium truncate text-white">{chat.title}</div>
                <div className="text-xs text-gray-400">
                  {new Date(chat.updated_at).toLocaleDateString('ru-RU')}
                </div>
              </>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-gray-400 hover:text-white"
            >
              <pencil className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEditChat(chat);
              }}
              className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
            >
              <pencil className="w-4 h-4 mr-2" />
              Переименовать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => deleteChat(chat.id, e)}
              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
            >
              <trash-2 className="w-4 h-4 mr-2" />
              Удалить чат
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
