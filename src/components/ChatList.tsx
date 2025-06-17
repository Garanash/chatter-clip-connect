
import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatListProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onChatDeleted: () => void;
}

export function ChatList({ currentChatId, onChatSelect, onChatDeleted }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить чаты",
        variant: "destructive",
      });
      return;
    }

    setChats(data || []);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) return;

    try {
      // Сначала удаляем сообщения чата
      await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      // Затем удаляем сам чат
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        onChatDeleted();
      }

      toast({
        title: "Успешно",
        description: "Чат удален",
      });
    } catch (error: any) {
      console.error('Ошибка удаления чата:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чат",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`group relative p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer ${
            currentChatId === chat.id ? 'bg-gray-700' : ''
          }`}
          onClick={() => onChatSelect(chat.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <MessageSquare className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-white">{chat.title}</div>
                <div className="text-xs text-gray-400">
                  {new Date(chat.updated_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-gray-400 hover:text-white"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
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
      ))}
    </div>
  );
}
