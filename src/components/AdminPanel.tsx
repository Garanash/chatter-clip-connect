
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  email: string;
  nickname: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserNickname, setNewUserNickname] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [isCreating, setIsCreating] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadProfiles();
    }
  }, [profile]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserNickname) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            nickname: newUserNickname,
          }
        }
      });

      if (error) throw error;

      // Очищаем форму
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserNickname('');
      setNewUserRole('user');

      toast({
        title: "Успешно",
        description: "Пользователь создан",
      });

      // Обновляем список пользователей
      await loadProfiles();
    } catch (error: any) {
      console.error('Ошибка создания пользователя:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, role: newRole } : p
      ));

      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена",
      });
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive",
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-4">У вас нет прав для доступа к админ панели</p>
          <Button onClick={() => navigate('/chat')}>
            Вернуться к чату
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Назад к чату</span>
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">Панель администратора</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Создание пользователя */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Создать пользователя
            </CardTitle>
            <CardDescription>
              Добавьте нового пользователя в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
              <Input
                placeholder="Никнейм"
                value={newUserNickname}
                onChange={(e) => setNewUserNickname(e.target.value)}
              />
              <div className="flex gap-2">
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={createUser} 
                  disabled={isCreating}
                  className="flex-shrink-0"
                >
                  {isCreating ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список пользователей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Пользователи ({profiles.length})
            </CardTitle>
            <CardDescription>
              Управление пользователями системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : (
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {profile.nickname || profile.email}
                          </p>
                          <p className="text-sm text-gray-500">{profile.email}</p>
                          {(profile.first_name || profile.last_name) && (
                            <p className="text-sm text-gray-500">
                              {profile.first_name} {profile.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select
                        value={profile.role}
                        onValueChange={(newRole) => updateUserRole(profile.id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Пользователь</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <span className="text-xs text-gray-500">
                        {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
