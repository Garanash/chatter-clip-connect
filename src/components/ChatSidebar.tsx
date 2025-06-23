
import { useState } from 'react';
import { Plus, LogOut, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ChatFolderList } from './ChatFolderList';
import { GlassProfilePanel } from './GlassProfilePanel';
import { useNavigate } from 'react-router-dom';

interface ChatSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAdminPanel: () => void;
  onProfilePanel: () => void;
  isCollapsed?: boolean;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, onAdminPanel, onProfilePanel, isCollapsed }: ChatSidebarProps) {
  const { user, profile, signOut } = useAuth();
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const navigate = useNavigate();

  const handleNewChat = () => {
    // Просто переходим на пустую страницу чата
    onNewChat();
    navigate('/chat');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleProfileClick = () => {
    setShowProfilePanel(true);
    onProfilePanel();
  };

  if (isCollapsed) {
    return (
      <div className="w-14 h-screen bg-gray-900 flex flex-col items-center py-4 space-y-2">
        <Button
          onClick={handleNewChat}
          className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          onClick={handleProfileClick}
          variant="ghost"
          className="w-10 h-10 p-0 rounded-full overflow-hidden"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-300" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-gray-900 text-white flex flex-col h-screen">
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

        <div className="p-4 border-t border-gray-700 space-y-2">
          <Button
            onClick={handleProfileClick}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl backdrop-blur-sm"
          >
            <div className="flex items-center w-full">
              <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                    {profile?.nickname?.[0] || profile?.first_name?.[0] || user?.email?.[0] || 'У'}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full">
                  {profile?.nickname || profile?.first_name || 'Пользователь'}
                </span>
                <span className="text-xs text-gray-400">Личный кабинет</span>
              </div>
            </div>
          </Button>

          {profile?.role === 'admin' && (
            <Button
              onClick={handleAdminClick}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl backdrop-blur-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Админка
            </Button>
          )}
          
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      <GlassProfilePanel
        isOpen={showProfilePanel}
        onClose={() => setShowProfilePanel(false)}
      />
    </>
  );
}
