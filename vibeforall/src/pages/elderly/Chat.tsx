import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Mic, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatMessages as initialMessages } from '../../data/mockData';
import type { ChatMessage } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { cn } from '../../utils/cn';

const AI_RESPONSES = [
  'Je comprends ! Je vais trouver un volontaire disponible pour vous aider. Pouvez-vous me donner plus de détails ?',
  'Bien sûr, je m\'en occupe tout de suite ! Un volontaire sera contacté rapidement.',
  'Merci pour ces informations. La demande est en cours de traitement. Vous recevrez une confirmation bientôt.',
  'Je suis désolé d\'entendre ça. Ne vous inquiétez pas, je vais trouver quelqu\'un pour vous aider rapidement.',
  'Parfait ! Votre demande a été créée. Un de nos volontaires vous contactera très bientôt. 🤝',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 bg-accent rounded-2xl flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white rounded-3xl rounded-bl-lg px-5 py-4 shadow-card">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);

    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setTyping(false);
    setMessages(m => [...m, aiMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-4 shadow-soft flex-shrink-0">
        <button onClick={() => navigate('/elderly')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Assistant IA</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <p className="text-xs text-success font-medium">Toujours disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'flex items-end gap-3 animate-slide-up',
              message.role === 'user' && 'flex-row-reverse'
            )}
          >
            {message.role === 'assistant' ? (
              <div className="w-8 h-8 bg-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600">
                M
              </div>
            )}
            <div className={cn(
              'max-w-[75%] rounded-3xl px-5 py-3.5 shadow-soft',
              message.role === 'assistant'
                ? 'bg-white text-gray-800 rounded-bl-lg'
                : 'bg-accent text-white rounded-br-lg'
            )}>
              <p className="text-base leading-relaxed">{message.content}</p>
              <p className={cn('text-xs mt-1.5', message.role === 'assistant' ? 'text-gray-400' : 'text-white/60')}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}

        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/elderly/voice')}
            className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-accent hover:text-white transition-all duration-200 flex-shrink-0"
            aria-label="Passer à la voix"
          >
            <Mic className="w-5 h-5" />
          </button>
          <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 flex items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              rows={1}
              aria-label="Saisir un message"
              className="flex-1 bg-transparent px-4 py-3 text-base text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-32 min-h-[48px]"
              style={{ height: 'auto' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white hover:bg-accent-dark transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            aria-label="Envoyer le message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
