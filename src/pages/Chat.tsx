
import { useState } from 'react';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { AdminPanel } from '@/components/AdminPanel';

type View = 'chat' | 'admin';

export default function Chat() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('chat');

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

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onAdminPanel={handleAdminPanel}
      />
      
      {currentView === 'chat' ? (
        <ChatInterface chatId={currentChatId} />
      ) : (
        <AdminPanel onBack={handleBackToChat} />
      )}
    </div>
  );
}
