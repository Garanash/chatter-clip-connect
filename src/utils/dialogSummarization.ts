
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
        model: 'anthropic/claude-sonnet-4'
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
    // Если есть резюме и много сообщений, берем последние 10 сообщений
    // и добавляем контекст к первому сообщению пользователя
    const recentMessages = messages.slice(-10);
    
    if (recentMessages.length > 0 && recentMessages[0].role === 'user') {
      // Добавляем контекст к первому сообщению пользователя
      const contextualMessages = [...recentMessages];
      contextualMessages[0] = {
        ...contextualMessages[0],
        content: `Контекст предыдущего диалога: ${summary}\n\n${contextualMessages[0].content}`
      };
      return contextualMessages;
    } else if (recentMessages.length > 0) {
      // Если первое сообщение от ассистента, добавляем контекст в начало
      return [
        {
          role: 'user',
          content: `Контекст предыдущего диалога: ${summary}`
        },
        ...recentMessages
      ];
    }
  }
  
  return messages;
};

// Новые функции для работы с контекстом чата
export const saveChatSummary = async (chatId: string, summary: string) => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({ summary })
      .eq('id', chatId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Ошибка при сохранении резюме чата:', error);
  }
};

export const getChatSummary = async (chatId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('summary')
      .eq('id', chatId)
      .single();
    
    if (error) throw error;
    return data?.summary || null;
  } catch (error) {
    console.error('Ошибка при получении резюме чата:', error);
    return null;
  }
};
