import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModelSelector } from './ModelSelector';
import { FileUpload } from './FileUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { summarizeDialog, shouldSummarize, getMessagesForContext } from '@/utils/dialogSummarization';
import { getModelIcon } from '@/utils/modelIcons';

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
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4');
  const [dialogSummary, setDialogSummary] = useState<string>('');
  const [isChangingModel, setIsChangingModel] = useState(false);
  const [chatBackground, setChatBackground] = useState('default');
  const [dailyLimit, setDailyLimit] = useState(30);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (chatId) {
      loadMessages();
      loadChatSummary();
    } else {
      setMessages([]);
      setDialogSummary('');
    }
  }, [chatId]);

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setChatBackground(data.chat_background || 'default');
        setDailyLimit(data.daily_message_limit || 30);
        setMessagesUsed(data.messages_sent_today || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек пользователя:', error);
    }
  };

  const getBackgroundClass = (background: string) => {
    const backgrounds: { [key: string]: string } = {
      'default': 'bg-gradient-to-b from-gray-50 to-white',
      'ocean': 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
      'sunset': 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600',
      'forest': 'bg-gradient-to-br from-green-400 via-green-500 to-green-600',
      'space': 'bg-gradient-to-br from-purple-900 via-blue-900 to-black',
      'lavender': 'bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500'
    };
    return backgrounds[background] || backgrounds['default'];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSummary = async () => {
    if (!chatId) return;
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('summary')
        .eq('id', chatId)
        .single();
      
      if (error) throw error;
      setDialogSummary(data?.summary || '');
    } catch (error) {
      console.error('Ошибка загрузки резюме чата:', error);
    }
  };

  const saveChatSummary = async (summary: string) => {
    if (!chatId) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .update({ summary })
        .eq('id', chatId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Ошибка сохранения резюме чата:', error);
    }
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

    const typedMessages: Message[] = (data || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
      created_at: msg.created_at || new Date().toISOString()
    }));

    setMessages(typedMessages);

    if (shouldSummarize(typedMessages.length) && !dialogSummary) {
      const summaryMessages = typedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      const summary = await summarizeDialog(summaryMessages);
      setDialogSummary(summary);
      await saveChatSummary(summary);
    }
  };

  const handleModelChange = async (newModel: string) => {
    if (newModel === selectedModel || !chatId) return;
    
    setIsChangingModel(true);
    
    try {
      if (messages.length > 0) {
        const summaryMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const contextSummary = await summarizeDialog(summaryMessages);
        setDialogSummary(contextSummary);
        await saveChatSummary(contextSummary);
        
        toast({
          title: "Модель изменена",
          description: `Переключение на ${newModel}. Контекст диалога сохранен.`,
        });
      }
      
      setSelectedModel(newModel);
    } catch (error) {
      console.error('Ошибка при смене модели:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сменить модель",
        variant: "destructive",
      });
    } finally {
      setIsChangingModel(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          base64: base64
        });
      } catch (error: any) {
        console.error('Ошибка загрузки файла:', error);
        toast({
          title: "Ошибка",
          description: `Не удалось загрузить файл ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    return uploadedFiles;
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || !chatId) return;

    // Проверяем лимит сообщений
    try {
      const { data: canSend, error } = await supabase.rpc('check_daily_message_limit', {
        user_uuid: user?.id
      });

      if (error) throw error;

      if (!canSend) {
        toast({
          title: "Лимит исчерпан",
          description: `Вы достигли дневного лимита в ${dailyLimit} сообщений. Попробуйте завтра.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Ошибка проверки лимита:', error);
    }

    setLoading(true);

    try {
      let attachmentsData = [];
      
      if (attachedFiles.length > 0) {
        attachmentsData = await uploadFiles(attachedFiles);
      }

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

      // Увеличиваем счетчик сообщений
      try {
        await supabase.rpc('increment_daily_message_count', {
          user_uuid: user?.id
        });
        setMessagesUsed(prev => prev + 1);
      } catch (error) {
        console.error('Ошибка обновления счетчика сообщений:', error);
      }

      const allMessages = [...messages, typedUserMessage];
      const contextMessages = getMessagesForContext(
        allMessages.map(msg => ({ role: msg.role, content: msg.content })),
        dialogSummary
      );

      try {
        await supabase.rpc('update_model_usage', { model_name: selectedModel });
      } catch (error) {
        console.error('Ошибка обновления статистики модели:', error);
      }

      const { data: apiResponse, error: apiError } = await supabase.functions.invoke('vsegpt-chat', {
        body: {
          messages: contextMessages,
          prompt: currentInput,
          model: selectedModel,
          attachments: attachmentsData
        }
      });

      if (apiError) throw apiError;

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

      const newMessageCount = allMessages.length + 1;
      if (shouldSummarize(newMessageCount) && !dialogSummary) {
        const summaryMessages = [...allMessages, typedBotMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        const newSummary = await summarizeDialog(summaryMessages);
        setDialogSummary(newSummary);
        await saveChatSummary(newSummary);
      }

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
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Bot className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Добро пожаловать в чат с AI</h2>
            <p className="text-gray-500 mb-6">Выберите чат или создайте новый для начала общения с искусственным интеллектом</p>
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <p className="text-sm text-gray-600">
                🎯 Поддерживаются изображения, PDF и текстовые файлы<br/>
                🧠 Контекст сохраняется в каждом отдельном диалоге<br/>
                ⚡ Быстрые и точные ответы от современных AI моделей
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ModelSelector 
        selectedModel={selectedModel} 
        onModelChange={handleModelChange}
        disabled={isChangingModel}
      />
      
      {/* Лимит сообщений */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-blue-800">
            📊 Сообщений сегодня: {messagesUsed} / {dailyLimit}
          </div>
          {dialogSummary && (
            <div className="text-sm text-blue-800">
              💭 Контекст: {dialogSummary.substring(0, 50)}...
            </div>
          )}
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto p-6 ${getBackgroundClass(chatBackground)}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-xs lg:max-w-2xl ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                  {message.role === 'user' ? (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {profile?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-600 text-white shadow-md">
                      <span className="text-lg">{getModelIcon(selectedModel)}</span>
                    </div>
                  )}
                </div>
                <div
                  className={`px-6 py-4 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment: any, idx: number) => (
                        <div key={idx} className={`text-sm ${message.role === 'user' ? 'text-blue-100' : 'text-gray-600'} flex items-center`}>
                          <Paperclip className="w-4 h-4 mr-2" />
                          {attachment.name}
                          {attachment.url && (
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 underline hover:no-underline"
                            >
                              открыть
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <FileUpload
              attachedFiles={attachedFiles}
              onFilesChange={setAttachedFiles}
              disabled={loading || isChangingModel}
            />
            
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                className="min-h-[48px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-2xl"
                disabled={loading || isChangingModel}
              />
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={loading || isChangingModel || (!inputValue.trim() && attachedFiles.length === 0) || messagesUsed >= dailyLimit}
              size="icon"
              className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl shadow-lg"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
