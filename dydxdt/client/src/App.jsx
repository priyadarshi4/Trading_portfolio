import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

import Layout          from './components/layout/Layout';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import Dashboard       from './pages/Dashboard';
import TradesPage      from './pages/TradesPage';
import AddTrade        from './pages/AddTrade';
import EditTrade       from './pages/EditTrade';
import AnalyticsPage   from './pages/AnalyticsPage';
import EquityPage      from './pages/EquityPage';
import JournalPage     from './pages/JournalPage';
import StrategiesPage  from './pages/StrategiesPage';
import RiskPage        from './pages/RiskPage';
import CalendarPage    from './pages/CalendarPage';
import SettingsPage    from './pages/SettingsPage';
import ReportsPage     from './pages/ReportsPage';
import StatsPage       from './pages/StatsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const { initAuth } = useAuthStore();
  useEffect(() => { initAuth(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/trades"          element={<TradesPage />} />
          <Route path="/trades/add"      element={<AddTrade />} />
          <Route path="/trades/:id/edit" element={<EditTrade />} />
          <Route path="/analytics"       element={<AnalyticsPage />} />
          <Route path="/equity"          element={<EquityPage />} />
          <Route path="/journal"         element={<JournalPage />} />
          <Route path="/strategies"      element={<StrategiesPage />} />
          <Route path="/risk"            element={<RiskPage />} />
          <Route path="/calendar"        element={<CalendarPage />} />
          <Route path="/reports"         element={<ReportsPage />} />
          <Route path="/stats"           element={<StatsPage />} />
          <Route path="/settings"        element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
