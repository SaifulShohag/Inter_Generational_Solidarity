import { useState } from 'react';
import { Bell, CheckCircle, Trophy, MapPin, Clock, Info } from 'lucide-react';
import { notifications as initialNotifications } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const iconMap = {
  mission: { Icon: MapPin, color: 'text-accent bg-accent-light' },
  achievement: { Icon: Trophy, color: 'text-warning bg-warning-light' },
  reminder: { Icon: Clock, color: 'text-purple-500 bg-purple-100' },
  system: { Icon: Info, color: 'text-gray-500 bg-gray-100' },
};

export function Notifications() {
  const [notifs, setNotifs] = useState(initialNotifications);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-gray-500 mt-1">{unread} non lue{unread > 1 ? 's' : ''}</p>}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} icon={<CheckCircle className="w-4 h-4" />}>
            Tout marquer lu
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifs.map(notif => {
          const { Icon, color } = iconMap[notif.type];
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={cn(
                'bg-white rounded-3xl shadow-card p-4 flex items-start gap-4 cursor-pointer hover:shadow-hover transition-all duration-200',
                !notif.read && 'border-l-4 border-accent'
              )}
            >
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('font-semibold text-gray-900 leading-tight', !notif.read && 'text-gray-900')}>{notif.title}</p>
                  {!notif.read && <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-gray-500 text-sm mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1.5">{notif.createdAt}</p>
              </div>
            </div>
          );
        })}

        {notifs.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune notification pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
