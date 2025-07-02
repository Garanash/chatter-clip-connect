
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Edit } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ChatFolderSelector } from './ChatFolderSelector';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  chatId: string | null;
}

interface Message {
  id: string;
  created_at: string;
  content: string;
  role: 'user' | 'assistant';
  attachments: any[];
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('vis-google/gemini-2.5-pro-preview');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [chatTitle, setChatTitle] = useState('Новый чат');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (chatId) {
      loadMessages();
      loadChatDetails();
    } else {
      setMessages([]);
      setChatTitle('Новый чат');
      setCurrentFolderId(null);
    }
  }, [chatId]);

  const loadMessages = async () => {
    if (!chatId || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        created_at: msg.created_at || '',
        content: msg.content,
        role: (msg.role === 'user' || msg.role === 'assistant') ? msg.role as 'user' | 'assistant' : 'user',
        attachments: Array.isArray(msg.attachments) ? msg.attachments : []
      }));
      
      setMessages(formattedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщения",
        variant: "destructive",
      });
    }
  };

  const loadChatDetails = async () => {
    if (!chatId || !user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('title, folder_id')
        .eq('id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setChatTitle(data.title);
        setCurrentFolderId(data.folder_id);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных чата:', error);
    }
  };

  const handleFolderChange = async (folderId: string | null) => {
    if (!chatId || !user) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .update({ folder_id: folderId })
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCurrentFolderId(folderId);
      await loadChatDetails();
      
      toast({
        title: "Успешно",
        description: "Чат перемещен в папку",
      });
    } catch (error) {
      console.error('Ошибка перемещения чата:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось переместить чат",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewChat = async (firstMessage: string) => {
    if (!user) throw new Error('Пользователь не авторизован');

    const { data, error } = await supabase
      .from('chats')
      .insert([{
        user_id: user.id,
        title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        folder_id: null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user || isLoading) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      let currentChatId = chatId;

      // Создаем новый чат если его нет
      if (!currentChatId) {
        const newChat = await createNewChat(messageContent);
        currentChatId = newChat.id;
        setChatTitle(newChat.title);
        navigate(`/chat/${currentChatId}`, { replace: true });
      }

      // Добавляем сообщение пользователя
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: messageContent,
        role: 'user' as const,
        attachments: []
      };

      setMessages(prev => [...prev, userMessage]);
      scrollToBottom();

      // Сохраняем сообщение пользователя в БД
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([{
          chat_id: currentChatId,
          content: messageContent,
          role: 'user'
        }]);

      if (userMessageError) throw userMessageError;

      // Вызываем функцию AI
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('vsegpt-chat', {
        body: {
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: messageContent
            }
          ],
          model: selectedModel
        }
      });

      let assistantContent = 'Произошла ошибка при обработке вашего запроса.';
      
      if (!aiError && aiResponse?.response) {
        assistantContent = aiResponse.response;
      } else {
        console.error('Ошибка AI:', aiError);
      }

      // Добавляем ответ ассистента
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: assistantContent,
        role: 'assistant' as const,
        attachments: []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Сохраняем ответ ассистента в БД
      await supabase
        .from('messages')
        .insert([{
          chat_id: currentChatId,
          content: assistantContent,
          role: 'assistant'
        }]);

      // Обновляем время последнего обновления чата
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
      
      // Добавляем сообщение об ошибке
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        created_at: new Date().toISOString(),
        content: 'Произошла ошибка при отправке сообщения. Попробуйте еще раз.',
        role: 'assistant' as const,
        attachments: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const saveChatTitle = async () => {
    if (!chatTitle.trim() || !chatId || !user) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: chatTitle.trim() })
        .eq('id', chatId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setIsEditingTitle(false);
      toast({
        title: "Успешно",
        description: "Название чата обновлено",
      });
    } catch (error) {
      console.error('Ошибка обновления названия чата:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить название чата",
        variant: "destructive",
      });
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0 max-h-screen">
      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        disabled={isLoading}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        {chatId && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                    onBlur={saveChatTitle}
                    onKeyPress={(e) => e.key === 'Enter' && saveChatTitle()}
                    className="bg-transparent border-b border-gray-400 text-lg font-semibold outline-none flex-1 min-w-0"
                    autoFocus
                  />
                ) : (
                  <h2 
                    className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 flex-1 min-w-0 truncate"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {chatTitle}
                  </h2>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingTitle(!isEditingTitle)}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-shrink-0">
                <ChatFolderSelector
                  currentFolderId={currentFolderId}
                  onFolderChange={handleFolderChange}
                  chatId={chatId}
                  onUpdate={loadChatDetails}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !chatId && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h3 className="text-lg font-medium mb-2">Добро пожаловать!</h3>
                <p>Начните новый разговор, написав сообщение ниже.</p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : 'bg-gray-100 text-gray-800 mr-12'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 mr-12">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1 min-w-0">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Введите сообщение..."
                rows={1}
                className="resize-none min-h-[44px] max-h-32 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                style={{ 
                  height: 'auto',
                  minHeight: '44px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-11 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
