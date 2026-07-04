import { useState } from 'react';
import { CheckCircle, Users, Clock, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/ui/Card';
import { MissionCard } from '../../components/volunteer/MissionCard';
import { Button } from '../../components/ui/Button';
import { availableMissions, volunteerStats, UNSPLASH_VOLUNTEER_BANNER } from '../../data/mockData';
import type { Mission } from '../../types';

const levelColors = ['bg-gray-400', 'bg-blue-400', 'bg-purple-500', 'bg-amber-400', 'bg-orange-500', 'bg-red-500'];

export function VolunteerDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [missions, setMissions] = useState(availableMissions.slice(0, 4));

  const handleDecline = (id: string) => setMissions(m => m.filter(x => x.id !== id));

  return (
    <div className="animate-fade-in">
      {/* Bannière */}
      <div className="relative overflow-hidden" style={{ minHeight: 220 }}>
        <img
          src={UNSPLASH_VOLUNTEER_BANNER}
          alt="Bénévoles aidant des personnes âgées"
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-300 font-medium text-sm">Champion de la communauté</span>
          </div>
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight">
            Merci de rendre la journée<br />de quelqu'un plus belle ❤️
          </h1>
          <p className="text-white/80 mt-1 text-sm">Bienvenue, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Statistiques */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Votre impact</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Missions réalisées"
              value={volunteerStats.totalMissions}
              icon={<CheckCircle className="w-6 h-6" />}
              color="bg-accent-light text-accent"
              trend="+3 cette semaine"
              trendUp
            />
            <StatCard
              label="Personnes aidées"
              value={volunteerStats.peopleHelped}
              icon={<Users className="w-6 h-6" />}
              color="bg-success-light text-success"
              trend="+2 ce mois"
              trendUp
            />
            <StatCard
              label="Heures bénévoles"
              value={`${volunteerStats.hoursVolunteered}h`}
              icon={<Clock className="w-6 h-6" />}
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              label="Série en cours"
              value={`${volunteerStats.currentStreak} jours`}
              icon={<Flame className="w-6 h-6" />}
              color="bg-warning-light text-warning"
              trend="Record personnel !"
              trendUp
            />
          </div>
        </div>

        {/* Niveau */}
        <div className="bg-gradient-to-r from-accent to-blue-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${levelColors[volunteerStats.level] || 'bg-accent'} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                {volunteerStats.level}
              </div>
              <div>
                <p className="text-white/70 text-sm">Niveau actuel</p>
                <p className="font-bold text-lg">{volunteerStats.levelName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Prochain niveau à</p>
              <p className="font-bold text-lg">{volunteerStats.nextLevelAt} missions</p>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div className="bg-white h-2.5 rounded-full transition-all duration-700" style={{ width: `${volunteerStats.currentLevelProgress}%` }} />
          </div>
          <p className="text-white/70 text-sm mt-2">
            {volunteerStats.nextLevelAt - volunteerStats.totalMissions} missions avant le prochain niveau
          </p>
        </div>

        {/* Missions disponibles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Missions disponibles</h2>
              <p className="text-gray-500 text-sm mt-0.5">{missions.length} missions près de vous</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/volunteer/missions')}>
              Voir tout <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            {missions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onAccept={() => {}}
                onDecline={handleDecline}
                onClick={(m: Mission) => navigate(`/volunteer/missions/${m.id}`)}
              />
            ))}
          </div>
          {missions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 font-medium">Tout est à jour ! Revenez bientôt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
