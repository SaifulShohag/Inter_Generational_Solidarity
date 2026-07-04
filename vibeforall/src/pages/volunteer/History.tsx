import { useState } from 'react';
import { Search, Calendar, MapPin, Clock, Star, CheckCircle2 } from 'lucide-react';
import { completedMissions } from '../../data/mockData';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

const categoryConfig: Record<string, { icon: string; color: string }> = {
  transport: { icon: '🚗', color: 'bg-blue-50 text-blue-600' },
  shopping: { icon: '🛒', color: 'bg-green-50 text-green-600' },
  medical: { icon: '🏥', color: 'bg-red-50 text-red-600' },
  social: { icon: '💬', color: 'bg-purple-50 text-purple-600' },
  technology: { icon: '💻', color: 'bg-indigo-50 text-indigo-600' },
  home: { icon: '🏠', color: 'bg-amber-50 text-amber-600' },
  administrative: { icon: '📋', color: 'bg-teal-50 text-teal-600' },
};

export function History() {
  const [search, setSearch] = useState('');

  const filtered = completedMissions.filter(m =>
    !search ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.elderlyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historique des missions</h1>
        <p className="text-gray-500 mt-1">{completedMissions.length} missions réalisées</p>
      </div>

      {/* Résumé */}
      <div className="bg-gradient-to-r from-accent to-blue-600 rounded-3xl p-5 text-white mb-6 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">Impact total</p>
          <p className="text-3xl font-bold">{completedMissions.length} missions</p>
          <p className="text-white/80 text-sm mt-1">
            ⭐ {(completedMissions.reduce((s, m) => s + (m.rating || 0), 0) / completedMissions.length).toFixed(1)} note moyenne
          </p>
        </div>
        <div className="text-6xl opacity-30">🏆</div>
      </div>

      {/* Recherche */}
      <div className="mb-5">
        <Input
          placeholder="Rechercher par mission ou personne..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(mission => {
            const cat = categoryConfig[mission.category] || categoryConfig.social;
            return (
              <div key={mission.id} className="bg-white rounded-3xl shadow-card p-5 hover:shadow-hover transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 leading-tight">{mission.title}</h3>
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3" /> Terminée
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{mission.description}</p>

                    {/* Person helped */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar src={mission.elderlyAvatar} name={mission.elderlyName} size="xs" />
                      <span className="text-sm text-gray-600 font-medium">{mission.elderlyName}</span>
                      {mission.rating && (
                        <div className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: mission.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(mission.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {mission.location.split(',')[0]}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {mission.actualDuration}
                      </div>
                    </div>

                    {/* Review */}
                    {mission.review && (
                      <div className="mt-3 bg-warm-50 rounded-2xl p-3">
                        <p className="text-sm text-gray-600 italic">"{mission.review}"</p>
                        <p className="text-xs text-gray-400 mt-1">— {mission.elderlyName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="Aucun résultat"
          description="Essayez un autre terme de recherche"
        />
      )}
    </div>
  );
}
