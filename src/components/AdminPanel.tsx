
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
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
    if (!newUserEmail || !newUserPassword) return;

    setLoading(true);

    try {
      // Создаем пользователя через API
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      });

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Пользователь создан",
      });

      setNewUserEmail('');
      setNewUserPassword('');
      loadProfiles();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Доступ запрещен</h2>
          <p className="text-gray-500">У вас нет прав администратора</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button onClick={onBack} variant="ghost" className="mr-4">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Панель администратора</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Создание пользователя */}
          <Card>
            <CardHeader>
              <CardTitle>Создать пользователя</CardTitle>
              <CardDescription>Добавьте нового пользователя в систему</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createUser} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать пользователя
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Список пользователей */}
          <Card>
            <CardHeader>
              <CardTitle>Пользователи системы</CardTitle>
              <CardDescription>Всего пользователей: {profiles.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <div>
                      <div className="font-medium">{profile.email}</div>
                      <div className="text-sm text-gray-500">
                        {profile.role} • {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
