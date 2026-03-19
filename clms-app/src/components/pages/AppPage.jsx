import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import AppShell from '../organisms/AppShell';
import { useAppContext } from '../../context/AppContext';

import BarristerDashboardPage from './app/BarristerDashboardPage';
import BarristerListsPage from './app/BarristerListsPage';
import BarristerLoansPage from './app/BarristerLoansPage';
import ClerkDashboardPage from './app/ClerkDashboardPage';
import ClerkCataloguePage from './app/ClerkCataloguePage';
import ClerkLoansPage from './app/ClerkLoansPage';
import ClerkAuthoritiesPage from './app/ClerkAuthoritiesPage';
import ClerkChambersPage from './app/ClerkChambersPage';
import ClerkReportsPage from './app/ClerkReportsPage';
import SettingsPage from './app/SettingsPage';

const BARRISTER_PAGES = {
  dashboard: BarristerDashboardPage,
  authorities: BarristerListsPage,
  lists: BarristerListsPage,
  loans: BarristerLoansPage,
  settings: SettingsPage,
};

const CLERK_PAGES = {
  dashboard: ClerkDashboardPage,
  catalogue: ClerkCataloguePage,
  library: ClerkCataloguePage,
  loans: ClerkLoansPage,
  authorities: ClerkAuthoritiesPage,
  lists: ClerkAuthoritiesPage,
  chambers: ClerkChambersPage,
  members: ClerkChambersPage,
  locations: ClerkChambersPage,
  insights: ClerkReportsPage,
  reports: ClerkReportsPage,
  settings: SettingsPage,
};

export default function AppPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { role, setRole, onboarding, markCelebrationShown } = useAppContext();
  const firstVisit = onboarding.firstVisit !== false;
  const celebrationShown = onboarding.celebrationShown === true;

  const roleParam = searchParams.get('role');

  useEffect(() => {
    if (roleParam === 'barrister' || roleParam === 'clerk') {
      setRole(roleParam);
    }
  }, [roleParam, setRole]);

  useEffect(() => {
    if (!firstVisit || celebrationShown || !onboarding.name) return undefined;
    markCelebrationShown();

    const shoot = () => {
      confetti({ particleCount: 44, spread: 145, startVelocity: 56, gravity: 0.95, scalar: 1.12, origin: { x: 0.5, y: 0.56 } });
      confetti({ particleCount: 34, angle: 70, spread: 95, startVelocity: 58, gravity: 1, scalar: 1.08, origin: { x: 0.42, y: 0.62 } });
      confetti({ particleCount: 34, angle: 110, spread: 95, startVelocity: 58, gravity: 1, scalar: 1.08, origin: { x: 0.58, y: 0.62 } });
      confetti({ particleCount: 26, spread: 360, startVelocity: 40, ticks: 170, scalar: 1.02, origin: { x: 0.5, y: 0.54 } });
    };

    shoot();
    const intervalId = window.setInterval(shoot, 140);
    const stopId = window.setTimeout(() => window.clearInterval(intervalId), 1800);
    return () => { window.clearTimeout(stopId); window.clearInterval(intervalId); };
  }, [celebrationShown, firstVisit, markCelebrationShown]);

  const activeRole = roleParam === 'barrister' || roleParam === 'clerk' ? roleParam : role;
  const pages = activeRole === 'clerk' ? CLERK_PAGES : BARRISTER_PAGES;
  const defaultSection = 'dashboard';
  const section = params.section || defaultSection;
  const PageComponent = pages[section] || pages[defaultSection];

  return (
    <AppShell role={activeRole}>
      <PageComponent />
    </AppShell>
  );
}
