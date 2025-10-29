import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export function AgriBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [input, setInput] = useState('');
  const { t } = useLanguage();

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, isUser: true }]);
    
    // Simulate AgriBuddy responses
    setTimeout(() => {
      const responses = [
        t('helpMessages.greeting'),
        t('helpMessages.listCrops'),
        t('helpMessages.buyCrops'),
        t('helpMessages.pricing'),
        t('helpMessages.directContact')
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    }, 1000);

    setInput('');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-primary shadow-medium hover:scale-110 transition-transform z-50"
        size="icon"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-medium z-50">
      <div className="bg-gradient-primary p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <h3 className="text-lg font-semibold text-primary-foreground">{t('agriBuddy')}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground hover:bg-primary-light"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-warm">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <span className="text-4xl block mb-2">🌾</span>
            <p>{t('askQuestion')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground shadow-soft'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={t('typeMessage')}
          className="flex-1"
        />
        <Button onClick={sendMessage} size="icon" className="bg-gradient-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}