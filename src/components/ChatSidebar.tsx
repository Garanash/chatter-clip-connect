
import { Plus, Settings, LogOut, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatFolderList } from './ChatFolderList';

interface ChatSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAdminPanel: () => void;
  onProfilePanel: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, onAdminPanel, onProfilePanel }: ChatSidebarProps) {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

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

    onNewChat();
    onChatSelect(data.id);
  };

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-screen rounded-r-3xl">
      <div className="p-6 border-b border-gray-700">
        <Button 
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Новый чат
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">История чатов</h3>
        <ChatFolderList
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onChatDeleted={onNewChat}
        />
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2 pb-20">
        <Button
          onClick={onProfilePanel}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
        >
          <User className="w-4 h-4 mr-2" />
          Личный кабинет
        </Button>

        {profile?.role === 'admin' && (
          <Button
            onClick={onAdminPanel}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
          >
            <Users className="w-4 h-4 mr-2" />
            Админка
          </Button>
        )}
        
        <div className="text-sm text-gray-400 px-2 truncate">
          {user?.email}
        </div>
        
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>
    </div>
  );
}
