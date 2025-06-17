
import { useState } from 'react';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { AdminPanel } from '@/components/AdminPanel';
import { UserProfile } from '@/components/UserProfile';
import { UserStats } from '@/components/UserStats';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, BarChart } from 'lucide-react';

type View = 'chat' | 'admin' | 'profile';
type ProfileView = 'profile' | 'stats';

export default function Chat() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('chat');
  const [profileView, setProfileView] = useState<ProfileView>('profile');

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentView('chat');
  };

  const handleAdminPanel = () => {
    setCurrentView('admin');
  };

  const handleProfilePanel = () => {
    setCurrentView('profile');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  if (currentView === 'profile') {
    return (
      <div className="flex h-screen bg-gray-100">
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onAdminPanel={handleAdminPanel}
          onProfilePanel={handleProfilePanel}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Шапка профиля */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToChat}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад к чату
                </Button>
                <h1 className="text-xl font-semibold">Личный кабинет</h1>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={profileView === 'profile' ? 'default' : 'ghost'}
                  onClick={() => setProfileView('profile')}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Профиль
                </Button>
                <Button
                  variant={profileView === 'stats' ? 'default' : 'ghost'}
                  onClick={() => setProfileView('stats')}
                  className="flex items-center gap-2"
                >
                  <BarChart className="w-4 h-4" />
                  Статистика
                </Button>
              </div>
            </div>
          </div>
          
          {/* Контент профиля */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {profileView === 'profile' ? <UserProfile /> : <UserStats />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onAdminPanel={handleAdminPanel}
        onProfilePanel={handleProfilePanel}
      />
      
      {currentView === 'chat' ? (
        <ChatInterface chatId={currentChatId} />
      ) : (
        <AdminPanel onBack={handleBackToChat} />
      )}
    </div>
  );
}
