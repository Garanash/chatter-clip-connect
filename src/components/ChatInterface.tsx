import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModelSelector } from './ModelSelector';
import { FileUpload } from './FileUpload';
import { summarizeDialog, shouldSummarize, getMessagesForContext } from '@/utils/dialogSummarization';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
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
    scrollToBottom();
  }, [messages]);

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
            <div className="bg-white rounded-lg p-4 shadow-sm border">
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
      
      {dialogSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>💭 Контекст диалога:</strong> {dialogSummary}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
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
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    message.role === 'user' ? 'bg-blue-500 ml-3' : 'bg-gray-600 mr-3'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className={`px-6 py-4 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
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
                className="min-h-[48px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={loading || isChangingModel}
              />
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={loading || isChangingModel || (!inputValue.trim() && attachedFiles.length === 0)}
              size="icon"
              className="h-12 w-12 bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
