
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, MessageSquare, Bot, Calendar } from 'lucide-react';

interface StatsData {
  totalChats: number;
  totalMessages: number;
  modelUsage: { [key: string]: number };
  recentActivity: {
    date: string;
    messages: number;
  }[];
}

export function UserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalChats: 0,
    totalMessages: 0,
    modelUsage: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      // Загружаем общее количество чатов
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', user.id);

      if (chatsError) throw chatsError;

      // Загружаем все сообщения пользователя
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, created_at, chat_id')
        .in('chat_id', chatsData?.map(chat => chat.id) || []);

      if (messagesError) throw messagesError;

      // Подсчитываем статистику
      const totalChats = chatsData?.length || 0;
      const totalMessages = messagesData?.length || 0;

      // Группируем активность по дням (последние 7 дней)
      const today = new Date();
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayMessages = messagesData?.filter(msg => 
          msg.created_at?.startsWith(dateStr)
        ).length || 0;
        
        recentActivity.push({
          date: dateStr,
          messages: dayMessages
        });
      }

      setStats({
        totalChats,
        totalMessages,
        modelUsage: {}, // Пока оставляем пустым, можно добавить позже
        recentActivity
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Загрузка статистики...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart className="w-6 h-6" />
        Статистика использования
      </h2>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего чатов</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сообщений</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее за день</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recentActivity.length > 0 
                ? Math.round(stats.recentActivity.reduce((sum, day) => sum + day.messages, 0) / stats.recentActivity.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Активность за последние 7 дней */}
      <Card>
        <CardHeader>
          <CardTitle>Активность за последние 7 дней</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(5, (day.messages / Math.max(...stats.recentActivity.map(d => d.messages), 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{day.messages}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
