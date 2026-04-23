import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { Insights } from './pages/Insights';
import { AIAdvisor } from './pages/AIAdvisor';
import { SessionHistory } from './pages/SessionHistory';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-monitor" element={<LiveMonitor />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/history" element={<SessionHistory />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
