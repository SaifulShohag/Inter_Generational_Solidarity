import { useNavigate } from 'react-router-dom';
import { Bell, Search, Heart } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useApp } from '../../context/AppContext';
import { notifications } from '../../data/mockData';

const unreadCount = notifications.filter(n => !n.read).length;

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user } = useApp();
  const navigate = useNavigate();

  return (
    <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-base">{title || 'VibeForAll'}</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Rechercher">
          <Search className="w-5 h-5" />
        </button>
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" aria-label={`Notifications (${unreadCount} non lue(s))`} onClick={() => navigate('/volunteer/notifications')}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/volunteer/profile')} aria-label="Profil">
          <Avatar src={user?.avatar} name={user?.name || 'U'} size="sm" />
        </button>
      </div>
    </header>
  );
}
