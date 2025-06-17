
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save, Upload } from 'lucide-react';
import { ChatBackgrounds } from './ChatBackgrounds';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        avatar_url: data.avatar_url || ''
      });
    } catch (error: any) {
      console.error('Ошибка загрузки профиля:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          avatar_url: formData.avatar_url
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Профиль обновлен",
      });

      loadProfile();
    } catch (error: any) {
      console.error('Ошибка обновления профиля:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Успешно",
        description: "Аватар загружен",
      });
    } catch (error: any) {
      console.error('Ошибка загрузки аватара:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аватар",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основной профиль */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Личная информация
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Аватар */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24 ring-4 ring-blue-100">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {formData.first_name?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="cursor-pointer rounded-xl"
                      asChild
                    >
                      <div>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Загрузка...' : 'Загрузить фото'}
                      </div>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Форма */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium mb-2">
                    Имя
                  </label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Введите имя"
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium mb-2">
                    Фамилия
                  </label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Введите фамилию"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100 rounded-xl"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Настройки обоев */}
        <div>
          <ChatBackgrounds />
        </div>
      </div>
    </div>
  );
}
