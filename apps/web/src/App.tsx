import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { WeddingWebsitesPage } from './pages/websites/WeddingWebsitesPage';
import { ChecklistPage } from './pages/checklist/ChecklistPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { WeddingsListPage } from './pages/organizer/WeddingsListPage';
import { DashboardPage } from './pages/organizer/DashboardPage';
import { GuestsPage } from './pages/organizer/GuestsPage';
import { EventsPage } from './pages/organizer/EventsPage';
import { SendQueuePage } from './pages/organizer/SendQueuePage';
import { TemplatesPage } from './pages/organizer/TemplatesPage';
import { SettingsPage } from './pages/organizer/SettingsPage';
import { PublicRsvpPage } from './pages/guest/PublicRsvpPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Route Guard component for organizer protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* The Knot-Inspired Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/wedding-websites" element={<WeddingWebsitesPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public Guest RSVP Route (Token-based) */}
            <Route path="/r/:token" element={<PublicRsvpPage />} />

            {/* Protected Organizer Routes */}
            <Route
              path="/weddings"
              element={
                <ProtectedRoute>
                  <WeddingsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weddings/:weddingId"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weddings/:weddingId/guests"
              element={
                <ProtectedRoute>
                  <GuestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weddings/:weddingId/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weddings/:weddingId/messages"
              element={
                <ProtectedRoute>
                  <SendQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weddings/:weddingId/templates"
              element={
                <ProtectedRoute>
                  <TemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
