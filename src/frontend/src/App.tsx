import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import MyLifeDatabase from './pages/MyLifeDatabase';
import UserProfile from './pages/UserProfile';
import ScheduleView from './pages/ScheduleView';
import Layout from './components/layout/Layout';

// Create a client
const queryClient = new QueryClient();

import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-primary">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />


            {/* Protected Routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/database" element={<MyLifeDatabase />} />
              <Route path="/schedule" element={<ScheduleView />} />
              <Route path="/profile" element={<UserProfile />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
