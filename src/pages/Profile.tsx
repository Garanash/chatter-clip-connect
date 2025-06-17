
import { useState } from 'react';
import { UserProfile } from '@/components/UserProfile';
import { UserStats } from '@/components/UserStats';
import { Button } from '@/components/ui/button';
import { User, BarChart } from 'lucide-react';

type ProfileView = 'profile' | 'stats';

export default function Profile() {
  const [currentView, setCurrentView] = useState<ProfileView>('profile');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-4">
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Профиль
            </Button>
            <Button
              variant={currentView === 'stats' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('stats')}
              className="flex items-center gap-2"
            >
              <BarChart className="w-4 h-4" />
              Статистика
            </Button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="py-6">
        {currentView === 'profile' ? <UserProfile /> : <UserStats />}
      </div>
    </div>
  );
}
