
import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Settings, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAdminPanel: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, onAdminPanel }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const { user, profile, signOut } = useAuth();
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

  const handleNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .insert([
        {
          user_id: user.id,
          title: 'Новый чат'
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать новый чат",
        variant: "destructive",
      });
      return;
    }

    setChats(prev => [data, ...prev]);
    onNewChat();
    onChatSelect(data.id);
  };

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700">
        <Button 
          onClick={handleNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Новый чат
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">История чатов</h3>
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors ${
                currentChatId === chat.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-3 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(chat.updated_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2">
        {profile?.role === 'admin' && (
          <Button
            onClick={onAdminPanel}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Users className="w-4 h-4 mr-2" />
            Админка
          </Button>
        )}
        
        <div className="text-sm text-gray-400 px-2">
          {user?.email}
        </div>
        
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>
    </div>
  );
}
