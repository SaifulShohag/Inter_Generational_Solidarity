import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, Send, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiStartConversation, apiSendMessage, streamResponse } from '../../services/api';
import { cn } from '../../utils/cn';

const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const SUGGESTIONS = [
  "J'ai besoin d'aide pour faire mes courses",
  "Je voudrais qu'on m'accompagne chez le médecin",
  "Pourriez-vous m'aider avec mon téléphone ?",
  "J'ai besoin d'aide pour un formulaire administratif",
];

function WaveBar({ delay }: { delay: string }) {
  return <div className="w-1.5 bg-accent rounded-full animate-wave" style={{ animationDelay: delay, height: '32px' }} />;
}

export function Voice() {
  const navigate = useNavigate();
  const { token, sessionId, setSessionId } = useApp();

  const [text, setText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micError, setMicError] = useState('');

  const recognitionRef = useRef<any>(null);
  const stoppedRef = useRef(false);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const getOrCreateSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    const id = await apiStartConversation(token!);
    setSessionId(id);
    return id;
  };

  const speakReply = (reply: string) => {
    if (!reply || !window.speechSynthesis) { setIsSpeaking(false); return; }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    // Chrome silently drops utterances longer than ~200 chars — split into sentences
    const sentences = reply
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) { setIsSpeaking(false); return; }

    let idx = 0;
    const speakNext = () => {
      if (idx >= sentences.length || stoppedRef.current) {
        setIsSpeaking(false);
        return;
      }
      const utt = new SpeechSynthesisUtterance(sentences[idx++]);
      utt.lang = 'fr-FR';
      utt.rate = 0.9;
      utt.onend = speakNext;
      utt.onerror = () => setIsSpeaking(false);
      // resume() prevents Chrome's synthesis queue from hanging after cancel()
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utt);
    };

    // Let cancel() drain before starting
    setTimeout(speakNext, 100);
  };

  const sendToAI = async (message: string) => {
    if (!message.trim()) return;
    stoppedRef.current = false;
    setAiResponse('');
    setIsProcessing(true);

    try {
      const sid = await getOrCreateSession();
      const reader = await apiSendMessage(token!, sid, message.trim());

      let reply = '';
      for await (const chunk of streamResponse(reader)) {
        if (stoppedRef.current) break;
        reply += chunk;
        setAiResponse(reply);
      }

      setIsProcessing(false);
      if (!stoppedRef.current) speakReply(reply);
    } catch {
      setIsProcessing(false);
      const errMsg = "Désolé, une erreur est survenue. Veuillez réessayer.";
      setAiResponse(errMsg);
      speakReply(errMsg);
    }
  };

  const startMic = () => {
    if (!SR) {
      setMicError("Microphone non supporté dans ce navigateur. Utilisez Chrome ou Safari, ou tapez votre message ci-dessous.");
      return;
    }
    setMicError('');
    setTranscript('');
    setAiResponse('');
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;

    let final = '';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setText(final || interim);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError("Accès au microphone refusé. Autorisez-le dans les paramètres de votre navigateur, ou tapez votre message.");
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setMicError(`Erreur microphone (${event.error}). Tapez votre message ci-dessous.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (final.trim()) {
        setTranscript(final.trim());
        setText('');
        sendToAI(final.trim());
      }
    };

    recognition.start();
  };

  const stopMic = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsProcessing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    setTranscript(text.trim());
    sendToAI(text.trim());
    setText('');
  };

  const handleSuggestion = (s: string) => {
    if (isProcessing || isSpeaking) return;
    setTranscript(s);
    setAiResponse('');
    sendToAI(s);
  };

  const isBusy = isProcessing || isSpeaking;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-4 shadow-soft">
        <button onClick={() => navigate('/elderly')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-gray-900">Assistant vocal</p>
          <p className="text-xs text-gray-400">Parlez ou écrivez — la réponse sera lue à voix haute</p>
        </div>
        {isBusy && (
          <button onClick={stopSpeaking} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <Square className="w-3 h-3 fill-current" /> Arrêter
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center p-6 gap-6 overflow-y-auto">

        {/* Mic button */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <button
            onClick={isListening ? stopMic : startMic}
            disabled={isBusy}
            aria-label={isListening ? 'Arrêter le micro' : 'Parler'}
            className={cn(
              'w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-md',
              isListening
                ? 'bg-error-light ring-4 ring-error/30 ring-offset-4 scale-110'
                : 'bg-white hover:bg-accent-light hover:scale-105',
              isBusy && 'opacity-40 cursor-not-allowed hover:scale-100',
            )}
          >
            {SR
              ? <Mic className={cn('w-12 h-12', isListening ? 'text-error' : 'text-gray-400')} />
              : <MicOff className="w-12 h-12 text-gray-300" />
            }
          </button>

          {isListening ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                {[0.0, 0.1, 0.2, 0.3, 0.2, 0.1, 0.0].map((d, i) => (
                  <WaveBar key={i} delay={`${d}s`} />
                ))}
              </div>
              <p className="text-error text-sm font-medium">J'écoute… cliquez pour terminer</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">{SR ? 'Appuyez pour parler' : 'Microphone non disponible'}</p>
          )}
        </div>

        {micError && (
          <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-700 text-sm text-center">
            {micError}
          </div>
        )}

        {/* AI speaking indicator */}
        {isSpeaking && (
          <div className="flex items-center gap-2 text-accent animate-fade-in">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">L'assistant parle…</span>
          </div>
        )}
        {isProcessing && !isSpeaking && (
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-5 animate-slide-up">
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> VOTRE DEMANDE
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* AI response */}
        {aiResponse && (
          <div className="w-full max-w-md bg-accent-light rounded-3xl p-5 animate-slide-up border border-accent/20">
            <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> RÉPONSE
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">{aiResponse}</p>
            {!isBusy && (
              <button
                onClick={() => { setTranscript(''); setAiResponse(''); }}
                className="mt-4 w-full bg-accent text-white py-3 rounded-2xl font-bold text-base hover:bg-accent-dark transition-colors active:scale-95"
              >
                Poser une autre question
              </button>
            )}
          </div>
        )}

        {/* Text input */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="flex gap-2 bg-white rounded-2xl shadow-card p-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ou écrivez votre message ici…"
              disabled={isBusy || isListening}
              className="flex-1 px-3 py-2 rounded-xl text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none disabled:opacity-50 text-base"
            />
            <button
              type="submit"
              disabled={!text.trim() || isBusy || isListening}
              className="p-3 bg-accent text-white rounded-xl hover:bg-accent-dark disabled:opacity-40 transition-colors flex-shrink-0"
              aria-label="Envoyer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Clickable suggestions */}
        {!transcript && !aiResponse && (
          <div className="w-full max-w-md space-y-2">
            <p className="text-center text-gray-400 text-sm font-medium">Essayez de dire ou cliquez :</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                disabled={isBusy}
                className="w-full text-left bg-white rounded-2xl shadow-card px-4 py-3 text-gray-600 text-sm hover:bg-accent-light hover:text-accent-dark transition-colors disabled:opacity-40 active:scale-98"
              >
                "{s}"
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
