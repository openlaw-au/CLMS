import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from '../components/pages/LandingPage';
import SignUpPage from '../components/pages/SignUpPage';
import LoginPage from '../components/pages/LoginPage';
import ChambersLookupPage from '../components/pages/ChambersLookupPage';
import ForkPage from '../components/pages/ForkPage';
import WizardPage from '../components/pages/WizardPage';
import InvitePage from '../components/pages/InvitePage';
import SetupLoadingPage from '../components/pages/SetupLoadingPage';
import AppPage from '../components/pages/AppPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/onboarding/barrister/lookup" element={<ChambersLookupPage />} />
      <Route path="/onboarding/barrister/fork" element={<ForkPage />} />
      <Route path="/onboarding/barrister/setup" element={<SetupLoadingPage />} />
      <Route path="/onboarding/clerk/step-:step" element={<WizardPage />} />
      <Route path="/onboarding/clerk/invite" element={<InvitePage />} />

      <Route path="/onboarding/lookup" element={<ChambersLookupPage />} />
      <Route path="/onboarding/fork" element={<ForkPage />} />
      <Route path="/onboarding/setup" element={<WizardPage />} />
      <Route path="/onboarding/invite" element={<InvitePage />} />
      <Route path="/app/:section" element={<AppPage />} />
      <Route path="/app" element={<Navigate to="/app/search" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
