import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect } from 'react';
import Layout from './Layout';

const Workspace = lazy(() => import('./Pages/Workspace'));
const PageView = lazy(() => import('./Pages/PageView'));
const FormView = lazy(() => import('./Pages/FormView'));
const PublicSite = lazy(() => import('./Pages/PublicSite'));
const Dashboard = lazy(() => import('./Pages/Dashboard'));
const Tasks = lazy(() => import('./Pages/Tasks'));
const Habits = lazy(() => import('./Pages/Habits'));
const Assistant = lazy(() => import('./Pages/Assistant'));
const MoodHistory = lazy(() => import('./Pages/MoodHistory'));
const Focus = lazy(() => import('./Pages/Focus'));
const Journal = lazy(() => import('./Pages/Journal'));
const Calendar = lazy(() => import('./Pages/Calendar'));
const Kanban = lazy(() => import('./Pages/Kanban'));
const Settings = lazy(() => import('./Pages/Settings'));

const queryClient = new QueryClient();

function AppFallback() {
  return (
    <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 text-sm text-slate-500 shadow-xl shadow-slate-200/60">
      Loading workspace surface...
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isStandaloneSurface =
    location.pathname.startsWith('/forms/') || location.pathname.startsWith('/site/');

  const routes = (
    <Suspense fallback={<AppFallback />}>
      <Routes>
        <Route path="/" element={<Workspace />} />
        <Route path="/pages/:pageId" element={<PageView />} />
        <Route path="/forms/:formId" element={<FormView />} />
        <Route path="/site/:pageId" element={<PublicSite />} />
        <Route path="/personal" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/mood" element={<MoodHistory />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );

  if (isStandaloneSurface) {
    return routes;
  }

  return <Layout>{routes}</Layout>;
}

function App() {
  // Global Notification Request on mount (optional, but good practice for "Always On" feel)
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
