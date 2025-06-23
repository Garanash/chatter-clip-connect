
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Edit } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ChatFolderSelector } from './ChatFolderSelector';

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

  useEffect(() => {
    if (chatId) {
      loadMessages();
      loadChatDetails();
    } else {
      // Очищаем состояние для нового чата
      setMessages([]);
      setChatTitle('Новый чат');
      setCurrentFolderId(null);
    }
  }, [chatId]);

  const loadMessages = async () => {
    if (!chatId) return;

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
    }
  };

  const loadChatDetails = async () => {
    if (!chatId) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('title, folder_id')
        .eq('id', chatId)
        .single();

      if (error) throw error;
      
      setChatTitle(data.title);
      setCurrentFolderId(data.folder_id);
    } catch (error) {
      console.error('Ошибка загрузки данных чата:', error);
    }
  };

  const handleFolderChange = async (folderId: string | null) => {
    if (!chatId) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .update({ folder_id: folderId })
        .eq('id', chatId);

      if (error) throw error;
      
      setCurrentFolderId(folderId);
      await loadChatDetails();
    } catch (error) {
      console.error('Ошибка перемещения чата:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const messageContent = inputMessage;
    setInputMessage('');

    // Если нет активного чата, создаём новый
    let currentChatId = chatId;
    if (!currentChatId) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .insert([{
            user_id: user.id,
            title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
            folder_id: null
          }])
          .select()
          .single();

        if (error) throw error;
        currentChatId = data.id;
        setChatTitle(data.title);
        
        // Переходим к новому чату
        navigate(`/chat/${currentChatId}`);
        return;
      } catch (error) {
        console.error('Ошибка создания чата:', error);
        return;
      }
    }

    const userMessage: Message = {
      id: new Date().getTime().toString(),
      created_at: new Date().toISOString(),
      content: messageContent,
      role: 'user' as const,
      attachments: []
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke('vsegpt-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: messageContent
            }
          ],
          model: selectedModel
        }
      });

      if (error) {
        console.error('Ошибка при вызове функции:', error);
        setMessages(prev => [...prev, {
          id: new Date().getTime().toString(),
          created_at: new Date().toISOString(),
          content: 'Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.',
          role: 'assistant' as const,
          attachments: []
        }]);
      } else {
        // Сохраняем сообщения в базу данных
        await supabase
          .from('messages')
          .insert([
            {
              chat_id: currentChatId,
              content: messageContent,
              role: 'user'
            },
            {
              chat_id: currentChatId,
              content: data.response || 'Ответ не получен',
              role: 'assistant'
            }
          ]);

        setMessages(prev => [...prev, {
          id: new Date().getTime().toString(),
          created_at: new Date().toISOString(),
          content: data.response || 'Ответ не получен',
          role: 'assistant' as const,
          attachments: []
        }]);
      }
    } catch (error) {
      console.error('Непредвиденная ошибка:', error);
      setMessages(prev => [...prev, {
        id: new Date().getTime().toString(),
        created_at: new Date().toISOString(),
        content: 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.',
        role: 'assistant' as const,
        attachments: []
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const saveChatTitle = async () => {
    if (!chatTitle.trim() || !chatId) return;

    try {
      await supabase
        .from('chats')
        .update({ title: chatTitle.trim() })
        .eq('id', chatId);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Ошибка обновления названия чата:', error);
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
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="text-sm opacity-75">
                        📎 {attachment.name || 'Файл'}
                      </div>
                    ))}
                  </div>
                )}
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
