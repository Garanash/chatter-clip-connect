
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
}

interface Attachment {
  name: string;
  type: string;
  base64?: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, prompt, model = 'anthropic/claude-sonnet-4', attachments = [] } = await req.json();
    const apiKey = Deno.env.get('VSEGPT_API_KEY');

    if (!apiKey) {
      throw new Error('VSEGPT_API_KEY не найден в переменных окружения');
    }

    console.log('Отправка запроса к VseGPT API с моделью:', model);
    console.log('Вложения:', attachments.length);

    const apiMessages: ChatMessage[] = messages || [];
    
    if (apiMessages.length === 0 || apiMessages[0].role !== 'system') {
      apiMessages.unshift({
        role: 'system',
        content: 'Ты полезный AI-ассистент. Отвечай на русском языке, если пользователь пишет на русском. Если пользователь прикрепил файлы, анализируй их содержимое и отвечай на основе предоставленной информации. Ты умеешь распознавать текст на изображениях, анализировать PDF документы и другие файлы.'
      });
    }

    // Обработка файлов в сообщениях
    const processedMessages = apiMessages.map(msg => {
      let content = msg.content;
      
      if (attachments && attachments.length > 0) {
        const fileInfo = attachments.map((att: Attachment) => {
          let fileDescription = `Файл: ${att.name} (${att.type})`;
          
          // Для изображений добавляем информацию о возможности анализа
          if (att.type.startsWith('image/')) {
            fileDescription += ' - изображение для анализа';
          } else if (att.type === 'application/pdf') {
            fileDescription += ' - PDF документ для анализа';
          } else if (att.type.startsWith('text/')) {
            fileDescription += ' - текстовый файл для анализа';
          }
          
          return fileDescription;
        }).join(', ');
        
        content = `${content}\n\nПрикрепленные файлы: ${fileInfo}\n\nПожалуйста, проанализируй содержимое прикрепленных файлов и предоставь информацию на основе их содержания.`;
      }
      
      return {
        ...msg,
        content
      };
    });

    // Подготавливаем вложения для API
    const messageContent: any = {
      model: model,
      messages: processedMessages,
      temperature: 0.7,
      max_tokens: 3000,
      n: 1
    };

    // Если есть изображения, добавляем их в формате, поддерживаемом моделью
    if (attachments.length > 0) {
      const imageAttachments = attachments.filter((att: Attachment) => att.type.startsWith('image/'));
      if (imageAttachments.length > 0 && processedMessages.length > 0) {
        // Модифицируем последнее сообщение пользователя для включения изображений
        const lastUserMessageIndex = processedMessages.map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex !== -1) {
          const lastMessage = processedMessages[lastUserMessageIndex];
          processedMessages[lastUserMessageIndex] = {
            ...lastMessage,
            content: [
              { type: "text", text: lastMessage.content },
              ...imageAttachments.map((att: Attachment) => ({
                type: "image_url",
                image_url: { url: att.base64 || att.url }
              }))
            ]
          };
        }
      }
    }

    const response = await fetch('https://api.vsegpt.ru/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Lovable Chat App'
      },
      body: JSON.stringify(messageContent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VseGPT API Error:', response.status, errorText);
      throw new Error(`VseGPT API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Ответ получен от VseGPT API');

    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Не удалось получить ответ от AI');
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Ошибка в vsegpt-chat function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
