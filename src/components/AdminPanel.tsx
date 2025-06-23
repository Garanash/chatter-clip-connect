
import { useState, useEffect } from 'react';
import { Plus, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Profile {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadProfiles();
    }
  }, [profile]);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка загрузки профилей:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      });
      return;
    }

    setProfiles(data || []);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Ошибка",
        description: "Email и пароль обязательны",
        variant: "destructive",
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Создаем пользователя через обычную регистрацию
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            first_name: newUserFirstName || 'Пользователь',
            last_name: newUserLastName || '',
            role: newUserRole
          }
        }
      });

      if (error) throw error;

      // Если пользователь создан, обновляем его профиль
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: newUserFirstName || 'Пользователь',
            last_name: newUserLastName || '',
            role: newUserRole
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Ошибка обновления профиля:', profileError);
        }
      }

      toast({
        title: "Успех",
        description: "Пользователь создан успешно",
      });

      // Очищаем форму
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserRole('user');
      
      // Перезагружаем список
      setTimeout(() => {
        loadProfiles();
      }, 1000);

    } catch (error: any) {
      console.error('Ошибка создания пользователя:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Роль пользователя обновлена",
      });

      loadProfiles();
    } catch (error: any) {
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
      <div className="flex-1 flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Доступ запрещен</h2>
          <p className="text-gray-500">У вас нет прав администратора</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Панель администратора</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Создание пользователя */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Создать пользователя
              </CardTitle>
              <CardDescription>Добавьте нового пользователя в систему</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Имя"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Фамилия"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email *"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Пароль (минимум 6 символов) *"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Создание...' : 'Создать пользователя'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Статистика */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Статистика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Всего пользователей:</span>
                  <span className="text-xl font-bold text-blue-600">{profiles.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Администраторов:</span>
                  <span className="text-xl font-bold text-green-600">
                    {profiles.filter(p => p.role === 'admin').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">Обычных пользователей:</span>
                  <span className="text-xl font-bold text-purple-600">
                    {profiles.filter(p => p.role === 'user').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Список пользователей */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Управление пользователями
            </CardTitle>
            <CardDescription>Всего пользователей: {profiles.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {profiles.map((userProfile) => (
                <div key={userProfile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">
                          {userProfile.first_name} {userProfile.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{userProfile.email}</div>
                        <div className="text-xs text-gray-500">
                          Создан: {new Date(userProfile.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select
                      value={userProfile.role}
                      onValueChange={(newRole) => updateUserRole(userProfile.id, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userProfile.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userProfile.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </div>
                  </div>
                </div>
              ))}
              
              {profiles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Пользователи не найдены
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
