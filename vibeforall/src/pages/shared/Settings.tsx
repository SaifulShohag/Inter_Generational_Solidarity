import { useState } from 'react';
import { Bell, Moon, Globe, Type, Contrast, MapPin, Lock, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
        enabled ? 'bg-accent' : 'bg-gray-200'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300',
        enabled && 'translate-x-6'
      )} />
    </button>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  toggle?: { enabled: boolean; onToggle: () => void };
  chevron?: boolean;
  onClick?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, description, toggle, chevron, onClick, danger }: SettingRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-gray-50',
        danger && 'hover:bg-error-light'
      )}
    >
      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', danger ? 'bg-error-light text-error' : 'bg-gray-100 text-gray-600')}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-sm', danger ? 'text-error' : 'text-gray-900')}>{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      {toggle && <Toggle enabled={toggle.enabled} onToggle={toggle.onToggle} label={label} />}
      {chevron && <ChevronRight className="w-4 h-4 text-gray-400" />}
    </div>
  );
}

export function Settings() {
  const { logout, darkMode, toggleDarkMode, largeText, toggleLargeText, highContrast, toggleHighContrast } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [locationPerm, setLocationPerm] = useState(true);
  const [language, setLanguage] = useState('English');

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

      {/* Notifications */}
      <div className="bg-white rounded-3xl shadow-card mb-4 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notifications</h2>
        </div>
        <SettingRow
          icon={<Bell className="w-5 h-5" />}
          label="Notifications push"
          description="Recevoir des alertes pour les nouvelles missions"
          toggle={{ enabled: notifications, onToggle: () => setNotifications(n => !n) }}
        />
      </div>

      {/* Apparence */}
      <div className="bg-white rounded-3xl shadow-card mb-4 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Apparence</h2>
        </div>
        <SettingRow
          icon={<Moon className="w-5 h-5" />}
          label="Mode sombre"
          description="Passer à un thème plus sombre"
          toggle={{ enabled: darkMode, onToggle: toggleDarkMode }}
        />
      </div>

      {/* Accessibilité */}
      <div className="bg-white rounded-3xl shadow-card mb-4 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Accessibilité</h2>
        </div>
        <SettingRow
          icon={<Type className="w-5 h-5" />}
          label="Texte agrandi"
          description="Augmenter la taille des caractères"
          toggle={{ enabled: largeText, onToggle: toggleLargeText }}
        />
        <SettingRow
          icon={<Contrast className="w-5 h-5" />}
          label="Contraste élevé"
          description="Améliorer la visibilité avec un contraste plus fort"
          toggle={{ enabled: highContrast, onToggle: toggleHighContrast }}
        />
      </div>

      {/* Langue */}
      <div className="bg-white rounded-3xl shadow-card mb-4 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Langue & Région</h2>
        </div>
        <div className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Langue</p>
            <p className="text-xs text-gray-400 mt-0.5">Choisissez votre langue préférée</p>
          </div>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="text-sm font-medium text-accent bg-accent-light border-none rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option>Français</option>
            <option>English</option>
            <option>Español</option>
            <option>Deutsch</option>
          </select>
        </div>
        <SettingRow
          icon={<MapPin className="w-5 h-5" />}
          label="Autorisations de localisation"
          description="Autoriser l'accès à votre position"
          toggle={{ enabled: locationPerm, onToggle: () => setLocationPerm(l => !l) }}
        />
      </div>

      {/* Confidentialité */}
      <div className="bg-white rounded-3xl shadow-card mb-4 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confidentialité & Sécurité</h2>
        </div>
        <SettingRow icon={<Shield className="w-5 h-5" />} label="Paramètres de confidentialité" description="Gérer vos données et votre vie privée" chevron onClick={() => {}} />
        <SettingRow icon={<Lock className="w-5 h-5" />} label="Changer le mot de passe" description="Mettre à jour votre mot de passe" chevron onClick={() => {}} />
      </div>

      {/* Déconnexion */}
      <div className="bg-white rounded-3xl shadow-card mb-6 overflow-hidden">
        <SettingRow
          icon={<LogOut className="w-5 h-5" />}
          label="Se déconnecter"
          danger
          onClick={logout}
        />
      </div>

      <p className="text-center text-xs text-gray-400">VibeForAll v1.0.0 · Fait avec ❤️</p>
    </div>
  );
}
