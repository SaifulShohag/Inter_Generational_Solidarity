import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiLogin, apiRegister } from '../../services/api';
import type { UserRole } from '../../types';

export function Login() {
  const [params] = useSearchParams();
  const role = (params.get('role') || 'volunteer') as UserRole;
  const navigate = useNavigate();
  const { loginWithApi } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isVolunteer = role === 'volunteer';
  const accentClass = isVolunteer ? 'text-accent' : 'text-success';
  const bgClass = isVolunteer ? 'bg-accent-light' : 'bg-success-light';
  const emoji = isVolunteer ? '🤝' : '👴';
  const destination = role === 'volunteer' ? '/volunteer' : '/elderly';
  const apiRole = role === 'elderly' ? 'requester' : 'volunteer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await apiLogin(email, password)
        : await apiRegister(name, email, password, apiRole);
      loginWithApi(result.token, result.user);
      navigate(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-warm-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        {/* Retour */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${bgClass} rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4`}>
            {emoji}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
          </h1>
          <p className="text-gray-500">
            {mode === 'login' ? 'Connexion' : 'Inscription'} en tant que{' '}
            <span className={`font-semibold ${accentClass}`}>
              {isVolunteer ? 'Bénévole' : 'Senior'}
            </span>
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-3xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <Input
                label="Nom complet"
                type="text"
                placeholder="Votre nom"
                value={name}
                onChange={e => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
                autoComplete="name"
              />
            )}

            <Input
              label="Adresse e-mail"
              type="email"
              placeholder="vous@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
              {mode === 'register' && (
                <p className="text-xs text-gray-400">Minimum 8 caractères</p>
              )}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-11 pr-11 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 text-base hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className={`font-semibold ${accentClass} hover:underline`}
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-5 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Sécurisé & Privé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3" />
            <span>100% Gratuit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
