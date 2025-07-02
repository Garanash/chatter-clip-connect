
import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/spinner';
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
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadChats();
      
      // Подписываемся на изменения в чатах
      const subscription = supabase
        .channel('chats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadChats();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setChats([]);
      setLoading(false);
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки чатов:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить чаты",
          variant: "destructive",
        });
        return;
      }

      setChats(data || []);
    } catch (error) {
      console.error('Неожиданная ошибка загрузки чатов:', error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) return;

    try {
      // Сначала удаляем сообщения чата
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (messagesError) {
        console.error('Ошибка удаления сообщений:', messagesError);
      }

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

  if (loading) {
    return <LoadingSpinner message="Загрузка чатов..." />;
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Пока нет чатов</p>
        <p className="text-sm">Начните новый разговор</p>
      </div>
    );
  }

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
