import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Auth
import { RoleSelection } from './pages/auth/RoleSelection';
import { Login } from './pages/auth/Login';

// Layouts
import { VolunteerLayout } from './components/layout/VolunteerLayout';
import { ElderlyLayout } from './components/layout/ElderlyLayout';

// Volunteer pages
import { VolunteerDashboard } from './pages/volunteer/Dashboard';
import { Missions } from './pages/volunteer/Missions';
import { MissionDetail } from './pages/volunteer/MissionDetail';
import { History } from './pages/volunteer/History';
import { Statistics } from './pages/volunteer/Statistics';
import { Notifications } from './pages/volunteer/Notifications';

// Elderly pages
import { ElderlyHome } from './pages/elderly/ElderlyHome';
import { Chat } from './pages/elderly/Chat';
import { Voice } from './pages/elderly/Voice';
import { HelpHistory } from './pages/elderly/HelpHistory';

// Shared pages
import { Profile } from './pages/shared/Profile';
import { Settings } from './pages/shared/Settings';

function ProtectedVolunteer() {
  const { isAuthenticated, role } = useApp();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role !== 'volunteer') return <Navigate to="/elderly" replace />;
  return <VolunteerLayout />;
}

function ProtectedElderly() {
  const { isAuthenticated, role } = useApp();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role !== 'elderly') return <Navigate to="/volunteer" replace />;
  return <ElderlyLayout />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<RoleSelection />} />
      <Route path="/auth/login" element={<Login />} />

      {/* Volunteer */}
      <Route path="/volunteer" element={<ProtectedVolunteer />}>
        <Route index element={<VolunteerDashboard />} />
        <Route path="missions" element={<Missions />} />
        <Route path="missions/:id" element={<MissionDetail />} />
        <Route path="history" element={<History />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Elderly */}
      <Route path="/elderly" element={<ProtectedElderly />}>
        <Route index element={<ElderlyHome />} />
        <Route path="chat" element={<Chat />} />
        <Route path="voice" element={<Voice />} />
        <Route path="history" element={<HelpHistory />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
