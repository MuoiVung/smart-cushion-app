import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';

// Stub components for other pages
const Insights = () => <div className="p-12">Insights Page (Porting in progress...)</div>;
const AIAdvisor = () => <div className="p-12">AI Advisor Page (Porting in progress...)</div>;
const SessionHistory = () => <div className="p-12">Session History Page (Porting in progress...)</div>;
const Settings = () => <div className="p-12">Settings Page (Porting in progress...)</div>;

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
