
import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  attachments: any[];
  created_at: string;
}

interface ChatInterfaceProps {
  chatId: string | null;
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!chatId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщения",
        variant: "destructive",
      });
      return;
    }

    // Правильно преобразуем данные из базы в тип Message
    const typedMessages: Message[] = (data || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
      created_at: msg.created_at || new Date().toISOString()
    }));

    setMessages(typedMessages);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || !chatId) return;

    setLoading(true);

    try {
      // Подготавливаем данные вложений
      const attachmentsData = attachedFiles.map(f => ({ 
        name: f.name, 
        size: f.size, 
        type: f.type 
      }));

      // Добавляем сообщение пользователя
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            content: inputValue,
            role: 'user',
            attachments: attachmentsData
          }
        ])
        .select()
        .single();

      if (userError) throw userError;

      const typedUserMessage: Message = {
        id: userMessage.id,
        content: userMessage.content,
        role: 'user',
        attachments: Array.isArray(userMessage.attachments) ? userMessage.attachments : [],
        created_at: userMessage.created_at || new Date().toISOString()
      };

      setMessages(prev => [...prev, typedUserMessage]);
      const currentInput = inputValue;
      setInputValue('');
      setAttachedFiles([]);

      // Вызываем VseGPT API через edge function
      const { data: apiResponse, error: apiError } = await supabase.functions.invoke('vsegpt-chat', {
        body: {
          messages: [...messages, typedUserMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          prompt: currentInput
        }
      });

      if (apiError) throw apiError;

      // Добавляем ответ бота
      const { data: botMessage, error: botError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            content: apiResponse.response || 'Произошла ошибка при получении ответа',
            role: 'assistant',
            attachments: []
          }
        ])
        .select()
        .single();

      if (botError) throw botError;

      const typedBotMessage: Message = {
        id: botMessage.id,
        content: botMessage.content,
        role: 'assistant',
        attachments: Array.isArray(botMessage.attachments) ? botMessage.attachments : [],
        created_at: botMessage.created_at || new Date().toISOString()
      };

      setMessages(prev => [...prev, typedBotMessage]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Добро пожаловать в чат с AI</h2>
          <p className="text-gray-500">Выберите чат или создайте новый для начала</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-xs lg:max-w-md ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-500 ml-2' : 'bg-gray-500 mr-2'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.attachments.length > 0 && (
                    <div className="mt-2 text-sm opacity-75">
                      📎 {message.attachments.length} файл(ов)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Ввод сообщения */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="mb-4 space-y-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="text-sm">{file.name}</span>
                  <Button
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              className="flex-1 min-h-[40px] max-h-32 resize-none"
              disabled={loading}
            />
            
            <Button
              onClick={sendMessage}
              disabled={loading || (!inputValue.trim() && attachedFiles.length === 0)}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
