import { useState } from 'react';
import { ArrowLeft, Mic, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiStartConversation, apiSendMessage, streamResponse } from '../../services/api';
import { cn } from '../../utils/cn';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

const SAMPLE_TRANSCRIPTS = [
  "J'ai besoin d'aide pour faire mes courses au marché...",
  "Je voudrais qu'on m'accompagne chez le médecin demain...",
  "Pourriez-vous m'aider avec mon téléphone s'il vous plaît ?",
  "J'ai besoin d'aide pour remplir un formulaire administratif...",
];

const MOCK_RESPONSES = [
  "Bien sûr ! Je vais trouver un volontaire pour vous accompagner faire vos courses. À quelle heure préférez-vous ?",
  "Je comprends. Je cherche un volontaire disponible pour vous accompagner chez le médecin. Quel est votre rendez-vous ?",
  "Pas de problème ! Un de nos volontaires spécialisé en technologie va vous appeler très bientôt.",
  "Je vais vous trouver quelqu'un pour vous aider avec ce formulaire. Avez-vous les documents prêts ?",
];

function WaveBar({ delay }: { delay: string }) {
  return (
    <div className="w-1.5 bg-accent rounded-full animate-wave" style={{ animationDelay: delay, height: '40px' }} />
  );
}

export function Voice() {
  const navigate = useNavigate();
  const { token, sessionId, setSessionId } = useApp();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [sampleIdx, setSampleIdx] = useState(0);

  const getOrCreateSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    const id = await apiStartConversation(token!);
    setSessionId(id);
    return id;
  };

  const startListening = async () => {
    setVoiceState('listening');
    setTranscript('');
    setAiResponse('');

    // Simulate speech capture by animating through a sample transcript
    const sample = SAMPLE_TRANSCRIPTS[sampleIdx % SAMPLE_TRANSCRIPTS.length];
    for (let i = 0; i <= sample.length; i += 3) {
      await new Promise(r => setTimeout(r, 80));
      setTranscript(sample.slice(0, i));
    }
    setTranscript(sample);
    setSampleIdx(i => i + 1);

    setVoiceState('processing');

    try {
      let reply = '';

      if (token) {
        // Real API: send the captured transcript to the agent
        const sid = await getOrCreateSession();
        const reader = await apiSendMessage(token, sid, sample);

        setVoiceState('speaking');
        for await (const chunk of streamResponse(reader)) {
          reply += chunk;
          setAiResponse(reply);
        }
      } else {
        // Demo: use a mock response
        await new Promise(r => setTimeout(r, 1200));
        reply = MOCK_RESPONSES[sampleIdx % MOCK_RESPONSES.length];
        setVoiceState('speaking');
        setAiResponse(reply);
      }

      // Browser TTS to speak the response aloud
      if (reply && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(reply);
        utt.lang = 'fr-FR';
        utt.rate = 0.95;
        window.speechSynthesis.speak(utt);
      }
    } catch {
      setVoiceState('speaking');
      setAiResponse("Désolé, une erreur est survenue. Veuillez réessayer.");
    }
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
  };

  const stateConfig = {
    idle: {
      bg: 'bg-gray-100', icon: 'text-gray-400', ring: '',
      label: 'Appuyez pour parler',
      sublabel: 'Appuyez sur le bouton et commencez à parler',
    },
    listening: {
      bg: 'bg-error-light', icon: 'text-error', ring: 'ring-4 ring-error/30 ring-offset-4',
      label: "J'écoute...",
      sublabel: 'Parlez maintenant, je vous écoute',
    },
    processing: {
      bg: 'bg-warning-light', icon: 'text-warning', ring: 'ring-4 ring-warning/30 ring-offset-4',
      label: 'Traitement...',
      sublabel: 'Compréhension de votre demande',
    },
    speaking: {
      bg: 'bg-accent-light', icon: 'text-accent', ring: 'ring-4 ring-accent/30 ring-offset-4',
      label: "L'IA parle",
      sublabel: 'Appuyez pour arrêter',
    },
  };

  const config = stateConfig[voiceState];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-4 shadow-soft">
        <button onClick={() => navigate('/elderly')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <p className="font-bold text-gray-900">Assistant vocal</p>
          <p className="text-xs text-gray-400">
            {token ? 'Parlez naturellement dans votre langue' : 'Mode démo'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {voiceState === 'listening' && (
          <div className="flex items-center gap-1.5 h-16 animate-fade-in">
            {[0.0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.75, 0.6, 0.45, 0.3, 0.15, 0.0].map((d, i) => (
              <WaveBar key={i} delay={`${d}s`} />
            ))}
          </div>
        )}

        {voiceState === 'processing' && (
          <div className="flex gap-2 animate-fade-in">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 bg-warning rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {voiceState === 'speaking' && (
          <div className="flex items-center gap-2 text-accent animate-fade-in">
            <Volume2 className="w-6 h-6 animate-pulse" />
            <div className="flex items-center gap-1">
              {[0, 0.1, 0.2, 0.3, 0.2, 0.1].map((d, i) => (
                <WaveBar key={i} delay={`${d}s`} />
              ))}
            </div>
          </div>
        )}

        {/* Mic button */}
        <button
          onClick={voiceState === 'idle' ? startListening : stop}
          aria-label={voiceState === 'idle' ? 'Commencer à parler' : 'Arrêter'}
          className={cn(
            'w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300',
            config.bg, config.ring, 'hover:scale-105 active:scale-95',
          )}
        >
          {voiceState === 'idle' || voiceState === 'listening' ? (
            <Mic className={cn('w-16 h-16', config.icon)} />
          ) : voiceState === 'speaking' ? (
            <Volume2 className={cn('w-16 h-16', config.icon)} />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-warning border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>

        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{config.label}</p>
          <p className="text-gray-500 mt-1">{config.sublabel}</p>
        </div>

        {transcript && (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-5 animate-slide-up">
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> VOTRE DEMANDE
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">{transcript}</p>
          </div>
        )}

        {aiResponse && (
          <div className="w-full max-w-md bg-accent-light rounded-3xl p-5 animate-slide-up border border-accent/20">
            <p className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> RÉPONSE DE L'IA
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">{aiResponse}</p>
            <button
              onClick={() => navigate('/elderly')}
              className="mt-4 w-full bg-accent text-white py-3 rounded-2xl font-bold text-base hover:bg-accent-dark transition-colors active:scale-95"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {voiceState === 'idle' && !transcript && (
          <div className="w-full max-w-md space-y-3">
            <p className="text-center text-gray-400 text-sm font-medium">Essayez de dire :</p>
            {SAMPLE_TRANSCRIPTS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card px-4 py-3 text-gray-600 text-sm">
                "{t}"
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
