import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MissionCard } from '../../components/volunteer/MissionCard';
import { Input } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { apiGetMissions, apiAcceptMission, type HelpRequestApi } from '../../services/api';
import type { Mission, MissionCategory, MissionUrgency } from '../../types';

// Map backend categories to frontend display categories
const CATEGORY_MAP: Record<string, MissionCategory> = {
  grocery:   'shopping',
  medical:   'medical',
  transport: 'transport',
  cleaning:  'home',
  other:     'social',
};

const categories: Array<{ value: MissionCategory | 'all'; label: string; icon: string }> = [
  { value: 'all',     label: 'Tout',      icon: '🌟' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'shopping',  label: 'Courses',   icon: '🛒' },
  { value: 'medical',   label: 'Médical',   icon: '🏥' },
  { value: 'home',      label: 'Domicile',  icon: '🏠' },
  { value: 'social',    label: 'Autre',     icon: '💬' },
];

type MissionTypeFilter = 'all' | 'immediate' | 'scheduled';

const missionTypeFilters: Array<{ value: MissionTypeFilter; label: string; icon: string; description: string }> = [
  { value: 'all',       label: 'Toutes',           icon: '📋', description: 'Toutes les missions' },
  { value: 'immediate', label: 'Tâches actuelles',  icon: '⚡', description: "Besoin d'aide maintenant" },
  { value: 'scheduled', label: 'Tâches planifiées', icon: '📅', description: 'Prévues à une date précise' },
];

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
  if (h > 0) return `Il y a ${h}h`;
  return "À l'instant";
}

function toUrgency(scheduledAt: string): MissionUrgency {
  const hoursUntil = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000;
  if (hoursUntil < 4)  return 'critical';
  if (hoursUntil < 24) return 'high';
  if (hoursUntil < 72) return 'medium';
  return 'low';
}

function toMissionType(scheduledAt: string): 'immediate' | 'scheduled' {
  const hoursUntil = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000;
  return hoursUntil < 24 ? 'immediate' : 'scheduled';
}

function apiToMission(req: HelpRequestApi): Mission {
  return {
    id:                String(req.id),
    title:             req.title,
    description:       req.description,
    category:          CATEGORY_MAP[req.category] ?? 'social',
    location:          req.location_text,
    distance:          'Proche',
    publishedAt:       toRelativeTime(req.created_at),
    estimatedDuration: '~1h',
    urgency:           toUrgency(req.scheduled_at),
    requiredSkills:    [],
    elderlyName:       req.requester_name ?? 'Anonyme',
    status:            req.status as Mission['status'],
    missionType:       toMissionType(req.scheduled_at),
  };
}

export function Missions() {
  const navigate = useNavigate();
  const { token } = useApp();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MissionCategory | 'all'>('all');
  const [missionTypeFilter, setMissionTypeFilter] = useState<MissionTypeFilter>('all');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetMissions(token)
      .then(data => setMissions(data.map(apiToMission)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (id: string) => {
    if (!token) return;
    try {
      await apiAcceptMission(token, Number(id));
      setMissions(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'acceptation');
    }
  };

  const handleDecline = (id: string) => setMissions(prev => prev.filter(m => m.id !== id));

  const filtered = missions.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'all' && m.category !== category) return false;
    if (missionTypeFilter !== 'all' && m.missionType !== missionTypeFilter) return false;
    return true;
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Missions disponibles</h1>
        <p className="text-gray-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> Paris, France
        </p>
      </div>

      <div className="mb-5">
        <Input placeholder="Rechercher une mission..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
      </div>

      {/* Type filter */}
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
                missionTypeFilter === f.value ? 'bg-accent text-white border-accent shadow-sm' : 'bg-white text-gray-600 border-gray-100 shadow-card hover:border-accent/30'
              }`}
            >
              <span className="text-xl">{f.icon}</span>
              <span className="font-semibold text-xs leading-tight text-center">{f.label}</span>
              <span className={`text-xs leading-tight text-center ${missionTypeFilter === f.value ? 'text-white/80' : 'text-gray-400'}`}>{f.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value as MissionCategory | 'all')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
              category === cat.value ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 shadow-card hover:shadow-hover'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-gray-500 font-medium mb-4">
            {filtered.length} mission{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
          </p>
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filtered.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onClick={m => navigate(`/volunteer/missions/${m.id}`)}
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
        </>
      )}
    </div>
  );
}
