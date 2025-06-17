
import React from 'react';
import { 
  Pencil, 
  Trash2, 
  MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  folder_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ChatItemProps {
  chat: Chat;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onEditChat: (chat: Chat) => void;
  editingChat: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSaveTitle: () => void;
  onChatDeleted: () => void;
}

export function ChatItem({ 
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
          <MessageSquare className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
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
              <Pencil className="w-4 h-4" />
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
              <Pencil className="w-4 h-4 mr-2" />
              Переименовать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => deleteChat(chat.id, e)}
              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить чат
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
