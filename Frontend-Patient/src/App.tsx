import React, { useState } from 'react';
import { getPatientToken, setPatientToken } from '@/api/client';
import LoginPage from '@/pages/LoginPage';
import PatientPortalDashboard from '@/pages/PatientPortalDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getPatientToken()));

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setPatientToken(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans">
      {!isAuthenticated ? (
        <LoginPage onSuccess={handleLoginSuccess} />
      ) : (
        <PatientPortalDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}
