
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const backgroundOptions = [
  { id: 'default', name: 'По умолчанию', preview: 'bg-gradient-to-b from-gray-50 to-white' },
  { id: 'ocean', name: 'Океан', preview: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600' },
  { id: 'sunset', name: 'Закат', preview: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' },
  { id: 'forest', name: 'Лес', preview: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' },
  { id: 'space', name: 'Космос', preview: 'bg-gradient-to-br from-purple-900 via-blue-900 to-black' },
  { id: 'lavender', name: 'Лаванда', preview: 'bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500' }
];

export function ChatBackgrounds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBackground, setSelectedBackground] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('chat_background')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSelectedBackground(data.chat_background || 'default');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const handleBackgroundChange = async (backgroundId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          chat_background: backgroundId
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSelectedBackground(backgroundId);
      toast({
        title: "Успешно",
        description: "Обои чата обновлены",
      });
    } catch (error) {
      console.error('Ошибка обновления обоев:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить обои чата",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Обои чата</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {backgroundOptions.map((bg) => (
            <div
              key={bg.id}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                selectedBackground === bg.id ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-102'
              }`}
              onClick={() => handleBackgroundChange(bg.id)}
            >
              <div className={`w-full h-24 ${bg.preview}`} />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <span className="text-white font-medium text-sm">{bg.name}</span>
              </div>
              {selectedBackground === bg.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
