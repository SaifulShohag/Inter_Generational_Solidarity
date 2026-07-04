import { useState } from 'react';
import { Calendar, MapPin, Clock, Heart, CheckCircle2, Send } from 'lucide-react';
import { helpHistory } from '../../data/mockData';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const statusConfig = {
  pending: { label: 'En attente', variant: 'warning' as const, icon: '⏳' },
  matched: { label: 'Associée', variant: 'info' as const, icon: '🤝' },
  completed: { label: 'Terminée', variant: 'success' as const, icon: '✅' },
};

export function HelpHistory() {
  const [history, setHistory] = useState(helpHistory);

  const sendThanks = (id: string) => {
    setHistory(h => h.map(item => item.id === id ? { ...item, thankYouSent: true } : item));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon historique d'aide</h1>
        <p className="text-gray-500 mt-1">{history.filter(h => h.status === 'completed').length} fois aidée</p>
      </div>

      {/* Thank-you banner */}
      <div className="bg-gradient-to-r from-pink-400 to-red-400 rounded-3xl p-6 text-white mb-6 flex items-center gap-4">
        <span className="text-5xl">💖</span>
        <div>
          <p className="font-bold text-xl">Vos bénévoles sont formidables !</p>
          <p className="text-white/80 text-sm mt-0.5">N'oubliez pas d'envoyer un remerciement</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {history.map(item => {
          const status = statusConfig[item.status];
          return (
            <div key={item.id} className="bg-white rounded-3xl shadow-card overflow-hidden hover:shadow-hover transition-all duration-200">
              {/* Status bar */}
              <div className={cn(
                'h-1.5',
                item.status === 'completed' ? 'bg-success' : item.status === 'matched' ? 'bg-accent' : 'bg-warning'
              )} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{item.description}</p>
                  </div>
                  <Badge variant={status.variant} size="sm">
                    {status.icon} {status.label}
                  </Badge>
                </div>

                {/* Volunteer info */}
                {item.volunteerName && (
                  <div className="flex items-center gap-3 bg-warm-50 rounded-2xl p-3 mb-4">
                    <Avatar src={item.volunteerAvatar} name={item.volunteerName} size="md" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Votre bénévole</p>
                      <p className="font-bold text-gray-900">{item.volunteerName}</p>
                    </div>
                    {item.status === 'completed' && (
                      <Heart className="w-5 h-5 text-red-400 fill-current ml-auto" />
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {item.location}
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {item.duration}
                    </div>
                  )}
                </div>

                {/* Thank you button */}
                {item.status === 'completed' && item.volunteerName && (
                  <div>
                    {!item.thankYouSent ? (
                      <button
                        onClick={() => sendThanks(item.id)}
                        className="w-full flex items-center justify-center gap-2 bg-pink-50 text-pink-600 border border-pink-200 rounded-2xl py-3 font-bold text-base hover:bg-pink-100 transition-colors active:scale-95"
                        aria-label={`Envoyer un merci à ${item.volunteerName}`}
                      >
                        <Send className="w-4 h-4" />
                        Envoyer un merci à {item.volunteerName}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 bg-success-light text-success rounded-2xl py-3 font-semibold text-base">
                        <CheckCircle2 className="w-5 h-5" />
                        Merci envoyé ! 💖
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {history.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-xl font-bold text-gray-700 mb-2">Aucune demande d'aide pour l'instant</p>
          <p className="text-gray-500">Votre première demande apparaîtra ici</p>
        </div>
      )}
    </div>
  );
}
