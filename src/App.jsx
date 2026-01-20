
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import Contacts from '@/pages/Clients';
import CalendarPage from '@/pages/Calendar';
import Analytics from '@/pages/Analytics';
import PrivateRoute from '@/components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Helmet>
          <title>SnapHouse - Real Estate Sales App</title>
          <meta name="description" content="Professional real estate sales application for managing properties, tracking clients, and growing your real estate business." />
        </Helmet>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/properties" element={<PrivateRoute><Properties /></PrivateRoute>} />
            <Route path="/contacts" element={<PrivateRoute><Contacts /></PrivateRoute>} />
            <Route path="/clients" element={<Navigate to="/contacts" replace />} />
            <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
