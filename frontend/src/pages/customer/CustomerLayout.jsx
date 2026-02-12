import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const ICON_DASH = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const ICON_CHAT = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const ICON_STAR = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;

const links = [
  { path: '/customer/dashboard', label: 'Dashboard', icon: ICON_DASH },
  { path: '/customer/chat', label: 'Chat Support', icon: ICON_CHAT },
  { path: '/customer/feedback', label: 'Provide Feedback', icon: ICON_STAR },
];

export default function CustomerLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar links={links} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
