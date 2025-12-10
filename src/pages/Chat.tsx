import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { AgriBuddy } from '@/components/AgriBuddy';

interface ChatRoom {
  id: string;
  farmer_id: string;
  buyer_id: string;
  crop_id: string | null;
  updated_at: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const cropId = searchParams.get('crop');
  const farmerId = searchParams.get('farmer');
  
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (user && cropId && farmerId) {
      findOrCreateChat(farmerId, cropId);
    }
  }, [user, cropId, farmerId]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${activeChat}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChat}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`buyer_id.eq.${user?.uid},farmer_id.eq.${user?.uid}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error: any) {
      console.error('Fetch chats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const findOrCreateChat = async (farmerId: string, cropId: string) => {
    if (!user) return;
    
    try {
      // Check if chat exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .eq('buyer_id', user.uid)
        .eq('farmer_id', farmerId)
        .eq('crop_id', cropId)
        .single();

      if (existingChat) {
        setActiveChat(existingChat.id);
        return;
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          buyer_id: user.uid,
          farmer_id: farmerId,
          crop_id: cropId
        })
        .select()
        .single();

      if (error) throw error;
      if (newChat) {
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat.id);
      }
    } catch (error: any) {
      console.error('Create chat error:', error);
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Fetch messages error:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        chat_id: activeChat,
        sender_id: user.uid,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
      
      // Update chat timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChat);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <div className="container py-8 text-center">
          <p>{t('loginRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <div className="container py-4">
        <div className="bg-card rounded-lg shadow-medium overflow-hidden h-[calc(100vh-8rem)]">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Chat list */}
            <div className={`border-r ${activeChat ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('messages')}
                </h2>
              </div>
              <ScrollArea className="h-[calc(100%-4rem)]">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('loading')}
                  </div>
                ) : chats.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t('noChats')}
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChat(chat.id)}
                      className={`w-full p-4 text-left hover:bg-muted transition-colors border-b ${
                        activeChat === chat.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white">
                          🌾
                        </div>
                        <div>
                          <p className="font-medium">
                            {chat.farmer_id === user.uid ? t('buyer') : t('farmer')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(chat.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Messages */}
            <div className={`md:col-span-2 flex flex-col ${!activeChat ? 'hidden md:flex' : ''}`}>
              {activeChat ? (
                <>
                  <div className="p-4 border-b flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setActiveChat(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="font-semibold">{t('chat')}</h3>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user.uid ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.sender_id === user.uid
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('typeMessage')}
                        className="flex-1"
                      />
                      <Button type="submit" className="bg-gradient-primary">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('selectChat')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AgriBuddy />
    </div>
  );
}
