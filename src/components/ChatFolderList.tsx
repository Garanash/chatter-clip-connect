
import { useState } from 'react';
import { useChatFolders } from '@/hooks/useChatFolders';
import { FolderCreator } from './chat-folders/FolderCreator';
import { FolderItem } from './chat-folders/FolderItem';
import { ChatItem } from './chat-folders/ChatItem';

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

  const chatsInFolder = (folderId: string | null) => {
    return chats.filter(chat => chat.folder_id === folderId);
  };

  const rootChats = chatsInFolder(null);

  return (
    <div className="space-y-2">
      <FolderCreator onCreateFolder={createFolder} />

      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          chats={chatsInFolder(folder.id)}
          isExpanded={expandedFolders.has(folder.id)}
          onToggleExpanded={() => toggleFolder(folder.id)}
          onDeleteFolder={deleteFolder}
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onUpdateChatTitle={updateChatTitle}
          onChatDeleted={onChatDeleted}
        />
      ))}

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
