import { Outlet } from 'react-router-dom';
import { VolunteerSidebar } from './VolunteerSidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export function VolunteerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VolunteerSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-0" role="main">
          <Outlet />
        </main>
      </div>
      <BottomNav role="volunteer" />
    </div>
  );
}
