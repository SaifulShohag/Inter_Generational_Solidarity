import { useState } from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MissionCard } from '../../components/volunteer/MissionCard';
import { Input } from '../../components/ui/Input';
import { availableMissions } from '../../data/mockData';
import type { MissionCategory, MissionUrgency, Mission } from '../../types';

const categories: Array<{ value: MissionCategory | 'all'; label: string; icon: string }> = [
  { value: 'all', label: 'Tout', icon: '🌟' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'shopping', label: 'Courses', icon: '🛒' },
  { value: 'medical', label: 'Médical', icon: '🏥' },
  { value: 'social', label: 'Social', icon: '💬' },
  { value: 'technology', label: 'Tech', icon: '💻' },
  { value: 'home', label: 'Domicile', icon: '🏠' },
  { value: 'administrative', label: 'Admin', icon: '📋' },
];

const urgencyFilters: Array<{ value: MissionUrgency | 'all'; label: string }> = [
  { value: 'all', label: 'Toutes urgences' },
  { value: 'critical', label: '🚨 Critique' },
  { value: 'high', label: '🔴 Haute' },
  { value: 'medium', label: '🟡 Moyenne' },
  { value: 'low', label: '🟢 Faible' },
];

type MissionTypeFilter = 'all' | 'immediate' | 'scheduled';

const missionTypeFilters: Array<{ value: MissionTypeFilter; label: string; icon: string; description: string }> = [
  { value: 'all', label: 'Toutes', icon: '📋', description: 'Toutes les missions' },
  { value: 'immediate', label: 'Tâches actuelles', icon: '⚡', description: 'Besoin d\'aide maintenant' },
  { value: 'scheduled', label: 'Tâches planifiées', icon: '📅', description: 'Prévues à une date précise' },
];

export function Missions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MissionCategory | 'all'>('all');
  const [urgency, setUrgency] = useState<MissionUrgency | 'all'>('all');
  const [missionTypeFilter, setMissionTypeFilter] = useState<MissionTypeFilter>('all');
  const [missions, setMissions] = useState(availableMissions);

  const filtered = missions.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'all' && m.category !== category) return false;
    if (urgency !== 'all' && m.urgency !== urgency) return false;
    if (missionTypeFilter !== 'all' && m.missionType !== missionTypeFilter) return false;
    return true;
  });

  const handleDecline = (id: string) => setMissions(m => m.filter(x => x.id !== id));

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Missions disponibles</h1>
        <p className="text-gray-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> Près de Paris, France
        </p>
      </div>

      {/* Recherche */}
      <div className="mb-5">
        <Input
          placeholder="Rechercher une mission..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Filtre par type de tâche */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-600">Type de tâche</span>
        </div>
        <div className="flex gap-3">
          {missionTypeFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setMissionTypeFilter(f.value)}
              className={`flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 border-2 ${
                missionTypeFilter === f.value
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-100 shadow-card hover:border-accent/30'
              }`}
            >
              <span className="text-xl">{f.icon}</span>
              <span className="font-semibold text-xs leading-tight text-center">{f.label}</span>
              <span className={`text-xs leading-tight text-center ${missionTypeFilter === f.value ? 'text-white/80' : 'text-gray-400'}`}>{f.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtre par catégorie */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value as MissionCategory | 'all')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                category === cat.value
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-white text-gray-600 shadow-card hover:shadow-hover'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtre par urgence */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        {urgencyFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setUrgency(f.value as MissionUrgency | 'all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              urgency === f.value
                ? 'bg-accent-light text-accent border border-accent'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Compteur */}
      <p className="text-sm text-gray-500 font-medium mb-4">
        {filtered.length} mission{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
      </p>

      {/* Liste — une mission par ligne */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onAccept={() => {}}
              onDecline={handleDecline}
              onClick={(m: Mission) => navigate(`/volunteer/missions/${m.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Aucune mission trouvée</h3>
          <p className="text-gray-400">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
}
