
import { useState } from 'react';
import { UserProfile } from '@/components/UserProfile';
import { UserStats } from '@/components/UserStats';
import { Button } from '@/components/ui/button';
import { User, BarChart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ProfileView = 'profile' | 'stats';

export default function Profile() {
  const [currentView, setCurrentView] = useState<ProfileView>('profile');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/chat')}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Назад к чату</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-800">Личный кабинет</h1>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={currentView === 'profile' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Профиль</span>
              </Button>
              <Button
                variant={currentView === 'stats' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('stats')}
                className="flex items-center gap-2"
              >
                <BarChart className="w-4 h-4" />
                <span className="hidden sm:inline">Статистика</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {currentView === 'profile' ? <UserProfile /> : <UserStats />}
      </div>
    </div>
  );
}
