import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { Insights } from './pages/Insights';
import { SessionHistory } from './pages/SessionHistory';
import { Passport } from './pages/Passport';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

import { WebSocketProvider } from './hooks/useWebSocket';
import { GamificationProvider } from './lib/gamification';
import { AuthProvider, useAuth } from './context/AuthContext';

import { GachaPage } from './pages/GachaPage';
import { CollectionPage } from './pages/CollectionPage';
import { LegacyDashboard } from './pages/LegacyDashboard';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      
      <Route path="/legacy-demo" element={<ProtectedRoute allowDemo={true}><LegacyDashboard /></ProtectedRoute>} />

      <Route path="/*" element={
        <ProtectedRoute allowDemo={true}>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/live-monitor" replace />} />
              <Route path="/live-monitor" element={<LiveMonitor />} />
              
              {/* Only full users can see these */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
              <Route path="/gacha" element={<ProtectedRoute><GachaPage /></ProtectedRoute>} />
              <Route path="/collection" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
              <Route path="/passport" element={<ProtectedRoute><Passport /></ProtectedRoute>} />
            </Routes>
          </MainLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <GamificationProvider>
          <Router>
            <AppContent />
          </Router>
        </GamificationProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
