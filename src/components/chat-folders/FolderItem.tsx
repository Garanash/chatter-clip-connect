
import { useState } from 'react';
import { 
  Folder, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ChatItem } from './ChatItem';

interface Chat {
  id: string;
  title: string;
  folder_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ChatFolder {
  id: string;
  name: string;
  icon_url: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface FolderItemProps {
  folder: ChatFolder;
  chats: Chat[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onDeleteFolder: (folderId: string) => Promise<void>;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => Promise<void>;
  onChatDeleted: () => void;
}

export function FolderItem({ 
  folder, 
  chats, 
  isExpanded, 
  onToggleExpanded, 
  onDeleteFolder,
  currentChatId,
  onChatSelect,
  onUpdateChatTitle,
  onChatDeleted
}: FolderItemProps) {
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleEditChat = (chat: Chat) => {
    setEditingChat(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveTitle = async () => {
    if (editingChat && editingTitle.trim()) {
      await onUpdateChatTitle(editingChat, editingTitle.trim());
      setEditingChat(null);
      setEditingTitle('');
    }
  };

  return (
    <Collapsible open={isExpanded}>
      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-800 transition-colors">
        <CollapsibleTrigger
          onClick={onToggleExpanded}
          className="flex items-center flex-1 text-left"
        >
          <div className="flex items-center flex-1">
            <Folder className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="text-white font-medium">{folder.name}</span>
            <span className="ml-2 text-xs text-gray-400">
              ({chats.length})
            </span>
          </div>
          {isExpanded ? 
            <ChevronUp className="w-4 h-4 text-gray-400" /> : 
            <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </CollapsibleTrigger>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
              <Pencil className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder.id)}
              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить папку
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CollapsibleContent className="ml-4 space-y-1">
        {chats.map((chat) => (
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
  );
}
