
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const summarizeDialog = async (messages: Message[]): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('vsegpt-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: 'Ты должен создать краткое резюме диалога между пользователем и ассистентом. Сохрани ключевые темы, важные детали и контекст разговора. Отвечай на русском языке.'
          },
          {
            role: 'user',
            content: `Пожалуйста, создай краткое резюме следующего диалога:\n\n${messages.map(msg => `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.content}`).join('\n\n')}`
          }
        ],
        model: 'anthropic/claude-sonnet-4' // Используем быструю модель для суммаризации
      }
    });

    if (error) throw error;
    return data.response || 'Не удалось создать резюме диалога';
  } catch (error) {
    console.error('Ошибка при суммаризации диалога:', error);
    return 'Краткое резюме предыдущего диалога недоступно';
  }
};

export const shouldSummarize = (messageCount: number): boolean => {
  return messageCount > 20;
};

export const getMessagesForContext = (messages: Message[], summary?: string): Message[] => {
  if (summary && messages.length > 20) {
    // Если есть резюме и много сообщений, берем резюме + последние 10 сообщений
    const recentMessages = messages.slice(-10);
    return [
      {
        role: 'system',
        content: `Контекст предыдущего диалога: ${summary}`
      },
      ...recentMessages
    ];
  }
  
  return messages;
};
