import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Matches from '@/pages/Matches';
import MatchDetail from '@/pages/MatchDetail';
import Simulator from '@/pages/Simulator';
import Players from '@/pages/Players';
import PlayerProfile from '@/pages/PlayerProfile';
import WarRoom from '@/pages/WarRoom';
import Drills from '@/pages/Drills';
import Compare from '@/pages/Compare';
import PublicPlayerReport from '@/pages/PublicPlayerReport';
import ProductDemo from '@/pages/ProductDemo';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:number" element={<PlayerProfile />} />
        <Route path="/war-room" element={<WarRoom />} />
        <Route path="/drills" element={<Drills />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/simulator" element={<Simulator />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const PublicApp = () => {
  return (
    <Routes>
      <Route path="/report/:token" element={<PublicPlayerReport />} />
      <Route path="/demo" element={<ProductDemo />} />
      <Route path="*" element={<AuthenticatedApp />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <PublicApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App