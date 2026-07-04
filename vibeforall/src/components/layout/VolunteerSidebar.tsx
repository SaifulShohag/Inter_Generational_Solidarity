import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, History, BarChart3, User, Settings, LogOut, Heart, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { notifications } from '../../data/mockData';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/volunteer', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/volunteer/missions', icon: MapPin, label: 'Missions' },
  { to: '/volunteer/history', icon: History, label: 'Historique' },
  { to: '/volunteer/statistics', icon: BarChart3, label: 'Statistiques' },
  { to: '/volunteer/profile', icon: User, label: 'Mon profil' },
  { to: '/volunteer/settings', icon: Settings, label: 'Paramètres' },
];

const unreadCount = notifications.filter(n => !n.read).length;

export function VolunteerSidebar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">VibeForAll</h1>
            <p className="text-xs text-gray-400 mt-0.5">Espace bénévole</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="Main navigation">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive ? 'text-accent' : 'text-gray-400')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Notifications — label */}
        <NavLink
          to="/volunteer/notifications"
          className={({ isActive }) =>
            cn('flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200',
              isActive ? 'bg-accent-light text-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Bell className={cn('w-5 h-5', isActive ? 'text-accent' : 'text-gray-400')} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/volunteer/profile')}>
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-gray-500 hover:bg-error-light hover:text-error transition-all duration-200 mt-1 font-medium"
          aria-label="Se déconnecter"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
