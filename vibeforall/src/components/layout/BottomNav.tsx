import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, History, BarChart3, User } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BottomNavProps {
  role: 'volunteer' | 'elderly';
}

const volunteerItems = [
  { to: '/volunteer', icon: LayoutDashboard, label: 'Accueil', end: true },
  { to: '/volunteer/missions', icon: MapPin, label: 'Missions' },
  { to: '/volunteer/history', icon: History, label: 'Historique' },
  { to: '/volunteer/statistics', icon: BarChart3, label: 'Stats' },
  { to: '/volunteer/profile', icon: User, label: 'Profil' },
];

const elderlyItems = [
  { to: '/elderly', icon: LayoutDashboard, label: 'Accueil', end: true },
  { to: '/elderly/history', icon: History, label: 'Historique' },
  { to: '/elderly/profile', icon: User, label: 'Profil' },
];

export function BottomNav({ role }: BottomNavProps) {
  const items = role === 'volunteer' ? volunteerItems : elderlyItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-inset-bottom" aria-label="Mobile navigation">
      <div className="flex">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 px-1 transition-all duration-200',
                isActive ? 'text-accent' : 'text-gray-400 hover:text-gray-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
