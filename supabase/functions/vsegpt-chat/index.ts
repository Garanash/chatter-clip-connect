
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, prompt } = await req.json();
    const apiKey = Deno.env.get('VSEGPT_API_KEY');

    if (!apiKey) {
      throw new Error('VSEGPT_API_KEY не найден в переменных окружения');
    }

    console.log('Отправка запроса к VseGPT API...');

    // Формируем сообщения для API
    const apiMessages: ChatMessage[] = messages || [];
    
    // Добавляем системное сообщение если его нет
    if (apiMessages.length === 0 || apiMessages[0].role !== 'system') {
      apiMessages.unshift({
        role: 'system',
        content: 'Ты полезный AI-ассистент. Отвечай на русском языке, если пользователь пишет на русском.'
      });
    }

    const response = await fetch('https://api.vsegpt.ru/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Lovable Chat App'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 3000,
        n: 1
      }),
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
