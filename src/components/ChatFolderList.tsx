
import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatFolders } from '@/hooks/useChatFolders';
import { FolderItem } from './chat-folders/FolderItem';
import { ChatItem } from './chat-folders/ChatItem';
import { FolderCreator } from './chat-folders/FolderCreator';

interface ChatFolderListProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onChatDeleted: () => void;
}

export function ChatFolderList({ currentChatId, onChatSelect, onChatDeleted }: ChatFolderListProps) {
  const { folders, chats, loading, createFolder, updateFolder, updateChatTitle, moveChatToFolder, deleteFolder } = useChatFolders();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async (name: string, color?: string, iconUrl?: string) => {
    await createFolder(name, color, iconUrl);
    setShowCreateFolder(false);
  };

  const unorganizedChats = chats.filter(chat => !chat.folder_id);

  if (loading) {
    return <div className="text-gray-400 text-sm">Загрузка...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Folders */}
      {folders.map((folder) => {
        const folderChats = chats.filter(chat => chat.folder_id === folder.id);
        const isExpanded = expandedFolders.has(folder.id);

        return (
          <div key={folder.id} className="space-y-1">
            <FolderItem
              folder={folder}
              isExpanded={isExpanded}
              onToggle={() => toggleFolder(folder.id)}
              onUpdate={updateFolder}
              onDelete={deleteFolder}
              onMoveChat={moveChatToFolder}
            />
            
            {isExpanded && (
              <div className="ml-4 space-y-1">
                {folderChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={currentChatId === chat.id}
                    onSelect={onChatSelect}
                    onTitleUpdate={updateChatTitle}
                    onDelete={onChatDeleted}
                    onMoveToFolder={moveChatToFolder}
                    folders={folders}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Unorganized Chats */}
      {unorganizedChats.length > 0 && (
        <div className="space-y-1">
          {unorganizedChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={currentChatId === chat.id}
              onSelect={onChatSelect}
              onTitleUpdate={updateChatTitle}
              onDelete={onChatDeleted}
              onMoveToFolder={moveChatToFolder}
              folders={folders}
            />
          ))}
        </div>
      )}

      {/* Create Folder Button */}
      <div className="pt-2 border-t border-gray-700">
        {showCreateFolder ? (
          <FolderCreator
            onCreateFolder={handleCreateFolder}
            onCancel={() => setShowCreateFolder(false)}
          />
        ) : (
          <Button
            onClick={() => setShowCreateFolder(true)}
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать папку
          </Button>
        )}
      </div>
    </div>
  );
}
