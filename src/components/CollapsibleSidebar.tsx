
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatSidebar } from './ChatSidebar';

interface CollapsibleSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAdminPanel: () => void;
  onProfilePanel: () => void;
}

export function CollapsibleSidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  onAdminPanel,
  onProfilePanel
}: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`relative transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
      {!isCollapsed && (
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={onChatSelect}
          onNewChat={onNewChat}
          onAdminPanel={onAdminPanel}
          onProfilePanel={onProfilePanel}
        />
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={`absolute top-4 ${isCollapsed ? 'left-2' : 'right-4'} z-10 bg-gray-800 hover:bg-gray-700 text-white`}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
      
      {isCollapsed && (
        <div className="w-12 h-screen bg-gray-900 flex flex-col items-center pt-16">
          <div className="text-white text-xs transform -rotate-90 whitespace-nowrap">
            Чаты
          </div>
        </div>
      )}
    </div>
  );
}
