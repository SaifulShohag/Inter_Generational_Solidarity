import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Users, Sparkles } from 'lucide-react';
import type { UserRole } from '../../types';

export function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    navigate(`/auth/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-warm-100 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-12 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mb-5 shadow-hover">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">VibeForAll</h1>
        <p className="text-gray-500 text-center max-w-xs text-lg leading-relaxed">
          Aider les seniors grâce à une communication accessible et propulsée par l'IA.
        </p>
      </div>

      {/* Cartes */}
      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-5 animate-slide-up">
        {/* Bénévole */}
        <button
          onClick={() => handleRoleSelect('volunteer')}
          className="group relative bg-white rounded-3xl p-8 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden border-2 border-transparent hover:border-accent"
          aria-label="Je suis bénévole"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-blue-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />
          <div className="mb-6 relative">
            <div className="w-20 h-20 rounded-3xl bg-accent-light flex items-center justify-center text-5xl">
              🤝
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Je suis bénévole</h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            Aidez les personnes âgées de votre communauté et faites une vraie différence chaque jour.
          </p>
          <div className="flex items-center gap-2 text-accent font-semibold">
            <span>Commencer</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4 flex gap-3">
            <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-600 font-medium">
              <span className="text-accent font-bold">1 200+</span> bénévoles
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-600 font-medium">
              <span className="text-accent font-bold">4,9★</span> noté
            </div>
          </div>
        </button>

        {/* Senior */}
        <button
          onClick={() => handleRoleSelect('elderly')}
          className="group relative bg-white rounded-3xl p-8 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden border-2 border-transparent hover:border-success"
          aria-label="Je suis une personne âgée"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/10 to-green-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />
          <div className="mb-6 relative">
            <div className="w-20 h-20 rounded-3xl bg-success-light flex items-center justify-center text-5xl">
              👴
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Je suis un senior</h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            Obtenez de l'aide quand vous en avez besoin, de façon simple et naturelle.
          </p>
          <div className="flex items-center gap-2 text-success font-semibold">
            <span>Commencer</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4 flex gap-3">
            <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-600 font-medium">
              <span className="text-success font-bold">Vocal</span> & texte
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-xs text-gray-600 font-medium">
              <span className="text-success font-bold">Toujours</span> disponible
            </div>
          </div>
        </button>
      </div>

      {/* Pied de page */}
      <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-400 animate-fade-in">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Rejoignez 5 000+ membres</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Communication par IA</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" />
          <span>Fait avec soin</span>
        </div>
      </div>
    </div>
  );
}
