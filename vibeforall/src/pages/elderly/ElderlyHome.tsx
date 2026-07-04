import { useNavigate } from 'react-router-dom';
import { Mic, MessageCircle, Heart, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UNSPLASH_ELDERLY_BANNER } from '../../data/mockData';

export function ElderlyHome() {
  const { user } = useApp();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="animate-fade-in">
      {/* Bannière */}
      <div className="relative overflow-hidden" style={{ minHeight: 240 }}>
        <img
          src={UNSPLASH_ELDERLY_BANNER}
          alt="Bénévoles aidant des personnes âgées"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-red-400 fill-current" />
            <span className="text-white/90 text-sm font-medium">Votre communauté est là pour vous</span>
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">
            {greeting}, {firstName} ! 👋
          </h1>
        </div>
      </div>

      <div className="p-6 md:p-10 max-w-lg mx-auto space-y-5">

        {/* Titre */}
        <div className="text-center pt-2">
          <h2 className="text-2xl font-bold text-gray-900">Besoin d'aide ?</h2>
          <p className="text-gray-500 mt-1 text-lg">Choisissez comment nous contacter</p>
        </div>

        {/* Bouton Parler avec l'IA */}
        <button
          onClick={() => navigate('/elderly/voice')}
          className="w-full bg-gradient-to-br from-accent to-blue-600 text-white rounded-3xl p-7 text-left hover:shadow-hover transition-all duration-200 active:scale-95 shadow-card"
          aria-label="Parler avec l'IA"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Mic className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">🎤 Parler avec l'IA</p>
              <p className="text-white/80 text-base leading-snug">
                Décrivez votre problème avec votre voix
              </p>
            </div>
          </div>
        </button>

        {/* Bouton Écrire à l'IA */}
        <button
          onClick={() => navigate('/elderly/chat')}
          className="w-full bg-gradient-to-br from-success to-green-600 text-white rounded-3xl p-7 text-left hover:shadow-hover transition-all duration-200 active:scale-95 shadow-card"
          aria-label="Écrire à l'IA"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-bold mb-1">💬 Écrire à l'IA</p>
              <p className="text-white/80 text-base leading-snug">
                Tapez votre demande dans le chat
              </p>
            </div>
          </div>
        </button>

        {/* Comment ça marche */}
        <div className="bg-warm-50 rounded-3xl p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Comment ça marche ?</h3>
          <div className="space-y-4">
            {[
              { step: '1', text: 'Dites-nous ce dont vous avez besoin (voix ou texte)', icon: '🗣️' },
              { step: '2', text: 'Notre IA comprend et trouve un bénévole', icon: '🤖' },
              { step: '3', text: 'Un bénévole vient vous aider', icon: '🤝' },
            ].map(({ step, text, icon }) => (
              <div key={step} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <p className="text-gray-700 font-medium">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historique */}
        <button
          onClick={() => navigate('/elderly/history')}
          className="w-full bg-white rounded-3xl shadow-card p-5 flex items-center gap-4 hover:shadow-hover transition-all duration-200 active:scale-95"
          aria-label="Voir mon historique d'aide"
        >
          <div className="w-12 h-12 bg-success-light rounded-2xl flex items-center justify-center text-success flex-shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-900 text-lg">Mes aides précédentes</p>
            <p className="text-gray-500">Voir l'historique des aides reçues</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

      </div>
    </div>
  );
}
