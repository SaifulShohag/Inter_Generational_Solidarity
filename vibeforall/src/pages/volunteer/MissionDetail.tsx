import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Star, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { availableMissions } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { UrgencyBadge } from '../../components/ui/Badge';
import { useState } from 'react';

const categoryConfig: Record<string, { icon: string; label: string }> = {
  transport: { icon: '🚗', label: 'Transport' },
  shopping: { icon: '🛒', label: 'Courses' },
  medical: { icon: '🏥', label: 'Médical' },
  social: { icon: '💬', label: 'Social' },
  technology: { icon: '💻', label: 'Technologie' },
  home: { icon: '🏠', label: 'Domicile' },
  administrative: { icon: '📋', label: 'Administratif' },
};

export function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mission = availableMissions.find(m => m.id === id);
  const [accepted, setAccepted] = useState(false);

  if (!mission) {
    return (
      <div className="p-6 text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Mission introuvable</h2>
        <Button onClick={() => navigate('/volunteer/missions')}>Retour aux missions</Button>
      </div>
    );
  }

  const cat = categoryConfig[mission.category] || categoryConfig.social;

  return (
    <div className="animate-fade-in">
      {/* Image principale */}
      <div className="relative">
        <img
          src={mission.image || `https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=300&fit=crop`}
          alt={mission.title}
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-md hover:bg-white transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="absolute bottom-4 left-6">
          <UrgencyBadge urgency={mission.urgency} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Titre */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{cat.label}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{mission.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Publié {mission.publishedAt}</p>
        </div>

        {/* Personne */}
        <div className="bg-warm-50 rounded-3xl p-5 flex items-center gap-4">
          <Avatar src={mission.elderlyAvatar} name={mission.elderlyName} size="lg" />
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium mb-0.5">Demande d'aide</p>
            <p className="font-bold text-gray-900 text-lg">{mission.elderlyName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{mission.elderlyAge} ans</span>
            </div>
          </div>
          {mission.contactInfo && (
            <button className="w-10 h-10 bg-white rounded-2xl shadow-card flex items-center justify-center hover:bg-accent hover:text-white transition-colors" aria-label="Appeler">
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <h2 className="font-bold text-gray-900 mb-2">Description de la mission</h2>
          <p className="text-gray-600 leading-relaxed">{mission.description}</p>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-accent mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-semibold text-gray-500">Lieu</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{mission.location}</p>
            <p className="text-xs text-accent mt-0.5">à {mission.distance}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold text-gray-500">Durée</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{mission.estimatedDuration}</p>
            <p className="text-xs text-gray-400 mt-0.5">Estimée</p>
          </div>
        </div>

        {/* Carte */}
        <div className="rounded-3xl overflow-hidden bg-gray-100 h-40 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50" />
          <div className="relative flex flex-col items-center gap-2 text-gray-500">
            <MapPin className="w-8 h-8 text-accent" />
            <p className="text-sm font-medium">{mission.location}</p>
            <p className="text-xs text-gray-400">Carte</p>
          </div>
        </div>

        {/* Compétences requises */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Compétences requises</h2>
          <div className="flex flex-wrap gap-2">
            {mission.requiredSkills.map(skill => (
              <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-light text-accent rounded-full text-sm font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Avertissement */}
        <div className="bg-warning-light rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            En acceptant cette mission, vous vous engagez à vous présenter à l'heure. Si vous ne pouvez pas venir, merci d'annuler au moins 2 heures à l'avance.
          </p>
        </div>

        {/* Boutons */}
        <div className="sticky bottom-6">
          {!accepted ? (
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => navigate(-1)} fullWidth>
                Décliner
              </Button>
              <Button size="lg" onClick={() => setAccepted(true)} fullWidth icon={<CheckCircle className="w-5 h-5" />}>
                Accepter la mission
              </Button>
            </div>
          ) : (
            <div className="bg-success-light rounded-3xl p-5 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-bold text-success text-lg">Mission acceptée !</p>
              <p className="text-gray-600 text-sm mt-1">
                {mission.elderlyName} a été notifié(e). Vous êtes formidable !
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/volunteer/missions')} className="mt-3">
                Retour aux missions
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
