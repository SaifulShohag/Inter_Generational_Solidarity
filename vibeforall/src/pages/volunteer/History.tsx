import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useApp } from '../../context/AppContext';
import { apiGetMyAssignments, type AssignedMissionApi } from '../../services/api';

const CATEGORY_MAP: Record<string, { icon: string; color: string; label: string }> = {
  grocery:   { icon: '🛒', color: 'bg-green-50 text-green-600',  label: 'Courses' },
  medical:   { icon: '🏥', color: 'bg-red-50 text-red-600',     label: 'Médical' },
  transport: { icon: '🚗', color: 'bg-blue-50 text-blue-600',   label: 'Transport' },
  cleaning:  { icon: '🏠', color: 'bg-amber-50 text-amber-600', label: 'Domicile' },
  other:     { icon: '💬', color: 'bg-purple-50 text-purple-600', label: 'Autre' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function History() {
  const { token } = useApp();
  const [missions, setMissions] = useState<AssignedMissionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetMyAssignments(token)
      .then(setMissions)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = missions.filter(m =>
    !search ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.requester_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = missions.filter(m => m.status === 'completed').length;

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historique des missions</h1>
        <p className="text-gray-500 mt-1">{missions.length} mission{missions.length !== 1 ? 's' : ''} assignée{missions.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary banner */}
      {!loading && missions.length > 0 && (
        <div className="bg-gradient-to-r from-accent to-blue-600 rounded-3xl p-5 text-white mb-6 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Impact total</p>
            <p className="text-3xl font-bold">{completedCount} mission{completedCount !== 1 ? 's' : ''}</p>
            <p className="text-white/80 text-sm mt-1">terminée{completedCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-6xl opacity-30">🏆</div>
        </div>
      )}

      <div className="mb-5">
        <Input
          placeholder="Rechercher par mission ou personne..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
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
        filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(mission => {
              const cat = CATEGORY_MAP[mission.category] ?? CATEGORY_MAP.other;
              const isCompleted = mission.status === 'completed';
              const displayDate = mission.completed_at ?? mission.accepted_at;
              return (
                <div key={mission.id} className="bg-white rounded-3xl shadow-card p-5 hover:shadow-hover transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 leading-tight">{mission.title}</h3>
                        <Badge variant={isCompleted ? 'success' : 'info'} size="sm">
                          <CheckCircle2 className="w-3 h-3" />
                          {isCompleted ? 'Terminée' : 'En cours'}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{mission.description}</p>

                      <div className="flex items-center gap-2 mb-3">
                        <Avatar name={mission.requester_name ?? 'Anonyme'} size="xs" />
                        <span className="text-sm text-gray-600 font-medium">{mission.requester_name ?? 'Anonyme'}</span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(displayDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {mission.location_text.split(',')[0]}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {cat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title={search ? 'Aucun résultat' : 'Aucune mission'}
            description={search ? 'Essayez un autre terme de recherche' : 'Vos missions acceptées apparaîtront ici'}
          />
        )
      )}
    </div>
  );
}
