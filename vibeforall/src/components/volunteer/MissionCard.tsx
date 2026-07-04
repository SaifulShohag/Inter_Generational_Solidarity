import { useState } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react';
import type { Mission } from '../../types';
import { Badge, UrgencyBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';

const categoryConfig: Record<string, { icon: string; color: string; label: string }> = {
  transport: { icon: '🚗', color: 'bg-blue-50 text-blue-600', label: 'Transport' },
  shopping: { icon: '🛒', color: 'bg-green-50 text-green-600', label: 'Courses' },
  medical: { icon: '🏥', color: 'bg-red-50 text-red-600', label: 'Médical' },
  social: { icon: '💬', color: 'bg-purple-50 text-purple-600', label: 'Social' },
  technology: { icon: '💻', color: 'bg-indigo-50 text-indigo-600', label: 'Technologie' },
  home: { icon: '🏠', color: 'bg-amber-50 text-amber-600', label: 'Domicile' },
  administrative: { icon: '📋', color: 'bg-teal-50 text-teal-600', label: 'Admin' },
};

interface MissionCardProps {
  mission: Mission;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onClick?: (mission: Mission) => void;
  compact?: boolean;
}

export function MissionCard({ mission, onAccept, onDecline, onClick, compact }: MissionCardProps) {
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  const cat = categoryConfig[mission.category] || categoryConfig.social;

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAccepted(true);
    onAccept?.(mission.id);
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeclined(true);
    onDecline?.(mission.id);
  };

  if (declined) return null;

  return (
    <div
      onClick={() => onClick?.(mission)}
      className={cn(
        'bg-white rounded-3xl shadow-card transition-all duration-200 overflow-hidden group',
        onClick && 'cursor-pointer hover:shadow-hover hover:-translate-y-0.5',
      )}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0', cat.color)}>
              {cat.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{mission.title}</h3>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cat.color)}>{cat.label}</span>
            </div>
          </div>
          <UrgencyBadge urgency={mission.urgency} />
        </div>

        {!compact && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{mission.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate max-w-[150px]">{mission.location.split(',')[0]}</span>
            <Badge variant="info" size="sm">{mission.distance}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{mission.estimatedDuration}</span>
          </div>
        </div>
      </div>

      {/* Elderly info */}
      <div className="mx-5 mb-3 p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
        <Avatar src={mission.elderlyAvatar} name={mission.elderlyName} size="sm" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{mission.elderlyName}</p>
          <p className="text-xs text-gray-500">{mission.elderlyAge ? `${mission.elderlyAge} ans • ` : ''}{mission.publishedAt}</p>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-accent transition-colors" />
        )}
      </div>

      {/* Actions */}
      {(onAccept || onDecline) && !accepted && (
        <div className="px-5 pb-5 flex gap-3">
          <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />} onClick={handleDecline} fullWidth>
            Décliner
          </Button>
          <Button variant="primary" size="sm" icon={<CheckCircle className="w-4 h-4" />} onClick={handleAccept} fullWidth>
            Accepter
          </Button>
        </div>
      )}

      {accepted && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 justify-center p-3 bg-success-light rounded-2xl">
            <Zap className="w-4 h-4 text-success" />
            <span className="text-success font-semibold text-sm">Mission acceptée ! 🎉</span>
          </div>
        </div>
      )}
    </div>
  );
}
