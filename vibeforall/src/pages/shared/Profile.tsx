import { useState } from 'react';
import { Camera, MapPin, Phone, Mail, Calendar, Edit3, Save, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Progress } from '../../components/ui/Progress';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const INTERESTS = ['Lecture', 'Cuisine', 'Marche', 'Technologie', 'Jardinage', 'Musique', 'Art', 'Voyage', 'Sport', 'Échecs'];

export function Profile() {
  const { user } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    language: user?.language || '',
    interests: user?.interests || [],
    availability: user?.availability || [],
    emergencyContact: user?.emergencyContact || '',
  });

  const set = (field: string, value: string | string[]) => setForm(f => ({ ...f, [field]: value }));

  const toggleInterest = (interest: string) => {
    set('interests', form.interests.includes(interest)
      ? form.interests.filter(i => i !== interest)
      : [...form.interests, interest]
    );
  };

  const toggleDay = (day: string) => {
    set('availability', form.availability.includes(day)
      ? form.availability.filter(d => d !== day)
      : [...form.availability, day]
    );
  };

  const isVolunteer = user?.role === 'volunteer';

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={() => setEditing(false)}>Annuler</Button>
            <Button size="sm" icon={<Save className="w-4 h-4" />} onClick={() => setEditing(false)}>Enregistrer</Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" icon={<Edit3 className="w-4 h-4" />} onClick={() => setEditing(true)}>Modifier</Button>
        )}
      </div>

      {/* Profile completion */}
      <div className="bg-white rounded-3xl shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Complétion du profil</span>
          <span className="font-bold text-accent">{user?.profileCompletion}%</span>
        </div>
        <Progress value={user?.profileCompletion || 0} color={user?.profileCompletion === 100 ? 'bg-success' : 'bg-accent'} />
        {(user?.profileCompletion || 0) < 100 && (
          <p className="text-xs text-gray-400 mt-2">Complétez votre profil pour obtenir plus de missions</p>
        )}
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name || 'U'} size="xl" />
            {editing && (
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shadow-md hover:bg-accent-dark transition-colors" aria-label="Changer la photo">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm capitalize">{user?.role === 'volunteer' ? 'Bénévole' : 'Senior'}</p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Membre depuis {new Date(user?.joinedAt || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-3xl shadow-card p-6 mb-6 space-y-5">
        <h3 className="font-bold text-gray-900 text-lg">Informations personnelles</h3>
        {editing ? (
          <>
            <Input label="Nom complet" value={form.name} onChange={e => set('name', e.target.value)} />
            <Textarea label="Bio" value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Parlez-nous de vous..." />
            <Input label="Téléphone" value={form.phone} onChange={e => set('phone', e.target.value)} icon={<Phone className="w-4 h-4" />} />
            <Input label="Localisation" value={form.location} onChange={e => set('location', e.target.value)} icon={<MapPin className="w-4 h-4" />} />
            <Input label="Langue préférée" value={form.language} onChange={e => set('language', e.target.value)} />
            {!isVolunteer && (
              <Input label="Contact d'urgence" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
            )}
          </>
        ) : (
          <div className="space-y-4">
            {user?.bio && <p className="text-gray-600 leading-relaxed">{user.bio}</p>}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Mail, label: 'E-mail', value: user?.email },
                { icon: Phone, label: 'Téléphone', value: user?.phone },
                { icon: MapPin, label: 'Localisation', value: user?.location },
              ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interests */}
      <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Centres d'intérêt</h3>
        <div className="flex flex-wrap gap-2">
          {(editing ? INTERESTS : (user?.interests || [])).map(interest => (
            <button
              key={interest}
              onClick={editing ? () => toggleInterest(interest) : undefined}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                (!editing || form.interests.includes(interest))
                  ? 'bg-accent-light text-accent'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Availability (volunteers only) */}
      {isVolunteer && (
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Disponibilités</h3>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={editing ? () => toggleDay(day) : undefined}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  (editing ? form.availability : (user?.availability || [])).includes(day)
                    ? 'bg-success-light text-success'
                    : 'bg-gray-100 text-gray-500' + (editing ? ' hover:bg-gray-200' : '')
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emergency contact (elderly only) */}
      {!isVolunteer && user?.emergencyContact && (
        <div className="bg-error-light rounded-3xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Contact d'urgence</h3>
          <p className="text-gray-700">{user.emergencyContact}</p>
        </div>
      )}
    </div>
  );
}
