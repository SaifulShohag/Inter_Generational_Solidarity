import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { volunteerStats } from '../../data/mockData';
import { Card } from '../../components/ui/Card';

function HeatmapGrid() {
  const data = volunteerStats.heatmapData;
  const weeks: Array<typeof data> = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-accent/20';
    if (count === 2) return 'bg-accent/50';
    return 'bg-accent';
  };

  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
  const days = ['','Lun','','Mer','','Ven',''];

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {months.map(m => <div key={m} className="flex-1 text-xs text-gray-400 text-center">{m}</div>)}
      </div>
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 mr-1">
          {days.map((d, i) => <div key={i} className="text-xs text-gray-400 h-3 leading-3">{d}</div>)}
        </div>
        <div className="flex gap-0.5 flex-1 overflow-hidden">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 flex-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`${getColor(day.count)} rounded-sm w-full aspect-square min-h-[10px]`}
                  title={`${day.date} : ${day.count} mission(s)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-xs text-gray-400">Moins</span>
        {[0, 1, 2, 3].map(n => (
          <div key={n} className={`${getColor(n)} w-3 h-3 rounded-sm`} />
        ))}
        <span className="text-xs text-gray-400">Plus</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name} : {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function Statistics() {
  const stats = volunteerStats;

  return (
    <div className="p-6 animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-500 mt-1">Votre parcours bénévole en un coup d'œil</p>
      </div>

      {/* Carte de chaleur */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Carte d'activité</h2>
        <HeatmapGrid />
      </Card>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Missions par mois</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="missions" name="Missions" fill="#4F8EF7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Heures bénévoles</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="hours" name="Heures" stroke="#4CAF7D" strokeWidth={2.5} dot={{ r: 4, fill: '#4CAF7D' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Types de missions + hebdomadaire */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Types de missions</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.categoryBreakdown}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props: { category?: string; percent?: number }) =>
                  `${props.category ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {stats.categoryBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Missions hebdomadaires</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weeklyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="week" tick={{ fontSize: 11 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="missions" name="Missions" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
