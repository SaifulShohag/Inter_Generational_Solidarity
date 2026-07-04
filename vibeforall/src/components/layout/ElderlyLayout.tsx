import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Heart, History, User, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { BottomNav } from './BottomNav';
import { cn } from '../../utils/cn';

export function ElderlyLayout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Simple top bar for elderly */}
      <header className="bg-white shadow-soft px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/elderly')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-brand flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-xl leading-tight">VibeForAll</h1>
            <p className="text-xs text-gray-400">Votre communauté de soutien</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
          {[
            { to: '/elderly', icon: Heart, label: 'Accueil', end: true },
            { to: '/elderly/history', icon: History, label: 'Mes aides' },
            { to: '/elderly/profile', icon: User, label: 'Profil' },
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-base transition-all duration-200',
                isActive ? 'bg-accent-light text-accent' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/elderly/profile')} aria-label="Profil" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar src={user?.avatar} name={user?.name || 'U'} size="md" />
          </button>
          <button onClick={logout} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl text-gray-500 hover:bg-error-light hover:text-error transition-all duration-200" aria-label="Se déconnecter">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="pb-24 md:pb-8" role="main">
        <Outlet />
      </main>

      <BottomNav role="elderly" />
    </div>
  );
}
