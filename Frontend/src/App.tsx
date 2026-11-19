import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import PatientQueuePage from '@/pages/reception/PatientQueuePage';
import PatientRegisterPage from '@/pages/reception/PatientRegisterPage';
import PatientDirectoryPage from '@/pages/masters/PatientDirectoryPage';
import DoctorWorkbenchPage from '@/pages/clinical/DoctorWorkbenchPage';
import BillingPOSPage from '@/pages/billing/BillingPOSPage';
import DashboardPage from '@/pages/reports/DashboardPage';
import PackagesPage from '@/pages/aesthetic/PackagesPage';
import FollowUpQueuePage from '@/pages/reception/FollowUpQueuePage';
import CollectionReportPage from '@/pages/reports/CollectionReportPage';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
});

export default function App() {
  // Keep-alive health check ping every 2 minutes (prevents Render instance from sleeping)
  useEffect(() => {
    const pingHealth = () => {
      const base = import.meta.env.VITE_API_URL || 'https://healh-software.onrender.com/api';
      const cleanBase = base.replace(/\/+$/, '');
      axios.get(`${cleanBase}/health`).catch(() => {});
    };
    pingHealth();
    const interval = setInterval(pingHealth, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/reception/queue" replace />} />
            <Route path="/reception/queue"           element={<PatientQueuePage />} />
            <Route path="/reception/register"        element={<PatientRegisterPage />} />
            <Route path="/reception/followups"       element={<FollowUpQueuePage />} />
            <Route path="/clinical/workbench"        element={<DoctorWorkbenchPage />} />
            <Route path="/clinical/workbench/:apptId" element={<DoctorWorkbenchPage />} />
            <Route path="/aesthetic/packages"        element={<PackagesPage />} />
            <Route path="/billing/pos"               element={<BillingPOSPage />} />
            <Route path="/billing/pos/:billId"       element={<BillingPOSPage />} />
            <Route path="/billing/ledger"            element={<DashboardPage />} />
            <Route path="/reports/dashboard"         element={<DashboardPage />} />
            <Route path="/reports/collection"        element={<CollectionReportPage />} />
            <Route path="/reports/billing"           element={<DashboardPage />} />
            <Route path="/masters/patients"          element={<PatientDirectoryPage />} />
            <Route path="/masters/doctors"           element={<DashboardPage />} />
            <Route path="/masters/medicines"         element={<DashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
