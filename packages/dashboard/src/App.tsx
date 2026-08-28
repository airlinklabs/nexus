import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { LoginPage } from './pages/LoginPage.js';
import { GuildListPage } from './pages/GuildListPage.js';
import { GuildDetailPage } from './pages/GuildDetailPage.js';
import { InteractionLogPage } from './pages/InteractionLogPage.js';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<GuildListPage />} />
          <Route path="/dashboard/:guildId" element={<GuildDetailPage />} />
          <Route
            path="/dashboard/:guildId/log"
            element={<InteractionLogPage />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
