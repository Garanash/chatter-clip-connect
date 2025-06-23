
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { UserProfile } from '@/components/UserProfile';
import { UserStats } from '@/components/UserStats';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, BarChart } from 'lucide-react';

type View = 'chat' | 'profile';
type ProfileView = 'profile' | 'stats';

export default function Chat() {
  const { id } = useParams();
  const [currentChatId, setCurrentChatId] = useState<string | null>(id || null);
  const [currentView, setCurrentView] = useState<View>('chat');
  const [profileView, setProfileView] = useState<ProfileView>('profile');

  useEffect(() => {
    setCurrentChatId(id || null);
  }, [id]);

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentView('chat');
  };

  const handleAdminPanel = () => {
    // Эта функция больше не используется, но оставляем для совместимости
  };

  const handleProfilePanel = () => {
    setCurrentView('profile');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  if (currentView === 'profile') {
    return (
      <div className="flex h-screen bg-gray-50 max-h-screen">
        <CollapsibleSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onAdminPanel={handleAdminPanel}
          onProfilePanel={handleProfilePanel}
        />
        
        <div className="flex-1 flex flex-col min-w-0 max-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToChat}
                  className="flex items-center gap-2 hover:bg-gray-100 text-sm lg:text-base"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Назад к чату</span>
                </Button>
                <h1 className="text-lg lg:text-xl font-semibold text-gray-800">Личный кабинет</h1>
              </div>
              
              <div className="flex gap-1 lg:gap-2">
                <Button
                  variant={profileView === 'profile' ? 'default' : 'ghost'}
                  onClick={() => setProfileView('profile')}
                  className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-3"
                >
                  <User className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">Профиль</span>
                </Button>
                <Button
                  variant={profileView === 'stats' ? 'default' : 'ghost'}
                  onClick={() => setProfileView('stats')}
                  className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-3"
                >
                  <BarChart className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">Статистика</span>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50">
            {profileView === 'profile' ? <UserProfile /> : <UserStats />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 max-h-screen">
      <CollapsibleSidebar
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onAdminPanel={handleAdminPanel}
        onProfilePanel={handleProfilePanel}
      />
      
      <ChatInterface chatId={currentChatId} />
    </div>
  );
}
